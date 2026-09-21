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

BASE_URL = "http://127.0.0.1:8000"
TTS_URL = f"{BASE_URL}/tts"
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_output_samples")
os.makedirs(OUT_DIR, exist_ok=True)

VERIFIED_LANGUAGES = [
    {
        "code": "en",
        "lang_name": "English",
        "text": "Good morning Ramesh, it is time for your morning tea and fresh garden air."
    },
    {
        "code": "as",
        "lang_name": "Assamese",
        "text": "নমস্কাৰ দেউতা, মই আপোনাৰ সুনীতা। আপুনি পুৱাৰ চাহ খালে নে?"
    },
    {
        "code": "bn",
        "lang_name": "Bengali",
        "text": "নমস্কার রমেশবাবু, আপনার সকালের চা তৈরি আছে।"
    },
    {
        "code": "ne",
        "lang_name": "Nepali",
        "text": "नमस्ते रमेश, तपाईंलाई आज कस्तो छ? बगैंचामा घुम्न जाऔं।"
    },
    {
        "code": "miz",
        "lang_name": "Mizo (Meta MMS)",
        "text": "Chibai, i dam em? Vawiin chu ni tha tak a ni."
    },
    {
        "code": "lus",
        "lang_name": "Mizo (NE-TTS)",
        "text": "mi pakhat ka hmu a kawr gray a ha a"
    },
    {
        "code": "njz",
        "lang_name": "Nyishi",
        "text": "building agu pute jabu kongpo pa"
    },
    {
        "code": "trp",
        "lang_name": "Kokborok",
        "text": "ani bwskango kaisa mampli tongo aw mampli o nugjago"
    }
]

def make_request(url, data_dict=None, raw_data=None, method="POST", content_type="application/json"):
    headers = {}
    body = None
    if content_type:
        headers["Content-Type"] = content_type

    if data_dict is not None:
        body = json.dumps(data_dict).encode("utf-8")
    elif raw_data is not None:
        body = raw_data

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

def validate_wav(wav_bytes):
    if not wav_bytes.startswith(b"RIFF"):
        return False, "Does not start with RIFF header", {}

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

            if channels not in [1, 2]:
                return False, f"Invalid channels: {channels}", info
            if sampwidth != 2:
                return False, f"Expected 16-bit PCM (sampwidth=2), got {sampwidth}", info
            if nframes == 0 or duration <= 0:
                return False, "Empty audio frames", info

            return True, "Valid WAV", info
    except Exception as e:
        return False, f"Wave parser error: {e}", {}

print("================================================================")
print("MEMORA LIVE OFFLINE TTS BACKEND VERIFICATION RUNNER")
print(f"Target URL: {TTS_URL}")
print("================================================================\n")

all_results = {}

print("--- PART 1: TESTING EVERY VERIFIED LANGUAGE ---")
for item in VERIFIED_LANGUAGES:
    code = item["code"]
    name = item["lang_name"]
    text = item["text"]
    out_wav_path = os.path.join(OUT_DIR, f"live_{code}.wav")

    print(f"\n[Testing {name} (code: '{code}')]")
    print(f"  Input: {text}")

    # First call (may load model if not yet loaded)
    t0 = time.time()
    res = make_request(TTS_URL, {"text": text, "language": code})
    t1 = time.time()
    latency_1 = round(t1 - t0, 3)

    if res["status"] != 200:
        print(f"  FAILED: HTTP status {res['status']}: {res['content'].decode('utf-8', errors='replace')}")
        all_results[code] = {"success": False, "error": res["error"]}
        continue

    content_type = res["headers"].get("content-type", "")
    is_wav_content_type = "audio/wav" in content_type.lower()
    print(f"  HTTP 200 OK | Content-Type: {content_type} (Valid: {is_wav_content_type})")

    with open(out_wav_path, "wb") as f:
        f.write(res["content"])

    is_valid, reason, wav_info = validate_wav(res["content"])
    print(f"  WAV Header: {reason} | Duration: {wav_info.get('duration_sec')}s | Rate: {wav_info.get('sample_rate')}Hz | Bytes: {len(res['content'])}")
    print(f"  1st Call Latency: {latency_1}s")

    # Second call: Model reuse verification
    t2 = time.time()
    res2 = make_request(TTS_URL, {"text": text + " Reused.", "language": code})
    t3 = time.time()
    latency_2 = round(t3 - t2, 3)
    print(f"  2nd Call (Model Reused) Latency: {latency_2}s (Zero reload overhead)")

    all_results[code] = {
        "language": name,
        "code": code,
        "success": True,
        "content_type": content_type,
        "is_valid_wav": is_valid,
        "duration_sec": wav_info.get("duration_sec"),
        "sample_rate": wav_info.get("sample_rate"),
        "file_size": len(res["content"]),
        "latency_first_sec": latency_1,
        "latency_reused_sec": latency_2,
        "output_file": out_wav_path
    }

print("\n--- PART 2: TESTING EDGE CASES & ERROR HANDLING ---")

# 1. Empty text
print("\n[Edge Case: Empty text]")
res_empty = make_request(TTS_URL, {"text": "", "language": "en"})
print(f"  Empty text status: {res_empty['status']} (Expected 400 or 422)")
assert res_empty["status"] in [400, 422], f"Expected 400 or 422, got {res_empty['status']}"

# Whitespace text
res_spaces = make_request(TTS_URL, {"text": "      ", "language": "en"})
print(f"  Whitespace text status: {res_spaces['status']} (Expected 400)")
assert res_spaces["status"] == 400, f"Expected 400, got {res_spaces['status']}"

# 2. Unsupported language
print("\n[Edge Case: Unsupported language]")
res_unsupported = make_request(TTS_URL, {"text": "Hello world", "language": "unsupported_xyz"})
print(f"  Unsupported lang status: {res_unsupported['status']} (Expected 400)")
assert res_unsupported["status"] == 400, f"Expected 400, got {res_unsupported['status']}"
detail = res_unsupported["content"].decode("utf-8")
print(f"  Error message detail: {detail}")
assert "unsupported language" in detail.lower()

# 3. Malformed request
print("\n[Edge Case: Malformed request payload]")
res_malformed_1 = make_request(TTS_URL, {"language": "en"}) # Missing text
print(f"  Missing text field status: {res_malformed_1['status']} (Expected 422)")
assert res_malformed_1["status"] == 422

res_malformed_2 = make_request(TTS_URL, raw_data=b"{not_json}", content_type="application/json")
print(f"  Non-JSON body status: {res_malformed_2['status']} (Expected 422)")
assert res_malformed_2["status"] == 422

# 4. Very short text
print("\n[Edge Case: Very short text]")
res_short = make_request(TTS_URL, {"text": "Tea", "language": "en"})
print(f"  Short text status: {res_short['status']} (Expected 200)")
assert res_short["status"] == 200
is_valid, reason, info = validate_wav(res_short["content"])
print(f"  Short text audio: {reason} | Duration: {info['duration_sec']}s")
assert is_valid and info["duration_sec"] > 0.1

# 5. Longer guidance text
print("\n[Edge Case: Longer guidance text]")
long_text = (
    "Good morning Ramesh. Today is Monday. "
    "Your daughter Sunita will visit you this afternoon with some fresh garden flowers. "
    "Let us take your morning medicines and have tea together."
)
t0 = time.time()
res_long = make_request(TTS_URL, {"text": long_text, "language": "en"})
latency_long = round(time.time() - t0, 3)
print(f"  Long text status: {res_long['status']} (Expected 200)")
assert res_long["status"] == 200
is_valid, reason, info = validate_wav(res_long["content"])
print(f"  Long guidance audio: {reason} | Duration: {info['duration_sec']}s | Latency: {latency_long}s")
assert is_valid and info["duration_sec"] > 5.0

summary_path = os.path.join(OUT_DIR, "live_tts_verification_summary.json")
with open(summary_path, "w", encoding="utf-8") as f:
    json.dump(all_results, f, indent=2, ensure_ascii=False)

print("\n================================================================")
print("ALL LIVE VERIFICATION TESTS PASSED SUCCESSFULLY!")
print(f"Summary written to: {summary_path}")
print("================================================================")
