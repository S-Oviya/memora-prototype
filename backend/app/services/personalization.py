from typing import List, Dict, Any, Optional
from ..models import GameAttempt

ALL_GAMES = [
    'photo-puzzle',
    'familiar-faces',
    'familiar-voices',
    'routine-recall',
    'odd-one-out',
    'shape-fit',
    'matching-family',
]

class PersonalizationEngine:
    @staticmethod
    def get_recommended_level(game_id: str, attempts: List[GameAttempt]) -> int:
        game_attempts = [a for a in attempts if a.game_id == game_id]
        if not game_attempts:
            return 1

        recent = game_attempts[:3]
        last_attempt = recent[0]

        # Check if patient struggled
        if not last_attempt.success or last_attempt.mistakes_count >= 3 or last_attempt.score < 50:
            return max(1, last_attempt.level - 1)

        # If last two attempts were very successful
        successful = [a for a in recent if a.success and a.score >= 80]
        if len(successful) >= 2:
            highest = max(a.level for a in successful)
            return min(5, highest + 1)

        return min(5, max(1, last_attempt.level))

    @staticmethod
    def get_max_safe_level(game_id: str, attempts: List[GameAttempt]) -> int:
        current_rec = PersonalizationEngine.get_recommended_level(game_id, attempts)
        return min(5, current_rec + 1)

    @staticmethod
    def clamp_ai_level(game_id: str, suggested_level: int, attempts: List[GameAttempt]) -> int:
        max_safe = PersonalizationEngine.get_max_safe_level(game_id, attempts)
        return min(max_safe, max(1, suggested_level))
