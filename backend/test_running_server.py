import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import time
import json
import wave
import io
import urllib.request
import urllib.error
import urllib.parse

BASE_URL = "http://127.0.0.1:8000"
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_output_samples")
os.makedirs(OUT_DIR, exist_ok=True)

test_results = {
    "passed": 0,
    "failed": 0,
    "details": []
}

def record_test(name, success, details=None):
    if success:
        test_results["passed"] += 1
        print(f"  [PASS] {name}")
    else:
        test_results["failed"] += 1
        print(f"  [FAIL] {name} - Details: {details}")
    test_results["details"].append({"name": name, "success": success, "details": details})

def http_request(path, method="GET", json_data=None, raw_body=None, content_type="application/json"):
    url = f"{BASE_URL}{path}"
    headers = {}
    body = None
    if content_type:
        headers["Content-Type"] = content_type

    if json_data is not None:
        body = json.dumps(json_data).encode("utf-8")
    elif raw_body is not None:
        body = raw_body

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return {
                "status": resp.status,
                "headers": dict(resp.headers),
                "content": resp.read(),
                "error": None
            }
    except urllib.error.HTTPError as e:
        return {
            "status": e.code,
            "headers": dict(e.headers),
            "content": e.read(),
            "error": str(e)
        }
    except Exception as e:
        return {
            "status": 0,
            "headers": {},
            "content": b"",
            "error": str(e)
        }

def inspect_wav(wav_bytes):
    if not wav_bytes.startswith(b"RIFF"):
        return False, "Not RIFF format", {}
    try:
        with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
            channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            nframes = wf.getnframes()
            duration = nframes / float(framerate)
            info = {
                "channels": channels,
                "bit_depth": sampwidth * 8,
                "sample_rate": framerate,
                "frames": nframes,
                "duration_sec": round(duration, 3)
            }
            if channels != 1:
                return False, f"Expected 1 channel, got {channels}", info
            if sampwidth != 2:
                return False, f"Expected 16-bit PCM (2 bytes), got {sampwidth}", info
            if nframes <= 0 or duration <= 0:
                return False, "Audio has 0 frames", info
            return True, "Valid 16-bit PCM WAV", info
    except Exception as e:
        return False, f"Wave parser error: {e}", {}

print("=" * 70)
print(f"RUNNING EXTENSIVE LIVE TTS TEST SUITE AGAINST {BASE_URL}")
print("=" * 70)

# 1. Health check
print("\n--- SECTION 1: SYSTEM HEALTH & METADATA ---")
res = http_request("/api/health")
is_healthy = res["status"] == 200 and b"ok" in res["content"].lower()
record_test("GET /api/health returns 200 OK", is_healthy, res["content"][:100].decode("utf-8", errors="replace"))

# 2. Language list
res = http_request("/tts/languages")
langs_ok = False
langs_data = {}
if res["status"] == 200:
    try:
        langs_data = json.loads(res["content"].decode("utf-8"))
        langs_ok = "supported_languages" in langs_data and len(langs_data["supported_languages"]) >= 8
    except Exception as e:
        pass
record_test("GET /tts/languages returns supported languages dictionary", langs_ok, f"Total entries: {len(langs_data.get('supported_languages', {}))}")

# 3. All Verified Languages Synthesis
print("\n--- SECTION 2: SYNTHESIS ACROSS ALL VERIFIED LANGUAGES ---")
LANGUAGE_TESTS = [
    {"code": "en", "name": "English", "text": "Good morning Ramesh, it is time for breakfast and morning tea."},
    {"code": "eng", "name": "English (alias)", "text": "Take your time, everything is peaceful."},
    {"code": "as", "name": "Assamese", "text": "নমস্কাৰ দেউতা, মই আপোনাৰ সুনীতা। চাহ খাব নে?"},
    {"code": "asm", "name": "Assamese (alias)", "text": "আপুনি কেনে অনুভৱ কৰিছে?"},
    {"code": "bn", "name": "Bengali", "text": "নমস্কার রমেশবাবু, আপনার সকালের চা তৈরি আছে।"},
    {"code": "ben", "name": "Bengali (alias)", "text": "আমরা সবাই আপনার সাথে আছি।"},
    {"code": "ne", "name": "Nepali", "text": "नमस्ते रमेश, तपाईंलाई आज कस्तो छ? बगैंचामा जाऔं।"},
    {"code": "nep", "name": "Nepali (alias)", "text": "आजको दिन निकै राम्रो छ।"},
    {"code": "miz", "name": "Mizo (Meta MMS)", "text": "Chibai, i dam em? Vawiin chu ni tha tak a ni."},
    {"code": "lus", "name": "Mizo (NE-TTS)", "text": "chibai ka thian tha tak i ni e"},
    {"code": "njz", "name": "Nyishi", "text": "building agu pute jabu kongpo pa"},
    {"code": "trp", "name": "Kokborok", "text": "ani bwskango kaisa mampli tongo aw mampli o nugjago"}
]

for test_item in LANGUAGE_TESTS:
    code = test_item["code"]
    name = test_item["name"]
    text = test_item["text"]
    
    t0 = time.time()
    res = http_request("/tts", method="POST", json_data={"text": text, "language": code})
    latency = round(time.time() - t0, 3)
    
    if res["status"] != 200:
        record_test(f"POST /tts [{name} ({code})]", False, f"Status {res['status']}: {res['content'].decode('utf-8', errors='replace')}")
        continue

    content_type = res["headers"].get("content-type", "")
    is_wav_mime = "audio/wav" in content_type.lower()
    is_valid, reason, info = inspect_wav(res["content"])
    
    success = is_wav_mime and is_valid
    details_str = f"Status 200, Content-Type: {content_type}, Latency: {latency}s, Duration: {info.get('duration_sec')}s, SampleRate: {info.get('sample_rate')}Hz, Bytes: {len(res['content'])}"
    record_test(f"POST /tts [{name} ({code})]", success, details_str)

# 4. Model Reuse / Caching Performance Verification
print("\n--- SECTION 3: MODEL CACHING & REUSE (ZERO RELOAD OVERHEAD) ---")
REUSE_TESTS = [
    {"code": "en", "name": "English MMS", "text": "This is a second test for cache reuse."},
    {"code": "ne", "name": "Nepali Piper", "text": "दोस्रो पटकको परीक्षण सफल भयो।"},
    {"code": "trp", "name": "Kokborok NE-TTS", "text": "mampli o nugjago"}
]

for item in REUSE_TESTS:
    code = item["code"]
    name = item["name"]
    text = item["text"]
    
    t0 = time.time()
    res = http_request("/tts", method="POST", json_data={"text": text, "language": code})
    latency = round(time.time() - t0, 3)
    
    success = res["status"] == 200 and latency < 3.0
    record_test(f"Model Caching [{name}] (sub-3s on CPU)", success, f"Latency: {latency}s, Status: {res['status']}")

# 5. Edge Cases and Error Responses
print("\n--- SECTION 4: EDGE CASES & ROBUST ERROR HANDLING ---")

# A. Empty text
res = http_request("/tts", method="POST", json_data={"text": "", "language": "en"})
record_test("Empty text returns 400 Bad Request", res["status"] == 400, f"Got status {res['status']}")

# B. Whitespace text
res = http_request("/tts", method="POST", json_data={"text": "   \n\t  ", "language": "en"})
record_test("Whitespace text returns 400 Bad Request", res["status"] == 400, f"Got status {res['status']}")

# C. Missing text property
res = http_request("/tts", method="POST", json_data={"language": "en"})
record_test("Missing 'text' field returns 422 Unprocessable Entity", res["status"] == 422, f"Got status {res['status']}")

# D. Missing language property
res = http_request("/tts", method="POST", json_data={"text": "Hello"})
record_test("Missing 'language' field returns 422 Unprocessable Entity", res["status"] == 422, f"Got status {res['status']}")

# E. Invalid JSON payload
res = http_request("/tts", method="POST", raw_body=b"{invalid: json:", content_type="application/json")
record_test("Invalid JSON payload returns 422 Unprocessable Entity", res["status"] == 422, f"Got status {res['status']}")

# F. Unsupported language (e.g. French 'fr')
res = http_request("/tts", method="POST", json_data={"text": "Bonjour", "language": "fr"})
is_unsupported_ok = res["status"] == 400 and b"unsupported language" in res["content"].lower()
record_test("Unsupported language 'fr' returns 400 with helpful error", is_unsupported_ok, f"Status {res['status']}, Message: {res['content'].decode('utf-8', errors='replace')}")

# G. Explicitly unavailable language: Khasi ('kha')
res = http_request("/tts", method="POST", json_data={"text": "Khublei", "language": "kha"})
is_khasi_rejected = res["status"] == 400 and b"unsupported language" in res["content"].lower()
record_test("Unavailable language 'kha' returns 400 with helpful error", is_khasi_rejected, f"Status {res['status']}, Message: {res['content'].decode('utf-8', errors='replace')}")

# H. Case insensitivity and whitespace stripping
res = http_request("/tts", method="POST", json_data={"text": "Good morning", "language": "  EN  "})
record_test("Language case-insensitivity ('  EN  ') returns 200 OK", res["status"] == 200, f"Status {res['status']}")

# I. Very short text
res = http_request("/tts", method="POST", json_data={"text": "Tea", "language": "en"})
is_valid, _, info = inspect_wav(res["content"]) if res["status"] == 200 else (False, "", {})
record_test("Single-word short text ('Tea') synthesizes valid audio", res["status"] == 200 and is_valid, f"Duration: {info.get('duration_sec')}s")

# J. Longer guidance utterance
guidance_text = (
    "Good morning Ramesh. Today is Monday, and the weather is very pleasant outside. "
    "Your daughter Sunita will visit you this afternoon with some fresh flowers. "
    "Let us take your morning medicines and have a relaxing warm cup of tea."
)
t0 = time.time()
res = http_request("/tts", method="POST", json_data={"text": guidance_text, "language": "en"})
long_latency = round(time.time() - t0, 3)
is_valid, _, info = inspect_wav(res["content"]) if res["status"] == 200 else (False, "", {})
record_test("Long multi-sentence caregiver prompt synthesizes valid audio", res["status"] == 200 and is_valid and info.get("duration_sec", 0) > 5.0, f"Duration: {info.get('duration_sec')}s, Latency: {long_latency}s")

# 6. Legacy Endpoint Verification
print("\n--- SECTION 5: BACKWARD COMPATIBILITY (GET /api/tts) ---")
res = http_request("/api/tts?text=Good+morning+Ramesh&lang=en")
is_valid, _, info = inspect_wav(res["content"]) if res["status"] == 200 else (False, "", {})
record_test("GET /api/tts with valid parameters returns 200 audio/wav", res["status"] == 200 and is_valid, f"Status: {res['status']}, Duration: {info.get('duration_sec')}s")

res = http_request("/api/tts?text=&lang=en")
record_test("GET /api/tts with empty text returns 400 Bad Request", res["status"] == 400, f"Status: {res['status']}")

res = http_request("/api/tts?text=Hello&lang=invalid_lang")
record_test("GET /api/tts with unsupported lang returns 404 Not Found", res["status"] == 404, f"Status: {res['status']}")

print("\n" + "=" * 70)
print(f"TEST RUN COMPLETED: {test_results['passed']} PASSED, {test_results['failed']} FAILED (TOTAL: {test_results['passed'] + test_results['failed']})")
print("=" * 70)

summary_json_path = os.path.join(OUT_DIR, "running_server_test_results.json")
with open(summary_json_path, "w", encoding="utf-8") as f:
    json.dump(test_results, f, indent=2, ensure_ascii=False)
print(f"Detailed results written to: {summary_json_path}")

sys.exit(0 if test_results["failed"] == 0 else 1)
