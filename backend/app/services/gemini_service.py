"""Gemini AI service for generating personalised academic recommendations."""

import logging
from typing import Optional
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class GeminiService:
    def __init__(self):
        self._client = None
        self._model_name = settings.GEMINI_MODEL
        self._init_client()

    def _init_client(self) -> None:
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set — Gemini recommendations will be unavailable")
            return
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._client = genai.GenerativeModel(self._model_name)
            logger.info(f"Gemini client initialised: {self._model_name}")
        except Exception as e:
            logger.error(f"Failed to init Gemini client: {e}")

    def _build_prompt(
        self,
        attendance_pct: float,
        gpa: float,
        reward_points: int,
        activity_points: int,
        risk_level: str,
    ) -> str:
        return (
            "You are an academic advisor. A student has the following profile:\n"
            f"Attendance: {attendance_pct:.1f}%, GPA: {gpa:.2f}, "
            f"Reward Points: {reward_points}, Activity Points: {activity_points}, "
            f"Risk Level: {risk_level}.\n\n"
            "Generate a personalised, encouraging, and actionable improvement plan. "
            "Structure it with 3 sections:\n"
            "1) Key Focus Areas\n"
            "2) Weekly Action Steps\n"
            "3) Motivational Note\n\n"
            "Be specific, warm, and practical. Max 300 words."
        )

    async def generate_recommendation(
        self,
        attendance_pct: float,
        gpa: float,
        reward_points: int,
        activity_points: int,
        risk_level: str,
    ) -> Optional[str]:
        if self._client is None:
            return self._fallback_recommendation(attendance_pct, gpa, risk_level)

        prompt = self._build_prompt(attendance_pct, gpa, reward_points, activity_points, risk_level)
        try:
            response = self._client.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            return self._fallback_recommendation(attendance_pct, gpa, risk_level)

    def _fallback_recommendation(self, attendance_pct: float, gpa: float, risk_level: str) -> str:
        sections = []
        sections.append("**1) Key Focus Areas**")

        if attendance_pct < 75:
            sections.append(
                "- Your attendance is below the recommended threshold. "
                "Regular attendance is critical for academic success."
            )
        if gpa < 5.0:
            sections.append(
                "- Your GPA needs improvement. Focus on understanding core concepts "
                "and seek help from tutors or faculty."
            )
        if risk_level == "High":
            sections.append(
                "- Engage with your academic mentor as soon as possible to discuss a personalised recovery plan."
            )

        sections.append("\n**2) Weekly Action Steps**")
        sections.append(
            "- Attend all scheduled classes and tutorials.\n"
            "- Set aside at least 2 hours of focused study per subject per day.\n"
            "- Participate in one extracurricular or academic activity each week.\n"
            "- Review previous semester feedback and address weak areas."
        )

        sections.append("\n**3) Motivational Note**")
        if risk_level == "High":
            sections.append(
                "Every great academic journey has challenges. The fact that you are looking at this "
                "plan shows your commitment. Small, consistent steps lead to big improvements. "
                "You have the ability to turn this around — start today."
            )
        elif risk_level == "Medium":
            sections.append(
                "You are on the right path! A few focused improvements will make a significant "
                "difference. Stay consistent, stay motivated, and celebrate small wins along the way."
            )
        else:
            sections.append(
                "Outstanding work! Keep up this excellent momentum. "
                "Challenge yourself further by taking on leadership roles and mentoring peers."
            )

        return "\n".join(sections)


_gemini_instance: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    global _gemini_instance
    if _gemini_instance is None:
        _gemini_instance = GeminiService()
    return _gemini_instance
