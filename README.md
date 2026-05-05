# 🤖 Nexe Agent (Tool-Calling AI System)

A professional, modern AI Agent prototype built using the **OpenAI-Agents SDK**, **FastAPI**, and **Next.js**. This project demonstrates a core "Tool-Calling" architecture where an AI agent autonomously uses external functions to solve tasks.

## 🚀 Requirements Fulfilled (Beginner Level)
This project strictly adheres to the following core requirements:
1. **Tool-Calling AI Agent:** Implements autonomous function calling via a `calculator` tool.
2. **JSON Response:** All backend responses are strictly parsed and delivered as structured JSON objects.
3. **Error Handling:** Robust error management across the tool level, agent logic, and frontend UI.

---

## 🏗️ Project Architecture

### 1. Backend (Python/FastAPI)
- **Framework:** FastAPI for high-performance API endpoints.
- **Agent Core:** Built with the `openai-agents` SDK.
- **Model:** Integrated with `OpenRouter` (specifically using `qwen-2.5-7b-instruct`).
- **Tools:** Custom `@function_tool` for mathematical operations.
- **Safety:** Implements a surgical JSON parser and schema-leak protection.

### 2. Frontend (Next.js/React)
- **Framework:** Next.js 15+ (App Router).
- **Styling:** Modern, dark-themed UI using CSS-in-JS (styled-jsx).
- **Features:** 
  - Dynamic "Available Tools" sidebar.
  - Interactive chat interface with avatars.
  - Real-time typing animations and loading states.
  - Detailed result breakdown (Operation, Inputs, Result).

---

## 🛠️ Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file and add your OpenRouter API Key:
   ```env
   OPENROUTER_API_KEY=your_key_here
   ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn python-dotenv agents openai
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd my-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧮 How It Works
1. The user enters a math problem (e.g., *"What is 25 * 4?"*).
2. The **Nexe Agent** identifies the need for a calculation and triggers the `calculator` tool.
3. The tool executes the logic and returns a **JSON response** to the agent.
4. The agent wraps this into a final structured JSON output.
5. The **Frontend** parses the JSON and displays a formatted result card.

## 🛡️ Error Handling
- **Tool Level:** Handles division by zero and invalid operations.
- **Agent Level:** `try-except` blocks catch model hallucinations or connection issues.
- **Parser Level:** Surgical regex extraction ensures valid JSON even if the model adds conversational text.
- **Frontend Level:** Graceful error bubbles if the server is unreachable.

---
*Developed as a high-quality beginner-level AI Agent prototype.*
