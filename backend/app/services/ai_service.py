import os
import json
import httpx
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from ..models import Patient, GameAttempt
from .analytics_service import AnalyticsService
from .personalization import PersonalizationEngine

DISCLAIMER_TEXT = "Memora's insights are based on activity performance and are intended for supportive guidance only. They are not a medical assessment."

class AIService:
    @staticmethod
    async def get_caregiver_insights(db: Session, patient_id: str, lang: str = 'en') -> Dict[str, Any]:
        analytics = AnalyticsService.calculate_patient_analytics(db, patient_id)
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        attempts = db.query(GameAttempt).filter(GameAttempt.patient_id == patient_id).order_by(GameAttempt.timestamp.desc()).limit(5).all()

        strongest = analytics['strongestArea']
        practice = analytics['practiceArea']
        recommended_activity = analytics['recommendedActivity']
        recommended_level = analytics['recommendedLevel']

        # Construct deterministic fallback
        fallback = AIService._generate_deterministic_insight(
            patient.name if patient else "the senior",
            strongest,
            practice,
            recommended_activity,
            recommended_level,
            analytics['cognitiveScores'],
            lang
        )

        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            return fallback

        # Call Gemini REST API
        try:
            prompt_data = {
                "patient_name": patient.name if patient else "Senior",
                "preferred_language": lang,
                "cognitive_activity_scores": analytics['cognitiveScores'],
                "strongest_area": strongest,
                "practice_area": practice,
                "recent_attempts": [
                    {"game": a.game_id, "level": a.level, "score": a.score, "success": a.success}
                    for a in attempts
                ]
            }

            system_instruction = (
                "You are Memora's cognitive activity advisor for dementia caregivers. "
                "CRITICAL SAFETY RULES: "
                "1. NEVER diagnose dementia, cognitive impairment, or disease progression. "
                "2. NEVER recommend medication, stopping medication, or clinical treatments. "
                "3. Your suggestions are ONLY for gentle, supportive daily activities, familiar communication, and reassurance. "
                "4. All scores are game activity engagement scores, NOT clinical or medical measurements. "
                "5. Return ONLY a valid JSON object matching the requested schema. Do not wrap in markdown or backticks."
            )

            user_prompt = f"""
Language requested for output: {lang}
Activity Performance Data:
{json.dumps(prompt_data, ensure_ascii=False)}

Generate a helpful, empathetic caregiver guidance response in JSON format with these exact keys:
{{
  "summary": "Short 1-2 sentence supportive summary of recent activity performance.",
  "strongestArea": "{strongest}",
  "practiceArea": "{practice}",
  "recommendedActivity": "{recommended_activity}",
  "recommendedLevel": {recommended_level},
  "reason": "1-2 sentence gentle rationale for this activity.",
  "caregiverSuggestions": [
    "Practical daily care tip 1",
    "Communication tip 2",
    "Activity tip 3"
  ],
  "confidence": 0.88
}}
"""

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"{system_instruction}\n\n{user_prompt}"}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.3,
                    "responseMimeType": "application/json"
                }
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed = json.loads(text_content)

                        # Enforce deterministic safe level clamp
                        raw_level = int(parsed.get("recommendedLevel", recommended_level))
                        safe_level = PersonalizationEngine.clamp_ai_level(
                            parsed.get("recommendedActivity", recommended_activity),
                            raw_level,
                            attempts
                        )

                        return {
                            "summary": parsed.get("summary", fallback["summary"]),
                            "strongestArea": parsed.get("strongestArea", strongest),
                            "practiceArea": parsed.get("practiceArea", practice),
                            "recommendedActivity": parsed.get("recommendedActivity", recommended_activity),
                            "recommendedLevel": safe_level,
                            "reason": parsed.get("reason", fallback["reason"]),
                            "caregiverSuggestions": parsed.get("caregiverSuggestions", fallback["caregiverSuggestions"]),
                            "confidence": float(parsed.get("confidence", 0.85)),
                            "disclaimer": DISCLAIMER_TEXT,
                            "isAiPowered": True
                        }
        except Exception as e:
            print(f"Gemini API fallback triggered: {e}")

        return fallback

    @staticmethod
    def _generate_deterministic_insight(
        patient_name: str,
        strongest: str,
        practice: str,
        recommended_activity: str,
        recommended_level: int,
        scores: Dict[str, int],
        lang: str
    ) -> Dict[str, Any]:
        skill_display = {
            'recall': {'en': 'Recall', 'as': 'ৰুটিন মনত পেলোৱা'},
            'recognition': {'en': 'Recognition', 'as': 'চিনাকি মুখ আৰু মাত'},
            'associative_memory': {'en': 'Associative Memory', 'as': 'সম্পৰ্ক চিনাক্তকৰণ'},
            'problem_solving': {'en': 'Problem-solving', 'as': 'ছবিৰ সাঁথৰ সমাধান'},
            'categorization': {'en': 'Categorization', 'as': 'বস্তুৰ শ্ৰেণী বিভাজন'},
            'visual_spatial': {'en': 'Visual-spatial', 'as': 'আকৃতি চিনাক্তকৰণ'},
        }

        strongest_label = skill_display.get(strongest, {}).get(lang, strongest.replace('_', ' ').title())
        practice_label = skill_display.get(practice, {}).get(lang, practice.replace('_', ' ').title())

        if lang == 'as':
            summary = f"{patient_name}ৰ {strongest_label} সম্পৰ্কীয় খেলসমূহত সুন্দৰ সঁহাৰি দেখা গৈছে ({scores.get(strongest, 85)}%)। {practice_label}ত অলপ অধিক মনোযোগ আৰু অনুশীলন দিলে মন অধিক সতেজ থাকিব।"
            reason = f"চিনাকি ঘৰুৱা সামগ্ৰী বা ফটোৰে সহজ স্তৰত আৰম্ভ কৰিলে মানসিক চাপ নপৰে।"
            suggestions = [
                "খেলৰ সময়ত কোনো খৰখেদা নকৰিব, উত্তৰ দিবলৈ পৰ্যাপ্ত সময় দিয়ক।",
                "ভুল উত্তৰ দিলে শুধৰাই নিদিব, বৰঞ্চ মৰমেৰে আন এখন ফটো বা বিকল্পৰ ফালে আঙুলিয়াই দিয়ক।",
                "খেলৰ অন্তত প্ৰিয় বাঁহীৰ সুৰ বা বৰগীত শুনাই মন শান্ত ৰাখক।"
            ]
        else:
            summary = f"{strongest_label} activities show strong, steady engagement ({scores.get(strongest, 85)}%). Continuing gentle practice in {practice_label} will provide comforting cognitive stimulation."
            reason = f"Using familiar household objects or photographs builds confidence without frustration."
            suggestions = [
                "Allow unhurried time for answering questions comfortably.",
                "Validate emotional expression rather than pointing out mistakes.",
                "Pair short sessions with familiar soothing music or a warm cup of tea."
            ]

        return {
            "summary": summary,
            "strongestArea": strongest_label,
            "practiceArea": practice_label,
            "recommendedActivity": recommended_activity,
            "recommendedLevel": recommended_level,
            "reason": reason,
            "caregiverSuggestions": suggestions,
            "confidence": 0.85,
            "disclaimer": DISCLAIMER_TEXT,
            "isAiPowered": False
        }
