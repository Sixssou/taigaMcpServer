#!/usr/bin/env node

/**
 * Search & Batch Operations Integration Test Suite
 *
 * Tests all Search and Batch-related MCP tools:
 * 1. advancedSearch - SQL-like query search
 * 2. queryHelp - Get query syntax help
 * 3. validateQuery - Validate query syntax
 * 4. batchAssign - Assign multiple items to user
 * 5. batchUpdateDueDates - Update due dates in bulk
 *
 * Verifies:
 * - Advanced query syntax
 * - Query validation
 * - Bulk assignment operations
 * - Bulk due date updates
 * - Error handling
 * - Multiple entity types
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  advancedSearchTool,
  queryHelpTool,
  validateQueryTool
} from '../../src/tools/advancedSearchTools.js';
import {
  batchAssignTool,
  batchUpdateDueDatesTool
} from '../../src/tools/batchTools.js';
import { createUserStoryTool, deleteUserStoryTool } from '../../src/tools/userStoryTools.js';
import { createTaskTool } from '../../src/tools/taskTools.js';
import { authenticateTool } from '../../src/tools/authTools.js';
import { getProjectTool } from '../../src/tools/projectTools.js';
import { verifyEnvironment, parseToolResponse, extractIdFromResponse, extractReferenceNumber } from './testHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../..', '.env') });

class SearchBatchIntegrationTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.createdStoryIds = [];
    this.createdTaskIds = [];
    this.projectId = null;
    this.currentUserId = null;
  }

  async test(name, testFn) {
    try {
      process.stdout.write(`🧪 ${name}... `);
      await testFn();
      console.log('✅ PASS');
      this.passed++;
    } catch (error) {
      console.log('❌ FAIL');
      console.log(`   Error: ${error.message}`);
      if (error.stack) {
        console.log(`   Stack: ${error.stack.split('\n').slice(1, 3).join('\n')}`);
      }
      this.failed++;
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  parseToolResponse(response) {
    if (response && response.content && Array.isArray(response.content)) {
      return response.content[0].text;
    }
    return response;
  }

  extractIdFromResponse(response) {
    const match = response.match(/ID:\s*(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }

  extractAllIdsFromResponse(response) {
    const matches = response.matchAll(/ID:\s*(\d+)/gi);
    return Array.from(matches).map(m => parseInt(m[1]));
  }

  extractReferenceNumber(response) {
    const match = response.match(/(?:Reference:\s*)?#(\d+)/);
    return match ? match[1] : null;
  }

  async run() {
    console.log('🧪 Search & Batch Operations Integration Test Suite\n');
    console.log('📋 Testing all Search and Batch MCP tools\n');

    const env = verifyEnvironment();
    console.log(`🔗 API: ${env.apiUrl}`);
    console.log(`👤 User: ${env.username}`);
    console.log(`📦 Test Project: ${env.testProjectId}\n`);

    try {
      // Authenticate
      await this.test('TC-SB-001: Authentication', async () => {
        const authResult = await authenticateTool.handler({});
        const authText = this.parseToolResponse(authResult);
        this.assert(authText.includes('Successfully') && authText.includes('authenticated'), 'Should show successful authentication');
        this.assert(authText.includes(env.username), 'Should show username');
      });

      // Get test project from TEST_PROJECT_ID and current user ID
      await this.test('TC-SB-002: Get test project and user ID', async () => {
        const result = await getProjectTool.handler({
          projectIdentifier: env.testProjectId
        });
        const text = this.parseToolResponse(result);
        this.assert(!text.includes('404') && !text.includes('not found'), 'Project should be found');

        const idMatch = text.match(/ID:\s*(\d+)/);
        this.assert(idMatch, 'Should extract project ID');
        this.projectId = parseInt(idMatch[1]);

        // Get current user ID
        const { createAuthenticatedClient } = await import('../../src/taigaAuth.js');
        const client = await createAuthenticatedClient();
        const meResponse = await client.get('/users/me');
        this.currentUserId = meResponse.data.id;

        console.log(`\n   → Using Test Project: ${env.testProjectId} (ID: ${this.projectId})`);
        console.log(`   → Current user ID: ${this.currentUserId}`);
      });

      // Test 1: Query Help
      await this.test('TC-SB-003: Get query syntax help', async () => {
        const result = await queryHelpTool.handler({});
        const text = this.parseToolResponse(result);

        // Should provide help documentation
        this.assert(text.includes('query') || text.includes('syntax'), 'Should mention query syntax');
        this.assert(text.includes('example') || text.includes('Example'), 'Should provide examples');

        // Should show operators
        const hasOperators = text.includes('AND') ||
                            text.includes('OR') ||
                            text.includes('WHERE') ||
                            text.includes('=');

        this.assert(hasOperators, 'Should show query operators');
      });

      // Test 2: Validate Valid Query
      await this.test('TC-SB-004: Validate valid query syntax', async () => {
        const result = await validateQueryTool.handler({
          query: 'subject CONTAINS "test" AND status = "New"'
        });

        const text = this.parseToolResponse(result);

        // Should validate successfully
        this.assert(text.includes('valid') || text.includes('Query validated'), 'Should validate as correct');
        this.assert(!text.includes('error'), 'Should not show errors');
      });

      // Test 3: Validate Invalid Query
      await this.test('TC-SB-005: Validate invalid query syntax', async () => {
        const result = await validateQueryTool.handler({
          query: 'invalid query with bad syntax @@##'
        });

        const text = this.parseToolResponse(result);

        // Should show error
        this.assert(text.includes('❌') || text.includes('invalid') || text.includes('error'), 'Should indicate invalid query');
      });

      // Create test data for search
      await this.test('TC-SB-006: Create test stories for search', async () => {
        const stories = [
          { subject: '[SEARCH-TEST] Story Alpha', description: 'Test story for searching' },
          { subject: '[SEARCH-TEST] Story Beta', description: 'Another test story' },
          { subject: '[SEARCH-TEST] Story Gamma', description: 'Third test story' }
        ];

        for (const story of stories) {
          const result = await createUserStoryTool.handler({
            projectIdentifier: this.projectId,
            ...story
          });

          const text = this.parseToolResponse(result);
          const storyId = this.extractIdFromResponse(text);
          if (storyId) {
            this.createdStoryIds.push(storyId);
          }
        }

        this.assert(this.createdStoryIds.length === 3, 'Should create 3 test stories');
        console.log(`\n   → Created ${this.createdStoryIds.length} test stories`);
      });

      // Test 4: Advanced Search - Simple Query
      await this.test('TC-SB-007: Advanced search with simple query', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          entityType: 'userstory',
          query: 'subject CONTAINS "[SEARCH-TEST]"'
        });

        const text = this.parseToolResponse(result);

        // Should find our test stories
        this.assert(text.includes('[SEARCH-TEST]'), 'Should find test stories');
        this.assert(text.includes('Story Alpha') ||
                   text.includes('Story Beta') ||
                   text.includes('Story Gamma'), 'Should show story details');
      });

      // Test 5: Advanced Search - Complex Query
      await this.test('TC-SB-008: Advanced search with complex query', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          entityType: 'userstory',
          query: 'subject CONTAINS "[SEARCH-TEST]" AND subject CONTAINS "Alpha"'
        });

        const text = this.parseToolResponse(result);

        // Should find only Story Alpha
        this.assert(text.includes('Story Alpha'), 'Should find Story Alpha');
        this.assert(!text.includes('Story Beta') || text.split('Story Beta').length <= 2, 'Should be specific to Alpha');
      });

      // Test 6: Batch Assign Stories
      await this.test('TC-SB-009: Batch assign user stories', async () => {
        const result = await batchAssignTool.handler({
          projectIdentifier: this.projectId,
          entityType: 'userstory',
          entityIdentifiers: this.createdStoryIds,
          assignedTo: this.currentUserId
        });

        const text = this.parseToolResponse(result);

        // Verify batch assignment
        this.assert(text.includes('assigned') || text.includes('Assigned') || text.includes('completed'), 'Should mention assignment');
        this.assert(text.includes('3') || text.includes(this.createdStoryIds.length.toString()), 'Should mention number of items');
      });

      // Test 7: Create Tasks for Batch Operations
      await this.test('TC-SB-010: Create tasks for batch operations', async () => {
        // Create a story first
        const storyResult = await createUserStoryTool.handler({
          projectIdentifier: this.projectId,
          subject: '[BATCH-TEST] Story for Tasks',
          description: 'Story to hold test tasks'
        });

        const storyText = this.parseToolResponse(storyResult);
        const storyId = this.extractIdFromResponse(storyText);
        const storyRef = this.extractReferenceNumber(storyText);
        this.createdStoryIds.push(storyId);

        // Create tasks
        const tasks = [
          { subject: '[BATCH-TEST] Task 1' },
          { subject: '[BATCH-TEST] Task 2' },
          { subject: '[BATCH-TEST] Task 3' }
        ];

        for (const task of tasks) {
          const result = await createTaskTool.handler({
            projectIdentifier: this.projectId,
            userStoryRef: `#${storyRef}`,
            ...task
          });

          const text = this.parseToolResponse(result);
          const taskId = this.extractIdFromResponse(text);
          if (taskId) {
            this.createdTaskIds.push(taskId);
          }
        }

        this.assert(this.createdTaskIds.length === 3, 'Should create 3 test tasks');
        console.log(`\n   → Created ${this.createdTaskIds.length} test tasks`);
      });

      // Test 8: Batch Update Due Dates - Absolute Date
      await this.test('TC-SB-011: Batch update due dates (absolute)', async () => {
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const result = await batchUpdateDueDatesTool.handler({
          projectIdentifier: this.projectId,
          entityType: 'task',
          entityIdentifiers: this.createdTaskIds,
          dueDate: dueDate
        });

        const text = this.parseToolResponse(result);

        // Verify batch update
        this.assert(text.includes('due date') || text.includes('Due date') || text.includes('updated'), 'Should mention due dates');
        this.assert(text.includes(dueDate), 'Should show the due date');
      });

      // Test 9: Batch Update Due Dates - Relative Date
      await this.test('TC-SB-012: Batch update due dates (relative)', async () => {
        const result = await batchUpdateDueDatesTool.handler({
          projectIdentifier: this.projectId,
          entityType: 'task',
          entityIdentifiers: this.createdTaskIds,
          dueDate: '+7d'  // 7 days from now
        });

        const text = this.parseToolResponse(result);

        // Verify relative date handling
        this.assert(text.includes('due date') || text.includes('Due date') || text.includes('updated'), 'Should mention due dates');
      });

      // Test 10: Batch Assign Tasks
      await this.test('TC-SB-013: Batch assign tasks', async () => {
        const result = await batchAssignTool.handler({
          projectIdentifier: this.projectId,
          entityType: 'task',
          entityIdentifiers: this.createdTaskIds,
          assignedTo: this.currentUserId
        });

        const text = this.parseToolResponse(result);

        // Verify batch assignment
        this.assert(text.includes('assigned') || text.includes('Assigned') || text.includes('completed'), 'Should mention assignment');
      });

      // Test 11: Search Assigned Items
      await this.test('TC-SB-014: Search for assigned items', async () => {
        const { createAuthenticatedClient } = await import('../../src/taigaAuth.js');
        const client = await createAuthenticatedClient();
        const meResponse = await client.get('/users/me');
        const username = meResponse.data.username;

        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          entityType: 'userstory',
          query: `assignedTo = "${username}"`
        });

        const text = this.parseToolResponse(result);

        // Should find assigned stories
        this.assert(text.includes('[SEARCH-TEST]') || text.includes('User Story'), 'Should find assigned items');
      });

      // Test 12: Validate Query with Project Context
      await this.test('TC-SB-015: Validate query with project context', async () => {
        const result = await validateQueryTool.handler({
          projectIdentifier: this.projectId,
          query: 'status = "New" AND tags CONTAINS "test"'
        });

        const text = this.parseToolResponse(result);

        // Should validate with project context
        this.assert(text.includes('valid') || text.includes('Query validated'), 'Should validate successfully');
      });

      // Cleanup
      await this.test('TC-SB-016: Cleanup - Delete all test stories', async () => {
        let deletedCount = 0;
        for (const storyId of this.createdStoryIds) {
          try {
            await deleteUserStoryTool.handler({
              projectIdentifier: this.projectId,
              userStoryIdentifier: storyId
            });
            deletedCount++;
          } catch (error) {
            // Continue even if delete fails
          }
        }
        this.assert(deletedCount > 0, `Should delete test stories (deleted ${deletedCount})`);
        console.log(`\n   → Deleted ${deletedCount} stories and associated tasks`);
      });

      console.log('\n' + '='.repeat(60));
      console.log('📊 Search & Batch Operations Integration Test Results:');
      console.log('='.repeat(60));
      console.log(`✅ Passed: ${this.passed}`);
      console.log(`❌ Failed: ${this.failed}`);
      console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
      console.log('='.repeat(60));

      if (this.failed === 0) {
        console.log('🎉 All Search & Batch integration tests passed!\n');
        process.exit(0);
      } else {
        console.log('⚠️  Some Search/Batch tests failed. Please review.\n');
        process.exit(1);
      }

    } catch (error) {
      console.error('\n❌ Fatal error in test suite:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Run tests
const testSuite = new SearchBatchIntegrationTest();
testSuite.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
