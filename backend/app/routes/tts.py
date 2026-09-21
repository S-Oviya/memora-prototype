from fastapi import APIRouter, Query, Response, HTTPException
from ..services.tts_service import TTSService

router = APIRouter(prefix="/api/tts", tags=["tts"])

@router.get("")
async def generate_speech(
    text: str = Query(..., description="Text to speak"),
    lang: str = Query("en", description="Language code: en, as, bn, ne")
):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    audio_bytes = await TTSService.generate_speech_mp3(text, lang)
    if not audio_bytes:
        raise HTTPException(
            status_code=404,
            detail=f"Neural voice not available for language '{lang}'. Frontend will fall back to text gracefully."
        )

    is_wav = audio_bytes.startswith(b"RIFF")
    media_type = "audio/wav" if is_wav else "audio/mpeg"
    filename = "speech.wav" if is_wav else "speech.mp3"

    return Response(
        content=audio_bytes,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": f"inline; filename={filename}"
        }
    )
