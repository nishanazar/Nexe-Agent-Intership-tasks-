"use client";

import { useState } from "react";

export default function Home() {
  // =========================
  // STATE MANAGEMENT
  // =========================
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  // =========================
  // SEND MESSAGE TO BACKEND
  // =========================
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;

    // add user message to chat
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);

    setInput("");
    setLoading(true);

    try {
      // =========================
      // CALL BACKEND AGENT API
      // =========================
      const res = await fetch("http://localhost:8000/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.json();

      // =========================
      // GET RESPONSE FROM BACKEND
      // =========================
      const response = data?.response;

      // =========================
      // DYNAMIC DISPLAY LOGIC
      // =========================
      let aiText = "";

      if (response?.status === "success") {
        const isCalculation = response.operation && response.operation !== "unknown" && response.operation !== "conversation";
        
        if (isCalculation) {
          aiText = `✅ Result: ${response.result}\n🔢 ${response.a ?? ""} ${response.operation} ${response.b ?? ""}`;
        } else {
          aiText = response.result || response.message || "I'm not sure how to help with that.";
        }
      } else if (response?.status === "error") {
        aiText = `❌ Error: ${response.message}`;
      } else {
        aiText = typeof response === "string" ? response : JSON.stringify(response, null, 2);
      }

      // add AI response to chat
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: aiText },
      ]);
    } catch (error) {
      // =========================
      // ERROR HANDLING
      // =========================
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "❌ Server error" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="layout">

      {/* =========================
          SIDEBAR
      ========================= */}
      <div className="sidebar">
        <div className="logo">
          <span className="icon">🤖</span>
          <h2>Tool-Calling AI Agent</h2>
        </div>
        
        <div className="section-label">AVAILABLE TOOLS</div>
        <div className="tools-list">
          <div className="tool-card active">
            <div className="tool-header">
              <span className="tool-icon">🧮</span>
              <span className="tool-name">Tools Available</span>
            </div>
            <p className="tool-desc">Can add, subtract, multiply, and divide numbers with high precision.</p>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="status-dot"></div>
          <span>System Online</span>
        </div>
      </div>

      {/* =========================
          MAIN CHAT AREA
      ========================= */}
      <div className="main">

        {/* HEADER */}
        <div className="header">
          <div className="header-info">
            <h3>AI Assistant Dashboard</h3>
            <p>Powered by OpenAI Agents SDK</p>
          </div>
        </div>

        {/* CHAT MESSAGES */}
        <div className="chat">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="welcome-icon">👋</div>
              <h2>How can I help you today?</h2>
              <p>Try asking: "What is 15 multiplied by 8?"</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div
              key={i}
              className={`msg-container ${m.role === "user" ? "user-container" : "ai-container"}`}
            >
              <div className="avatar">
                {m.role === "user" ? "👤" : "🤖"}
              </div>
              <div className={`msg ${m.role === "user" ? "user" : "ai"}`}>
                {m.text}
              </div>
            </div>
          ))}

          {/* LOADING STATE */}
          {loading && (
            <div className="msg-container ai-container">
              <div className="avatar">🤖</div>
              <div className="msg ai typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
        </div>

        {/* INPUT BOX */}
        <div className="input-container">
          <div className="inputBox">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Type Here..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            <button onClick={sendMessage} disabled={loading} className="send-btn">
              {loading ? (
                <div className="loader"></div>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="send-icon">
                  <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <p className="input-footer">Agent may use calculator tool to verify mathematical results.</p>
        </div>
      </div>

      {/* =========================
          STYLES
      ========================= */}
      <style jsx>{`
        .layout {
          display: flex;
          height: 100vh;
          background: #0f172a;
          color: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 300px;
          background: #1e293b;
          padding: 24px;
          border-right: 1px solid #334155;
          display: flex;
          flex-direction: column;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
        }

        .logo h2 {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.025em;
        }

        .logo .icon {
          font-size: 1.5rem;
          background: #334155;
          padding: 8px;
          border-radius: 12px;
        }

        .section-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .tools-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .tool-card {
          padding: 16px;
          background: #334155;
          border-radius: 12px;
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .tool-card.active {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .tool-card.disabled {
          opacity: 0.5;
          background: #1e293b;
          border: 1px dashed #334155;
        }

        .tool-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        .tool-name {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .tool-desc {
          font-size: 0.8rem;
          color: #94a3b8;
          line-height: 1.4;
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #94a3b8;
          padding-top: 20px;
          border-top: 1px solid #334155;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
        }

        /* Main Area Styles */
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #0f172a;
          position: relative;
        }

        .header {
          padding: 20px 32px;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #1e293b;
          z-index: 10;
        }

        .header h3 {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .header p {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .chat {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #94a3b8;
        }

        .welcome-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .empty-state h2 {
          color: white;
          margin-bottom: 8px;
        }

        .msg-container {
          display: flex;
          gap: 16px;
          max-width: 85%;
        }

        .user-container {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .ai-container {
          align-self: flex-start;
        }

        .avatar {
          width: 36px;
          height: 36px;
          background: #334155;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .user-container .avatar {
          background: #2563eb;
        }

        .msg {
          padding: 14px 18px;
          border-radius: 18px;
          font-size: 0.95rem;
          line-height: 1.5;
          white-space: pre-wrap;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .user {
          background: #2563eb;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .ai {
          background: #1e293b;
          color: #e2e8f0;
          border: 1px solid #334155;
          border-bottom-left-radius: 4px;
        }

        /* Typing Animation */
        .typing {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
        }

        .dot {
          width: 6px;
          height: 6px;
          background: #94a3b8;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .input-container {
          padding: 24px 32px 32px;
          background: linear-gradient(to top, #0f172a 80%, transparent);
        }

        .inputBox {
          display: flex;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          padding: 8px 8px 8px 16px;
          gap: 12px;
          align-items: center;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transition: border-color 0.2s;
        }

        .inputBox:focus-within {
          border-color: #3b82f6;
        }

        input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          padding: 8px 0;
          font-size: 1rem;
          outline: none;
        }

        .send-btn {
          width: 40px;
          height: 40px;
          background: #3b82f6;
          border: none;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: background 0.2s;
        }

        .send-btn:hover {
          background: #2563eb;
        }

        .send-btn:disabled {
          background: #334155;
          cursor: not-allowed;
        }

        .send-icon {
          width: 18px;
          height: 18px;
        }

        .input-footer {
          text-align: center;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 12px;
        }

        /* Custom Scrollbar */
        .chat::-webkit-scrollbar {
          width: 6px;
        }
        .chat::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }

        .loader {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}