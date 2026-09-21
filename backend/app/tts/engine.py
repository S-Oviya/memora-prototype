import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

import io
import wave
import threading
import re
from typing import Dict, Tuple, Optional, Any
import numpy as np

# Monkey-patch modern transformers for Coqui TTS compatibility
import transformers.pytorch_utils
import torch
transformers.pytorch_utils.isin_mps_friendly = torch.isin

import scipy.io.wavfile

# Base paths
MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(MODULE_DIR)
BACKEND_DIR = os.path.dirname(APP_DIR)
MODELS_DIR = os.path.join(BACKEND_DIR, "models", "tts")

# Coqui vocabulary: 34-character Latin vocabulary without punctuation
COQUI_ALLOWED_CHARS = set(" abcdefghijklmnopqrstuvwxyz·âêîûüṭ")

LANGUAGE_MAPPING = {
    "en": {"engine": "mms", "mms_code": "eng", "model_id": "facebook/mms-tts-eng", "display": "English"},
    "eng": {"engine": "mms", "mms_code": "eng", "model_id": "facebook/mms-tts-eng", "display": "English"},
    "as": {"engine": "mms", "mms_code": "asm", "model_id": "facebook/mms-tts-asm", "display": "Assamese"},
    "asm": {"engine": "mms", "mms_code": "asm", "model_id": "facebook/mms-tts-asm", "display": "Assamese"},
    "bn": {"engine": "mms", "mms_code": "ben", "model_id": "facebook/mms-tts-ben", "display": "Bengali"},
    "ben": {"engine": "mms", "mms_code": "ben", "model_id": "facebook/mms-tts-ben", "display": "Bengali"},
    "miz": {"engine": "mms", "mms_code": "miz", "model_id": "facebook/mms-tts-miz", "display": "Mizo (Meta MMS)"},
    "mizo": {"engine": "mms", "mms_code": "miz", "model_id": "facebook/mms-tts-miz", "display": "Mizo (Meta MMS)"},
    "lus": {"engine": "coqui_ne", "iso": "lus", "speaker": "lus_female_aizawl", "display": "Mizo (NE-TTS)"},
    "njz": {"engine": "coqui_ne", "iso": "njz", "speaker": "njz_male_papumpare", "display": "Nyishi"},
    "ny": {"engine": "coqui_ne", "iso": "njz", "speaker": "njz_male_papumpare", "display": "Nyishi"},
    "nyishi": {"engine": "coqui_ne", "iso": "njz", "speaker": "njz_male_papumpare", "display": "Nyishi"},
    "trp": {"engine": "coqui_ne", "iso": "trp", "speaker": "trp_male_westtripura", "display": "Kokborok"},
    "kokborok": {"engine": "coqui_ne", "iso": "trp", "speaker": "trp_male_westtripura", "display": "Kokborok"},
    "ne": {"engine": "piper", "voice_name": "ne_NP-google-medium", "display": "Nepali"},
    "nep": {"engine": "piper", "voice_name": "ne_NP-google-medium", "display": "Nepali"},
    "npi": {"engine": "piper", "voice_name": "ne_NP-google-medium", "display": "Nepali"},
}

def sanitize_coqui_text(text: str) -> str:
    """Sanitizes text for Coqui NE multilingual character front-end."""
    text_lower = text.lower()
    sanitized = "".join(ch for ch in text_lower if ch in COQUI_ALLOWED_CHARS)
    sanitized = re.sub(r"\s+", " ", sanitized).strip()
    return sanitized

class TTSModelRegistry:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(TTSModelRegistry, cls).__new__(cls)
                cls._instance._init_registry()
            return cls._instance

    def _init_registry(self):
        self.mms_models: Dict[str, Tuple[Any, Any]] = {}
        self.piper_voices: Dict[str, Any] = {}
        self.coqui_synth: Optional[Any] = None
        self.model_load_counts: Dict[str, int] = {}
        self.lock = threading.Lock()

    def get_mms_model(self, mms_code: str, fallback_model_id: str):
        with self.lock:
            if mms_code in self.mms_models:
                return self.mms_models[mms_code]

            from transformers import VitsModel, AutoTokenizer
            local_mms_path = os.path.join(MODELS_DIR, "mms", mms_code)
            
            if os.path.isdir(local_mms_path) and os.path.exists(os.path.join(local_mms_path, "model.safetensors")):
                print(f"[Memora TTS] Loading MMS model from local directory: {local_mms_path} (100% offline)...")
                tokenizer = AutoTokenizer.from_pretrained(local_mms_path, local_files_only=True)
                model = VitsModel.from_pretrained(local_mms_path, local_files_only=True)
            else:
                print(f"[Memora TTS] Loading MMS model from local cache: {fallback_model_id}...")
                tokenizer = AutoTokenizer.from_pretrained(fallback_model_id, local_files_only=True)
                model = VitsModel.from_pretrained(fallback_model_id, local_files_only=True)

            model.eval()
            self.mms_models[mms_code] = (model, tokenizer)
            self.model_load_counts[mms_code] = self.model_load_counts.get(mms_code, 0) + 1
            print(f"[Memora TTS] MMS model {mms_code} loaded and cached in memory.")
            return self.mms_models[mms_code]

    def get_piper_voice(self, voice_name: str = "ne_NP-google-medium"):
        with self.lock:
            if voice_name in self.piper_voices:
                return self.piper_voices[voice_name]

            from piper import PiperVoice
            piper_dir = os.path.join(MODELS_DIR, "piper")
            onnx_path = os.path.join(piper_dir, f"{voice_name}.onnx")
            json_path = os.path.join(piper_dir, f"{voice_name}.onnx.json")

            # Fallback to research models dir if not in backend/models
            if not os.path.exists(onnx_path):
                alt_dir = os.path.join(BACKEND_DIR, "..", "tts-research", "models", "piper")
                if os.path.exists(os.path.join(alt_dir, f"{voice_name}.onnx")):
                    onnx_path = os.path.join(alt_dir, f"{voice_name}.onnx")
                    json_path = os.path.join(alt_dir, f"{voice_name}.onnx.json")

            if not os.path.exists(onnx_path):
                raise FileNotFoundError(f"Piper model not found locally at {onnx_path}")

            print(f"[Memora TTS] Loading Piper voice locally: {onnx_path}...")
            voice = PiperVoice.load(onnx_path, config_path=json_path)
            self.piper_voices[voice_name] = voice
            self.model_load_counts[voice_name] = self.model_load_counts.get(voice_name, 0) + 1
            print(f"[Memora TTS] Piper voice {voice_name} loaded and cached in memory.")
            return voice

    def get_coqui_synth(self):
        with self.lock:
            if self.coqui_synth is not None:
                return self.coqui_synth

            from TTS.utils.synthesizer import Synthesizer
            coqui_dir = os.path.join(MODELS_DIR, "indian-ne")
            if not os.path.exists(os.path.join(coqui_dir, "model.pth")):
                alt_dir = os.path.join(BACKEND_DIR, "..", "tts-research", "models", "indian-ne-multilingual-tts")
                if os.path.exists(os.path.join(alt_dir, "model.pth")):
                    coqui_dir = os.path.abspath(alt_dir)

            checkpoint = os.path.join(coqui_dir, "model.pth")
            config = os.path.join(coqui_dir, "config.json")
            speakers = os.path.join(coqui_dir, "speakers.pth")
            languages = os.path.join(coqui_dir, "language_ids.json")

            if not os.path.exists(checkpoint):
                raise FileNotFoundError(f"Coqui Indian NE model not found at {checkpoint}")

            print(f"[Memora TTS] Loading Coqui Indian NE model locally: {checkpoint}...")
            prev_cwd = os.getcwd()
            try:
                os.chdir(coqui_dir)
                synth = Synthesizer(
                    tts_checkpoint="model.pth",
                    tts_config_path="config.json",
                    tts_speakers_file="speakers.pth",
                    tts_languages_file="language_ids.json",
                    use_cuda=False
                )
            finally:
                os.chdir(prev_cwd)

            self.coqui_synth = synth
            self.model_load_counts["coqui_ne"] = self.model_load_counts.get("coqui_ne", 0) + 1
            print(f"[Memora TTS] Coqui Indian NE model loaded and cached in memory.")
            return synth

class TTSEngine:
    def __init__(self):
        self.registry = TTSModelRegistry()

    def get_supported_languages(self) -> Dict[str, str]:
        return {code: info["display"] for code, info in LANGUAGE_MAPPING.items()}

    def synthesize_wav_bytes(self, text: str, language: str) -> bytes:
        lang_code = language.strip().lower()
        if lang_code not in LANGUAGE_MAPPING:
            supported = ", ".join(sorted(LANGUAGE_MAPPING.keys()))
            raise ValueError(f"Language '{language}' is not supported or verified. Supported language codes: {supported}")

        cfg = LANGUAGE_MAPPING[lang_code]
        engine_type = cfg["engine"]

        if engine_type == "mms":
            mms_code = cfg["mms_code"]
            model_id = cfg["model_id"]
            model, tokenizer = self.registry.get_mms_model(mms_code, model_id)

            inputs = tokenizer(text, return_tensors="pt")
            with torch.no_grad():
                output = model(**inputs).waveform

            waveform = output.squeeze().cpu().numpy()
            sample_rate = model.config.sampling_rate

            waveform_norm = np.clip(waveform, -1.0, 1.0)
            pcm_data = (waveform_norm * 32767.0).astype(np.int16)

            buf = io.BytesIO()
            scipy.io.wavfile.write(buf, rate=sample_rate, data=pcm_data)
            return buf.getvalue()

        elif engine_type == "piper":
            voice_name = cfg["voice_name"]
            voice = self.registry.get_piper_voice(voice_name)

            buf = io.BytesIO()
            with wave.open(buf, "wb") as wav_out:
                voice.synthesize_wav(text, wav_out)
            return buf.getvalue()

        elif engine_type == "coqui_ne":
            synth = self.registry.get_coqui_synth()
            speaker = cfg["speaker"]
            iso = cfg["iso"]

            # Sanitize text for Coqui Latin vocabulary
            clean_text = sanitize_coqui_text(text)
            if not clean_text:
                clean_text = text.lower() # Fallback if entirely non-Latin

            wav = synth.tts(text=clean_text, speaker_name=speaker, language_name=iso)
            buf = io.BytesIO()
            synth.save_wav(wav, buf)
            return buf.getvalue()

        else:
            raise ValueError(f"Unknown engine type '{engine_type}' for language '{language}'")

tts_engine = TTSEngine()
