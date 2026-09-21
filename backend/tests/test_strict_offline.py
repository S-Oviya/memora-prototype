import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

import io
import time
import wave
import socket
import pytest

# ---------------------------------------------------------------------------
# Strict Socket Firewall: Block any outgoing connection to non-localhost
# ---------------------------------------------------------------------------
_orig_connect = socket.socket.connect
_orig_create_conn = socket.create_connection
_orig_getaddrinfo = socket.getaddrinfo

blocked_attempts = []

def strict_getaddrinfo(host, port, *args, **kwargs):
    if host and host not in ("127.0.0.1", "localhost", "::1", "0.0.0.0"):
        blocked_attempts.append(f"DNS lookup for {host}:{port}")
        raise RuntimeError(f"STRICT_OFFLINE_VIOLATION: Blocked DNS resolution for external host: {host}")
    return _orig_getaddrinfo(host, port, *args, **kwargs)

def strict_connect(self, address):
    host = address[0]
    if host not in ("127.0.0.1", "localhost", "::1"):
        blocked_attempts.append(f"Socket connect to {host}")
        raise RuntimeError(f"STRICT_OFFLINE_VIOLATION: Blocked network socket connection to: {host}")
    return _orig_connect(self, address)

def strict_create_connection(address, *args, **kwargs):
    host = address[0]
    if host not in ("127.0.0.1", "localhost", "::1"):
        blocked_attempts.append(f"Create connection to {host}")
        raise RuntimeError(f"STRICT_OFFLINE_VIOLATION: Blocked connection creation to: {host}")
    return _orig_create_conn(address, *args, **kwargs)

socket.getaddrinfo = strict_getaddrinfo
socket.socket.connect = strict_connect
socket.create_connection = strict_create_connection

import sys
from pathlib import Path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Now import FastAPI application
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

OFFLINE_LANGUAGES = [
    {"code": "en", "name": "English", "text": "Good morning Ramesh, it is time for morning tea."},
    {"code": "as", "name": "Assamese", "text": "নমস্কাৰ, আপুনি পুৱাৰ চাহ খালে নে?"},
    {"code": "bn", "name": "Bengali", "text": "নমস্কার, আপনি কেমন আছেন?"},
    {"code": "ne", "name": "Nepali", "text": "नमस्ते रमेश, तपाईंलाई कस्तो छ?"},
    {"code": "miz", "name": "Mizo (Meta MMS)", "text": "Chibai, i dam em?"},
    {"code": "lus", "name": "Mizo (NE-TTS)", "text": "mi pakhat ka hmu a kawr gray a ha a"},
    {"code": "njz", "name": "Nyishi", "text": "building agu pute jabu kongpo pa"},
    {"code": "ny", "name": "Nyishi (frontend alias)", "text": "building agu pute jabu kongpo pa"},
    {"code": "trp", "name": "Kokborok", "text": "ani bwskango kaisa mampli tongo"},
]

def test_offline_backend_startup():
    """Prove that the FastAPI backend initializes and serves health endpoint with zero network."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["offlineTTS"] is True
    assert len(blocked_attempts) == 0, f"Network calls triggered during startup: {blocked_attempts}"

@pytest.mark.parametrize("item", OFFLINE_LANGUAGES, ids=lambda x: x["code"])
def test_strict_offline_speech_generation(item):
    """Prove that speech generation for each language runs 100% locally with zero network calls."""
    code = item["code"]
    text = item["text"]
    name = item["name"]

    start_blocked_count = len(blocked_attempts)

    t0 = time.time()
    response = client.post("/tts", json={"text": text, "language": code})
    t1 = time.time()
    latency = round(t1 - t0, 3)

    # Assert no external connection attempts were made
    new_blocked = blocked_attempts[start_blocked_count:]
    assert len(new_blocked) == 0, f"Network call attempted during {name} inference: {new_blocked}"

    assert response.status_code == 200, f"Failed for {code}: {response.text}"
    assert response.headers["content-type"] == "audio/wav"

    content = response.content
    assert content.startswith(b"RIFF"), "Must start with RIFF header"

    with wave.open(io.BytesIO(content), "rb") as wf:
        channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        nframes = wf.getnframes()
        duration = round(nframes / float(framerate), 3)

        assert channels in [1, 2]
        assert sampwidth == 2 # 16-bit PCM
        assert framerate in [16000, 22050]
        assert nframes > 0
        assert duration > 0.2

    print(f"\n[OFFLINE VERIFIED: {name}] ({code}) duration={duration}s, rate={framerate}Hz, latency={latency}s, network_calls=0")

def test_offline_safety_guard_blocks_network():
    """Verify that our offline socket guard actually raises an error if an external call is attempted."""
    with pytest.raises(RuntimeError) as exc_info:
        socket.getaddrinfo("huggingface.co", 443)
    assert "STRICT_OFFLINE_VIOLATION" in str(exc_info.value)

def test_strict_offline_khasi_unsupported_rejection():
    """Verify that requesting Khasi ('kha') is rejected honestly with 400 Bad Request and zero network calls."""
    start_blocked_count = len(blocked_attempts)
    res = client.post("/tts", json={"text": "Khublei", "language": "kha"})
    new_blocked = blocked_attempts[start_blocked_count:]
    assert len(new_blocked) == 0, "No network calls should occur for unsupported languages"
    assert res.status_code == 400
    assert "unavailable" in res.json()["detail"].lower()
