import os
import sys
import io
import time
import json
import logging
import tempfile
import threading
from collections import OrderedDict
import numpy as np
import soundfile as sf
from typing import Optional, Tuple

logger = logging.getLogger("memora_tts")

# Strictly enforce offline execution
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

# Ensure Windows MSVC runtime compatibility for PyTorch and ONNX Runtime
torch_lib = os.path.join(sys.prefix, "Lib", "site-packages", "torch", "lib")
if os.path.exists(torch_lib):
    if hasattr(os, "add_dll_directory"):
        try:
            os.add_dll_directory(torch_lib)
        except Exception:
            pass
    if "PATH" in os.environ and torch_lib not in os.environ["PATH"]:
        os.environ["PATH"] = torch_lib + ";" + os.environ["PATH"]

# Map language codes to supported backend engines
# Supported Memora languages: en, as, bn, ne, lus, kha, ny, trp
SUPPORTED_LANGUAGES = {
    'en': {'engine': 'mms', 'model_id': 'facebook/mms-tts-eng', 'name': 'English'},
    'as': {'engine': 'mms', 'model_id': 'facebook/mms-tts-asm', 'name': 'Assamese'},
    'bn': {'engine': 'mms', 'model_id': 'facebook/mms-tts-ben', 'name': 'Bengali'},
    'ne': {'engine': 'kala', 'speaker': 'kala', 'name': 'Nepali'},
    'lus': {'engine': 'sulabh', 'lang': 'lus', 'speaker': 'lus_female_aizawl', 'name': 'Mizo'},
    'miz': {'engine': 'sulabh', 'lang': 'lus', 'speaker': 'lus_female_aizawl', 'name': 'Mizo'},
    'ny': {'engine': 'sulabh', 'lang': 'njz', 'speaker': 'njz_male_papumpare', 'name': 'Nyishi'},
    'njz': {'engine': 'sulabh', 'lang': 'njz', 'speaker': 'njz_male_papumpare', 'name': 'Nyishi'},
    'trp': {'engine': 'sulabh', 'lang': 'trp', 'speaker': 'trp_male_westtripura', 'name': 'Kokborok'},
}


class TTSService:
    _lock = threading.Lock()
    _models = {}
    _sulabh_synth = None
    _audio_cache = OrderedDict()
    MAX_AUDIO_CACHE_ENTRIES = 50

    @classmethod
    def is_language_supported(cls, lang: str) -> bool:
        code = lang.lower().split('-')[0].strip()
        return code in SUPPORTED_LANGUAGES

    @classmethod
    def _load_mms_model(cls, model_id: str):
        with cls._lock:
            if model_id in cls._models:
                return cls._models[model_id]

            import torch
            from transformers import VitsModel, AutoTokenizer

            logger.info(f"[Offline TTS] Loading MMS model '{model_id}' from local cache...")
            tok = AutoTokenizer.from_pretrained(model_id, local_files_only=True)
            model = VitsModel.from_pretrained(model_id, local_files_only=True)
            model.eval()
            cls._models[model_id] = (tok, model)
            logger.info(f"[Offline TTS] MMS model '{model_id}' loaded successfully.")
            return tok, model

    @classmethod
    def _load_sulabh_synth(cls):
        with cls._lock:
            if cls._sulabh_synth is not None:
                return cls._sulabh_synth

            import glob
            from TTS.utils.synthesizer import Synthesizer

            logger.info("[Offline TTS] Loading Sulabh NE Multilingual model from local cache...")
            cache_base = os.path.expanduser("~/.cache/huggingface/hub/models--sulabhkatiyar--indian-ne-multilingual-tts/snapshots/*")
            snapshots = glob.glob(cache_base)
            if not snapshots:
                raise FileNotFoundError("Local weights for sulabhkatiyar/indian-ne-multilingual-tts not found in cache.")

            snap_dir = snapshots[0]
            config_path = os.path.join(snap_dir, "config.json")
            speakers_path = os.path.join(snap_dir, "speakers.pth")
            languages_path = os.path.join(snap_dir, "language_ids.json")
            model_path = os.path.join(snap_dir, "model.pth")

            with open(config_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)

            cfg["model_args"]["speakers_file"] = speakers_path.replace("\\", "/")
            cfg["model_args"]["language_ids_file"] = languages_path.replace("\\", "/")
            cfg["speakers_file"] = speakers_path.replace("\\", "/")
            cfg["language_ids_file"] = languages_path.replace("\\", "/")

            patch_file = os.path.join(snap_dir, "config_patched_memora.json")
            with open(patch_file, "w", encoding="utf-8") as f:
                json.dump(cfg, f, indent=2)

            synth = Synthesizer(
                tts_checkpoint=model_path,
                tts_config_path=patch_file,
                tts_speakers_file=speakers_path,
                tts_languages_file=languages_path,
                use_cuda=False
            )
            cls._sulabh_synth = synth
            logger.info("[Offline TTS] Sulabh NE Multilingual model loaded successfully.")
            return synth

    @classmethod
    def generate_speech_wav(cls, text: str, lang: str = 'en') -> bytes:
        """
        Converts text to standard playable WAV bytes offline on CPU.
        """
        code = lang.lower().split('-')[0].strip()

        if code == 'kha':
            raise ValueError(
                "Khasi ('kha') is an under-resourced language with no open offline pretrained TTS model globally. "
                "Please use pre-recorded audio templates or visual display."
            )

        if code not in SUPPORTED_LANGUAGES:
            raise ValueError(f"Language '{lang}' is not supported. Supported codes: {list(SUPPORTED_LANGUAGES.keys()) + ['kha']}")

        # Check audio cache for rapid repeated playback
        cache_key = (code, text)
        with cls._lock:
            if cache_key in cls._audio_cache:
                cls._audio_cache.move_to_end(cache_key)
                logger.info(f"[Offline TTS] Audio cache hit for '{code}': {len(cls._audio_cache[cache_key])} bytes")
                return cls._audio_cache[cache_key]

        spec = SUPPORTED_LANGUAGES[code]
        engine = spec['engine']
        t0 = time.time()

        if engine == 'mms':
            import torch
            tok, model = cls._load_mms_model(spec['model_id'])
            inputs = tok(text, return_tensors="pt")
            with torch.no_grad():
                output = model(**inputs).waveform
            audio = output.squeeze().cpu().numpy()
            sr = model.config.sampling_rate

            buf = io.BytesIO()
            sf.write(buf, audio, sr, format='WAV', subtype='PCM_16')
            wav_bytes = buf.getvalue()

        elif engine == 'kala':
            import kala_tts
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp_path = tmp.name

            try:
                kala_tts.synthesize_to_file(text, tmp_path, speaker=spec['speaker'])
                with open(tmp_path, "rb") as f:
                    wav_bytes = f.read()
            finally:
                if os.path.exists(tmp_path):
                    try:
                        os.remove(tmp_path)
                    except Exception:
                        pass

        elif engine == 'sulabh':
            synth = cls._load_sulabh_synth()
            clean_ne_text = text.lower().replace(",", " ").replace(".", " ").strip()
            wav = synth.tts(text=clean_ne_text, speaker_name=spec['speaker'], language_name=spec['lang'])
            buf = io.BytesIO()
            sf.write(buf, wav, 22050, format='WAV', subtype='PCM_16')
            wav_bytes = buf.getvalue()

        else:
            raise RuntimeError(f"Unknown TTS engine '{engine}'")

        logger.info(f"[Offline TTS] Generated {spec['name']} audio in {time.time() - t0:.2f}s ({len(wav_bytes)} bytes)")

        # Store in capped LRU audio cache
        with cls._lock:
            if len(cls._audio_cache) >= cls.MAX_AUDIO_CACHE_ENTRIES:
                cls._audio_cache.popitem(last=False)
            cls._audio_cache[cache_key] = wav_bytes

        return wav_bytes
