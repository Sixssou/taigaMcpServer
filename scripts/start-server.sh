#!/bin/bash

# Start MCP HTTP Server in background
# Usage: ./scripts/start-server.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/.http-server.pid"
LOG_FILE="$PROJECT_ROOT/.http-server.log"

# Check if server is already running
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if ps -p "$PID" > /dev/null 2>&1; then
    echo "⚠️  Server already running (PID: $PID)"
    echo "   Use ./scripts/stop-server.sh to stop it first"
    exit 1
  else
    # Stale PID file, remove it
    rm -f "$PID_FILE"
  fi
fi

# Start server in background
echo "🚀 Starting MCP HTTP Server..."
cd "$PROJECT_ROOT"

# Start server and capture PID
nohup node src/httpServer.js > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# Save PID
echo "$SERVER_PID" > "$PID_FILE"

# Wait a bit to ensure server starts
sleep 2

# Check if server is actually running
if ps -p "$SERVER_PID" > /dev/null 2>&1; then
  echo "✅ Server started successfully (PID: $SERVER_PID)"
  echo "   Log file: $LOG_FILE"
  echo "   Health check: http://localhost:3000/health"

  # Try health check
  if command -v curl &> /dev/null; then
    sleep 1
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
      echo "✅ Health check passed"
    else
      echo "⚠️  Server started but health check failed (may still be initializing)"
    fi
  fi
else
  echo "❌ Server failed to start. Check logs:"
  cat "$LOG_FILE"
  rm -f "$PID_FILE"
  exit 1
fi
