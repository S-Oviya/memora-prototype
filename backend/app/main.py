import os
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import engine, Base, SessionLocal
from .models import Patient, FamilyMember, Routine, MusicPreference, GameAttempt
from .routes import patients, attempts, analytics, recommendations, insights, sync, tts
from .tts import tts_router

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Memora Cognitive Care API",
    description="Backend for Memora dementia care prototype supporting cognitive analytics, Gemini AI, multilingual TTS, and offline sync.",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(patients.router)
app.include_router(attempts.router)
app.include_router(analytics.router)
app.include_router(recommendations.router)
app.include_router(insights.router)
app.include_router(sync.router)
app.include_router(tts.router)
app.include_router(tts_router)

@app.get("/api/health")
def health_check():
    api_key_present = bool(os.getenv("GEMINI_API_KEY", "").strip())
    return {
        "status": "ok",
        "app": "Memora Cognitive Care Backend",
        "version": "2.0.0",
        "database": "sqlite",
        "geminiConfigured": api_key_present,
        "supportedVoices": ["en", "as", "bn", "ne", "miz", "lus", "njz", "trp"],
        "offlineTTS": True
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
