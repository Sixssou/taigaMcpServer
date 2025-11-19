#!/usr/bin/env node

/**
 * Debug test for linkStoryToEpic function
 *
 * This test attempts to reproduce the bug where linkStoryToEpic reports
 * success but the link is not actually created in Taiga.
 */

import { TaigaService } from '../src/taigaService.js';
import { resolveUserStory } from '../src/utils.js';

const taigaService = new TaigaService();

async function debugLinkEpic() {
  try {
    console.log('🔍 Debug Test: Link Story to Epic\n');
    console.log('=' .repeat(60));

    // Test parameters from the user's example
    const epicId = 332658;
    const userStoryId = '#118';
    const projectIdentifier = '1740153';

    console.log('📋 Test Parameters:');
    console.log(`  Epic ID: ${epicId}`);
    console.log(`  User Story ID: ${userStoryId}`);
    console.log(`  Project ID: ${projectIdentifier}`);
    console.log('=' .repeat(60));

    // Step 1: Resolve user story
    console.log('\n📍 Step 1: Resolving user story...');
    const userStory = await resolveUserStory(userStoryId, projectIdentifier);
    console.log(`✅ Resolved user story:`);
    console.log(`  - Internal ID: ${userStory.id}`);
    console.log(`  - Reference: #${userStory.ref}`);
    console.log(`  - Subject: ${userStory.subject}`);
    console.log(`  - Current Epic: ${userStory.epic || 'None'}`);

    // Step 2: Verify epic exists
    console.log('\n📍 Step 2: Verifying epic exists...');
    const epic = await taigaService.getEpic(epicId);
    console.log(`✅ Epic found:`);
    console.log(`  - ID: ${epic.id}`);
    console.log(`  - Subject: ${epic.subject}`);
    console.log(`  - Project: ${epic.project}`);

    // Step 3: Attempt to link
    console.log('\n📍 Step 3: Attempting to link story to epic...');
    console.log('=' .repeat(60));
    const result = await taigaService.linkStoryToEpic(userStory.id, epicId);
    console.log('=' .repeat(60));
    console.log(`✅ Link completed. Response:`);
    console.log(`  - Story ID: ${result.id}`);
    console.log(`  - Story Ref: #${result.ref}`);
    console.log(`  - Epic ID in response: ${result.epic}`);
    console.log(`  - Version: ${result.version}`);

    // Step 4: Verify by fetching story again
    console.log('\n📍 Step 4: Verifying link by fetching story again...');
    const verifiedStory = await taigaService.getUserStory(userStory.id);
    console.log(`📋 Verified story:`);
    console.log(`  - ID: ${verifiedStory.id}`);
    console.log(`  - Reference: #${verifiedStory.ref}`);
    console.log(`  - Epic: ${verifiedStory.epic || 'None'}`);
    console.log(`  - Version: ${verifiedStory.version}`);

    // Final verification
    console.log('\n' + '=' .repeat(60));
    if (verifiedStory.epic === epicId) {
      console.log('✅ SUCCESS: Story is correctly linked to epic!');
    } else {
      console.log('❌ FAILURE: Story is NOT linked to epic!');
      console.log(`   Expected epic ID: ${epicId}`);
      console.log(`   Actual epic ID: ${verifiedStory.epic || 'null'}`);
    }
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
debugLinkEpic().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
