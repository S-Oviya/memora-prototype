import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import GameAttempt, Patient
from ..schemas import GameAttemptCreate, GameAttemptResponse
from ..services.analytics_service import GAME_COGNITIVE_SKILL_MAP

router = APIRouter(prefix="/api/patients", tags=["attempts"])

@router.get("/{patient_id}/attempts", response_model=List[GameAttemptResponse])
def get_patient_attempts(patient_id: str, db: Session = Depends(get_db)):
    attempts = db.query(GameAttempt).filter(
        GameAttempt.patient_id == patient_id
    ).order_by(GameAttempt.timestamp.desc()).all()

    out = []
    for a in attempts:
        skills = a.cognitive_skills.split(',') if a.cognitive_skills else []
        out.append(GameAttemptResponse(
            id=a.id,
            patientId=a.patient_id,
            gameId=a.game_id,
            cognitiveSkill=a.cognitive_skill,
            cognitiveSkills=skills,
            level=a.level,
            score=a.score,
            mistakesCount=a.mistakes_count,
            success=a.success,
            timeTakenSeconds=a.time_taken_seconds,
            timestamp=a.timestamp.isoformat() if isinstance(a.timestamp, datetime) else str(a.timestamp)
        ))
    return out

@router.post("/{patient_id}/attempts", response_model=GameAttemptResponse)
def record_attempt(patient_id: str, attempt_in: GameAttemptCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        # Create minimal patient placeholder if not exists
        patient = Patient(id=patient_id, name="Patient", age=70)
        db.add(patient)
        db.commit()

    skill = attempt_in.cognitive_skill or GAME_COGNITIVE_SKILL_MAP.get(attempt_in.game_id, "problem_solving")
    skills_str = ",".join(attempt_in.cognitive_skills) if attempt_in.cognitive_skills else skill

    new_attempt = GameAttempt(
        id=f"att-{int(datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4]}",
        patient_id=patient_id,
        game_id=attempt_in.game_id,
        cognitive_skill=skill,
        cognitive_skills=skills_str,
        level=attempt_in.level,
        score=attempt_in.score,
        mistakes_count=attempt_in.mistakes_count,
        success=attempt_in.success,
        time_taken_seconds=attempt_in.time_taken_seconds,
        timestamp=datetime.utcnow()
    )

    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)

    return GameAttemptResponse(
        id=new_attempt.id,
        patientId=new_attempt.patient_id,
        gameId=new_attempt.game_id,
        cognitiveSkill=new_attempt.cognitive_skill,
        cognitiveSkills=new_attempt.cognitive_skills.split(','),
        level=new_attempt.level,
        score=new_attempt.score,
        mistakesCount=new_attempt.mistakes_count,
        success=new_attempt.success,
        timeTakenSeconds=new_attempt.time_taken_seconds,
        timestamp=new_attempt.timestamp.isoformat()
    )
