#!/bin/bash

echo "Current directory:"
pwd

cd backend || exit
pwd

echo "Activating virtual environment..."
source venv/Scripts/activate

echo "Killing process on port 8000..."

PID=$(netstat -ano | grep :8000 | awk '{print $5}' | head -n 1)

if [ -n "$PID" ]; then
    echo "Killing PID $PID"
    taskkill //F //PID $PID
else
    echo "No process found on port 8000"
fi

echo "Starting backend..."
python -m uvicorn main:app --port 8000