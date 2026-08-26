"""
ORVYN Voice Engine
Handles voice transcription status, text-to-speech audio presets, and voice commands.
"""

from typing import Any, Dict, List


class VoiceEngine:
    VOICE_PRESETS = [
        {"id": "nova", "name": "Nova (Smooth & Crisp)", "gender": "Female", "speed": 1.0, "pitch": 1.0},
        {"id": "atlas", "name": "Atlas (Deep & Authoritative)", "gender": "Male", "speed": 0.95, "pitch": 0.9},
        {"id": "echo", "name": "Echo (Warm & Conversational)", "gender": "Neutral", "speed": 1.05, "pitch": 1.0},
        {"id": "sol", "name": "Sol (Energetic & Bright)", "gender": "Female", "speed": 1.1, "pitch": 1.15},
    ]

    @classmethod
    def get_presets(cls) -> List[Dict[str, Any]]:
        return cls.VOICE_PRESETS

    @classmethod
    def process_voice_command(cls, transcript: str) -> Dict[str, Any]:
        """Detects voice commands like 'clear chat', 'open dashboard', 'run python code', etc."""
        text = transcript.lower().strip()
        command = None

        if "clear chat" in text or "new chat" in text:
            command = "NEW_CHAT"
        elif "open dashboard" in text or "show dashboard" in text:
            command = "NAVIGATE_DASHBOARD"
        elif "open memory" in text or "show memory" in text:
            command = "NAVIGATE_MEMORY"
        elif "open tools" in text or "show tools" in text:
            command = "NAVIGATE_TOOLS"
        elif "open agents" in text or "show agents" in text:
            command = "NAVIGATE_AGENTS"
        elif "dark mode" in text or "light mode" in text or "toggle theme" in text:
            command = "TOGGLE_THEME"

        return {
            "transcript": transcript,
            "detected_command": command,
            "is_command": command is not None,
        }
