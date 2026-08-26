import React, { useState, useEffect } from "react";

export default function VoiceView({ backendUrl, onNavigate }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceReply, setVoiceReply] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const [speaking, setSpeaking] = useState(false);
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/voice/presets`);
        if (res.ok) {
          const data = await res.json();
          setPresets(data.presets || []);
        }
      } catch (e) {
        console.warn("Voice presets notice:", e);
      }
    };
    fetchPresets();
  }, [backendUrl]);

  const toggleListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event) => {
      let currentText = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);

      if (event.results[0].isFinal) {
        processSpokenText(currentText);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const processSpokenText = async (spokenText) => {
    if (!spokenText.trim()) return;

    // Check for voice commands
    try {
      const cmdRes = await fetch(`${backendUrl}/api/voice/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: spokenText }),
      });

      if (cmdRes.ok) {
        const cmdData = await cmdRes.json();
        if (cmdData.is_command) {
          if (cmdData.detected_command === "NAVIGATE_DASHBOARD") onNavigate("dashboard");
          if (cmdData.detected_command === "NAVIGATE_MEMORY") onNavigate("memory");
          if (cmdData.detected_command === "NAVIGATE_TOOLS") onNavigate("tools");
          if (cmdData.detected_command === "NAVIGATE_AGENTS") onNavigate("agents");
          speakText(`Executing command: ${cmdData.detected_command.replace("_", " ")}`);
          return;
        }
      }

      // Query fast response
      const chatRes = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: spokenText }),
      });

      if (chatRes.ok) {
        const chatData = await chatRes.json();
        setVoiceReply(chatData.response);
        speakText(chatData.response);
      }
    } catch (err) {
      console.error("Voice processing error:", err);
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="view-container voice-view">
      <div className="view-header">
        <div>
          <h2>Voice Interaction Engine</h2>
          <p>Real-time conversational voice assistant with Speech-to-Text and continuous speech synthesis.</p>
        </div>
      </div>

      <div className="voice-stage-card">
        {/* GLOWING ORB VISUALIZER */}
        <div className="orb-wrapper">
          <div
            className={`voice-orb ${isListening ? "listening" : ""} ${
              speaking ? "speaking" : ""
            }`}
            onClick={toggleListening}
          >
            <div className="orb-core">
              <span>{isListening ? "🎙️" : speaking ? "🔊" : "✦"}</span>
            </div>
            <div className="orb-ring ring-1"></div>
            <div className="orb-ring ring-2"></div>
            <div className="orb-ring ring-3"></div>
          </div>

          <div className="orb-status-label">
            {isListening
              ? "Listening to your voice..."
              : speaking
              ? "ORVYN is speaking..."
              : "Click orb or button below to speak"}
          </div>
        </div>

        {/* TRANSCRIPT DISPLAY */}
        <div className="voice-dialog-box">
          <div className="dialog-row">
            <strong>You said:</strong>
            <p className="dialog-text">
              {transcript || "Speak something or try asking a question..."}
            </p>
          </div>

          {voiceReply && (
            <div className="dialog-row reply">
              <strong>ORVYN Voice:</strong>
              <p className="dialog-text">{voiceReply}</p>
            </div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="voice-controls-bar">
          <button
            className={`voice-mic-toggle-btn ${isListening ? "active" : ""}`}
            onClick={toggleListening}
          >
            {isListening ? "⏹️ Stop Listening" : "🎙️ Start Voice Input"}
          </button>

          <div className="voice-presets-dropdown">
            <label>TTS Voice Preset:</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
            >
              <option value="nova">Nova (Smooth & Crisp)</option>
              <option value="atlas">Atlas (Deep & Authoritative)</option>
              <option value="echo">Echo (Warm & Conversational)</option>
              <option value="sol">Sol (Energetic & Bright)</option>
            </select>
          </div>
        </div>

        {/* VOICE COMMANDS HINT */}
        <div className="voice-commands-help">
          <span>💡 Voice Commands:</span>
          <code>"Open Dashboard"</code>
          <code>"Open Memory"</code>
          <code>"Open Tools"</code>
          <code>"Open Agents"</code>
        </div>
      </div>
    </div>
  );
}
