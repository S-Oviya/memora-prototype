from pydantic import BaseModel, Field

class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to speak")
    language: str = Field(..., description="Language code (e.g. en, as, bn, ne, miz, lus, njz, trp)")

class TTSErrorResponse(BaseModel):
    detail: str
