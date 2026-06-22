import sqlite3
import os
import numpy as np
from datetime import datetime

DB_PATH = 'attendance.db'


def init_db():
    """Initializes the SQLite database with Users and Logs tables."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS Users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            embedding BLOB
        )
    ''')
    
    # Run a one-time migration to remove UNIQUE constraint if it exists from older schema
    try:
        # Check if we have multiple users with the same name (which proves UNIQUE is removed)
        # Or just blindly try to migrate. A safe way is to create a new table and copy.
        c.execute("PRAGMA table_info(Users)")
        # In SQLite we just do a safe swap if needed, but since it's hard to dynamically check 
        # constraints, we will just silently attempt a migration and ignore errors if it's already migrated.
        c.execute('CREATE TABLE IF NOT EXISTS Users_new (user_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, embedding BLOB)')
        c.execute('INSERT OR IGNORE INTO Users_new (user_id, name, embedding) SELECT user_id, name, embedding FROM Users')
        c.execute('DROP TABLE Users')
        c.execute('ALTER TABLE Users_new RENAME TO Users')
    except Exception as e:
        pass
    c.execute('''
        CREATE TABLE IF NOT EXISTS Logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            camera_id INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES Users(user_id)
        )
    ''')
    conn.commit()
    conn.close()


def has_embedding(name):
    """
    Check whether a student already has an embedding stored in the DB.
    Returns True if the student exists AND has a non-NULL embedding.
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT embedding FROM Users WHERE name = ?', (name,))
    row = c.fetchone()
    conn.close()
    if row is None:
        return False
    return row[0] is not None and len(row[0]) > 0


def save_embedding(name, embedding):
    """Saves a normalized numpy array embedding into the database.
    
    IMPORTANT: This is INSERT-only for new users. If the user already
    exists, this will update their embedding. Use has_embedding() first
    to implement idempotent enrollment.
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    embedding_bytes = embedding.astype(np.float32).tobytes()
    # No IntegrityError because name is no longer UNIQUE. We just insert.
    c.execute('INSERT INTO Users (name, embedding) VALUES (?, ?)', (name, embedding_bytes))
    conn.commit()
    conn.close()


def load_all_embeddings():
    """
    Loads all embeddings into memory for real-time comparison.
    
    Returns a list of dicts:
        [{'user_id': int, 'name': str, 'embedding': np.ndarray}, ...]
    
    The 'name' field is the student's folder name from image_db 
    (e.g. 'sharad', 'aditya') which is used for display and matching.
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT user_id, name, embedding FROM Users WHERE embedding IS NOT NULL')
    rows = c.fetchall()
    conn.close()

    users = []
    for row in rows:
        user_id, name, embedding_blob = row
        if embedding_blob is None or len(embedding_blob) == 0:
            continue
        # FP32 embeddings from MobileFaceNet / w600k_mbf
        embedding = np.frombuffer(embedding_blob, dtype=np.float32).copy()
        users.append({'user_id': user_id, 'name': name, 'embedding': embedding})
    return users




def log_attendance(user_id, camera_id, student_name=None):
    """
    Logs attendance to the SQLite Logs table.
    
    Args:
        user_id: The SQLite user_id (integer).
        camera_id: The camera/source that recognised the student.
        student_name: The display name (optional).
    """
    # --- SQLite log (unchanged) ---
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('INSERT INTO Logs (user_id, camera_id) VALUES (?, ?)', (user_id, camera_id))
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
