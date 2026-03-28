#!/bin/bash

echo "Stopping backend (port 8000)..."
fuser -k 8000/tcp 2>/dev/null

echo "Stopping frontend (port 3000)..."
fuser -k 3000/tcp 2>/dev/null

echo "Stopping frontend (port 5173 if Vite)..."
fuser -k 5173/tcp 2>/dev/null

echo "All services stopped "