# ORVYN API Specification

Base URL: `http://127.0.0.1:8000`

---

## 1. System & Health

### `GET /`
Returns root assistant metadata.
```json
{
  "assistant": "ORVYN",
  "status": "online",
  "model": "qwen3:4b",
  "streaming": true,
  "version": "2.0.0",
  "uptime_seconds": 240.5
}
```

### `GET /health`
Health check status.

### `GET /api/stats`
Telemetry metrics, average latency, request volume, and subsystem health.

### `GET /api/models`
Returns list of installed and available local models.

---

## 2. Chat & Inference

### `POST /intent`
Classifies prompt into specialized intent (`FAST`, `CODING`, `EXAM`, `REASONING`, `GENERAL`).
- **Body**: `{"message": "string"}`

### `POST /chat`
Non-streaming chat generation.
- **Body**: `{"message": "string", "model": "string (optional)"}`
- **Response**: `{"assistant": "ORVYN", "intent": "CODING", "response": "string", "latency_ms": 120}`

### `POST /chat/stream`
Real-time NDJSON streaming endpoint.
- **Media Type**: `application/x-ndjson`

---

## 3. Memory Subsystem

### `GET /api/memory`
Retrieves all stored context items.

### `POST /api/memory`
Stores new memory item.
- **Body**: `{"key": "string", "value": "string", "category": "string", "pinned": boolean}`

### `DELETE /api/memory/{mem_id}`
Deletes memory item by ID.

---

## 4. Tools Framework

### `GET /api/tools`
Lists available sandbox tools.

### `POST /api/tools/execute`
Executes tool payload.
- **Body**: `{"tool_id": "python_repl", "payload": {"code": "print(10)"}}`

---

## 5. Multi-Agent Orchestration

### `GET /api/agents`
Lists agent personas (Planner, Coder, Researcher, Exam Prep).

### `POST /api/agents/run`
Runs autonomous agent workflow with phased progress steps.
- **Body**: `{"agent_id": "planner", "prompt": "Migrate database", "model": "qwen3:4b"}`

---

## 6. Voice Engine

### `GET /api/voice/presets`
Lists voice synthesis presets.

### `POST /api/voice/command`
Parses spoken transcripts for system navigation commands.
