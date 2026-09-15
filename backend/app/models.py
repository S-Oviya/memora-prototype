import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship as orm_relationship
from .db import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(64), primary_key=True, default=lambda: f"patient-{uuid.uuid4().hex[:8]}")
    name = Column(String(128), nullable=False)
    age = Column(Integer, nullable=False)
    dementia_type = Column(String(128), default="Alzheimer's Disease (Early-to-Mild)")
    dementia_stage = Column(String(32), default="mild")
    preferred_language = Column(String(16), default="as")
    avatar_url = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    family_members = orm_relationship("FamilyMember", back_populates="patient", cascade="all, delete-orphan")
    routines = orm_relationship("Routine", back_populates="patient", cascade="all, delete-orphan")
    music_tracks = orm_relationship("MusicPreference", back_populates="patient", cascade="all, delete-orphan")
    attempts = orm_relationship("GameAttempt", back_populates="patient", cascade="all, delete-orphan")

class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(String(64), primary_key=True, default=lambda: f"fam-{uuid.uuid4().hex[:8]}")
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False)
    name = Column(String(128), nullable=False)
    relationship = Column(String(64), nullable=False)
    relationship_as = Column(String(64), nullable=True)
    photo_url = Column(Text, nullable=False)
    voice_audio_url = Column(Text, nullable=True)
    voice_transcript_en = Column(Text, nullable=True)
    voice_transcript_as = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    patient = orm_relationship("Patient", back_populates="family_members")

class Routine(Base):
    __tablename__ = "routines"

    id = Column(String(64), primary_key=True, default=lambda: f"routine-{uuid.uuid4().hex[:8]}")
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False)
    time = Column(String(32), nullable=False)
    period = Column(String(32), nullable=False)
    title_en = Column(String(128), nullable=False)
    title_as = Column(String(128), nullable=False)
    icon = Column(String(64), default="clock")
    photo_url = Column(Text, nullable=True)
    routine_order = Column(Integer, default=1)
    completed = Column(Boolean, default=False)

    patient = orm_relationship("Patient", back_populates="routines")

class MusicPreference(Base):
    __tablename__ = "music_preferences"

    id = Column(String(64), primary_key=True, default=lambda: f"music-{uuid.uuid4().hex[:8]}")
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False)
    title = Column(String(128), nullable=False)
    artist = Column(String(128), nullable=False)
    audio_url = Column(Text, nullable=False)
    duration = Column(String(32), default="2:30")
    is_built_in = Column(Boolean, default=True)
    is_synthesized = Column(Boolean, default=True)

    patient = orm_relationship("Patient", back_populates="music_tracks")

class GameAttempt(Base):
    __tablename__ = "game_attempts"

    id = Column(String(64), primary_key=True, default=lambda: f"att-{uuid.uuid4().hex[:12]}")
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False)
    game_id = Column(String(64), nullable=False)
    cognitive_skill = Column(String(64), nullable=False)
    cognitive_skills = Column(String(256), nullable=True)
    level = Column(Integer, default=1)
    score = Column(Integer, default=100)
    mistakes_count = Column(Integer, default=0)
    success = Column(Boolean, default=True)
    time_taken_seconds = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    patient = orm_relationship("Patient", back_populates="attempts")

class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(String(64), primary_key=True, default=lambda: f"rec-{uuid.uuid4().hex[:8]}")
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False)
    recommended_game = Column(String(64), nullable=False)
    recommended_level = Column(Integer, default=1)
    reason = Column(Text, nullable=False)
    confidence = Column(Float, default=0.85)
    timestamp = Column(DateTime, default=datetime.utcnow)

class CaregiverInsight(Base):
    __tablename__ = "caregiver_insights"

    id = Column(String(64), primary_key=True, default=lambda: f"ins-{uuid.uuid4().hex[:8]}")
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False)
    summary = Column(Text, nullable=False)
    strongest_area = Column(String(64), nullable=False)
    practice_area = Column(String(64), nullable=False)
    recommended_activity = Column(String(64), nullable=False)
    recommended_level = Column(Integer, default=1)
    reason = Column(Text, nullable=False)
    suggestions = Column(Text, nullable=False)
    confidence = Column(Float, default=0.85)
    language = Column(String(16), default="en")
    timestamp = Column(DateTime, default=datetime.utcnow)
