import os
import json
import re
import math
from dotenv import load_dotenv
from agents import Agent, Runner, function_tool, OpenAIChatCompletionsModel, AsyncOpenAI
from memory import set_variable, get_variable, list_variables, clear_memory

# =================================================================
# ENVIRONMENT & MODEL CONFIGURATION
# =================================================================
load_dotenv()

# Setup the AI Client (OpenRouter/OpenAI compatible)
client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

# Initialize the Model (Qwen 2.5 7B Instruct)
model = OpenAIChatCompletionsModel(
    model="qwen/qwen-2.5-7b-instruct",
    openai_client=client
)

# =================================================================
# TOOLS (Requirement: Math Operations & Memory Control)
# =================================================================

@function_tool
def calculator(operation: str, a: float, b: float = None):
    """
    Performs math: add, subtract, multiply, divide, power, sqrt, log.
    Fulfills Requirement: Math Operations.
    """
    try:
        if operation == "add": result = a + b
        elif operation == "subtract": result = a - b
        elif operation == "multiply": result = a * b
        elif operation == "divide":
            if b == 0: return {"status": "error", "message": "Cannot divide by zero"}
            result = a / b
        elif operation == "power": result = math.pow(a, b)
        elif operation == "sqrt": result = math.sqrt(a)
        elif operation == "log":
            base = b if b is not None else 10
            result = math.log(a, base)
        else:
            return {"status": "error", "message": f"Operation '{operation}' not supported"}
            
        return {"status": "success", "result": result, "operation": operation, "a": a, "b": b}
    except Exception as e:
        return {"status": "error", "message": f"Calculation Error: {str(e)}"}

@function_tool
def set_memory(name: str, value: float):
    """Saves a numeric value to SQLite. Fulfills Requirement: Memory."""
    message = set_variable(name, value)
    return {"status": "success", "message": message}

@function_tool
def get_memory(name: str):
    """Retrieves a stored value from SQLite."""
    value = get_variable(name)
    if value is not None:
        return {"status": "success", "value": value}
    return {"status": "error", "message": f"Memory key '{name}' not found"}

@function_tool
def list_memory():
    """Lists all manually stored variables."""
    return {"status": "success", "variables": list_variables()}

@function_tool
def clear_all_memory():
    """Clears the SQLite variable storage."""
    return {"status": "success", "message": clear_memory()}

# =================================================================
# AGENT DEFINITION (Requirement: Structured Output)
# =================================================================

agent = Agent(
    name="MathExpert",
    model=model,
    tools=[calculator, set_memory, get_memory, list_memory, clear_all_memory],
    instructions="""
You are a Math Assistant that ONLY communicates in JSON.

CORE RULES:
1. MATH: Use 'calculator' tool for any calculation.
2. MEMORY: Use 'set_memory', 'get_memory', or 'list_memory' for variable persistence.
3. OUTPUT: Always return a single JSON object. No pre-text or post-text.
4. NO CHAT LOGGING: Do not attempt to save conversation history.

JSON STRUCTURE:
{
  "status": "success" | "error",
  "operation": "add|subtract|multiply|divide|power|sqrt|log|memory_set|memory_get|memory_list|memory_clear|chat",
  "a": number or null,
  "b": number or null,
  "result": "Calculated value or message"
}
"""
)

# =================================================================
# UTILITY & EXECUTION INTERFACE
# =================================================================

def extract_json(raw_text):
    """Ensures output is clean JSON for the frontend (Requirement: Structured Output)."""
    if isinstance(raw_text, dict): return raw_text
    try:
        match = re.search(r'(\{.*\})', raw_text.strip().replace('\n', ' '), re.DOTALL)
        return json.loads(match.group(1)) if match else json.loads(raw_text)
    except:
        return {"status": "success", "operation": "chat", "result": str(raw_text)}

def run_agent(user_input: str):
    """
    Main entry point for agent execution.
    Requirement: Chat history is NOT persisted between turns.
    """
    try:
        # Run agent with fresh context (direct user input only)
        agent_response = Runner.run_sync(agent, user_input)
        final_data = extract_json(agent_response.final_output)
        
        # Standardize response for frontend
        final_data.setdefault("status", "success")
        final_data.setdefault("operation", "unknown")
        final_data.setdefault("result", "No response generated")

        return {"response": final_data}
    except Exception as e:
        return {"response": {"status": "error", "message": f"System Crash: {str(e)}"}}
