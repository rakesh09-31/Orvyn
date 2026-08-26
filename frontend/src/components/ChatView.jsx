import React, { useState, useRef, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

const quickActions = [
  {
    icon: "✦",
    title: "Explain a concept",
    text: "In simple words",
    prompt: "Explain how memory management works in operating systems in simple terms.",
  },
  {
    icon: "▣",
    title: "Plan my day",
    text: "Make it productive",
    prompt: "Create a focused 4-block daily productivity plan for software engineering.",
  },
  {
    icon: "</>",
    title: "Help with coding",
    text: "Debug or write code",
    prompt: "Write a high-performance Python function with type hints to find all anagrams in an array of strings.",
  },
  {
    icon: "◇",
    title: "System Architecture",
    text: "Analyze trade-offs",
    prompt: "Design a resilient local microservices architecture for real-time streaming with low latency.",
  },
];

const features = [
  {
    icon: "◉",
    title: "Understands",
    text: "Multi-intent routing",
  },
  {
    icon: "◎",
    title: "Solves",
    text: "Code, Exams & Architecture",
  },
  {
    icon: "ϟ",
    title: "Streams",
    text: "Ultra-low local latency",
  },
  {
    icon: "♢",
    title: "Keeps",
    text: "100% On-device privacy",
  },
];

export default function ChatView({
  messages,
  setMessages,
  activeModel,
  backendUrl,
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const conversationEndRef = useRef(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend = null) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const assistantMsgId = `asst_${Date.now()}`;
    const initialAssistantMsg = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      intent: "GENERAL",
      badge: "Processing...",
      color: "#7047ff",
      model: activeModel,
      latency_ms: null,
      streaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, initialAssistantMsg]);

    try {
      const response = await fetch(`${backendUrl}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          model: activeModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);

            if (data.content) {
              accumulatedContent += data.content;
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? {
                      ...msg,
                      content: accumulatedContent,
                      intent: data.intent || msg.intent,
                      badge: data.badge || msg.badge,
                      color: data.color || msg.color,
                      model: data.model || msg.model,
                      latency_ms: data.latency_ms || msg.latency_ms,
                    }
                  : msg
              )
            );

            if (data.done) {
              break;
            }
          } catch (jsonErr) {
            console.warn("NDJSON parse notice:", jsonErr);
          }
        }
      }

      // Mark streaming as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, streaming: false } : msg
        )
      );
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  "Unable to connect to ORVYN local engine. Please make sure the backend server and Ollama are active.",
                badge: "Connection Notice",
                color: "#f43f5e",
                streaming: false,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const exportText = messages
      .map(
        (m) =>
          `### ${m.role === "user" ? "You" : "ORVYN"} (${m.timestamp || ""})\n${m.content}\n`
      )
      .join("\n---\n\n");

    const blob = new Blob([exportText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ORVYN-Conversation-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="chat-view-root">
      {messages.length === 0 ? (
        <div className="chat-hero-container">
          {/* HERO GREETING */}
          <section className="hero">
            <div className="hero-greeting">
              <span>✦</span>
              Hello, I'm
            </div>

            <h1>
              <span>ORVYN</span>
            </h1>

            <div className="hero-line">
              <span></span>
              <b>✦</b>
              <span></span>
            </div>

            <h2>Your Personal Local AI Workforce</h2>

            <p>
              I understand you, think with you, and work for you.
              <br />
              From rapid factual lookups to complex code, exams, and system designs.
            </p>
          </section>

          {/* FEATURES PILLS */}
          <section className="features">
            {features.map((feature) => (
              <div className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <strong>{feature.title}</strong>
                <span>{feature.text}</span>
              </div>
            ))}
          </section>

          {/* QUICK ACTIONS */}
          <section className="quick-section">
            <div className="section-title">
              <span></span>
              <b>✦</b>
              <label>Try asking ORVYN</label>
              <b>✦</b>
              <span></span>
            </div>

            <div className="quick-actions">
              {quickActions.map((action) => (
                <button
                  className="quick-card"
                  key={action.title}
                  onClick={() => handleSendMessage(action.prompt)}
                >
                  <span className="quick-icon">{action.icon}</span>
                  <span className="quick-text">
                    <strong>{action.title}</strong>
                    <small>{action.text}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="conversation-container">
          <div className="conversation-header-bar">
            <div className="conv-title-wrap">
              <span className="sparkle-icon">✦</span>
              <h2>Conversation</h2>
              <span className="msg-counter">({messages.length} messages)</span>
            </div>

            <div className="conv-actions">
              <button
                className="export-btn"
                onClick={handleExportChat}
                title="Export Markdown"
              >
                📥 Export
              </button>
              <button
                className="clear-btn"
                onClick={() => setMessages([])}
                title="Clear Chat"
              >
                🗑️ Clear
              </button>
            </div>
          </div>

          <div className="message-stream">
            {messages.map((item) => (
              <div
                className={`message-row ${item.role}`}
                key={item.id || item.timestamp}
              >
                <div className="message-avatar">
                  {item.role === "user" ? "R" : "O"}
                </div>

                <div className="message-content-wrapper">
                  <div className="message-meta">
                    <span className="message-author">
                      {item.role === "user" ? "You" : "ORVYN"}
                    </span>

                    {item.badge && (
                      <span
                        className="intent-badge"
                        style={{
                          backgroundColor: `${item.color || "#7047ff"}20`,
                          color: item.color || "#7047ff",
                          borderColor: `${item.color || "#7047ff"}40`,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}

                    {item.latency_ms && (
                      <span className="latency-badge">
                        ⚡ {item.latency_ms} ms
                      </span>
                    )}

                    <span className="message-time">{item.timestamp}</span>
                  </div>

                  <div className="message-bubble">
                    {item.content ? (
                      <MarkdownRenderer content={item.content} />
                    ) : item.streaming ? (
                      <div className="thinking-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                        <i>Formulating response...</i>
                      </div>
                    ) : null}

                    {item.content && (
                      <div className="bubble-actions">
                        <button
                          className="copy-msg-btn"
                          onClick={() => handleCopyMessage(item.id, item.content)}
                          title="Copy text"
                        >
                          {copiedId === item.id ? "✓ Copied" : "📋"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>
        </section>
      )}

      {/* INPUT DOCK */}
      <div className="chat-input-dock">
        <div className="chat-box">
          <span className="chat-sparkle">✦</span>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask ORVYN anything (Coding, Exams, Architecture, Fast Facts)..."
            rows="1"
            disabled={loading}
          />

          <button
            className={`voice-button ${isListening ? "active-listening" : ""}`}
            onClick={toggleSpeechRecognition}
            title={isListening ? "Listening... Click to stop" : "Voice Input"}
          >
            {isListening ? "🔴" : "🎙️"}
          </button>

          <button
            className="send-button"
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
          >
            {loading ? "Streaming..." : "Send"}
            <span>➤</span>
          </button>
        </div>

        <div className="privacy-note">
          <span>🔒</span>
          100% Private
          <i>•</i>
          Local Inference with {activeModel}
          <i>•</i>
          Zero External Tracking
        </div>
      </div>
    </div>
  );
}
