import io
import wave
from fastapi import APIRouter, HTTPException, Response, Request, status
from fastapi.exceptions import RequestValidationError
from .schemas import TTSRequest
from .engine import tts_engine, LANGUAGE_MAPPING

router = APIRouter(tags=["tts"])

@router.post("/tts", response_class=Response)
async def synthesize_speech(payload: TTSRequest):
    """
    Synthesize speech offline using locally verified neural TTS models.
    Returns 16-bit PCM audio/wav bytes.
    """
    text = (payload.text or "").strip()
    language = (payload.language or "").strip().lower()

    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty or whitespace only"
        )

    if language not in LANGUAGE_MAPPING:
        supported_langs = ", ".join(sorted(LANGUAGE_MAPPING.keys()))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language code '{payload.language}'. Verified supported languages: {supported_langs}"
        )

    try:
        wav_bytes = tts_engine.synthesize_wav_bytes(text=text, language=language)
        
        # Verify valid WAV format
        with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
            framerate = wf.getframerate()
            nframes = wf.getnframes()
            if nframes == 0 or framerate == 0:
                raise ValueError("Synthesizer produced empty or corrupt audio")

        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "inline; filename=speech.wav",
                "Cache-Control": "public, max-age=86400"
            }
        )
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        print(f"[Memora TTS Error] {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"TTS synthesis failed: {str(e)}"
        )

@router.get("/tts/languages")
def get_supported_languages():
    """Returns list of supported offline TTS language codes and display names."""
    return {
        "supported_languages": tts_engine.get_supported_languages()
    }
