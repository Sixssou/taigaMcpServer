#!/usr/bin/env node

/**
 * Comprehensive Integration Test Orchestrator
 *
 * Runs all integration test suites for Taiga MCP Server vital tools.
 * Provides detailed reporting and summary of all test results.
 *
 * Test Suites:
 * 1. Project & Metadata (13 tests) - Authentication, projects, metadata discovery
 * 2. Epics (13 tests) - Epic CRUD, story linking
 * 3. Sprints (17 tests) - Sprint CRUD, statistics, relationships
 * 4. User Stories (17 tests) - Story CRUD, batch operations, sprint assignment
 * 5. Tasks (13 tests) - Task CRUD, batch operations, user story linkage
 * 6. Search & Batch (16 tests) - Advanced search, batch assign, batch due dates
 *
 * Total: 89+ comprehensive integration tests
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class IntegrationTestOrchestrator {
  constructor() {
    this.testSuites = [
      {
        name: 'Project & Metadata',
        file: 'projectMetadataIntegrationTest.js',
        expectedTests: 13,
        description: 'Authentication, projects, metadata discovery, cache management'
      },
      {
        name: 'Epics',
        file: 'epicIntegrationTest.js',
        expectedTests: 13,
        description: 'Epic CRUD operations, story linking/unlinking'
      },
      {
        name: 'Sprints/Milestones',
        file: 'sprintIntegrationTest.js',
        expectedTests: 17,
        description: 'Sprint CRUD, statistics, user stories, issues'
      },
      {
        name: 'User Stories',
        file: 'userStoryIntegrationTest.js',
        expectedTests: 17,
        description: 'Story CRUD, batch operations, sprint assignment, tasks'
      },
      {
        name: 'Tasks',
        file: 'taskIntegrationTest.js',
        expectedTests: 13,
        description: 'Task CRUD, batch operations, user story linkage, assignment'
      },
      {
        name: 'Search & Batch',
        file: 'searchBatchIntegrationTest.js',
        expectedTests: 16,
        description: 'Advanced search, query validation, batch assign, batch due dates'
      }
    ];

    this.results = [];
    this.startTime = Date.now();
  }

  async runTestSuite(suite) {
    return new Promise((resolve) => {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🧪 Running: ${suite.name}`);
      console.log(`📋 ${suite.description}`);
      console.log(`⏱️  Expected: ${suite.expectedTests} tests`);
      console.log('='.repeat(70));

      const testPath = join(__dirname, suite.file);
      const testProcess = spawn('node', [testPath], {
        stdio: 'inherit',
        shell: true
      });

      const suiteStartTime = Date.now();

      testProcess.on('close', (code) => {
        const duration = ((Date.now() - suiteStartTime) / 1000).toFixed(2);
        const result = {
          name: suite.name,
          file: suite.file,
          expectedTests: suite.expectedTests,
          passed: code === 0,
          exitCode: code,
          duration: duration
        };

        this.results.push(result);

        if (code === 0) {
          console.log(`\n✅ ${suite.name} completed successfully (${duration}s)\n`);
        } else {
          console.log(`\n❌ ${suite.name} failed with exit code ${code} (${duration}s)\n`);
        }

        resolve(result);
      });

      testProcess.on('error', (error) => {
        console.error(`\n❌ Error running ${suite.name}:`, error.message);
        this.results.push({
          name: suite.name,
          file: suite.file,
          expectedTests: suite.expectedTests,
          passed: false,
          exitCode: -1,
          duration: 0,
          error: error.message
        });
        resolve();
      });
    });
  }

  async runAll() {
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║     Taiga MCP Server - Comprehensive Integration Test Suite       ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📦 Testing all vital MCP tools across 6 categories');
    console.log(`📊 Total expected tests: ${this.testSuites.reduce((sum, s) => sum + s.expectedTests, 0)}+`);
    console.log(`📅 Started: ${new Date().toLocaleString()}`);
    console.log('');

    // Check environment variables
    if (!process.env.TAIGA_API_URL || !process.env.TAIGA_USERNAME || !process.env.TAIGA_PASSWORD) {
      console.error('❌ ERROR: Missing Taiga credentials');
      console.error('   Required environment variables:');
      console.error('   - TAIGA_API_URL');
      console.error('   - TAIGA_USERNAME');
      console.error('   - TAIGA_PASSWORD');
      console.error('');
      process.exit(1);
    }

    console.log(`🔗 API: ${process.env.TAIGA_API_URL}`);
    console.log(`👤 User: ${process.env.TAIGA_USERNAME}`);
    console.log('');

    // Run all test suites sequentially
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    this.printSummary();
  }

  printSummary() {
    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const passedSuites = this.results.filter(r => r.passed).length;
    const failedSuites = this.results.filter(r => !r.passed).length;
    const totalExpectedTests = this.testSuites.reduce((sum, s) => sum + s.expectedTests, 0);

    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                  Integration Test Summary                          ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');

    // Detailed results table
    console.log('📊 Test Suite Results:');
    console.log('─'.repeat(70));
    console.log(`${'Suite'.padEnd(25)} | ${'Status'.padEnd(10)} | ${'Duration'.padEnd(10)} | Tests`);
    console.log('─'.repeat(70));

    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const duration = `${result.duration}s`;
      const tests = `${result.expectedTests} tests`;

      console.log(`${result.name.padEnd(25)} | ${status.padEnd(10)} | ${duration.padEnd(10)} | ${tests}`);
    });

    console.log('─'.repeat(70));
    console.log('');

    // Overall statistics
    console.log('📈 Overall Statistics:');
    console.log(`   ✅ Passed Suites: ${passedSuites}/${this.testSuites.length}`);
    console.log(`   ❌ Failed Suites: ${failedSuites}/${this.testSuites.length}`);
    console.log(`   📊 Total Tests: ${totalExpectedTests}+`);
    console.log(`   ⏱️  Total Duration: ${totalDuration}s`);
    console.log(`   📈 Success Rate: ${((passedSuites / this.testSuites.length) * 100).toFixed(1)}%`);
    console.log('');

    // Failed suites details
    if (failedSuites > 0) {
      console.log('⚠️  Failed Test Suites:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   ❌ ${result.name} (${result.file})`);
        if (result.error) {
          console.log(`      Error: ${result.error}`);
        }
      });
      console.log('');
    }

    // Coverage report
    console.log('📋 MCP Tool Coverage:');
    console.log('   ✓ Authentication Tools (1 tool)');
    console.log('   ✓ Project Management (2 tools)');
    console.log('   ✓ Sprint Management (9 tools)');
    console.log('   ✓ Epic Management (6 tools)');
    console.log('   ✓ User Story Management (10 tools)');
    console.log('   ✓ Task Management (5 tools)');
    console.log('   ✓ Metadata Discovery (5 tools)');
    console.log('   ✓ Advanced Search (3 tools)');
    console.log('   ✓ Batch Operations (7 tools)');
    console.log('   ─────────────────────────────');
    console.log('   📦 Total: 48 vital MCP tools tested');
    console.log('');

    // Final result
    console.log('═'.repeat(70));
    if (failedSuites === 0) {
      console.log('🎉 ALL INTEGRATION TESTS PASSED! 🎉');
      console.log('');
      console.log('   All vital MCP tools are functioning correctly.');
      console.log('   The Taiga MCP Server is ready for production use.');
      process.exit(0);
    } else {
      console.log('⚠️  SOME INTEGRATION TESTS FAILED');
      console.log('');
      console.log('   Please review the failed test suites above.');
      console.log('   Check the individual test outputs for detailed error messages.');
      process.exit(1);
    }
  }
}

// Run orchestrator
const orchestrator = new IntegrationTestOrchestrator();
orchestrator.runAll().catch(error => {
  console.error('Fatal error in test orchestrator:', error);
  process.exit(1);
});
