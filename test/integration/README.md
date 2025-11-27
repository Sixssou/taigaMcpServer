# Comprehensive Integration Test Suite

## 📋 Overview

This directory contains comprehensive integration tests for all vital MCP tools in the Taiga MCP Server. These tests verify the correct functioning of each tool and validate their return messages and data integrity.

## 🎯 Test Coverage

### Total Coverage: 89+ integration tests across 48 MCP tools

| Test Suite | Tests | Tools Tested | Description |
|------------|-------|--------------|-------------|
| **Project & Metadata** | 13 | 7 tools | Authentication, projects, metadata discovery, cache management |
| **Epics** | 13 | 6 tools | Epic CRUD operations, story linking/unlinking |
| **Sprints/Milestones** | 17 | 9 tools | Sprint CRUD, statistics, user stories, issues |
| **User Stories** | 17 | 10 tools | Story CRUD, batch operations, sprint assignment, tasks |
| **Tasks** | 13 | 5 tools | Task CRUD, batch operations, user story linkage, assignment |
| **Search & Batch** | 16 | 5 tools | Advanced search, query validation, batch operations |

## 🔧 Test Architecture

### Test Structure

Each test suite follows a consistent pattern:

```javascript
class TestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    // Track created resources for cleanup
  }

  async test(name, testFn) {
    // Standardized test execution with error handling
  }

  assert(condition, message) {
    // Assertion helper
  }

  parseToolResponse(response) {
    // Parse MCP tool responses
  }

  async run() {
    // Execute all tests in sequence
    // Verify return messages
    // Validate all field values
    // Cleanup resources
  }
}
```

### What Each Test Verifies

✅ **Return Messages**: Success indicators (✅), error messages (❌), operation confirmations

✅ **Field Values**: All data fields (subject, description, dates, status, assignment, etc.)

✅ **Relationships**: Sprint-story links, story-task links, epic-story links

✅ **Batch Operations**: Multiple item creation/updates, bulk assignments

✅ **Error Handling**: Invalid inputs, missing resources, validation failures

## 📦 Test Suites Detail

### 1. Project & Metadata Integration Tests (`projectMetadataIntegrationTest.js`)

Tests authentication and project metadata discovery:

- **authenticate** - User authentication with credentials
- **listProjects** - List all accessible projects
- **getProject** - Get project details (by ID or slug)
- **getProjectMetadata** - Get complete project metadata in one call
- **listProjectMembers** - Get all members with identifier formats
- **getAvailableStatuses** - Get status options (task/story/issue)
- **clearMetadataCache** - Clear cached metadata

**Key Validations**:
- Authentication success messages
- Project ID and slug resolution
- Member identifier formats (username, email, full name)
- Status listings by entity type
- Cache management

### 2. Epic Integration Tests (`epicIntegrationTest.js`)

Tests Epic management tools:

- **createEpic** - Create epic with subject, description, color, tags
- **listEpics** - List all project epics
- **getEpic** - Get epic details (by ID or reference)
- **updateEpic** - Update epic properties
- **linkStoryToEpic** - Link user story to epic
- **unlinkStoryFromEpic** - Remove user story from epic

**Key Validations**:
- Epic creation with all fields (color #FF5733, tags, description)
- Epic reference numbers (#123 format)
- Story linkage and unlinkage
- Updated field reflection

### 3. Sprint Integration Tests (`sprintIntegrationTest.js`)

Tests Sprint/Milestone management:

- **createMilestone** - Create sprint with dates
- **listMilestones** - List all sprints
- **getMilestoneStats** - Get sprint statistics
- **updateMilestone** - Update sprint properties
- **deleteMilestone** - Delete sprint
- **getSprintComplete** - Get complete sprint details
- **getUserStoriesByMilestone** - Get stories in sprint
- **getIssuesByMilestone** - Get issues in sprint
- **listProjectMilestones** - Metadata milestone listing

**Key Validations**:
- Sprint dates (estimated start/finish)
- Statistics calculation (completion rate, story points)
- Sprint-story relationships
- Sprint-issue relationships
- Safe deletion (cleanup)

### 4. User Story Integration Tests (`userStoryIntegrationTest.js`)

Tests User Story management:

- **createUserStory** - Create story with all fields
- **getUserStory** - Get story details (by ID or reference)
- **listUserStories** - List all project stories
- **batchGetUserStories** - Get multiple stories
- **updateUserStory** - Update story properties
- **deleteUserStory** - Delete story
- **addUserStoryToSprint** - Assign story to sprint
- **batchCreateUserStories** - Bulk create stories (up to 20)
- **batchUpdateUserStories** - Bulk update stories
- **getTasksByUserStory** - Get tasks for story

**Key Validations**:
- Story subject, description, tags
- Reference number resolution (#123)
- Sprint assignment
- Batch creation (3 stories in one call)
- Batch update (multiple stories updated)
- Task relationships

### 5. Task Integration Tests (`taskIntegrationTest.js`)

Tests Task management:

- **createTask** - Create task with all fields
- **getTask** - Get task details (by ID or reference)
- **updateTask** - Update task properties (subject, description, status, assignee, due date)
- **batchCreateTasks** - Bulk create tasks
- **batchUpdateTasks** - Bulk update tasks

**Key Validations**:
- Task subject, description, tags
- Due date (YYYY-MM-DD format)
- User story linkage (via reference #123)
- Status updates
- Assignment to users
- Batch operations (3 tasks created/updated)

### 6. Search & Batch Integration Tests (`searchBatchIntegrationTest.js`)

Tests Advanced Search and Batch Operations:

- **advancedSearch** - SQL-like query search
- **queryHelp** - Get query syntax documentation
- **validateQuery** - Validate query syntax before execution
- **batchAssign** - Assign multiple items to user
- **batchUpdateDueDates** - Update due dates in bulk (absolute or relative)

**Key Validations**:
- Query syntax validation (valid/invalid)
- Query operators (CONTAINS, AND, OR, =)
- Search result accuracy
- Batch assignment (3+ items)
- Due date formats (absolute: 2025-12-31, relative: +7d)

## 🚀 Running Tests

### Run All Integration Tests

```bash
# Run complete integration test suite
npm run test:integration:comprehensive

# Or directly
node test/integration/runAllIntegrationTests.js
```

### Run Individual Test Suites

```bash
# Project & Metadata tests
node test/integration/projectMetadataIntegrationTest.js

# Epic tests
node test/integration/epicIntegrationTest.js

# Sprint tests
node test/integration/sprintIntegrationTest.js

# User Story tests
node test/integration/userStoryIntegrationTest.js

# Task tests
node test/integration/taskIntegrationTest.js

# Search & Batch tests
node test/integration/searchBatchIntegrationTest.js
```

## 🔐 Environment Setup

### Required Environment Variables

```bash
export TAIGA_API_URL=https://api.taiga.io/api/v1
export TAIGA_USERNAME=your_username
export TAIGA_PASSWORD=your_password
```

Or use a `.env` file:

```env
TAIGA_API_URL=https://api.taiga.io/api/v1
TAIGA_USERNAME=your_username
TAIGA_PASSWORD=your_password
```

## 📊 Expected Output

### Successful Test Run

```
╔════════════════════════════════════════════════════════════════════╗
║     Taiga MCP Server - Comprehensive Integration Test Suite       ║
╚════════════════════════════════════════════════════════════════════╝

📦 Testing all vital MCP tools across 6 categories
📊 Total expected tests: 89+
🔗 API: https://api.taiga.io/api/v1
👤 User: your_username

=======================================================================
🧪 Running: Project & Metadata
📋 Authentication, projects, metadata discovery, cache management
⏱️  Expected: 13 tests
=======================================================================

🧪 TC-PM-001: Authenticate user... ✅ PASS
🧪 TC-PM-002: List all projects... ✅ PASS
...
✅ Project & Metadata completed successfully (5.23s)

...

╔════════════════════════════════════════════════════════════════════╗
║                  Integration Test Summary                          ║
╚════════════════════════════════════════════════════════════════════╝

📊 Test Suite Results:
──────────────────────────────────────────────────────────────────────
Suite                     | Status     | Duration   | Tests
──────────────────────────────────────────────────────────────────────
Project & Metadata        | ✅ PASS    | 5.23s      | 13 tests
Epics                     | ✅ PASS    | 8.45s      | 13 tests
Sprints/Milestones        | ✅ PASS    | 12.67s     | 17 tests
User Stories              | ✅ PASS    | 15.34s     | 17 tests
Tasks                     | ✅ PASS    | 10.12s     | 13 tests
Search & Batch            | ✅ PASS    | 11.89s     | 16 tests
──────────────────────────────────────────────────────────────────────

📈 Overall Statistics:
   ✅ Passed Suites: 6/6
   ❌ Failed Suites: 0/6
   📊 Total Tests: 89+
   ⏱️  Total Duration: 63.70s
   📈 Success Rate: 100.0%

🎉 ALL INTEGRATION TESTS PASSED! 🎉
```

## 🔍 Test Verification Examples

### Epic Creation Test

```javascript
// Test verifies:
const result = await createEpicTool.handler({
  projectIdentifier: projectId,
  subject: '[TEST] Integration Test Epic',
  description: 'Comprehensive test epic',
  color: '#FF5733',
  tags: ['test', 'integration']
});

const text = parseToolResponse(result);

// ✅ Success message
assert(text.includes('✅'), 'Should contain success indicator');
assert(text.includes('Epic created'), 'Should contain creation message');

// ✅ ID returned
const epicId = extractIdFromResponse(text);
assert(epicId, 'Should return epic ID');

// ✅ All fields present
assert(text.includes('[TEST] Integration Test Epic'), 'Should contain subject');
assert(text.includes('comprehensive test epic'), 'Should contain description');
assert(text.includes('#FF5733'), 'Should contain color');
assert(text.includes('test') && text.includes('integration'), 'Should contain tags');
```

### Task Update Test

```javascript
// Test verifies:
const result = await updateTaskTool.handler({
  projectIdentifier: projectId,
  taskIdentifier: taskId,
  subject: '[TEST] Updated Task',
  description: 'Updated description',
  tags: ['test', 'updated'],
  dueDate: '2025-12-31',
  assignedTo: userId
});

const text = parseToolResponse(result);

// ✅ Update confirmation
assert(text.includes('✅'), 'Should contain success indicator');
assert(text.includes('updated'), 'Should contain update message');

// ✅ All updated fields reflected
assert(text.includes('[TEST] Updated Task'), 'Should show updated subject');
assert(text.includes('Updated description'), 'Should show updated description');
assert(text.includes('updated'), 'Should show updated tags');
assert(text.includes('2025-12-31'), 'Should show updated due date');
assert(text.includes('Assigned'), 'Should show assignment');
```

### Batch Operations Test

```javascript
// Test verifies:
const result = await batchCreateTasksTool.handler({
  projectIdentifier: projectId,
  userStoryRef: '#123',
  tasks: [
    { subject: '[TEST] Batch Task 1' },
    { subject: '[TEST] Batch Task 2' },
    { subject: '[TEST] Batch Task 3' }
  ]
});

const text = parseToolResponse(result);

// ✅ Batch success
assert(text.includes('✅'), 'Should contain success indicator');
assert(text.includes('3') || text.includes('batch'), 'Should mention batch operation');

// ✅ All items created
const batchIds = extractAllIdsFromResponse(text);
assert(batchIds.length === 3, 'Should create 3 tasks');

// ✅ All subjects present
assert(text.includes('[TEST] Batch Task 1'), 'Should show first task');
assert(text.includes('[TEST] Batch Task 2'), 'Should show second task');
assert(text.includes('[TEST] Batch Task 3'), 'Should show third task');
```

## 🧹 Cleanup

All test suites automatically clean up created resources:

- Delete created user stories (cascades to tasks)
- Delete created sprints/milestones
- Resources marked with `[TEST]` prefix for easy identification

If tests are interrupted, manual cleanup may be needed:
1. Search for items with `[TEST]` prefix
2. Delete test epics, stories, tasks manually from Taiga UI

## 📈 Success Criteria

A test suite passes when:

✅ All assertions pass
✅ Return messages contain expected indicators (✅, ❌)
✅ All field values are correctly returned
✅ Relationships are properly established
✅ Cleanup completes successfully

## 🐛 Debugging Failed Tests

If a test fails:

1. Check the specific test case output (TC-XXX-YYY)
2. Review the error message and assertion failure
3. Verify Taiga credentials are correct
4. Check if Taiga API is accessible
5. Look for test data in your Taiga project
6. Review the tool implementation in `src/tools/`

## 📝 Adding New Tests

To add a new test case:

```javascript
await this.test('TC-XXX-YYY: Test description', async () => {
  const result = await someTool.handler({ ...args });
  const text = this.parseToolResponse(result);

  // Verify return message
  this.assert(text.includes('✅'), 'Should succeed');

  // Verify field values
  this.assert(text.includes('expected value'), 'Should return expected value');

  // Extract and store IDs for cleanup
  const id = this.extractIdFromResponse(text);
  this.createdIds.push(id);
});
```

## 🔗 Related Documentation

- [Main README](../../README.md) - Project overview
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines
- [API Reference](../../docs/API-Reference.md) - MCP tool documentation

---

**Last Updated**: 2025-11-27
**Test Suite Version**: 1.0.0
**Total Tests**: 89+
**Coverage**: 48 vital MCP tools
