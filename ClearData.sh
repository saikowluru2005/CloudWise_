#!/bin/bash
cd backend
python -c "import sqlite3; conn = sqlite3.connect('cloud_platform.db'); cursor = conn.cursor(); cursor.execute('DELETE FROM users'); cursor.execute('DELETE FROM history'); conn.commit(); print('\n--- ALL DATA CLEARED ---')"
read -p "Press Enter to continue..."