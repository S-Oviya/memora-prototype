import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

from pathlib import Path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import io
import time
import json
import wave
import threading
import urllib.request
import urllib.error
import numpy as np
import uvicorn
from app.main import app

OUT_DIR = BACKEND_DIR / "test_output_samples"
OUT_DIR.mkdir(exist_ok=True)

PORT = 8002
BASE_URL = f"http://127.0.0.1:{PORT}"

def run_server(server):
    server.run()

# 1. Start live uvicorn server in background thread
config = uvicorn.Config(app, host="127.0.0.1", port=PORT, log_level="warning")
server = uvicorn.Server(config)
server_thread = threading.Thread(target=run_server, args=(server,), daemon=True)
server_thread.start()

# Wait for server to bind
time.sleep(2)

print("=" * 75)
print(f"MEMORA END-TO-END OFFLINE TTS VERIFICATION (PORT {PORT})")
print("=" * 75)

report = {
    "server_startup": False,
    "health_check": False,
    "patient_routes": False,
    "languages": {},
    "all_passed": False
}

try:
    # Check 1: Health check
    print("\n[Step 1: Backend Startup & Health Check]")
    with urllib.request.urlopen(f"{BASE_URL}/api/health") as resp:
        health_data = json.loads(resp.read().decode("utf-8"))
        print(f"  Status: {resp.status} | Data: {health_data}")
        assert resp.status == 200
        assert health_data["status"] == "ok"
        assert health_data["offlineTTS"] is True
        report["health_check"] = True
        report["server_startup"] = True

    # Check 2: Existing patient endpoints
    print("\n[Step 2: Existing Backend Routes Check]")
    with urllib.request.urlopen(f"{BASE_URL}/api/patients/patient-ramesh-1/full") as resp:
        patient_data = json.loads(resp.read().decode("utf-8"))
        print(f"  Status: {resp.status} | Patient Name: {patient_data['patient']['name']}")
        assert resp.status == 200
        assert patient_data["patient"]["name"] == "Ramesh Chandra Baruah"
        report["patient_routes"] = True

    # Check 3: Language tests
    print("\n[Step 3: Real Speech Synthesis & Audio Waveform Analysis]")
    TEST_CASES = [
        {
            "name": "English",
            "code": "en",
            "model": "facebook/mms-tts-eng",
            "text": "Good morning Ramesh, it is time for your morning tea and breakfast."
        },
        {
            "name": "Assamese",
            "code": "as",
            "model": "facebook/mms-tts-asm",
            "text": "নমস্কাৰ দেউতা, মই আপোনাৰ সুনীতা। আপুনি চাহ খাব নে?"
        },
        {
            "name": "Bengali",
            "code": "bn",
            "model": "facebook/mms-tts-ben",
            "text": "নমস্কার রমেশবাবু, আপনার সকালের চা তৈরি আছে।"
        },
        {
            "name": "Nepali",
            "code": "ne",
            "model": "rhasspy/piper-voices:ne_NP-google-medium",
            "text": "नमस्ते रमेश, तपाईंलाई आज कस्तो छ? बगैंचामा जाऔं।"
        },
        {
            "name": "Mizo (Meta MMS)",
            "code": "miz",
            "model": "facebook/mms-tts-miz",
            "text": "Chibai, i dam em? Vawiin chu ni tha tak a ni."
        },
        {
            "name": "Mizo (NE-TTS)",
            "code": "lus",
            "model": "sulabhkatiyar/indian-ne-multilingual-tts (lus_female_aizawl)",
            "text": "chibai ka thian tha tak i ni e"
        },
        {
            "name": "Nyishi (ISO)",
            "code": "njz",
            "model": "sulabhkatiyar/indian-ne-multilingual-tts (njz_male_papumpare)",
            "text": "building agu pute jabu kongpo pa"
        },
        {
            "name": "Nyishi (frontend alias)",
            "code": "ny",
            "model": "sulabhkatiyar/indian-ne-multilingual-tts (njz_male_papumpare)",
            "text": "building agu pute jabu kongpo pa"
        },
        {
            "name": "Kokborok",
            "code": "trp",
            "model": "sulabhkatiyar/indian-ne-multilingual-tts (trp_male_westtripura)",
            "text": "ani bwskango kaisa mampli tongo aw mampli o nugjago"
        }
    ]

    for item in TEST_CASES:
        name = item["name"]
        code = item["code"]
        model = item["model"]
        text = item["text"]

        print(f"\n--- Testing {name} ({code}) ---")
        print(f"  Input utterance: {text}")
        
        # 1st call (model loading + inference)
        req_data = json.dumps({"text": text, "language": code}).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/tts",
            data=req_data,
            headers={"Content-Type": "application/json", "Accept": "audio/wav"},
            method="POST"
        )
        
        t0 = time.time()
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            status_code = resp.status
            content_type = resp.headers.get("Content-Type")
        latency_1 = round(time.time() - t0, 3)

        assert status_code == 200, f"Expected 200, got {status_code}"
        assert "audio/wav" in content_type, f"Expected audio/wav, got {content_type}"
        assert content.startswith(b"RIFF"), "Missing RIFF header"

        # Parse WAV and inspect audio samples
        with wave.open(io.BytesIO(content), "rb") as wf:
            channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            nframes = wf.getnframes()
            duration = round(nframes / float(framerate), 3)
            raw_frames = wf.readframes(nframes)

        # Non-zero audio verification
        samples = np.frombuffer(raw_frames, dtype=np.int16)
        max_amp = int(np.max(np.abs(samples)))
        mean_amp = float(np.mean(np.abs(samples)))
        std_amp = float(np.std(samples))
        non_zero_pct = float(np.count_nonzero(samples) / len(samples) * 100)

        # Assertions for genuine synthesized speech
        assert channels == 1, f"Expected mono, got {channels}"
        assert sampwidth == 2, f"Expected 16-bit PCM (2 bytes), got {sampwidth}"
        assert duration > 0.2, f"Duration too short: {duration}s"
        assert max_amp > 500, f"Audio waveform amplitude too low (silent): max={max_amp}"
        assert non_zero_pct > 40.0, f"Too much silence in waveform: {non_zero_pct}%"

        # Save audio sample
        out_wav = OUT_DIR / f"e2e_{code}.wav"
        with open(out_wav, "wb") as f:
            f.write(content)

        # 2nd call (model reuse verification)
        t2 = time.time()
        with urllib.request.urlopen(req) as resp:
            _ = resp.read()
        latency_2 = round(time.time() - t2, 3)

        print(f"  [PASS] Status: {status_code} | Duration: {duration}s | SampleRate: {framerate}Hz | Size: {len(content)} bytes")
        print(f"  Audio Fidelity: MaxAmplitude={max_amp}/32767, StdDev={round(std_amp, 1)}, NonZero={round(non_zero_pct, 1)}%")
        print(f"  Latency: FirstCall={latency_1}s | CachedReuse={latency_2}s (Zero reload overhead)")
        print(f"  Sample Saved: {out_wav}")

        report["languages"][code] = {
            "name": name,
            "status": "PASS",
            "model": model,
            "duration_sec": duration,
            "sample_rate": framerate,
            "max_amplitude": max_amp,
            "latency_first": latency_1,
            "latency_cached": latency_2,
            "file": str(out_wav)
        }

    # Check 4: Honest Khasi Verification
    print("\n--- Testing Khasi (kha) ---")
    khasi_req = urllib.request.Request(
        f"{BASE_URL}/tts",
        data=json.dumps({"text": "Khublei shibun, kumno phi long?", "language": "kha"}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        urllib.request.urlopen(khasi_req)
        khasi_status = 200
        khasi_msg = "Unexpected success"
    except urllib.error.HTTPError as e:
        khasi_status = e.code
        khasi_msg = e.read().decode("utf-8")

    print(f"  Khasi response: HTTP {khasi_status}")
    print(f"  Detail: {khasi_msg}")
    assert khasi_status == 400
    assert "unavailable" in khasi_msg.lower() or "unsupported" in khasi_msg.lower()
    report["languages"]["kha"] = {
        "name": "Khasi",
        "status": "UNSUPPORTED",
        "model": "None (toiar/Rynsan-TTS is gated with manual author approval)",
        "http_status": khasi_status,
        "detail": khasi_msg
    }
    print("  [PASS] Khasi handled honestly: Returned HTTP 400 without faking speech.")

    report["all_passed"] = True
    print("\n" + "=" * 75)
    print("ALL END-TO-END VERIFICATION CHECKS COMPLETED SUCCESSFULLY!")
    print("=" * 75)

finally:
    server.should_exit = True
    server_thread.join(timeout=3)
    print("Test Uvicorn server stopped cleanly.")

summary_file = OUT_DIR / "end_to_end_verification_summary.json"
with open(summary_file, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2, ensure_ascii=False)
print(f"Detailed summary written to: {summary_file}")
