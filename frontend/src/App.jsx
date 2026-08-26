import React, { useState } from "react";
import "./App.css";

import ChatView from "./components/ChatView";
import DashboardView from "./components/DashboardView";
import MemoryView from "./components/MemoryView";
import AgentsView from "./components/AgentsView";
import ToolsView from "./components/ToolsView";
import VoiceView from "./components/VoiceView";
import SettingsView from "./components/SettingsView";

function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [darkMode, setDarkMode] = useState(true);
  const [messages, setMessages] = useState([]);
  const [activeModel, setActiveModel] = useState("qwen3:4b");
  const [backendUrl, setBackendUrl] = useState("http://127.0.0.1:8000");

  const navigationItems = [
    { id: "chat", label: "Chat", icon: "▢" },
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "memory", label: "Memory", icon: "♧" },
    { id: "agents", label: "Agents", icon: "♙" },
    { id: "tools", label: "Tools", icon: "⌁" },
    { id: "voice", label: "Voice", icon: "♩" },
    { id: "settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <div className={`orvyn-app ${darkMode ? "dark" : "light"}`}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand" onClick={() => setActiveTab("chat")} style={{ cursor: "pointer" }}>
          <div className="brand-orbit">
            <span>O</span>
          </div>

          <div>
            <div className="brand-name">ORVYN</div>
            <div className="brand-subtitle">Your AI Workforce</div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <nav className="navigation">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* AI ENGINE STATUS CARD */}
        <div className="ai-status">
          <div className="status-heading">
            <span className="online-dot"></span>
            <span>AI Engine</span>
            <strong>Online</strong>
          </div>

          <div className="status-divider"></div>

          <div className="status-label">Model</div>
          <div className="status-value">{activeModel}</div>

          <div className="status-label">Running on</div>
          <div className="status-value">Local GPU / RTX 3050</div>

          <button className="system-status" onClick={() => setActiveTab("dashboard")}>
            System Telemetry
            <span>›</span>
          </button>
        </div>

        {/* USER PROFILE */}
        <div className="user-card">
          <div className="avatar">R</div>
          <div className="user-details">
            <strong>Rakesh</strong>
            <span>Administrator</span>
          </div>
          <span className="user-arrow">⌄</span>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {/* TOP BAR */}
        <header className="top-bar">
          <div className="mobile-brand" onClick={() => setActiveTab("chat")}>
            <div className="brand-orbit small">
              <span>O</span>
            </div>
            <span>ORVYN</span>
          </div>

          <div className="top-actions">
            <div className="engine-pill" onClick={() => setActiveTab("dashboard")}>
              <span className="online-dot"></span>
              <span>Local Engine Online</span>
            </div>

            <button
              className="theme-button"
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle theme"
            >
              {darkMode ? "☀" : "☾"}
            </button>

            {activeTab === "chat" && (
              <button className="new-chat-button" onClick={() => setMessages([])}>
                <span>✦</span>
                New Chat
              </button>
            )}
          </div>
        </header>

        {/* TAB VIEWS */}
        <section className="content-area">
          {activeTab === "chat" && (
            <ChatView
              messages={messages}
              setMessages={setMessages}
              activeModel={activeModel}
              backendUrl={backendUrl}
            />
          )}

          {activeTab === "dashboard" && (
            <DashboardView
              backendUrl={backendUrl}
              activeModel={activeModel}
            />
          )}

          {activeTab === "memory" && (
            <MemoryView backendUrl={backendUrl} />
          )}

          {activeTab === "agents" && (
            <AgentsView
              backendUrl={backendUrl}
              activeModel={activeModel}
            />
          )}

          {activeTab === "tools" && (
            <ToolsView backendUrl={backendUrl} />
          )}

          {activeTab === "voice" && (
            <VoiceView
              backendUrl={backendUrl}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              activeModel={activeModel}
              setActiveModel={setActiveModel}
              backendUrl={backendUrl}
              setBackendUrl={setBackendUrl}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;