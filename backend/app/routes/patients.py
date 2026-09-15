from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import Patient, FamilyMember, Routine, MusicPreference
from ..schemas import PatientResponse, FamilyMemberResponse, RoutineResponse, MusicPreferenceResponse

router = APIRouter(prefix="/api/patients", tags=["patients"])

@router.get("", response_model=List[PatientResponse])
def list_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/{patient_id}/family", response_model=List[FamilyMemberResponse])
def get_patient_family(patient_id: str, db: Session = Depends(get_db)):
    return db.query(FamilyMember).filter(FamilyMember.patient_id == patient_id).all()

@router.get("/{patient_id}/routines", response_model=List[RoutineResponse])
def get_patient_routines(patient_id: str, db: Session = Depends(get_db)):
    return db.query(Routine).filter(Routine.patient_id == patient_id).order_by(Routine.routine_order).all()

@router.get("/{patient_id}/music", response_model=List[MusicPreferenceResponse])
def get_patient_music(patient_id: str, db: Session = Depends(get_db)):
    return db.query(MusicPreference).filter(MusicPreference.patient_id == patient_id).all()
