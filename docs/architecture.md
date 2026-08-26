# ORVYN Architecture & Technical Specification

ORVYN is a high-performance, private, local AI assistant designed to run on-device (powered by local LLMs such as Qwen via Ollama) with low latency, multi-intent prompt specialization, persistent memory, autonomous agents, tool execution, and voice synthesis.

---

## High-Level Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                            ORVYN Frontend (React 19)                           |
|  +--------------+  +--------------+  +--------------+  +-------------------+  |
|  |  Chat View   |  |  Dashboard   |  | Memory Store |  | Multi-Agent Studio|  |
|  |  (Streaming) |  |  (Telemetry) |  |  (Context)   |  |   (Orchestrator)  |  |
|  +--------------+  +--------------+  +--------------+  +-------------------+  |
|  +--------------+  +--------------+  +--------------+                         |
|  | Tools Runner |  | Voice Assist |  |   Settings   |                         |
|  | (Python REPL)|  |  (STT / TTS) |  |   (Config)   |                         |
|  +--------------+  +--------------+  +--------------+                         |
+-------------------------------------------------------------------------------+
                                      │ HTTP / NDJSON Streaming
                                      ▼
+-------------------------------------------------------------------------------+
|                            ORVYN Backend (FastAPI)                            |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                      Multi-Intent Model Router                          |  |
|  |       [ FAST ]      [ CODING ]      [ EXAM ]      [ REASONING ]         |  |
|  +-------------------------------------------------------------------------+  |
|                                      │                                        |
|  +-----------------------------------+-------------------------------------+  |
|  │ Specialized Prompt Templates & Context Injection (Memory Store)         │  |
|  +-----------------------------------+-------------------------------------+  |
|                                      │                                        |
|  +-----------------------------------+-------------------------------------+  |
|  |               Response Cleaners & Validation Pipelines                  |  |
|  |     • remove_thinking_tags     • extract_code / is_valid_python         |  |
|  |     • clean_exam_response      • clean_reasoning_response               |  |
|  +-----------------------------------+-------------------------------------+  |
|                                      │                                        |
|  +-----------------------------------+-------------------------------------+  |
|  |                   Subsystem Engines & Sandboxes                         |  |
|  |     • Memory Engine: Key-value context persistence                      |  |
|  |     • Tools Framework: Python Sandbox, Calc, Workspace Scanner          |  |
|  |     • Agent Orchestrator: Multi-step Autonomous Personas                |  |
|  |     • Voice Engine: Command interpreter & TTS Preset Manager            |  |
|  +-----------------------------------+-------------------------------------+  |
|                                      │                                        |
|                                      ▼                                        |
|                        Ollama Local Daemon (qwen3:4b)                         |
|                      NVIDIA RTX GPU / CUDA Accelerated                        |
+-------------------------------------------------------------------------------+
```

---

## 1. Intent Detection & Routing

Every incoming message is analyzed by [backend/model_router.py](file:///c:/Users/rakes/OneDrive/Desktop/ORVYN/backend/model_router.py):
- **FAST**: Factual, concise lookup questions ("what is RAM?", "define API"). Strict token limit (350 tokens) with instant deterministic fallbacks.
- **CODING**: Software engineering tasks. Strips preamble/conversational reasoning and outputs complete, syntactically verified code.
- **EXAM**: Academic university examination questions (5, 10, 15 marks). Formats response into structured headings: Definition, Working, Example, Advantages/Disadvantages, and Conclusion.
- **REASONING**: System design, architecture comparisons, and deep algorithmic strategy.
- **GENERAL**: Conversational AI assistant mode.

---

## 2. Streaming Protocol

- **Endpoint**: `POST /chat/stream`
- **Media Type**: `application/x-ndjson` (Newline-Delimited JSON)
- **Chunk Format**:
  ```json
  {"assistant": "ORVYN", "intent": "CODING", "badge": "Code Mode", "color": "#8b5cf6", "model": "qwen3:4b", "content": "def solution():", "done": false}
  ```
- **Terminal Chunk**:
  ```json
  {"assistant": "ORVYN", "intent": "CODING", "badge": "Code Mode", "color": "#8b5cf6", "model": "qwen3:4b", "content": "", "latency_ms": 112.5, "done": true}
  ```

---

## 3. Subsystem Modules

### 3.1 Memory Store Engine ([memory/store.py](file:///c:/Users/rakes/OneDrive/Desktop/ORVYN/memory/store.py))
- Stores persistent user preferences and domain context.
- Injects high-priority pinned context directly into LLM prompts.

### 3.2 Tools Execution Sandbox ([tools/executor.py](file:///c:/Users/rakes/OneDrive/Desktop/ORVYN/tools/executor.py))
- Safe in-memory Python REPL with captured stdout/stderr.
- Scientific Calculator with mathematical syntax evaluation.
- Local Workspace scanner with sandboxed path validation.
- Technical documentation search provider.

### 3.3 Autonomous Multi-Agent Orchestrator ([agents/orchestrator.py](file:///c:/Users/rakes/OneDrive/Desktop/ORVYN/agents/orchestrator.py))
- **Strategy Planner Agent**: Workflow decomposition and task breakdowns.
- **Software Engineering Agent**: Robust code generation and complexity analysis.
- **Deep Research Agent**: Multi-source trade-off evaluations.
- **Academic Exam Specialist**: Structured 15-mark university answers.

### 3.4 Voice Engine ([voice/audio_engine.py](file:///c:/Users/rakes/OneDrive/Desktop/ORVYN/voice/audio_engine.py))
- Integrates browser Web Speech API for low-latency Speech-to-Text.
- Voice command parser for hands-free navigation.
- Speech synthesis presets (Nova, Atlas, Echo, Sol).
