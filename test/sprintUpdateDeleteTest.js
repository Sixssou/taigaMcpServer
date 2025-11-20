#!/usr/bin/env node

/**
 * Sprint Update and Delete Operations Test Suite
 *
 * Tests the new sprint (milestone) update and delete functionality
 *
 * Features tested:
 * - Update sprint name
 * - Update sprint dates
 * - Update sprint status (close/reopen)
 * - Delete sprint
 *
 * Run: node test/sprintUpdateDeleteTest.js
 */

import { TaigaService } from '../src/taigaService.js';
import {
  updateSprintTool,
  deleteSprintTool,
  createSprintTool,
  listSprintsTool
} from '../src/tools/sprintTools.js';

const taigaService = new TaigaService();

// Test configuration
const TEST_CONFIG = {
  colors: {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
  }
};

// Test state
let testState = {
  passed: 0,
  failed: 0,
  testProject: null,
  createdSprintId: null
};

/**
 * Print colored test output
 */
function print(message, color = 'reset') {
  console.log(`${TEST_CONFIG.colors[color]}${message}${TEST_CONFIG.colors.reset}`);
}

/**
 * Print test result
 */
function printTestResult(testName, passed, details = '') {
  if (passed) {
    print(`✓ ${testName}`, 'green');
    testState.passed++;
  } else {
    print(`✗ ${testName}`, 'red');
    if (details) print(`  ${details}`, 'red');
    testState.failed++;
  }
}

/**
 * Print test summary
 */
function printSummary() {
  print('\n' + '='.repeat(60), 'cyan');
  print('Test Summary', 'cyan');
  print('='.repeat(60), 'cyan');
  print(`Total Tests: ${testState.passed + testState.failed}`);
  print(`Passed: ${testState.passed}`, 'green');
  print(`Failed: ${testState.failed}`, testState.failed > 0 ? 'red' : 'green');
  print(`Success Rate: ${((testState.passed / (testState.passed + testState.failed)) * 100).toFixed(1)}%`,
        testState.failed > 0 ? 'yellow' : 'green');
  print('='.repeat(60), 'cyan');
}

/**
 * Setup: Get test project
 */
async function setupTestProject() {
  try {
    const projects = await taigaService.listProjects();
    if (projects.length === 0) {
      throw new Error('No projects available for testing');
    }
    testState.testProject = projects[0];
    print(`\nUsing test project: ${testState.testProject.name} (ID: ${testState.testProject.id})`, 'blue');
    return true;
  } catch (error) {
    print(`Failed to setup test project: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 1: Create a test sprint for update/delete operations
 */
async function testCreateTestSprint() {
  try {
    const result = await createSprintTool.handler({
      projectIdentifier: testState.testProject.id.toString(),
      name: `Test Sprint ${Date.now()}`,
      estimatedStart: '2025-01-01',
      estimatedFinish: '2025-01-14'
    });

    if (result.content[0].text.includes('Sprint created successfully!')) {
      // Extract sprint ID from the result
      const idMatch = result.content[0].text.match(/ID: (\d+)/);
      if (idMatch) {
        testState.createdSprintId = idMatch[1];
        printTestResult('Create test sprint for update/delete operations', true);
        return true;
      }
    }

    printTestResult('Create test sprint for update/delete operations', false, 'Failed to extract sprint ID');
    return false;
  } catch (error) {
    printTestResult('Create test sprint for update/delete operations', false, error.message);
    return false;
  }
}

/**
 * Test 2: Update sprint name
 */
async function testUpdateSprintName() {
  try {
    const newName = `Updated Sprint ${Date.now()}`;
    const result = await updateSprintTool.handler({
      milestoneIdentifier: testState.createdSprintId,
      name: newName
    });

    const success = result.content[0].text.includes('Sprint updated successfully!') &&
                    result.content[0].text.includes(newName);
    printTestResult('Update sprint name', success);
    return success;
  } catch (error) {
    printTestResult('Update sprint name', false, error.message);
    return false;
  }
}

/**
 * Test 3: Update sprint dates
 */
async function testUpdateSprintDates() {
  try {
    const result = await updateSprintTool.handler({
      milestoneIdentifier: testState.createdSprintId,
      estimatedStart: '2025-02-01',
      estimatedFinish: '2025-02-28'
    });

    const success = result.content[0].text.includes('Sprint updated successfully!') &&
                    result.content[0].text.includes('2025-02-01') &&
                    result.content[0].text.includes('2025-02-28');
    printTestResult('Update sprint dates', success);
    return success;
  } catch (error) {
    printTestResult('Update sprint dates', false, error.message);
    return false;
  }
}

/**
 * Test 4: Update multiple sprint fields at once
 */
async function testUpdateMultipleFields() {
  try {
    const result = await updateSprintTool.handler({
      milestoneIdentifier: testState.createdSprintId,
      name: `Multi-Update Sprint ${Date.now()}`,
      estimatedStart: '2025-03-01',
      estimatedFinish: '2025-03-31'
    });

    const success = result.content[0].text.includes('Sprint updated successfully!');
    printTestResult('Update multiple sprint fields at once', success);
    return success;
  } catch (error) {
    printTestResult('Update multiple sprint fields at once', false, error.message);
    return false;
  }
}

/**
 * Test 5: Close sprint (update status)
 */
async function testCloseSprint() {
  try {
    const result = await updateSprintTool.handler({
      milestoneIdentifier: testState.createdSprintId,
      closed: true
    });

    const success = result.content[0].text.includes('Sprint updated successfully!') &&
                    result.content[0].text.includes('Closed');
    printTestResult('Close sprint (update status to closed)', success);
    return success;
  } catch (error) {
    printTestResult('Close sprint (update status to closed)', false, error.message);
    return false;
  }
}

/**
 * Test 6: Reopen sprint (update status)
 */
async function testReopenSprint() {
  try {
    const result = await updateSprintTool.handler({
      milestoneIdentifier: testState.createdSprintId,
      closed: false
    });

    const success = result.content[0].text.includes('Sprint updated successfully!') &&
                    result.content[0].text.includes('Active');
    printTestResult('Reopen sprint (update status to active)', success);
    return success;
  } catch (error) {
    printTestResult('Reopen sprint (update status to active)', false, error.message);
    return false;
  }
}

/**
 * Test 7: Update with no data (should fail gracefully)
 */
async function testUpdateWithNoData() {
  try {
    const result = await updateSprintTool.handler({
      milestoneIdentifier: testState.createdSprintId
    });

    const success = result.content[0].text.includes('No update data provided');
    printTestResult('Update with no data (should fail gracefully)', success);
    return success;
  } catch (error) {
    printTestResult('Update with no data (should fail gracefully)', false, error.message);
    return false;
  }
}

/**
 * Test 8: Update non-existent sprint (should fail)
 */
async function testUpdateNonExistentSprint() {
  try {
    const result = await updateSprintTool.handler({
      milestoneIdentifier: '999999999',
      name: 'This should fail'
    });

    const success = result.content[0].text.includes('Failed to update sprint') ||
                    result.content[0].text.includes('not found');
    printTestResult('Update non-existent sprint (should fail)', success);
    return success;
  } catch (error) {
    // Expected to fail
    printTestResult('Update non-existent sprint (should fail)', true);
    return true;
  }
}

/**
 * Test 9: Delete sprint
 */
async function testDeleteSprint() {
  try {
    const result = await deleteSprintTool.handler({
      milestoneIdentifier: testState.createdSprintId
    });

    const success = result.content[0].text.includes('Sprint deleted successfully!');
    printTestResult('Delete sprint', success);
    return success;
  } catch (error) {
    printTestResult('Delete sprint', false, error.message);
    return false;
  }
}

/**
 * Test 10: Verify sprint deletion (should not be found)
 */
async function testVerifyDeletion() {
  try {
    const milestones = await taigaService.listMilestones(testState.testProject.id);
    const found = milestones.some(m => m.id.toString() === testState.createdSprintId);

    printTestResult('Verify sprint deletion (sprint should not exist)', !found);
    return !found;
  } catch (error) {
    printTestResult('Verify sprint deletion (sprint should not exist)', false, error.message);
    return false;
  }
}

/**
 * Test 11: Delete non-existent sprint (should fail gracefully)
 */
async function testDeleteNonExistentSprint() {
  try {
    const result = await deleteSprintTool.handler({
      milestoneIdentifier: '999999999'
    });

    const success = result.content[0].text.includes('Failed to delete sprint') ||
                    result.content[0].text.includes('not found');
    printTestResult('Delete non-existent sprint (should fail gracefully)', success);
    return success;
  } catch (error) {
    // Expected to fail
    printTestResult('Delete non-existent sprint (should fail gracefully)', true);
    return true;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  print('\n' + '='.repeat(60), 'cyan');
  print('Sprint Update and Delete Operations Test Suite', 'cyan');
  print('='.repeat(60), 'cyan');

  // Setup
  if (!await setupTestProject()) {
    print('\nTest setup failed. Exiting.', 'red');
    process.exit(1);
  }

  // Run tests
  print('\nRunning tests...', 'yellow');

  await testCreateTestSprint();

  if (testState.createdSprintId) {
    await testUpdateSprintName();
    await testUpdateSprintDates();
    await testUpdateMultipleFields();
    await testCloseSprint();
    await testReopenSprint();
    await testUpdateWithNoData();
    await testUpdateNonExistentSprint();
    await testDeleteSprint();
    await testVerifyDeletion();
  } else {
    print('\nSkipping update/delete tests due to sprint creation failure', 'yellow');
  }

  await testDeleteNonExistentSprint();

  // Print summary
  printSummary();

  // Exit with appropriate code
  process.exit(testState.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  print(`\nTest suite error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
