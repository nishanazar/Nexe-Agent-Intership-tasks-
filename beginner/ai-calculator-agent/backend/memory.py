import sqlite3
import os

# Database file path (Absolute path relative to this script)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "calculator_memory.db")

def init_db():
    """Initializes the SQLite database and creates necessary tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Table for persistent variables (M+, M-, Variable Storage)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS variables (
            name TEXT PRIMARY KEY,
            value REAL
        )
    ''')
    
    # Table for conversation history to maintain context
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT,
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def set_variable(name, value):
    """Stores or updates a numeric value in the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('INSERT OR REPLACE INTO variables (name, value) VALUES (?, ?)', (name, value))
    conn.commit()
    conn.close()
    return f"Stored {name} = {value}"

def get_variable(name):
    """Retrieves a numeric value from the database by name."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT value FROM variables WHERE name = ?', (name,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def list_variables():
    """Returns a dictionary of all stored variables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT name, value FROM variables')
    rows = cursor.fetchall()
    conn.close()
    return {row[0]: row[1] for row in rows}

def clear_memory():
    """Deletes all stored variables from the variables table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM variables')
    conn.commit()
    conn.close()
    return "All variables cleared from memory"

def add_history(role, content):
    """Adds a new message (user or AI) to the history table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('INSERT INTO history (role, content) VALUES (?, ?)', (role, content))
    conn.commit()
    conn.close()

def get_history(limit=10):
    """Retrieves the most recent messages from history."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT role, content FROM history ORDER BY timestamp DESC LIMIT ?', (limit,))
    rows = cursor.fetchall()
    conn.close()
    # Reverse to return in chronological order (oldest first)
    return rows[::-1]

# Initialize database on module import
if __name__ == "__main__":
    init_db()
else:
    init_db()
