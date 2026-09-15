from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..schemas import AICaregiverInsightResponse
from ..services.ai_service import AIService

router = APIRouter(prefix="/api/patients", tags=["insights"])

@router.get("/{patient_id}/caregiver-insights", response_model=AICaregiverInsightResponse)
async def get_caregiver_insights(
    patient_id: str,
    lang: str = Query("en", description="Target language code (e.g. en, as, bn, ne)"),
    db: Session = Depends(get_db)
):
    insight = await AIService.get_caregiver_insights(db, patient_id, lang=lang)
    return insight
