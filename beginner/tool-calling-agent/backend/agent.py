import os
import json
import re
from dotenv import load_dotenv
from agents import Agent, Runner, function_tool, OpenAIChatCompletionsModel, AsyncOpenAI

# =========================
# ENV SETUP
# =========================
load_dotenv()

# =========================
# CLIENT SETUP
# =========================
client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

model = OpenAIChatCompletionsModel(
    model="qwen/qwen-2.5-7b-instruct",
    openai_client=client
)

# =========================
# TOOL (FUNCTION CALLING)
# =========================
@function_tool
def calculator(operation: str, a: float, b: float):
    """Performs basic math operations."""
    print(f"DEBUG: Tool called with {operation}, {a}, {b}")
    
    result = None
    if operation == "add": result = a + b
    elif operation == "subtract": result = a - b
    elif operation == "multiply": result = a * b
    elif operation == "divide":
        if b == 0: return {"status": "error", "message": "Division by zero"}
        result = a / b
    
    # Return exactly what the UI needs
    return {
        "status": "success",
        "result": result,
        "operation": operation,
        "a": a,
        "b": b
    }

# =========================
# AGENT (STRICT JSON)
# =========================
agent = Agent(
    name="NexeAgent",
    model=model,
    tools=[calculator],
    instructions="""
You are a STERN Tool-Calling AI Agent.

REQUIRED BEHAVIOR:
1. If math is asked, ALWAYS call 'calculator' tool.
2. After the tool returns a result, you MUST output a final JSON object summarizing it.
3. Your JSON MUST include the keys: "status", "operation", "a", "b", and "result".
4. If the user just says "hello" or "hi", respond with JSON: {"status": "success", "operation": "conversation", "result": "Hello! I am your AI Math Assistant. How can I help you today?"}
5. NEVER add conversational text outside the JSON.

JSON SCHEMA:
{
  "status": "success",
  "operation": "add|subtract|multiply|divide|conversation",
  "a": number or null,
  "b": number or null,
  "result": any
}
"""
)

# =========================
# SURGICAL JSON PARSER
# =========================
def parse_to_json(raw_output):
    if isinstance(raw_output, dict):
        return raw_output
    
    try:
        # Try to find JSON block using regex if model adds text
        json_match = re.search(r'(\{.*\})', raw_output.strip().replace('\n', ' '), re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        
        # Fallback if no JSON structure found
        return json.loads(raw_output)
    except:
        # If all parsing fails, wrap the text into the expected JSON format
        return {
            "status": "success",
            "operation": "conversation",
            "a": None,
            "b": None,
            "result": str(raw_output)
        }

# =========================
# RUN AGENT
# =========================
def run_agent(message: str):
    try:
        # 1. Function Calling
        result = Runner.run_sync(agent, message)
        
        # 2. JSON Response
        final_data = parse_to_json(result.final_output)
        
        # 3. Ensure keys exist for Frontend
        final_data.setdefault("status", "success")
        final_data.setdefault("operation", "unknown")
        final_data.setdefault("a", None)
        final_data.setdefault("b", None)
        final_data.setdefault("result", final_data.get("result", "No result"))

        return {"response": final_data}

    except Exception as e:
        # 4. Error Handling
        return {
            "response": {
                "status": "error",
                "message": f"Agent Error: {str(e)}",
                "result": None
            }
        }

if __name__ == "__main__":
    # Test case
    print(run_agent("Add 20 and 50"))
