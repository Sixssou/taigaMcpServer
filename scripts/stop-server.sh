#!/bin/bash

# Stop MCP HTTP Server
# Usage: ./scripts/stop-server.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/.http-server.pid"
LOG_FILE="$PROJECT_ROOT/.http-server.log"

if [ ! -f "$PID_FILE" ]; then
  echo "⚠️  No server PID file found. Server may not be running."

  # Try to find and kill any running httpServer processes
  if pgrep -f "node.*httpServer.js" > /dev/null 2>&1; then
    echo "🔍 Found httpServer processes, killing them..."
    pkill -TERM -f "node.*httpServer.js"
    sleep 1
    # Force kill if still running
    if pgrep -f "node.*httpServer.js" > /dev/null 2>&1; then
      pkill -9 -f "node.*httpServer.js"
    fi
    echo "✅ Server processes killed"
  fi

  exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
  echo "🛑 Stopping server (PID: $PID)..."
  kill -TERM "$PID"

  # Wait for graceful shutdown
  WAIT_TIME=0
  while ps -p "$PID" > /dev/null 2>&1 && [ $WAIT_TIME -lt 5 ]; do
    sleep 1
    WAIT_TIME=$((WAIT_TIME + 1))
  done

  # Force kill if still running
  if ps -p "$PID" > /dev/null 2>&1; then
    echo "⚠️  Graceful shutdown failed, forcing kill..."
    kill -9 "$PID"
  fi

  echo "✅ Server stopped"
else
  echo "⚠️  Server (PID: $PID) is not running"
fi

# Cleanup
rm -f "$PID_FILE"
rm -f "$LOG_FILE"
echo "✅ Cleanup complete"
