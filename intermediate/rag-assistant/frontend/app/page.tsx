"use client";

import { useState, ChangeEvent, KeyboardEvent } from "react";

/**
 * TypeScript Interfaces
 */
interface Message {
  role: "user" | "ai";
  text: string;
}

interface UploadResponse {
  message: string;
  chunks: number;
}

interface ChatResponse {
  text: string;
}

/**
 * RAG Assistant Frontend
 * A modern ChatGPT-style interface for document analysis.
 */
export default function Home() {
  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("System Online");

  // --- HANDLERS ---

  /**
   * Captures the selected file from the hidden input.
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus("File selected");
    }
  };

  /**
   * Uploads the selected PDF to the backend for processing.
   */
  const uploadFile = async () => {
    if (!file) return;
    
    setUploading(true);
    setStatus("Uploading document...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      
      const data: UploadResponse = await response.json();
      
      if (response.ok) {
        // Add a system notification message to the chat
        setMessages((prev) => [
          ...prev, 
          { role: "ai", text: `✅ Knowledge Base Updated: "${file.name}" processed into ${data.chunks} segments.` }
        ]);
        setStatus("Ready");
        setFile(null); // Clear file after successful upload
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      setMessages((prev) => [...prev, { role: "ai", text: "❌ Error: Failed to upload the document." }]);
      setStatus("Error");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Sends the user's text query to the RAG Agent.
   */
  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Add user message to UI
    const userMsg: Message = { role: "user", text: trimmedInput };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedInput }),
      });
      
      const data: ChatResponse = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [...prev, { role: "ai", text: data.text }]);
      } else {
        throw new Error("Backend error");
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, { role: "ai", text: "⚠️ Connection Error: Is the backend server running?" }]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles 'Enter' key press for sending messages.
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && !uploading) {
      if (file) {
        uploadFile();
      } else {
        sendMessage();
      }
    }
  };

  // --- RENDER ---
  return (
    <div className="layout">
      {/* SIDEBAR: App Branding & Status */}
      <aside className="sidebar">
        <div className="logo">
          <span className="icon">🤖</span>
          <h2>RAG Assistant</h2>
        </div>
        
        <nav className="section-label">Capabilities</nav>
        <div className="tools-list">
          <div className="tool-card active">
            <div className="tool-header">
              <span className="tool-icon">💬</span>
              <span className="tool-name">AI Chat</span>
            </div>
            <p className="tool-desc">Multilingual conversational interface.</p>
          </div>
          
          <div className="tool-card active">
            <div className="tool-header">
              <span className="tool-icon">🧠</span>
              <span className="tool-name">Contextual PDF</span>
            </div>
            <p className="tool-desc">Upload documents to provide AI with custom knowledge.</p>
          </div>
        </div>

        <footer className="sidebar-footer">
          <div className={`status-dot ${status === "Error" ? "error" : ""}`}></div>
          <span>{status}</span>
        </footer>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main">
        {/* TOP NAVBAR */}
        <header className="header">
          <div className="header-info">
            <h3>Assistant Dashboard</h3>
            <p>Powered by Next.js & FastAPI</p>
          </div>
        </header>

        {/* CHAT DISPLAY */}
        <section className="chat">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="welcome-icon">👋</div>
              <h2>How can I help you today?</h2>
              <p>Upload a PDF or start typing to interact with the AI.</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <article
              key={i}
              className={`msg-container ${m.role === "user" ? "user-container" : "ai-container"}`}
            >
              <div className="avatar">
                {m.role === "user" ? "👤" : "🤖"}
              </div>
              <div className={`msg ${m.role === "user" ? "user" : "ai"}`}>
                {m.text}
              </div>
            </article>
          ))}

          {/* LOADING INDICATOR */}
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
        </section>

        {/* INPUT COMPONENT */}
        <footer className="input-container">
          {/* FILE PREVIEW CHIP (Visible when a file is selected) */}
          {file && (
            <div className="file-preview">
              <div className="file-chip">
                <span className="file-icon">📄</span>
                <span className="file-name">{file.name}</span>
                {uploading ? (
                  <span className="upload-spinner"></span>
                ) : (
                  <button 
                    className="clear-file" 
                    onClick={() => setFile(null)}
                    title="Remove file"
                  >✕</button>
                )}
              </div>
            </div>
          )}

          <div className="inputBox">
            {/* HIDDEN FILE INPUT */}
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange} 
              className="hidden-file-input"
              id="chat-file-upload"
            />
            <label htmlFor="chat-file-upload" className="attach-btn" title="Attach PDF">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="attach-icon">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </label>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={file ? "Add a message or just click Upload..." : "Type your message..."}
              onKeyDown={handleKeyDown}
            />

            {/* SEND / UPLOAD BUTTON */}
            <button 
              onClick={file && !uploading ? uploadFile : sendMessage} 
              disabled={loading || (file && uploading) || (!input.trim() && !file)} 
              className="send-btn"
            >
              {loading || uploading ? (
                <div className="loader"></div>
              ) : file ? (
                <span className="upload-text">Upload</span>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="send-icon">
                  <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </footer>
      </main>

      {/* COMPONENT STYLES */}
      <style jsx>{`
        /* --- LAYOUT --- */
        .layout { display: flex; height: 100vh; background: #0f172a; color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; }
        
        /* --- SIDEBAR --- */
        .sidebar { width: 280px; background: #1e293b; padding: 24px; border-right: 1px solid #334155; display: flex; flex-direction: column; }
        .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
        .logo h2 { font-size: 1.15rem; font-weight: 700; color: #f1f5f9; }
        .logo .icon { font-size: 1.4rem; background: #334155; padding: 8px; border-radius: 10px; }
        .section-label { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
        .tools-list { display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .tool-card { padding: 14px; background: #334155; border-radius: 12px; border: 1px solid transparent; transition: all 0.2s; }
        .tool-card.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
        .tool-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .tool-name { font-weight: 600; font-size: 0.9rem; color: #e2e8f0; }
        .tool-desc { font-size: 0.75rem; color: #94a3b8; line-height: 1.4; }
        .sidebar-footer { margin-top: auto; display: flex; align-items: center; gap: 10px; font-size: 0.8rem; color: #94a3b8; padding-top: 16px; border-top: 1px solid #334155; }
        .status-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px rgba(34, 197, 94, 0.4); }
        .status-dot.error { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }
        
        /* --- MAIN AREA --- */
        .main { flex: 1; display: flex; flex-direction: column; background: #0f172a; position: relative; }
        .header { padding: 18px 32px; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border-bottom: 1px solid #1e293b; z-index: 10; }
        .header h3 { font-size: 1rem; font-weight: 600; color: #f8fafc; }
        .header p { font-size: 0.75rem; color: #64748b; }
        
        /* --- CHAT FEED --- */
        .chat { flex: 1; padding: 24px 32px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; scroll-behavior: smooth; }
        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #64748b; }
        .welcome-icon { font-size: 3.5rem; margin-bottom: 16px; }
        .msg-container { display: flex; gap: 16px; max-width: 80%; animation: fadeIn 0.3s ease-out; }
        .user-container { align-self: flex-end; flex-direction: row-reverse; }
        .ai-container { align-self: flex-start; }
        .avatar { width: 34px; height: 34px; background: #334155; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
        .user-container .avatar { background: #2563eb; }
        .msg { padding: 12px 18px; border-radius: 16px; font-size: 0.92rem; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
        .user { background: #2563eb; color: #ffffff; border-bottom-right-radius: 4px; }
        .ai { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-bottom-left-radius: 4px; }
        
        /* --- TYPING INDICATOR --- */
        .typing { display: flex; gap: 4px; padding: 12px 16px; align-items: center; }
        .dot { width: 5px; height: 5px; background: #94a3b8; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        
        /* --- INPUT SECTION --- */
        .input-container { padding: 20px 32px 32px; background: linear-gradient(to top, #0f172a 70%, transparent); }
        .inputBox { display: flex; background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 6px 8px; gap: 10px; align-items: center; transition: border-color 0.2s; }
        .inputBox:focus-within { border-color: #3b82f6; }
        input[type="text"] { flex: 1; background: transparent; border: none; color: #f8fafc; padding: 10px 4px; font-size: 0.95rem; outline: none; }
        .hidden-file-input { display: none; }
        
        /* --- BUTTONS & CHIPS --- */
        .attach-btn { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; color: #94a3b8; cursor: pointer; border-radius: 10px; transition: all 0.2s; }
        .attach-btn:hover { background: #334155; color: #f8fafc; }
        .attach-icon { width: 20px; height: 20px; }
        
        .file-preview { margin-bottom: 12px; display: flex; gap: 8px; }
        .file-chip { background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; border-radius: 10px; padding: 6px 12px; display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #e2e8f0; animation: slideUp 0.2s ease-out; }
        .file-name { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .clear-file { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 0.9rem; padding: 2px; border-radius: 4px; line-height: 1; }
        .clear-file:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .upload-spinner { width: 12px; height: 12px; border: 2px solid rgba(59, 130, 246, 0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }

        .send-btn { min-width: 40px; height: 38px; background: #3b82f6; border: none; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; padding: 0 14px; gap: 8px; transition: background 0.2s; }
        .send-btn:hover:not(:disabled) { background: #2563eb; }
        .send-btn:disabled { background: #334155; cursor: not-allowed; opacity: 0.6; }
        .upload-text { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
        .send-icon { width: 18px; height: 18px; }
        
        /* --- ANIMATIONS --- */
        .loader { width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
