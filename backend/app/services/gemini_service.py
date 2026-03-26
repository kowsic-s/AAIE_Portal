"""Gemini AI service for generating personalised academic recommendations."""

import asyncio
import logging
import os
from typing import Optional
from app.config import get_settings

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self):
        self._client = None
        self._model_name = get_settings().GEMINI_MODEL
        self._init_client()

    def _init_client(self) -> None:
        # Refresh .env values for long-running dev processes where env keys can change.
        try:
            from dotenv import load_dotenv
            load_dotenv(override=True)
        except Exception:
            pass

        settings = get_settings()
        api_key = (
            os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
            or settings.GEMINI_API_KEY
        )
        if api_key:
            api_key = api_key.strip()

        env_model = os.getenv("GEMINI_MODEL")
        if env_model and env_model.strip():
            self._model_name = env_model.strip()

        if not api_key:
            logger.warning("GEMINI_API_KEY not set — Gemini recommendations will be unavailable")
            return
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)

            configured = (self._model_name or settings.GEMINI_MODEL or "gemini-2.5-flash").replace("models/", "")
            fallback_candidates = [
                configured,
                "gemini-2.5-flash",
                "gemini-2.0-flash",
                "gemini-flash-latest",
                "gemini-pro-latest",
            ]

            selected = configured
            try:
                available = {
                    m.name.replace("models/", "")
                    for m in genai.list_models()
                    if "generateContent" in (m.supported_generation_methods or [])
                }
                for candidate in fallback_candidates:
                    if candidate in available:
                        selected = candidate
                        break
                if selected != configured:
                    logger.warning(
                        "Configured Gemini model '%s' unavailable; using '%s'",
                        configured,
                        selected,
                    )
            except Exception as list_err:
                logger.warning("Could not list Gemini models, using configured model '%s': %s", configured, list_err)

            self._model_name = selected
            self._client = genai.GenerativeModel(self._model_name)
            logger.info(f"Gemini client initialised: {self._model_name}")
        except Exception as e:
            self._client = None
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
            self._init_client()
        if self._client is None:
            logger.warning("Using fallback recommendation because Gemini client is unavailable")
            return self._fallback_recommendation(attendance_pct, gpa, risk_level)

        prompt = self._build_prompt(attendance_pct, gpa, reward_points, activity_points, risk_level)
        try:
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(None, lambda: self._client.generate_content(prompt))

            text = getattr(response, "text", None)
            if text:
                return text

            # Older/newer SDK variants may not expose response.text directly.
            candidates = getattr(response, "candidates", None) or []
            if candidates:
                parts = getattr(candidates[0].content, "parts", None) or []
                joined = "\n".join(getattr(p, "text", "") for p in parts).strip()
                if joined:
                    return joined

            logger.warning("Gemini returned empty content; using fallback recommendation")
            return self._fallback_recommendation(attendance_pct, gpa, risk_level)
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            # Retry once in case credentials/model state changed during runtime.
            self._client = None
            self._init_client()
            if self._client is not None:
                try:
                    loop = asyncio.get_running_loop()
                    response = await loop.run_in_executor(None, lambda: self._client.generate_content(prompt))
                    text = getattr(response, "text", None)
                    if text:
                        return text
                except Exception as retry_err:
                    logger.error(f"Gemini retry failed: {retry_err}")
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
