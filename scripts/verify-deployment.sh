#!/bin/bash

# Deployment Verification Script for Taiga REST API
# This script verifies the Docker deployment is working correctly

set -e

echo "🔍 Taiga REST API Deployment Verification"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "   Please copy .env.example to .env and configure it"
    exit 1
fi
echo "✅ .env file exists"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    exit 1
fi
echo "✅ Docker is running"

# Check if container is running
if ! docker ps | grep -q taiga-rest-api; then
    echo "⚠️  Warning: taiga-rest-api container is not running"
    echo "   Run: docker-compose up -d"
    exit 1
fi
echo "✅ taiga-rest-api container is running"

# Check container health
HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' taiga-rest-api 2>/dev/null || echo "unknown")
echo "   Health status: $HEALTH_STATUS"

# Wait for container to be healthy
MAX_WAIT=60
WAITED=0
while [ "$HEALTH_STATUS" != "healthy" ] && [ $WAITED -lt $MAX_WAIT ]; do
    echo "   Waiting for container to be healthy... ($WAITED/$MAX_WAIT seconds)"
    sleep 5
    WAITED=$((WAITED + 5))
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' taiga-rest-api 2>/dev/null || echo "unknown")
done

if [ "$HEALTH_STATUS" != "healthy" ]; then
    echo "❌ Container is not healthy after ${MAX_WAIT}s"
    echo "   Check logs: docker-compose logs taiga-rest-api"
    exit 1
fi

# Test health endpoint
echo ""
echo "🏥 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health || echo "failed")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "✅ Health endpoint responding correctly"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "❌ Health endpoint not responding"
    echo "   Response: $HEALTH_RESPONSE"
    exit 1
fi

# Test authentication
echo ""
echo "🔐 Testing authentication..."
source .env
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$TAIGA_USERNAME\",\"password\":\"$TAIGA_PASSWORD\"}" || echo "failed")

if echo "$AUTH_RESPONSE" | grep -q "apiKey"; then
    echo "✅ Authentication successful"
    API_KEY=$(echo "$AUTH_RESPONSE" | grep -o '"apiKey":"[^"]*"' | cut -d'"' -f4)
    echo "   API Key obtained: ${API_KEY:0:20}..."

    # Test projects endpoint
    echo ""
    echo "📁 Testing projects endpoint..."
    PROJECTS_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" http://localhost:3000/api/projects || echo "failed")

    if echo "$PROJECTS_RESPONSE" | grep -q "success"; then
        PROJECT_COUNT=$(echo "$PROJECTS_RESPONSE" | grep -o '"id":' | wc -l)
        echo "✅ Projects endpoint working"
        echo "   Found $PROJECT_COUNT project(s)"
    else
        echo "⚠️  Projects endpoint returned unexpected response"
        echo "   Response: ${PROJECTS_RESPONSE:0:200}..."
    fi
else
    echo "❌ Authentication failed"
    echo "   Response: $AUTH_RESPONSE"
    echo "   Please check your TAIGA_USERNAME and TAIGA_PASSWORD in .env"
    exit 1
fi

# Check API documentation
echo ""
echo "📚 Testing API documentation..."
DOCS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api-docs/)
if [ "$DOCS_RESPONSE" = "200" ]; then
    echo "✅ API documentation available at http://localhost:3000/api-docs/"
else
    echo "⚠️  API documentation not accessible (HTTP $DOCS_RESPONSE)"
fi

echo ""
echo "=========================================="
echo "🎉 Deployment verification complete!"
echo ""
echo "📖 Quick Start:"
echo "   1. API Health: http://localhost:3000/health"
echo "   2. API Docs: http://localhost:3000/api-docs/"
echo "   3. Your API Key: $API_KEY"
echo ""
echo "🔗 Use in n8n:"
echo "   - URL: http://taiga-rest-api:3000/api/projects"
echo "   - Header: X-API-Key: $API_KEY"
echo ""
