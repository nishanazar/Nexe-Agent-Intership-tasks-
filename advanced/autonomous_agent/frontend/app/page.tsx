'use client';

import { useState, useEffect, useRef } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  Send, 
  Terminal, 
  History, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2,
  Bot,
  LayoutDashboard,
  Trash2
} from 'lucide-react';

export default function Dashboard() {
  const [input, setInput] = useState('');
  const { 
    tasks, 
    logs, 
    runTask, 
    fetchTasks, 
    isLoading, 
    currentTaskId, 
    setCurrentTaskId,
    setLogs,
    deleteTask
  } = useAgentStore();
  
  useWebSocket();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const taskTitle = input;
    setInput('');
    await runTask(taskTitle);
  };

  const handleTaskClick = async (taskId: number) => {
    setCurrentTaskId(taskId);
    try {
        const response = await fetch(`http://localhost:8000/logs/${taskId}`);
        const historicalLogs = await response.json();
        setLogs(historicalLogs);
    } catch (error) {
        console.error('Failed to fetch logs:', error);
    }
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar: History */}
      <div className="w-80 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-lg">Task History</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task.id)}
              role="button"
              tabIndex={0}
              className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                currentTaskId === task.id 
                  ? 'bg-indigo-500/10 border-indigo-500/50' 
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">
                  {new Date(task.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {task.status === 'failed' && <AlertCircle className="w-3 h-3 text-rose-400" />}
                  {['planning', 'executing', 'reflecting'].includes(task.status) && (
                    <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    className="hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium line-clamp-2">{task.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
          {/* Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-indigo-400" />
            <h1 className="font-bold text-xl tracking-tight">Autonomous Agent</h1>
          </div>
          {currentTask && (
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
              <span className={`w-2 h-2 rounded-full ${
                currentTask.status === 'completed' ? 'bg-emerald-500' :
                currentTask.status === 'failed' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
              }`} />
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {currentTask.status}
              </span>
            </div>
          )}
        </header>

        {/* Content Area */}
        <main className="flex-1 flex overflow-hidden">
          {/* Chat / Logs Area */}
          <div className="flex-1 flex flex-col border-r border-zinc-800">
            {/* Active Task Prompt Display */}
            {currentTask && (
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30">
                <p className="text-sm text-zinc-400 font-medium">Active Prompt:</p>
                <p className="text-base text-zinc-100 mt-1 font-semibold">{currentTask.title}</p>
              </div>
            )}

            {/* Logs Viewer */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!currentTaskId && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                  <Bot className="w-16 h-16 opacity-20" />
                  <p className="text-lg">What task should I handle today?</p>
                </div>
              )}

              {logs.map((log, index) => (
                <div key={index} className="flex gap-4">
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    log.agent_type === 'planner' ? 'bg-blue-500/20 text-blue-400' :
                    log.agent_type === 'executor' ? 'bg-purple-500/20 text-purple-400' :
                    log.agent_type === 'reflector' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {log.agent_type === 'planner' ? <Clock className="w-4 h-4" /> :
                      log.agent_type === 'executor' ? <Terminal className="w-4 h-4" /> :
                      log.agent_type === 'reflector' ? <CheckCircle2 className="w-4 h-4" /> :
                      <Bot className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        {log.agent_type}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={`p-3 rounded-lg border ${
                      log.level === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' :
                      log.level === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' :
                      'bg-zinc-900 border-zinc-800 text-zinc-300'
                    } text-sm leading-relaxed whitespace-pre-wrap`}>
                      {log.message}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 bg-zinc-800 rounded" />
                    <div className="h-12 bg-zinc-800 rounded-lg" />
                  </div>
                </div>
              )}
              <div ref={logEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-zinc-950 border-t border-zinc-800">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the agent to do something (e.g., 'Plan a marketing strategy for a new coffee shop')"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-4 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
