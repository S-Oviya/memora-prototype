import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import io
import time
import wave
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.tts.engine import tts_engine

client = TestClient(app)

VERIFIED_LANGUAGES = [
    {"code": "en", "text": "Good morning Ramesh, it is time for morning tea.", "name": "English"},
    {"code": "as", "text": "নমস্কাৰ, আপুনি পুৱাৰ চাহ খালে নে?", "name": "Assamese"},
    {"code": "bn", "text": "নমস্কার, আপনি কেমন আছেন?", "name": "Bengali"},
    {"code": "ne", "text": "नमस्ते रमेश, तपाईंलाई कस्तो छ?", "name": "Nepali"},
    {"code": "miz", "text": "Chibai, i dam em?", "name": "Mizo (Meta MMS)"},
    {"code": "lus", "text": "mi pakhat ka hmu a kawr gray a ha a", "name": "Mizo (NE-TTS)"},
    {"code": "njz", "text": "building agu pute jabu kongpo pa", "name": "Nyishi"},
    {"code": "trp", "text": "ani bwskango kaisa mampli tongo", "name": "Kokborok"},
]

def validate_wav_bytes(content: bytes) -> dict:
    """Helper to validate RIFF WAV headers, duration, and frame integrity."""
    assert content.startswith(b"RIFF"), "Audio must start with RIFF header"
    with wave.open(io.BytesIO(content), "rb") as wf:
        channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        nframes = wf.getnframes()
        duration = nframes / float(framerate)

        assert channels in [1, 2], f"Expected 1 or 2 channels, got {channels}"
        assert sampwidth == 2, f"Expected 16-bit PCM (sampwidth=2), got {sampwidth}"
        assert framerate in [16000, 22050, 24000], f"Unexpected framerate {framerate}"
        assert nframes > 0, "WAV must contain non-zero audio frames"
        assert duration > 0.2, f"Duration too short: {duration}s"

        return {
            "channels": channels,
            "sample_rate": framerate,
            "duration": duration,
            "frames": nframes
        }

@pytest.mark.parametrize("lang_info", VERIFIED_LANGUAGES, ids=lambda x: x["code"])
def test_post_tts_each_verified_language(lang_info):
    """Confirm POST /tts succeeds with valid audio/wav for every verified language."""
    code = lang_info["code"]
    text = lang_info["text"]

    t0 = time.time()
    response = client.post("/tts", json={"text": text, "language": code})
    t1 = time.time()
    latency = round(t1 - t0, 3)

    assert response.status_code == 200, f"Expected 200 for {code}, got {response.status_code}: {response.text}"
    assert response.headers["content-type"] == "audio/wav"
    assert len(response.content) > 1000, f"WAV content too small: {len(response.content)} bytes"

    wav_info = validate_wav_bytes(response.content)
    print(f"\n[Verified {lang_info['name']}] code={code}, duration={wav_info['duration']}s, rate={wav_info['sample_rate']}Hz, latency={latency}s")

def test_model_reuse_no_reload():
    """Verify that models are cached in memory and not reloaded for subsequent requests."""
    # First request
    r1 = client.post("/tts", json={"text": "First test phrase.", "language": "en"})
    assert r1.status_code == 200
    initial_load_count = tts_engine.registry.model_load_counts.get("eng", 0)
    assert initial_load_count == 1, "Model should be loaded exactly once"

    # Second request with different text
    t0 = time.time()
    r2 = client.post("/tts", json={"text": "Second test phrase reusing model.", "language": "en"})
    elapsed = time.time() - t0
    assert r2.status_code == 200
    subsequent_load_count = tts_engine.registry.model_load_counts.get("eng", 0)

    # Count must remain 1 (no reload)
    assert subsequent_load_count == 1, "Model must not be reloaded on subsequent requests"
    assert elapsed < 3.0, f"Cached inference should be fast, took {elapsed}s"

def test_post_tts_empty_text():
    """Verify empty or whitespace-only text returns HTTP 400."""
    r1 = client.post("/tts", json={"text": "", "language": "en"})
    assert r1.status_code in [400, 422]

    r2 = client.post("/tts", json={"text": "     ", "language": "en"})
    assert r2.status_code == 400
    assert "empty" in r2.json()["detail"].lower()

def test_post_tts_unsupported_language():
    """Verify unsupported language returns HTTP 400 with supported language details."""
    response = client.post("/tts", json={"text": "Hello world", "language": "unsupported_xyz"})
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "unsupported language" in detail.lower()
    assert "en" in detail and "ne" in detail and "as" in detail

def test_post_tts_malformed_request():
    """Verify missing required fields return HTTP 422."""
    r1 = client.post("/tts", json={"language": "en"})
    assert r1.status_code == 422

    r2 = client.post("/tts", json={"text": "Hello"})
    assert r2.status_code == 422

    r3 = client.post("/tts", content=b"invalid json", headers={"Content-Type": "application/json"})
    assert r3.status_code == 422

def test_post_tts_very_short_text():
    """Verify very short single-word text generates valid speech."""
    response = client.post("/tts", json={"text": "Tea", "language": "en"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    wav_info = validate_wav_bytes(response.content)
    assert wav_info["duration"] > 0.2

def test_post_tts_longer_guidance_text():
    """Verify longer multi-sentence caregiver guidance text synthesizes cleanly."""
    long_text = (
        "Good morning Ramesh. Today is a pleasant sunny day. "
        "Your daughter Sunita will visit you this afternoon. "
        "Let us take your morning medicines and enjoy a quiet walk in the garden."
    )
    t0 = time.time()
    response = client.post("/tts", json={"text": long_text, "language": "en"})
    elapsed = time.time() - t0

    assert response.status_code == 200
    wav_info = validate_wav_bytes(response.content)
    assert wav_info["duration"] > 5.0, f"Expected long duration, got {wav_info['duration']}s"
    print(f"\n[Long Guidance] duration={wav_info['duration']}s, latency={round(elapsed, 2)}s")

def test_get_tts_languages():
    """Verify GET /tts/languages returns list of verified supported languages."""
    response = client.get("/tts/languages")
    assert response.status_code == 200
    langs = response.json()["supported_languages"]
    assert "en" in langs
    assert "as" in langs
    assert "bn" in langs
    assert "ne" in langs
    assert "njz" in langs
    assert "trp" in langs

def test_existing_endpoints_intact():
    """Verify that adding the TTS module preserved all existing Memora backend routes."""
    # Health check
    r_health = client.get("/api/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "ok"
    assert r_health.json()["offlineTTS"] is True

    # Patient data
    r_patient = client.get("/api/patients/patient-ramesh-1/full")
    assert r_patient.status_code == 200
    data = r_patient.json()
    assert "patient" in data
    assert data["patient"]["name"] == "Ramesh Chandra Baruah"
    assert len(data["routines"]) > 0
