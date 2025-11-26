#!/usr/bin/env node

/**
 * Task Integration Test
 *
 * Tests the complete lifecycle of tasks:
 * 1. Create a user story (needed to attach tasks)
 * 2. Create a task
 * 3. Get the task (verify data)
 * 4. Update the task (subject, description, status, tags, assignee, due date)
 * 5. Get again to verify changes
 * 6. Clean up (delete user story)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createTaskTool, getTaskTool, updateTaskTool } from '../src/tools/taskTools.js';
import { createUserStoryTool, deleteUserStoryTool } from '../src/tools/userStoryTools.js';
import { authenticateTool } from '../src/tools/authTools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

class TaskIntegrationTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.createdTaskRef = null;
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
    // Tool responses come as objects with content array
    if (response && response.content && Array.isArray(response.content)) {
      return response.content[0].text;
    }
    return response;
  }

  extractReferenceNumber(response) {
    // Extract #123 format or "Reference: #123"
    const match = response.match(/(?:Reference:\s*)?#(\d+)/);
    return match ? match[1] : null;
  }

  async run() {
    console.log('🧪 Task Integration Test Suite\n');
    console.log('📋 Testing complete task lifecycle\n');

    // Check environment
    if (!process.env.TAIGA_API_URL || !process.env.TAIGA_USERNAME || !process.env.TAIGA_PASSWORD) {
      console.error('❌ Missing Taiga credentials in .env file');
      console.error('   Required: TAIGA_API_URL, TAIGA_USERNAME, TAIGA_PASSWORD');
      process.exit(1);
    }

    console.log(`🔗 API: ${process.env.TAIGA_API_URL}`);
    console.log(`👤 User: ${process.env.TAIGA_USERNAME}\n`);

    try {
      // Authenticate first to initialize the auth token
      console.log('🔐 Authenticating with Taiga API...');
      const authResult = await authenticateTool.handler({
        username: process.env.TAIGA_USERNAME,
        password: process.env.TAIGA_PASSWORD
      });
      const authResponse = this.parseToolResponse(authResult);
      if (!authResponse.includes('Successfully authenticated')) {
        console.error('❌ Authentication failed:', authResponse);
        process.exit(1);
      }
      console.log('✅ Authentication successful\n');

      // Get project ID from environment
      this.projectId = process.env.TEST_PROJECT_ID || process.env.TAIGA_PROJECT_ID;

      if (!this.projectId) {
        console.error('❌ No TEST_PROJECT_ID in .env file');
        process.exit(1);
      }

      // === Setup: Create User Story ===
      console.log('📝 Setup: Creating test user story...');
      const storyResult = await createUserStoryTool.handler({
        projectIdentifier: this.projectId,
        subject: '[TEST] User story for task tests',
        description: 'This user story is created for task integration tests.',
        tags: ['test', 'task-integration']
      });

      const storyResponse = this.parseToolResponse(storyResult);
      this.createdStoryRef = this.extractReferenceNumber(storyResponse);
      this.assert(this.createdStoryRef, 'Should create user story with reference number');
      console.log(`✅ Created user story: #${this.createdStoryRef}\n`);

      // === Test 1: Create Task ===
      await this.test('Create new task', async () => {
        const result = await createTaskTool.handler({
          projectIdentifier: this.projectId,
          userStoryIdentifier: `#${this.createdStoryRef}`,
          subject: '[TEST] Integration test task',
          description: 'This is a test task created by automated integration tests.',
          tags: ['test', 'integration']
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('✅') || response.includes('created'), 'Should indicate success');
        this.assert(response.includes('[TEST]'), 'Should contain test subject');

        // Extract reference number for later use
        this.createdTaskRef = this.extractReferenceNumber(response);
        this.assert(this.createdTaskRef, 'Should have a reference number');

        console.log(`\n      Created task: #${this.createdTaskRef}`);
      });

      // === Test 2: Get Task (by reference) ===
      await this.test('Get task by reference number', async () => {
        this.assert(this.createdTaskRef, 'Need task reference from previous test');

        const result = await getTaskTool.handler({
          taskIdentifier: `#${this.createdTaskRef}`,
          projectIdentifier: this.projectId
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('[TEST]'), 'Should contain test subject');
        this.assert(response.includes('Integration test task'), 'Should contain description');
        this.assert(response.includes(`#${this.createdStoryRef}`), 'Should reference the user story');
      });

      // === Test 3: Get Task (without # prefix) ===
      await this.test('Get task without # prefix', async () => {
        this.assert(this.createdTaskRef, 'Need task reference from previous test');

        const result = await getTaskTool.handler({
          taskIdentifier: this.createdTaskRef,
          projectIdentifier: this.projectId
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('[TEST]'), 'Should contain test subject');
      });

      // === Test 4: Update Task Subject and Description ===
      await this.test('Update task subject and description', async () => {
        this.assert(this.createdTaskRef, 'Need task reference from previous test');

        const result = await updateTaskTool.handler({
          taskIdentifier: `#${this.createdTaskRef}`,
          projectIdentifier: this.projectId,
          subject: '[TEST] UPDATED Integration test task',
          description: 'This description has been updated by the integration test.'
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('✅') || response.includes('updated'), 'Should indicate success');
        this.assert(response.includes('UPDATED'), 'Should contain updated subject');
      });

      // === Test 5: Verify Task Was Updated ===
      await this.test('Verify task was updated', async () => {
        this.assert(this.createdTaskRef, 'Need task reference from previous test');

        const result = await getTaskTool.handler({
          taskIdentifier: `#${this.createdTaskRef}`,
          projectIdentifier: this.projectId
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('UPDATED'), 'Should have updated subject');
        this.assert(response.includes('updated by the integration test'), 'Should have updated description');
      });

      // === Test 6: Update Task Tags ===
      await this.test('Update task tags', async () => {
        this.assert(this.createdTaskRef, 'Need task reference from previous test');

        const result = await updateTaskTool.handler({
          taskIdentifier: `#${this.createdTaskRef}`,
          projectIdentifier: this.projectId,
          tags: ['test', 'updated', 'integration-v2']
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('✅') || response.includes('updated'), 'Should indicate success');
      });

      // === Test 7: Update Task Status ===
      await this.test('Update task status', async () => {
        this.assert(this.createdTaskRef, 'Need task reference from previous test');

        const result = await updateTaskTool.handler({
          taskIdentifier: `#${this.createdTaskRef}`,
          projectIdentifier: this.projectId,
          status: 'In progress'
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('✅') || response.includes('updated'), 'Should indicate success');
        this.assert(response.includes('In progress') || response.includes('progress'), 'Should show status change');
      });

      // === Test 8: Update Task Due Date ===
      await this.test('Update task due date', async () => {
        this.assert(this.createdTaskRef, 'Need task reference from previous test');

        const result = await updateTaskTool.handler({
          taskIdentifier: `#${this.createdTaskRef}`,
          projectIdentifier: this.projectId,
          dueDate: '2025-12-31'
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('✅') || response.includes('updated'), 'Should indicate success');
        this.assert(response.includes('2025-12-31'), 'Should show due date');
      });

      // === Test 9: Assign Task to Current User ===
      await this.test('Assign task to current user', async () => {
        this.assert(this.createdTaskRef, 'Need task reference from previous test');

        // Use "6ssou" instead of TAIGA_USERNAME since the project member name differs
        const result = await updateTaskTool.handler({
          taskIdentifier: `#${this.createdTaskRef}`,
          projectIdentifier: this.projectId,
          assignedTo: '6ssou'  // Project member name
        });

        const response = this.parseToolResponse(result);
        // Check that it's not an error (more lenient check)
        this.assert(!response.includes('❌') && !response.includes('Failed'), 'Should not be an error');
        this.assert(!response.includes('Unassigned'), 'Should be assigned to someone');
      });

      // === Test 10: Unassign Task ===
      await this.test('Unassign task', async () => {
        this.assert(this.createdTaskRef, 'Need task reference from previous test');

        const result = await updateTaskTool.handler({
          taskIdentifier: `#${this.createdTaskRef}`,
          projectIdentifier: this.projectId,
          assignedTo: 'unassign'
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('✅') || response.includes('updated'), 'Should indicate success');
        this.assert(response.includes('Unassigned'), 'Should be unassigned');
      });

      // === Test 11: Handle Invalid Task Reference ===
      await this.test('Handle invalid task reference gracefully', async () => {
        const result = await getTaskTool.handler({
          taskIdentifier: '#999999',
          projectIdentifier: this.projectId
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('❌') || response.includes('not found'), 'Should indicate error');
      });

    } catch (error) {
      console.error('\n💥 Unexpected error during test execution:');
      console.error(error);
    } finally {
      // === Cleanup: Delete User Story (will cascade delete tasks) ===
      if (this.createdStoryRef) {
        console.log(`\n🧹 Cleanup: Deleting test user story #${this.createdStoryRef}...`);
        try {
          await deleteUserStoryTool.handler({
            userStoryIdentifier: `#${this.createdStoryRef}`,
            projectIdentifier: this.projectId
          });
          console.log('✅ Cleanup successful\n');
        } catch (error) {
          console.log(`⚠️  Cleanup failed: ${error.message}\n`);
        }
      }

      // Print summary
      console.log('============================================================');
      console.log('📊 Test Results Summary');
      console.log('============================================================');
      console.log(`✅ Passed: ${this.passed}`);
      console.log(`❌ Failed: ${this.failed}`);
      console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
      console.log('============================================================\n');

      if (this.failed === 0) {
        console.log('🎉 All task integration tests passed!');
        console.log('✅ Task lifecycle verified successfully');
        process.exit(0);
      } else {
        console.log('⚠️  Some tests failed. This may indicate issues with:');
        console.log('   - Task creation or updates');
        console.log('   - Reference number resolution');
        console.log('   - User assignment');
        console.log('   - API connectivity or permissions');
        process.exit(1);
      }
    }
  }
}

// Run the tests
const test = new TaskIntegrationTest();
test.run();
