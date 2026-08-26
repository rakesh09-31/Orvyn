"""
ORVYN Memory Engine
Persistent and in-memory key-value and conversational context store.
"""

import json
import os
import time
from typing import Any, Dict, List, Optional


class MemoryStore:
    def __init__(self, storage_path: Optional[str] = None):
        if storage_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.storage_path = os.path.join(base_dir, "memory", "memory_data.json")
        else:
            self.storage_path = storage_path

        self._memories: List[Dict[str, Any]] = []
        self._load()

    def _load(self) -> None:
        try:
            if os.path.exists(self.storage_path):
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    self._memories = json.load(f)
            else:
                # Default starter memories
                self._memories = [
                    {
                        "id": "mem_1",
                        "category": "User Profile",
                        "key": "User Name",
                        "value": "Rakesh",
                        "timestamp": time.time(),
                        "pinned": True,
                    },
                    {
                        "id": "mem_2",
                        "category": "Preferences",
                        "key": "Preferred AI Tone",
                        "value": "Concise, precise, and technically accurate",
                        "timestamp": time.time(),
                        "pinned": True,
                    },
                    {
                        "id": "mem_3",
                        "category": "System Context",
                        "key": "Hardware Profile",
                        "value": "Local execution on RTX GPU with Ollama Qwen model",
                        "timestamp": time.time(),
                        "pinned": False,
                    },
                ]
                self._save()
        except Exception:
            self._memories = []

    def _save(self) -> None:
        try:
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(self._memories, f, indent=2)
        except Exception as e:
            print(f"Error saving memories: {e}")

    def get_all(self) -> List[Dict[str, Any]]:
        return self._memories

    def search(self, query: str) -> List[Dict[str, Any]]:
        q = query.lower()
        return [
            m
            for m in self._memories
            if q in m.get("key", "").lower()
            or q in m.get("value", "").lower()
            or q in m.get("category", "").lower()
        ]

    def add(self, key: str, value: str, category: str = "General", pinned: bool = False) -> Dict[str, Any]:
        mem_id = f"mem_{int(time.time() * 1000)}"
        memory_item = {
            "id": mem_id,
            "category": category,
            "key": key.strip(),
            "value": value.strip(),
            "timestamp": time.time(),
            "pinned": pinned,
        }
        self._memories.append(memory_item)
        self._save()
        return memory_item

    def update(self, mem_id: str, key: str, value: str, category: str = "General", pinned: bool = False) -> Optional[Dict[str, Any]]:
        for m in self._memories:
            if m["id"] == mem_id:
                m["key"] = key
                m["value"] = value
                m["category"] = category
                m["pinned"] = pinned
                m["timestamp"] = time.time()
                self._save()
                return m
        return None

    def delete(self, mem_id: str) -> bool:
        initial_len = len(self._memories)
        self._memories = [m for m in self._memories if m["id"] != mem_id]
        if len(self._memories) < initial_len:
            self._save()
            return True
        return False

    def clear(self) -> None:
        self._memories = []
        self._save()

    def get_context_summary(self) -> str:
        """Returns a string formatted for inclusion in LLM system prompt context."""
        if not self._memories:
            return ""
        lines = ["User Long-term Context:"]
        for m in self._memories:
            lines.append(f"- {m['key']}: {m['value']}")
        return "\n".join(lines)


# Global instance
memory_store = MemoryStore()
