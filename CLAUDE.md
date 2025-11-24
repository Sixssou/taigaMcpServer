# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Project Overview

**Taiga MCP Server** is a highly modular Model Context Protocol server that provides a complete natural language interface for Taiga project management systems. The project uses modern Node.js ES module architecture, supporting both stdio and HTTP/JSON-RPC transport modes for maximum flexibility and enterprise-level project management features.

### Core Features
- **Dual Transport Modes** - Stdio (CLI/Claude Desktop) and HTTP/JSON-RPC (n8n integration)
- **Complete Sprint Management** - Create, track, analyze statistics with 9 comprehensive tools
- **Issue Lifecycle Management** - Issue and Sprint association tracking with fuzzy matching
- **Enhanced Batch Operations** - Bulk creation and updates (7 tools supporting up to 20 items)
- **Intelligent User Resolution** - Multi-format support (username, email, full name) with fuzzy matching
- **Metadata Discovery System** - Self-documenting API with 5-minute caching for optimal performance
- **Validation & Dry-Run Mode** - Pre-validate operations with detailed error messages and suggestions
- **Advanced Query Syntax** - SQL-like syntax for precise data search and filtering
- **Comment Collaboration System** - Complete team discussion and collaboration features
- **File Attachment Management** - Upload, download, and manage project file resources (Base64-based)
- **Epic Project Management** - Large-scale project epic-level feature organization and management
- **Wiki Knowledge Management** - Complete project documentation and knowledge base system
- **Modular Architecture** - 58 MCP tools across 13 functional categories
- **Professional Testing Framework** - 30 test files with unit, integration, MCP protocol, and specialized feature tests
- **AI-Assisted Development** - Demonstrates human-AI collaborative software development potential

## 📋 Common Commands

### Development and Running
```bash
npm start                    # Start MCP server (stdio mode for Claude Desktop)
npm start:http              # Start HTTP server (JSON-RPC mode for n8n integration)
npm test                     # Run default test suite (unit + quick tests)
npm run test:unit           # Run unit tests (no external dependencies)
npm run test:quick          # Run quick functional tests
npm run test:basic          # Run MCP protocol tests (complex)
npm run test:integration    # Run Taiga API integration tests (requires credentials)
npm run test:full          # Run all test suites (30 test files)
node test/batchTest.js     # Run batch operations specialized tests
node test/advancedQueryTest.js  # Run advanced query specialized tests
node test/commentTest.js      # Run comment system specialized tests
node test/attachmentTest.js   # Run file attachment specialized tests
node test/base64UploadTest.js # Run Base64 file upload specialized tests
node test/epicTest.js         # Run Epic management specialized tests
node test/wikiTest.js         # Run Wiki management specialized tests
```

### Package Management and Publishing
```bash
# Manual publishing (not recommended)
npm publish                 # Publish to npm (requires version update)

# Automated publishing (recommended)
npm version patch           # Create new version and trigger auto-publish
git push origin main --tags # Push tags to trigger CI/CD auto-publish

# Using published packages
npx taiga-mcp-server                     # NPM Registry
npx @greddy7574/taiga-mcp-server        # GitHub Package Registry
```

### Docker Deployment
```bash
# Build image
docker build -t taiga-mcp-server .

# Run container (requires .env file)
docker run --rm -i --env-file .env taiga-mcp-server

# Using docker-compose
docker-compose up --build        # Production environment
docker-compose --profile dev up  # Development environment (includes tests)

# Cleanup
docker-compose down
docker system prune -f
```

### Wiki Documentation Sync
```bash
# Wiki push workflow (docs folder directly linked to Wiki repository)
cd docs                      # Enter docs folder
git status                   # Check modification status
git add .                    # Add all modified files
git commit -m "📚 Update Wiki documentation"  # Create commit
git push origin master       # Push to GitHub Wiki

# Wiki link format specification
# Correct: [[Display Text|Page Name]]
# Incorrect: [[Page Name|Display Text]]

# Important reminders:
# - docs folder is configured as Wiki repository (*.wiki.git)
# - Main project on main branch, Wiki on master branch
# - After modifying docs content, must manually push to Wiki
# - Wiki link format must be [[Display Text|Page Name]]
```

## ⚙️ Environment Configuration

### Required .env File
```env
TAIGA_API_URL=https://api.taiga.io/api/v1
TAIGA_USERNAME=your_username  
TAIGA_PASSWORD=your_password
```

### Claude Desktop Configuration

#### NPM Method (Recommended)
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

#### Docker Compose Method
```json
{
  "mcpServers": {
    "taiga-mcp": {
      "command": "docker-compose",
      "args": [
        "-f", "/path/to/taigaMcpServer/docker-compose.yml",
        "run", "--rm", "taiga-mcp-server"
      ],
      "cwd": "/path/to/taigaMcpServer"
    }
  }
}
```

### n8n Integration Configuration (HTTP/JSON-RPC Mode)

**NEW v1.9+**: The server supports HTTP/JSON-RPC transport for n8n workflow automation.

#### Running HTTP Server
```bash
npm start:http              # Starts on http://localhost:3000
# Or with Docker:
docker-compose up taiga-mcp-http
```

#### n8n HTTP Request Configuration
```json
{
  "method": "POST",
  "url": "http://localhost:3000/mcp",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "method": "tools/call",
    "params": {
      "name": "createTask",
      "arguments": {
        "projectIdentifier": "my-project",
        "userStoryRef": "#123",
        "subject": "New task",
        "description": "Task description"
      }
    }
  }
}
```

#### Available MCP Methods
- `initialize` - Initialize MCP connection
- `tools/list` - Get list of all available tools
- `tools/call` - Execute a specific tool

#### Health Check
```bash
curl http://localhost:3000/health
# Response: {"status":"ok","timestamp":"2025-11-24T..."}
```

**Features:**
- Automatic Zod → JSON Schema conversion for tool definitions
- Full MCP protocol compliance over HTTP
- Stateless request/response model
- Environment variables from .env file

## 🏗️ Architecture Structure

### Modular Design (v1.5.0+, Enhanced v1.9.14)
```
src/
├── index.js              # Stdio MCP server entry point (130 lines)
├── httpServer.js         # HTTP/JSON-RPC server for n8n (420 lines) [NEW v1.9+]
├── constants.js          # Unified constant management (200+ lines)
├── utils.js             # Enhanced utility library (800+ lines)
├── taigaAuth.js         # Authentication management
├── taigaService.js      # Comprehensive API service layer (1,594 lines)
├── userResolution.js    # Intelligent user resolution with fuzzy matching (272 lines) [NEW v1.9+]
├── metadataService.js   # Metadata discovery & 5-min caching (408 lines) [NEW v1.9+]
├── validation.js        # Validation & dry-run system (385 lines) [NEW v1.9+]
├── query/               # Advanced query system
│   ├── QueryParser.js   # SQL-like query syntax parser
│   ├── QueryExecutor.js # Query execution engine
│   └── queryGrammar.js  # Query syntax definitions
└── tools/               # MCP tool modules (13 categories, 58 tools)
    ├── index.js         # Tool registry center
    ├── authTools.js     # Authentication tools (1 tool)
    ├── projectTools.js  # Project management tools (2 tools)
    ├── sprintTools.js   # Sprint management tools (9 tools) [ENHANCED]
    ├── issueTools.js    # Issue management tools (6 tools)
    ├── userStoryTools.js # User story tools (6 tools)
    ├── taskTools.js     # Task management tools (3 tools)
    ├── batchTools.js    # Batch operation tools (7 tools) [ENHANCED - was 3]
    ├── advancedSearchTools.js # Advanced search tools (3 tools)
    ├── commentTools.js  # Comment system tools (4 tools)
    ├── attachmentTools.js # File attachment tools (4 tools)
    ├── epicTools.js     # Epic management tools (6 tools)
    ├── wikiTools.js     # Wiki management tools (6 tools)
    └── metadataTools.js # Metadata discovery tools (5 tools) [NEW v1.9+]
```

### MCP Tool Categories (58 tools)

#### 🔐 Authentication Tools (1 tool)
- `authenticate` - Taiga user authentication

#### 📁 Project Management (2 tools)
- `listProjects` - List user projects
- `getProject` - Get project details (supports ID and slug)

#### 🏃 Sprint Management (9 tools) - **Enhanced with Advanced Features**
- `listMilestones` - List project Sprints (milestones)
- `getMilestone` - Get single milestone by identifier (ID, name, or fuzzy match)
- `getMilestoneStats` - Sprint statistics (progress, completion rate)
- `createMilestone` - Create new Sprint
- `updateMilestone` - Update Sprint properties (name, dates, status)
- `deleteMilestone` - Delete Sprint (with safety checks)
- `getIssuesByMilestone` - Get all issues in a Sprint
- `getUserStoriesByMilestone` - Get all user stories in a Sprint
- `findSprint` - User-friendly Sprint search with fuzzy matching

#### 🐛 Issue Management (6 tools)
- `listIssues` - List project issues (with Sprint information)
- `getIssue` - Issue details (including Sprint assignment)
- `createIssue` - Create issues (supports status, priority, etc.)
- `updateIssueStatus` - Update issue status
- `addIssueToSprint` - Add/remove issues to/from sprints
- `assignIssue` - Assign/unassign issues to team members

#### 📝 User Story Management (6 tools)
- `listUserStories` - List project user stories
- `createUserStory` - Create user stories
- `getUserStory` - Get user story details
- `updateUserStory` - Update user story properties
- `deleteUserStory` - Delete user stories
- `addUserStoryToSprint` - Add/remove user stories to/from sprints

#### ✅ Task Management (3 tools)
- `createTask` - Create tasks (linked to user stories)
- `getTask` - Get task details (supports ID and reference number)
- `updateTask` - Update task properties (subject, description, status, assignee, tags)

#### 🚀 Batch Operations (7 tools) - **Enhanced with Update Operations**
- `batchCreateIssues` - Bulk create Issues (up to 20 items)
- `batchCreateUserStories` - Bulk create user stories
- `batchCreateTasks` - Bulk create tasks (linked to specific Story)
- `batchUpdateTasks` - Update multiple tasks at once (status, assignee, due dates)
- `batchUpdateUserStories` - Bulk update user stories (supports epic, dueDate, status)
- `batchAssign` - Assign multiple items (tasks/stories/issues) to a user
- `batchUpdateDueDates` - Set due dates with flexible formats (relative/absolute/sprint-end)

#### 🔍 Advanced Search (3 tools) - **New Feature**
- `advancedSearch` - Advanced query syntax search (SQL-like syntax)
- `queryHelp` - Query syntax help and examples
- `validateQuery` - Query syntax validation tool

#### 💬 Comment System (4 tools) - **Collaboration Enhancement**
- `addComment` - Add comments to Issues/Stories/Tasks
- `listComments` - View complete project comment history
- `editComment` - Edit published comment content
- `deleteComment` - Delete unwanted comments

#### 📎 File Attachments (4 tools) - **Resource Management (Base64-based)**
- `uploadAttachment` - Upload file attachments to Issues/Stories/Tasks (Base64 encoded)
- `listAttachments` - View all attachments for project work items
- `downloadAttachment` - Download specified file attachments
- `deleteAttachment` - Delete unwanted file attachments

**Important Update (v1.9.8+)**: File upload has been changed to Base64 encoding mode, solving MCP protocol file path limitation issues. See `FILE_UPLOAD_GUIDE.md` for migration guide.

#### 🏛️ Epic Management (6 tools) - **Enterprise-level Project Organization**
- `createEpic` - Create large-scale project epic-level features
- `listEpics` - List all Epics in a project
- `getEpic` - Get Epic detailed information and progress statistics
- `updateEpic` - Update Epic information and status
- `linkStoryToEpic` - Link user stories to Epics
- `unlinkStoryFromEpic` - Remove user story associations from Epics

#### 📖 Wiki Management (6 tools) - **Knowledge Base and Documentation Center**
- `createWikiPage` - Create project Wiki pages with Markdown support
- `listWikiPages` - List all Wiki pages in a project
- `getWikiPage` - Get Wiki page details by ID or slug
- `updateWikiPage` - Update Wiki page content and settings
- `deleteWikiPage` - Delete Wiki pages (irreversible operation)
- `watchWikiPage` - Watch/unwatch Wiki page change notifications

#### 🔍 Metadata Discovery (5 tools) - **NEW v1.9+ - Self-Documenting API**
- `getProjectMetadata` - Get complete project metadata in one call (with 5-min caching)
- `listProjectMembers` - List all members with all identifier formats (username, email, full name)
- `getAvailableStatuses` - Get available statuses by entity type (task, story, issue)
- `listProjectMilestones` - List all sprints/milestones for reference
- `clearMetadataCache` - Clear cached metadata (force refresh)

**Key Features:**
- Automatic 5-minute TTL caching for optimal performance
- Parallel metadata fetching reduces latency
- Enables validation and dry-run modes
- Essential for understanding available options before operations

### Testing Architecture (30 test files)
```
test/
├── README.md           # Comprehensive testing documentation
├── runTests.js        # Orchestrates all test suites
│
├── Core Test Suites (4 levels)
│   ├── unitTest.js              # 11 tests, no external dependencies (100% pass)
│   ├── quickTest.js             # 4 tests, MCP server creation
│   ├── mcpTest.js               # 8 tests, protocol compliance
│   └── integration.js           # Real Taiga API tests (requires credentials)
│
├── Feature-Specific Tests (9 specialized suites)
│   ├── batchTest.js             # Batch operations (9 tests, 100% pass)
│   ├── advancedQueryTest.js     # Query syntax (11 tests, 100% pass)
│   ├── commentTest.js           # Comment system (10 tests, 100% pass)
│   ├── attachmentTest.js        # Attachments (10 tests, 100% pass)
│   ├── base64UploadTest.js      # Base64 file uploads
│   ├── epicTest.js              # Epic management (10 tests, 100% pass)
│   ├── wikiTest.js              # Wiki functionality
│   ├── sprintUpdateDeleteTest.js # Sprint CRUD operations
│   └── milestoneIdentifierTest.js # Milestone resolution
│
└── Debug/Development Tests (17 additional files)
    └── debugCommentTest.js, commentHistoryTest.js, etc.
```

## 🔧 Development Guidelines

### Core Design Principles
1. **Modular First** - Each feature as independent module for easy maintenance
2. **Unified Error Handling** - All API calls use unified error handling pattern
3. **Standardized Response Format** - Use `createSuccessResponse` and `createErrorResponse`
4. **Flexible Project Identifiers** - Support both numeric IDs and string slugs

### ES Module Standards
- All imports must include `.js` extension
- Use `export`/`import` syntax
- Support dynamic imports

### Data Processing Patterns
```javascript
// Project resolution example
const project = await resolveProject(projectIdentifier);

// Response formatting example  
return createSuccessResponse(`✅ ${SUCCESS_MESSAGES.ISSUE_CREATED}`);

// Error handling example
return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
```

### Common Utility Functions

#### Core Utilities (utils.js)
- `resolveProject()` - Smart project resolution (ID/slug/name)
- `resolveMilestone()` - Sprint resolution with fuzzy matching
- `findSprint()` - User-friendly sprint search wrapper
- `formatDate()` - Unified date formatting
- `calculateCompletionPercentage()` - Completion percentage calculation
- `createSuccessResponse()` / `createErrorResponse()` - Response formatting
- `levenshteinDistance()` - String similarity calculation for fuzzy matching

#### User Resolution System (userResolution.js) - **NEW v1.9+**
- `resolveUser()` - Intelligent multi-format user resolution
  - Supports: username, email, full name (exact + fuzzy), user ID
  - Configurable similarity threshold (default: 70%)
  - Detailed error messages with all available users
- `resolveUserBatch()` - Batch user resolution for performance

#### Metadata Service (metadataService.js) - **NEW v1.9+**
- `getProjectMetadata()` - Complete metadata in one call
- `getProjectMembers()` - All members with caching
- `getAvailableStatuses()` - Status lists by entity type
- `getProjectMilestones()` - Sprint/milestone catalog
- `clearMetadataCache()` - Force cache refresh
- **5-minute TTL caching** for optimal performance

#### Validation System (validation.js) - **NEW v1.9+**
- `validateTask()` - Pre-validate task data before API calls
- `validateUserStory()` - Validate story data with field resolution
- `validateIssue()` - Validate issue data
- `validateWithDryRun()` - Preview resolved data without creating
- Returns: `{ isValid, errors, warnings, suggestions, resolvedData }`

## 📊 Code Quality Metrics

### Modularization Level
- **Total Source Lines**: ~9,600 lines across all src/ files
- **Main File Reduction**: 800+ lines → 130 lines (83% reduction)
- **Feature Separation**: 13 independent tool modules (58 total tools)
- **Test Coverage**: 30 test files across 4 testing levels
- **Documentation**: Complete API, architecture docs, and IMPROVEMENTS.md
- **Transport Modes**: Dual support (stdio + HTTP/JSON-RPC)

### Development Workflow
1. **Quick Validation**: `npm test` (unit + quick tests)
2. **Feature Development**: Modify corresponding tool modules
3. **Complete Testing**: `npm run test:full`
4. **Automated Publishing**: `npm version patch && git push origin main --tags`

### CI/CD Automation Pipeline 🚀
The project is configured with complete GitHub Actions automated publishing workflow:

**Trigger Condition**: Push `v*` tags
```bash
npm version patch              # Automatically create new version tag
git push origin main --tags    # Push to trigger CI/CD
```

**Automation Flow**:
1. **🧪 Testing Phase** - Run unit tests and quick tests
2. **📦 Parallel Publishing**:
   - NPM Registry: `taiga-mcp-server`
   - GitHub Packages: `@greddy7574/taiga-mcp-server`
3. **🎉 Release Creation** - Auto-generate changelog and release notes

**Configuration Requirements**:
- GitHub Repository Secret: `NPM_TOKEN` (npm automation token)
- Permissions: `contents: write`, `packages: write`

**Complete Flow Duration**: ~45 seconds (Testing→Publishing→Release)

## 🎯 Common Development Tasks

### Adding New Tools
1. Create tool file in `src/tools/`
2. Register tool in `src/tools/index.js`
3. Add related constants in `src/constants.js`
4. Add corresponding test cases

### Modifying API Responses
1. Check API calls in `src/taigaService.js`
2. Use formatting functions from `src/utils.js`
3. Ensure error handling consistency

### Debugging Issues
1. Run `npm run test:unit` to verify core logic
2. Run `npm run test:quick` to verify MCP functionality
3. Check `.env` file configuration
4. See `test/README.md` for testing strategy

## 🚀 Project Development History

### Version History
- **v1.0.0**: Basic MCP functionality
- **v1.3.0**: Added constants and utils modules
- **v1.4.0**: Enhanced constant management, unified naming
- **v1.5.0**: Complete modular architecture
- **v1.5.1**: Cleanup and testing framework
- **v1.5.2**: Git history cleanup, complete npm publishing
- **v1.5.3**: CI/CD foundation framework
- **v1.5.4**: CI/CD workflow fixes
- **v1.5.5**: Dual publishing support (NPM+GPR)
- **v1.5.6**: Fully automated Release creation
- **v1.6.0**: Docker containerization deployment and batch operations
- **v1.6.1**: Advanced query syntax system
- **v1.7.0**: Comment system collaboration enhancement
- **v1.8.0**: Epic management enterprise features
- **v1.9.8**: Base64 file upload architecture refactor, solving MCP protocol file handling limitations
- **v1.9.14**: Current version with all features integrated

### AI-Assisted Development Features
This project demonstrates the powerful potential of human-AI collaborative development:
- **Architecture Design**: AI-assisted modular design
- **Code Refactoring**: Complete refactoring from single file to modular architecture
- **Testing Framework**: Multi-level testing strategy design
- **Documentation Excellence**: Professional-grade documentation and guides

This project is a successful case study of "inspired by" open source development, showing how to achieve significant innovation and improvement while maintaining legal compliance.

## 🆕 Recent Major Improvements (v1.9.x)

**See `IMPROVEMENTS.md` for comprehensive details on recent enhancements.**

### Key Problems Solved
1. **User Assignment Issues** → Intelligent multi-format user resolution with fuzzy matching
2. **Generic Error Messages** → Field-specific errors with context and suggestions
3. **Batch Operation Performance** → 4 new batch update tools for efficient bulk operations
4. **Identifier Resolution Confusion** → Enhanced fuzzy matching for all identifiers
5. **Metadata Discovery** → 5 new tools with automatic caching (5-min TTL)
6. **Inconsistent API Responses** → Comprehensive validation system with dry-run mode

### New Capabilities Added
- **userResolution.js** (272 lines) - Multi-format user resolution (username, email, full name, ID)
- **metadataService.js** (408 lines) - Complete metadata discovery with caching
- **validation.js** (385 lines) - Pre-validation system with detailed feedback
- **httpServer.js** (420 lines) - HTTP/JSON-RPC transport for n8n integration
- **7 Batch Operation Tools** - Including batchUpdateTasks, batchUpdateUserStories, batchAssign, batchUpdateDueDates
- **9 Sprint Management Tools** - Enhanced with findSprint, updateMilestone, deleteMilestone
- **5 Metadata Discovery Tools** - getProjectMetadata, listProjectMembers, getAvailableStatuses, etc.

### Backward Compatibility
All improvements are **fully backward compatible**. Existing tools continue to work unchanged while benefiting from enhanced error handling and validation.

## 📚 Extended Documentation

**Complete technical documentation and user guides are available on the project Wiki:**
👉 **https://github.com/greddy7574/taigaMcpServer/wiki**

### Wiki Highlight Features
- 🔍 **Full-text Search** - Quickly find specific content
- 📱 **Mobile Optimized** - Better mobile device experience  
- 🔗 **Smart Navigation** - Quick jumps between pages
- 📖 **Online Editing** - Collaborative document editing
- 📊 **Rich Media Support** - Charts, tables, code highlighting

### Recommended Reading Order
1. [Installation Guide](https://github.com/greddy7574/taigaMcpServer/wiki/Installation-Guide) - Essential for new users
2. [API Reference](https://github.com/greddy7574/taigaMcpServer/wiki/API-Reference) - Complete API documentation
3. [CICD Automation](https://github.com/greddy7574/taigaMcpServer/wiki/CICD-Automation) - Automated publishing workflow

## 🔌 Taiga API Reference

This section documents the Taiga REST API as used by this MCP server. The implementation in this project demonstrates best practices for working with Taiga's API.

### API Base Configuration

```javascript
// Default Taiga API URL (can be self-hosted)
TAIGA_API_URL=https://api.taiga.io/api/v1

// Authentication (used for all requests)
TAIGA_USERNAME=your_username
TAIGA_PASSWORD=your_password
```

### Authentication

**Endpoint**: `/auth` (handled by `taigaAuth.js`)

**Method**: POST

**Request**:
```json
{
  "type": "normal",
  "username": "your_username",
  "password": "your_password"
}
```

**Response**:
```json
{
  "auth_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "id": 123,
  "username": "your_username",
  "full_name": "Your Name",
  "email": "your@email.com"
}
```

**Implementation Pattern**:
- Auth token is cached for the session
- Token is included in all subsequent requests via `Authorization: Bearer {token}` header
- Automatic re-authentication on token expiration

### Core API Endpoints

#### Projects API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/projects` | GET | List user's projects | ✅ Yes |
| `/projects/{id}` | GET | Get project details | ❌ No |
| `/projects` | POST | Create project | ❌ No |

**Query Parameters**:
- `member={userId}` - Filter projects by member
- `page={n}` - Page number (1-indexed)
- `page_size={n}` - Items per page (default: 30, max: 100)

**Project Object Structure**:
```json
{
  "id": 123,
  "slug": "project-slug",
  "name": "Project Name",
  "description": "Project description",
  "created_date": "2025-01-01T00:00:00Z",
  "modified_date": "2025-01-15T00:00:00Z",
  "owner": {...},
  "members": [...],
  "is_private": true,
  "total_milestones": 5,
  "total_story_points": 100.0
}
```

#### User Stories API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/userstories` | GET | List user stories | ✅ Yes |
| `/userstories/{id}` | GET | Get story details | ❌ No |
| `/userstories` | POST | Create user story | ❌ No |
| `/userstories/{id}` | PATCH | Update user story | ❌ No |
| `/userstories/{id}` | DELETE | Delete user story | ❌ No |

**Query Parameters**:
- `project={projectId}` - Filter by project (required for list)
- `milestone={milestoneId}` - Filter by sprint
- `status={statusId}` - Filter by status
- `assigned_to={userId}` - Filter by assignee

**User Story Object**:
```json
{
  "id": 456,
  "ref": 123,
  "subject": "Story title",
  "description": "Story description",
  "project": 123,
  "milestone": 789,
  "status": 1,
  "assigned_to": 456,
  "assigned_to_extra_info": {
    "username": "john.doe",
    "full_name_display": "John Doe"
  },
  "tags": ["frontend", "api"],
  "is_closed": false,
  "total_points": 5.0,
  "epic": 111
}
```

#### Tasks API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/tasks` | GET | List tasks | ✅ Yes |
| `/tasks/{id}` | GET | Get task details | ❌ No |
| `/tasks` | POST | Create task | ❌ No |
| `/tasks/{id}` | PATCH | Update task | ❌ No |

**Query Parameters**:
- `project={projectId}` - Filter by project
- `user_story={storyId}` - Filter by user story
- `milestone={milestoneId}` - Filter by sprint
- `status={statusId}` - Filter by status

**Task Object**:
```json
{
  "id": 789,
  "ref": 45,
  "subject": "Task title",
  "description": "Task description",
  "project": 123,
  "user_story": 456,
  "milestone": 789,
  "status": 1,
  "assigned_to": 456,
  "assigned_to_extra_info": {
    "username": "john.doe",
    "full_name_display": "John Doe"
  },
  "tags": ["bug", "urgent"],
  "is_closed": false,
  "due_date": "2025-12-31"
}
```

#### Issues API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/issues` | GET | List issues | ✅ Yes |
| `/issues/{id}` | GET | Get issue details | ❌ No |
| `/issues` | POST | Create issue | ❌ No |
| `/issues/{id}` | PATCH | Update issue | ❌ No |

**Query Parameters**:
- `project={projectId}` - Filter by project
- `milestone={milestoneId}` - Filter by sprint
- `status={statusId}` - Filter by status
- `type={typeId}` - Filter by issue type
- `severity={severityId}` - Filter by severity
- `priority={priorityId}` - Filter by priority

**Issue Object**:
```json
{
  "id": 321,
  "ref": 67,
  "subject": "Issue title",
  "description": "Issue description",
  "project": 123,
  "milestone": 789,
  "status": 1,
  "type": 1,
  "severity": 2,
  "priority": 3,
  "assigned_to": 456,
  "tags": ["backend", "database"],
  "is_closed": false
}
```

#### Milestones/Sprints API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/milestones` | GET | List milestones | ✅ Yes |
| `/milestones/{id}` | GET | Get milestone details | ❌ No |
| `/milestones` | POST | Create milestone | ❌ No |
| `/milestones/{id}` | PATCH | Update milestone | ❌ No |
| `/milestones/{id}` | DELETE | Delete milestone | ❌ No |

**Query Parameters**:
- `project={projectId}` - Filter by project (required)
- `closed={true|false}` - Filter by open/closed status

**Milestone Object**:
```json
{
  "id": 789,
  "name": "Sprint 1",
  "slug": "sprint-1",
  "project": 123,
  "estimated_start": "2025-01-01",
  "estimated_finish": "2025-01-14",
  "closed": false,
  "disponibility": 0.0,
  "total_points": 25.0,
  "closed_points": 10.0,
  "user_stories": [456, 457, 458]
}
```

#### Epics API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/epics` | GET | List epics | ✅ Yes |
| `/epics/{id}` | GET | Get epic details | ❌ No |
| `/epics` | POST | Create epic | ❌ No |
| `/epics/{id}` | PATCH | Update epic | ❌ No |
| `/epics/{id}/related_userstories` | GET | Get epic's stories | ✅ Yes |

**Epic Object**:
```json
{
  "id": 111,
  "ref": 5,
  "subject": "Epic title",
  "description": "Epic description",
  "project": 123,
  "status": 1,
  "epics_order": 1,
  "color": "#FF0000",
  "tags": ["feature"],
  "user_stories": [456, 457]
}
```

#### Wiki API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/wiki` | GET | List wiki pages | ✅ Yes |
| `/wiki/{id}` | GET | Get wiki page | ❌ No |
| `/wiki` | POST | Create wiki page | ❌ No |
| `/wiki/{id}` | PATCH | Update wiki page | ❌ No |
| `/wiki/{id}` | DELETE | Delete wiki page | ❌ No |

**Wiki Page Object**:
```json
{
  "id": 999,
  "slug": "home",
  "content": "# Wiki content in Markdown",
  "project": 123,
  "owner": 456,
  "created_date": "2025-01-01T00:00:00Z",
  "modified_date": "2025-01-15T00:00:00Z",
  "watchers": [456, 789]
}
```

#### Comments API (History System)

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/history/{type}/{id}` | GET | Get item history/comments | ✅ Yes |
| `/history/{type}/{id}` | POST | Add comment | ❌ No |
| `/history/{type}/{id}` | PATCH | Edit comment | ❌ No |
| `/history/{type}/{id}` | DELETE | Delete comment | ❌ No |

**Supported Types**: `issue`, `userstory`, `task`, `epic`, `wiki`

**Comment Object**:
```json
{
  "id": "comment-123",
  "comment": "Comment text",
  "comment_html": "<p>Comment text</p>",
  "user": {
    "username": "john.doe",
    "full_name": "John Doe"
  },
  "created_at": "2025-01-15T10:30:00Z",
  "delete_comment_date": null,
  "delete_comment_user": null
}
```

#### Attachments API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/issues/attachments` | POST | Upload issue attachment |
| `/userstories/attachments` | POST | Upload story attachment |
| `/tasks/attachments` | POST | Upload task attachment |
| `/issues/attachments/{id}` | GET | Download attachment |
| `/issues/attachments/{id}` | DELETE | Delete attachment |

**Upload Format** (v1.9.8+):
```json
{
  "project": 123,
  "object_id": 456,
  "attached_file": "data:image/png;base64,iVBORw0KG...",
  "description": "File description"
}
```

**Attachment Object**:
```json
{
  "id": 888,
  "project": 123,
  "attached_file": "https://taiga.io/media/attachments/...",
  "name": "screenshot.png",
  "size": 12345,
  "description": "File description",
  "is_deprecated": false,
  "created_date": "2025-01-15T10:00:00Z",
  "modified_date": "2025-01-15T10:00:00Z",
  "from_comment": false,
  "owner": 456
}
```

#### Metadata Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/userstory-statuses` | GET | Get user story statuses |
| `/task-statuses` | GET | Get task statuses |
| `/issue-statuses` | GET | Get issue statuses |
| `/priorities` | GET | Get priority options |
| `/severities` | GET | Get severity options |
| `/issue-types` | GET | Get issue types |
| `/memberships` | GET | Get project members |
| `/users/me` | GET | Get current user info |

**Query Parameters**:
- `project={projectId}` - Filter by project (required for most)

### Pagination Strategy

This project implements comprehensive pagination handling:

```javascript
// Automatic pagination in fetchAllPages() - src/taigaService.js:31
- Uses page_size=100 for optimal performance
- Fetches all pages automatically
- Checks x-pagination-count header
- Stops when results < page_size
```

**Best Practices**:
1. Always use `page_size=100` to minimize API calls
2. Check `x-pagination-count` and `x-pagination-next` headers
3. Handle empty result sets gracefully
4. Cache results when appropriate (see metadataService.js)

### Error Handling Patterns

```javascript
// Consistent error handling across all API calls
try {
  const client = await createAuthenticatedClient();
  const response = await client.get(endpoint);
  return response.data;
} catch (error) {
  console.error('Operation failed:', error.message);
  throw new Error(ERROR_MESSAGES.OPERATION_FAILED);
}
```

### Rate Limiting & Performance

**Implementation Strategies**:
1. **Caching**: 5-minute TTL for metadata (metadataService.js)
2. **Batch Operations**: Reduce API calls with batch tools
3. **Parallel Fetching**: Use Promise.all() for independent requests
4. **Pagination**: Fetch all pages efficiently with page_size=100

**Taiga API Limits** (typically):
- Rate limit: ~100 requests per minute
- Response size: ~10MB maximum
- Timeout: 30 seconds per request

### Advanced Features

#### Fuzzy Matching
```javascript
// Levenshtein distance algorithm for identifier resolution
- Configurable similarity threshold (default: 70%)
- Used for users, sprints, statuses
- See: utils.js:levenshteinDistance()
```

#### Validation System
```javascript
// Pre-validate before API calls
- Resolves names to IDs
- Validates field values
- Dry-run mode available
- See: validation.js
```

#### Identifier Resolution
```javascript
// Smart resolution of project/sprint/user identifiers
- Supports: ID (numeric), slug (string), name (fuzzy)
- Example: resolveProject("my-project") or resolveProject(123)
- See: utils.js
```

### API Documentation Links

**Official Taiga Documentation**:
- **API Docs**: https://docs.taiga.io/api.html
- **API Source**: https://github.com/taigaio/taiga-back
- **Frontend**: https://github.com/taigaio/taiga-front

**This Project's Implementation**:
- **API Service**: `src/taigaService.js` (1,594 lines)
- **Auth Handler**: `src/taigaAuth.js`
- **Constants**: `src/constants.js` (API_ENDPOINTS)
- **Utilities**: `src/utils.js`, `src/userResolution.js`, `src/metadataService.js`

### Common API Patterns in This Project

1. **Project Resolution** (`resolveProject`)
   - Try as numeric ID first
   - Then try as slug
   - Finally try fuzzy name match

2. **User Resolution** (`resolveUser`)
   - Try as numeric ID
   - Try as username (exact)
   - Try as email (exact)
   - Try as full name (fuzzy match)

3. **Milestone Resolution** (`resolveMilestone`)
   - Try as numeric ID
   - Try as exact name match
   - Try as fuzzy name match (Levenshtein distance)

4. **Metadata Caching** (`metadataService`)
   - 5-minute TTL cache
   - Parallel fetching
   - Auto-refresh on expiration

5. **Batch Operations** (`batchTools`)
   - Maximum 20 items per batch
   - `continueOnError` flag support
   - Detailed success/failure reporting