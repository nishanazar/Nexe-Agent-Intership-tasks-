import os
import json
import re
import math
from dotenv import load_dotenv
from agents import Agent, Runner, function_tool, OpenAIChatCompletionsModel, AsyncOpenAI
from memory import set_variable, get_variable, list_variables, clear_memory, add_history, get_history

# =================================================================
# ENVIRONMENT & CONFIGURATION
# =================================================================
load_dotenv()

# Setup the AI Client (OpenRouter/OpenAI compatible)
client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

# Initialize the Model
model = OpenAIChatCompletionsModel(
    model="qwen/qwen-2.5-7b-instruct",
    openai_client=client
)

# =================================================================
# TOOLS (FUNCTION CALLING)
# =================================================================

@function_tool
def calculator(operation: str, a: float, b: float = None):
    """
    Performs mathematical operations.
    Operations supported: add, subtract, multiply, divide, power, sqrt, log.
    - 'sqrt' only requires 'a'.
    - 'log' uses 'a' as value and 'b' as base (defaults to 10).
    """
    print(f"LOG: Calculator Tool -> {operation}({a}, {b})")
    
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
            
        return {
            "status": "success",
            "result": result,
            "operation": operation,
            "a": a,
            "b": b
        }
    except Exception as e:
        return {"status": "error", "message": f"Calculation Error: {str(e)}"}

@function_tool
def set_memory(name: str, value: float):
    """Stores a numeric value in SQLite memory with a specific name."""
    message = set_variable(name, value)
    return {"status": "success", "message": message}

@function_tool
def get_memory(name: str):
    """Retrieves a previously stored value from SQLite memory by name."""
    value = get_variable(name)
    if value is not None:
        return {"status": "success", "value": value}
    return {"status": "error", "message": f"Memory key '{name}' not found"}

@function_tool
def list_memory():
    """Lists all variables currently stored in SQLite memory."""
    variables = list_variables()
    return {"status": "success", "variables": variables}

@function_tool
def clear_all_memory():
    """Removes all stored variables from memory."""
    message = clear_memory()
    return {"status": "success", "message": message}

# =================================================================
# AGENT DEFINITION
# =================================================================

agent = Agent(
    name="MathExpert",
    model=model,
    tools=[calculator, set_memory, get_memory, list_memory, clear_all_memory],
    instructions="""
You are a Math Assistant that ONLY communicates in JSON.

CORE RULES:
1. MATH: Use 'calculator' tool for any calculation.
2. MEMORY: Use 'set_memory', 'get_memory', or 'list_memory' for data persistence.
3. OUTPUT: Your final response MUST ALWAYS be a single JSON object. 
4. NO TEXT: Do not include any text before or after the JSON.
5. NO HALLUCINATION: 'calculator', 'set_memory', 'get_memory', 'list_memory', and 'clear_all_memory' are the ONLY tools available. Do NOT try to call a tool named 'conversation' or 'chat'.

JSON STRUCTURE:
{
  "status": "success" | "error",
  "operation": "add|subtract|multiply|divide|power|sqrt|log|memory_set|memory_get|memory_list|memory_clear|chat",
  "a": number or null,
  "b": number or null,
  "result": "Your message or the calculated value"
}
"""
)

# =================================================================
# UTILITY FUNCTIONS
# =================================================================

def extract_json(raw_text):
    """Surgically extracts JSON from model output in case it includes extra text."""
    if isinstance(raw_text, dict): return raw_text
    
    try:
        # Look for the first occurrence of { and the last }
        match = re.search(r'(\{.*\})', raw_text.strip().replace('\n', ' '), re.DOTALL)
        if match:
            return json.loads(match.group(1))
        return json.loads(raw_text)
    except:
        # Fallback if parsing fails completely
        return {
            "status": "success",
            "operation": "conversation",
            "result": str(raw_text)
        }

# =================================================================
# MAIN EXECUTION INTERFACE
# =================================================================

def run_agent(user_input: str):
    """Runs the agent with history context and saves the results."""
    try:
        # 1. Load History Context (last 5 messages)
        history = get_history(limit=5)
        context = "\n".join([f"{role.upper()}: {content}" for role, content in history])
        
        # 2. Construct Full Prompt
        prompt = f"Previous Context:\n{context}\n\nUSER QUESTION: {user_input}"
        
        # 3. Execute Agent
        agent_response = Runner.run_sync(agent, prompt)
        
        # 4. Parse & Normalize Output
        final_data = extract_json(agent_response.final_output)
        
        # Ensure minimal required fields for frontend
        final_data.setdefault("status", "success")
        final_data.setdefault("operation", "unknown")
        final_data.setdefault("result", "No response generated")

        # 5. Persistent Logging (Save this turn to history)
        add_history("user", user_input)
        add_history("ai", str(final_data.get("result")))

        return {"response": final_data}

    except Exception as e:
        return {
            "response": {
                "status": "error",
                "message": f"System Crash: {str(e)}"
            }
        }

if __name__ == "__main__":
    # Quick Local Tests
    print("Test 1 (Calculation):", run_agent("Calculate 25 * 4"))
    print("Test 2 (Memory):", run_agent("Save 100 as my_score"))
