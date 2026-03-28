#!/bin/bash
pwd
./Package-Install.sh
./start-backend.sh &
./start-frontend.sh