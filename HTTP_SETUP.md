# HTTP/SSE Mode Setup Guide

This guide explains how to use Taiga MCP Server in HTTP mode for internal network access, particularly for integration with n8n workflows.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│         VPS (Docker Network)            │
│                                         │
│  ┌──────────────┐    ┌──────────────┐ │
│  │     n8n      │───►│ taigaMcp     │ │
│  │  Container   │HTTP│   Server     │ │
│  │              │    │  Port 3000   │ │
│  └──────────────┘    └──────────────┘ │
│                                         │
│       Network: taiga-network            │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Environment Configuration

Create or update your `.env` file:

```env
# Taiga API Configuration
TAIGA_API_URL=https://api.taiga.io/api/v1
TAIGA_USERNAME=your_username
TAIGA_PASSWORD=your_password

# HTTP Server Configuration (optional)
MCP_HTTP_PORT=3000
MCP_HTTP_HOST=0.0.0.0
```

### 2. Start HTTP Server

#### Option A: Docker Compose (Recommended)

```bash
# Start only the HTTP server
docker-compose up taiga-mcp-http

# Or run in detached mode
docker-compose up -d taiga-mcp-http
```

#### Option B: NPM Script

```bash
npm run start:http
```

#### Option C: Docker Run

```bash
docker run --rm -d \
  --name taiga-mcp-http \
  -p 3000:3000 \
  -e TAIGA_API_URL="https://api.taiga.io/api/v1" \
  -e TAIGA_USERNAME="your_username" \
  -e TAIGA_PASSWORD="your_password" \
  --network taiga-network \
  taiga-mcp-server:latest \
  node src/httpServer.js
```

### 3. Verify Server is Running

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "server": "taiga-mcp-server",
  "version": "1.9.14",
  "transport": "sse",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔌 Integration with n8n

### Method 1: Shared Docker Network

Update your n8n `docker-compose.yml` to use the same network:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - taiga-network

networks:
  taiga-network:
    external: true

volumes:
  n8n_data:
```

Then from n8n, use: `http://taiga-mcp-http:3000`

### Method 2: Combined Docker Compose

Create a single `docker-compose.yml` that includes both services:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - taiga-network

  taiga-mcp-http:
    build:
      context: ./taigaMcpServer
      dockerfile: Dockerfile
    container_name: taiga-mcp-http
    restart: unless-stopped
    command: ["node", "src/httpServer.js"]
    environment:
      - TAIGA_API_URL=https://api.taiga.io/api/v1
      - TAIGA_USERNAME=${TAIGA_USERNAME}
      - TAIGA_PASSWORD=${TAIGA_PASSWORD}
      - MCP_HTTP_PORT=3000
    networks:
      - taiga-network

networks:
  taiga-network:
    driver: bridge

volumes:
  n8n_data:
```

Start both services:

```bash
docker-compose up -d
```

## 📡 Available HTTP Endpoints

### 1. Health Check
```http
GET /health
```

Returns server status and configuration.

**Response:**
```json
{
  "status": "healthy",
  "server": "taiga-mcp-server",
  "version": "1.9.14",
  "transport": "sse",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. SSE Connection (MCP Client)
```http
GET /sse
```

Establishes an SSE connection for MCP communication. This is used by MCP clients to communicate with the server.

**Headers:**
- `Accept: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`

### 3. Message Endpoint (MCP Client)
```http
POST /message
Content-Type: application/json
```

Receives messages from MCP clients. Used internally by the SSE transport.

**Body:** MCP protocol message (JSON)

## 🔧 Using with n8n Workflows

### HTTP Request Node Configuration

1. **Add HTTP Request Node** to your workflow
2. **Configure the node:**
   - **Method:** `GET` or `POST` depending on the endpoint
   - **URL:** `http://taiga-mcp-http:3000/sse` (for SSE)
   - **Authentication:** None (internal network)
   - **Headers:**
     - `Accept: text/event-stream`
     - `Content-Type: application/json`

### Example n8n Workflow

```json
{
  "nodes": [
    {
      "name": "Check Taiga Health",
      "type": "n8n-nodes-base.httpRequest",
      "position": [250, 300],
      "parameters": {
        "url": "http://taiga-mcp-http:3000/health",
        "method": "GET",
        "options": {}
      }
    }
  ]
}
```

## 🐛 Troubleshooting

### Server Not Responding

1. **Check if container is running:**
   ```bash
   docker ps | grep taiga-mcp-http
   ```

2. **Check logs:**
   ```bash
   docker logs taiga-mcp-http
   ```

3. **Verify network connectivity:**
   ```bash
   docker network inspect taiga-network
   ```

### n8n Cannot Connect

1. **Verify both containers are on the same network:**
   ```bash
   docker inspect n8n | grep NetworkMode
   docker inspect taiga-mcp-http | grep NetworkMode
   ```

2. **Test connectivity from n8n container:**
   ```bash
   docker exec -it n8n curl http://taiga-mcp-http:3000/health
   ```

3. **Check firewall rules:**
   ```bash
   # On the host
   sudo iptables -L -n | grep 3000
   ```

### Authentication Errors

1. **Verify environment variables:**
   ```bash
   docker exec taiga-mcp-http env | grep TAIGA
   ```

2. **Test Taiga credentials manually:**
   ```bash
   curl -X POST https://api.taiga.io/api/v1/auth \
     -H "Content-Type: application/json" \
     -d '{"username":"your_username","password":"your_password","type":"normal"}'
   ```

## 🔒 Security Considerations

### Internal Network Only

- The HTTP server is designed for **internal network access only**
- No authentication is implemented on the MCP server itself
- Use Docker network isolation to restrict access
- **DO NOT expose port 3000 to the public internet**

### Production Recommendations

1. **Use Docker network isolation** (default configuration)
2. **Do not publish port 3000** externally (remove `ports` section if not needed on host)
3. **Use environment variables** for credentials (never hardcode)
4. **Enable resource limits** (already configured in docker-compose.yml)
5. **Monitor logs** for suspicious activity

## 📊 Performance Tips

### Resource Limits

The default configuration includes:
- **Memory Limit:** 256MB
- **CPU Limit:** 0.5 cores
- **Memory Reservation:** 128MB
- **CPU Reservation:** 0.25 cores

Adjust in `docker-compose.yml` if needed:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '1.0'
```

### Logging Configuration

Logs are limited to prevent disk space issues:
- **Max file size:** 10MB
- **Max files:** 3 (total 30MB)

Adjust in `docker-compose.yml`:

```yaml
logging:
  driver: json-file
  options:
    max-size: "50m"
    max-file: "5"
```

## 🆚 Transport Modes Comparison

| Feature | stdio Mode | HTTP/SSE Mode |
|---------|-----------|---------------|
| **Use Case** | CLI, desktop apps | Web apps, n8n, APIs |
| **Communication** | stdin/stdout | HTTP REST + SSE |
| **Network Access** | Local only | Network accessible |
| **Authentication** | Not needed | Use network isolation |
| **Performance** | Fast | Slightly slower (HTTP overhead) |
| **Deployment** | Simple | Requires port exposure |

## 🔄 Switching Between Modes

### From stdio to HTTP:

```bash
# Stop stdio mode
docker-compose stop taiga-mcp-server

# Start HTTP mode
docker-compose up -d taiga-mcp-http
```

### From HTTP to stdio:

```bash
# Stop HTTP mode
docker-compose stop taiga-mcp-http

# Start stdio mode
docker-compose up -d taiga-mcp-server
```

### Run Both Simultaneously:

```bash
docker-compose up -d taiga-mcp-server taiga-mcp-http
```

## 📚 Additional Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [n8n Documentation](https://docs.n8n.io/)
- [Taiga API Documentation](https://docs.taiga.io/api.html)
- [Docker Networking Guide](https://docs.docker.com/network/)

## 🆘 Support

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review container logs: `docker logs taiga-mcp-http`
3. Verify network configuration: `docker network inspect taiga-network`
4. Open an issue on GitHub with logs and configuration details
