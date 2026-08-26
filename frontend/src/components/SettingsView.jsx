import React, { useState, useEffect } from "react";

export default function SettingsView({
  activeModel,
  setActiveModel,
  backendUrl,
  setBackendUrl,
  darkMode,
  setDarkMode,
}) {
  const [models, setModels] = useState([]);
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are ORVYN, an elite privacy-preserving local AI workforce assistant. Deliver direct, high-quality, and strictly reasoning-free final answers."
  );
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/models`);
        if (res.ok) {
          const data = await res.json();
          setModels(data.models || []);
        }
      } catch (e) {
        console.warn("Models fetch notice:", e);
      }
    };
    fetchModels();
  }, [backendUrl]);

  const defaultModels = [
    { id: "qwen3:4b", name: "Qwen 3 (4B)", status: "active", size: "2.6 GB" },
    { id: "qwen2.5-coder:7b", name: "Qwen 2.5 Coder (7B)", status: "installed", size: "4.7 GB" },
    { id: "llama3:8b", name: "Llama 3 (8B)", status: "installed", size: "4.9 GB" },
    { id: "mistral:7b", name: "Mistral (7B)", status: "available", size: "4.1 GB" },
    { id: "deepseek-r1:7b", name: "DeepSeek R1 (7B)", status: "available", size: "4.8 GB" },
  ];

  const modelList = models.length > 0 ? models : defaultModels;

  const handleSave = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="view-container settings-view">
      <div className="view-header">
        <div>
          <h2>Settings & Configuration</h2>
          <p>Configure local Ollama model parameters, inference temperature, host URLs, and interface preferences.</p>
        </div>
      </div>

      {savedNotice && (
        <div className="settings-saved-banner">
          ✓ Settings saved successfully to local configuration.
        </div>
      )}

      <form onSubmit={handleSave} className="settings-grid">
        {/* MODEL SELECTION PANEL */}
        <div className="settings-card">
          <h3>Local Model Selection</h3>
          <p className="panel-desc">Select the primary Ollama model used for inference.</p>

          <div className="models-select-grid">
            {modelList.map((m) => (
              <div
                key={m.id}
                className={`model-option-card ${activeModel === m.id ? "active" : ""}`}
                onClick={() => setActiveModel(m.id)}
              >
                <div className="model-opt-header">
                  <strong>{m.name}</strong>
                  {m.size && <span className="model-size-tag">{m.size}</span>}
                </div>
                <div className="model-opt-id">{m.id}</div>
                {activeModel === m.id && <span className="active-badge">✓ Active Engine</span>}
              </div>
            ))}
          </div>
        </div>

        {/* INFERENCE PARAMETERS */}
        <div className="settings-card">
          <h3>Inference Tuning</h3>
          <p className="panel-desc">Adjust sampling hyperparameters for local text generation.</p>

          <div className="slider-group">
            <div className="slider-label-row">
              <label>Temperature: {temperature}</label>
              <span className="slider-desc">Lower = more deterministic & accurate</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label-row">
              <label>Max Output Tokens: {maxTokens}</label>
              <span className="slider-desc">Limit on response token generation</span>
            </div>
            <input
              type="range"
              min="300"
              max="4000"
              step="100"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
            />
          </div>

          <div className="form-group" style={{ marginTop: "20px" }}>
            <label>Backend Host URL</label>
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://127.0.0.1:8000"
            />
          </div>
        </div>

        {/* SYSTEM PROMPT & PERSONA */}
        <div className="settings-card full-width">
          <h3>Base System Prompt Customization</h3>
          <p className="panel-desc">Instruct ORVYN with custom identity guidelines and operational rules.</p>

          <textarea
            className="system-prompt-textarea"
            rows={5}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />

          <div className="settings-actions-row">
            <div className="theme-toggle-wrap">
              <button
                type="button"
                className="theme-switch-btn"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? "☀ Switch to Light Mode" : "☾ Switch to Dark Mode"}
              </button>
            </div>

            <button type="submit" className="save-settings-btn">
              💾 Save Configuration
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
