#!/bin/bash

# Clears the SQLite database file.

DB_FILE="/home/ubuntu/rag_app/backend/data/database/rag_app.db"

if [ -f "$DB_FILE" ]; then
    echo "Deleting existing database file: $DB_FILE"
    rm -f "$DB_FILE"
    if [ $? -eq 0 ]; then
        echo "Database file deleted successfully."
    else
        echo "Error: Failed to delete database file." >&2
        exit 1
    fi
else
    echo "Database file not found, nothing to delete."
fi

exit 0

