from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..schemas import AIRecommendationResponse
from ..services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/patients", tags=["recommendation"])

@router.get("/{patient_id}/recommendation", response_model=AIRecommendationResponse)
def get_recommendation(patient_id: str, db: Session = Depends(get_db)):
    analytics = AnalyticsService.calculate_patient_analytics(db, patient_id)
    rec_game = analytics["recommendedActivity"]
    rec_level = analytics["recommendedLevel"]

    return AIRecommendationResponse(
        recommendedGame=rec_game,
        recommendedLevel=rec_level,
        reason=f"Recommended activity targeting {analytics['practiceArea'].replace('_', ' ')} at comfortable Level {rec_level}.",
        confidence=0.86,
        isAiPowered=False
    )
