import os
import hmac
from typing import Optional
from fastapi import Header, HTTPException, Depends, status
from sqlalchemy.orm import Session
from .db import get_db
from .models import Patient

# Default caregiver PIN is 1234, configurable via environment
CAREGIVER_PIN = os.getenv("CAREGIVER_PIN", "1234").strip()
# Default healthcare worker PIN is 4321, configurable via environment
HEALTHCARE_PIN = os.getenv("HEALTHCARE_PIN", "4321").strip()

def verify_caregiver_pin(provided_pin: Optional[str]) -> bool:
    """
    Verifies the provided caregiver PIN using constant-time comparison
    to prevent timing attacks.
    """
    if not provided_pin:
        return False
    # Use hmac.compare_digest for constant-time string comparison
    return hmac.compare_digest(provided_pin.strip(), CAREGIVER_PIN)

def verify_healthcare_pin(provided_pin: Optional[str]) -> bool:
    """
    Verifies the provided healthcare worker PIN using constant-time comparison.
    """
    if not provided_pin:
        return False
    return hmac.compare_digest(provided_pin.strip(), HEALTHCARE_PIN)

def extract_pin_from_headers(
    x_pin: Optional[str] = None,
    authorization: Optional[str] = None,
) -> Optional[str]:
    """
    Extracts the PIN from custom header or Authorization Bearer header.
    """
    if x_pin:
        return x_pin.strip()
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1].strip()
        elif len(parts) == 1:
            return parts[0].strip()
    return None

def is_caregiver_request(
    x_caregiver_pin: Optional[str] = Header(None, alias="X-Caregiver-PIN"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> bool:
    """
    Non-raising check whether the request contains valid caregiver credentials.
    """
    pin = extract_pin_from_headers(x_caregiver_pin, authorization)
    return verify_caregiver_pin(pin)

def is_healthcare_request(
    x_healthcare_pin: Optional[str] = Header(None, alias="X-Healthcare-PIN"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> bool:
    """
    Non-raising check whether the request contains valid healthcare worker credentials.
    """
    pin = extract_pin_from_headers(x_healthcare_pin, authorization)
    if pin and verify_healthcare_pin(pin):
        return True
    if x_user_role == "healthcare_worker" and pin and verify_healthcare_pin(pin):
        return True
    return False

def require_caregiver(
    x_caregiver_pin: Optional[str] = Header(None, alias="X-Caregiver-PIN"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> bool:
    """
    Dependency that enforces caregiver authorization.
    Accepts PIN via X-Caregiver-PIN or Authorization: Bearer <pin>.
    """
    if not is_caregiver_request(x_caregiver_pin, authorization):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Caregiver authorization required. Invalid or missing caregiver credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return True

def require_caregiver_or_healthcare_worker(
    x_caregiver_pin: Optional[str] = Header(None, alias="X-Caregiver-PIN"),
    x_healthcare_pin: Optional[str] = Header(None, alias="X-Healthcare-PIN"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> bool:
    """
    Dependency that enforces either caregiver or healthcare worker authorization.
    Healthcare workers are allowed read-only access to progress and alerts.
    """
    if is_caregiver_request(x_caregiver_pin, authorization):
        return True
    if is_healthcare_request(x_healthcare_pin, x_user_role, authorization):
        return True
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Caregiver or Healthcare Worker authorization required.",
        headers={"WWW-Authenticate": "Bearer"},
    )

def verify_patient_exists(patient_id: str, db: Session = Depends(get_db)) -> Patient:
    """
    Validates that the patient exists in the database.
    Prevents unauthorized probing or silent record creation with arbitrary patient IDs.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )
    return patient
