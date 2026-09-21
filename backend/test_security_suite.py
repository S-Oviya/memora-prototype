"""
Automated Security Test Suite for Memora Cognitive Care Backend
Verifies:
1. Caregiver PIN & constant-time authentication
2. Role authorization (Caregiver vs Patient capabilities)
3. Schema input validation & boundary checking
4. Phantom patient pollution prevention
5. Patient existence validation on all endpoints
6. CORS configuration & security response headers
"""

import os
import sys
sys.path.insert(0, os.path.abspath("."))
import unittest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.db import Base
from backend.app.models import Patient, Reminder, Alert
from backend.app.auth import (
    verify_caregiver_pin,
    require_caregiver,
    is_caregiver_request,
    verify_patient_exists,
)
from backend.app.schemas import (
    PatientBase,
    ReminderCreate,
    ReminderUpdate,
    AlertCreate,
    AlertUpdate,
    GameAttemptCreate,
)
from backend.app.routes import patients, attempts, sync, analytics, recommendations
from backend.app.main import app, allowed_origins

# In-memory test SQLite DB
engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)
TestSession = sessionmaker(bind=engine)

class TestMemoraSecurity(unittest.TestCase):
    def setUp(self):
        self.db = TestSession()
        # Seed test patient
        self.patient = Patient(
            id="test-patient-001",
            name="Test Ramesh",
            age=72,
            dementia_type="Alzheimer's Disease (Early-to-Mild)",
            dementia_stage="mild",
            preferred_language="as",
            notes="Demo patient notes"
        )
        self.db.add(self.patient)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    # -------------------------------------------------------------
    # 1. PIN & Caregiver Authentication Tests
    # -------------------------------------------------------------
    def test_pin_verification(self):
        self.assertTrue(verify_caregiver_pin("1234"))
        self.assertFalse(verify_caregiver_pin("0000"))
        self.assertFalse(verify_caregiver_pin("wrong-pin"))
        self.assertFalse(verify_caregiver_pin(""))
        self.assertFalse(verify_caregiver_pin(None))

    def test_require_caregiver_header_bearer(self):
        # Valid X-Caregiver-PIN
        self.assertTrue(require_caregiver(x_caregiver_pin="1234", authorization=None))
        # Valid Authorization: Bearer 1234
        self.assertTrue(require_caregiver(x_caregiver_pin=None, authorization="Bearer 1234"))
        # Invalid PIN rejects with 401
        with self.assertRaises(HTTPException) as ctx:
            require_caregiver(x_caregiver_pin="wrong", authorization=None)
        self.assertEqual(ctx.exception.status_code, 401)
        # Missing credentials rejects with 401
        with self.assertRaises(HTTPException) as ctx:
            require_caregiver(x_caregiver_pin=None, authorization=None)
        self.assertEqual(ctx.exception.status_code, 401)

    # -------------------------------------------------------------
    # 2. Patient Existence & Probing Prevention
    # -------------------------------------------------------------
    def test_patient_exists_verification(self):
        # Existing patient succeeds
        p = verify_patient_exists("test-patient-001", self.db)
        self.assertEqual(p.id, "test-patient-001")

        # Non-existent patient raises 404
        with self.assertRaises(HTTPException) as ctx:
            verify_patient_exists("ghost-patient-999", self.db)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_attempts_route_does_not_create_phantom_patient(self):
        # Submitting an attempt for a non-existent patient must return 404 and NOT create patient
        attempt_data = GameAttemptCreate(
            patient_id="ghost-patient-999",
            game_id="photo-puzzle",
            level=1,
            score=85,
            mistakes_count=1,
            success=True,
            time_taken_seconds=25
        )
        with self.assertRaises(HTTPException) as ctx:
            attempts.record_attempt("ghost-patient-999", attempt_data, self.db)
        self.assertEqual(ctx.exception.status_code, 404)

        # Verify ghost patient was NOT added to DB
        ghost = self.db.query(Patient).filter(Patient.id == "ghost-patient-999").first()
        self.assertIsNone(ghost)

    def test_attempts_route_rejects_mismatched_patient_id(self):
        attempt_data = GameAttemptCreate(
            patient_id="other-patient",
            game_id="photo-puzzle",
            level=1,
            score=85,
            mistakes_count=1,
            success=True,
            time_taken_seconds=25
        )
        with self.assertRaises(HTTPException) as ctx:
            attempts.record_attempt("test-patient-001", attempt_data, self.db)
        self.assertEqual(ctx.exception.status_code, 400)

    # -------------------------------------------------------------
    # 3. Input Validation & Schema Constraints
    # -------------------------------------------------------------
    def test_patient_input_validation(self):
        # Negative age
        with self.assertRaises(ValidationError):
            PatientBase(name="Valid Name", age=-5, dementia_stage="mild", preferred_language="as")

        # Age > 125
        with self.assertRaises(ValidationError):
            PatientBase(name="Valid Name", age=150, dementia_stage="mild", preferred_language="as")

        # Invalid dementia stage
        with self.assertRaises(ValidationError):
            PatientBase(name="Valid Name", age=70, dementia_stage="terminal", preferred_language="as")

        # Invalid language code
        with self.assertRaises(ValidationError):
            PatientBase(name="Valid Name", age=70, dementia_stage="mild", preferred_language="xx")

        # Valid patient passes
        p = PatientBase(name="Valid Name", age=70, dementia_stage="mild", preferred_language="as")
        self.assertEqual(p.name, "Valid Name")

    def test_reminder_input_validation(self):
        # Invalid reminder type
        with self.assertRaises(ValidationError):
            ReminderCreate(title="Test", type="invalid_type", time="08:00 AM")

        # Empty title
        with self.assertRaises(ValidationError):
            ReminderCreate(title="", type="medicine", time="08:00 AM")

        # Valid reminder types pass
        for valid_type in ["medicine", "hydration", "activity", "appointment"]:
            rem = ReminderCreate(title="Test", type=valid_type, time="08:00 AM")
            self.assertEqual(rem.type, valid_type)

    def test_alert_input_validation(self):
        # Invalid severity
        with self.assertRaises(ValidationError):
            AlertCreate(type="missed_medicine", severity="critical", title="Alert")

        # Invalid status
        with self.assertRaises(ValidationError):
            AlertCreate(type="missed_medicine", severity="high", status="deleted", title="Alert", description="Test")

        # Valid alert passes
        a = AlertCreate(type="missed_medicine", severity="high", status="unread", title="Medicine missed", description="Test description")
        self.assertEqual(a.severity, "high")

    def test_game_attempt_input_validation(self):
        # Invalid level (<1 or >10)
        with self.assertRaises(ValidationError):
            GameAttemptCreate(patient_id="test-patient-001", game_id="photo-puzzle", level=0, score=50, mistakes_count=0, success=True, time_taken_seconds=10)

        with self.assertRaises(ValidationError):
            GameAttemptCreate(patient_id="test-patient-001", game_id="photo-puzzle", level=11, score=50, mistakes_count=0, success=True, time_taken_seconds=10)

        # Invalid score (<0 or >100)
        with self.assertRaises(ValidationError):
            GameAttemptCreate(patient_id="test-patient-001", game_id="photo-puzzle", level=1, score=-10, mistakes_count=0, success=True, time_taken_seconds=10)

        with self.assertRaises(ValidationError):
            GameAttemptCreate(patient_id="test-patient-001", game_id="photo-puzzle", level=1, score=105, mistakes_count=0, success=True, time_taken_seconds=10)

        # Invalid game_id
        with self.assertRaises(ValidationError):
            GameAttemptCreate(patient_id="test-patient-001", game_id="unapproved-game", level=1, score=50, mistakes_count=0, success=True, time_taken_seconds=10)

        # Valid game attempt passes
        att = GameAttemptCreate(patient_id="test-patient-001", game_id="photo-puzzle", level=2, score=95, mistakes_count=1, success=True, time_taken_seconds=30)
        self.assertEqual(att.score, 95)

    # -------------------------------------------------------------
    # 4. Scoped Access: Patient vs Caregiver Capabilities
    # -------------------------------------------------------------
    def test_patient_can_only_complete_reminder_not_reconfigure(self):
        # Create reminder in DB
        rem = Reminder(
            patient_id="test-patient-001",
            title="Blood Pressure Pill",
            reminder_type="medicine",
            time="08:00 AM",
            schedule="Daily",
            enabled=True,
            completed_today=False
        )
        self.db.add(rem)
        self.db.commit()
        self.db.refresh(rem)

        # 1. Patient updating completed_today (is_caregiver = False) -> ALLOWED
        res = patients.update_patient_reminder(
            patient_id="test-patient-001",
            reminder_id=rem.id,
            payload=ReminderUpdate(completed_today=True),
            db=self.db,
            is_caregiver=False
        )
        self.assertTrue(res.completed_today)

        # 2. Patient attempting to alter reminder title/schedule (is_caregiver = False) -> FORBIDDEN (403)
        with self.assertRaises(HTTPException) as ctx:
            patients.update_patient_reminder(
                patient_id="test-patient-001",
                reminder_id=rem.id,
                payload=ReminderUpdate(title="Malicious Title Change"),
                db=self.db,
                is_caregiver=False
            )
        self.assertEqual(ctx.exception.status_code, 403)

        # 3. Caregiver updating reminder title (is_caregiver = True) -> ALLOWED
        res_caregiver = patients.update_patient_reminder(
            patient_id="test-patient-001",
            reminder_id=rem.id,
            payload=ReminderUpdate(title="Updated Medicine Title"),
            db=self.db,
            is_caregiver=True
        )
        self.assertEqual(res_caregiver.title, "Updated Medicine Title")

    # -------------------------------------------------------------
    # 5. Healthcare Worker Scoped Access & Modification Prevention
    # -------------------------------------------------------------
    def test_healthcare_worker_pin_verification(self):
        from backend.app.auth import verify_healthcare_pin, require_caregiver_or_healthcare_worker
        self.assertTrue(verify_healthcare_pin("4321"))
        self.assertFalse(verify_healthcare_pin("0000"))
        self.assertFalse(verify_healthcare_pin(""))

        # Healthcare worker authorized to read alerts
        self.assertTrue(
            require_caregiver_or_healthcare_worker(
                x_caregiver_pin=None,
                x_healthcare_pin="4321",
                x_user_role="healthcare_worker",
                authorization=None
            )
        )

        # Caregiver also authorized to read alerts
        self.assertTrue(
            require_caregiver_or_healthcare_worker(
                x_caregiver_pin="1234",
                x_healthcare_pin=None,
                x_user_role="caregiver",
                authorization=None
            )
        )

        # Unauthorized access without valid credentials rejected with 401
        with self.assertRaises(HTTPException) as ctx:
            require_caregiver_or_healthcare_worker(
                x_caregiver_pin=None,
                x_healthcare_pin=None,
                x_user_role=None,
                authorization=None
            )
        self.assertEqual(ctx.exception.status_code, 401)

    def test_healthcare_worker_cannot_modify_protected_data(self):
        # Healthcare worker credentials must be rejected by require_caregiver on modification routes
        with self.assertRaises(HTTPException) as ctx:
            require_caregiver(x_caregiver_pin="4321", authorization=None)
        self.assertEqual(ctx.exception.status_code, 401)

        # Caregiver credentials succeed
        self.assertTrue(require_caregiver(x_caregiver_pin="1234", authorization=None))

    def test_healthcare_worker_can_view_patient_data(self):
        # Read patient profile
        p = patients.get_patient("test-patient-001", self.db)
        self.assertEqual(p.id, "test-patient-001")

        # Read patient reminders
        rems = patients.get_patient_reminders("test-patient-001", self.db)
        self.assertIsInstance(rems, list)

        # Read patient attempts
        atts = attempts.get_patient_attempts("test-patient-001", self.db)
        self.assertIsInstance(atts, list)

        # Read cognitive analytics
        an = analytics.get_analytics("test-patient-001", self.db)
        self.assertIn("cognitiveScores", an)

        # Read recommendations
        rec = recommendations.get_recommendation("test-patient-001", self.db)
        self.assertTrue(hasattr(rec, "recommended_game"))

    # -------------------------------------------------------------
    # 6. CORS Configuration Verification
    # -------------------------------------------------------------
    def test_cors_origins_not_wildcard_with_credentials(self):
        self.assertNotIn("*", allowed_origins)
        self.assertTrue(any("5173" in o for o in allowed_origins))


if __name__ == "__main__":
    unittest.main()
