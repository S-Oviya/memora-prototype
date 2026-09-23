from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class PatientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    age: int = Field(..., ge=1, le=125)
    dementia_type: str = Field(default="Alzheimer's Disease (Early-to-Mild)", max_length=128, alias="dementiaType")
    dementia_stage: str = Field(default="mild", pattern="^(early|mild|moderate|advanced)$", alias="dementiaStage")
    preferred_language: str = Field(default="as", pattern="^(en|as|bn|ne|lus|kha|ny|trp|mni)$", alias="preferredLanguage")
    avatar_url: Optional[str] = Field(default=None, max_length=50000, alias="avatarUrl")
    notes: Optional[str] = Field(default=None, max_length=2000)

    class Config:
        populate_by_name = True

class PatientCreate(PatientBase):
    id: Optional[str] = Field(default=None, max_length=64)

class PatientResponse(PatientBase):
    id: str
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")

    class Config:
        populate_by_name = True
        from_attributes = True

class FamilyMemberResponse(BaseModel):
    id: str
    patient_id: str = Field(alias="patientId")
    name: str
    relationship: str
    relationship_as: Optional[str] = Field(default=None, alias="relationshipAs")
    photo_url: str = Field(alias="photoUrl")
    voice_audio_url: Optional[str] = Field(default=None, alias="voiceAudioUrl")
    voice_transcript_en: Optional[str] = Field(default=None, alias="voiceTranscriptEn")
    voice_transcript_as: Optional[str] = Field(default=None, alias="voiceTranscriptAs")
    notes: Optional[str] = None

    class Config:
        populate_by_name = True
        from_attributes = True

class RoutineResponse(BaseModel):
    id: str
    patient_id: str = Field(alias="patientId")
    time: str
    period: str
    title_en: str = Field(alias="titleEn")
    title_as: str = Field(alias="titleAs")
    icon: str
    photo_url: Optional[str] = Field(default=None, alias="photoUrl")
    completed: Optional[bool] = False
    routine_order: int = Field(default=1, alias="order")

    class Config:
        populate_by_name = True
        from_attributes = True

class ReminderBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=128)
    title_en: Optional[str] = Field(default=None, max_length=128, alias="titleEn")
    title_as: Optional[str] = Field(default=None, max_length=128, alias="titleAs")
    type: str = Field(default="medicine", pattern="^(medicine|hydration|activity|appointment)$")
    time: str = Field(..., min_length=1, max_length=32)
    schedule: Optional[str] = Field(default="Daily", max_length=128)
    notes: Optional[str] = Field(default=None, max_length=2000)
    notes_en: Optional[str] = Field(default=None, max_length=2000, alias="notesEn")
    notes_as: Optional[str] = Field(default=None, max_length=2000, alias="notesAs")
    enabled: bool = True
    completed_today: Optional[bool] = Field(default=False, alias="completedToday")

    class Config:
        populate_by_name = True

class ReminderCreate(ReminderBase):
    patient_id: Optional[str] = Field(default=None, alias="patientId")

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    title_en: Optional[str] = Field(default=None, alias="titleEn")
    title_as: Optional[str] = Field(default=None, alias="titleAs")
    type: Optional[str] = None
    time: Optional[str] = None
    schedule: Optional[str] = None
    notes: Optional[str] = None
    notes_en: Optional[str] = Field(default=None, alias="notesEn")
    notes_as: Optional[str] = Field(default=None, alias="notesAs")
    enabled: Optional[bool] = None
    completed_today: Optional[bool] = Field(default=None, alias="completedToday")

    class Config:
        populate_by_name = True

class ReminderResponse(BaseModel):
    id: str
    patient_id: str = Field(alias="patientId")
    title: str
    title_en: Optional[str] = Field(default=None, alias="titleEn")
    title_as: Optional[str] = Field(default=None, alias="titleAs")
    type: str = Field(default="medicine", alias="type")
    time: str
    schedule: Optional[str] = "Daily"
    notes: Optional[str] = None
    notes_en: Optional[str] = Field(default=None, alias="notesEn")
    notes_as: Optional[str] = Field(default=None, alias="notesAs")
    enabled: bool = True
    completed_today: Optional[bool] = Field(default=False, alias="completedToday")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")

    class Config:
        populate_by_name = True
        from_attributes = True

class AlertBase(BaseModel):
    type: str = Field(default="missed_medicine", pattern="^(missed_medicine|missed_hydration|missed_activity|missed_appointment|inactivity)$", alias="type")
    severity: str = Field(default="medium", pattern="^(high|medium|low)$", alias="severity")
    status: str = Field(default="unread", pattern="^(unread|read|resolved)$", alias="status")
    title: str = Field(..., min_length=1, max_length=128)
    title_en: Optional[str] = Field(default=None, max_length=128, alias="titleEn")
    title_as: Optional[str] = Field(default=None, max_length=128, alias="titleAs")
    description: str = Field(..., min_length=1, max_length=2000)
    description_en: Optional[str] = Field(default=None, max_length=2000, alias="descriptionEn")
    description_as: Optional[str] = Field(default=None, max_length=2000, alias="descriptionAs")
    relevant_item_title: Optional[str] = Field(default=None, max_length=128, alias="relevantItemTitle")
    relevant_item_id: Optional[str] = Field(default=None, max_length=64, alias="relevantItemId")
    due_time: Optional[str] = Field(default=None, max_length=64, alias="dueTime")

    class Config:
        populate_by_name = True

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    status: Optional[str] = Field(default=None, pattern="^(unread|read|resolved)$")
    read_at: Optional[datetime] = Field(default=None, alias="readAt")
    resolved_at: Optional[datetime] = Field(default=None, alias="resolvedAt")

    class Config:
        populate_by_name = True

class AlertResponse(AlertBase):
    id: str
    patient_id: str = Field(alias="patientId")
    patient_name: Optional[str] = Field(default=None, alias="patientName")
    timestamp: datetime
    read_at: Optional[datetime] = Field(default=None, alias="readAt")
    resolved_at: Optional[datetime] = Field(default=None, alias="resolvedAt")

    class Config:
        populate_by_name = True
        from_attributes = True

class MusicPreferenceResponse(BaseModel):
    id: str
    patient_id: str = Field(alias="patientId")
    title: str
    artist: str
    audio_url: str = Field(alias="audioUrl")
    duration: Optional[str] = "2:30"
    is_built_in: Optional[bool] = Field(default=True, alias="isBuiltIn")
    is_synthesized: Optional[bool] = Field(default=True, alias="isSynthesized")

    class Config:
        populate_by_name = True
        from_attributes = True

class GameAttemptCreate(BaseModel):
    patient_id: str = Field(..., min_length=1, max_length=64, alias="patientId")
    game_id: str = Field(..., pattern="^(photo-puzzle|familiar-faces|familiar-voices|routine-recall|odd-one-out|shape-fit|matching-family)$", alias="gameId")
    cognitive_skill: Optional[str] = Field(default=None, max_length=64, alias="cognitiveSkill")
    cognitive_skills: Optional[List[str]] = Field(default=None, alias="cognitiveSkills")
    level: int = Field(default=1, ge=1, le=10)
    score: int = Field(default=100, ge=0, le=100)
    mistakes_count: int = Field(default=0, ge=0, le=1000, alias="mistakesCount")
    success: bool = True
    time_taken_seconds: int = Field(default=0, ge=0, le=86400, alias="timeTakenSeconds")

    class Config:
        populate_by_name = True

class GameAttemptResponse(BaseModel):
    id: str
    patient_id: str = Field(alias="patientId")
    game_id: str = Field(alias="gameId")
    cognitive_skill: str = Field(alias="cognitiveSkill")
    cognitive_skills: Optional[List[str]] = Field(default=None, alias="cognitiveSkills")
    level: int
    score: int
    mistakes_count: int = Field(alias="mistakesCount")
    success: bool
    time_taken_seconds: int = Field(alias="timeTakenSeconds")
    timestamp: str

    class Config:
        populate_by_name = True
        from_attributes = True

class SkillTrend(BaseModel):
    skill: str
    score: int
    attempts_count: int = Field(alias="attemptsCount")

    class Config:
        populate_by_name = True

class CognitiveAnalyticsResponse(BaseModel):
    patient_id: str = Field(alias="patientId")
    total_attempts: int = Field(alias="totalAttempts")
    success_rate: int = Field(alias="successRate")
    cognitive_scores: Dict[str, int] = Field(alias="cognitiveScores")
    strongest_area: str = Field(alias="strongestArea")
    practice_area: str = Field(alias="practiceArea")
    recommended_activity: str = Field(alias="recommendedActivity")
    recommended_level: int = Field(alias="recommendedLevel")
    recent_trends: List[SkillTrend] = Field(alias="recentTrends")

    class Config:
        populate_by_name = True

class AIRecommendationResponse(BaseModel):
    recommended_game: str = Field(alias="recommendedGame")
    recommended_level: int = Field(alias="recommendedLevel")
    reason: str
    confidence: float
    is_ai_powered: bool = Field(default=False, alias="isAiPowered")

    class Config:
        populate_by_name = True

class AICaregiverInsightResponse(BaseModel):
    summary: str
    strongest_area: str = Field(alias="strongestArea")
    practice_area: str = Field(alias="practiceArea")
    recommended_activity: str = Field(alias="recommendedActivity")
    recommended_level: int = Field(alias="recommendedLevel")
    reason: str
    caregiver_suggestions: List[str] = Field(alias="caregiverSuggestions")
    confidence: float
    disclaimer: str
    is_ai_powered: bool = Field(default=False, alias="isAiPowered")

    class Config:
        populate_by_name = True

class SyncBootstrapRequest(BaseModel):
    patient: Optional[Dict[str, Any]] = None
    family_members: Optional[List[Dict[str, Any]]] = Field(default=None, alias="familyMembers")
    routines: Optional[List[Dict[str, Any]]] = None
    reminders: Optional[List[Dict[str, Any]]] = None
    music_tracks: Optional[List[Dict[str, Any]]] = Field(default=None, alias="musicTracks")
    attempts: Optional[List[Dict[str, Any]]] = None

    class Config:
        populate_by_name = True

class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize to speech")
    language: str = Field(default="en", description="Language code (en, as, bn, ne, lus, kha, ny, trp)")
