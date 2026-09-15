from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from ..models import GameAttempt, Patient

# Primary cognitive skill mapping
GAME_COGNITIVE_SKILL_MAP = {
    'routine-recall': 'recall',
    'photo-puzzle': 'problem_solving',
    'familiar-faces': 'recognition',
    'odd-one-out': 'categorization',
    'matching-family': 'associative_memory',
    'shape-fit': 'visual_spatial',
    'familiar-voices': 'recognition',
}

# Secondary cognitive skills
GAME_SECONDARY_SKILLS_MAP = {
    'routine-recall': ['recall'],
    'photo-puzzle': ['problem_solving', 'visual_spatial'],
    'familiar-faces': ['recognition'],
    'odd-one-out': ['categorization'],
    'matching-family': ['associative_memory', 'recognition'],
    'shape-fit': ['visual_spatial', 'problem_solving'],
    'familiar-voices': ['recognition', 'associative_memory'],
}

ALL_COGNITIVE_SKILLS = [
    'recall',
    'recognition',
    'associative_memory',
    'problem_solving',
    'categorization',
    'visual_spatial',
]

PRACTICE_SKILL_TO_GAME = {
    'categorization': 'odd-one-out',
    'associative_memory': 'matching-family',
    'visual_spatial': 'shape-fit',
    'problem_solving': 'photo-puzzle',
    'recognition': 'familiar-faces',
    'recall': 'routine-recall',
}

class AnalyticsService:
    @staticmethod
    def calculate_patient_analytics(db: Session, patient_id: str) -> Dict[str, Any]:
        attempts = db.query(GameAttempt).filter(
            GameAttempt.patient_id == patient_id
        ).order_by(GameAttempt.timestamp.desc()).all()

        total_attempts = len(attempts)
        successful_attempts = sum(1 for a in attempts if a.success)
        success_rate = round((successful_attempts / total_attempts) * 100) if total_attempts > 0 else 100

        # Baseline scores
        cognitive_scores: Dict[str, int] = {
            'recognition': 88,
            'recall': 82,
            'problem_solving': 78,
            'associative_memory': 75,
            'categorization': 72,
            'visual_spatial': 80,
        }

        skill_attempts: Dict[str, List[Dict[str, Any]]] = {s: [] for s in ALL_COGNITIVE_SKILLS}

        for a in attempts:
            skill = a.cognitive_skill or GAME_COGNITIVE_SKILL_MAP.get(a.game_id, 'problem_solving')
            if skill in skill_attempts:
                skill_attempts[skill].append({'score': a.score, 'timestamp': a.timestamp})

            # Secondary skills contribution
            for sec_skill in GAME_SECONDARY_SKILLS_MAP.get(a.game_id, []):
                if sec_skill != skill and sec_skill in skill_attempts:
                    skill_attempts[sec_skill].append({'score': round(a.score * 0.9), 'timestamp': a.timestamp})

        recent_trends = []
        for skill in ALL_COGNITIVE_SKILLS:
            items = skill_attempts[skill]
            if items:
                # Recency weighting
                weighted_sum = 0.0
                total_weight = 0.0
                for idx, item in enumerate(items):
                    weight = 2.0 if idx == 0 else 1.5 if idx == 1 else 1.2 if idx == 2 else 1.0
                    weighted_sum += item['score'] * weight
                    total_weight += weight
                calculated = round(weighted_sum / total_weight)
                cognitive_scores[skill] = max(20, min(100, calculated))

            recent_trends.append({
                'skill': skill,
                'score': cognitive_scores[skill],
                'attemptsCount': len(items)
            })

        # Identify strongest and practice areas
        strongest_area = max(cognitive_scores.keys(), key=lambda k: cognitive_scores[k])
        practice_area = min(cognitive_scores.keys(), key=lambda k: cognitive_scores[k])
        recommended_activity = PRACTICE_SKILL_TO_GAME.get(practice_area, 'odd-one-out')

        # Recommended level based on attempts
        from .personalization import PersonalizationEngine
        recommended_level = PersonalizationEngine.get_recommended_level(recommended_activity, attempts)

        return {
            'patientId': patient_id,
            'totalAttempts': total_attempts,
            'successRate': success_rate,
            'cognitiveScores': cognitive_scores,
            'strongestArea': strongest_area,
            'practiceArea': practice_area,
            'recommendedActivity': recommended_activity,
            'recommendedLevel': recommended_level,
            'recentTrends': recent_trends,
        }
