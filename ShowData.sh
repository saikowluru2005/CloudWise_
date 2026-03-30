#!/bin/bash
cd backend
python -c "import sqlite3; conn = sqlite3.connect('cloud_platform.db'); cursor = conn.cursor(); cursor.execute('SELECT * FROM users'); rows = cursor.fetchall(); print('\n--- USERS ---'); [print(row) for row in rows]"
read -p "Press Enter to continue..."