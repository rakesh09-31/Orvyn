"""
ORVYN Automated Unit Tests
Tests backend cleaners, fallbacks, model routing, tools execution, memory store, and agent orchestration.
"""

import os
import sys
import unittest

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.model_router import route_request
from backend.main import (
    clean_fast_response,
    clean_coding_response,
    clean_exam_response,
    clean_reasoning_response,
    clean_general_response,
    clean_response,
    fast_fallback,
    coding_fallback,
    exam_fallback,
    is_valid_python,
    extract_code,
)
from memory.store import MemoryStore
from tools.executor import ToolExecutor
from agents.orchestrator import AgentOrchestrator
from voice.audio_engine import VoiceEngine


class TestModelRouter(unittest.TestCase):
    def test_exam_routing(self):
        res = route_request("Explain paging in OS for 15 marks with diagram")
        self.assertEqual(res["intent"], "EXAM")

    def test_coding_routing(self):
        res = route_request("Write python code to reverse a binary tree")
        self.assertEqual(res["intent"], "CODING")

    def test_fast_routing(self):
        res = route_request("What is RAM?")
        self.assertEqual(res["intent"], "FAST")

    def test_reasoning_routing(self):
        res = route_request("Design an AI architecture with low latency and streaming")
        self.assertEqual(res["intent"], "REASONING")

    def test_general_routing(self):
        res = route_request("Tell me something interesting about astronomy")
        self.assertEqual(res["intent"], "GENERAL")


class TestCleanersAndValidation(unittest.TestCase):
    def test_is_valid_python(self):
        valid = "def add(a, b):\n    return a + b"
        invalid = "def add(a, b\n return"
        self.assertTrue(is_valid_python(valid))
        self.assertFalse(is_valid_python(invalid))

    def test_extract_code(self):
        text = "Here is the code:\n```python\ndef greet(name):\n    return f'Hello, {name}'\n```\nHope this helps!"
        extracted = extract_code(text)
        self.assertEqual(extracted, "def greet(name):\n    return f'Hello, {name}'")

    def test_fast_fallback(self):
        self.assertIn("Random Access Memory", fast_fallback("what is ram?"))
        self.assertIn("Central Processing Unit", fast_fallback("what is cpu?"))

    def test_coding_fallback(self):
        code = coding_fallback("write python function for prime number check")
        self.assertTrue(is_valid_python(code))

    def test_exam_fallback(self):
        answer = exam_fallback("explain paging for 15 marks")
        self.assertIn("1. Definition", answer)
        self.assertIn("Paging is a memory management scheme", answer)

    def test_clean_fast_response(self):
        raw = "<think>Let me think</think>Okay, the user asked what is RAM. RAM is primary volatile memory."
        cleaned = clean_fast_response(raw)
        self.assertNotIn("<think>", cleaned)
        self.assertNotIn("Okay, the user", cleaned)

    def test_clean_coding_response(self):
        raw = "```python\ndef is_even(n):\n    return n % 2 == 0\n```"
        cleaned = clean_coding_response(raw, "test")
        self.assertEqual(cleaned, "def is_even(n):\n    return n % 2 == 0")

    def test_clean_exam_response_with_planning_outline(self):
        raw = (
            "We are in exam mode. The user asks to explain paging for 15 marks.\n"
            "We must output a detailed university examination answer with definition, working, example, advantages, disadvantages, and conclusion.\n"
            "Let's plan the sections:\n"
            "1. Definition\n"
            "2. Working Principle\n"
            "3. Example\n"
            "4. Advantages & Disadvantages\n"
            "5. Conclusion\n"
            "Let's write the answer accordingly.\n\n"
            "1. Definition\n"
            "Paging is a memory management scheme...\n\n"
            "2. Explanation\n"
            "Physical memory is divided into frames...\n\n"
            "3. Working\n"
            "CPU generates logical address...\n\n"
            "4. Example\n"
            "If page size is 4KB...\n\n"
            "5. Advantages\n"
            "No external fragmentation...\n\n"
            "6. Disadvantages\n"
            "Internal fragmentation...\n\n"
            "7. Conclusion\n"
            "Paging is essential.\n\n"
            "Let me check the answer. Total: 15 marks. We are done."
        )
        cleaned = clean_exam_response(raw)
        self.assertTrue(cleaned.startswith("1. Definition\nPaging is a memory management scheme..."))
        self.assertTrue(cleaned.endswith("7. Conclusion\nPaging is essential."))
        self.assertNotIn("We are in exam mode", cleaned)
        self.assertNotIn("The user asks", cleaned)
        self.assertNotIn("We must", cleaned)
        self.assertNotIn("Let's plan", cleaned)
        self.assertNotIn("Let's write", cleaned)
        self.assertNotIn("Let me check", cleaned)
        self.assertNotIn("We are done", cleaned)

    def test_clean_reasoning_response(self):
        raw = (
            "We are designing an AI assistant architecture for Rakesh's local setup...\n"
            "Key constraints:\n"
            "- Local execution\n"
            "Final Answer Structure:\n"
            "1. Architecture Overview\n"
            "2. Key Components\n\n"
            "Let's write the response:\n\n"
            "# AI Assistant Architecture Design\n\n"
            "## 1. Architecture Overview\n"
            "A modular event-driven assistant architecture.\n\n"
            "## 2. Key Components\n"
            "Model Router and Execution Sandbox.\n\n"
            "Let me check the answer. We are done."
        )
        cleaned = clean_reasoning_response(raw)
        self.assertTrue(cleaned.startswith("# AI Assistant Architecture Design"))
        self.assertNotIn("Rakesh", cleaned)
        self.assertNotIn("Key constraints", cleaned)
        self.assertNotIn("Final Answer Structure", cleaned)
        self.assertNotIn("Let's write", cleaned)
        self.assertNotIn("Let me check", cleaned)
        self.assertNotIn("We are done", cleaned)

    def test_clean_general_response(self):
        raw = (
            "We are writing a short story for user Rakesh...\n"
            "Key points to include:\n"
            "- Student named Eli\n"
            "Let's write:\n\n"
            "Final story:\n\n"
            "Eli was a computer science student who dreamed of building his own AI assistant.\n\n"
            "Let me check. We are done."
        )
        cleaned = clean_general_response(raw)
        self.assertTrue(cleaned.startswith("Eli was a computer science student"))
        self.assertNotIn("Rakesh", cleaned)
        self.assertNotIn("Key points", cleaned)
        self.assertNotIn("Final story", cleaned)
        self.assertNotIn("Let me check", cleaned)
        self.assertNotIn("We are done", cleaned)

        # Multi-draft test
        raw_drafts = (
            "\"Alex, a student, built an AI.\"\n\n"
            "Let me refine:\n\n"
            "\"Eli spent three weeks building a local AI assistant on his GPU.\""
        )
        cleaned_drafts = clean_general_response(raw_drafts)
        self.assertEqual(cleaned_drafts, "Eli spent three weeks building a local AI assistant on his GPU.")


class TestMemoryStore(unittest.TestCase):
    def setUp(self):
        self.test_store_path = os.path.join(PROJECT_ROOT, "memory", "test_memory.json")
        self.store = MemoryStore(storage_path=self.test_store_path)

    def tearDown(self):
        if os.path.exists(self.test_store_path):
            os.remove(self.test_store_path)

    def test_add_and_search_memory(self):
        item = self.store.add("Favorite Color", "Electric Purple", "Preferences", pinned=True)
        self.assertEqual(item["key"], "Favorite Color")
        results = self.store.search("purple")
        self.assertEqual(len(results), 1)

    def test_delete_memory(self):
        item = self.store.add("Temp Key", "Temp Value")
        self.assertTrue(self.store.delete(item["id"]))


class TestToolExecutor(unittest.TestCase):
    def test_calculator(self):
        res = ToolExecutor.execute_calculator("math.sqrt(100) * 5")
        self.assertTrue(res["success"])
        self.assertEqual(res["result"], 50.0)

    def test_python_repl(self):
        res = ToolExecutor.execute_python("print('Hello from ORVYN Sandbox')")
        self.assertTrue(res["success"])
        self.assertIn("Hello from ORVYN Sandbox", res["output"])

    def test_workspace_scanner(self):
        res = ToolExecutor.execute_workspace_scan(".")
        self.assertTrue(res["success"])
        self.assertGreater(res["count"], 0)


class TestAgentOrchestrator(unittest.TestCase):
    def test_agent_workflow(self):
        res = AgentOrchestrator.run_agent_workflow("planner", "Build a high-performance local AI assistant", use_llm=False)
        self.assertTrue(res["success"])
        self.assertEqual(res["agent_id"], "planner")
        self.assertGreater(len(res["steps"]), 0)


class TestVoiceEngine(unittest.TestCase):
    def test_voice_commands(self):
        res = VoiceEngine.process_voice_command("Please clear chat now")
        self.assertTrue(res["is_command"])
        self.assertEqual(res["detected_command"], "NEW_CHAT")


if __name__ == "__main__":
    unittest.main()
