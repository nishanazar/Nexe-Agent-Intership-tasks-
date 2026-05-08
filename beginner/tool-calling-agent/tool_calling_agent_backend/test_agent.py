import pytest
import json
from agent import get_weather, parse_to_json, run_agent

# ==========================================
# TEST: Weather Tool Logic
# ==========================================
def test_get_weather_valid_city():
    """Test if weather tool returns correct mock data for known cities."""
    result = get_weather("Karachi")
    assert result["status"] == "success"
    assert "Karachi" in result["result"]
    assert "32°C" in result["result"]

def test_get_weather_unknown_city():
    """Test if weather tool handles unknown cities with a default response."""
    result = get_weather("UnknownCity")
    assert result["status"] == "success"
    assert "UnknownCity" in result["result"]
    assert "22°C" in result["result"]

# ==========================================
# TEST: JSON Parser Logic
# ==========================================
def test_parse_to_json_valid():
    """Test if parser correctly handles clean JSON strings."""
    raw = '{"status": "success", "result": "test"}'
    parsed = parse_to_json(raw)
    assert parsed["status"] == "success"

def test_parse_to_json_with_text():
    """Test if parser extracts JSON even if LLM adds extra text."""
    raw = 'Here is the result: {"status": "success", "result": "test"} hope this helps!'
    parsed = parse_to_json(raw)
    assert parsed["status"] == "success"
    assert parsed["result"] == "test"

def test_parse_to_json_invalid_fallback():
    """Test if parser falls back to a conversation object if JSON is totally broken."""
    raw = "This is not JSON at all."
    parsed = parse_to_json(raw)
    assert parsed["operation"] == "conversation"
    assert parsed["result"] == "This is not JSON at all."

# ==========================================
# TEST: API Response Structure
# ==========================================
def test_run_agent_error_handling():
    """Test if run_agent handles missing API keys or errors gracefully."""
    # This will likely trigger the catch block if API key isn't set in test environment
    response = run_agent("Hi")
    assert "response" in response
    assert "status" in response["response"]
