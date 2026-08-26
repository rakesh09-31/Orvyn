import React, { useState } from "react";

export default function ToolsView({ backendUrl }) {
  const [selectedTool, setSelectedTool] = useState("python_repl");
  const [pythonCode, setPythonCode] = useState(
    '# Python Sandbox Execution\ndef compute_primes(limit):\n    primes = []\n    for num in range(2, limit + 1):\n        if all(num % i != 0 for i in range(2, int(num**0.5) + 1)):\n            primes.append(num)\n    return primes\n\nprint("Prime numbers up to 50:")\nprint(compute_primes(50))'
  );
  const [calcExpr, setCalcExpr] = useState("math.sqrt(1024) * 5 + math.log10(1000)");
  const [scanPath, setScanPath] = useState(".");
  const [searchQuery, setSearchQuery] = useState("FastAPI async streaming NDJSON");
  const [output, setOutput] = useState(null);
  const [executing, setExecuting] = useState(false);

  const tools = [
    {
      id: "python_repl",
      name: "Python Sandbox",
      icon: "🐍",
      desc: "Execute Python code with standard libraries and capture real-time stdout/stderr.",
    },
    {
      id: "calculator",
      name: "Scientific Calculator",
      icon: "🧮",
      desc: "Evaluate advanced mathematical expressions and trigonometry formulas.",
    },
    {
      id: "workspace_scanner",
      name: "Workspace Scanner",
      icon: "📁",
      desc: "Inspect the local ORVYN workspace structure, directories, and file sizes.",
    },
    {
      id: "web_search",
      name: "Web Knowledge Search",
      icon: "🌐",
      desc: "Search technical references and documentation synthesis indices.",
    },
  ];

  const handleRunTool = async () => {
    setExecuting(true);
    setOutput(null);

    let payload = {};
    if (selectedTool === "python_repl") {
      payload = { code: pythonCode };
    } else if (selectedTool === "calculator") {
      payload = { expression: calcExpr };
    } else if (selectedTool === "workspace_scanner") {
      payload = { path: scanPath };
    } else if (selectedTool === "web_search") {
      payload = { query: searchQuery };
    }

    try {
      const res = await fetch(`${backendUrl}/api/tools/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_id: selectedTool,
          payload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOutput(data);
      }
    } catch (err) {
      setOutput({
        success: false,
        error: `Tool execution failed: ${err.message}`,
        output: String(err),
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="view-container tools-view">
      <div className="view-header">
        <div>
          <h2>Integrated Tools & Sandbox</h2>
          <p>Execute code, calculate expressions, inspect local project files, and query technical indices directly.</p>
        </div>
      </div>

      {/* TOOL SELECTOR TABS */}
      <div className="tools-nav-pills">
        {tools.map((t) => (
          <button
            key={t.id}
            className={`tool-pill-btn ${selectedTool === t.id ? "active" : ""}`}
            onClick={() => {
              setSelectedTool(t.id);
              setOutput(null);
            }}
          >
            <span className="tool-pill-icon">{t.icon}</span>
            <span className="tool-pill-name">{t.name}</span>
          </button>
        ))}
      </div>

      {/* TOOL INTERFACE DOCK */}
      <div className="tools-workspace-grid">
        <div className="tool-input-card">
          {selectedTool === "python_repl" && (
            <div className="tool-form-section">
              <div className="section-label-row">
                <label>Python Code Editor</label>
                <span className="lib-tag">Libraries: math, os, json, re, time</span>
              </div>
              <textarea
                className="code-textarea"
                rows={10}
                value={pythonCode}
                onChange={(e) => setPythonCode(e.target.value)}
              />
            </div>
          )}

          {selectedTool === "calculator" && (
            <div className="tool-form-section">
              <div className="section-label-row">
                <label>Mathematical Expression</label>
                <span className="lib-tag">Supports: sin, cos, sqrt, log, pi, pow, ^</span>
              </div>
              <input
                type="text"
                className="calc-input"
                value={calcExpr}
                onChange={(e) => setCalcExpr(e.target.value)}
                placeholder="e.g. math.sqrt(256) + 40"
              />
            </div>
          )}

          {selectedTool === "workspace_scanner" && (
            <div className="tool-form-section">
              <div className="section-label-row">
                <label>Directory Path to Inspect</label>
                <span className="lib-tag">Safe Workspace Sandbox</span>
              </div>
              <input
                type="text"
                className="calc-input"
                value={scanPath}
                onChange={(e) => setScanPath(e.target.value)}
                placeholder="e.g. . or backend or frontend"
              />
            </div>
          )}

          {selectedTool === "web_search" && (
            <div className="tool-form-section">
              <div className="section-label-row">
                <label>Search Query</label>
                <span className="lib-tag">Technical Knowledge Engine</span>
              </div>
              <input
                type="text"
                className="calc-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter technical query..."
              />
            </div>
          )}

          <button
            className="execute-tool-btn"
            onClick={handleRunTool}
            disabled={executing}
          >
            {executing ? "Executing Tool..." : "⚡ Execute Tool"}
          </button>
        </div>

        {/* TOOL OUTPUT PANEL */}
        <div className="tool-output-card">
          <div className="tool-output-header">
            <h3>Terminal Output</h3>
            {output?.execution_time_ms && (
              <span className="latency-badge">
                ⏱️ {output.execution_time_ms} ms
              </span>
            )}
          </div>

          <div className="terminal-screen">
            {executing ? (
              <div className="terminal-executing">Running command in local sandbox...</div>
            ) : output ? (
              <div className="terminal-results">
                {output.output && <pre className="term-out">{output.output}</pre>}
                {output.items && (
                  <div className="workspace-items-list">
                    {output.items.map((item, idx) => (
                      <div key={idx} className="ws-item-row">
                        <span>{item.is_dir ? "📁" : "📄"}</span>
                        <strong>{item.name}</strong>
                        {!item.is_dir && <small>{(item.size / 1024).toFixed(1)} KB</small>}
                      </div>
                    ))}
                  </div>
                )}
                {output.results && (
                  <div className="search-results-list">
                    {output.results.map((res, idx) => (
                      <div key={idx} className="search-res-item">
                        <h4>{res.title}</h4>
                        <p>{res.snippet}</p>
                        <a href={res.url} target="_blank" rel="noreferrer">
                          {res.url}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="terminal-placeholder">
                Click "Execute Tool" to see real-time output and console execution data.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
