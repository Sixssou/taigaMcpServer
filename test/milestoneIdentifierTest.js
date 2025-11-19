#!/usr/bin/env node

/**
 * Test script for Milestone identifier functionality
 * Tests that getMilestoneStats and getIssuesByMilestone accept both ID and name
 */

/**
 * Test Results Tracker
 */
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Simple test assertion function
 */
function assert(condition, message) {
  results.total++;
  if (condition) {
    results.passed++;
    console.log(`✅ ${message}`);
  } else {
    results.failed++;
    results.errors.push(message);
    console.log(`❌ ${message}`);
  }
}

/**
 * Async test wrapper
 */
async function test(name, fn) {
  console.log(`\n🧪 Test: ${name}`);
  try {
    await fn();
  } catch (error) {
    results.total++;
    results.failed++;
    results.errors.push(`${name}: ${error.message}`);
    console.log(`❌ ${name}: ${error.message}`);
  }
}

/**
 * Main test execution
 */
async function runMilestoneIdentifierTests() {
  console.log('🚀 Starting Milestone Identifier Format Tests...\n');

  // Test 1: Validate getMilestoneStats schema accepts ID and name
  await test('Validate getMilestoneStats schema accepts ID and name', async () => {
    const { getSprintStatsTool } = await import('../src/tools/sprintTools.js');

    assert(getSprintStatsTool.name === 'getMilestoneStats', 'getMilestoneStats has correct name');
    assert(typeof getSprintStatsTool.description === 'string', 'getMilestoneStats has description');
    assert(typeof getSprintStatsTool.schema === 'object', 'getMilestoneStats has schema');
    assert(typeof getSprintStatsTool.handler === 'function', 'getMilestoneStats has handler function');

    // Verify the schema has the new milestoneIdentifier parameter
    const schemaKeys = Object.keys(getSprintStatsTool.schema);
    assert(schemaKeys.includes('milestoneIdentifier'), 'schema includes milestoneIdentifier parameter (NEW)');
    assert(schemaKeys.includes('projectIdentifier'), 'schema includes projectIdentifier parameter (NEW)');

    // Test schema validation with ID
    try {
      const result1 = getSprintStatsTool.schema.milestoneIdentifier.parse("123");
      assert(result1 === "123", 'schema accepts milestone ID (e.g., "123")');
    } catch (error) {
      assert(false, `schema failed to parse milestone ID: ${error.message}`);
    }

    // Test schema validation with name
    try {
      const result2 = getSprintStatsTool.schema.milestoneIdentifier.parse("Sprint 1");
      assert(result2 === "Sprint 1", 'schema accepts milestone name (e.g., "Sprint 1")');
    } catch (error) {
      assert(false, `schema failed to parse milestone name: ${error.message}`);
    }
  });

  // Test 2: Validate getIssuesByMilestone schema accepts ID and name
  await test('Validate getIssuesByMilestone schema accepts ID and name', async () => {
    const { getIssuesBySprintTool } = await import('../src/tools/sprintTools.js');

    assert(getIssuesBySprintTool.name === 'getIssuesByMilestone', 'getIssuesByMilestone has correct name');
    assert(typeof getIssuesBySprintTool.description === 'string', 'getIssuesByMilestone has description');
    assert(typeof getIssuesBySprintTool.schema === 'object', 'getIssuesByMilestone has schema');
    assert(typeof getIssuesBySprintTool.handler === 'function', 'getIssuesByMilestone has handler function');

    // Verify the schema has the new milestoneIdentifier parameter
    const schemaKeys = Object.keys(getIssuesBySprintTool.schema);
    assert(schemaKeys.includes('milestoneIdentifier'), 'schema includes milestoneIdentifier parameter (NEW)');
    assert(schemaKeys.includes('projectIdentifier'), 'schema includes projectIdentifier parameter');

    // Test schema validation with ID
    try {
      const result1 = getIssuesBySprintTool.schema.milestoneIdentifier.parse("123");
      assert(result1 === "123", 'schema accepts milestone ID (e.g., "123")');
    } catch (error) {
      assert(false, `schema failed to parse milestone ID: ${error.message}`);
    }

    // Test schema validation with name
    try {
      const result2 = getIssuesBySprintTool.schema.milestoneIdentifier.parse("Sprint 1");
      assert(result2 === "Sprint 1", 'schema accepts milestone name (e.g., "Sprint 1")');
    } catch (error) {
      assert(false, `schema failed to parse milestone name: ${error.message}`);
    }
  });

  // Test 3: Validate resolveMilestone utility function exists
  await test('Validate resolveMilestone utility function exists', async () => {
    const utils = await import('../src/utils.js');

    assert(typeof utils.resolveMilestone === 'function', 'resolveMilestone function is exported from utils.js');
  });

  // Test 4: Validate description strings mention new identifier formats
  await test('Validate tool descriptions mention new identifier formats', async () => {
    const { getSprintStatsTool, getIssuesBySprintTool } = await import('../src/tools/sprintTools.js');

    const getMilestoneStatsDesc = getSprintStatsTool.schema.milestoneIdentifier._def.description;
    const getIssuesByMilestoneDesc = getIssuesBySprintTool.schema.milestoneIdentifier._def.description;

    assert(getMilestoneStatsDesc.includes('name'), 'getMilestoneStats milestoneIdentifier description mentions "name"');
    assert(getMilestoneStatsDesc.includes('auto-detects'), 'getMilestoneStats milestoneIdentifier description mentions "auto-detects"');

    assert(getIssuesByMilestoneDesc.includes('name'), 'getIssuesByMilestone milestoneIdentifier description mentions "name"');
    assert(getIssuesByMilestoneDesc.includes('auto-detects'), 'getIssuesByMilestone milestoneIdentifier description mentions "auto-detects"');
  });

  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('Test Results:');
  console.log('='.repeat(50));
  console.log(`Total:  ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  if (results.failed > 0) {
    console.log('\nFailed tests:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('='.repeat(50) + '\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runMilestoneIdentifierTests().catch(error => {
  console.error(`❌ Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
