import os
import hashlib
import asyncio
from typing import Optional

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".tts_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# Edge TTS voice models for verified languages
VOICE_MAP = {
    'en': 'en-IN-NeerjaNeural',
    'bn': 'bn-IN-TanishaaNeural',
    'ne': 'ne-NP-HemkalaNeural',
    'as': 'bn-IN-TanishaaNeural', # Eastern Nagari neural model with Assamese phonetic normalization
}

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
        lang_key = lang.lower().split('-')[0]
        voice = VOICE_MAP.get(lang_key)

        # If language has no verified neural model, return None honestly for text fallback
        if not voice:
            return None

        # Apply Assamese normalization if needed
        processed_text = normalize_assamese_text(text) if lang_key == 'as' else text

        # Cache check
        cache_key = hashlib.md5(f"{lang_key}:{processed_text}".encode('utf-8')).hexdigest()
        cache_file = os.path.join(CACHE_DIR, f"{cache_key}.mp3")

        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'rb') as f:
                    return f.read()
            except Exception:
                pass

        try:
            import edge_tts
            communicate = edge_tts.Communicate(processed_text, voice, rate="-10%") # Slower, dementia-friendly
            await communicate.save(cache_file)

            with open(cache_file, 'rb') as f:
                return f.read()
        except Exception as e:
            # Fall back to local offline neural TTS engine
            try:
                from ..tts.engine import tts_engine
                wav_bytes = tts_engine.synthesize_wav_bytes(processed_text, lang_key)
                with open(cache_file, 'wb') as f:
                    f.write(wav_bytes)
                return wav_bytes
            except Exception as inner_e:
                print(f"TTS local offline fallback error for lang {lang}: {inner_e}")
                return None
