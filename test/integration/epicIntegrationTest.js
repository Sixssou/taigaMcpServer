#!/usr/bin/env node

/**
 * Epic Integration Test Suite
 *
 * Tests all Epic-related MCP tools:
 * 1. createEpic - Create new epic with validation
 * 2. listEpics - List all project epics
 * 3. getEpic - Get epic details by ID/reference
 * 4. updateEpic - Update epic properties
 * 5. linkStoryToEpic - Link user story to epic
 * 6. unlinkStoryFromEpic - Unlink user story from epic
 *
 * Verifies:
 * - Correct return messages
 * - All field values (subject, description, color, etc.)
 * - Relationships (linked stories)
 * - Error handling
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  createEpicTool,
  listEpicsTool,
  getEpicTool,
  updateEpicTool,
  linkStoryToEpicTool,
  unlinkStoryFromEpicTool
} from '../../src/tools/epicTools.js';
import { createUserStoryTool, deleteUserStoryTool } from '../../src/tools/userStoryTools.js';
import { authenticateTool } from '../../src/tools/authTools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../..', '.env') });

class EpicIntegrationTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.createdEpicId = null;
    this.createdEpicRef = null;
    this.createdStoryId = null;
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
    const match = response.match(/ID:\s*(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }

  extractReferenceNumber(response) {
    const match = response.match(/(?:Reference:\s*)?#(\d+)/);
    return match ? match[1] : null;
  }

  async run() {
    console.log('🧪 Epic Integration Test Suite\n');
    console.log('📋 Testing all Epic-related MCP tools\n');

    if (!process.env.TAIGA_API_URL || !process.env.TAIGA_USERNAME || !process.env.TAIGA_PASSWORD) {
      console.error('❌ Missing Taiga credentials');
      console.error('   Required: TAIGA_API_URL, TAIGA_USERNAME, TAIGA_PASSWORD');
      process.exit(1);
    }

    console.log(`🔗 API: ${process.env.TAIGA_API_URL}`);
    console.log(`👤 User: ${process.env.TAIGA_USERNAME}\n`);

    try {
      // Authenticate first
      await this.test('TC-EPIC-001: Authentication', async () => {
        const authResult = await authenticateTool.handler({});
        const authText = this.parseToolResponse(authResult);
        this.assert(authText.includes('✅'), 'Authentication should succeed');
        this.assert(authText.includes('authenticated'), 'Should contain authentication message');
      });

      // Get project for testing
      await this.test('TC-EPIC-002: Get project ID', async () => {
        const { listProjectsTool } = await import('../../src/tools/projectTools.js');
        const projectsResult = await listProjectsTool.handler({});
        const projectsText = this.parseToolResponse(projectsResult);
        const idMatch = projectsText.match(/ID:\s*(\d+)/);
        this.assert(idMatch, 'Should find at least one project');
        this.projectId = parseInt(idMatch[1]);
        console.log(`\n   → Using project ID: ${this.projectId}`);
      });

      // Test 1: Create Epic
      await this.test('TC-EPIC-003: Create epic with all fields', async () => {
        const result = await createEpicTool.handler({
          projectIdentifier: this.projectId,
          subject: '[TEST] Integration Test Epic',
          description: 'This is a comprehensive test epic for integration testing',
          color: '#FF5733',
          tags: ['test', 'integration']
        });

        const text = this.parseToolResponse(result);

        // Verify success message
        this.assert(text.includes('✅'), 'Should contain success indicator');
        this.assert(text.includes('Epic created'), 'Should contain creation message');

        // Extract and store epic ID
        this.createdEpicId = this.extractIdFromResponse(text);
        this.assert(this.createdEpicId, 'Should return epic ID');

        // Extract reference number
        this.createdEpicRef = this.extractReferenceNumber(text);
        this.assert(this.createdEpicRef, 'Should return reference number');

        // Verify fields in response
        this.assert(text.includes('[TEST] Integration Test Epic'), 'Should contain subject');
        this.assert(text.includes('comprehensive test epic'), 'Should contain description');
        this.assert(text.includes('#FF5733'), 'Should contain color');
        this.assert(text.includes('test') && text.includes('integration'), 'Should contain tags');

        console.log(`\n   → Created Epic ID: ${this.createdEpicId}, Ref: #${this.createdEpicRef}`);
      });

      // Test 2: List Epics
      await this.test('TC-EPIC-004: List all project epics', async () => {
        const result = await listEpicsTool.handler({
          projectIdentifier: this.projectId
        });

        const text = this.parseToolResponse(result);

        // Verify list contains our created epic
        this.assert(text.includes('[TEST] Integration Test Epic'), 'List should contain created epic');
        this.assert(text.includes(`#${this.createdEpicRef}`), 'Should contain epic reference');

        // Verify list structure
        this.assert(text.includes('Epic'), 'Should have epic label');
        this.assert(text.includes('Color:'), 'Should show color field');
      });

      // Test 3: Get Epic by ID
      await this.test('TC-EPIC-005: Get epic by ID', async () => {
        const result = await getEpicTool.handler({
          projectIdentifier: this.projectId,
          epicIdentifier: this.createdEpicId
        });

        const text = this.parseToolResponse(result);

        // Verify all fields are returned
        this.assert(text.includes('[TEST] Integration Test Epic'), 'Should return subject');
        this.assert(text.includes('comprehensive test epic'), 'Should return description');
        this.assert(text.includes('#FF5733'), 'Should return color');
        this.assert(text.includes('test'), 'Should return tags');
        this.assert(text.includes(`ID: ${this.createdEpicId}`), 'Should return ID');
        this.assert(text.includes(`#${this.createdEpicRef}`), 'Should return reference');
      });

      // Test 4: Get Epic by Reference
      await this.test('TC-EPIC-006: Get epic by reference number', async () => {
        const result = await getEpicTool.handler({
          projectIdentifier: this.projectId,
          epicIdentifier: `#${this.createdEpicRef}`
        });

        const text = this.parseToolResponse(result);
        this.assert(text.includes('[TEST] Integration Test Epic'), 'Should find epic by reference');
        this.assert(text.includes(`ID: ${this.createdEpicId}`), 'Should return correct ID');
      });

      // Test 5: Update Epic
      await this.test('TC-EPIC-007: Update epic properties', async () => {
        const result = await updateEpicTool.handler({
          projectIdentifier: this.projectId,
          epicIdentifier: this.createdEpicId,
          subject: '[TEST] Updated Epic Title',
          description: 'Updated description for testing',
          color: '#33FF57',
          tags: ['test', 'updated']
        });

        const text = this.parseToolResponse(result);

        // Verify update message
        this.assert(text.includes('✅'), 'Should contain success indicator');
        this.assert(text.includes('updated'), 'Should contain update message');

        // Verify updated fields
        this.assert(text.includes('[TEST] Updated Epic Title'), 'Should show updated subject');
        this.assert(text.includes('Updated description'), 'Should show updated description');
        this.assert(text.includes('#33FF57'), 'Should show updated color');
        this.assert(text.includes('updated'), 'Should show updated tags');
      });

      // Test 6: Create User Story for linking
      await this.test('TC-EPIC-008: Create user story for linking', async () => {
        const result = await createUserStoryTool.handler({
          projectIdentifier: this.projectId,
          subject: '[TEST] Story for Epic Linking',
          description: 'Test story to link to epic'
        });

        const text = this.parseToolResponse(result);
        this.createdStoryId = this.extractIdFromResponse(text);
        this.assert(this.createdStoryId, 'Should create user story');
        console.log(`\n   → Created Story ID: ${this.createdStoryId}`);
      });

      // Test 7: Link Story to Epic
      await this.test('TC-EPIC-009: Link user story to epic', async () => {
        const result = await linkStoryToEpicTool.handler({
          projectIdentifier: this.projectId,
          userStoryIdentifier: this.createdStoryId,
          epicIdentifier: this.createdEpicId
        });

        const text = this.parseToolResponse(result);

        // Verify link message
        this.assert(text.includes('✅'), 'Should contain success indicator');
        this.assert(text.includes('linked to epic') || text.includes('linked'), 'Should contain link message');
      });

      // Test 8: Verify Epic shows linked story
      await this.test('TC-EPIC-010: Verify epic shows linked story', async () => {
        const result = await getEpicTool.handler({
          projectIdentifier: this.projectId,
          epicIdentifier: this.createdEpicId
        });

        const text = this.parseToolResponse(result);

        // Should show linked stories
        this.assert(text.includes('[TEST] Story for Epic Linking') ||
                   text.includes('User Stories:') ||
                   text.includes('stories'),
                   'Should show linked user story');
      });

      // Test 9: Unlink Story from Epic
      await this.test('TC-EPIC-011: Unlink user story from epic', async () => {
        const result = await unlinkStoryFromEpicTool.handler({
          projectIdentifier: this.projectId,
          userStoryIdentifier: this.createdStoryId
        });

        const text = this.parseToolResponse(result);

        // Verify unlink message
        this.assert(text.includes('✅'), 'Should contain success indicator');
        this.assert(text.includes('unlinked') || text.includes('removed'), 'Should contain unlink message');
      });

      // Test 10: Verify Epic no longer shows story
      await this.test('TC-EPIC-012: Verify story unlinked from epic', async () => {
        const result = await getEpicTool.handler({
          projectIdentifier: this.projectId,
          epicIdentifier: this.createdEpicId
        });

        const text = this.parseToolResponse(result);

        // Should not show the story anymore or show empty list
        this.assert(!text.includes('[TEST] Story for Epic Linking') ||
                   text.includes('No user stories') ||
                   text.includes('0 stories'),
                   'Should not show unlinked story');
      });

      // Cleanup
      await this.test('TC-EPIC-013: Cleanup - Delete user story', async () => {
        if (this.createdStoryId) {
          const result = await deleteUserStoryTool.handler({
            projectIdentifier: this.projectId,
            userStoryIdentifier: this.createdStoryId
          });
          const text = this.parseToolResponse(result);
          this.assert(text.includes('✅') || text.includes('deleted'), 'Should delete story');
        }
      });

      // Note: We don't delete the epic as there's a deleteEpic tool but it's not in the initial list
      // The epic will remain for manual cleanup

      console.log('\n' + '='.repeat(60));
      console.log('📊 Epic Integration Test Results:');
      console.log('='.repeat(60));
      console.log(`✅ Passed: ${this.passed}`);
      console.log(`❌ Failed: ${this.failed}`);
      console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
      console.log('='.repeat(60));

      if (this.failed === 0) {
        console.log('🎉 All Epic integration tests passed!\n');
        process.exit(0);
      } else {
        console.log('⚠️  Some Epic tests failed. Please review.\n');
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
const testSuite = new EpicIntegrationTest();
testSuite.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
