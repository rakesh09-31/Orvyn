import React, { useState, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

export default function AgentsView({ backendUrl, activeModel }) {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("planner");
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [activeSteps, setActiveSteps] = useState([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/agents`);
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents || []);
        }
      } catch (e) {
        console.warn("Agents fetch notice:", e);
      }
    };
    fetchAgents();
  }, [backendUrl]);

  const defaultAgents = [
    {
      id: "planner",
      name: "Strategy Planner Agent",
      role: "Decomposes complex requests into actionable, phased task steps.",
      avatar: "🗺️",
      capabilities: ["Workflow decomposition", "Milestone definition", "Dependency ordering"],
      samplePrompt: "Plan a full architectural migration of a legacy monolithic app to a containerized microservices stack.",
    },
    {
      id: "coder",
      name: "Software Engineering Agent",
      role: "Generates robust, production-grade, syntactically clean code.",
      avatar: "⚡",
      capabilities: ["Algorithm design", "Code generation", "Bug identification", "Refactoring"],
      samplePrompt: "Write a high-throughput async rate-limiting token bucket middleware in Python FastAPI.",
    },
    {
      id: "researcher",
      name: "Deep Research Agent",
      role: "Synthesizes multi-source knowledge, compares trade-offs, and documents findings.",
      avatar: "🔬",
      capabilities: ["Literature review", "Architecture comparison", "Trade-off analysis"],
      samplePrompt: "Analyze the trade-offs between Quantized GGUF vs AWQ local inference on consumer RTX GPUs.",
    },
    {
      id: "exam_prep",
      name: "Academic & Exam Specialist",
      role: "Prepares structured, high-mark university examination answers with definitions and diagrams.",
      avatar: "🎓",
      capabilities: ["Curriculum alignment", "15-mark essay structures", "Key technical terms"],
      samplePrompt: "Explain Virtual Memory, Paging, and Page Fault Handling for a 15-mark university exam.",
    },
  ];

  const agentList = agents.length > 0 ? agents : defaultAgents;
  const currentAgent = agentList.find((a) => a.id === selectedAgent) || agentList[0];

  const handleRunAgent = async () => {
    if (!prompt.trim() || running) return;

    setRunning(true);
    setResult(null);
    setActiveSteps([
      { step: 1, name: "Initializing Agent Persona & Prompts", status: "running" },
    ]);

    try {
      // Step simulation for UI visualizer
      setTimeout(() => {
        setActiveSteps((prev) => [
          { step: 1, name: "Initializing Agent Persona & Prompts", status: "completed" },
          { step: 2, name: "Domain Knowledge Synthesis & Fact Checking", status: "running" },
        ]);
      }, 350);

      setTimeout(() => {
        setActiveSteps((prev) => [
          { step: 1, name: "Initializing Agent Persona & Prompts", status: "completed" },
          { step: 2, name: "Domain Knowledge Synthesis & Fact Checking", status: "completed" },
          { step: 3, name: "Executing Autonomous Reasoning Pipeline", status: "running" },
        ]);
      }, 700);

      const res = await fetch(`${backendUrl}/api/agents/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: selectedAgent,
          prompt: prompt.trim(),
          model: activeModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setActiveSteps(data.steps || [
          { step: 1, name: "Input Parameter Analysis", status: "completed" },
          { step: 2, name: "Domain Knowledge Synthesis", status: "completed" },
          { step: 3, name: "Autonomous Inference", status: "completed" },
          { step: 4, name: "Synthesizing Final Output", status: "completed" },
        ]);
      }
    } catch (err) {
      console.error("Agent execution error:", err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="view-container agents-view">
      <div className="view-header">
        <div>
          <h2>Autonomous Multi-Agent Workspace</h2>
          <p>Deploy specialized AI personas with autonomous workflows, milestone tracking, and task decomposition.</p>
        </div>
      </div>

      {/* AGENT SELECTOR CARDS */}
      <div className="agent-cards-grid">
        {agentList.map((agent) => (
          <div
            key={agent.id}
            className={`agent-persona-card ${selectedAgent === agent.id ? "selected" : ""}`}
            onClick={() => {
              setSelectedAgent(agent.id);
              if (agent.samplePrompt) setPrompt(agent.samplePrompt);
            }}
          >
            <div className="agent-avatar-badge">{agent.avatar || "🤖"}</div>
            <h4>{agent.name}</h4>
            <p>{agent.role}</p>

            <div className="agent-capabilities">
              {(agent.capabilities || []).map((cap, i) => (
                <span key={i} className="cap-pill">
                  {cap}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AGENT EXECUTION DOCK */}
      <div className="agent-interactive-container">
        <div className="agent-input-panel">
          <div className="panel-title-row">
            <h3>
              <span>{currentAgent.avatar}</span> {currentAgent.name}
            </h3>
            <span className="model-tag">Engine: {activeModel}</span>
          </div>

          <p className="panel-desc">Define the goal or instruction for this autonomous agent.</p>

          <textarea
            className="agent-prompt-input"
            rows={4}
            placeholder={`Enter instruction for ${currentAgent.name}...`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div className="agent-action-bar">
            {currentAgent.samplePrompt && (
              <button
                className="sample-prompt-btn"
                onClick={() => setPrompt(currentAgent.samplePrompt)}
              >
                💡 Load Example
              </button>
            )}

            <button
              className="run-agent-btn"
              onClick={handleRunAgent}
              disabled={running || !prompt.trim()}
            >
              {running ? "Agent is working..." : `🚀 Run ${currentAgent.name}`}
            </button>
          </div>

          {/* STEP PROGRESS TRACKER */}
          {activeSteps.length > 0 && (
            <div className="agent-steps-tracker">
              <h4>Workflow Execution Steps</h4>
              <div className="steps-list">
                {activeSteps.map((st, i) => (
                  <div className={`step-item ${st.status}`} key={i}>
                    <div className="step-bullet">
                      {st.status === "completed" ? "✓" : st.status === "running" ? "⏳" : "○"}
                    </div>
                    <span className="step-name">{st.name}</span>
                    {st.duration_ms && (
                      <span className="step-duration">{st.duration_ms} ms</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AGENT OUTPUT DISPLAY */}
        <div className="agent-output-panel">
          <div className="output-panel-header">
            <h3>Agent Output</h3>
            {result?.total_time_ms && (
              <span className="total-time-badge">⚡ Completed in {result.total_time_ms} ms</span>
            )}
          </div>

          <div className="output-body">
            {running ? (
              <div className="agent-working-state">
                <div className="spinner"></div>
                <p>ORVYN Agent is reasoning and synthesizing your solution...</p>
              </div>
            ) : result?.result ? (
              <MarkdownRenderer content={result.result} />
            ) : (
              <div className="output-placeholder">
                Select an agent above, enter your instructions, and click "Run Agent" to see the autonomous solution.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
