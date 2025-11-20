# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Project Overview

**Taiga MCP Server** is a highly modular Model Context Protocol server that provides a complete natural language interface for Taiga project management systems. The project uses modern Node.js ES module architecture, communicating with MCP clients via stdio transport, supporting enterprise-level project management features.

### Core Features
- **Complete Sprint Management** - Create, track, and analyze statistics
- **Issue Lifecycle Management** - Issue and Sprint association tracking  
- **Batch Operations Support** - Bulk creation of Issues, Stories, Tasks (up to 20 items)
- **Advanced Query Syntax** - SQL-like syntax for precise data search and filtering
- **Comment Collaboration System** - Complete team discussion and collaboration features
- **File Attachment Management** - Upload, download, and manage project file resources
- **Epic Project Management** - Large-scale project epic-level feature organization and management
- **Wiki Knowledge Management** - Complete project documentation and knowledge base system
- **Modular Architecture** - 48 MCP tools across 12 functional categories
- **Professional Testing Framework** - Unit tests, integration tests, MCP protocol tests, specialized feature tests
- **AI-Assisted Development** - Demonstrates human-AI collaborative software development potential

## 📋 Common Commands

### Development and Running
```bash
npm start                    # Start MCP server (stdio mode)
npm test                     # Run default test suite (unit + quick tests)
npm run test:unit           # Run unit tests (no external dependencies)
npm run test:quick          # Run quick functional tests
npm run test:basic          # Run MCP protocol tests (complex)
npm run test:integration    # Run Taiga API integration tests (requires credentials)
npm run test:full          # Run all test suites
node test/batchTest.js     # Run batch operations specialized tests
node test/advancedQueryTest.js  # Run advanced query specialized tests
node test/commentTest.js      # Run comment system specialized tests
node test/attachmentTest.js   # Run file attachment specialized tests
node test/base64UploadTest.js # Run Base64 file upload specialized tests (new)
node test/epicTest.js         # Run Epic management specialized tests
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

## 🏗️ Architecture Structure

### Modular Design (v1.5.0+)
```
src/
├── index.js              # Main MCP server entry point (130 lines)
├── constants.js          # Unified constant management (76 lines)
├── utils.js             # Utility function library (120 lines)
├── taigaAuth.js         # Authentication management
├── taigaService.js      # API service layer (420 lines)
├── query/               # Advanced query system
│   ├── QueryParser.js   # SQL-like query syntax parser
│   ├── QueryExecutor.js # Query execution engine
│   └── queryGrammar.js  # Query syntax definitions
└── tools/               # MCP tool modules
    ├── index.js         # Tool registry center
    ├── authTools.js     # Authentication tools
    ├── projectTools.js  # Project management tools
    ├── sprintTools.js   # Sprint management tools
    ├── issueTools.js    # Issue management tools
    ├── userStoryTools.js # User story tools
    ├── taskTools.js     # Task management tools
    ├── batchTools.js    # Batch operation tools
    ├── advancedSearchTools.js # Advanced search tools
    ├── commentTools.js  # Comment system tools
    ├── attachmentTools.js # File attachment tools
    ├── epicTools.js     # Epic management tools
    └── wikiTools.js     # Wiki management tools
```

### MCP Tool Categories (48 tools)

#### 🔐 Authentication Tools (1 tool)
- `authenticate` - Taiga user authentication

#### 📁 Project Management (2 tools)
- `listProjects` - List user projects
- `getProject` - Get project details (supports ID and slug)

#### 🏃 Sprint Management (4 tools)
- `listMilestones` - List project Sprints (milestones)
- `getMilestoneStats` - Sprint statistics (progress, completion rate)
- `createMilestone` - Create new Sprint
- `getIssuesByMilestone` - Get all issues in a Sprint

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

#### 🚀 Batch Operations (3 tools)
- `batchCreateIssues` - Bulk create Issues (up to 20 items)
- `batchCreateUserStories` - Bulk create user stories
- `batchCreateTasks` - Bulk create tasks (linked to specific Story)

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

### Testing Architecture
```
test/
├── README.md           # Testing documentation
├── unitTest.js        # Unit tests (11 tests, 100% pass)
├── quickTest.js       # Quick functional tests (4 tests)
├── mcpTest.js         # MCP protocol tests (8 tests, complex)
├── integration.js     # Taiga API integration tests (requires credentials)
├── batchTest.js       # Batch operations tests (9 tests, 100% pass)
├── advancedQueryTest.js # Advanced query tests (11 tests, 100% pass)
├── commentTest.js     # Comment system tests (10 tests, 100% pass)
├── attachmentTest.js  # File attachment tests (10 tests, 100% pass)
├── epicTest.js        # Epic management tests (10 tests, 100% pass)
├── wikiTest.js        # Wiki management tests
└── runTests.js        # Comprehensive test runner
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
- `resolveProject()` - Smart project resolution (ID/slug/name)
- `formatDate()` - Unified date formatting
- `calculateCompletionPercentage()` - Completion percentage calculation
- `createSuccessResponse()` / `createErrorResponse()` - Response formatting

## 📊 Code Quality Metrics

### Modularization Level
- **Main File Reduction**: 800+ lines → 130 lines (83% reduction)
- **Feature Separation**: 12 independent tool modules
- **Test Coverage**: 4 testing levels
- **Documentation**: Complete API and architecture documentation

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