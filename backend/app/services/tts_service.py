import os
import hashlib
from typing import Optional
from ..tts.engine import tts_engine, LANGUAGE_MAPPING

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".tts_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# Assamese specific character normalization for natural neural speech synthesis
# Maps Assamese Ra (U+09F0) and Wa (U+09F1) to authentic spoken phonetics
ASSAMESE_CHAR_MAP = {
    '\u09F0': '\u09B0', # Assamese Ra -> Bengali/Eastern Nagari Ra phoneme
    '\u09F1': '\u09AC', # Assamese Wa -> Eastern Nagari Ba/Wa phoneme
}

def normalize_assamese_text(text: str) -> str:
    out = []
    for ch in text:
        out.append(ASSAMESE_CHAR_MAP.get(ch, ch))
    return ''.join(out)

class TTSService:
    @staticmethod
    async def generate_speech_mp3(text: str, lang: str = 'en') -> Optional[bytes]:
        """
        Generate speech using local offline neural TTS engine.
        Returns WAV bytes (or None if language is unsupported).
        """
        lang_key = lang.lower().strip()
        if not text or not text.strip():
            return None

        if lang_key not in LANGUAGE_MAPPING:
            return None

        # Apply Assamese normalization if needed
        processed_text = normalize_assamese_text(text) if lang_key in ('as', 'asm') else text

        # Cache check
        cache_key = hashlib.md5(f"{lang_key}:{processed_text}".encode('utf-8')).hexdigest()
        cache_file = os.path.join(CACHE_DIR, f"{cache_key}.wav")

        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'rb') as f:
                    return f.read()
            except Exception:
                pass

        try:
            wav_bytes = tts_engine.synthesize_wav_bytes(processed_text, lang_key)
            with open(cache_file, 'wb') as f:
                f.write(wav_bytes)
            return wav_bytes
        except Exception as e:
            print(f"[Memora TTS Service] Error synthesizing speech for lang '{lang}': {e}")
            return None
