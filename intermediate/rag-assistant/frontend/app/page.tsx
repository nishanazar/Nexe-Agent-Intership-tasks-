"use client";

import { useState, ChangeEvent, KeyboardEvent } from "react";

/**
 * TypeScript Interfaces
 */
interface Message {
  role: "user" | "ai";
  text: string;
  fileName?: string; // Attachment metadata
}

interface UploadResponse {
  message: string;
  chunks: number;
  answer?: string;
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
   * Uploads the selected PDF and optionally sends a message.
   */
  const handleUploadAndSend = async () => {
    if (!file) return;
    
    const currentInput = input.trim();
    const currentFileName = file.name;
    
    setUploading(true);
    setLoading(true);
    setStatus("Processing document...");

    // Add user message with file attachment to UI immediately
    setMessages((prev) => [
      ...prev, 
      { role: "user", text: currentInput, fileName: currentFileName }
    ]);
    
    setInput("");
    const fileToUpload = file;
    setFile(null); // Clear file from input area

    const formData = new FormData();
    formData.append("file", fileToUpload);
    if (currentInput) {
      formData.append("message", currentInput);
    }

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      
      const data: UploadResponse = await response.json();
      
      if (response.ok) {
        if (data.answer) {
          setMessages((prev) => [...prev, { role: "ai", text: data.answer! }]);
        } else {
          setMessages((prev) => [...prev, { role: "ai", text: "I've processed the document. How can I help you with it?" }]);
        }
        setStatus("Ready");
      } else {
        throw new Error((data as any).detail || (data as any).message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      setMessages((prev) => [...prev, { role: "ai", text: `❌ Error: ${error.message || "Failed to upload the document."}` }]);
      setStatus("Error");
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  /**
   * Sends a standard text query to the RAG Agent.
   */
  const handleSendMessage = async () => {
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
      
      const data = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [...prev, { role: "ai", text: data.text }]);
      } else {
        throw new Error(data.detail || "Backend error");
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, { role: "ai", text: `⚠️ Error: ${error.message || "Connection Error: Is the backend server running?"}` }]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Unified Send Trigger
   */
  const onSend = () => {
    if (file) {
      handleUploadAndSend();
    } else {
      handleSendMessage();
    }
  };

  /**
   * Handles 'Enter' key press for sending messages.
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && !uploading && (input.trim() || file)) {
      onSend();
    }
  };

  // --- RENDER ---
  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <span className="icon">🤖</span>
          <h2>RAG Assistant</h2>
        </div>
        
        <nav className="section-label">Session</nav>
        <div className="tools-list">
          <button className="new-chat-btn" onClick={() => setMessages([])}>
            <span>+</span> New Chat
          </button>
        </div>

        <footer className="sidebar-footer">
          <div className={`status-dot ${status === "Error" ? "error" : ""}`}></div>
          <span>{status}</span>
        </footer>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main">
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
                {/* File Attachment Card (if present) */}
                {m.fileName && (
                  <div className="message-file-card">
                    <div className="file-icon-box">PDF</div>
                    <div className="file-info">
                      <span className="file-name">{m.fileName}</span>
                      <span className="file-type">Document</span>
                    </div>
                  </div>
                )}
                {m.text && <div className="text-content">{m.text}</div>}
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
        <footer className="input-area">
          <div className="input-wrapper">
            {/* FILE PREVIEW CHIP (Visible when a file is selected) */}
            {file && (
              <div className="input-file-preview">
                <div className="file-chip">
                  <div className="file-chip-icon">PDF</div>
                  <span className="file-name">{file.name}</span>
                  <button className="clear-file" onClick={() => setFile(null)}>✕</button>
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
                placeholder="Message RAG Assistant..."
                onKeyDown={handleKeyDown}
              />

              <button 
                onClick={onSend} 
                disabled={loading || uploading || (!input.trim() && !file)} 
                className="send-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="send-icon">
                  <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <p className="input-footer">AI can make mistakes. Check important info.</p>
          </div>
        </footer>
      </main>

      {/* COMPONENT STYLES */}
      <style jsx>{`
        /* --- LAYOUT --- */
        .layout { 
          display: flex; 
          height: 100vh; 
          background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); 
          color: #f1f5f9; 
          font-family: 'Inter', system-ui, -apple-system, sans-serif; 
        }
        
        /* --- SIDEBAR --- */
        .sidebar { 
          width: 280px; 
          background: rgba(15, 23, 42, 0.8); 
          backdrop-filter: blur(10px);
          padding: 20px; 
          display: flex; 
          flex-direction: column; 
          border-right: 1px solid rgba(255, 255, 255, 0.05);
        }
        .logo { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          padding: 10px; 
          margin-bottom: 30px; 
        }
        .logo h2 { 
          font-size: 1.1rem; 
          font-weight: 700; 
          letter-spacing: -0.02em;
          background: linear-gradient(to right, #60a5fa, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .logo .icon { 
          font-size: 1.4rem; 
          filter: drop-shadow(0 0 8px rgba(96, 165, 250, 0.4));
        }
        
        .new-chat-btn { 
          width: 100%; 
          background: rgba(255, 255, 255, 0.03); 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          color: #f1f5f9; 
          padding: 12px; 
          border-radius: 12px; 
          text-align: left; 
          cursor: pointer; 
          font-size: 0.9rem; 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
          display: flex; 
          align-items: center; 
          gap: 10px; 
        }
        .new-chat-btn:hover { 
          background: rgba(255, 255, 255, 0.07); 
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
        .new-chat-btn span { font-size: 1.2rem; color: #60a5fa; }

        .section-label { 
          font-size: 0.7rem; 
          font-weight: 700;
          color: #64748b; 
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 10px; 
          margin-top: 20px; 
        }
        .tools-list { flex: 1; }
        
        .sidebar-footer { 
          margin-top: auto; 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          padding: 15px; 
          font-size: 0.8rem; 
          color: #94a3b8; 
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
        }
        .status-dot { 
          width: 10px; 
          height: 10px; 
          background: #22c55e; 
          border-radius: 50%; 
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.4);
        }
        .status-dot.error { 
          background: #ef4444; 
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
        }
        
        /* --- MAIN AREA --- */
        .main { 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          background: transparent; 
          position: relative; 
          overflow: hidden; 
        }
        
        /* --- CHAT FEED --- */
        .chat { 
          flex: 1; 
          overflow-y: auto; 
          display: flex; 
          flex-direction: column; 
          padding: 40px 0; 
          max-width: 850px; 
          margin: 0 auto; 
          width: 100%; 
          gap: 40px; 
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
        }
        .empty-state { 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          text-align: center; 
          animation: slideUp 0.6s ease-out;
        }
        .welcome-icon { 
          font-size: 4rem; 
          margin-bottom: 24px; 
          filter: drop-shadow(0 0 20px rgba(96, 165, 250, 0.3));
        }
        .empty-state h2 { font-size: 1.8rem; font-weight: 700; margin-bottom: 8px; }
        .empty-state p { color: #94a3b8; font-size: 1.1rem; }
        
        .msg-container { 
          display: flex; 
          gap: 20px; 
          padding: 0 24px; 
          width: 100%; 
          animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .user-container { flex-direction: row-reverse; }
        
        .avatar { 
          width: 38px; 
          height: 38px; 
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 1rem; 
          flex-shrink: 0; 
          background: #334155; 
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .user-container .avatar { 
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); 
          color: white; 
          border: none;
        }
        
        .msg { 
          max-width: 75%; 
          display: flex; 
          flex-direction: column; 
          gap: 14px; 
          line-height: 1.6; 
          font-size: 1.05rem; 
        }
        .user { 
          background: rgba(59, 130, 246, 0.1); 
          padding: 16px 24px; 
          border-radius: 24px; 
          border-bottom-right-radius: 4px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          backdrop-filter: blur(4px);
        }
        .ai { 
          background: transparent; 
          padding: 0; 
          color: #e2e8f0;
        }
        
        /* Message File Card */
        .message-file-card { 
          background: rgba(30, 41, 59, 0.7); 
          border: 1px solid rgba(255, 255, 255, 0.08); 
          border-radius: 16px; 
          padding: 14px; 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          width: fit-content;
          min-width: 240px; 
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        .file-icon-box { 
          background: #ef4444; 
          color: white; 
          font-size: 0.75rem; 
          font-weight: 900; 
          padding: 10px 8px; 
          border-radius: 8px; 
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
        }
        .file-info { display: flex; flex-direction: column; gap: 2px; }
        .file-info .file-name { font-size: 0.95rem; font-weight: 600; color: #f1f5f9; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-info .file-type { font-size: 0.8rem; color: #64748b; }

        /* --- INPUT SECTION --- */
        .input-area { padding-bottom: 32px; z-index: 10; }
        .input-wrapper { max-width: 850px; margin: 0 auto; width: 100%; padding: 0 24px; }
        .inputBox { 
          background: rgba(30, 41, 59, 0.6); 
          backdrop-filter: blur(16px);
          border-radius: 28px; 
          padding: 10px 14px; 
          display: flex; 
          align-items: flex-end; 
          gap: 10px; 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .inputBox:focus-within { 
          border-color: rgba(96, 165, 250, 0.5); 
          background: rgba(30, 41, 59, 0.8);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
        
        input[type="text"] { 
          flex: 1; 
          background: transparent; 
          border: none; 
          color: #f1f5f9; 
          padding: 12px 6px; 
          font-size: 1.05rem; 
          outline: none; 
          min-height: 44px; 
        }
        input[type="text"]::placeholder { color: #64748b; }
        .hidden-file-input { display: none; }
        
        .attach-btn { 
          width: 40px; 
          height: 40px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: #94a3b8; 
          cursor: pointer; 
          border-radius: 50%; 
          transition: all 0.2s; 
          flex-shrink: 0; 
        }
        .attach-btn:hover { 
          background: rgba(255, 255, 255, 0.05); 
          color: #f1f5f9; 
          transform: rotate(15deg);
        }
        .attach-icon { width: 24px; height: 24px; }
        
        .send-btn { 
          width: 40px; 
          height: 40px; 
          background: #f1f5f9; 
          border: none; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: #0f172a; 
          cursor: pointer; 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
          flex-shrink: 0; 
        }
        .send-btn:hover:not(:disabled) { 
          transform: scale(1.05) translateY(-1px);
          background: #ffffff;
        }
        .send-btn:disabled { 
          background: #334155; 
          color: #64748b; 
          cursor: not-allowed; 
        }
        .send-icon { width: 22px; height: 22px; }
        
        .input-file-preview { padding: 0 12px 12px; }
        .file-chip { 
          background: rgba(96, 165, 250, 0.1); 
          border: 1px solid rgba(96, 165, 250, 0.3); 
          border-radius: 14px; 
          padding: 10px 14px; 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          max-width: 300px; 
          animation: slideUp 0.3s ease-out;
        }
        .file-chip-icon { 
          background: #ef4444; 
          color: white; 
          font-size: 0.65rem; 
          font-weight: 900; 
          padding: 5px 4px; 
          border-radius: 5px; 
        }
        .file-chip .file-name { 
          font-size: 0.9rem; 
          font-weight: 500;
          color: #f1f5f9; 
          overflow: hidden; 
          text-overflow: ellipsis; 
          white-space: nowrap; 
          flex: 1; 
        }
        .clear-file { 
          background: rgba(0, 0, 0, 0.2); 
          border: none; 
          color: #94a3b8; 
          cursor: pointer; 
          font-size: 0.9rem; 
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .clear-file:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        
        .input-footer { text-align: center; font-size: 0.75rem; color: #64748b; margin-top: 16px; }

        /* --- ANIMATIONS --- */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .typing { display: flex; gap: 5px; padding: 12px 0; }
        .dot { 
          width: 5px; 
          height: 5px; 
          background: #60a5fa; 
          border-radius: 50%; 
          animation: bounce 1.4s infinite ease-in-out both; 
          box-shadow: 0 0 5px rgba(96, 165, 250, 0.5);
        }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
      `}</style>
    </div>
  );
}
