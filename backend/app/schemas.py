from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class PatientBase(BaseModel):
    name: str
    age: int
    dementia_type: str = Field(default="Alzheimer's Disease (Early-to-Mild)", alias="dementiaType")
    dementia_stage: str = Field(default="mild", alias="dementiaStage")
    preferred_language: str = Field(default="as", alias="preferredLanguage")
    avatar_url: Optional[str] = Field(default=None, alias="avatarUrl")
    notes: Optional[str] = None

    class Config:
        populate_by_name = True

class PatientCreate(PatientBase):
    id: Optional[str] = None

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
    patient_id: str = Field(alias="patientId")
    game_id: str = Field(alias="gameId")
    cognitive_skill: Optional[str] = Field(default=None, alias="cognitiveSkill")
    cognitive_skills: Optional[List[str]] = Field(default=None, alias="cognitiveSkills")
    level: int = 1
    score: int = 100
    mistakes_count: int = Field(default=0, alias="mistakesCount")
    success: bool = True
    time_taken_seconds: int = Field(default=0, alias="timeTakenSeconds")

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
    music_tracks: Optional[List[Dict[str, Any]]] = Field(default=None, alias="musicTracks")
    attempts: Optional[List[Dict[str, Any]]] = None

    class Config:
        populate_by_name = True
