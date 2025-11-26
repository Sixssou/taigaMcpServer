#!/usr/bin/env node

/**
 * Advanced Search Integration Test
 *
 * Tests the complete advancedSearch functionality including:
 * - Field filtering (status, priority, milestone, epic, etc.)
 * - Operators (in:[], between:[], empty, notempty, etc.)
 * - Logical operators (AND, OR, grouping)
 * - Pagination and sorting
 * - Special values (null, *, temporal, wildcards)
 * - Validation and error handling
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { advancedSearchTool, queryHelpTool } from '../src/tools/advancedSearchTools.js';
import { createIssueTool, listIssuesTool } from '../src/tools/issueTools.js';
import { createUserStoryTool, deleteUserStoryTool } from '../src/tools/userStoryTools.js';
import { createSprintTool, deleteSprintTool } from '../src/tools/sprintTools.js';
import { authenticateTool } from '../src/tools/authTools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

class AdvancedSearchIntegrationTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.createdItems = {
      issues: [],
      stories: [],
      milestones: []
    };
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
      if (error.stack && process.env.DEBUG) {
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

  extractReferenceNumber(response) {
    const match = response.match(/(?:Reference:\s*)?#(\d+)/);
    return match ? match[1] : null;
  }

  async setupTestData() {
    console.log('\n📝 Setup: Creating test data...');

    // Create a test milestone (sprint)
    try {
      const milestoneResult = await createSprintTool.handler({
        projectIdentifier: this.projectId,
        name: 'TEST-SPRINT-SEARCH',
        estimatedStart: '2025-11-01',
        estimatedFinish: '2025-11-30'
      });
      const milestoneResponse = this.parseToolResponse(milestoneResult);
      console.log(`  ✅ Created test milestone`);
    } catch (error) {
      console.log(`  ⚠️  Could not create milestone: ${error.message}`);
    }

    // Create test user stories
    const storySubjects = [
      '[TEST-SEARCH] Story for advanced search - New',
      '[TEST-SEARCH] Story for advanced search - Ready',
      '[TEST-SEARCH] Story for advanced search - Done'
    ];

    for (const subject of storySubjects) {
      try {
        const result = await createUserStoryTool.handler({
          projectIdentifier: this.projectId,
          subject: subject,
          description: 'Test story for advanced search integration tests',
          tags: ['test', 'search', 'integration']
        });
        const ref = this.extractReferenceNumber(this.parseToolResponse(result));
        if (ref) {
          this.createdItems.stories.push(ref);
        }
      } catch (error) {
        console.log(`  ⚠️  Could not create story: ${error.message}`);
      }
    }
    console.log(`  ✅ Created ${this.createdItems.stories.length} test user stories`);

    // Create test issues with various properties
    const issueConfigs = [
      { subject: '[TEST-SEARCH] High priority New issue', status: 'New', priority: 'High' },
      { subject: '[TEST-SEARCH] Normal priority Ready issue', status: 'Ready', priority: 'Normal' },
      { subject: '[TEST-SEARCH] Low priority In progress issue', status: 'In progress', priority: 'Low' },
      { subject: '[TEST-SEARCH] Closed Done issue', status: 'Closed', priority: 'Normal' },
    ];

    for (const config of issueConfigs) {
      try {
        const result = await createIssueTool.handler({
          projectIdentifier: this.projectId,
          subject: config.subject,
          description: 'Test issue for advanced search integration tests',
          status: config.status,
          priority: config.priority,
          tags: ['test', 'search']
        });
        const ref = this.extractReferenceNumber(this.parseToolResponse(result));
        if (ref) {
          this.createdItems.issues.push(ref);
        }
      } catch (error) {
        console.log(`  ⚠️  Could not create issue: ${error.message}`);
      }
    }
    console.log(`  ✅ Created ${this.createdItems.issues.length} test issues\n`);
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleanup: Deleting test data...');

    // Delete test user stories
    for (const ref of this.createdItems.stories) {
      try {
        await deleteUserStoryTool.handler({
          userStoryIdentifier: `#${ref}`,
          projectIdentifier: this.projectId
        });
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    if (this.createdItems.stories.length > 0) {
      console.log(`  ✅ Deleted ${this.createdItems.stories.length} test user stories`);
    }

    // Delete test milestone
    try {
      await deleteSprintTool.handler({
        projectIdentifier: this.projectId,
        milestoneIdentifier: 'TEST-SPRINT-SEARCH'
      });
      console.log(`  ✅ Deleted test milestone`);
    } catch (error) {
      // Ignore errors during cleanup
    }

    console.log('');
  }

  async run() {
    console.log('🧪 Advanced Search Integration Test Suite\n');
    console.log('📋 Testing complete advanced search functionality\n');

    // Check environment
    if (!process.env.TAIGA_API_URL || !process.env.TAIGA_USERNAME || !process.env.TAIGA_PASSWORD) {
      console.error('❌ Missing Taiga credentials in .env file');
      console.error('   Required: TAIGA_API_URL, TAIGA_USERNAME, TAIGA_PASSWORD');
      process.exit(1);
    }

    console.log(`🔗 API: ${process.env.TAIGA_API_URL}`);
    console.log(`👤 User: ${process.env.TAIGA_USERNAME}\n`);

    try {
      // Authenticate
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

      // Get project ID
      this.projectId = process.env.TEST_PROJECT_ID || process.env.TAIGA_PROJECT_ID;
      if (!this.projectId) {
        console.error('❌ No TEST_PROJECT_ID in .env file');
        process.exit(1);
      }

      // Setup test data
      await this.setupTestData();

      // === CATEGORY 1: Simple Equality Tests ===
      console.log('📌 Category 1: Simple Equality (Bug Fixes)');

      await this.test('Search status:New', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'status:New',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
        this.assert(response.includes('Results') || response.includes('Found'), 'Should return results');
      });

      await this.test('Search status:Closed', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'status:Closed',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search priority:High (case sensitivity)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'priority:High',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      // === CATEGORY 2: Values with Spaces ===
      console.log('\n📌 Category 2: Values with Spaces');

      await this.test('Search status:"In progress" (with quotes)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'status:"In progress"',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search milestone:"TEST-SPRINT-SEARCH"', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'milestone:"TEST-SPRINT-SEARCH"',
          type: 'user_stories'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      // === CATEGORY 3: Milestone Field ===
      console.log('\n📌 Category 3: Milestone Field');

      await this.test('Search milestone:null (no sprint)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'milestone:null',
          type: 'user_stories'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search milestone:* (with sprint)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'milestone:*',
          type: 'user_stories'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search sprint:TEST-SPRINT-SEARCH (alias)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'sprint:TEST-SPRINT-SEARCH',
          type: 'user_stories'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      // === CATEGORY 4: Epic Field ===
      console.log('\n📌 Category 4: Epic Field');

      await this.test('Search epic:null (no epic)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'epic:null',
          type: 'user_stories'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search epic:* (with epic)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'epic:*',
          type: 'user_stories'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      // === CATEGORY 5: Boolean Fields ===
      console.log('\n📌 Category 5: Boolean Fields');

      await this.test('Search blocked:false', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'blocked:false',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search is_blocked:true (alias)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'is_blocked:true',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search closed:false', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'closed:false',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search is_closed:true (alias)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'is_closed:true',
          type: 'user_stories'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      // === CATEGORY 6: IN Operator ===
      console.log('\n📌 Category 6: IN Operator');

      await this.test('Search status:in:[New,Ready,Closed]', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'status:in:[New,Ready,Closed]',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
        this.assert(response.includes('Results') || response.includes('Found'), 'Should return results');
      });

      await this.test('Search priority:in:[High,Normal]', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'priority:in:[High,Normal]',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search tags:in:[test,search]', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'tags:in:[test,search]',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      // === CATEGORY 7: BETWEEN Operator ===
      console.log('\n📌 Category 7: BETWEEN Operator');

      await this.test('Search created:between:[2025-11-01,2025-12-31]', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'created:between:[2025-11-01,2025-12-31]',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      // === CATEGORY 8: Empty/NotEmpty Operators ===
      console.log('\n📌 Category 8: Empty/NotEmpty Operators');

      await this.test('Search assignee:empty (unassigned)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'assignee:empty',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search assignee:notempty (assigned)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'assignee:notempty',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search tags:empty (no tags)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'tags:empty',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search milestone:empty (no sprint)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'milestone:empty',
          type: 'user_stories'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      // === CATEGORY 9: Logical Operators (AND) ===
      console.log('\n📌 Category 9: Logical Operators - AND');

      await this.test('Search status:New AND priority:High', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'status:New AND priority:High',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search milestone:null AND assignee:empty', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'milestone:null AND assignee:empty',
          type: 'user_stories'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      // === CATEGORY 10: Logical Operators (OR) ===
      console.log('\n📌 Category 10: Logical Operators - OR');

      await this.test('Search status:New OR status:Ready', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'status:New OR status:Ready',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search priority:High OR priority:Low', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'priority:High OR priority:Low',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      // === CATEGORY 11: Complex Combinations ===
      console.log('\n📌 Category 11: Complex Combinations');

      await this.test('Search (status:New OR status:Ready) AND priority:High', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: '(status:New OR status:Ready) AND priority:High',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search milestone:* AND blocked:false AND assignee:notempty', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'milestone:* AND blocked:false AND assignee:notempty',
          type: 'user_stories'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      // === CATEGORY 12: Pagination and Sorting ===
      console.log('\n📌 Category 12: Pagination and Sorting');

      await this.test('Search status:New LIMIT 5', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'status:New LIMIT 5',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search * LIMIT 10 OFFSET 0', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: '* LIMIT 10 OFFSET 0',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search status:New ORDER BY created DESC', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'status:New ORDER BY created DESC',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search * ORDER BY priority ASC LIMIT 5', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: '* ORDER BY priority ASC LIMIT 5',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      // === CATEGORY 13: Query Help Tool ===
      console.log('\n📌 Category 13: Query Help Tool');

      await this.test('Get query help - syntax', async () => {
        const result = await queryHelpTool.handler({ topic: 'syntax' });
        const response = this.parseToolResponse(result);
        this.assert(response.includes('syntax') || response.includes('Syntax'), 'Should contain syntax help');
      });

      await this.test('Get query help - operators', async () => {
        const result = await queryHelpTool.handler({ topic: 'operators' });
        const response = this.parseToolResponse(result);
        this.assert(response.includes('operator') || response.includes('Operator'), 'Should contain operators help');
      });

      await this.test('Get query help - examples', async () => {
        const result = await queryHelpTool.handler({ topic: 'examples' });
        const response = this.parseToolResponse(result);
        this.assert(response.includes('example') || response.includes('Example'), 'Should contain examples');
      });

      await this.test('Get query help - fields', async () => {
        const result = await queryHelpTool.handler({ topic: 'fields' });
        const response = this.parseToolResponse(result);
        this.assert(response.includes('field') || response.includes('Field'), 'Should contain fields help');
      });

      // === CATEGORY 14: Error Handling ===
      console.log('\n📌 Category 14: Error Handling');

      await this.test('Handle invalid syntax gracefully', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'status::invalid::',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        // Should return error message, not crash
        this.assert(response.includes('❌') || response.includes('error') || response.includes('invalid'),
                   'Should indicate error');
      });

      await this.test('Handle non-existent field gracefully', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'nonexistentfield:value',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        // Should handle gracefully, might ignore unknown field or return error
        this.assert(response !== null && response !== undefined, 'Should return a response');
      });

      // === CATEGORY 15: Search with TEXT-SEARCH tag ===
      console.log('\n📌 Category 15: Tag-based Search');

      await this.test('Search tags:test (single tag)', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'tags:test',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

      await this.test('Search tags:search AND status:New', async () => {
        const result = await advancedSearchTool.handler({
          projectIdentifier: this.projectId,
          query: 'tags:search AND status:New',
          type: 'issues'
        });
        const response = this.parseToolResponse(result);
        this.assert(!response.includes('❌'), 'Should not be an error');
      });

    } catch (error) {
      console.error('\n💥 Unexpected error during test execution:');
      console.error(error);
    } finally {
      // Cleanup
      await this.cleanupTestData();

      // Print summary
      console.log('============================================================');
      console.log('📊 Test Results Summary');
      console.log('============================================================');
      console.log(`✅ Passed: ${this.passed}`);
      console.log(`❌ Failed: ${this.failed}`);
      console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
      console.log('============================================================\n');

      if (this.failed === 0) {
        console.log('🎉 All advanced search tests passed!');
        console.log('✅ Advanced search functionality verified successfully');
        process.exit(0);
      } else {
        console.log('⚠️  Some tests failed. This may indicate issues with:');
        console.log('   - Query parsing or execution');
        console.log('   - Field resolution or filtering');
        console.log('   - Operator implementation');
        console.log('   - Logical operators or combinations');
        process.exit(1);
      }
    }
  }
}

// Run the tests
const test = new AdvancedSearchIntegrationTest();
test.run();
