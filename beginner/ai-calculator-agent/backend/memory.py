import sqlite3
import os

# =================================================================
# DATABASE CONFIGURATION
# =================================================================
# Get the absolute path for the database file relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "calculator_memory.db")

def init_db():
    """
    Initializes the SQLite database and creates the variables table.
    The variables table stores persistent numeric data (M+ functionality).
    Note: 'history' table is created but not used for chat logging per requirements.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Table for manual variable storage (e.g., marks, balance)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS variables (
            name TEXT PRIMARY KEY,
            value REAL
        )
    ''')
    
    # Table for conversation history (Retained for structure, but unused in run_agent)
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

# =================================================================
# VARIABLE PERSISTENCE METHODS (Requirement: Memory)
# =================================================================

def set_variable(name, value):
    """Stores or updates a numeric value in the 'variables' table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('INSERT OR REPLACE INTO variables (name, value) VALUES (?, ?)', (name, value))
    conn.commit()
    conn.close()
    return f"Stored {name} = {value}"

def get_variable(name):
    """Retrieves a numeric value from the 'variables' table by name."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT value FROM variables WHERE name = ?', (name,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def list_variables():
    """Returns a dictionary of all manually stored variables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT name, value FROM variables')
    rows = cursor.fetchall()
    conn.close()
    return {row[0]: row[1] for row in rows}

def clear_memory():
    """Deletes all entries from the 'variables' table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM variables')
    conn.commit()
    conn.close()
    return "All variables cleared from memory"

# =================================================================
# INITIALIZATION
# =================================================================
# Initialize database on module import to ensure tables exist
init_db()
