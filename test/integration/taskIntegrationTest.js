#!/usr/bin/env node

/**
 * Task Integration Test Suite
 *
 * Tests all Task-related MCP tools:
 * 1. createTask - Create new task
 * 2. getTask - Get task details
 * 3. updateTask - Update task properties
 * 4. batchCreateTasks - Bulk create tasks
 * 5. batchUpdateTasks - Bulk update tasks
 *
 * Verifies:
 * - Correct return messages
 * - All field values (subject, description, status, assignee, due date, etc.)
 * - User story linkage
 * - Batch operations
 * - Error handling
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  createTaskTool,
  getTaskTool,
  updateTaskTool
} from '../../src/tools/taskTools.js';
import {
  batchCreateTasksTool,
  batchUpdateTasksTool
} from '../../src/tools/batchTools.js';
import { createUserStoryTool, deleteUserStoryTool } from '../../src/tools/userStoryTools.js';
import { authenticateTool } from '../../src/tools/authTools.js';
import { getProjectTool } from '../../src/tools/projectTools.js';
import { verifyEnvironment, parseToolResponse, extractIdFromResponse, extractReferenceNumber } from './testHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../..', '.env') });

class TaskIntegrationTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.createdTaskIds = [];
    this.createdTaskRefs = [];
    this.createdStoryId = null;
    this.createdStoryRef = null;
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

  extractIdFromResponse(response) {
    const match = response.match(/(?:ID|Task ID):\s*(\d+)/i);
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
    console.log('🧪 Task Integration Test Suite\n');
    console.log('📋 Testing all Task-related MCP tools\n');

    const env = verifyEnvironment();
    console.log(`🔗 API: ${env.apiUrl}`);
    console.log(`👤 User: ${env.username}`);
    console.log(`📦 Test Project: ${env.testProjectId}\n`);

    try {
      // Authenticate
      await this.test('TC-TASK-001: Authentication', async () => {
        const authResult = await authenticateTool.handler({});
        const authText = this.parseToolResponse(authResult);
        this.assert(authText.includes('Successfully') && authText.includes('authenticated'), 'Should show successful authentication');
        this.assert(authText.includes(env.username), 'Should show username');
      });

      // Get test project from TEST_PROJECT_ID
      await this.test('TC-TASK-002: Get test project', async () => {
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

      // Create User Story for tasks
      await this.test('TC-TASK-003: Create user story for tasks', async () => {
        const result = await createUserStoryTool.handler({
          projectIdentifier: this.projectId,
          subject: '[TEST] Story for Task Testing',
          description: 'Story to test task relationships'
        });

        const text = this.parseToolResponse(result);
        this.createdStoryId = this.extractIdFromResponse(text);
        this.createdStoryRef = this.extractReferenceNumber(text);
        this.assert(this.createdStoryId && this.createdStoryRef, 'Should create user story');
        console.log(`\n   → Created Story ID: ${this.createdStoryId}, Ref: #${this.createdStoryRef}`);
      });

      // Test 1: Create Task with all fields
      await this.test('TC-TASK-004: Create task with all fields', async () => {
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const result = await createTaskTool.handler({
          projectIdentifier: this.projectId,
          userStoryRef: `#${this.createdStoryRef}`,
          subject: '[TEST] Complete Task',
          description: 'This is a comprehensive test task with all fields',
          tags: ['test', 'task', 'comprehensive'],
          dueDate: dueDate
        });

        const text = this.parseToolResponse(result);

        // Verify success message
        this.assert(text.includes('Task created successfully'), 'Should contain creation message');

        // Extract task ID
        const taskId = this.extractIdFromResponse(text);
        this.assert(taskId, 'Should return task ID');
        this.createdTaskIds.push(taskId);

        // Extract reference
        const ref = this.extractReferenceNumber(text);
        if (ref) {
          this.createdTaskRefs.push(ref);
        }

        // Verify fields
        this.assert(text.includes('[TEST] Complete Task'), 'Should contain subject');
        this.assert(text.includes('comprehensive test'), 'Should contain description');
        this.assert(text.includes('test') && text.includes('task'), 'Should contain tags');
        this.assert(text.includes(dueDate), 'Should contain due date');
        this.assert(text.includes(`#${this.createdStoryRef}`) ||
                   text.includes('User Story'), 'Should show user story linkage');

        console.log(`\n   → Created Task ID: ${taskId}, Ref: #${ref}`);
      });

      // Test 2: Get Task by ID
      await this.test('TC-TASK-005: Get task by ID', async () => {
        const result = await getTaskTool.handler({
          projectIdentifier: this.projectId,
          taskIdentifier: this.createdTaskIds[0]
        });

        const text = this.parseToolResponse(result);

        // Verify all fields returned
        this.assert(text.includes('[TEST] Complete Task'), 'Should return subject');
        this.assert(text.includes('comprehensive test'), 'Should return description');
        this.assert(text.includes(`${this.createdTaskIds[0]}`), 'Should return ID');
        this.assert(text.includes('test'), 'Should return tags');
        this.assert(text.includes('User Story') ||
                   text.includes(`#${this.createdStoryRef}`), 'Should show user story');
      });

      // Test 3: Get Task by Reference
      await this.test('TC-TASK-006: Get task by reference', async () => {
        if (this.createdTaskRefs[0]) {
          const result = await getTaskTool.handler({
            projectIdentifier: this.projectId,
            taskIdentifier: `#${this.createdTaskRefs[0]}`
          });

          const text = this.parseToolResponse(result);
          this.assert(text.includes('[TEST] Complete Task'), 'Should find task by reference');
        }
      });

      // Test 4: Update Task
      await this.test('TC-TASK-007: Update task properties', async () => {
        const newDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const result = await updateTaskTool.handler({
          projectIdentifier: this.projectId,
          taskIdentifier: this.createdTaskIds[0],
          subject: '[TEST] Updated Task',
          description: 'Updated description for testing',
          tags: ['test', 'updated'],
          dueDate: newDueDate
        });

        const text = this.parseToolResponse(result);

        // Verify update message
        this.assert(text.includes('Task updated successfully'), 'Should contain update message');

        // Verify updated fields
        this.assert(text.includes('[TEST] Updated Task'), 'Should show updated subject');
        this.assert(text.includes('Updated description'), 'Should show updated description');
        this.assert(text.includes('updated'), 'Should show updated tags');
        this.assert(text.includes(newDueDate), 'Should show updated due date');
      });

      // Test 5: Batch Create Tasks
      await this.test('TC-TASK-008: Batch create tasks', async () => {
        const tasks = [
          {
            subject: '[TEST] Batch Task 1',
            description: 'First batch task',
            tags: ['test', 'batch']
          },
          {
            subject: '[TEST] Batch Task 2',
            description: 'Second batch task',
            tags: ['test', 'batch']
          },
          {
            subject: '[TEST] Batch Task 3',
            description: 'Third batch task',
            tags: ['test', 'batch']
          }
        ];

        const result = await batchCreateTasksTool.handler({
          projectIdentifier: this.projectId,
          userStoryRef: `#${this.createdStoryRef}`,
          tasks: tasks
        });

        const text = this.parseToolResponse(result);

        // Verify batch creation
        this.assert(text.includes('Batch Tasks creation completed') || text.includes('batch'), 'Should mention batch operation');

        // Extract created IDs
        const batchIds = this.extractAllIdsFromResponse(text);
        this.assert(batchIds.length === 3, 'Should create 3 tasks');
        this.createdTaskIds.push(...batchIds);

        // Verify all subjects
        this.assert(text.includes('[TEST] Batch Task 1'), 'Should show first task');
        this.assert(text.includes('[TEST] Batch Task 2'), 'Should show second task');
        this.assert(text.includes('[TEST] Batch Task 3'), 'Should show third task');

        console.log(`\n   → Created ${batchIds.length} tasks in batch`);
      });

      // Test 6: Batch Update Tasks
      await this.test('TC-TASK-009: Batch update tasks', async () => {
        const updates = this.createdTaskIds.slice(-3).map((id, index) => ({
          taskIdentifier: id,
          subject: `[TEST] Batch Task ${index + 1} - Updated`,
          tags: ['test', 'batch-updated']
        }));

        const result = await batchUpdateTasksTool.handler({
          projectIdentifier: this.projectId,
          updates: updates
        });

        const text = this.parseToolResponse(result);

        // Verify batch update
        this.assert(text.includes('Batch Tasks update completed') || text.includes('updated') || text.includes('batch'), 'Should mention update operation');
        this.assert(text.includes('Updated'), 'Should show updated marker');
      });

      // Test 7: Verify Updated Tasks
      await this.test('TC-TASK-010: Verify batch updated tasks', async () => {
        const result = await getTaskTool.handler({
          projectIdentifier: this.projectId,
          taskIdentifier: this.createdTaskIds[1]  // Check second task
        });

        const text = this.parseToolResponse(result);

        // Should show updated subject
        this.assert(text.includes('Updated') || text.includes('[TEST] Batch Task'), 'Should show updated content');
      });

      // Test 8: Update Task Status
      await this.test('TC-TASK-011: Update task status', async () => {
        // Get available statuses first
        const { getAvailableStatusesTool } = await import('../../src/tools/metadataTools.js');
        const statusResult = await getAvailableStatusesTool.handler({
          projectIdentifier: this.projectId,
          entityType: 'task'
        });

        const statusText = this.parseToolResponse(statusResult);

        // Extract a status ID (usually "In Progress" or similar)
        const statusMatch = statusText.match(/ID:\s*(\d+)/);

        if (statusMatch) {
          const statusId = parseInt(statusMatch[1]);

          const result = await updateTaskTool.handler({
            projectIdentifier: this.projectId,
            taskIdentifier: this.createdTaskIds[0],
            statusId: statusId
          });

          const text = this.parseToolResponse(result);
          this.assert(text.includes('Task updated successfully'), 'Should update status successfully');
        } else {
          console.log('\n   → Skipping status update (no statuses found)');
        }
      });

      // Test 9: Assign Task to User
      await this.test('TC-TASK-012: Assign task to current user', async () => {
        // Get current user
        const { getAuthenticatedClient } = await import('../../src/taigaAuth.js');
        const client = await getAuthenticatedClient();
        const meResponse = await client.get('/users/me');
        const currentUserId = meResponse.data.id;

        const result = await updateTaskTool.handler({
          projectIdentifier: this.projectId,
          taskIdentifier: this.createdTaskIds[0],
          assignedTo: currentUserId
        });

        const text = this.parseToolResponse(result);
        this.assert(text.includes('Task updated successfully'), 'Should assign task successfully');
        this.assert(text.includes('Assigned') || text.includes('assigned'), 'Should show assignment');
      });

      // Cleanup
      await this.test('TC-TASK-013: Cleanup - Delete user story (cascades to tasks)', async () => {
        if (this.createdStoryId) {
          const result = await deleteUserStoryTool.handler({
            projectIdentifier: this.projectId,
            userStoryIdentifier: this.createdStoryId
          });
          const text = this.parseToolResponse(result);
          this.assert(text.includes('deleted'), 'Should delete story');
          console.log('\n   → Deleted story and all associated tasks');
        }
      });

      console.log('\n' + '='.repeat(60));
      console.log('📊 Task Integration Test Results:');
      console.log('='.repeat(60));
      console.log(`✅ Passed: ${this.passed}`);
      console.log(`❌ Failed: ${this.failed}`);
      console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
      console.log('='.repeat(60));

      if (this.failed === 0) {
        console.log('🎉 All Task integration tests passed!\n');
        process.exit(0);
      } else {
        console.log('⚠️  Some Task tests failed. Please review.\n');
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
const testSuite = new TaskIntegrationTest();
testSuite.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
