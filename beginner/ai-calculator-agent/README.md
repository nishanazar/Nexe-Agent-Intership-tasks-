# AI Calculator Agent 🤖🧮

A professional, tool-calling AI agent designed for precise mathematical operations and persistent numeric memory.

## ❖ Project Requirements
This project fulfills the following core requirements:
- **Math Operations:** Supports basic arithmetic, powers, square roots, and logarithms.
- **Memory:** Uses SQLite database to persist manually saved numeric variables (e.g., marks, balance) across sessions.
- **Structured Output:** Communicates exclusively via structured JSON for seamless frontend integration and data reliability.

---

## 🚀 Getting Started

### 1. Backend Setup (Python + FastAPI)
The backend manages the AI logic, tool calling, and SQLite database.

1. Navigate to the `backend` folder.
2. Install dependencies:
   ```bash
   pip install fastapi uvicorn pydantic python-dotenv agents openai
   ```
3. Create a `.env` file and add your `OPENROUTER_API_KEY`.
4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

### 2. Frontend Setup (Next.js + Tailwind)
The frontend provides a modern chat interface for interacting with the agent.

1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack
- **Frontend:** Next.js (React), Tailwind CSS.
- **Backend:** FastAPI (Python).
- **AI Engine:** OpenAI Agents SDK (using Qwen 2.5 7B via OpenRouter).
- **Database:** SQLite (for persistent memory).

---

## 📂 Project Structure
- `/backend`: Python API, Agent logic, and `calculator_memory.db`.
- `/frontend`: Next.js web application.
- `backend/memory.py`: Database management and variable persistence.
- `backend/agent.py`: Agent configuration and tool definitions.

---

## 📝 Features & Usage
- **Calculation:** Ask things like *"Calculate 25 * 4"* or *"What is the log of 100?"*.
- **Save Memory:** Use commands like *"Save my marks as 85"*.
- **Retrieve Memory:** Ask *"What are my marks?"* or *"List all variables in memory"*.
- **Clear Memory:** Use *"Clear all my memory"* to wipe the SQLite database.
