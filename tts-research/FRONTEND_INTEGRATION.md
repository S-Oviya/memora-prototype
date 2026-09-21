# Memora Backend Offline TTS - Frontend Integration Guide

**Document Purpose:** Handoff documentation for Person 2 (Frontend Developer) to connect Memora's React UI (e.g. the "Listen" button in `audioService.ts` and activity components) to the local offline TTS backend.

**Backend Branch:** `yogesh`  
**Backend Base URL:** `http://localhost:8000` (or `http://127.0.0.1:8000`)  
**Network Requirement:** **100% Offline**. The backend requires zero internet access during runtime.

---

## 1. Primary API Endpoint Specification

### `POST /tts`
Synthesizes speech on the local CPU from text tokens and returns raw 16-bit PCM WAV audio.

* **URL Path:** `/tts`
* **HTTP Method:** `POST`
* **Headers:**
  ```http
  Content-Type: application/json
  Accept: audio/wav
  ```

---

## 2. Request Payload (JSON)

The request body must be a JSON object with `text` and `language` fields:

```json
{
  "text": "Good morning Ramesh, it is time for morning tea.",
  "language": "en"
}
```

### Request Fields:
| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `text` | `string` | **Yes** | Text utterance to synthesize | Must not be empty or whitespace only. |
| `language` | `string` | **Yes** | Language code identifier | Must be one of the verified supported language codes. Case-insensitive. |

---

## 3. Response Specification

### Successful Response:
* **HTTP Status:** `200 OK`
* **Content-Type:** `audio/wav`
* **Headers:**
  - `Content-Disposition: inline; filename=speech.wav`
  - `Cache-Control: public, max-age=86400`
* **Body:** Binary audio stream (standard 16-bit uncompressed linear PCM RIFF/WAV).

### Audio Format Details:
* **Container:** WAV (`RIFF....WAVE`)
* **Encoding:** 16-bit linear PCM (signed integer, little-endian)
* **Channels:** 1 (Mono)
* **Sample Rate:**
  - `16,000 Hz` for MMS models (English, Assamese, Bengali, Mizo)
  - `22,050 Hz` for Piper ONNX (Nepali) and Coqui NE (Nyishi, Kokborok, Mizo-Lushai)
* **Browser Compatibility:** Natively playable via standard HTML5 `<audio>` element or `new Audio(objectUrl)`. No external codecs, WebAssembly, or transcoding required.

---

## 4. Supported Language Codes & Model Mapping

| Language | Verified Code(s) | Underlying Offline Model | Script / Input Format | Latency (CPU) |
|---|---|---|---|---|
| **English** | `en`, `eng` | `facebook/mms-tts-eng` | Standard English text | ~1.5s – 2.0s |
| **Assamese** | `as`, `asm` | `facebook/mms-tts-asm` | Eastern Nagari / Assamese script (`নমস্কাৰ`) | ~1.0s – 1.8s |
| **Bengali** | `bn`, `ben` | `facebook/mms-tts-ben` | Eastern Nagari / Bengali script (`নমস্কার`) | ~1.2s – 1.9s |
| **Nepali** | `ne`, `nep`, `npi` | `rhasspy/piper-voices` (`ne_NP-google-medium`) | Native Devanagari script (`नमस्ते`) | ~0.35s – 0.5s |
| **Mizo** | `miz` | `facebook/mms-tts-miz` (Meta MMS) | Latin text | ~0.7s – 1.4s |
| **Mizo** (Alternative) | `lus` | `sulabhkatiyar/indian-ne-multilingual-tts` (`lus`) | Lowercase Romanized Latin | ~1.8s |
| **Nyishi** | `njz` | `sulabhkatiyar/indian-ne-multilingual-tts` (`njz`) | Lowercase Romanized Latin | ~1.8s |
| **Kokborok** | `trp` | `sulabhkatiyar/indian-ne-multilingual-tts` (`trp`) | Lowercase Romanized Latin | ~1.6s |

*Tip: For Nepali, synthesis runs via Piper ONNX and is ultra-fast (<0.5s on CPU). All models stay cached in memory after the first request, so repeated phrases experience zero model reload overhead.*

---

## 5. Error Responses & Handling

The backend returns standard HTTP error status codes with JSON error details:

### 1. `400 Bad Request` — Empty Text
Occurs if `text` is empty or contains only spaces.
```json
{
  "detail": "Text cannot be empty or whitespace only"
}
```

### 2. `400 Bad Request` — Unsupported Language Code
Occurs if the requested language is unverified or unavailable.
```json
{
  "detail": "Unsupported language code 'fr'. Verified supported languages: as, asm, ben, bn, en, eng, lus, miz, ne, nep, njz, npi, trp"
}
```

### 3. `422 Unprocessable Entity` — Missing Fields or Invalid JSON
Occurs if the request body is missing required properties or is not valid JSON.
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "text"],
      "msg": "Field required"
    }
  ]
}
```

### 4. `500 Internal Server Error` — Synthesis Failure
```json
{
  "detail": "TTS synthesis failed: <error message>"
}
```

---

## 6. Frontend Integration Examples (React / TypeScript)

### Option A: Direct Fetch & Audio Playback (Recommended for `audioService.ts`)

```typescript
/**
 * Synthesizes and plays speech using the local offline backend.
 * Falls back to browser Web Speech API if the backend is offline or language is unsupported.
 */
export async function playOfflineTTS(text: string, lang: string = 'en'): Promise<void> {
  if (!text || !text.trim()) return;

  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
  const targetUrl = `${apiBase}/tts`;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/wav',
      },
      body: JSON.stringify({
        text: text.trim(),
        language: lang.toLowerCase().trim(),
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS HTTP ${response.status}: ${await response.text()}`);
    }

    // Convert binary WAV stream to playable audio URL
    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl); // Clean up memory
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        reject(e);
      };
      audio.play().catch(reject);
    });

  } catch (err) {
    console.warn(`[Memora TTS] Offline backend speech synthesis failed for '${lang}', falling back to browser speech:`, err);
    // Graceful fallback to browser window.speechSynthesis
    fallbackBrowserSpeech(text, lang);
  }
}

function fallbackBrowserSpeech(text: string, lang: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85; // Slower, calm pacing for dementia care
    window.speechSynthesis.speak(utterance);
  }
}
```

### Option B: Pre-fetching Audio Blob URL for Reusable Buttons

```typescript
export async function getTTSAudioBlobUrl(text: string, lang: string): Promise<string | null> {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
  try {
    const response = await fetch(`${apiBase}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: lang }),
    });

    if (!response.ok) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
```

---

## 7. Backward Compatibility: `GET /api/tts`

For zero breaking changes, the existing GET route remains active and now delegates directly to the local offline engine:

```text
GET /api/tts?text=Good+morning+Ramesh&lang=en
```

Returns `audio/wav` with status `200 OK`. However, **`POST /tts` is the preferred primary contract** because it avoids URL query string encoding limits for longer dementia routine prompts.

---

## 8. Languages Status & Recommendations

### Verified Languages (Ready for Production Offline Use):
* **English (`en`)**: Meta MMS VITS.
* **Assamese (`as`)**: Meta MMS VITS (supports authentic Eastern Nagari characters `নমস্কাৰ`, `দেউতা`, `ৰ`, `ৱ`).
* **Bengali (`bn`)**: Meta MMS VITS (supports Bengali Eastern Nagari `নমস্কার`).
* **Nepali (`ne`)**: Piper ONNX (supports native Devanagari script, sub-second latency).
* **Mizo (`miz` / `lus`)**: Dual-engine support via Meta MMS and NE-TTS.
* **Nyishi (`njz`)**: Coqui NE-TTS.
* **Kokborok (`trp`)**: Coqui NE-TTS.

### Unavailable / Unverified Languages:
* **Khasi (`kha`)**:
  - **Status:** **Unavailable**. Thorough investigation of all 39 Khasi models on Hugging Face confirmed that no public pretrained Text-to-Speech model currently exists (`toiar/Khasi-OmniVoice-TTS-2` returned 401 Unauthorized / Private).
  - **Frontend Recommendation:**
    1. Display visual text guidance in the caregiver card.
    2. Gracefully fall back to browser Web Speech API (`SpeechSynthesisUtterance`).

---

## 9. Important Limitations & Guidance for Caregiver UX

1. **Elderly Pacing**:
   - The models synthesize at natural speaking rates. When playing via `new Audio()`, you can optionally adjust `audio.playbackRate = 0.9` if elderly users require slightly slower cadence.
2. **Text Normalization for Nyishi (`njz`) & Kokborok (`trp`)**:
   - The NE multilingual model front-end is character-level over a 34-character Latin vocabulary (` abcdefghijklmnopqrstuvwxyz·âêîûüṭ`).
   - If sending Nyishi or Kokborok, ensure text is romanized Latin. The backend will automatically strip punctuation and lowercase it.
3. **Memory Cleanup**:
   - When generating multiple audio previews with `URL.createObjectURL(blob)`, always call `URL.revokeObjectURL(url)` on audio `ended` or component unmount to prevent browser memory leaks.
