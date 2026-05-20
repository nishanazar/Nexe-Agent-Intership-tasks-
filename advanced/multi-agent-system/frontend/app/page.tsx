"use client";

import { useState } from "react";

/**
 * Enhanced Dashboard Interface for Multi-Agent System.
 * Implements a professional dark-mode sidebar, chat layout, and real-time state management.
 */
export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string; rawJson?: any }[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/run-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: userMsg }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.result }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", text: "Error: Could not connect to backend." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="logo">
          <span className="icon">🤖</span>
          <h2>Multi-Agent System</h2>
        </div>
        
        <div className="section-label">CAPABILITIES</div>
        <div className="tools-list">
          <div className="tool-card active">
            <div className="tool-header">
              <span className="tool-icon">🔍</span>
              <span className="tool-name">Research Agent</span>
            </div>
            <p className="tool-desc">Conducts thorough web research and gathers factual data.</p>
          </div>
          <div className="tool-card">
            <div className="tool-header">
              <span className="tool-icon">📝</span>
              <span className="tool-name">Summary Agent</span>
            </div>
            <p className="tool-desc">Condenses research into concise, actionable summaries.</p>
          </div>
          <div className="tool-card">
            <div className="tool-header">
              <span className="tool-icon">📧</span>
              <span className="tool-name">Email Agent</span>
            </div>
            <p className="tool-desc">Drafts professional communication based on processed data.</p>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="status-dot"></div>
          <span>System Online</span>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="main">
        <div className="header">
          <div className="header-info">
            
            <p>Orchestrating autonomous agents in real-time</p>
          </div>
        </div>

        <div className="chat">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="welcome-icon">🤖</div>
              <h2>How can I assist you today?</h2>
             
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`msg-container ${m.role === "user" ? "user-container" : "ai-container"}`}>
              <div className="avatar">{m.role === "user" ? "👤" : "🤖"}</div>
              <div className={`msg ${m.role === "user" ? "user" : "ai"}`}>{m.text}</div>
            </div>
          ))}

          {loading && (
            <div className="msg-container ai-container">
              <div className="avatar">🤖</div>
              <div className="msg ai typing">
                <span className="dot"></span><span className="dot"></span><span className="dot"></span>
              </div>
            </div>
          )}
        </div>

        <div className="input-container">
          <div className="inputBox">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message AgentOS..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} disabled={loading} className="send-btn">
              {loading ? <div className="loader"></div> : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="send-icon">
                  <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* STYLES */}
      <style jsx>{`
        .layout { display: flex; height: 100vh; background: #0f172a; color: #f8fafc; font-family: 'Inter', sans-serif; }
        .sidebar { width: 300px; background: #1e293b; padding: 24px; border-right: 1px solid #334155; display: flex; flex-direction: column; }
        .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
        .logo .icon { font-size: 1.5rem; background: #334155; padding: 8px; border-radius: 12px; }
        .section-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
        .tools-list { display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .tool-card { padding: 16px; background: #334155; border-radius: 12px; border: 1px solid transparent; }
        .tool-card.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
        .tool-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .tool-name { font-weight: 600; font-size: 0.95rem; }
        .tool-desc { font-size: 0.8rem; color: #94a3b8; }
        .sidebar-footer { margin-top: auto; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #94a3b8; padding-top: 20px; border-top: 1px solid #334155; }
        .status-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }
        .main { flex: 1; display: flex; flex-direction: column; background: #0f172a; position: relative; }
        .header { padding: 20px 32px; border-bottom: 1px solid #1e293b; }
        .chat { flex: 1; padding: 32px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }
        .msg-container { display: flex; gap: 16px; max-width: 85%; }
        .user-container { align-self: flex-end; flex-direction: row-reverse; }
        .avatar { width: 36px; height: 36px; background: #334155; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .user-container .avatar { background: #2563eb; }
        .msg { padding: 14px 18px; border-radius: 18px; font-size: 0.95rem; line-height: 1.5; white-space: pre-wrap; }
        .user { background: #2563eb; color: white; }
        .ai { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; }
        .typing { display: flex; gap: 4px; padding: 12px 16px; }
        .dot { width: 6px; height: 6px; background: #94a3b8; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        .input-container { padding: 24px 32px 32px; }
        .inputBox { display: flex; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 8px; gap: 12px; align-items: center; }
        input { flex: 1; background: transparent; border: none; color: white; padding: 8px; outline: none; }
        .send-btn { width: 40px; height: 40px; background: #3b82f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; }
        .loader { width: 18px; height: 18px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
