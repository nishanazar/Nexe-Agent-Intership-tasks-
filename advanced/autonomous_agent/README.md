# 🤖 Autonomous Business Agent

A high-performance, multi-agent autonomous system designed to plan, execute, and reflect on complex business tasks. Built with a focus on multi-step reasoning, real-time feedback, and resilient LLM integration.

---

## 🚀 Features

- **Multi-Agent Orchestration:** Uses a coordinated workflow between three specialized agents:
  - **Planner Agent:** Deconstructs high-level goals into 3-5 actionable subtasks.
  - **Executor Agent:** Sequentially performs each subtask while maintaining context from previous steps.
  - **Reflector Agent:** Validates final results against original objectives to ensure high-quality output.
- **Real-Time Transparency:** Live execution logs streamed via WebSockets to a modern dashboard.
- **Resilient AI Integration:** Powered by **Gemini 2.0 Flash Lite** via OpenRouter with built-in retry logic and hallucination protection.
- **Professional UX:** A sleek, dark-themed dashboard with local timestamps, loading states, and formatted result views.
- **Persistent Memory:** All tasks, subtasks, and logs are stored in a local SQLite database using SQLAlchemy.

---

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite + SQLAlchemy ORM
- **AI Client:** OpenAI SDK (configured for OpenRouter)
- **Real-time:** WebSockets

### Frontend
- **Framework:** Next.js 15+ (React 19)
- **State Management:** Zustand
- **Styling:** Tailwind CSS (v4)
- **Icons:** Lucide-React

---

## 📥 Installation & Setup

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Add your OPENROUTER_API_KEY
echo "OPENROUTER_API_KEY=your_key_here" > .env

# Start the server
python main.py
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 🔄 The Workflow (Handoff Logic)

1. **User Input:** User provides a goal (e.g., "Plan a coffee shop launch").
2. **Planning:** The **Planner** breaks it down and saves subtasks to the DB.
3. **Execution:** The **Executor** processes subtasks one by one. Each step is logged and shared as "context" for the next step.
4. **Reflection:** The **Reflector** reviews the entire output, provides a summary, and marks the task as `completed` or `failed`.
5. **Real-time Logs:** Every step is broadcasted to the UI with local timestamps and detailed result content.

---

## 📝 Best Practices Implemented
- **Separation of Concerns:** Clear boundaries between AI logic, orchestration, and UI state.
- **Error Handling:** Global try-catch blocks and database rollbacks.
- **Type Safety:** Strict TypeScript interfaces and Python type hints.
- **Constraint Adherence:** Strict system prompts to prevent LLM hallucinations and maintain word limits.

---

## 📄 License
MIT License. Created for autonomous business orchestration.
