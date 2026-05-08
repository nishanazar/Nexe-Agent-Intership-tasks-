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
# CLIENT SETUP (xAI Grok)
# =========================
client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

model = OpenAIChatCompletionsModel(
    model="openrouter/free",
    openai_client=client
)


# =========================
# TOOLS (FUNCTION CALLING)
# =========================
def get_weather(city: str):
    """Gets the current weather for a specified city. Use this ONLY when the user asks about weather in a city."""
    print(f"DEBUG: Weather tool called for {city}")
    
    # Mock weather data for demonstration
    mock_weather = {
        "Karachi": "32°C, Sunny",
        "Lahore": "28°C, Partly Cloudy",
        "Islamabad": "25°C, Rainy",
        "London": "15°C, Foggy",
        "New York": "20°C, Clear",
        "Dubai": "40°C, Hot",
        "Tokyo": "18°C, Overcast"
    }
    
    weather_info = mock_weather.get(city.title(), "22°C, Unknown Condition")
    
    return {
        "status": "success",
        "operation": "weather",
        "city": city,
        "result": f"The weather in {city} is {weather_info}."
    }

get_weather_tool = function_tool(get_weather)

# =========================
# AGENT (STRICT JSON)
# =========================
agent = Agent(
    name="NexeAgent",
    model=model,
    tools=[get_weather_tool],
    instructions="""
You are a STERN Tool-Calling AI Agent specialized in Weather.

REQUIRED BEHAVIOR:
1. If the user asks about the WEATHER in a city, you MUST call the 'get_weather' tool. DO NOT answer from your own knowledge.
2. For ANY other query (e.g., greetings, general questions), respond directly without using tools.
3. Your response MUST ALWAYS be a valid JSON object. NEVER include any text outside the JSON.
4. For non-tool responses, use the "conversation" operation.

JSON SCHEMA:
{
  "status": "success" | "error",
  "operation": "weather" | "conversation",
  "city": string or null,
  "result": "Your response string or the tool's result"
}

EXAMPLE RESPONSES:
- User: "hi" -> {"status": "success", "operation": "conversation", "city": null, "result": "Hello! I can help you with weather updates for any city. Which city are you interested in?"}
- User: "How is the weather in Karachi?" -> (Uses get_weather) -> {"status": "success", "operation": "weather", "city": "Karachi", "result": "The weather in Karachi is 32°C, Sunny."}
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
            "city": None,
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
        final_data.setdefault("city", None)
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
    print(run_agent("How is the weather in Karachi?"))
