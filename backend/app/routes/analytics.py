from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..auth import verify_patient_exists
from ..schemas import CognitiveAnalyticsResponse
from ..services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/patients", tags=["analytics"])

@router.get("/{patient_id}/analytics", response_model=CognitiveAnalyticsResponse)
def get_analytics(patient_id: str, db: Session = Depends(get_db)):
    verify_patient_exists(patient_id, db)
    result = AnalyticsService.calculate_patient_analytics(db, patient_id)
    return result
