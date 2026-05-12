"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  role: "user" | "ai";
  text: string;
}

interface SessionItem {
  session_id: string;
  session_title: string;
  created_at: string;
}

interface DBMessage {
  user_message: string;
  agent_response: string;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<SessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const generateSessionId = () => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    return `chat-${timestamp}`;
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:8000/history");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  // Initial session setup
  useEffect(() => {
    const newId = generateSessionId();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentSessionId(newId);
    fetchHistory();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadSession = async (sessionId: string) => {
    setLoading(true);
    setCurrentSessionId(sessionId);
    try {
      const res = await fetch(`http://localhost:8000/history/${sessionId}`);
      const data = await res.json();
      const formattedMessages = data.flatMap((item: DBMessage) => [
        { role: "user", text: item.user_message },
        { role: "ai", text: item.agent_response }
      ]);
      setMessages(formattedMessages);
    } catch (err) {
      console.error("Failed to load session:", err);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = () => {
    const newId = generateSessionId();
    setCurrentSessionId(newId);
    setMessages([]);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/history/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (currentSessionId === sessionId) {
          createNewChat();
        }
        fetchHistory();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentSessionId) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg,
          session_id: currentSessionId 
        }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.response }]);
      fetchHistory(); // Refresh sidebar history
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "❌ Error: Could not connect to the agent backend." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#f8fafc]">
      {/* SIDEBAR */}
      <div className="w-72 bg-[#1e293b] border-r border-[#334155] flex flex-col">
        <div className="p-6 border-b border-[#334155]">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <span className="text-2xl">🤖</span> AI Agent
          </h2>
          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg transition-all text-sm font-medium"
          >
            <span>+</span> New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            History
          </div>
          {history.length === 0 ? (
            <div className="text-sm text-slate-500 italic p-2 text-center">No conversations yet</div>
          ) : (
            history.map((item) => (
              <div
                key={item.session_id}
                onClick={() => loadSession(item.session_id)}
                className={`group p-3 rounded-lg cursor-pointer border transition-all relative ${
                  currentSessionId === item.session_id 
                    ? "bg-[#3b82f6]/20 border-[#3b82f6]/50" 
                    : "bg-[#334155]/30 border-transparent hover:bg-[#334155]/50 hover:border-[#3b82f6]/30"
                }`}
              >
                <div className="text-sm font-medium truncate pr-6">
                  {item.session_title || "New Conversation"}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(item.session_id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md transition-all"
                  title="Delete conversation"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-top border-[#334155] bg-[#0f172a]/20">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            System Online
          </div>
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-[#334155] flex items-center px-8 bg-[#0f172a]/80 backdrop-blur-md z-10">
          <div className="flex-1">
            <h1 className="text-sm font-bold">Multi-Tool Assistant</h1>
            <p className="text-[10px] text-slate-400">Search • Email • Memory</p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {currentSessionId}
          </div>
        </header>

        {/* FEED */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="text-6xl mb-6">🛠️</div>
              <h3 className="text-2xl font-bold mb-2">How can I help you today?</h3>
              <p className="text-slate-400 text-sm">
                Try asking &quot;What is the latest news about AI?&quot; or &quot;Send a summary of my last chat to dev@example.com&quot;
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                m.role === "user" ? "bg-[#3b82f6]" : "bg-[#334155]"
              }`}>
                {m.role === "user" ? "👤" : "🤖"}
              </div>
              <div className={`message-bubble ${
                m.role === "user" ? "message-user" : "message-ai"
              }`}>
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#334155] flex items-center justify-center text-sm">🤖</div>
              <div className="message-bubble message-ai">
                <div className="typing-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* INPUT */}
        <div className="p-8 pt-0">
          <div className="max-w-4xl mx-auto relative group">
            <input
              className="w-full bg-[#1e293b] border border-[#334155] rounded-2xl py-4 px-6 pr-16 focus:outline-none focus:border-[#3b82f6] transition-all shadow-2xl group-hover:border-[#475569]"
              placeholder="Message Multi-Tool Agent..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#334155] text-white p-2 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-500 mt-4 uppercase tracking-widest font-semibold">
            Powered by OpenAI Agents SDK & SQLite Memory
          </p>
        </div>
      </div>
    </div>
  );
}
