#!/usr/bin/env node

/**
 * Test script for Epic linking functionality with different identifier formats
 * Tests the fix for linkStoryToEpic and unlinkStoryFromEpic to accept reference numbers
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
async function runEpicLinkTests() {
  console.log('🚀 Starting Epic Link Identifier Format Tests...\n');

  // Test 1: Validate linkStoryToEpic schema accepts reference numbers
  await test('Validate linkStoryToEpic schema accepts reference numbers', async () => {
    const { linkStoryToEpicTool } = await import('../src/tools/epicTools.js');

    assert(linkStoryToEpicTool.name === 'linkStoryToEpic', 'linkStoryToEpic has correct name');
    assert(typeof linkStoryToEpicTool.description === 'string', 'linkStoryToEpic has description');
    assert(typeof linkStoryToEpicTool.schema === 'object', 'linkStoryToEpic has schema');
    assert(typeof linkStoryToEpicTool.handler === 'function', 'linkStoryToEpic has handler function');

    // Verify the schema has the new projectIdentifier parameter
    const schemaKeys = Object.keys(linkStoryToEpicTool.schema);
    assert(schemaKeys.includes('userStoryId'), 'schema includes userStoryId parameter');
    assert(schemaKeys.includes('projectIdentifier'), 'schema includes projectIdentifier parameter (NEW)');
    assert(schemaKeys.includes('epicId'), 'schema includes epicId parameter');

    // Test schema validation with reference number (without #)
    try {
      const result1 = linkStoryToEpicTool.schema.userStoryId.parse("39");
      assert(result1 === "39", 'schema accepts reference number without # (e.g., "39")');
    } catch (error) {
      assert(false, `schema failed to parse reference number: ${error.message}`);
    }

    // Test schema validation with reference number (with #)
    try {
      const result2 = linkStoryToEpicTool.schema.userStoryId.parse("#39");
      assert(result2 === "#39", 'schema accepts reference number with # (e.g., "#39")');
    } catch (error) {
      assert(false, `schema failed to parse reference with #: ${error.message}`);
    }

    // Test schema validation with internal ID
    try {
      const result3 = linkStoryToEpicTool.schema.userStoryId.parse("8618062");
      assert(result3 === "8618062", 'schema accepts internal ID (e.g., "8618062") - backward compatible');
    } catch (error) {
      assert(false, `schema failed to parse internal ID: ${error.message}`);
    }

    // Test schema validation with optional projectIdentifier
    try {
      const result4 = linkStoryToEpicTool.schema.projectIdentifier.parse("1740153");
      assert(result4 === "1740153", 'schema accepts projectIdentifier');
    } catch (error) {
      assert(false, `schema failed to parse projectIdentifier: ${error.message}`);
    }
  });

  // Test 2: Validate unlinkStoryFromEpic schema accepts reference numbers
  await test('Validate unlinkStoryFromEpic schema accepts reference numbers', async () => {
    const { unlinkStoryFromEpicTool } = await import('../src/tools/epicTools.js');

    assert(unlinkStoryFromEpicTool.name === 'unlinkStoryFromEpic', 'unlinkStoryFromEpic has correct name');
    assert(typeof unlinkStoryFromEpicTool.description === 'string', 'unlinkStoryFromEpic has description');
    assert(typeof unlinkStoryFromEpicTool.schema === 'object', 'unlinkStoryFromEpic has schema');
    assert(typeof unlinkStoryFromEpicTool.handler === 'function', 'unlinkStoryFromEpic has handler function');

    // Verify the schema has the new projectIdentifier parameter
    const schemaKeys = Object.keys(unlinkStoryFromEpicTool.schema);
    assert(schemaKeys.includes('userStoryId'), 'schema includes userStoryId parameter');
    assert(schemaKeys.includes('projectIdentifier'), 'schema includes projectIdentifier parameter (NEW)');

    // Test schema validation with reference number (without #)
    try {
      const result1 = unlinkStoryFromEpicTool.schema.userStoryId.parse("39");
      assert(result1 === "39", 'schema accepts reference number without # (e.g., "39")');
    } catch (error) {
      assert(false, `schema failed to parse reference number: ${error.message}`);
    }

    // Test schema validation with reference number (with #)
    try {
      const result2 = unlinkStoryFromEpicTool.schema.userStoryId.parse("#39");
      assert(result2 === "#39", 'schema accepts reference number with # (e.g., "#39")');
    } catch (error) {
      assert(false, `schema failed to parse reference with #: ${error.message}`);
    }

    // Test schema validation with internal ID
    try {
      const result3 = unlinkStoryFromEpicTool.schema.userStoryId.parse("8618062");
      assert(result3 === "8618062", 'schema accepts internal ID (e.g., "8618062") - backward compatible');
    } catch (error) {
      assert(false, `schema failed to parse internal ID: ${error.message}`);
    }
  });

  // Test 3: Validate description strings mention new identifier formats
  await test('Validate tool descriptions mention new identifier formats', async () => {
    const { linkStoryToEpicTool, unlinkStoryFromEpicTool } = await import('../src/tools/epicTools.js');

    const linkDesc = linkStoryToEpicTool.schema.userStoryId._def.description;
    const unlinkDesc = unlinkStoryFromEpicTool.schema.userStoryId._def.description;

    assert(linkDesc.includes('reference'), 'linkStoryToEpic userStoryId description mentions "reference"');
    assert(linkDesc.includes('auto-detects'), 'linkStoryToEpic userStoryId description mentions "auto-detects"');

    assert(unlinkDesc.includes('reference'), 'unlinkStoryFromEpic userStoryId description mentions "reference"');
    assert(unlinkDesc.includes('auto-detects'), 'unlinkStoryFromEpic userStoryId description mentions "auto-detects"');
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
runEpicLinkTests().catch(error => {
  console.error(`❌ Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
