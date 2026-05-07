# 🌦️ Tool-Calling AI Agent (Weather)

A full-stack AI application demonstrating **Function Calling**, **Strict JSON Responses**, and **Robust Error Handling** using the OpenAI Agents SDK and xAI (Grok).

## 🚀 Key Features

-   **Function Calling:** The agent uses a dedicated `get_weather` tool to fetch weather data instead of relying on its own training data.
-   **Strict JSON Responses:** Every response from the backend is a structured JSON object, ensuring seamless integration with the frontend.
-   **Error Handling:** Comprehensive error management for API issues, invalid JSON, and connectivity problems.
-   **Modern UI:** A clean, dark-themed chat interface built with Next.js.

---

## 🛠️ Tech Stack

-   **Backend:** Python, FastAPI, OpenAI Agents SDK, xAI (Grok-beta)
-   **Frontend:** Next.js (React), TypeScript, Vanilla CSS
-   **Testing:** Pytest

---

## ⚙️ Setup Instructions

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the `backend` folder and add your xAI API key:
   ```env
   GROQ_API_KEY=your_xai_api_key_here
   ```
4. Run the server:
   ```bash
   python main.py
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing
To run the backend tests, navigate to the `backend` folder and execute:
```bash
pytest test_agent.py
```

## 📝 Project Requirements Fulfilled
- [x] **Function calling:** Integrated `get_weather` tool.
- [x] **JSON response:** All agent outputs are structured JSON.
- [x] **Error handling:** Managed via try-except blocks and JSON error status.
