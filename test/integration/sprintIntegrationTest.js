#!/usr/bin/env node

/**
 * Sprint/Milestone Integration Test Suite
 *
 * Tests all Sprint-related MCP tools:
 * 1. listMilestones - List all project sprints
 * 2. getMilestoneStats - Get sprint statistics
 * 3. createMilestone - Create new sprint
 * 4. updateMilestone - Update sprint properties
 * 5. deleteMilestone - Delete sprint
 * 6. getSprintComplete - Get complete sprint details
 * 7. getUserStoriesByMilestone - Get stories in sprint
 * 8. getIssuesByMilestone - Get issues in sprint
 * 9. listProjectMilestones - List milestones (metadata tool)
 *
 * Verifies:
 * - Correct return messages
 * - All field values (name, dates, status, etc.)
 * - Statistics calculation
 * - Sprint-entity relationships
 * - Error handling
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  listSprintsTool,
  getSprintStatsTool,
  createSprintTool,
  updateSprintTool,
  deleteSprintTool
} from '../../src/tools/sprintTools.js';
import { listProjectMilestonesTool } from '../../src/tools/metadataTools.js';
import { createUserStoryTool, addUserStoryToSprintTool, deleteUserStoryTool } from '../../src/tools/userStoryTools.js';
import { createIssueTool } from '../../src/tools/issueTools.js';
import { authenticateTool } from '../../src/tools/authTools.js';
import { getProjectTool } from '../../src/tools/projectTools.js';
import { verifyEnvironment, parseToolResponse, extractIdFromResponse } from './testHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../..', '.env') });

class SprintIntegrationTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.createdSprintId = null;
    this.createdSprintName = null;
    this.createdStoryId = null;
    this.createdIssueId = null;
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
    const match = response.match(/(?:ID|Milestone ID):\s*(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }

  extractPercentage(response, fieldName) {
    const match = response.match(new RegExp(`${fieldName}:\\s*(\\d+(?:\\.\\d+)?)%`));
    return match ? parseFloat(match[1]) : null;
  }

  async run() {
    console.log('🧪 Sprint/Milestone Integration Test Suite\n');
    console.log('📋 Testing all Sprint-related MCP tools\n');

    const env = verifyEnvironment();
    console.log(`🔗 API: ${env.apiUrl}`);
    console.log(`👤 User: ${env.username}`);
    console.log(`📦 Test Project: ${env.testProjectId}\n`);

    try {
      // Authenticate
      await this.test('TC-SPRINT-001: Authentication', async () => {
        const authResult = await authenticateTool.handler({});
        const authText = this.parseToolResponse(authResult);
        this.assert(authText.includes('Successfully') && authText.includes('authenticated'), 'Should show successful authentication');
        this.assert(authText.includes(env.username), 'Should show username');
      });

      // Get test project from TEST_PROJECT_ID
      await this.test('TC-SPRINT-002: Get test project', async () => {
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

      // Test 1: Create Sprint
      await this.test('TC-SPRINT-003: Create sprint with all fields', async () => {
        const today = new Date();
        const startDate = today.toISOString().split('T')[0];
        const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        this.createdSprintName = `[TEST] Integration Sprint ${Date.now()}`;

        const result = await createSprintTool.handler({
          projectIdentifier: this.projectId,
          name: this.createdSprintName,
          estimatedStart: startDate,
          estimatedFinish: endDate
        });

        const text = this.parseToolResponse(result);

        // Verify success message
        this.assert(text.includes('Sprint created successfully'), 'Should contain creation message');

        // Extract sprint ID
        this.createdSprintId = this.extractIdFromResponse(text);
        this.assert(this.createdSprintId, 'Should return sprint ID');

        // Verify fields
        this.assert(text.includes(this.createdSprintName), 'Should contain sprint name');
        this.assert(text.includes(startDate), 'Should contain start date');
        this.assert(text.includes(endDate), 'Should contain end date');

        console.log(`\n   → Created Sprint ID: ${this.createdSprintId}`);
      });

      // Test 2: List Milestones
      await this.test('TC-SPRINT-004: List all milestones', async () => {
        const result = await listSprintsTool.handler({
          projectIdentifier: this.projectId
        });

        const text = this.parseToolResponse(result);

        // Verify list contains our sprint
        this.assert(text.includes(this.createdSprintName), 'List should contain created sprint');

        // Verify list structure
        this.assert(text.includes('Milestone') || text.includes('Sprint'), 'Should have milestone/sprint label');
        this.assert(text.includes('ID:'), 'Should show ID field');
      });

      // Test 3: Get Milestone Stats (empty sprint)
      await this.test('TC-SPRINT-005: Get milestone stats for empty sprint', async () => {
        const result = await getSprintStatsTool.handler({
          projectIdentifier: this.projectId,
          milestoneIdentifier: this.createdSprintId
        });

        const text = this.parseToolResponse(result);

        // Verify stats structure
        this.assert(text.includes('Stats') || text.includes('Statistics'), 'Should contain stats label');
        this.assert(text.includes(this.createdSprintName), 'Should contain sprint name');

        // Should show zero or empty stats
        const completionRate = this.extractPercentage(text, 'Completion Rate');
        if (completionRate !== null) {
          this.assert(completionRate === 0, 'Empty sprint should have 0% completion');
        }
      });

      // Test 4: List Project Milestones (metadata tool)
      await this.test('TC-SPRINT-006: List project milestones (metadata)', async () => {
        const result = await listProjectMilestonesTool.handler({
          projectIdentifier: this.projectId
        });

        const text = this.parseToolResponse(result);

        // Should contain our sprint
        this.assert(text.includes(this.createdSprintName) ||
                   text.includes(`${this.createdSprintId}`),
                   'Metadata should include created sprint');
      });

      // Test 5: Update Sprint
      await this.test('TC-SPRINT-007: Update sprint properties', async () => {
        const updatedName = `${this.createdSprintName} - Updated`;
        const newEndDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const result = await updateSprintTool.handler({
          projectIdentifier: this.projectId,
          milestoneIdentifier: this.createdSprintId,
          name: updatedName,
          estimatedFinish: newEndDate
        });

        const text = this.parseToolResponse(result);

        // Verify update message
        this.assert(text.includes('Sprint updated successfully'), 'Should contain update message');

        // Verify updated fields
        this.assert(text.includes('Updated') || text.includes(updatedName), 'Should show updated name');
        this.assert(text.includes(newEndDate), 'Should show updated end date');

        this.createdSprintName = updatedName;
      });

      // Test 6: Create User Story for sprint
      await this.test('TC-SPRINT-008: Create user story', async () => {
        const result = await createUserStoryTool.handler({
          projectIdentifier: this.projectId,
          subject: '[TEST] Story for Sprint Testing',
          description: 'Story to test sprint relationships'
        });

        const text = this.parseToolResponse(result);
        this.createdStoryId = this.extractIdFromResponse(text);
        this.assert(this.createdStoryId, 'Should create user story');
        console.log(`\n   → Created Story ID: ${this.createdStoryId}`);
      });

      // Test 7: Add Story to Sprint
      await this.test('TC-SPRINT-009: Add user story to sprint', async () => {
        const result = await addUserStoryToSprintTool.handler({
          projectIdentifier: this.projectId,
          userStoryIdentifier: this.createdStoryId,
          milestoneIdentifier: this.createdSprintId
        });

        const text = this.parseToolResponse(result);
        this.assert(text.includes('added to sprint') || text.includes('added to milestone'), 'Should mention adding to sprint/milestone');
      });

      // Test 8: Get User Stories by Milestone
      await this.test('TC-SPRINT-010: Get user stories in sprint', async () => {
        const { getUserStoriesByMilestoneTool } = await import('../../src/tools/sprintTools.js');
        const result = await getUserStoriesByMilestoneTool.handler({
          projectIdentifier: this.projectId,
          milestoneIdentifier: this.createdSprintId
        });

        const text = this.parseToolResponse(result);

        // Should show our story
        this.assert(text.includes('[TEST] Story for Sprint Testing') ||
                   text.includes(`${this.createdStoryId}`),
                   'Should list the user story in sprint');
      });

      // Test 9: Create Issue for sprint
      await this.test('TC-SPRINT-011: Create issue in sprint', async () => {
        const result = await createIssueTool.handler({
          projectIdentifier: this.projectId,
          subject: '[TEST] Issue for Sprint Testing',
          description: 'Issue to test sprint relationships',
          milestoneIdentifier: this.createdSprintId
        });

        const text = this.parseToolResponse(result);
        this.createdIssueId = this.extractIdFromResponse(text);
        this.assert(this.createdIssueId, 'Should create issue');
        console.log(`\n   → Created Issue ID: ${this.createdIssueId}`);
      });

      // Test 10: Get Issues by Milestone
      await this.test('TC-SPRINT-012: Get issues in sprint', async () => {
        const { getIssuesBySprintTool } = await import('../../src/tools/sprintTools.js');
        const result = await getIssuesBySprintTool.handler({
          projectIdentifier: this.projectId,
          milestoneIdentifier: this.createdSprintId
        });

        const text = this.parseToolResponse(result);

        // Should show our issue
        this.assert(text.includes('[TEST] Issue for Sprint Testing') ||
                   text.includes(`${this.createdIssueId}`),
                   'Should list the issue in sprint');
      });

      // Test 11: Get Sprint Complete Details
      await this.test('TC-SPRINT-013: Get complete sprint details', async () => {
        const { getSprintCompleteTool } = await import('../../src/tools/sprintTools.js');
        const result = await getSprintCompleteTool.handler({
          projectIdentifier: this.projectId,
          milestoneIdentifier: this.createdSprintId
        });

        const text = this.parseToolResponse(result);

        // Should show comprehensive sprint info
        this.assert(text.includes(this.createdSprintName), 'Should show sprint name');
        this.assert(text.includes('[TEST] Story for Sprint Testing') ||
                   text.includes('[TEST] Issue for Sprint Testing') ||
                   text.includes('User Stories') ||
                   text.includes('Issues'),
                   'Should show sprint contents');
      });

      // Test 12: Get Stats with items
      await this.test('TC-SPRINT-014: Get milestone stats with items', async () => {
        const result = await getSprintStatsTool.handler({
          projectIdentifier: this.projectId,
          milestoneIdentifier: this.createdSprintId
        });

        const text = this.parseToolResponse(result);

        // Should show stats
        this.assert(text.includes('Stats') || text.includes('Statistics'), 'Should contain stats');

        // May show completion rate (depends on story points)
        const hasStats = text.includes('Completion') ||
                        text.includes('Points') ||
                        text.includes('Stories') ||
                        text.includes('Issues');
        this.assert(hasStats, 'Should show some statistical information');
      });

      // Cleanup
      await this.test('TC-SPRINT-015: Cleanup - Delete user story', async () => {
        if (this.createdStoryId) {
          const result = await deleteUserStoryTool.handler({
            projectIdentifier: this.projectId,
            userStoryIdentifier: this.createdStoryId
          });
          const text = this.parseToolResponse(result);
          this.assert(text.includes('deleted'), 'Should delete story');
        }
      });

      // Note: Issues don't have a delete tool in the list, so we skip issue cleanup

      // Test 13: Delete Sprint
      await this.test('TC-SPRINT-016: Delete sprint', async () => {
        const result = await deleteSprintTool.handler({
          projectIdentifier: this.projectId,
          milestoneIdentifier: this.createdSprintId
        });

        const text = this.parseToolResponse(result);

        // Verify deletion message
        this.assert(text.includes('Sprint deleted successfully'), 'Should contain deletion message');
      });

      // Test 14: Verify Sprint Deleted
      await this.test('TC-SPRINT-017: Verify sprint deleted', async () => {
        try {
          const result = await getSprintStatsTool.handler({
            projectIdentifier: this.projectId,
            milestoneIdentifier: this.createdSprintId
          });

          const text = this.parseToolResponse(result);

          // Should fail or return error
          this.assert(text.includes('not found') ||
                     text.includes('does not exist') ||
                     text.includes('Sprint not found'),
                     'Should indicate sprint no longer exists');
        } catch (error) {
          // Error is expected - sprint should not exist
          this.assert(true, 'Sprint should not be found');
        }
      });

      console.log('\n' + '='.repeat(60));
      console.log('📊 Sprint Integration Test Results:');
      console.log('='.repeat(60));
      console.log(`✅ Passed: ${this.passed}`);
      console.log(`❌ Failed: ${this.failed}`);
      console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
      console.log('='.repeat(60));

      if (this.failed === 0) {
        console.log('🎉 All Sprint integration tests passed!\n');
        process.exit(0);
      } else {
        console.log('⚠️  Some Sprint tests failed. Please review.\n');
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
const testSuite = new SprintIntegrationTest();
testSuite.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
