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
import torch
import scipy.io.wavfile
from transformers import VitsModel, AutoTokenizer

CANDIDATES = [
    {
        "model_id": "facebook/mms-tts-eng",
        "lang": "English",
        "code": "eng",
        "text": "Good morning Ramesh, it is time for your morning tea."
    },
    {
        "model_id": "facebook/mms-tts-asm",
        "lang": "Assamese",
        "code": "asm",
        "text": "নমস্কাৰ, আপুনি পুৱাৰ চাহ খালে নে?"
    },
    {
        "model_id": "facebook/mms-tts-ben",
        "lang": "Bengali",
        "code": "ben",
        "text": "নমস্কার, আপনি কেমন আছেন?"
    },
    {
        "model_id": "facebook/mms-tts-miz",
        "lang": "Mizo",
        "code": "miz",
        "text": "Chibai, i dam em?"
    }
]

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")
os.makedirs(SAMPLES_DIR, exist_ok=True)

results = []

for c in CANDIDATES:
    model_id = c["model_id"]
    code = c["code"]
    lang = c["lang"]
    text = c["text"]
    out_wav = os.path.join(SAMPLES_DIR, f"sample_mms_{code}.wav")
    
    print(f"\n==========================================")
    print(f"Testing {lang} ({model_id})...")
    print(f"Input text: {text}")
    
    record = {
        "model_id": model_id,
        "language": lang,
        "code": code,
        "input_text": text,
        "output_file": out_wav,
        "success": False,
        "error": None,
        "load_time_sec": None,
        "inference_time_sec": None,
        "sample_rate": None,
        "audio_duration_sec": None,
        "file_size_bytes": None,
        "is_valid_wav": False
    }
    
    try:
        t0 = time.time()
        print(f"Loading tokenizer for {model_id}...")
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        print(f"Loading model weights for {model_id}...")
        model = VitsModel.from_pretrained(model_id)
        model.eval()
        t1 = time.time()
        record["load_time_sec"] = round(t1 - t0, 3)
        print(f"Loaded in {record['load_time_sec']}s")
        
        # Inference
        t2 = time.time()
        inputs = tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            output = model(**inputs).waveform
        t3 = time.time()
        record["inference_time_sec"] = round(t3 - t2, 3)
        print(f"Inference complete in {record['inference_time_sec']}s")
        
        # Audio conversion to standard 16-bit PCM WAV
        waveform = output.squeeze().cpu().numpy()
        sample_rate = model.config.sampling_rate
        record["sample_rate"] = sample_rate
        
        waveform_norm = np.clip(waveform, -1.0, 1.0)
        pcm_data = (waveform_norm * 32767.0).astype(np.int16)
        scipy.io.wavfile.write(out_wav, rate=sample_rate, data=pcm_data)
        record["file_size_bytes"] = os.path.getsize(out_wav)
        
        # Verify WAV
        with wave.open(out_wav, "rb") as wf:
            channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            nframes = wf.getnframes()
            duration = nframes / float(framerate)
            
            record["is_valid_wav"] = (channels > 0 and nframes > 0 and framerate > 0)
            record["audio_duration_sec"] = round(duration, 3)
            record["channels"] = channels
            record["sample_width"] = sampwidth
            
        record["success"] = True
        print(f"SUCCESS: {out_wav} (Duration: {record['audio_duration_sec']}s, Size: {record['file_size_bytes']} bytes, Valid WAV: {record['is_valid_wav']})")
        
    except Exception as e:
        record["error"] = str(e)
        print(f"FAILED for {model_id}: {e}")
        
    results.append(record)

results_json_path = os.path.join(os.path.dirname(__file__), "mms_results.json")
with open(results_json_path, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\nResults saved to {results_json_path}")
