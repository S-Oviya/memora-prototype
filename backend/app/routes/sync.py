from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from ..db import get_db
from ..models import Patient, FamilyMember, Routine, MusicPreference, GameAttempt
from ..schemas import SyncBootstrapRequest
from ..services.analytics_service import GAME_COGNITIVE_SKILL_MAP

router = APIRouter(prefix="/api", tags=["sync"])

@router.get("/patients/{patient_id}/full")
def get_full_patient_data(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    family = db.query(FamilyMember).filter(FamilyMember.patient_id == patient_id).all()
    routines = db.query(Routine).filter(Routine.patient_id == patient_id).order_by(Routine.routine_order).all()
    music = db.query(MusicPreference).filter(MusicPreference.patient_id == patient_id).all()
    attempts = db.query(GameAttempt).filter(GameAttempt.patient_id == patient_id).order_by(GameAttempt.timestamp.desc()).all()

    return {
        "patient": patient,
        "familyMembers": family,
        "routines": routines,
        "musicTracks": music,
        "gameAttempts": [
            {
                "id": a.id,
                "patientId": a.patient_id,
                "gameId": a.game_id,
                "cognitiveSkill": a.cognitive_skill,
                "level": a.level,
                "score": a.score,
                "mistakesCount": a.mistakes_count,
                "success": a.success,
                "timeTakenSeconds": a.time_taken_seconds,
                "timestamp": a.timestamp.isoformat()
            } for a in attempts
        ]
    }

@router.post("/sync/bootstrap")
def sync_bootstrap(payload: SyncBootstrapRequest, db: Session = Depends(get_db)):
    count = db.query(Patient).count()
    if count > 0:
        return {"status": "already_initialized", "message": "Database already contains patient data"}

    if payload.patient:
        p_data = payload.patient
        p = Patient(
            id=p_data.get("id", "patient-ramesh-1"),
            name=p_data.get("name", "Ramesh Chandra Baruah"),
            age=p_data.get("age", 72),
            dementia_type=p_data.get("dementiaType", "Alzheimer's Disease (Early-to-Mild)"),
            dementia_stage=p_data.get("dementiaStage", "mild"),
            preferred_language=p_data.get("preferredLanguage", "as"),
            notes=p_data.get("notes", "")
        )
        db.add(p)
        db.commit()

    return {"status": "ok", "message": "Bootstrapped successfully"}
