#!/usr/bin/env node

/**
 * Project & Metadata Integration Test Suite
 *
 * Tests all Project and Metadata-related MCP tools:
 * 1. authenticate - User authentication
 * 2. listProjects - List all projects
 * 3. getProject - Get project details
 * 4. getProjectMetadata - Get complete project metadata
 * 5. listProjectMembers - Get all project members
 * 6. getAvailableStatuses - Get status options
 * 7. clearMetadataCache - Clear metadata cache
 *
 * Verifies:
 * - Authentication flow
 * - Project listing and details
 * - Metadata discovery
 * - Cache management
 * - Member information
 * - Status listings
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { authenticateTool } from '../../src/tools/authTools.js';
import { listProjectsTool, getProjectTool } from '../../src/tools/projectTools.js';
import {
  getProjectMetadataTool,
  listProjectMembersTool,
  getAvailableStatusesTool,
  clearMetadataCacheTool
} from '../../src/tools/metadataTools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../..', '.env') });

class ProjectMetadataIntegrationTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.projectId = null;
    this.projectSlug = null;
    this.projectName = null;
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

  async run() {
    console.log('🧪 Project & Metadata Integration Test Suite\n');
    console.log('📋 Testing all Project and Metadata MCP tools\n');

    if (!process.env.TAIGA_API_URL || !process.env.TAIGA_USERNAME || !process.env.TAIGA_PASSWORD) {
      console.error('❌ Missing Taiga credentials');
      process.exit(1);
    }

    console.log(`🔗 API: ${process.env.TAIGA_API_URL}`);
    console.log(`👤 User: ${process.env.TAIGA_USERNAME}\n`);

    try {
      // Test 1: Authentication
      await this.test('TC-PM-001: Authenticate user', async () => {
        const result = await authenticateTool.handler({});
        const text = this.parseToolResponse(result);

        // Verify success
        this.assert(text.includes('✅'), 'Should contain success indicator');
        this.assert(text.includes('authenticated') || text.includes('Successfully'), 'Should show authentication message');

        // Should show user info
        this.assert(text.includes('User') || text.includes(process.env.TAIGA_USERNAME), 'Should show username');
      });

      // Test 2: List Projects
      await this.test('TC-PM-002: List all projects', async () => {
        const result = await listProjectsTool.handler({});
        const text = this.parseToolResponse(result);

        // Should list projects
        this.assert(text.includes('Project') || text.includes('ID:'), 'Should show project listing');

        // Extract first project details
        const idMatch = text.match(/ID:\s*(\d+)/);
        const slugMatch = text.match(/Slug:\s*([^\s]+)/);
        const nameMatch = text.match(/Name:\s*(.+?)(?:\n|$)/);

        this.assert(idMatch, 'Should have at least one project');
        this.projectId = parseInt(idMatch[1]);

        if (slugMatch) {
          this.projectSlug = slugMatch[1];
        }

        if (nameMatch) {
          this.projectName = nameMatch[1].trim();
        }

        console.log(`\n   → Using Project ID: ${this.projectId}`);
        if (this.projectSlug) {
          console.log(`   → Project Slug: ${this.projectSlug}`);
        }
      });

      // Test 3: Get Project by ID
      await this.test('TC-PM-003: Get project by ID', async () => {
        const result = await getProjectTool.handler({
          projectIdentifier: this.projectId
        });

        const text = this.parseToolResponse(result);

        // Verify project details
        this.assert(text.includes(`${this.projectId}`), 'Should return project ID');
        this.assert(text.includes('Name:'), 'Should show project name');
        this.assert(text.includes('Description:') || text.includes('Created'), 'Should show project details');
      });

      // Test 4: Get Project by Slug
      await this.test('TC-PM-004: Get project by slug', async () => {
        if (this.projectSlug) {
          const result = await getProjectTool.handler({
            projectIdentifier: this.projectSlug
          });

          const text = this.parseToolResponse(result);

          // Should return same project
          this.assert(text.includes(`${this.projectId}`) || text.includes(this.projectSlug), 'Should return correct project');
        } else {
          console.log('\n   → Skipping (no slug available)');
        }
      });

      // Test 5: Get Project Metadata
      await this.test('TC-PM-005: Get complete project metadata', async () => {
        const result = await getProjectMetadataTool.handler({
          projectIdentifier: this.projectId
        });

        const text = this.parseToolResponse(result);

        // Should show comprehensive metadata
        this.assert(text.includes('Metadata') || text.includes('Project'), 'Should show metadata label');

        // Should include various metadata sections
        const hasMembers = text.includes('Member') || text.includes('User');
        const hasStatuses = text.includes('Status') || text.includes('status');
        const hasInfo = text.includes('Name') || text.includes('ID');

        this.assert(hasMembers || hasStatuses || hasInfo, 'Should show metadata information');
      });

      // Test 6: List Project Members
      await this.test('TC-PM-006: List project members', async () => {
        const result = await listProjectMembersTool.handler({
          projectIdentifier: this.projectId
        });

        const text = this.parseToolResponse(result);

        // Should show members
        this.assert(text.includes('Member') || text.includes('User') || text.includes('username'), 'Should show member list');

        // Should show member details
        const hasUserInfo = text.includes('@') ||  // Email
                           text.includes('username:') ||
                           text.includes('Full Name:');

        this.assert(hasUserInfo, 'Should show member information with identifiers');
      });

      // Test 7: Get Available Statuses - Tasks
      await this.test('TC-PM-007: Get available task statuses', async () => {
        const result = await getAvailableStatusesTool.handler({
          projectIdentifier: this.projectId,
          entityType: 'task'
        });

        const text = this.parseToolResponse(result);

        // Should show task statuses
        this.assert(text.includes('Status') || text.includes('status'), 'Should show status label');
        this.assert(text.includes('task') || text.includes('Task'), 'Should mention task entity type');

        // Should have status details
        this.assert(text.includes('ID:') || text.includes('Name:'), 'Should show status details');
      });

      // Test 8: Get Available Statuses - User Stories
      await this.test('TC-PM-008: Get available user story statuses', async () => {
        const result = await getAvailableStatusesTool.handler({
          projectIdentifier: this.projectId,
          entityType: 'userstory'
        });

        const text = this.parseToolResponse(result);

        // Should show story statuses
        this.assert(text.includes('Status') || text.includes('status'), 'Should show status label');

        // Should have different statuses than tasks (usually)
        this.assert(text.includes('ID:') || text.includes('Name:'), 'Should show status details');
      });

      // Test 9: Get Available Statuses - Issues
      await this.test('TC-PM-009: Get available issue statuses', async () => {
        const result = await getAvailableStatusesTool.handler({
          projectIdentifier: this.projectId,
          entityType: 'issue'
        });

        const text = this.parseToolResponse(result);

        // Should show issue statuses
        this.assert(text.includes('Status') || text.includes('status'), 'Should show status label');
        this.assert(text.includes('ID:') || text.includes('Name:'), 'Should show status details');
      });

      // Test 10: Clear Metadata Cache
      await this.test('TC-PM-010: Clear metadata cache', async () => {
        const result = await clearMetadataCacheTool.handler({
          projectIdentifier: this.projectId
        });

        const text = this.parseToolResponse(result);

        // Verify cache cleared
        this.assert(text.includes('✅'), 'Should contain success indicator');
        this.assert(text.includes('cache') || text.includes('cleared'), 'Should mention cache clearing');
      });

      // Test 11: Get Metadata After Cache Clear
      await this.test('TC-PM-011: Get metadata after cache clear (fresh fetch)', async () => {
        const result = await getProjectMetadataTool.handler({
          projectIdentifier: this.projectId
        });

        const text = this.parseToolResponse(result);

        // Should still work and fetch fresh data
        this.assert(text.includes('Metadata') || text.includes('Project'), 'Should fetch metadata successfully');

        // Should have data
        const hasData = text.includes('Member') ||
                       text.includes('Status') ||
                       text.includes('Name');

        this.assert(hasData, 'Should return fresh metadata');
      });

      // Test 12: Verify Authentication Persists
      await this.test('TC-PM-012: Verify authentication persists', async () => {
        // Try to list projects again without re-authenticating
        const result = await listProjectsTool.handler({});
        const text = this.parseToolResponse(result);

        // Should work without error
        this.assert(text.includes('Project') || text.includes('ID:'), 'Should list projects with cached auth');
        this.assert(!text.includes('authentication failed') && !text.includes('401'), 'Should not have auth errors');
      });

      // Test 13: Get Member by Username
      await this.test('TC-PM-013: Verify member identifiers available', async () => {
        const result = await listProjectMembersTool.handler({
          projectIdentifier: this.projectId
        });

        const text = this.parseToolResponse(result);

        // Should provide multiple identifier formats
        const hasUsername = text.includes('username:') || text.includes('@');
        const hasEmail = text.includes('email:') || text.includes('@');
        const hasFullName = text.includes('Full Name:') || text.includes('Name:');

        // Should have at least one identifier format
        this.assert(hasUsername || hasEmail || hasFullName, 'Should provide member identifiers for user resolution');
      });

      console.log('\n' + '='.repeat(60));
      console.log('📊 Project & Metadata Integration Test Results:');
      console.log('='.repeat(60));
      console.log(`✅ Passed: ${this.passed}`);
      console.log(`❌ Failed: ${this.failed}`);
      console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
      console.log('='.repeat(60));

      if (this.failed === 0) {
        console.log('🎉 All Project & Metadata integration tests passed!\n');
        process.exit(0);
      } else {
        console.log('⚠️  Some Project/Metadata tests failed. Please review.\n');
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
const testSuite = new ProjectMetadataIntegrationTest();
testSuite.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
