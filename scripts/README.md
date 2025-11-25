# 🔧 Utility Scripts

This directory contains bash scripts for development automation and testing.

## Available Scripts

### `start-server.sh`
Starts the MCP HTTP server in background mode.

**Usage:**
```bash
./scripts/start-server.sh
```

**What it does:**
- Starts `src/httpServer.js` in background
- Creates `.http-server.pid` file with process ID
- Logs output to `.http-server.log`
- Performs health check on startup
- Prevents multiple server instances

**Output:**
```
🚀 Starting MCP HTTP Server...
✅ Server started successfully (PID: 12345)
   Log file: .http-server.log
   Health check: http://localhost:3000/health
✅ Health check passed
```

### `stop-server.sh`
Stops the background HTTP server gracefully.

**Usage:**
```bash
./scripts/stop-server.sh
```

**What it does:**
- Reads PID from `.http-server.pid`
- Sends SIGTERM for graceful shutdown
- Waits up to 5 seconds
- Forces kill (SIGKILL) if still running
- Cleans up PID and log files

**Output:**
```
🛑 Stopping server (PID: 12345)...
✅ Server stopped
✅ Cleanup complete
```

### `run-all-tests.sh`
Runs the complete test suite with formatted output.

**Usage:**
```bash
./scripts/run-all-tests.sh
```

**What it does:**
- Stops any running servers (cleanup)
- Runs unit tests (`npm run test:unit`)
- Runs quick tests (`npm run test:quick`)
- Runs HTTP server tests (`npm run test:http`)
- Displays formatted summary

**Output:**
```
╔════════════════════════════════════════════════════════════╗
║         Taiga MCP Server - Complete Test Suite            ║
╚════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Running Unit Tests...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Unit tests passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Running Quick Tests...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Quick tests passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Running HTTP Server Tests...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ HTTP tests passed

╔════════════════════════════════════════════════════════════╗
║                    Test Summary                            ║
╠════════════════════════════════════════════════════════════╣
║  ✅ Passed: 3                                              ║
║  ❌ Failed: 0                                              ║
╚════════════════════════════════════════════════════════════╝

🎉 All tests passed successfully!
```

## Integration with npm

These scripts are integrated with npm scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "dev:http": "nodemon src/httpServer.js",
    "test:watch": "nodemon --exec 'npm test' --watch src --watch test",
    "test:dev": "nodemon --exec 'npm run test:unit && npm run test:quick && npm run test:http' --watch src --watch test"
  }
}
```

## For Claude Code Development

See `CLAUDE.md` section "🤖 Workflow de développement avec Claude" for detailed usage in automated development workflows.

**Quick reference:**
- Start server: `./scripts/start-server.sh`
- Run all tests: `./scripts/run-all-tests.sh`
- Stop server: `./scripts/stop-server.sh`

## Requirements

- **bash** (version 4.0+)
- **node** (installed and in PATH)
- **npm** (for npm commands)
- **curl** (optional, for health checks)
- **lsof** or **pgrep/pkill** (for process management)

## Exit Codes

All scripts follow standard exit code conventions:
- `0` - Success
- `1` - Error or failure

## Files Created

- `.http-server.pid` - Process ID of running server
- `.http-server.log` - Server output logs

**Note:** These files are automatically cleaned up by `stop-server.sh` and are excluded from git via `.gitignore`.
