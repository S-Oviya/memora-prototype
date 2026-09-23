import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.app.main import app

client = TestClient(app)

def test_health_check_voices():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "supportedVoices" in data
    assert "en" in data["supportedVoices"]
    assert "ne" in data["supportedVoices"]
    assert "lus" in data["supportedVoices"]

def test_tts_empty_text():
    response = client.post("/tts", json={"text": "", "language": "en"})
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_tts_whitespace_text():
    response = client.post("/tts", json={"text": "    ", "language": "en"})
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_tts_overly_long_text():
    long_text = "a" * 501
    response = client.post("/tts", json={"text": long_text, "language": "en"})
    assert response.status_code == 400
    assert "maximum" in response.json()["detail"].lower()

def test_tts_unsupported_language():
    response = client.post("/tts", json={"text": "hello", "language": "french"})
    assert response.status_code == 400
    assert "unsupported" in response.json()["detail"].lower()

def test_tts_khasi_informational_error():
    response = client.post("/tts", json={"text": "khublei", "language": "kha"})
    assert response.status_code == 503
    assert "Khasi" in response.json()["detail"]

def test_tts_english_post():
    response = client.post("/tts", json={"text": "Take your morning medication now.", "language": "en"})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("audio/wav")
    # Verify WAV header
    content = response.content
    assert len(content) > 1000
    assert content[:4] == b"RIFF"
    assert content[8:12] == b"WAVE"

def test_tts_api_prefix_post():
    response = client.post("/api/tts", json={"text": "Drink a glass of water.", "language": "en"})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("audio/wav")
    assert response.content[:4] == b"RIFF"

def test_tts_nepali_post():
    response = client.post("/tts", json={"text": "औषधि खाने समय भयो।", "language": "ne"})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("audio/wav")
    assert response.content[:4] == b"RIFF"

if __name__ == "__main__":
    print("Running TTS test suite...")
    test_health_check_voices()
    print("OK: test_health_check_voices")
    test_tts_empty_text()
    print("OK: test_tts_empty_text")
    test_tts_whitespace_text()
    print("OK: test_tts_whitespace_text")
    test_tts_overly_long_text()
    print("OK: test_tts_overly_long_text")
    test_tts_unsupported_language()
    print("OK: test_tts_unsupported_language")
    test_tts_khasi_informational_error()
    print("OK: test_tts_khasi_informational_error")
    test_tts_english_post()
    print("OK: test_tts_english_post")
    test_tts_api_prefix_post()
    print("OK: test_tts_api_prefix_post")
    test_tts_nepali_post()
    print("OK: test_tts_nepali_post")
    print("\nALL TTS TESTS PASSED!")
