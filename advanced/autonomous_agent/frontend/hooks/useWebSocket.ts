import { useEffect } from 'react';
import { useAgentStore } from '../store/useAgentStore';

export const useWebSocket = () => {
  const addLog = useAgentStore((state) => state.addLog);
  const fetchTasks = useAgentStore((state) => state.fetchTasks);
  const currentTaskId = useAgentStore((state) => state.currentTaskId);

  const setIsLoading = useAgentStore((state) => state.setIsLoading);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/logs');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'log') {
        if (currentTaskId === null || data.task_id === currentTaskId) {
            addLog(data);
        }
        fetchTasks();
      } else if (data.type === 'status_update') {
        if (data.status === 'completed' || data.status === 'failed') {
          setIsLoading(false);
          fetchTasks();
        }
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    return () => {
      socket.close();
    };
  }, [addLog, fetchTasks, currentTaskId]);
};
