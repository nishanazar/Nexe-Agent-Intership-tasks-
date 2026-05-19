import { create } from 'zustand';

/**
 * Standard Types for the Agent System
 */
export interface Log {
  id?: number;
  task_id: number;
  message: string;
  agent_type: string;
  level: string; // 'info' | 'success' | 'warning' | 'error'
  timestamp: string;
}

export interface SubTask {
  id: number;
  title: string;
  status: string;
  result?: string;
  order: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  subtasks: SubTask[];
}

/**
 * Zustand Store: Centralized state for Tasks, Logs, and UI states.
 * Best Practice: Separates UI logic from API calls.
 */
interface AgentState {
  tasks: Task[];
  logs: Log[];
  currentTaskId: number | null;
  isLoading: boolean;
  
  // Actions
  setIsLoading: (loading: boolean) => void;
  setTasks: (tasks: Task[]) => void;
  addLog: (log: Log) => void;
  setLogs: (logs: Log[]) => void;
  setCurrentTaskId: (id: number | null) => void;
  
  // API Calls
  fetchTasks: () => Promise<void>;
  runTask: (task: string) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
}

const API_BASE = 'http://localhost:8000';

export const useAgentStore = create<AgentState>((set, get) => ({
  // --- INITIAL STATE ---
  tasks: [],
  logs: [],
  currentTaskId: null,
  isLoading: false,

  // --- ACTIONS ---
  setTasks: (tasks) => set({ tasks }),
  
  addLog: (log) => set((state) => ({ 
    logs: [...state.logs, log] 
  })),
  
  setLogs: (logs) => set({ logs }),
  
  setCurrentTaskId: (id) => set({ currentTaskId: id }),
  
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),

  // --- API / ASYNC ACTIONS ---

  /**
   * Fetches all historical tasks from the backend.
   */
  fetchTasks: async () => {
    try {
      const response = await fetch(`${API_BASE}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch');
      const tasks = await response.json();
      set({ tasks });
    } catch (error) {
      console.error('Fetch Tasks Error:', error);
    }
  },

  /**
   * Deletes a specific task and its associated data.
   */
  deleteTask: async (taskId: number) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' });
      if (response.ok) {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
          currentTaskId: state.currentTaskId === taskId ? null : state.currentTaskId,
        }));
      }
    } catch (error) {
      console.error('Delete Task Error:', error);
    }
  },

  /**
   * Initiates the multi-agent workflow for a new task.
   * Best Practice: Starts loading here, but it's finalized by the WebSocket 'status_update'.
   */
  runTask: async (taskTitle: string) => {
    set({ isLoading: true, logs: [] }); // Start loading and clear old logs
    try {
      const response = await fetch(`${API_BASE}/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskTitle }),
      });
      
      if (!response.ok) throw new Error('Failed to start agent');
      
      const newTask = await response.json();
      
      // Update local state with the newly created task
      set((state) => ({ 
        tasks: [newTask, ...state.tasks],
        currentTaskId: newTask.id,
      }));
      
    } catch (error) {
      console.error('Run Task Error:', error);
      set({ isLoading: false }); // Stop loading only if request fails
    }
    // Success case loading state is handled by useWebSocket.ts
  },
}));
