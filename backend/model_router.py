"""
ORVYN Model and Intent Router
Routes incoming messages to specialized system prompts and model parameters.
"""

from typing import Any, Dict

FAST_MODEL = "qwen3:4b"
GENERAL_MODEL = "qwen3:4b"
EXAM_MODEL = "qwen3:4b"
CODING_MODEL = "qwen3:4b"
REASONING_MODEL = "qwen3:4b"


def route_request(message: str) -> Dict[str, Any]:
    text = message.lower().strip()

    # 1. EXAM / LONG ANSWER (Highest priority to avoid falling into FAST)
    exam_keywords = [
        "15 marks",
        "15 mark",
        "10 marks",
        "10 mark",
        "20 marks",
        "5 marks",
        "5 mark",
        "exam answer",
        "exam question",
        "university exam",
        "semester exam",
        "long answer",
        "detailed answer",
        "write in detail",
        "explain in detail",
        "theory answer",
        "for my exam",
    ]

    # 2. CODING
    coding_keywords = [
        "write python",
        "write code",
        "write a program",
        "python code",
        "python function",
        "javascript",
        "typescript",
        "react",
        "html",
        "css",
        "debug",
        "fix this code",
        "correct this code",
        "leetcode",
        "algorithm",
        "function to",
        "code to",
        "program to",
        "build a website",
        "create a website",
        "create an app",
        "build an app",
        "api",
        "sql query",
        "fastapi",
        "node",
    ]

    # 3. REASONING / ARCHITECTURE / SYSTEM DESIGN
    reasoning_keywords = [
        "design an ai",
        "design a system",
        "system design",
        "design architecture",
        "architecture design",
        "system architecture",
        "software architecture",
        "analyze",
        "analyse",
        "tradeoff",
        "trade offs",
        "trade-off",
        "deep analysis",
        "how should i build",
        "strategy",
    ]

    # 4. FAST FACTUAL
    fast_starters = [
        "what is ",
        "what are ",
        "who is ",
        "who was ",
        "where is ",
        "when was ",
        "when did ",
        "how many ",
        "define ",
        "meaning of ",
        "what does ",
        "what do ",
    ]

    simple_topics = [
        "ram",
        "cpu",
        "gpu",
        "rom",
        "api",
        "http",
        "https",
        "url",
        "usb",
        "wifi",
        "database",
        "operating system",
    ]

    if any(keyword in text for keyword in exam_keywords):
        return {
            "intent": "EXAM",
            "model": EXAM_MODEL,
            "confidence": 0.98,
            "badge": "Exam Prep Mode",
            "color": "#e11d48",
        }

    if any(keyword in text for keyword in coding_keywords):
        return {
            "intent": "CODING",
            "model": CODING_MODEL,
            "confidence": 0.95,
            "badge": "Code Mode",
            "color": "#8b5cf6",
        }

    if any(keyword in text for keyword in reasoning_keywords):
        return {
            "intent": "REASONING",
            "model": REASONING_MODEL,
            "confidence": 0.92,
            "badge": "Reasoning Mode",
            "color": "#0ea5e9",
        }

    brief_keywords = [
        "briefly",
        "in brief",
        "in short",
        "quick summary",
        "quick explanation",
        "in one line",
        "in 1 line",
        "in one sentence",
        "in 1 sentence",
        "few words",
    ]

    if any(keyword in text for keyword in brief_keywords):
        if not any(k in text for k in exam_keywords + coding_keywords + reasoning_keywords):
            return {
                "intent": "FAST",
                "model": FAST_MODEL,
                "confidence": 0.94,
                "badge": "Fast Answer",
                "color": "#10b981",
            }

    if any(text.startswith(starter) for starter in fast_starters):
        if not any(k in text for k in exam_keywords + coding_keywords + reasoning_keywords):
            return {
                "intent": "FAST",
                "model": FAST_MODEL,
                "confidence": 0.90,
                "badge": "Fast Answer",
                "color": "#10b981",
            }

    if len(text.split()) <= 6 and any(topic in text for topic in simple_topics):
        if not any(k in text for k in exam_keywords + coding_keywords + reasoning_keywords):
            return {
                "intent": "FAST",
                "model": FAST_MODEL,
                "confidence": 0.88,
                "badge": "Fast Answer",
                "color": "#10b981",
            }

    return {
        "intent": "GENERAL",
        "model": GENERAL_MODEL,
        "confidence": 0.85,
        "badge": "General Assistant",
        "color": "#7047ff",
    }