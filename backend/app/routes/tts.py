import logging
from fastapi import APIRouter, Query, Response, HTTPException, status
from ..schemas import TTSRequest
from ..services.tts_service import TTSService, SUPPORTED_LANGUAGES

logger = logging.getLogger("memora_tts_route")

router = APIRouter(tags=["tts"])

MAX_TEXT_LENGTH = 500

def _handle_synthesis(text: str, language: str) -> bytes:
    cleaned_text = text.strip() if text else ""
    if not cleaned_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty or only whitespace."
        )

    if len(cleaned_text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Text exceeds maximum permitted length of {MAX_TEXT_LENGTH} characters."
        )

    lang_code = language.lower().split('-')[0].strip() if language else "en"
    if lang_code == "kha":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Khasi ('kha') currently has no open offline pretrained TTS model globally. Please use visual display or audio templates."
        )

    if not TTSService.is_language_supported(lang_code):
        supported_list = sorted(list(set(SUPPORTED_LANGUAGES.keys()) | {"kha"}))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language code '{language}'. Supported codes: {', '.join(supported_list)}"
        )

    try:
        wav_bytes = TTSService.generate_speech_wav(cleaned_text, lang_code)
        return wav_bytes
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"[TTS Error] Synthesis failed for lang='{lang_code}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Speech synthesis encountered an internal error. Please try again."
        )

@router.post("/tts")
async def synthesize_speech_root(request: TTSRequest):
    """
    Standard POST /tts endpoint returning 16-bit PCM WAV audio.
    """
    wav_bytes = _handle_synthesis(request.text, request.language)
    return Response(
        content=wav_bytes,
        media_type="audio/wav",
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": "inline; filename=speech.wav"
        }
    )

@router.post("/api/tts")
async def synthesize_speech_api(request: TTSRequest):
    """
    Alias POST /api/tts endpoint returning 16-bit PCM WAV audio.
    """
    return await synthesize_speech_root(request)

@router.get("/api/tts")
async def synthesize_speech_get(
    text: str = Query(..., description="Text to synthesize"),
    lang: str = Query("en", description="Language code")
):
    """
    Backward-compatible GET /api/tts endpoint returning 16-bit PCM WAV audio.
    """
    wav_bytes = _handle_synthesis(text, lang)
    return Response(
        content=wav_bytes,
        media_type="audio/wav",
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": "inline; filename=speech.wav"
        }
    )
