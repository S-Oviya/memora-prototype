import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import time
import json
import wave
import numpy as np

# Monkey-patch modern transformers for Coqui TTS compatibility
import transformers.pytorch_utils
import torch
transformers.pytorch_utils.isin_mps_friendly = torch.isin

from huggingface_hub import snapshot_download
from TTS.utils.synthesizer import Synthesizer

RESEARCH_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(RESEARCH_DIR, "models", "indian-ne-multilingual-tts")
SAMPLES_DIR = os.path.join(RESEARCH_DIR, "samples")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(SAMPLES_DIR, exist_ok=True)

TEST_CASES = [
    {
        "lang": "Mizo",
        "iso": "lus",
        "speaker": "lus_female_aizawl",
        "text": "mi pakhat ka hmu a kawr gray a ha a a hnuai ah kamis pawl a ha a",
        "out_file": os.path.join(SAMPLES_DIR, "sample_ne_lus.wav")
    },
    {
        "lang": "Nyishi",
        "iso": "njz",
        "speaker": "njz_male_papumpare",
        "text": "building agu pute jabu kongpo pa",
        "out_file": os.path.join(SAMPLES_DIR, "sample_ne_njz.wav")
    },
    {
        "lang": "Kokborok",
        "iso": "trp",
        "speaker": "trp_male_westtripura",
        "text": "ani bwskango kaisa mampli tongo aw mampli o nugjago",
        "out_file": os.path.join(SAMPLES_DIR, "sample_ne_trp.wav")
    }
]

print("=== Downloading/Verifying indian-ne-multilingual-tts weights ===")
t_dl0 = time.time()
model_dir = snapshot_download(
    repo_id="sulabhkatiyar/indian-ne-multilingual-tts",
    local_dir=MODELS_DIR,
    allow_patterns=["model.pth", "config.json", "speakers.pth", "language_ids.json", "tts_release_meta.json"]
)
t_dl1 = time.time()
print(f"Download/cache check completed in {round(t_dl1 - t_dl0, 2)}s")

checkpoint_path = os.path.join(model_dir, "model.pth")
config_path = os.path.join(model_dir, "config.json")
speakers_path = os.path.join(model_dir, "speakers.pth")
language_ids_path = os.path.join(model_dir, "language_ids.json")

model_size_mb = round(os.path.getsize(checkpoint_path) / (1024 * 1024), 2)
print(f"Model checkpoint size: {model_size_mb} MB")

# config.json resolves speakers.pth and language_ids.json relative to cwd
orig_cwd = os.getcwd()
os.chdir(model_dir)

print("\n=== Initializing Coqui Synthesizer ===")
t_load0 = time.time()
synth = Synthesizer(
    tts_checkpoint="model.pth",
    tts_config_path="config.json",
    tts_speakers_file="speakers.pth",
    tts_languages_file="language_ids.json",
    use_cuda=False
)
t_load1 = time.time()
load_time = round(t_load1 - t_load0, 2)
print(f"Model loaded successfully in {load_time}s")

results = []

for tc in TEST_CASES:
    lang = tc["lang"]
    iso = tc["iso"]
    speaker = tc["speaker"]
    text = tc["text"]
    out_file = tc["out_file"]
    
    print(f"\n------------------------------------------")
    print(f"Testing {lang} (ISO: {iso}, Speaker: {speaker})")
    print(f"Input text: '{text}'")
    
    rec = {
        "model_id": "sulabhkatiyar/indian-ne-multilingual-tts",
        "language": lang,
        "iso": iso,
        "speaker": speaker,
        "input_text": text,
        "output_file": out_file,
        "model_size_mb": model_size_mb,
        "load_time_sec": load_time,
        "inference_time_sec": None,
        "audio_duration_sec": None,
        "file_size_bytes": None,
        "is_valid_wav": False,
        "success": False,
        "error": None
    }
    
    try:
        t_inf0 = time.time()
        # Coqui Synthesizer.tts accepts speaker_name and language_name
        wav = synth.tts(text=text, speaker_name=speaker, language_name=iso)
        t_inf1 = time.time()
        rec["inference_time_sec"] = round(t_inf1 - t_inf0, 3)
        print(f"Inference completed in {rec['inference_time_sec']}s")
        
        # Save WAV
        synth.save_wav(wav, out_file)
        rec["file_size_bytes"] = os.path.getsize(out_file)
        
        # Validate WAV
        with wave.open(out_file, "rb") as wf:
            channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            nframes = wf.getnframes()
            duration = nframes / float(framerate)
            
            rec["is_valid_wav"] = (channels > 0 and nframes > 0 and framerate > 0)
            rec["audio_duration_sec"] = round(duration, 3)
            rec["channels"] = channels
            rec["sample_rate"] = framerate
            
        rec["success"] = True
        print(f"SUCCESS: {out_file} (Duration: {rec['audio_duration_sec']}s, Rate: {framerate}Hz, Valid: {rec['is_valid_wav']})")
        
    except Exception as e:
        rec["error"] = str(e)
        print(f"FAILED for {lang}: {e}")
        
    results.append(rec)

results_json = os.path.join(RESEARCH_DIR, "indian_ne_results.json")
with open(results_json, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\nAll results written to {results_json}")
