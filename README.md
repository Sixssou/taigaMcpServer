# Forked for additional functionalities and tools for non-batch User-Story management.

# 🚀 Taiga MCP Server

A powerful **Model Context Protocol (MCP)** server that enables natural language interaction with **Taiga project management** systems. Seamlessly manage your projects, sprints, user stories, tasks, and issues through conversational AI.

> 🤖 **AI-Powered Development**: This project was developed collaboratively with **Claude Code** (claude.ai/code), showcasing the potential of AI-assisted software development.

[![npm version](https://badge.fury.io/js/taiga-mcp-server.svg)](https://badge.fury.io/js/taiga-mcp-server)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![GitHub](https://img.shields.io/badge/GitHub-taigaMcpServer-blue?logo=github)](https://github.com/greddy7574/taigaMcpServer)

## ✨ Features

### 📊 Complete Project Management
- **Projects**: List and view project details
- **Sprints**: Create, list, and track sprint progress with detailed statistics
- **User Stories**: Create and manage user stories within projects
- **Tasks**: Create tasks linked to user stories
- **Issues**: Full issue lifecycle management with sprint associations

### 🔗 Advanced Sprint-Issue Tracking
- View issues by sprint with complete relationship mapping
- Get detailed issue information including sprint assignments
- Track sprint progress with completion statistics
- Real-time status updates and progress monitoring

### 🚀 Batch Operations
- **Batch Create Issues**: Create multiple issues in one operation (up to 20)
- **Batch Create User Stories**: Bulk create user stories with story points
- **Batch Create Tasks**: Mass create tasks for specific user stories
- **Smart Error Handling**: Individual failures don't affect other items
- **Detailed Reporting**: Success/failure status for each item

### 🔍 Advanced Query Syntax
- **SQL-like Query Language**: Use `field:operator:value` syntax for precise searches
- **Logical Operators**: Combine conditions with AND, OR, NOT
- **Text Matching**: Fuzzy search, wildcards, and substring matching
- **Date Ranges**: Flexible time-based queries (today, last_week, >7d)
- **Sorting & Limiting**: ORDER BY and LIMIT clauses for result control

### 💬 Team Collaboration System
- **Comment Management**: Add, view, edit, and delete comments on any work item
- **Discussion Threads**: Complete comment history with user information
- **Team Communication**: Enhanced collaboration through structured discussions
- **Real-time Updates**: Immediate comment synchronization across team

### 📎 File Attachment Management
- **Flexible File Upload**: Support both file path and Base64 upload methods
- **Claude Client Integration**: Optimized for Claude Desktop file handling
- **Multi-format Support**: Images, documents, PDFs, and all major file types
- **Smart Path Resolution**: Automatic file path detection from common locations
- **Download Management**: Efficient file download with path management
- **Storage Organization**: Clean attachment management with descriptions

### 🏛️ Epic Management (Enterprise)
- **Large-scale Organization**: Create and manage Epic-level project components
- **Hierarchical Structure**: Link User Stories to Epics for complete project visibility
- **Progress Tracking**: Epic-level progress statistics and completion tracking
- **Enterprise Planning**: Support for roadmap planning and feature releases

### 📖 Wiki Management (Knowledge Base)
- **Documentation Hub**: Create and manage project Wiki pages for knowledge sharing
- **Markdown Support**: Full Markdown editing with rich content formatting
- **Flexible Identification**: Access pages by ID or user-friendly slug names
- **Collaboration Features**: Watch/unwatch pages for change notifications
- **Version Control**: Automatic versioning prevents edit conflicts
- **Content Organization**: Centralized documentation management per project

### 💬 Natural Language Interface
- **"List all projects"**
- **"Show me Sprint 5 progress statistics"**
- **"Create a high-priority bug issue in project X"**
- **"Which issues are assigned to Sprint 3?"**
- **"Get details for issue #123"**

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org)
- **Taiga account** with API access

### Option 1: NPX (Recommended for CLI/Desktop)
No installation required - runs latest version automatically:

```bash
# NPM Registry (official)
npx taiga-mcp-server

# GitHub Package Registry (alternative)
npx @greddy7574/taiga-mcp-server
```

### Option 2: Global Installation
```bash
# From NPM Registry
npm install -g taiga-mcp-server
taiga-mcp

# From GitHub Packages
npm install -g @greddy7574/taiga-mcp-server
```

### Option 3: Docker Deployment (Recommended for n8n/HTTP)
```bash
# Build the image
docker build -t taiga-mcp-server .

# Run with environment file
docker run --rm -i --env-file .env taiga-mcp-server

# Or with environment variables
docker run --rm -i \
  -e TAIGA_API_URL=https://api.taiga.io/api/v1 \
  -e TAIGA_USERNAME=your_username \
  -e TAIGA_PASSWORD=your_password \
  taiga-mcp-server

# Using docker-compose (see section below)
docker-compose up --build
```

## ⚙️ Configuration

### For Claude Desktop (stdio mode)

#### NPX Method (Recommended)
Add to your Claude Desktop `config.json`:

```json
{
  "mcpServers": {
    "taiga-mcp": {
      "command": "npx",
      "args": ["taiga-mcp-server"],
      "env": {
        "TAIGA_API_URL": "https://api.taiga.io/api/v1",
        "TAIGA_USERNAME": "your_username",
        "TAIGA_PASSWORD": "your_password"
      }
    }
  }
}
```

#### Docker Method
```json
{
  "mcpServers": {
    "taiga-mcp": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "TAIGA_API_URL=https://api.taiga.io/api/v1",
        "-e", "TAIGA_USERNAME=your_username",
        "-e", "TAIGA_PASSWORD=your_password",
        "taiga-mcp-server:latest"
      ]
    }
  }
}
```

### For n8n/HTTP Integration (HTTP mode)

#### Architecture
```
┌─────────────────────────────────────────┐
│         VPS (Docker Network)            │
│                                         │
│  ┌──────────────┐    ┌──────────────┐ │
│  │     n8n      │───►│ taigaMcp     │ │
│  │  Container   │HTTP│   Server     │ │
│  │              │    │  Port 3000   │ │
│  └──────────────┘    └──────────────┘ │
└─────────────────────────────────────────┘
```

#### Step 1: Environment Configuration

Create a `.env` file in your project root:

```env
# Taiga API Configuration
TAIGA_API_URL=https://api.taiga.io/api/v1
TAIGA_USERNAME=your_username
TAIGA_PASSWORD=your_password

# HTTP Server Configuration
MCP_HTTP_PORT=3000
MCP_HTTP_HOST=0.0.0.0

# Optional: For Traefik HTTPS exposure
TAIGA_MCP_SUBDOMAIN=taiga-mcp
DOMAIN_NAME=yourdomain.com
```

#### Step 2: Add to Docker Compose

Add this service to your `docker-compose.yml`:

```yaml
services:
  # Taiga MCP Server - HTTP mode for n8n integration
  taiga-mcp-http:
    build:
      context: ./taigaMcpServer
      dockerfile: Dockerfile
      target: production
    image: taiga-mcp-server:latest
    container_name: taiga-mcp-http
    restart: unless-stopped
    command: ["node", "src/httpServer.js"]

    environment:
      - NODE_ENV=production
      - TAIGA_API_URL=${TAIGA_API_URL:-https://api.taiga.io/api/v1}
      - TAIGA_USERNAME=${TAIGA_USERNAME}
      - TAIGA_PASSWORD=${TAIGA_PASSWORD}
      - MCP_HTTP_PORT=3000
      - MCP_HTTP_HOST=0.0.0.0

    env_file:
      - .env

    # Internal access only (remove if you need external access)
    expose:
      - "3000"

    # Or publish port for testing (comment out 'expose' above)
    # ports:
    #   - "3000:3000"

    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.5'
```

#### Step 3: Optional - Traefik HTTPS Exposure

To expose the MCP server via HTTPS with Traefik, add these labels:

```yaml
  taiga-mcp-http:
    # ... previous configuration ...

    labels:
      - traefik.enable=true
      - traefik.http.routers.taiga-mcp.rule=Host(`${TAIGA_MCP_SUBDOMAIN}.${DOMAIN_NAME}`)
      - traefik.http.routers.taiga-mcp.tls=true
      - traefik.http.routers.taiga-mcp.entrypoints=web,websecure
      - traefik.http.routers.taiga-mcp.tls.certresolver=mytlschallenge
      - traefik.http.services.taiga-mcp.loadbalancer.server.port=3000
```

Your server will then be accessible at `https://taiga-mcp.yourdomain.com`

#### Step 4: Deploy

```bash
# Build and start the server
docker-compose build taiga-mcp-http
docker-compose up -d taiga-mcp-http

# Check logs
docker-compose logs -f taiga-mcp-http

# Test health endpoint
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "server": "Taiga MCP",
  "version": "1.9.14",
  "transport": "http",
  "timestamp": "2024-11-21T10:00:00.000Z"
}
```

#### Step 5: Configure n8n

In your n8n workflow, add an **MCP TAIGA API** node with these settings:

| Parameter | Value |
|-----------|-------|
| **Endpoint** | `http://taiga-mcp-http:3000/mcp` |
| **Server Transport** | `HTTP Streamable` |
| **Authentication** | None (internal network) |
| **Timeout** | `60000` |

**URLs by access type:**
- **Internal (from n8n)**: `http://taiga-mcp-http:3000/mcp`
- **External (with Traefik)**: `https://taiga-mcp.yourdomain.com/mcp`
- **Host (localhost)**: `http://localhost:3000/mcp`

#### Troubleshooting

**Container unhealthy or not responding:**
```bash
# Check container status
docker ps | grep taiga-mcp-http

# Check logs for errors
docker logs taiga-mcp-http

# Verify network
docker inspect taiga-mcp-http | grep NetworkMode

# Test from n8n container
docker exec -it n8n wget -qO- http://taiga-mcp-http:3000/health
```

**n8n cannot connect:**
1. Ensure both containers are on the same Docker network
2. Check firewall rules
3. Verify environment variables are loaded
4. Test health endpoint accessibility

### Custom Taiga Instance
For self-hosted Taiga instances:

```json
{
  "env": {
    "TAIGA_API_URL": "https://your-taiga-domain.com/api/v1",
    "TAIGA_USERNAME": "your_username",
    "TAIGA_PASSWORD": "your_password"
  }
}
```

## 🎯 Usage Examples

### Sprint Management
```
🗣️ "Show me all sprints in project MyApp"
📊 Returns: List of sprints with status and dates

🗣️ "Get detailed statistics for Sprint 5"
📈 Returns: Progress stats, completion rates, user stories count

🗣️ "Create a new sprint called 'Q1 Release' from 2024-01-01 to 2024-03-31"
✅ Returns: Created sprint details
```

### Issue Tracking
```
🗣️ "List all issues in project MyApp"
📋 Returns: Issues with sprint assignments and status

🗣️ "Show me issue #123 details"
🔍 Returns: Complete issue info including sprint, assignee, timeline

🗣️ "Update issue 838 status to 'In Progress'"
🔄 Returns: Issue status updated with confirmation

🗣️ "Assign issue 838 to John Doe"
👤 Returns: Issue assigned to team member with details

🗣️ "Add issue 838 to Sprint 1.0.95"
🏃 Returns: Issue moved to sprint with confirmation
```

### Batch Operations
```
🗣️ "Batch create these issues in MyApp:
- Bug: Login page broken (High priority)
- Feature: Add search functionality (Medium priority)
- Task: Update documentation (Low priority)"
📊 Returns: Created 3/3 issues successfully with reference numbers
```

### Advanced Queries
```
🗣️ "Find all high priority bugs assigned to john: status:open AND priority:high AND assignee:john AND type:bug"
📊 Returns: Filtered list of critical bugs needing attention

🗣️ "Show user stories with 5+ points created this week: points:>=5 AND created:this_week ORDER BY points DESC"
📈 Returns: High-value stories with detailed point breakdown
```

## 🔧 Available Tools (50 Total)

### 🔐 Authentication (1 tool)
- `authenticate` - Authenticate with Taiga API

### 📁 Project Management (2 tools)
- `listProjects` - Get all accessible projects
- `getProject` - View detailed project information

### 🏃 Sprint Management (6 tools)
- `listMilestones` - List all sprints in a project
- `getMilestoneStats` - Get sprint progress and statistics
- `createMilestone` - Create new sprints with dates
- `getIssuesByMilestone` - View all issues in a sprint
- `updateSprint` - Update sprint information
- `deleteSprint` - Delete a sprint

### 🐛 Issue Management (6 tools)
- `listIssues` - List issues with sprint info
- `getIssue` - Get detailed issue information
- `createIssue` - Create issues with priorities/types
- `updateIssueStatus` - Update issue status
- `addIssueToSprint` - Assign/remove issues to/from sprints
- `assignIssue` - Assign/unassign issues to team members

### 📝 User Story Management (6 tools)
- `listUserStories` - View user stories in a project
- `createUserStory` - Create new user stories
- `getUserStory` - Get user story details
- `updateUserStory` - Update user story properties
- `deleteUserStory` - Delete user stories
- `addUserStoryToSprint` - Add/remove user stories to/from sprints

### ✅ Task Management (3 tools)
- `createTask` - Create tasks linked to user stories
- `getTask` - Get task details
- `updateTask` - Update task properties

### 🚀 Batch Operations (3 tools)
- `batchCreateIssues` - Batch create multiple issues (up to 20)
- `batchCreateUserStories` - Batch create multiple user stories
- `batchCreateTasks` - Batch create multiple tasks

### 🔍 Advanced Search (3 tools)
- `advancedSearch` - Execute advanced SQL-like queries
- `queryHelp` - Get query syntax help and examples
- `validateQuery` - Validate query syntax before execution

### 💬 Comment System (4 tools)
- `addComment` - Add comments to issues, stories, or tasks
- `listComments` - View comment history for items
- `editComment` - Edit existing comments
- `deleteComment` - Delete comments

### 📎 File Attachments (4 tools)
- `uploadAttachment` - Upload files (Base64 or file path)
- `listAttachments` - View attachment list
- `downloadAttachment` - Download attachments
- `deleteAttachment` - Delete attachments

### 🏛️ Epic Management (6 tools)
- `createEpic` - Create large-scale Epic features
- `listEpics` - List all Epics in a project
- `getEpic` - Get Epic details and progress stats
- `updateEpic` - Update Epic information and status
- `linkStoryToEpic` - Link User Stories to Epics
- `unlinkStoryFromEpic` - Remove Story-Epic associations

### 📖 Wiki Management (6 tools)
- `createWikiPage` - Create project Wiki pages
- `listWikiPages` - List all Wiki pages
- `getWikiPage` - Get Wiki page details
- `updateWikiPage` - Update Wiki page content
- `deleteWikiPage` - Delete Wiki pages
- `watchWikiPage` - Watch/unwatch Wiki pages

## 🚀 Why Choose Taiga MCP Server?

- **🔥 Zero Setup**: Works immediately with npx
- **🧠 AI-Native**: Built specifically for conversational project management
- **🔗 Complete Integration**: Full Taiga API coverage with 50 tools
- **📊 Rich Data**: Detailed progress tracking and statistics
- **🎯 Sprint-Focused**: Advanced sprint-issue relationship tracking
- **🛡️ Secure**: Environment-based credential management
- **🚀 Batch Operations**: Efficient bulk operations for large projects
- **💬 Team Collaboration**: Complete comment system
- **📎 File Management**: Dual upload methods (file path/Base64)
- **🏛️ Enterprise-Ready**: Epic management for large-scale projects
- **📖 Knowledge Management**: Complete Wiki system
- **🔍 Advanced Search**: SQL-like query syntax
- **🌐 Flexible Deployment**: CLI, Docker, and HTTP modes

## 🙏 Acknowledgments

### Attribution and Legal Notice
This project was **inspired by** [mcpTAIGA](https://github.com/adriapedralbes/mcpTAIGA) by [adriapedralbes](https://github.com/adriapedralbes). This version represents a substantial rewrite and reimplementation with entirely new architecture, features, and functionality while using the same ISC license terms.

### AI-Assisted Development
🤖 **Developed with Claude Code**: This entire project was collaboratively developed with [Claude Code](https://claude.ai/code), demonstrating the power of AI-assisted software development. The architecture, implementation, testing, and documentation were all created through human-AI collaboration.

### Key Enhancements
From the original basic concept, this version expanded to include:

- **Complete Architectural Redesign**: Professional modular tool system (v1.5.0+)
- **50 MCP Tools**: From basic functionality to enterprise-grade project management
- **Advanced Sprint Management**: Complete milestone tracking with detailed statistics
- **Enhanced Issue Management**: Full issue lifecycle with sprint associations
- **Batch Operations**: Efficient bulk creation for large-scale projects (v1.6.0)
- **Advanced Query System**: SQL-like syntax for complex data filtering (v1.6.1)
- **Team Collaboration**: Complete comment system for enhanced communication (v1.7.0)
- **File Management**: Full attachment lifecycle with multi-format support (v1.7.1)
- **Epic Management**: Enterprise-grade large-scale project organization (v1.8.0)
- **HTTP Transport**: n8n integration and HTTP/SSE mode (v1.9.0)
- **Professional Code Quality**: Error handling, formatting, comprehensive testing
- **Comprehensive Documentation**: Professional guides and examples
- **Automated CI/CD**: Dual registry publishing with complete automation

**Original concept**: Basic Taiga MCP connectivity
**This implementation**: Full-featured Taiga project management suite with HTTP/CLI support

## 📚 Documentation

**Complete documentation is available on our [GitHub Wiki](https://github.com/greddy7574/taigaMcpServer/wiki) 📖**

### 🌐 Multi-Language Support

Our documentation is available in three languages:

- **🇺🇸 [English](https://github.com/greddy7574/taigaMcpServer/wiki/Home.en)** - Complete English documentation
- **🇨🇳 [简体中文](https://github.com/greddy7574/taigaMcpServer/wiki/Home.zh-CN)** - 完整的简体中文文档
- **🇹🇼 [繁體中文](https://github.com/greddy7574/taigaMcpServer/wiki/Home.zh-TW)** - 完整的繁體中文文件

## 🚀 Automated Publishing

This project features a fully automated CI/CD pipeline:

```bash
npm version patch              # Create new version
git push origin main --tags    # Trigger automated publishing
```

**Automated Flow**: Tests → NPM Publish → GitHub Packages → Release Creation
**Dual Registry Support**: Available on both NPM and GitHub Package Registry

## 🤝 Contributing

Issues and pull requests are welcome! Please visit our [GitHub repository](https://github.com/greddy7574/taigaMcpServer) to contribute.

## 📄 License

ISC License - This project is licensed under the ISC License, same as the original [mcpTAIGA](https://github.com/adriapedralbes/mcpTAIGA).

### Project Information
- **Original Inspiration**: [adriapedralbes](https://github.com/adriapedralbes) / [mcpTAIGA](https://github.com/adriapedralbes/mcpTAIGA)
- **This Implementation**: Substantial rewrite by greddy7574@gmail.com with AI assistance from Claude Code
- **License**: ISC License
- **Architecture**: Entirely new modular design with 50 MCP tools across 12 categories
- **Current Version**: v1.9.14 - HTTP Integration Edition

---

**Enhanced with ❤️ for agile teams using Taiga project management**
