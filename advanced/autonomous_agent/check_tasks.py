import sqlite3

def list_subtasks():
    conn = sqlite3.connect('backend/agent.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM subtasks")
    rows = cursor.fetchall()
    for row in rows:
        print(row)
    conn.close()

if __name__ == "__main__":
    list_subtasks()
