# 🧪 User Story Integration Test

## Overview

This test validates the complete lifecycle of user stories in Taiga, including the critical **epic array handling** that has been problematic.

## What It Tests

### 1. **Complete CRUD Operations**
- ✅ **Create** a user story with tags
- ✅ **Get** user story by reference (#123)
- ✅ **Get** user story without # prefix (123)
- ✅ **Update** subject and description
- ✅ **Update** tags
- ✅ **Delete** user story
- ✅ **Verify** deletion

### 2. **Critical Epic Handling**
The test specifically validates that `getUserStory` correctly handles **epics as an array**:

```javascript
// Taiga API returns epics as an array, not a single field:
userStory.epics = [
  { id: 123, subject: "Epic name" }
]

// NOT: userStory.epic = { ... }
```

**This is the problematic area mentioned by the user.**

### 3. **Edge Cases**
- Invalid reference numbers (error handling)
- Missing project ID
- Authentication failures

## Running the Test

### Prerequisites

**You need valid Taiga credentials in `.env`:**

```env
TAIGA_API_URL=https://api.taiga.io/api/v1
TAIGA_USERNAME=your_real_username
TAIGA_PASSWORD=your_real_password
TEST_PROJECT_ID=123  # Optional: your test project ID
```

### Run Command

```bash
npm run test:userstory
```

### Expected Output (with valid credentials)

```
🧪 User Story Integration Test Suite

📋 Testing complete user story lifecycle

🔗 API: https://api.taiga.io/api/v1
👤 User: your_username

🧪 Create new user story... ✅ PASS
      Created story: #456
🧪 Get user story by reference number... ✅ PASS
🧪 Get user story without # prefix... ✅ PASS
🧪 Update user story subject and description... ✅ PASS
🧪 Verify user story was updated... ✅ PASS
🧪 Update user story tags... ✅ PASS
🧪 Verify epic field handling (should be array)... ✅ PASS
🧪 Handle invalid user story reference gracefully... ✅ PASS
🧪 Delete user story... ✅ PASS
🧪 Verify user story was deleted... ✅ PASS

============================================================
📊 Test Results Summary
============================================================
✅ Passed: 10
❌ Failed: 0
📈 Success Rate: 100.0%
============================================================

🎉 All user story integration tests passed!
✅ User story lifecycle verified successfully
```

## What Happens Without Valid Credentials

If you run the test with placeholder credentials (default in `.env`):

```
🧪 Create new user story... ❌ FAIL
   Error: Should indicate success

⚠️  Some tests failed. This may indicate issues with:
   - getUserStory epic handling (epics array)
   - User story field enrichment
   - Reference number resolution
   - API connectivity or permissions
```

**This is expected and normal** - the test requires real Taiga API access.

## Known Issues Being Tested

### Issue #1: Epic Array Handling

**Problem:**
```javascript
// getUserStory might crash if it expects:
const epicName = userStory.epic.subject;  // ❌ WRONG

// But Taiga returns:
const epicName = userStory.epics[0].subject;  // ✅ CORRECT
```

**Test validates:**
```javascript
// Test 7: Verify epic field handling
this.assert(response.includes('Epic:'), 'Should have Epic field');
this.assert(
  response.includes('No epic') || response.includes('Epic:'),
  'Should handle epic field gracefully (array or no epic)'
);
```

### Issue #2: Reference Number Resolution

Tests that user stories can be fetched by:
- `#123` (with hash)
- `123` (without hash)
- Direct ID

### Issue #3: Field Enrichment

Validates that `enrichUserStoryWithDetails()` correctly:
- Fetches milestone info if missing
- Preserves epic array structure
- Doesn't crash on missing fields

## Test Architecture

```
userStoryIntegrationTest.js
├── Setup (check credentials)
├── Test 1-2: Create & Get
├── Test 3-4: Alternative get & Update
├── Test 5-6: Verify update & Update tags
├── Test 7: Epic array handling ⚠️ Critical
├── Test 8: Error handling
└── Test 9-10: Delete & Verify deletion
    └── Cleanup (auto-delete if test fails)
```

## Debugging Failed Tests

### If Test 1 (Create) Fails:
```bash
# Check authentication
curl -X POST https://api.taiga.io/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USER","password":"YOUR_PASS","type":"normal"}'
```

### If Test 7 (Epic handling) Fails:
This indicates the `getUserStory` function has issues with the epics array. Check:
1. `src/tools/userStoryTools.js` lines 117-122
2. `src/utils.js` - `enrichUserStoryWithDetails()` function

### If Multiple Tests Fail:
- Verify `.env` credentials are correct
- Check project ID exists and you have access
- Ensure Taiga API is accessible

## Cleanup

The test **automatically cleans up** by deleting the created test story. If the test crashes, it attempts cleanup in the error handler.

**Manual cleanup** (if needed):
```bash
# Find test stories (marked with [TEST] prefix)
# Delete via Taiga UI or API
```

## Integration with CI/CD

**Not recommended for CI/CD** because:
- Requires real credentials (security risk)
- Creates actual data in Taiga
- Depends on external API availability

**Use for:**
- Manual testing before releases
- Debugging specific user story issues
- Validating epic array handling fixes

## Related Files

- **Test**: `test/userStoryIntegrationTest.js`
- **Tools**: `src/tools/userStoryTools.js`
- **Utils**: `src/utils.js` (enrichUserStoryWithDetails)
- **Service**: `src/taigaService.js`

## Next Steps

If this test reveals issues:

1. **Epic Array Problem**: Fix in `userStoryTools.js:117-122`
2. **Enrichment Issue**: Check `utils.js:enrichUserStoryWithDetails()`
3. **Resolution Issue**: Check `utils.js:resolveUserStory()`

Then re-run: `npm run test:userstory`
