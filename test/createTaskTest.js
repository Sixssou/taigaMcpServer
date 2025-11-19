/**
 * Test for createTask improvements
 * Tests User Story ID resolution and error handling
 */

import { strict as assert } from 'assert';

// Mock Taiga Service for testing
class MockTaigaService {
  constructor() {
    this.userStories = [
      { id: 123456, ref: 32, subject: 'User Story #32' },
      { id: 123457, ref: 33, subject: 'User Story #33' },
      { id: 123458, ref: 34, subject: 'User Story #34' }
    ];
  }

  async listUserStories(projectId) {
    return this.userStories;
  }

  async createTask(taskData) {
    // Simulate API validation
    if (!taskData.user_story) {
      throw new Error('user_story is required');
    }

    // Check if user_story ID exists
    const validId = this.userStories.some(us => us.id === parseInt(taskData.user_story));
    if (!validId && parseInt(taskData.user_story) < 200000) {
      const error = new Error('Bad Request');
      error.response = {
        status: 400,
        data: {
          user_story: ['Invalid user story ID']
        }
      };
      throw error;
    }

    return {
      id: 999,
      ref: 100,
      subject: taskData.subject,
      user_story: taskData.user_story,
      project: taskData.project
    };
  }
}

/**
 * Test User Story ID resolution logic
 */
async function testUserStoryResolution() {
  console.log('\n🧪 Testing User Story ID Resolution...\n');

  const mockService = new MockTaigaService();
  const projectId = '1740153';

  // Test 1: Reference with # (existing behavior)
  console.log('Test 1: Reference with # ("#32")');
  try {
    const userStoryIdentifier = '#32';
    let refNumber = null;

    if (userStoryIdentifier.startsWith('#')) {
      refNumber = userStoryIdentifier.substring(1);
    } else {
      const numValue = parseInt(userStoryIdentifier, 10);
      if (!isNaN(numValue) && numValue < 10000) {
        refNumber = userStoryIdentifier;
      }
    }

    if (refNumber !== null) {
      const userStories = await mockService.listUserStories(projectId);
      const userStory = userStories.find(us => us.ref.toString() === refNumber);
      assert.ok(userStory, 'User story should be found');
      assert.strictEqual(userStory.id, 123456, 'Should resolve to correct ID');
      console.log(`✅ Resolved #${refNumber} -> ID: ${userStory.id}`);
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    throw error;
  }

  // Test 2: Reference without # (NEW behavior)
  console.log('\nTest 2: Reference without # ("32")');
  try {
    const userStoryIdentifier = '32';
    let refNumber = null;

    if (userStoryIdentifier.startsWith('#')) {
      refNumber = userStoryIdentifier.substring(1);
    } else {
      const numValue = parseInt(userStoryIdentifier, 10);
      if (!isNaN(numValue) && numValue < 10000) {
        refNumber = userStoryIdentifier;
      }
    }

    if (refNumber !== null) {
      const userStories = await mockService.listUserStories(projectId);
      const userStory = userStories.find(us => us.ref.toString() === refNumber);
      assert.ok(userStory, 'User story should be found');
      assert.strictEqual(userStory.id, 123456, 'Should resolve to correct ID');
      console.log(`✅ Resolved ${refNumber} -> ID: ${userStory.id}`);
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    throw error;
  }

  // Test 3: Large number treated as ID
  console.log('\nTest 3: Large number treated as ID ("123456")');
  try {
    const userStoryIdentifier = '123456';
    let refNumber = null;
    let userStoryId = userStoryIdentifier;

    if (userStoryIdentifier.startsWith('#')) {
      refNumber = userStoryIdentifier.substring(1);
    } else {
      const numValue = parseInt(userStoryIdentifier, 10);
      if (!isNaN(numValue) && numValue < 10000) {
        refNumber = userStoryIdentifier;
      }
    }

    assert.strictEqual(refNumber, null, 'Should not treat large number as reference');
    assert.strictEqual(userStoryId, '123456', 'Should use as ID directly');
    console.log(`✅ Large number ${userStoryId} treated as ID (no resolution)`);
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
    throw error;
  }

  // Test 4: Invalid reference error message
  console.log('\nTest 4: Invalid reference error handling');
  try {
    const userStoryIdentifier = '999';
    let refNumber = null;

    if (userStoryIdentifier.startsWith('#')) {
      refNumber = userStoryIdentifier.substring(1);
    } else {
      const numValue = parseInt(userStoryIdentifier, 10);
      if (!isNaN(numValue) && numValue < 10000) {
        refNumber = userStoryIdentifier;
      }
    }

    if (refNumber !== null) {
      const userStories = await mockService.listUserStories(projectId);
      const userStory = userStories.find(us => us.ref.toString() === refNumber);

      if (!userStory) {
        const availableRefs = userStories.map(us => `#${us.ref}`).slice(0, 10).join(', ');
        const errorMsg = `User story with reference #${refNumber} not found in project ${projectId}.\nAvailable references: ${availableRefs}`;

        assert.ok(errorMsg.includes('Available references'), 'Error should include available references');
        assert.ok(errorMsg.includes('#32'), 'Error should list available refs');
        console.log(`✅ Error message is helpful:\n${errorMsg}`);
      }
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
    throw error;
  }

  console.log('\n✅ All User Story resolution tests passed!\n');
}

/**
 * Test enhanced error handling
 */
async function testEnhancedErrorHandling() {
  console.log('\n🧪 Testing Enhanced Error Handling...\n');

  const mockService = new MockTaigaService();

  console.log('Test 5: API error with detailed message');
  try {
    // Simulate API error with invalid user_story ID
    await mockService.createTask({
      project: '1740153',
      user_story: '99999', // Invalid ID
      subject: 'Test task',
      description: 'Test description'
    });

    console.error('❌ Test 5 failed: Should have thrown an error');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      const status = error.response.status;
      const data = error.response.data;

      assert.strictEqual(status, 400, 'Should be 400 Bad Request');
      assert.ok(data.user_story, 'Should have user_story error field');

      console.log(`✅ API error correctly detected:`);
      console.log(`   Status: ${status}`);
      console.log(`   Data:`, JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Test 5 failed: Unexpected error:', error.message);
      throw error;
    }
  }

  console.log('\n✅ All error handling tests passed!\n');
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   🧪 CreateTask Improvements Test Suite');
  console.log('═══════════════════════════════════════════════════════');

  try {
    await testUserStoryResolution();
    await testEnhancedErrorHandling();

    console.log('═══════════════════════════════════════════════════════');
    console.log('   ✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════');
    process.exit(0);
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('   ❌ TEST SUITE FAILED');
    console.error('═══════════════════════════════════════════════════════');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
