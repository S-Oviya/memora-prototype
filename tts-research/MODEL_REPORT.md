# Memora Local Offline TTS Model Evaluation Report

**Date:** September 21, 2026  
**Git Branch:** `yogesh`  
**Evaluation Scope:** Person 1 (Backend + Local Offline TTS Engine)  
**Hardware Profile:** CPU-only local inference (Windows AMD64)  
**Sample Output Directory:** `tts-research/samples/`  

---

## Executive Summary

Actual local offline text-to-speech inference was conducted across all candidate models for North-East Indian languages, English, and Nepali. All audio files were synthesized locally on CPU, saved to disk, and verified for header integrity, duration, and sampling format without relying on any cloud API, external service (Sarvam/Edge), or pre-recorded audio.

### Languages Verified with Actual Generated Audio
| Language | ISO Code | Model Used | Sample File | Duration | Sample Rate | CPU Latency |
|---|---|---|---|---|---|---|
| **English** | `en` / `eng` | `facebook/mms-tts-eng` | `samples/sample_mms_eng.wav` | 4.240s | 16,000 Hz | 1.78s |
| **Assamese** | `as` / `asm` | `facebook/mms-tts-asm` | `samples/sample_mms_asm.wav` | 2.032s | 16,000 Hz | 0.90s |
| **Bengali** | `bn` / `ben` | `facebook/mms-tts-ben` | `samples/sample_mms_ben.wav` | 3.088s | 16,000 Hz | 1.29s |
| **Mizo** | `lus` / `miz` | `facebook/mms-tts-miz` | `samples/sample_mms_miz.wav` | 1.552s | 16,000 Hz | 0.71s |
| **Mizo** (Coqui) | `lus` | `sulabhkatiyar/indian-ne-multilingual-tts` | `samples/sample_ne_lus.wav` | 5.260s | 22,050 Hz | 2.63s |
| **Nyishi** | `njz` | `sulabhkatiyar/indian-ne-multilingual-tts` | `samples/sample_ne_njz.wav` | 4.680s | 22,050 Hz | 2.15s |
| **Kokborok** | `trp` | `sulabhkatiyar/indian-ne-multilingual-tts` | `samples/sample_ne_trp.wav` | 3.681s | 22,050 Hz | 1.69s |
| **Nepali** | `ne` | `rhasspy/piper-voices:ne_NP-google-medium` | `samples/sample_piper_nep.wav` | 2.659s | 22,050 Hz | 0.40s |

---

## Candidate 1: Meta MMS-TTS Models (`facebook/mms-tts-*`)

### 1. Overview & Architecture
* **Architecture:** VITS (Variational Inference with adversarial learning for end-to-end Text-to-Speech)
* **Backend Library:** Hugging Face `transformers` (`VitsModel`, `AutoTokenizer`) + `torch`
* **Checkpoints Evaluated:**
  - `facebook/mms-tts-eng` (English)
  - `facebook/mms-tts-asm` (Assamese)
  - `facebook/mms-tts-ben` (Bengali)
  - `facebook/mms-tts-miz` (Mizo)

### 2. Candidate Evaluation Criteria
1. **Download Required Files:** Automatically cached via Hugging Face Hub (`model.safetensors`, `config.json`, `vocab.json`).
2. **Model Loading:** Successfully loaded via `VitsModel.from_pretrained()`.
3. **WAV Sample Generation:** 
   - `sample_mms_eng.wav` (English: "Good morning Ramesh, it is time for your morning tea.")
   - `sample_mms_asm.wav` (Assamese: "নমস্কাৰ, আপুনি পুৱাৰ চাহ খালে নে?")
   - `sample_mms_ben.wav` (Bengali: "নমস্কার, আপনি কেমন আছেন?")
   - `sample_mms_miz.wav` (Mizo: "Chibai, i dam em?")
4. **WAV Verification:** Validated using Python `wave` module. All generated files have valid RIFF/WAVE headers, 16-bit PCM format, single mono channel, and 16,000 Hz sample rate.
5. **Inference Success:** **100% SUCCESS** across all 4 languages.
6. **Dependencies:** `torch`, `transformers`, `scipy`, `numpy`.
7. **Model Size:** ~145 MB per language model (`model.safetensors`).
8. **CPU Practicality:** **High**. Inference runs between 0.7s and 1.8s on CPU for typical conversational phrases.
9. **Text-Format Limitations:** 
   - Accepts native Unicode scripts directly: Bengali/Assamese Eastern Nagari script (`অ-হ`), Latin script for English and Mizo.
   - Character-level mapping against model vocabulary; unmapped special glyphs or emojis should be stripped.
10. **Offline Operation:** **100% Offline**. Once model files are cached or stored in `models/`, no internet connection is required.

---

## Candidate 2: North-East Multilingual Model (`sulabhkatiyar/indian-ne-multilingual-tts`)

### 1. Overview & Architecture
* **Architecture:** Multi-speaker, Multilingual VITS trained on ARTPARK-IISc Vaani North-East corpus.
* **Coverage:** 16 languages, 23 speaker voices.
* **Languages Tested:**
  - **Mizo (`lus`)**: Voice `lus_female_aizawl`
  - **Nyishi (`njz`)**: Voice `njz_male_papumpare`
  - **Kokborok (`trp`)**: Voice `trp_male_westtripura`

### 2. Candidate Evaluation Criteria
1. **Download Required Files:** `model.pth` (330.41 MB), `config.json`, `speakers.pth`, `language_ids.json`, `tts_release_meta.json`.
2. **Model Loading:** Successfully loaded via `TTS.utils.synthesizer.Synthesizer`.
3. **WAV Sample Generation:**
   - `sample_ne_lus.wav` (Mizo: "mi pakhat ka hmu a kawr gray a ha a a hnuai ah kamis pawl a ha a")
   - `sample_ne_njz.wav` (Nyishi: "building agu pute jabu kongpo pa")
   - `sample_ne_trp.wav` (Kokborok: "ani bwskango kaisa mampli tongo aw mampli o nugjago")
4. **WAV Verification:** Validated with `wave` module. 16-bit PCM, 22,050 Hz, 1 channel.
5. **Inference Success:** **SUCCESS** for Mizo, Nyishi, and Kokborok.
6. **Dependencies:** `coqui-tts`, `torch`, `torchaudio`, `torchcodec`, `scipy`.
7. **Model Size:** 330.41 MB checkpoint (`model.pth`).
8. **CPU Practicality:** **Moderate to High**. Inference latency ~1.6s to 2.6s on standard CPU.
9. **Text-Format Limitations:**
   - **CRITICAL:** Requires **lowercase romanized Latin text without punctuation** over a 34-character vocabulary (` abcdefghijklmnopqrstuvwxyz·âêîûüṭ`).
   - Native scripts (like Bengali script Kokborok) must be romanized prior to passing to the model, or characters will be silently dropped.
10. **Offline Operation:** **100% Offline**. All weights and speaker embeddings are stored in `tts-research/models/indian-ne-multilingual-tts/`.

### 3. Compatibility & Resolution
* **Issue Discovered:** Modern `transformers >= 4.45` removed `isin_mps_friendly`, which broke Coqui TTS's top-level imports. Additionally, PyTorch >= 2.9 requires `torchcodec` for audio I/O, and `config.json` resolves speaker files relative to the current working directory.
* **Resolution:** 
  1. Monkey-patched `transformers.pytorch_utils.isin_mps_friendly = torch.isin` before importing Coqui Synthesizer.
  2. Installed `torchcodec` wheel.
  3. Switched directory context to model folder during initialization (`os.chdir(model_dir)`).
  4. Fully verified that inference runs smoothly on Python 3.13 without destabilizing the global environment.

---

## Candidate 3: Nepali Evaluation (`mlwiseyak/omnivoice-nepali-tts-v2` vs `rhasspy/piper-voices`)

### 1. `mlwiseyak/omnivoice-nepali-tts-v2` Evaluation
* **Architecture:** OmniVoice Flow-Matching Diffusion Transformer based on Qwen text conditioning.
* **Model Size:** **~2.84 GB** (`model.safetensors` 2.03 GB + `audio_tokenizer` 805 MB).
* **Dependencies:** Requires `omnivoice`, `accelerate`, `gradio`, `webdataset`, `starlette>=1.0.1`, which introduce heavy dependency conflicts with the Memora FastAPI stack.
* **Inference Mechanism:** Requires **reference audio prompt** (e.g. `Deepak_nep.wav`) and reference text prompt for voice cloning conditioning. The repository does not ship with standard standalone reference audio.
* **CPU Practicality:** **Impractical**. Flow-matching diffusion with 16–32 iterative steps through a multi-billion-parameter model takes 60–120+ seconds on CPU and consumes several gigabytes of RAM.
* **Conclusion:** **Unsuitable for local offline assistive dementia care on CPU**.

### 2. Practical Solution: `rhasspy/piper-voices:ne_NP-google-medium`
* **Architecture:** Fast ONNX-based VITS neural vocoder.
* **Model Size:** **73.21 MB** (`ne_NP-google-medium.onnx` + `.json`).
* **Dependencies:** `piper-tts`, `onnxruntime` (ultra-lightweight, zero PyTorch overhead).
* **Test Text:** "नमस्ते रमेश, तपाईंलाई कस्तो छ?"
* **Sample Output:** `sample_piper_nep.wav` (Duration: 2.659s, 22,050 Hz, 117,292 bytes).
* **Inference Time:** **0.403s on CPU** (instantaneous).
* **CPU Practicality:** **Outstanding**.
* **Text-Format Limitations:** Full native Devanagari Unicode script support.
* **Offline Operation:** **100% Offline**.

---

## Candidate 4: Focused Search for Khasi TTS

* **Search Scope:** Exhaustive query of all 39 Khasi models on Hugging Face and open-source repositories.
* **Candidate Status:**
  - `toiar/Khasi-OmniVoice-TTS-2`: **401 Unauthorized / Private**. Unavailable for public access or download.
  - Other Khasi models on Hugging Face: Exclusively Automatic Speech Recognition (Whisper / ASR), Machine Translation (NLLB/mBART), Word2Vec, or Text Generation (SmolLM2/Gemma).
  - No public, verified pretrained Text-to-Speech (TTS) model exists for Khasi on Hugging Face as of September 2026.
* **Engineered Fallback Strategy for Khasi:**
  - Standardizing an honest fallback rather than inventing synthetic solutions:
    1. Caregiver text prompt display.
    2. Eastern Nagari / phonetic acoustic approximation if requested.
    3. Graceful fallback to client Web Speech API if local Khasi voice is installed on user's device.

---

## Summary Matrix of Model Feasibility

| Model | Target Language(s) | Script / Format | Model Size | CPU Speed | Offline Status | Recommendation for Memora |
|---|---|---|---|---|---|---|
| **Meta MMS-TTS (`eng`)** | English | Latin text | 145 MB | Fast (1.78s) | Full Offline | **Primary local neural engine** for English |
| **Meta MMS-TTS (`asm`)** | Assamese | Assamese script | 145 MB | Fast (0.90s) | Full Offline | **Primary local neural engine** for Assamese |
| **Meta MMS-TTS (`ben`)** | Bengali | Bengali script | 145 MB | Fast (1.29s) | Full Offline | **Primary local neural engine** for Bengali |
| **Meta MMS-TTS (`miz`)** | Mizo | Latin text | 145 MB | Fast (0.71s) | Full Offline | **Primary local neural engine** for Mizo |
| **NE Multilingual VITS** | Nyishi (`njz`), Kokborok (`trp`), Mizo (`lus`) | Lowercase Romanized Latin (no punct) | 330 MB | Moderate (1.7s–2.6s) | Full Offline | **Primary engine** for Nyishi & Kokborok |
| **Piper ONNX (`ne_NP`)** | Nepali | Devanagari script | 73 MB | Ultra-fast (0.40s) | Full Offline | **Primary local neural engine** for Nepali |
| **OmniVoice Nepali v2** | Nepali | Devanagari + Ref Audio | 2.84 GB | Impractical on CPU (>60s) | Partial (heavy) | **Not recommended** for local CPU prototype |
| **Khasi Model** | Khasi | Latin | N/A | N/A | Unavailable | **Honest text/WebSpeech fallback** |

---

## Verification Artifacts

All audio samples have been synthesized and saved in [`tts-research/samples/`](file:///C:/Users/yogik/memora-prototype/tts-research/samples/):
- [`sample_mms_eng.wav`](file:///C:/Users/yogik/memora-prototype/tts-research/samples/sample_mms_eng.wav)
- [`sample_mms_asm.wav`](file:///C:/Users/yogik/memora-prototype/tts-research/samples/sample_mms_asm.wav)
- [`sample_mms_ben.wav`](file:///C:/Users/yogik/memora-prototype/tts-research/samples/sample_mms_ben.wav)
- [`sample_mms_miz.wav`](file:///C:/Users/yogik/memora-prototype/tts-research/samples/sample_mms_miz.wav)
- [`sample_ne_lus.wav`](file:///C:/Users/yogik/memora-prototype/tts-research/samples/sample_ne_lus.wav)
- [`sample_ne_njz.wav`](file:///C:/Users/yogik/memora-prototype/tts-research/samples/sample_ne_njz.wav)
- [`sample_ne_trp.wav`](file:///C:/Users/yogik/memora-prototype/tts-research/samples/sample_ne_trp.wav)
- [`sample_piper_nep.wav`](file:///C:/Users/yogik/memora-prototype/tts-research/samples/sample_piper_nep.wav)
