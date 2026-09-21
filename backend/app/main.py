import os
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import engine, Base, SessionLocal
from .models import Patient, FamilyMember, Routine, MusicPreference, GameAttempt, Reminder, Alert
from .routes import patients, attempts, analytics, recommendations, insights, sync, tts

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("memora_api")

app = FastAPI(
    title="Memora Cognitive Care API",
    description="Backend for Memora dementia care prototype supporting cognitive analytics, Gemini AI, multilingual TTS, and offline sync.",
    version="2.0.0"
)

# Safe CORS Configuration
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost:4173")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Caregiver-PIN", "X-Healthcare-PIN", "X-User-Role", "Accept"],
)

# Security Response Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Sanitized Error Handling: prevent leaking internal tracebacks/paths
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, (StarletteHTTPException, RequestValidationError)):
        raise exc
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact the administrator."}
    )

# Include routers
app.include_router(patients.router)
app.include_router(attempts.router)
app.include_router(analytics.router)
app.include_router(recommendations.router)
app.include_router(insights.router)
app.include_router(sync.router)
app.include_router(tts.router)

@app.get("/api/health")
def health_check():
    api_key_present = bool(os.getenv("GEMINI_API_KEY", "").strip())
    return {
        "status": "ok",
        "app": "Memora Cognitive Care Backend",
        "version": "2.0.0",
        "database": "sqlite",
        "geminiConfigured": api_key_present,
        "supportedVoices": ["en", "as", "bn", "ne", "lus", "ny", "trp"]
    }

def seed_database_if_empty():
    db = SessionLocal()
    try:
        if db.query(Patient).count() == 0:
            print("[Memora] Seeding initial demo data for Ramesh Chandra Baruah...")
            patient = Patient(
                id="patient-ramesh-1",
                name="Ramesh Chandra Baruah",
                age=72,
                dementia_type="Alzheimer's Disease (Early-to-Mild)",
                dementia_stage="mild",
                preferred_language="as",
                notes="Enjoys morning tea outdoors, traditional Assamese flute and Borgeet, and photos of his grandchildren."
            )
            db.add(patient)

            # Family members
            members = [
                FamilyMember(
                    id="fam-sunita",
                    patient_id="patient-ramesh-1",
                    name="Sunita Baruah",
                    relationship="Daughter",
                    relationship_as="জীয়াৰী (কন্যা)",
                    photo_url="",
                    voice_transcript_en="Hi Dad, it is Sunita! Did you take your morning tea? I will visit you soon!",
                    voice_transcript_as="দেউতা, মই আপোনাৰ মৰমৰ সুনীতা। আপুনি পুৱাৰ চাহ খালে নে? মই সোনকালে আহিম দেই!"
                ),
                FamilyMember(
                    id="fam-priyam",
                    patient_id="patient-ramesh-1",
                    name="Priyam Baruah",
                    relationship="Grandson",
                    relationship_as="নাতি (মৰমৰ নাতি)",
                    photo_url="",
                    voice_transcript_en="Grandpa, it is Priyam! Today we both will go for a walk in the garden, okay?",
                    voice_transcript_as="ককা, মই প্ৰিয়ম! আজি আমি দুয়ো ফুলনিত খোজ কাঢ়িবলৈ যাম দেই।"
                ),
                FamilyMember(
                    id="fam-dipankar",
                    patient_id="patient-ramesh-1",
                    name="Dipankar Baruah",
                    relationship="Son",
                    relationship_as="পুত্ৰ",
                    photo_url="",
                    voice_transcript_en="Dad, this is Dipankar. Take your medicines on time, everything is well at home.",
                    voice_transcript_as="দেউতা, মই দীপংকৰ। চিন্তা নকৰিব, ঔষধখিনি মন দি খাব, সকলো ভালে আছে।"
                ),
                FamilyMember(
                    id="fam-manju",
                    patient_id="patient-ramesh-1",
                    name="Manju Baruah",
                    relationship="Wife",
                    relationship_as="পত্নী",
                    photo_url="",
                    voice_transcript_en="Namaskar Ramesh, let us sit together and enjoy the evening breeze.",
                    voice_transcript_as="নমস্কাৰ, মই মঞ্জু। চাহ খাই লওকচোন, চোতালৰ বতাহখিনি বৰ শান্ত।"
                )
            ]
            db.add_all(members)

            # Routines
            routines_data = [
                Routine(id="routine-1", patient_id="patient-ramesh-1", time="07:30 AM", period="morning", title_en="Morning Tea & Fresh Garden Air", title_as="পুৱাৰ চাহ আৰু ফুলনিৰ বতাহ", icon="coffee", routine_order=1, completed=True),
                Routine(id="routine-2", patient_id="patient-ramesh-1", time="08:30 AM", period="morning", title_en="Morning Bath & Fresh Clothes", title_as="গা ধোৱা আৰু পৰিষ্কাৰ কাপোৰ", icon="shower", routine_order=2, completed=True),
                Routine(id="routine-3", patient_id="patient-ramesh-1", time="09:30 AM", period="morning", title_en="Breakfast & Morning Medicine", title_as="পুৱাৰ আহাৰ আৰু ঔষধ", icon="pill", routine_order=3, completed=False),
                Routine(id="routine-4", patient_id="patient-ramesh-1", time="01:30 PM", period="afternoon", title_en="Lunch with Family", title_as="পৰিয়ালৰ সৈতে দুপৰীয়াৰ আহাৰ", icon="utensils", routine_order=4, completed=False),
                Routine(id="routine-5", patient_id="patient-ramesh-1", time="04:30 PM", period="afternoon", title_en="Afternoon Walk in Veranda", title_as="আবেলি বাৰান্দাত খোজ কঢ়া", icon="footprints", routine_order=5, completed=False),
                Routine(id="routine-6", patient_id="patient-ramesh-1", time="06:30 PM", period="evening", title_en="Evening Prayer & Calm Music", title_as="সন্ধিয়াৰ প্ৰাৰ্থনা আৰু শান্ত সংগীত", icon="sparkles", routine_order=6, completed=False),
            ]
            db.add_all(routines_data)

            # Reminders
            reminders_data = [
                Reminder(
                    id="rem-1-medicine",
                    patient_id="patient-ramesh-1",
                    title="Morning Blood Pressure & Memory Medicine",
                    title_en="Morning Blood Pressure & Memory Medicine",
                    title_as="পুৱাৰ ৰক্তচাপ আৰু স্মৃতিবৰ্ধক ঔষধ",
                    reminder_type="medicine",
                    time="09:00 AM",
                    schedule="Daily after breakfast",
                    notes="Take 1 tablet Donepezil 5mg and 1 tablet Telmisartan with warm water.",
                    notes_en="Take 1 tablet Donepezil 5mg and 1 tablet Telmisartan with warm water.",
                    notes_as="পুৱাৰ আহাৰৰ পাছত এগিলাচ কুহুমীয়া পানীৰ সৈতে টেবলেট খাব।",
                    enabled=True,
                    completed_today=False,
                ),
                Reminder(
                    id="rem-2-hydration",
                    patient_id="patient-ramesh-1",
                    title="Drink a Glass of Fresh Water",
                    title_en="Drink a Glass of Fresh Water",
                    title_as="এগিলাচ বিশুদ্ধ পানী খাওক",
                    reminder_type="hydration",
                    time="11:00 AM",
                    schedule="Every 2 hours",
                    notes="Offer water gently from the traditional brass jug.",
                    notes_en="Offer water gently from the traditional brass jug.",
                    notes_as="পিতলৰ জগৰ পৰা এগিলাচ পানী মৰমেৰে খাবলৈ দিয়ক।",
                    enabled=True,
                    completed_today=False,
                ),
                Reminder(
                    id="rem-3-activity",
                    patient_id="patient-ramesh-1",
                    title="Veranda Walk & Garden Fresh Air",
                    title_en="Veranda Walk & Garden Fresh Air",
                    title_as="বাৰান্দাত খোজ কঢ়া আৰু ফুলনিৰ বতাহ",
                    reminder_type="activity",
                    time="04:30 PM",
                    schedule="Daily afternoon",
                    notes="15 minutes slow walk accompanied by daughter Sunita or grandson Priyam.",
                    notes_en="15 minutes slow walk accompanied by daughter Sunita or grandson Priyam.",
                    notes_as="জীয়াৰী সুনীতা বা নাতি প্ৰিয়মৰ সৈতে ১৫ মিনিট বাৰান্দাত শান্তভাৱে খোজ কাঢ়ক।",
                    enabled=True,
                    completed_today=False,
                ),
                Reminder(
                    id="rem-4-appointment",
                    patient_id="patient-ramesh-1",
                    title="Neurology Review with Dr. B. Sharma",
                    title_en="Neurology Review with Dr. B. Sharma",
                    title_as="ডাঃ বি. শৰ্মাৰ সৈতে স্নায়ু পৰীক্ষা",
                    reminder_type="appointment",
                    time="11:30 AM",
                    schedule="Thursday (Monthly Check-up)",
                    notes="Apollo Clinic Guwahati. Carry previous MRI scans and Memora activity trends.",
                    notes_en="Apollo Clinic Guwahati. Carry previous MRI scans and Memora activity trends.",
                    notes_as="গৌহাটী এপোলো ক্লিনিক। পুৰণি এম.আৰ.আই ৰিপৰ্ট আৰু মেমোৰা ডায়ৰী লগত নিব।",
                    enabled=True,
                    completed_today=False,
                ),
            ]
            db.add_all(reminders_data)

            # Initial Alerts
            alerts_data = [
                Alert(
                    id="alert-1-medicine",
                    patient_id="patient-ramesh-1",
                    alert_type="missed_medicine",
                    severity="high",
                    status="unread",
                    title="Missed Morning Medicine: Donepezil (5mg)",
                    title_en="Missed Morning Medicine: Donepezil (5mg)",
                    title_as="পুৱাৰ ঔষধ খাবলৈ বাকী: ডনেপেজিল (৫ মি.গ্ৰা.)",
                    description="Patient did not acknowledge the 09:00 AM medication prompt on the patient tablet.",
                    description_en="Patient did not acknowledge the 09:00 AM medication prompt on the patient tablet.",
                    description_as="ৰোগীয়ে টেবলেটত পুৱা ৯:০০ বজাৰ ঔষধৰ জাননী নিশ্চিত কৰা নাই।",
                    relevant_item_title="Morning Blood Pressure & Memory Medicine",
                    relevant_item_id="rem-1-medicine",
                    due_time="09:00 AM",
                ),
                Alert(
                    id="alert-2-hydration",
                    patient_id="patient-ramesh-1",
                    alert_type="missed_hydration",
                    severity="medium",
                    status="unread",
                    title="Missed Hydration Reminder",
                    title_en="Missed Hydration Reminder",
                    title_as="পানী খোৱাৰ সময় পাৰ হ’ল",
                    description="Scheduled 11:00 AM hydration reminder has not been confirmed. Please offer a fresh glass of water.",
                    description_en="Scheduled 11:00 AM hydration reminder has not been confirmed. Please offer a fresh glass of water.",
                    description_as="১১:০০ বজাৰ পানী খোৱাৰ সোঁৱৰণি নিশ্চিত হোৱা নাই। অনুগ্ৰহ কৰি কুহুমীয়া পানী খাবলৈ দিয়ক।",
                    relevant_item_title="Drink a Glass of Fresh Water",
                    relevant_item_id="rem-2-hydration",
                    due_time="11:00 AM",
                ),
                Alert(
                    id="alert-3-activity",
                    patient_id="patient-ramesh-1",
                    alert_type="missed_activity",
                    severity="low",
                    status="read",
                    title="Scheduled Daily Activity Pending",
                    title_en="Scheduled Daily Activity Pending",
                    title_as="দৈনন্দিন কাৰ্যসূচী বাকী",
                    description="Afternoon veranda walk scheduled for 04:30 PM yesterday was not recorded.",
                    description_en="Afternoon veranda walk scheduled for 04:30 PM yesterday was not recorded.",
                    description_as="আবেলি ৪:৩০ বজাৰ বাৰান্দাৰ খোজ কঢ়াৰ কাৰ্যসূচী সম্পূৰ্ণ কৰা বুলি পঞ্জীয়ন হোৱা নাই।",
                    relevant_item_title="Veranda Walk & Garden Fresh Air",
                    relevant_item_id="rem-3-activity",
                    due_time="04:30 PM",
                ),
                Alert(
                    id="alert-4-appointment",
                    patient_id="patient-ramesh-1",
                    alert_type="missed_appointment",
                    severity="high",
                    status="unread",
                    title="Medical Appointment Check-in Due",
                    title_en="Medical Appointment Check-in Due",
                    title_as="চিকিৎসকৰ পৰামৰ্শৰ সময় উপস্থিত",
                    description="Upcoming monthly neurology follow-up check-in at Apollo Clinic requires caregiver attention.",
                    description_en="Upcoming monthly neurology follow-up check-in at Apollo Clinic requires caregiver attention.",
                    description_as="গৌহাটী এপোলো ক্লিনিকত ডাঃ বি. শৰ্মাৰ সৈতে মাহেকীয়া পৰামৰ্শৰ বাবে প্ৰস্তুতি চাব লাগে।",
                    relevant_item_title="Neurology Review with Dr. B. Sharma",
                    relevant_item_id="rem-4-appointment",
                    due_time="11:30 AM",
                ),
                Alert(
                    id="alert-5-inactivity",
                    patient_id="patient-ramesh-1",
                    alert_type="inactivity",
                    severity="medium",
                    status="resolved",
                    title="Inactivity Notice: No Engagement in 14 Hours",
                    title_en="Inactivity Notice: No Engagement in 14 Hours",
                    title_as="সক্ৰিয়তাহীনতাৰ জাননী: ১৪ ঘণ্টা ধৰি কোনো কাৰ্যসূচী হোৱা নাই",
                    description="No cognitive games or routine actions were logged during the overnight-to-morning interval.",
                    description_en="No cognitive games or routine actions were logged during the overnight-to-morning interval.",
                    description_as="ৰাতিপুৱাৰ সময়ছোৱাত কোনো জ্ঞানমূলক খেল বা নিয়মীয়া কাৰ্যসূচী পঞ্জীয়ন হোৱা নাছিল।",
                    relevant_item_title="Cognitive Activity & Daily Engagement",
                    due_time="Continuous Monitoring",
                ),
            ]
            db.add_all(alerts_data)

            # Initial Attempts
            sample_attempts = [
                GameAttempt(id="att-1", patient_id="patient-ramesh-1", game_id="photo-puzzle", cognitive_skill="problem_solving", level=1, score=95, mistakes_count=1, success=True, time_taken_seconds=32, timestamp=datetime.utcnow()),
                GameAttempt(id="att-2", patient_id="patient-ramesh-1", game_id="familiar-faces", cognitive_skill="recognition", level=1, score=100, mistakes_count=0, success=True, time_taken_seconds=18, timestamp=datetime.utcnow()),
                GameAttempt(id="att-3", patient_id="patient-ramesh-1", game_id="familiar-voices", cognitive_skill="recognition", level=1, score=90, mistakes_count=1, success=True, time_taken_seconds=24, timestamp=datetime.utcnow()),
                GameAttempt(id="att-4", patient_id="patient-ramesh-1", game_id="routine-recall", cognitive_skill="recall", level=1, score=100, mistakes_count=0, success=True, time_taken_seconds=28, timestamp=datetime.utcnow()),
                GameAttempt(id="att-5", patient_id="patient-ramesh-1", game_id="photo-puzzle", cognitive_skill="problem_solving", level=2, score=85, mistakes_count=2, success=True, time_taken_seconds=45, timestamp=datetime.utcnow()),
                GameAttempt(id="att-6", patient_id="patient-ramesh-1", game_id="odd-one-out", cognitive_skill="categorization", level=1, score=80, mistakes_count=1, success=True, time_taken_seconds=25, timestamp=datetime.utcnow()),
                GameAttempt(id="att-7", patient_id="patient-ramesh-1", game_id="matching-family", cognitive_skill="associative_memory", level=1, score=85, mistakes_count=1, success=True, time_taken_seconds=20, timestamp=datetime.utcnow()),
            ]
            db.add_all(sample_attempts)

            db.commit()
            print("[Memora] Demo database seeded successfully.")
    except Exception as e:
        print(f"[Memora] Error during initial seed: {e}")
        db.rollback()
    finally:
        db.close()

seed_database_if_empty()
