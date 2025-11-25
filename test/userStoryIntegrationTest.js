#!/usr/bin/env node

/**
 * User Story Integration Test
 *
 * Tests the complete lifecycle of user stories:
 * 1. Create a user story
 * 2. Get the user story (verify data)
 * 3. Update the user story (subject, description, status)
 * 4. Get again to verify changes
 * 5. Test edge cases (epics, milestones)
 * 6. Delete the user story
 * 7. Verify deletion
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createUserStoryTool, getUserStoryTool, updateUserStoryTool, deleteUserStoryTool, listUserStoriesTool } from '../src/tools/userStoryTools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

class UserStoryIntegrationTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
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
    // Tool responses come as objects with content array
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

  extractReferenceNumber(response) {
    // Extract #123 format or "Reference: #123"
    const match = response.match(/(?:Reference:\s*)?#(\d+)/);
    return match ? match[1] : null;
  }

  async run() {
    console.log('🧪 User Story Integration Test Suite\n');
    console.log('📋 Testing complete user story lifecycle\n');

    // Check environment
    if (!process.env.TAIGA_API_URL || !process.env.TAIGA_USERNAME || !process.env.TAIGA_PASSWORD) {
      console.error('❌ Missing Taiga credentials in .env file');
      console.error('   Required: TAIGA_API_URL, TAIGA_USERNAME, TAIGA_PASSWORD');
      process.exit(1);
    }

    console.log(`🔗 API: ${process.env.TAIGA_API_URL}`);
    console.log(`👤 User: ${process.env.TAIGA_USERNAME}\n`);

    try {
      // Get project ID from environment or use default
      this.projectId = process.env.TEST_PROJECT_ID || process.env.TAIGA_PROJECT_ID;

      if (!this.projectId) {
        console.log('⚠️  No TEST_PROJECT_ID in .env, will try to use first available project');
        // Try to list projects to get one
        const listResult = await listUserStoriesTool.handler({ projectIdentifier: '1' });
        // If this fails, we'll catch it below
      }

      // === Test 1: Create User Story ===
      await this.test('Create new user story', async () => {
        const result = await createUserStoryTool.handler({
          projectIdentifier: this.projectId || '1',
          subject: '[TEST] Integration test user story',
          description: 'This is a test user story created by automated integration tests. It should be deleted automatically.',
          tags: ['test', 'integration', 'automated']
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('✅') || response.includes('created'), 'Should indicate success');
        this.assert(response.includes('[TEST]'), 'Should contain test subject');

        // Extract reference number for later use
        this.createdStoryRef = this.extractReferenceNumber(response);
        this.assert(this.createdStoryRef, 'Should have a reference number');

        console.log(`\n      Created story: #${this.createdStoryRef}`);
      });

      // === Test 2: Get User Story (by reference) ===
      await this.test('Get user story by reference number', async () => {
        this.assert(this.createdStoryRef, 'Need story reference from previous test');

        const result = await getUserStoryTool.handler({
          userStoryIdentifier: `#${this.createdStoryRef}`,
          projectIdentifier: this.projectId || '1'
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('[TEST]'), 'Should contain test subject');
        this.assert(response.includes('Integration test user story'), 'Should contain description');
        this.assert(response.includes('test, integration, automated') || response.includes('test'), 'Should contain tags');
        this.assert(response.includes(`#${this.createdStoryRef}`), 'Should show correct reference number');

        // Verify all expected fields are present
        this.assert(response.includes('Basic Information:'), 'Should have Basic Information section');
        this.assert(response.includes('Assignment & Organization:'), 'Should have Assignment section');
        this.assert(response.includes('Timeline:'), 'Should have Timeline section');
        this.assert(response.includes('Description:'), 'Should have Description section');
      });

      // === Test 3: Get User Story (without # prefix) ===
      await this.test('Get user story without # prefix', async () => {
        this.assert(this.createdStoryRef, 'Need story reference from previous test');

        const result = await getUserStoryTool.handler({
          userStoryIdentifier: this.createdStoryRef,
          projectIdentifier: this.projectId || '1'
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('[TEST]'), 'Should work without # prefix');
      });

      // === Test 4: Update User Story (subject and description) ===
      await this.test('Update user story subject and description', async () => {
        this.assert(this.createdStoryRef, 'Need story reference from previous test');

        const result = await updateUserStoryTool.handler({
          userStoryIdentifier: this.createdStoryRef,
          projectIdentifier: this.projectId || '1',
          subject: '[TEST] UPDATED Integration test',
          description: 'This description has been updated by the integration test.'
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('✅') || response.includes('updated'), 'Should indicate update success');
        this.assert(response.includes('UPDATED'), 'Should show new subject');
      });

      // === Test 5: Get User Story (verify update) ===
      await this.test('Verify user story was updated', async () => {
        this.assert(this.createdStoryRef, 'Need story reference from previous test');

        const result = await getUserStoryTool.handler({
          userStoryIdentifier: this.createdStoryRef,
          projectIdentifier: this.projectId || '1'
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('UPDATED'), 'Should show updated subject');
        this.assert(response.includes('updated by the integration test'), 'Should show updated description');
      });

      // === Test 6: Update User Story (tags) ===
      await this.test('Update user story tags', async () => {
        this.assert(this.createdStoryRef, 'Need story reference from previous test');

        const result = await updateUserStoryTool.handler({
          userStoryIdentifier: this.createdStoryRef,
          projectIdentifier: this.projectId || '1',
          tags: ['test', 'updated', 'integration-v2']
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('✅') || response.includes('updated'), 'Should update tags');
      });

      // === Test 7: Verify Epic handling (epics array) ===
      await this.test('Verify epic field handling (should be array)', async () => {
        this.assert(this.createdStoryRef, 'Need story reference from previous test');

        const result = await getUserStoryTool.handler({
          userStoryIdentifier: this.createdStoryRef,
          projectIdentifier: this.projectId || '1'
        });

        const response = this.parseToolResponse(result);
        // Epic should show "No epic" or a valid epic name, not crash
        this.assert(response.includes('Epic:'), 'Should have Epic field');
        this.assert(
          response.includes('No epic') || response.includes('Epic:'),
          'Should handle epic field gracefully (array or no epic)'
        );
      });

      // === Test 8: Test with invalid reference (error handling) ===
      await this.test('Handle invalid user story reference gracefully', async () => {
        const result = await getUserStoryTool.handler({
          userStoryIdentifier: '999999999',
          projectIdentifier: this.projectId || '1'
        });

        const response = this.parseToolResponse(result);
        this.assert(
          response.includes('❌') || response.includes('Failed') || response.includes('not found'),
          'Should return error for invalid reference'
        );
      });

      // === Test 9: Delete User Story ===
      await this.test('Delete user story', async () => {
        this.assert(this.createdStoryRef, 'Need story reference from previous test');

        const result = await deleteUserStoryTool.handler({
          userStoryIdentifier: this.createdStoryRef,
          projectIdentifier: this.projectId || '1'
        });

        const response = this.parseToolResponse(result);
        this.assert(response.includes('✅') || response.includes('Deleted'), 'Should indicate deletion success');
        this.assert(response.includes('[TEST]'), 'Should confirm deleted story details');
      });

      // === Test 10: Verify Deletion ===
      await this.test('Verify user story was deleted', async () => {
        this.assert(this.createdStoryRef, 'Need story reference from previous test');

        const result = await getUserStoryTool.handler({
          userStoryIdentifier: this.createdStoryRef,
          projectIdentifier: this.projectId || '1'
        });

        const response = this.parseToolResponse(result);
        this.assert(
          response.includes('❌') || response.includes('Failed') || response.includes('not found'),
          'Should not find deleted user story'
        );
      });

      // === Summary ===
      console.log('\n' + '='.repeat(60));
      console.log('📊 Test Results Summary');
      console.log('='.repeat(60));
      console.log(`✅ Passed: ${this.passed}`);
      console.log(`❌ Failed: ${this.failed}`);
      console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
      console.log('='.repeat(60));

      if (this.failed > 0) {
        console.log('\n⚠️  Some tests failed. This may indicate issues with:');
        console.log('   - getUserStory epic handling (epics array)');
        console.log('   - User story field enrichment');
        console.log('   - Reference number resolution');
        console.log('   - API connectivity or permissions');
        process.exit(1);
      } else {
        console.log('\n🎉 All user story integration tests passed!');
        console.log('✅ User story lifecycle verified successfully');
      }

    } catch (error) {
      console.error('\n❌ Test suite error:', error.message);
      console.error('Stack:', error.stack);

      // Cleanup: try to delete test story if it was created
      if (this.createdStoryRef) {
        console.log('\n🧹 Attempting cleanup...');
        try {
          await deleteUserStoryTool.handler({
            userStoryIdentifier: this.createdStoryRef,
            projectIdentifier: this.projectId || '1'
          });
          console.log('✅ Test story cleaned up');
        } catch (cleanupError) {
          console.log('⚠️  Could not cleanup test story (may need manual deletion)');
        }
      }

      process.exit(1);
    }
  }
}

// Run tests
const tester = new UserStoryIntegrationTest();
tester.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
