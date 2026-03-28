#!/bin/bash
pwd
cd frontend
pwd
npm install
cd ..
cd backend
pwd
echo "Installing backend requirments..."
python -m pip install openpyxl
pip install -r requirements.txt
