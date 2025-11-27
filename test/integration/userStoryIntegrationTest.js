#!/usr/bin/env node

/**
 * User Story Integration Test Suite
 *
 * Tests all User Story-related MCP tools:
 * 1. listUserStories - List all project stories
 * 2. createUserStory - Create new user story
 * 3. getUserStory - Get story details
 * 4. batchGetUserStories - Get multiple stories
 * 5. updateUserStory - Update story properties
 * 6. deleteUserStory - Delete user story
 * 7. addUserStoryToSprint - Add story to sprint
 * 8. batchCreateUserStories - Bulk create stories
 * 9. batchUpdateUserStories - Bulk update stories
 * 10. getTasksByUserStory - Get tasks for story
 *
 * Verifies:
 * - Correct return messages
 * - All field values (subject, description, status, points, etc.)
 * - Sprint relationships
 * - Batch operations
 * - Error handling
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  listUserStoriesTool,
  createUserStoryTool,
  getUserStoryTool,
  updateUserStoryTool,
  deleteUserStoryTool,
  addUserStoryToSprintTool
} from '../../src/tools/userStoryTools.js';
import {
  batchCreateUserStoriesTool,
  batchUpdateUserStoriesTool
} from '../../src/tools/batchTools.js';
import { createSprintTool, deleteSprintTool } from '../../src/tools/sprintTools.js';
import { createTaskTool } from '../../src/tools/taskTools.js';
import { authenticateTool } from '../../src/tools/authTools.js';
import { getProjectTool } from '../../src/tools/projectTools.js';
import { verifyEnvironment, parseToolResponse, extractIdFromResponse, extractReferenceNumber } from './testHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../..', '.env') });

class UserStoryIntegrationTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.createdStoryIds = [];
    this.createdStoryRefs = [];
    this.createdSprintId = null;
    this.createdTaskId = null;
    this.projectId = null;
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

  extractFieldFromResponse(response, fieldName) {
    const lines = response.split('\n');
    for (const line of lines) {
      if (line.includes(fieldName)) {
        const match = line.match(new RegExp(`${fieldName}:\\s*(.+)`));
        if (match) {
          return match[1].trim();
        }
      }
    }
    return null;
  }

  extractIdFromResponse(response) {
    const match = response.match(/(?:ID|Story ID):\s*(\d+)/i);
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
    console.log('🧪 User Story Integration Test Suite\n');
    console.log('📋 Testing all User Story-related MCP tools\n');

    const env = verifyEnvironment();
    console.log(`🔗 API: ${env.apiUrl}`);
    console.log(`👤 User: ${env.username}`);
    console.log(`📦 Test Project: ${env.testProjectId}\n`);

    try {
      // Authenticate
      await this.test('TC-US-001: Authentication', async () => {
        const authResult = await authenticateTool.handler({});
        const authText = this.parseToolResponse(authResult);
        this.assert(authText.includes('Successfully') && authText.includes('authenticated'), 'Should show successful authentication');
        this.assert(authText.includes(env.username), 'Should show username');
      });

      // Get test project from TEST_PROJECT_ID
      await this.test('TC-US-002: Get test project', async () => {
        const result = await getProjectTool.handler({
          projectIdentifier: env.testProjectId
        });
        const text = this.parseToolResponse(result);
        this.assert(!text.includes('404') && !text.includes('not found'), 'Project should be found');

        const idMatch = text.match(/ID:\s*(\d+)/);
        this.assert(idMatch, 'Should extract project ID');
        this.projectId = parseInt(idMatch[1]);
        console.log(`\n   → Using Test Project: ${env.testProjectId} (ID: ${this.projectId})`);
      });

      // Test 1: Create User Story
      await this.test('TC-US-003: Create user story with all fields', async () => {
        const result = await createUserStoryTool.handler({
          projectIdentifier: this.projectId,
          subject: '[TEST] Complete User Story',
          description: 'This is a comprehensive test user story with all fields',
          tags: ['test', 'integration', 'comprehensive']
        });

        const text = this.parseToolResponse(result);

        // Verify success message
        this.assert(text.includes('User story created successfully'), 'Should contain creation message');

        // Extract and store story ID
        const storyId = this.extractIdFromResponse(text);
        this.assert(storyId, 'Should return story ID');
        this.createdStoryIds.push(storyId);

        // Extract reference
        const ref = this.extractReferenceNumber(text);
        if (ref) {
          this.createdStoryRefs.push(ref);
        }

        // Verify fields
        this.assert(text.includes('[TEST] Complete User Story'), 'Should contain subject');
        this.assert(text.includes('comprehensive test'), 'Should contain description');
        this.assert(text.includes('test') && text.includes('integration'), 'Should contain tags');

        console.log(`\n   → Created Story ID: ${storyId}, Ref: #${ref}`);
      });

      // Test 2: Get User Story
      await this.test('TC-US-004: Get user story by ID', async () => {
        const result = await getUserStoryTool.handler({
          projectIdentifier: this.projectId,
          userStoryIdentifier: this.createdStoryIds[0]
        });

        const text = this.parseToolResponse(result);

        // Verify all fields returned
        this.assert(text.includes('[TEST] Complete User Story'), 'Should return subject');
        this.assert(text.includes('comprehensive test'), 'Should return description');
        this.assert(text.includes(`ID: ${this.createdStoryIds[0]}`) ||
                   text.includes(`${this.createdStoryIds[0]}`), 'Should return ID');
        this.assert(text.includes('test'), 'Should return tags');
      });

      // Test 3: Get User Story by Reference
      await this.test('TC-US-005: Get user story by reference', async () => {
        if (this.createdStoryRefs[0]) {
          const result = await getUserStoryTool.handler({
            projectIdentifier: this.projectId,
            userStoryIdentifier: `#${this.createdStoryRefs[0]}`
          });

          const text = this.parseToolResponse(result);
          this.assert(text.includes('[TEST] Complete User Story'), 'Should find story by reference');
        }
      });

      // Test 4: List User Stories
      await this.test('TC-US-006: List user stories', async () => {
        const result = await listUserStoriesTool.handler({
          projectIdentifier: this.projectId
        });

        const text = this.parseToolResponse(result);

        // Should contain our story
        this.assert(text.includes('[TEST] Complete User Story') ||
                   text.includes(`${this.createdStoryIds[0]}`),
                   'List should contain created story');

        // Verify list structure
        this.assert(text.includes('Story') || text.includes('User Story'), 'Should have story label');
      });

      // Test 5: Update User Story
      await this.test('TC-US-007: Update user story properties', async () => {
        const result = await updateUserStoryTool.handler({
          projectIdentifier: this.projectId,
          userStoryIdentifier: this.createdStoryIds[0],
          subject: '[TEST] Updated User Story',
          description: 'Updated description for testing purposes',
          tags: ['test', 'updated']
        });

        const text = this.parseToolResponse(result);

        // Verify update message
        this.assert(text.includes('User story updated successfully'), 'Should contain update message');

        // Verify updated fields
        this.assert(text.includes('[TEST] Updated User Story'), 'Should show updated subject');
        this.assert(text.includes('Updated description'), 'Should show updated description');
        this.assert(text.includes('updated'), 'Should show updated tags');
      });

      // Test 6: Batch Create User Stories
      await this.test('TC-US-008: Batch create user stories', async () => {
        const stories = [
          {
            subject: '[TEST] Batch Story 1',
            description: 'First batch story'
          },
          {
            subject: '[TEST] Batch Story 2',
            description: 'Second batch story'
          },
          {
            subject: '[TEST] Batch Story 3',
            description: 'Third batch story'
          }
        ];

        const result = await batchCreateUserStoriesTool.handler({
          projectIdentifier: this.projectId,
          userStories: stories
        });

        const text = this.parseToolResponse(result);

        // Verify batch creation message
        this.assert(text.includes('user stories created') || text.includes('batch'), 'Should mention batch operation');

        // Extract all created IDs
        const batchIds = this.extractAllIdsFromResponse(text);
        this.assert(batchIds.length === 3, 'Should create 3 stories');

        this.createdStoryIds.push(...batchIds);

        // Verify all subjects appear
        this.assert(text.includes('[TEST] Batch Story 1'), 'Should show first story');
        this.assert(text.includes('[TEST] Batch Story 2'), 'Should show second story');
        this.assert(text.includes('[TEST] Batch Story 3'), 'Should show third story');

        console.log(`\n   → Created ${batchIds.length} stories in batch`);
      });

      // Test 7: Batch Get User Stories
      await this.test('TC-US-009: Batch get user stories', async () => {
        // Use last 3 created stories
        const storyIds = this.createdStoryIds.slice(-3);

        const { batchGetUserStoriesTool } = await import('../../src/tools/userStoryTools.js');
        const result = await batchGetUserStoriesTool.handler({
          projectIdentifier: this.projectId,
          userStoryIdentifiers: storyIds
        });

        const text = this.parseToolResponse(result);

        // Should return all 3 stories
        this.assert(text.includes('[TEST] Batch Story 1') ||
                   text.includes(`${storyIds[0]}`), 'Should return first story');
        this.assert(text.includes('[TEST] Batch Story 2') ||
                   text.includes(`${storyIds[1]}`), 'Should return second story');
        this.assert(text.includes('[TEST] Batch Story 3') ||
                   text.includes(`${storyIds[2]}`), 'Should return third story');
      });

      // Test 8: Batch Update User Stories
      await this.test('TC-US-010: Batch update user stories', async () => {
        const updates = this.createdStoryIds.slice(-3).map((id, index) => ({
          userStoryIdentifier: id,
          subject: `[TEST] Batch Story ${index + 1} - Updated`,
          tags: ['test', 'batch-updated']
        }));

        const result = await batchUpdateUserStoriesTool.handler({
          projectIdentifier: this.projectId,
          updates: updates
        });

        const text = this.parseToolResponse(result);

        // Verify batch update message
        this.assert(text.includes('updated') || text.includes('batch'), 'Should mention update operation');

        // Should mention updated stories
        this.assert(text.includes('Updated'), 'Should show updated marker');
      });

      // Test 9: Create Sprint for testing
      await this.test('TC-US-011: Create sprint for story assignment', async () => {
        const today = new Date();
        const startDate = today.toISOString().split('T')[0];
        const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const result = await createSprintTool.handler({
          projectIdentifier: this.projectId,
          name: `[TEST] Sprint for US ${Date.now()}`,
          estimatedStart: startDate,
          estimatedFinish: endDate
        });

        const text = this.parseToolResponse(result);
        this.createdSprintId = this.extractIdFromResponse(text);
        this.assert(this.createdSprintId, 'Should create sprint');
        console.log(`\n   → Created Sprint ID: ${this.createdSprintId}`);
      });

      // Test 10: Add User Story to Sprint
      await this.test('TC-US-012: Add user story to sprint', async () => {
        const result = await addUserStoryToSprintTool.handler({
          projectIdentifier: this.projectId,
          userStoryIdentifier: this.createdStoryIds[0],
          milestoneIdentifier: this.createdSprintId
        });

        const text = this.parseToolResponse(result);

        // Verify assignment message
        this.assert(text.includes('added to sprint') || text.includes('added to milestone'), 'Should mention sprint/milestone');
      });

      // Test 11: Verify Story in Sprint
      await this.test('TC-US-013: Verify story added to sprint', async () => {
        const result = await getUserStoryTool.handler({
          projectIdentifier: this.projectId,
          userStoryIdentifier: this.createdStoryIds[0]
        });

        const text = this.parseToolResponse(result);

        // Should show sprint information
        this.assert(text.includes('Sprint') ||
                   text.includes('Milestone') ||
                   text.includes(`${this.createdSprintId}`),
                   'Should show sprint assignment');
      });

      // Test 12: Create Task for User Story
      await this.test('TC-US-014: Create task for user story', async () => {
        const result = await createTaskTool.handler({
          projectIdentifier: this.projectId,
          userStoryRef: `#${this.createdStoryRefs[0]}`,
          subject: '[TEST] Task for US Testing',
          description: 'Task to test user story relationships'
        });

        const text = this.parseToolResponse(result);
        this.createdTaskId = this.extractIdFromResponse(text);
        this.assert(this.createdTaskId, 'Should create task');
        console.log(`\n   → Created Task ID: ${this.createdTaskId}`);
      });

      // Test 13: Get Tasks by User Story
      await this.test('TC-US-015: Get tasks for user story', async () => {
        const { getTasksByUserStoryTool } = await import('../../src/tools/userStoryTools.js');
        const result = await getTasksByUserStoryTool.handler({
          projectIdentifier: this.projectId,
          userStoryIdentifier: this.createdStoryIds[0]
        });

        const text = this.parseToolResponse(result);

        // Should show our task
        this.assert(text.includes('[TEST] Task for US Testing') ||
                   text.includes(`${this.createdTaskId}`),
                   'Should list the task for user story');
      });

      // Cleanup
      await this.test('TC-US-016: Cleanup - Delete sprint', async () => {
        if (this.createdSprintId) {
          const result = await deleteSprintTool.handler({
            projectIdentifier: this.projectId,
            milestoneIdentifier: this.createdSprintId
          });
          const text = this.parseToolResponse(result);
          this.assert(text.includes('deleted'), 'Should delete sprint');
        }
      });

      // Delete all created user stories
      await this.test('TC-US-017: Cleanup - Delete all user stories', async () => {
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
        this.assert(deletedCount > 0, `Should delete at least some stories (deleted ${deletedCount})`);
        console.log(`\n   → Deleted ${deletedCount} user stories`);
      });

      console.log('\n' + '='.repeat(60));
      console.log('📊 User Story Integration Test Results:');
      console.log('='.repeat(60));
      console.log(`✅ Passed: ${this.passed}`);
      console.log(`❌ Failed: ${this.failed}`);
      console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
      console.log('='.repeat(60));

      if (this.failed === 0) {
        console.log('🎉 All User Story integration tests passed!\n');
        process.exit(0);
      } else {
        console.log('⚠️  Some User Story tests failed. Please review.\n');
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
const testSuite = new UserStoryIntegrationTest();
testSuite.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
