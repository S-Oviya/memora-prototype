from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import Patient, FamilyMember, Routine, MusicPreference, Reminder, Alert
from ..auth import (
    require_caregiver,
    require_caregiver_or_healthcare_worker,
    is_caregiver_request,
    verify_patient_exists,
)
from ..schemas import (
    PatientResponse,
    FamilyMemberResponse,
    RoutineResponse,
    MusicPreferenceResponse,
    ReminderResponse,
    ReminderCreate,
    ReminderUpdate,
    AlertResponse,
    AlertCreate,
    AlertUpdate,
)

router = APIRouter(prefix="/api/patients", tags=["patients"])

@router.get("", response_model=List[PatientResponse])
def list_patients(db: Session = Depends(get_db), _auth: bool = Depends(require_caregiver)):
    """Only authorized caregivers may list all registered patients."""
    return db.query(Patient).all()

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    return verify_patient_exists(patient_id, db)

@router.get("/{patient_id}/family", response_model=List[FamilyMemberResponse])
def get_patient_family(patient_id: str, db: Session = Depends(get_db)):
    verify_patient_exists(patient_id, db)
    return db.query(FamilyMember).filter(FamilyMember.patient_id == patient_id).all()

@router.get("/{patient_id}/routines", response_model=List[RoutineResponse])
def get_patient_routines(patient_id: str, db: Session = Depends(get_db)):
    verify_patient_exists(patient_id, db)
    return db.query(Routine).filter(Routine.patient_id == patient_id).order_by(Routine.routine_order).all()

@router.get("/{patient_id}/reminders", response_model=List[ReminderResponse])
def get_patient_reminders(patient_id: str, db: Session = Depends(get_db)):
    verify_patient_exists(patient_id, db)
    reminders = db.query(Reminder).filter(Reminder.patient_id == patient_id).all()
    return [
        ReminderResponse(
            id=r.id,
            patientId=r.patient_id,
            title=r.title,
            titleEn=r.title_en,
            titleAs=r.title_as,
            type=r.reminder_type,
            time=r.time,
            schedule=r.schedule or "Daily",
            notes=r.notes,
            notesEn=r.notes_en,
            notesAs=r.notes_as,
            enabled=r.enabled,
            completedToday=r.completed_today,
            createdAt=r.created_at,
        )
        for r in reminders
    ]

@router.post("/{patient_id}/reminders", response_model=ReminderResponse)
def create_patient_reminder(
    patient_id: str,
    payload: ReminderCreate,
    db: Session = Depends(get_db),
    _auth: bool = Depends(require_caregiver),
):
    verify_patient_exists(patient_id, db)

    new_rem = Reminder(
        patient_id=patient_id,
        title=payload.title,
        title_en=payload.title_en or payload.title,
        title_as=payload.title_as,
        reminder_type=payload.type,
        time=payload.time,
        schedule=payload.schedule or "Daily",
        notes=payload.notes,
        notes_en=payload.notes_en,
        notes_as=payload.notes_as,
        enabled=payload.enabled,
        completed_today=payload.completed_today or False,
    )
    db.add(new_rem)
    db.commit()
    db.refresh(new_rem)
    return ReminderResponse(
        id=new_rem.id,
        patientId=new_rem.patient_id,
        title=new_rem.title,
        titleEn=new_rem.title_en,
        titleAs=new_rem.title_as,
        type=new_rem.reminder_type,
        time=new_rem.time,
        schedule=new_rem.schedule or "Daily",
        notes=new_rem.notes,
        notesEn=new_rem.notes_en,
        notesAs=new_rem.notes_as,
        enabled=new_rem.enabled,
        completedToday=new_rem.completed_today,
        createdAt=new_rem.created_at,
    )

@router.put("/{patient_id}/reminders/{reminder_id}", response_model=ReminderResponse)
def update_patient_reminder(
    patient_id: str,
    reminder_id: str,
    payload: ReminderUpdate,
    db: Session = Depends(get_db),
    is_caregiver: bool = Depends(is_caregiver_request),
):
    verify_patient_exists(patient_id, db)
    rem = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.patient_id == patient_id)
        .first()
    )
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found")

    # If not caregiver, verify that only completed_today is being modified
    if not is_caregiver:
        disallowed_fields = [
            field for field in [
                "title", "title_en", "title_as", "type", "time",
                "schedule", "notes", "notes_en", "notes_as", "enabled"
            ]
            if getattr(payload, field) is not None
        ]
        if disallowed_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Caregiver authorization required to modify reminder configuration.",
            )

    if payload.title is not None:
        rem.title = payload.title
    if payload.title_en is not None:
        rem.title_en = payload.title_en
    if payload.title_as is not None:
        rem.title_as = payload.title_as
    if payload.type is not None:
        rem.reminder_type = payload.type
    if payload.time is not None:
        rem.time = payload.time
    if payload.schedule is not None:
        rem.schedule = payload.schedule
    if payload.notes is not None:
        rem.notes = payload.notes
    if payload.notes_en is not None:
        rem.notes_en = payload.notes_en
    if payload.notes_as is not None:
        rem.notes_as = payload.notes_as
    if payload.enabled is not None:
        rem.enabled = payload.enabled
    if payload.completed_today is not None:
        rem.completed_today = payload.completed_today

    db.commit()
    db.refresh(rem)
    return ReminderResponse(
        id=rem.id,
        patientId=rem.patient_id,
        title=rem.title,
        titleEn=rem.title_en,
        titleAs=rem.title_as,
        type=rem.reminder_type,
        time=rem.time,
        schedule=rem.schedule or "Daily",
        notes=rem.notes,
        notesEn=rem.notes_en,
        notesAs=rem.notes_as,
        enabled=rem.enabled,
        completedToday=rem.completed_today,
        createdAt=rem.created_at,
    )

@router.delete("/{patient_id}/reminders/{reminder_id}")
def delete_patient_reminder(
    patient_id: str,
    reminder_id: str,
    db: Session = Depends(get_db),
    _auth: bool = Depends(require_caregiver),
):
    verify_patient_exists(patient_id, db)
    rem = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.patient_id == patient_id)
        .first()
    )
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(rem)
    db.commit()
    return {"status": "ok", "deleted": reminder_id}

@router.get("/{patient_id}/music", response_model=List[MusicPreferenceResponse])
def get_patient_music(patient_id: str, db: Session = Depends(get_db)):
    verify_patient_exists(patient_id, db)
    return db.query(MusicPreference).filter(MusicPreference.patient_id == patient_id).all()

@router.get("/{patient_id}/alerts", response_model=List[AlertResponse])
def get_patient_alerts(
    patient_id: str,
    db: Session = Depends(get_db),
    _auth: bool = Depends(require_caregiver_or_healthcare_worker),
):
    verify_patient_exists(patient_id, db)
    alerts = (
        db.query(Alert)
        .filter(Alert.patient_id == patient_id)
        .order_by(Alert.timestamp.desc())
        .all()
    )
    res = []
    for a in alerts:
        res.append(
            AlertResponse(
                id=a.id,
                patientId=a.patient_id,
                patientName=a.patient.name if a.patient else None,
                type=a.alert_type,
                severity=a.severity,
                status=a.status,
                title=a.title,
                titleEn=a.title_en,
                titleAs=a.title_as,
                description=a.description,
                descriptionEn=a.description_en,
                descriptionAs=a.description_as,
                relevantItemTitle=a.relevant_item_title,
                relevantItemId=a.relevant_item_id,
                dueTime=a.due_time,
                timestamp=a.timestamp,
                readAt=a.read_at,
                resolvedAt=a.resolved_at,
            )
        )
    return res

@router.post("/{patient_id}/alerts", response_model=AlertResponse)
def create_patient_alert(patient_id: str, payload: AlertCreate, db: Session = Depends(get_db)):
    patient = verify_patient_exists(patient_id, db)

    new_alert = Alert(
        patient_id=patient_id,
        alert_type=payload.type,
        severity=payload.severity,
        status=payload.status or "unread",
        title=payload.title,
        title_en=payload.title_en,
        title_as=payload.title_as,
        description=payload.description,
        description_en=payload.description_en,
        description_as=payload.description_as,
        relevant_item_title=payload.relevant_item_title,
        relevant_item_id=payload.relevant_item_id,
        due_time=payload.due_time,
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return AlertResponse(
        id=new_alert.id,
        patientId=new_alert.patient_id,
        patientName=patient.name,
        type=new_alert.alert_type,
        severity=new_alert.severity,
        status=new_alert.status,
        title=new_alert.title,
        titleEn=new_alert.title_en,
        titleAs=new_alert.title_as,
        description=new_alert.description,
        descriptionEn=new_alert.description_en,
        descriptionAs=new_alert.description_as,
        relevantItemTitle=new_alert.relevant_item_title,
        relevantItemId=new_alert.relevant_item_id,
        dueTime=new_alert.due_time,
        timestamp=new_alert.timestamp,
        readAt=new_alert.read_at,
        resolvedAt=new_alert.resolved_at,
    )

@router.put("/{patient_id}/alerts/{alert_id}", response_model=AlertResponse)
def update_patient_alert(
    patient_id: str,
    alert_id: str,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
    _auth: bool = Depends(require_caregiver),
):
    verify_patient_exists(patient_id, db)
    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id, Alert.patient_id == patient_id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if payload.status is not None:
        alert.status = payload.status
    if payload.read_at is not None:
        alert.read_at = payload.read_at
    if payload.resolved_at is not None:
        alert.resolved_at = payload.resolved_at

    db.commit()
    db.refresh(alert)
    return AlertResponse(
        id=alert.id,
        patientId=alert.patient_id,
        patientName=alert.patient.name if alert.patient else None,
        type=alert.alert_type,
        severity=alert.severity,
        status=alert.status,
        title=alert.title,
        titleEn=alert.title_en,
        titleAs=alert.title_as,
        description=alert.description,
        descriptionEn=alert.description_en,
        descriptionAs=alert.description_as,
        relevantItemTitle=alert.relevant_item_title,
        relevantItemId=alert.relevant_item_id,
        dueTime=alert.due_time,
        timestamp=alert.timestamp,
        readAt=alert.read_at,
        resolvedAt=alert.resolved_at,
    )

@router.delete("/{patient_id}/alerts/{alert_id}")
def delete_patient_alert(
    patient_id: str,
    alert_id: str,
    db: Session = Depends(get_db),
    _auth: bool = Depends(require_caregiver),
):
    verify_patient_exists(patient_id, db)
    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id, Alert.patient_id == patient_id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"status": "ok", "deleted": alert_id}

