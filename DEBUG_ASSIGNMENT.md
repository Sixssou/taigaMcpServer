# 🔍 Debug Guide - Assignment Display Issue

## 📊 Problem Summary

**Symptom**: Tasks are correctly assigned in Taiga UI, but MCP tools display "Unassigned"
**Status**: Under investigation
**Impact**: Display only - actual assignment works

---

## ✅ Solutions Implemented (v1.0)

### 1. Automatic Delay Before Re-fetch
- **500ms delay** added in `updateTask`
- **300ms delay** added in `batchAssign` (per item)
- **Purpose**: Allow Taiga API to propagate changes before re-fetching

### 2. Debug Logging Mode
- Set `DEBUG_ASSIGNMENT=true` to see raw API responses
- Helps identify if API returns `assigned_to_extra_info`

---

## 🧪 Testing Instructions

### Quick Test (with automatic delays)
```javascript
// Test single assignment
updateTask(taskId: "199", assignedTo: "user@email.com")
// Wait for response (500ms delay included)
// Check if "Assigned to: <User Name>" appears correctly

// Test batch assignment
batchAssign(
  itemType: "task",
  itemIdentifiers: ["199", "200", "201"],
  assignedTo: "user@email.com"
)
// Each item has 300ms delay
// Total time: ~1 second for 3 tasks
```

### Debug Mode Test
```bash
# 1. Enable debug mode in your environment
export DEBUG_ASSIGNMENT=true

# 2. Run MCP server
npm start

# 3. Perform assignment
# Example: updateTask(#199, assignedTo: "email@example.com")

# 4. Check stderr/console for debug output like:
# DEBUG getTask response: {
#   taskId: 199,
#   assigned_to: 870926,
#   assigned_to_extra_info: { full_name: 'John Doe', ... },
#   hasExtraInfo: true
# }
```

---

## 🔬 Diagnostic Checklist

### Scenario 1: `hasExtraInfo: false`
**Problem**: API doesn't return `assigned_to_extra_info`
**Possible causes**:
- Taiga API version doesn't include extra_info in GET response
- Need query parameter (e.g., `?include_all=true`)
- Wrong endpoint (try `/tasks?id={id}` instead of `/tasks/{id}`)

**Next steps**:
1. Check Taiga API version: `curl $TAIGA_API_URL`
2. Try manual API call:
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
        "$TAIGA_API_URL/tasks/199"
   ```
3. Look for `assigned_to_extra_info` in response

---

### Scenario 2: `assigned_to: null` but UI shows assigned
**Problem**: Assignment not persisted in Taiga
**Possible causes**:
- User ID format wrong (string vs number)
- Permission issue
- API silently fails

**Next steps**:
1. Enable debug in `updateTask`:
   ```javascript
   // In taigaService.js, line ~437
   console.error('UPDATE REQUEST:', {
     taskId: currentTask.id,
     updateData,
     assigned_to: updateData.assigned_to,
     assigned_to_type: typeof updateData.assigned_to
   });
   ```
2. Check if `assigned_to` is numeric
3. Try manual API call:
   ```bash
   curl -X PATCH \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"assigned_to": 870926, "version": 1}' \
        "$TAIGA_API_URL/tasks/199"
   ```

---

### Scenario 3: Delay too short
**Problem**: 500ms not enough for Taiga to propagate
**Test**: Increase delay
```javascript
// In taskTools.js, line ~227
await new Promise(resolve => setTimeout(resolve, 1500)); // Try 1.5s
```

---

## 🛠️ Alternative Solutions (if delays don't work)

### Option A: Force numeric user ID
```javascript
// In taskTools.js or batchTools.js
updateData.assigned_to = parseInt(user.userId, 10); // Ensure integer
```

### Option B: Use list endpoint instead of GET
```javascript
// In taigaService.js
async getTaskWithFullData(taskId) {
  const tasks = await this.fetchAllPages(client, API_ENDPOINTS.TASKS, {
    id: taskId
  });
  return tasks[0]; // List endpoints often have more complete data
}
```

### Option C: Multiple re-fetch attempts
```javascript
// Retry with exponential backoff
for (let i = 0; i < 3; i++) {
  await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, i)));
  const task = await taigaService.getTask(taskId);
  if (task.assigned_to_extra_info) {
    return task; // Success!
  }
}
```

### Option D: Query parameters
```javascript
// Try adding query params to GET request
const response = await client.get(`${API_ENDPOINTS.TASKS}/${taskId}`, {
  params: {
    include_attachments: true,
    include_all: true
  }
});
```

---

## 📝 Manual Verification Steps

### Step 1: Verify assignment actually works
```bash
# 1. Assign via MCP tool
updateTask(#199, assignedTo: "user@email.com")

# 2. Check in Taiga UI
# Go to: https://your-taiga.com/project/xxx/task/199
# Verify: Assigned user is correct

# 3. Check via API directly
curl -H "Authorization: Bearer $TOKEN" \
     "$TAIGA_API_URL/tasks/199"
# Look for: "assigned_to": 870926
```

### Step 2: Compare PATCH response vs GET response
```javascript
// Add logging in updateTask():
console.error('PATCH response:', updatedTask);
console.error('GET response:', enrichedTask);

// Compare:
// - Does PATCH include assigned_to_extra_info? (probably no)
// - Does GET include assigned_to_extra_info? (should be yes)
// - Is assigned_to numeric in both? (should be yes)
```

---

## 🎯 Expected Debug Output

### Good Output (assignment working correctly):
```
DEBUG getTask response: {
  taskId: 199,
  assigned_to: 870926,
  assigned_to_extra_info: {
    full_name: 'John Doe',
    username: 'john.doe',
    email: 'john@example.com'
  },
  hasExtraInfo: true
}

Response: "Assigned to: John Doe" ✅
```

### Bad Output (missing extra_info):
```
DEBUG getTask response: {
  taskId: 199,
  assigned_to: 870926,
  assigned_to_extra_info: null,  // ⚠️ Missing!
  hasExtraInfo: false
}

Response: "Assigned to: Unassigned" ❌
```

---

## 🚀 Next Steps

1. **Test with delays** (automatic, just retry your tests)
2. **Enable DEBUG_ASSIGNMENT=true** and check logs
3. **Report findings**: Share debug output in issue/chat
4. **Try alternatives**: If delays don't work, try Options A-D above

---

## 📞 Reporting Results

When reporting, please include:
1. ✅ Does assignment work in Taiga UI?
2. ✅ Debug output from `DEBUG_ASSIGNMENT=true`
3. ✅ Response time (is 500ms enough?)
4. ✅ Taiga API version (if known)
5. ✅ Manual curl test results (optional but helpful)

---

## 📚 Related Files

- `src/tools/taskTools.js` - updateTask with 500ms delay
- `src/tools/batchTools.js` - batchAssign with 300ms delay
- `src/taigaService.js` - getTask with debug logging
- `src/userResolution.js` - User ID resolution

---

**Last Updated**: 2024-11-24
**Status**: Testing delays + debug mode
**Next Review**: After user testing
