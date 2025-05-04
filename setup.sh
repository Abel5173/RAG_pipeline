#!/bin/bash

# setup.sh - Installs dependencies and guides for model setup

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
BACKEND_DIR="$SCRIPT_DIR/../backend"

echo "Setting up Python virtual environment and installing dependencies..."
cd "$BACKEND_DIR"

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    python3.11 -m venv venv
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create virtual environment." >&2
        exit 1
    fi
fi

# Activate venv and install requirements
source venv/bin/activate
pip3 install --upgrade pip
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error: Failed to install Python dependencies from requirements.txt." >&2
    deactivate
    exit 1
fi
deactivate

echo "Python environment setup complete."

echo "-----------------------------------------------------"
echo "Manual Setup Required: Ollama and Mistral Model"
echo "-----------------------------------------------------"
echo "This application requires Ollama to be installed and running with the 'mistral' model."
echo "1. Install Ollama: Follow instructions at https://ollama.com"
echo "2. Pull the Mistral model: Run 'ollama pull mistral' in your terminal."
echo "3. Ensure Ollama is running before starting the application backend."
echo "-----------------------------------------------------"

echo "Setup script finished."

