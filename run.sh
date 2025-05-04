#!/bin/bash

# run.sh - Starts the backend and frontend servers

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
BACKEND_DIR="$SCRIPT_DIR/../backend"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

# Check if Ollama is running (simple check, might not be foolproof)
if ! curl http://localhost:11434 > /dev/null 2>&1; then
    echo "Warning: Ollama does not appear to be running on http://localhost:11434." >&2
    echo "The Q&A functionality requiring the LLM will likely fail." >&2
fi

# Start Backend (FastAPI with uvicorn)
echo "Starting backend server..."
cd "$BACKEND_DIR"
source venv/bin/activate
# Run on 0.0.0.0 to be accessible externally if needed via expose_port
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend server started with PID $BACKEND_PID on port 8000."
deactivate

# Start Frontend (Simple HTTP Server for static files)
echo "Starting frontend server..."
cd "$FRONTEND_DIR"
# Use Python's simple HTTP server
python3.11 -m http.server 8080 &
FRONTEND_PID=$!
echo "Frontend server started with PID $FRONTEND_PID on port 8080."

echo "-----------------------------------------------------"
echo "Access the application frontend at: http://localhost:8080"
echo "Backend API running at: http://localhost:8000"
echo "-----------------------------------------------------"
echo "Press Ctrl+C to stop both servers."

# Wait for user interruption (Ctrl+C) and clean up
trap "echo \"Stopping servers...\"; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

# Keep script running to keep servers alive
wait $BACKEND_PID
wait $FRONTEND_PID

