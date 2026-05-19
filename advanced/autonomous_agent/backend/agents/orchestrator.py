from sqlalchemy.orm import Session
from database import SessionLocal
from models import Task, SubTask, Log
from websocket import manager
from agents.planner import PlannerAgent
from agents.executor import ExecutorAgent
from agents.reflector import ReflectorAgent
from datetime import datetime
from typing import List, Dict, Any

class AgentOrchestrator:
    """
    Orchestrates the multi-agent workflow: Planning -> Execution -> Reflection.
    Handles database persistence, real-time logging via WebSockets, and state transitions.
    """
    
    def __init__(self):
        # Initialize specialized agents
        self.planner = PlannerAgent()
        self.executor = ExecutorAgent()
        self.reflector = ReflectorAgent()

    async def add_log(self, db: Session, task_id: int, message: str, agent_type: str, level: str = "info"):
        """
        Helper method to save logs to the database and broadcast them in real-time.
        """
        try:
            # 1. Save to Database
            log = Log(task_id=task_id, message=message, agent_type=agent_type, level=level)
            db.add(log)
            db.commit()
            
            # 2. Broadcast to UI via WebSocket
            await manager.broadcast({
                "type": "log",
                "task_id": task_id,
                "message": message,
                "agent_type": agent_type,
                "level": level,
                "timestamp": datetime.now().isoformat() # Using local time for user readability
            })
        except Exception as e:
            print(f"Error in logging: {e}")

    async def run(self, task_id: int):
        """
        Main execution loop for a task. Runs in a background thread to keep API responsive.
        """
        # Create a fresh DB session for this background execution
        db = SessionLocal()
        try:
            # --- 1. INITIALIZATION ---
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                return

            # --- 2. PLANNING PHASE ---
            task.status = "planning"
            db.commit()
            await self.add_log(db, task_id, "🔍 Analyzing request and creating action plan...", "planner")
            
            subtasks_data: List[Dict[str, Any]] = await self.planner.plan_task(task.title)
            
            if not subtasks_data or not isinstance(subtasks_data, list):
                raise ValueError("Planner failed to generate a valid list of subtasks.")

            # Create SubTask records in DB
            for st_data in subtasks_data:
                if isinstance(st_data, dict):
                    st = SubTask(
                        task_id=task_id, 
                        title=st_data.get('title', 'Untitled'), 
                        order=st_data.get('order', 0)
                    )
                    db.add(st)
            db.commit()
            await self.add_log(db, task_id, f"✅ Plan created with {len(subtasks_data)} subtasks.", "planner", "success")

            # --- 3. EXECUTION PHASE ---
            task.status = "executing"
            db.commit()
            
            # Fetch subtasks in correct order
            subtasks = db.query(SubTask).filter(SubTask.task_id == task_id).order_by(SubTask.order).all()
            
            # Accumulate results for context awareness in subsequent steps
            results_context = ""
            for st in subtasks:
                await self.add_log(db, task_id, f"🚀 Executing: {st.title}", "executor")
                st.status = "executing"
                db.commit()
                
                # Execute individual subtask
                result_text = await self.executor.execute_subtask(st.title, results_context)
                
                # Update DB with result
                st.result = result_text
                st.status = "completed"
                results_context += f"\nSubtask: {st.title}\nResult: {result_text}\n"
                db.commit()
                
                # Log detailed result to UI
                await self.add_log(db, task_id, f"✔️ Finished: {st.title}\n\nResult:\n{result_text}", "executor", "success")

            # --- 4. REFLECTION PHASE ---
            task.status = "reflecting"
            db.commit()
            await self.add_log(db, task_id, "⚖️ Validating final results and summarizing...", "reflector")
            
            reflection = await self.reflector.reflect_on_results(task.title, results_context)
            
            # Determine final task status based on reflection success
            is_success = reflection.get('success', False)
            task.status = "completed" if is_success else "failed"
            db.commit()
            
            await self.add_log(db, task_id, f"📝 Summary: {reflection.get('summary', 'No summary')}", "reflector", "success" if is_success else "warning")
            
            # Fix: Only log "Success" if it actually succeeded
            if is_success:
                await self.add_log(db, task_id, "🏁 Workflow completed successfully.", "system", "success")
            else:
                await self.add_log(db, task_id, "⚠️ Workflow finished but task objectives were not fully met.", "system", "warning")

            # --- 5. SIGNAL COMPLETION ---
            # Notify frontend to stop loading indicators
            await manager.broadcast({
                "type": "status_update",
                "task_id": task_id,
                "status": task.status
            })

        except Exception as e:
            # Global error handling for the background worker
            import traceback
            traceback.print_exc()
            db.rollback()
            
            task = db.query(Task).filter(Task.id == task_id).first()
            if task:
                task.status = "failed"
                db.commit()
            
            await self.add_log(db, task_id, f"❌ System Error: {str(e)}", "system", "error")
            await manager.broadcast({
                "type": "status_update",
                "task_id": task_id,
                "status": "failed"
            })
        finally:
            # Always close the session to prevent leaks
            db.close()
