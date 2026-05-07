'use client';

import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { role: 'user', content: message };
    setChat((prev) => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to backend');
      }

      const data = await response.json();
      const assistantMessage = { 
        role: 'assistant', 
        content: typeof data === 'string' ? data : data.response || data.message || 'Done!' 
      };
      setChat((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setChat((prev) => [...prev, { role: 'assistant', content: 'Error connecting to backend. Make sure the FastAPI server is running.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen max-w-4xl mx-auto p-4 font-[family-name:var(--font-geist-sans)]">
      <header className="py-6 text-center border-b mb-4">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Multi-Tool Agent</h1>
        <div className="flex justify-center gap-4 mt-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">🌐 Web Search</span>
          <span className="flex items-center gap-1">🐘 Neon DB</span>
          <span className="flex items-center gap-1">📧 Gmail SMTP</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-xl bg-gray-50 dark:bg-zinc-900 shadow-inner">
        {chat.length === 0 && (
          <div className="text-center text-gray-500 mt-20 flex flex-col items-center gap-4">
            <div className="text-5xl">🤖</div>
            <p className="text-lg font-medium">Hello! I'm your Multi-Tool Assistant.</p>
            <p className="max-w-xs text-sm">You can ask me to find information online, save notes to your database, or send emails on your behalf.</p>
            <div className="grid grid-cols-1 gap-2 mt-4 text-xs">
              <button 
                onClick={() => setMessage('What is the latest news about AI?')}
                className="p-2 border rounded hover:bg-white dark:hover:bg-zinc-800 transition-colors"
              >
                "What is the latest news about AI?"
              </button>
              <button 
                onClick={() => setMessage('Save a note saying "Meeting at 3 PM" to the database')}
                className="p-2 border rounded hover:bg-white dark:hover:bg-zinc-800 transition-colors"
              >
                "Save a note to the database"
              </button>
            </div>
          </div>
        )}
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-4 rounded-2xl rounded-bl-none shadow-sm animate-pulse flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="text-xs text-gray-400 font-medium">Agent is active</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 bg-white dark:bg-zinc-800 p-2 rounded-2xl border shadow-lg border-gray-200 dark:border-zinc-700">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 p-4 bg-transparent focus:outline-none text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
        >
          Send
        </button>
      </form>
    </main>
  );
}
