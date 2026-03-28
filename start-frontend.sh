#!/bin/bash
pwd
echo "Starting frontend..."
cd frontend
pwd
echo "Checking Node.js and npm versions..."
node -v
npm -v
echo "Installing frontend dependencies..."
npm install
echo "Starting frontend development server..."
npm run dev