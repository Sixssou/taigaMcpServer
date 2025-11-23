/**
 * Enhanced Advanced Search Test Suite
 * Tests for new fields, operators, and features in advancedSearch
 */

import { QueryParser } from '../src/query/QueryParser.js';
import { QueryExecutor } from '../src/query/QueryExecutor.js';

// Test counter
let testCount = 0;
let passCount = 0;
let failCount = 0;

// Test helper functions
function assert(condition, message) {
  testCount++;
  if (condition) {
    console.log(`✅ Test ${testCount}: ${message}`);
    passCount++;
  } else {
    console.log(`❌ Test ${testCount}: ${message}`);
    failCount++;
  }
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

// Mock Taiga Service for testing
class MockTaigaService {
  constructor() {
    this.mockData = this.generateMockData();
  }

  generateMockData() {
    return {
      userStories: [
        {
          id: 1,
          ref: 178,
          subject: 'Prendre RDV avocat',
          status_extra_info: { name: 'In progress', id: 1 },
          assigned_to: 456,
          assigned_to_extra_info: { id: 456, username: 'cyril', full_name: 'Cyril Arrighi' },
          owner_extra_info: { id: 456, username: 'cyril', full_name: 'Cyril Arrighi' },
          priority_extra_info: { name: 'High', id: 3 },
          milestone_id: 490619,
          milestone_slug: 's47-s48',
          milestone_extra_info: { id: 490619, name: 'S47-S48', slug: 's47-s48' },
          epic_id: 100,
          epic_extra_info: { id: 100, subject: 'Structuration juridique' },
          total_points: 5,
          due_date: '2025-11-25T00:00:00Z',
          created_date: '2025-11-17T19:11:09Z',
          modified_date: '2025-11-20T16:08:10Z',
          finish_date: null,
          tags: ['legal', 'association'],
          is_blocked: false,
          is_closed: false,
          attachments: [{ id: 1 }, { id: 2 }],
          total_comments: 5
        },
        {
          id: 2,
          ref: 179,
          subject: 'Structuration comptable',
          status_extra_info: { name: 'New', id: 2 },
          assigned_to: null,
          assigned_to_extra_info: null,
          owner_extra_info: { id: 789, username: 'melanie', full_name: 'Melanie Dupont' },
          priority_extra_info: { name: 'Normal', id: 2 },
          milestone_id: null,
          milestone_slug: null,
          milestone_extra_info: null,
          epic_id: null,
          total_points: 3,
          due_date: '2025-11-20T00:00:00Z', // Past due
          created_date: '2025-11-15T10:00:00Z',
          modified_date: '2025-11-18T12:00:00Z',
          finish_date: null,
          tags: ['inpi'],
          is_blocked: true,
          is_closed: false,
          attachments: [],
          total_comments: 0
        },
        {
          id: 3,
          ref: 180,
          subject: 'Configuration serveur',
          status_extra_info: { name: 'Done', id: 3 },
          assigned_to: 456,
          assigned_to_extra_info: { id: 456, username: 'cyril', full_name: 'Cyril Arrighi' },
          owner_extra_info: { id: 456, username: 'cyril', full_name: 'Cyril Arrighi' },
          priority_extra_info: { name: 'High', id: 3 },
          milestone_id: 490619,
          milestone_slug: 's47-s48',
          milestone_extra_info: { id: 490619, name: 'S47-S48', slug: 's47-s48' },
          epic_id: 100,
          total_points: 8,
          due_date: null,
          created_date: '2025-11-10T08:00:00Z',
          modified_date: '2025-11-22T14:00:00Z',
          finish_date: '2025-11-22T14:00:00Z',
          tags: ['legal', 'inpi'],
          is_blocked: false,
          is_closed: true,
          attachments: [{ id: 3 }],
          total_comments: 3
        },
        {
          id: 4,
          ref: 181,
          subject: 'API Integration',
          status_extra_info: { name: 'In progress', id: 1 },
          assigned_to: 789,
          assigned_to_extra_info: { id: 789, username: 'melanie', full_name: 'Melanie Dupont' },
          owner_extra_info: { id: 789, username: 'melanie', full_name: 'Melanie Dupont' },
          priority_extra_info: { name: 'Normal', id: 2 },
          milestone_id: 490619,
          milestone_slug: 's47-s48',
          milestone_extra_info: { id: 490619, name: 'S47-S48', slug: 's47-s48' },
          epic_id: null,
          total_points: 5,
          due_date: '2025-11-28T00:00:00Z', // Upcoming
          created_date: '2025-11-18T09:00:00Z',
          modified_date: '2025-11-22T10:00:00Z',
          finish_date: null,
          tags: [],
          is_blocked: false,
          is_closed: false,
          attachments: [],
          total_comments: 8
        }
      ]
    };
  }

  async listUserStories(projectId) {
    return this.mockData.userStories;
  }

  async listIssues(projectId) {
    return [];
  }

  async listTasks(userStoryId) {
    return [];
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Enhanced Advanced Search Test Suite\n');
  console.log('=' .repeat(60));

  const parser = new QueryParser();
  const mockService = new MockTaigaService();
  const executor = new QueryExecutor(mockService);

  // Test 1: Filter by milestone (sprint) by name
  console.log('\n📋 Test 1: Filter by milestone (sprint) name');
  try {
    const query1 = parser.parse('milestone:S47-S48', 'USER_STORY');
    const result1 = await executor.execute(query1, 'test-project');
    assert(result1.results.length === 3, 'Should find 3 user stories in sprint S47-S48');
    assert(result1.results.every(us =>
      us.milestone_slug === 's47-s48' || us.milestone_extra_info?.slug === 's47-s48'
    ), 'All results should be in sprint S47-S48');
  } catch (error) {
    assert(false, `Filter by milestone failed: ${error.message}`);
  }

  // Test 2: Filter milestone:null
  console.log('\n📋 Test 2: Filter milestone:null');
  try {
    const query2 = parser.parse('milestone:null', 'USER_STORY');
    const result2 = await executor.execute(query2, 'test-project');
    assert(result2.results.length === 1, 'Should find 1 user story without sprint');
    assert(result2.results.every(us => !us.milestone_id), 'All results should have no milestone');
  } catch (error) {
    assert(false, `Filter milestone:null failed: ${error.message}`);
  }

  // Test 3: Filter milestone:* (any milestone assigned)
  console.log('\n📋 Test 3: Filter milestone:* (any milestone)');
  try {
    const query3 = parser.parse('milestone:*', 'USER_STORY');
    const result3 = await executor.execute(query3, 'test-project');
    assert(result3.results.length === 3, 'Should find 3 user stories with any sprint');
    assert(result3.results.every(us => us.milestone_id), 'All results should have a milestone');
  } catch (error) {
    assert(false, `Filter milestone:* failed: ${error.message}`);
  }

  // Test 4: Filter due_date:past
  console.log('\n📋 Test 4: Filter due_date:past');
  try {
    const query4 = parser.parse('due_date:past AND closed:false', 'USER_STORY');
    const result4 = await executor.execute(query4, 'test-project');
    assert(result4.results.length === 1, 'Should find 1 overdue user story');
    assert(result4.results[0].ref === 179, 'Should be the overdue story (ref 179)');
  } catch (error) {
    assert(false, `Filter due_date:past failed: ${error.message}`);
  }

  // Test 5: Operator in:[] for status
  console.log('\n📋 Test 5: Operator in:[] for status');
  try {
    const query5 = parser.parse('status:in:[New,In progress]', 'USER_STORY');
    const result5 = await executor.execute(query5, 'test-project');
    assert(result5.results.length === 3, 'Should find 3 stories with status New or In progress');
    assert(result5.results.every(us =>
      ['New', 'In progress'].includes(us.status_extra_info.name)
    ), 'All results should have status New or In progress');
  } catch (error) {
    assert(false, `Operator in:[] failed: ${error.message}`);
  }

  // Test 6: Operator between:[] for points
  console.log('\n📋 Test 6: Operator between:[] for points');
  try {
    const query6 = parser.parse('points:between:[3,5]', 'USER_STORY');
    const result6 = await executor.execute(query6, 'test-project');
    assert(result6.results.length === 3, 'Should find 3 stories with 3-5 points');
    assert(result6.results.every(us => us.total_points >= 3 && us.total_points <= 5),
      'All results should have points between 3 and 5');
  } catch (error) {
    assert(false, `Operator between:[] failed: ${error.message}`);
  }

  // Test 7: Field blocked
  console.log('\n📋 Test 7: Field blocked');
  try {
    const query7 = parser.parse('blocked:true', 'USER_STORY');
    const result7 = await executor.execute(query7, 'test-project');
    assert(result7.results.length === 1, 'Should find 1 blocked story');
    assert(result7.results.every(us => us.is_blocked === true), 'All results should be blocked');
  } catch (error) {
    assert(false, `Field blocked failed: ${error.message}`);
  }

  // Test 8: Field attachments
  console.log('\n📋 Test 8: Field attachments');
  try {
    const query8 = parser.parse('attachments:>0', 'USER_STORY');
    const result8 = await executor.execute(query8, 'test-project');
    assert(result8.results.length === 2, 'Should find 2 stories with attachments');
    assert(result8.results.every(us => us.attachments && us.attachments.length > 0),
      'All results should have attachments');
  } catch (error) {
    assert(false, `Field attachments failed: ${error.message}`);
  }

  // Test 9: Field comments
  console.log('\n📋 Test 9: Field comments');
  try {
    const query9 = parser.parse('comments:>0', 'USER_STORY');
    const result9 = await executor.execute(query9, 'test-project');
    assert(result9.results.length === 3, 'Should find 3 stories with comments');
    assert(result9.results.every(us => us.total_comments > 0),
      'All results should have comments');
  } catch (error) {
    assert(false, `Field comments failed: ${error.message}`);
  }

  // Test 10: Alias sprint
  console.log('\n📋 Test 10: Alias sprint → milestone');
  try {
    const query10 = parser.parse('sprint:S47-S48', 'USER_STORY');
    const result10 = await executor.execute(query10, 'test-project');
    assert(result10.results.length === 3, 'Alias sprint should work like milestone');
  } catch (error) {
    assert(false, `Alias sprint failed: ${error.message}`);
  }

  // Test 11: Operator empty
  console.log('\n📋 Test 11: Operator empty for assignee');
  try {
    const query11 = parser.parse('assignee:empty', 'USER_STORY');
    const result11 = await executor.execute(query11, 'test-project');
    assert(result11.results.length === 1, 'Should find 1 unassigned story');
    assert(result11.results.every(us => !us.assigned_to), 'All results should be unassigned');
  } catch (error) {
    assert(false, `Operator empty failed: ${error.message}`);
  }

  // Test 12: Operator notempty
  console.log('\n📋 Test 12: Operator notempty for assignee');
  try {
    const query12 = parser.parse('assignee:notempty', 'USER_STORY');
    const result12 = await executor.execute(query12, 'test-project');
    assert(result12.results.length === 3, 'Should find 3 assigned stories');
    assert(result12.results.every(us => us.assigned_to), 'All results should be assigned');
  } catch (error) {
    assert(false, `Operator notempty failed: ${error.message}`);
  }

  // Test 13: Complex query
  console.log('\n📋 Test 13: Complex query - milestone AND closed AND priority AND assignee');
  try {
    const query13 = parser.parse(
      'milestone:S47-S48 AND closed:false AND priority:high AND assignee:cyril',
      'USER_STORY'
    );
    const result13 = await executor.execute(query13, 'test-project');
    assert(result13.results.length === 1, 'Should find 1 matching story');
    const story = result13.results[0];
    assert(story.milestone_slug === 's47-s48', 'Should be in S47-S48');
    assert(story.is_closed === false, 'Should not be closed');
    assert(story.priority_extra_info.name === 'High', 'Should have high priority');
    assert(story.assigned_to_extra_info.username === 'cyril', 'Should be assigned to cyril');
  } catch (error) {
    assert(false, `Complex query failed: ${error.message}`);
  }

  // Test 14: Field epic
  console.log('\n📋 Test 14: Filter by epic');
  try {
    const query14 = parser.parse('epic:100', 'USER_STORY');
    const result14 = await executor.execute(query14, 'test-project');
    assert(result14.results.length === 2, 'Should find 2 stories with epic 100');
    assert(result14.results.every(us => us.epic_id === 100), 'All results should have epic_id 100');
  } catch (error) {
    assert(false, `Filter by epic failed: ${error.message}`);
  }

  // Test 15: Field owner
  console.log('\n📋 Test 15: Filter by owner');
  try {
    const query15 = parser.parse('owner:cyril', 'USER_STORY');
    const result15 = await executor.execute(query15, 'test-project');
    assert(result15.results.length === 2, 'Should find 2 stories created by cyril');
    assert(result15.results.every(us => us.owner_extra_info.username === 'cyril'),
      'All results should be created by cyril');
  } catch (error) {
    assert(false, `Filter by owner failed: ${error.message}`);
  }

  // Test 16: Tags with in:[] operator
  console.log('\n📋 Test 16: Tags with in:[] operator');
  try {
    const query16 = parser.parse('tags:in:[legal,inpi]', 'USER_STORY');
    const result16 = await executor.execute(query16, 'test-project');
    assert(result16.results.length === 3, 'Should find 3 stories with legal or inpi tags');
    assert(result16.results.every(us =>
      us.tags.includes('legal') || us.tags.includes('inpi')
    ), 'All results should have legal or inpi tag');
  } catch (error) {
    assert(false, `Tags with in:[] failed: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Summary:`);
  console.log(`   Total Tests: ${testCount}`);
  console.log(`   ✅ Passed: ${passCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   Success Rate: ${Math.round((passCount / testCount) * 100)}%\n`);

  if (failCount === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review.\n');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
