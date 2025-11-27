/**
 * Common test helpers for integration tests
 */

/**
 * Get test project identifier from environment
 * Uses TEST_PROJECT_ID from .env file
 */
export function getTestProjectId() {
  if (!process.env.TEST_PROJECT_ID) {
    throw new Error('TEST_PROJECT_ID not set in .env file');
  }
  return process.env.TEST_PROJECT_ID;
}

/**
 * Verify environment variables are set
 */
export function verifyEnvironment() {
  const required = ['TAIGA_API_URL', 'TAIGA_USERNAME', 'TAIGA_PASSWORD', 'TEST_PROJECT_ID'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }

  return {
    apiUrl: process.env.TAIGA_API_URL,
    username: process.env.TAIGA_USERNAME,
    password: process.env.TAIGA_PASSWORD,
    testProjectId: process.env.TEST_PROJECT_ID
  };
}

/**
 * Parse tool response (MCP format)
 */
export function parseToolResponse(response) {
  if (response && response.content && Array.isArray(response.content)) {
    return response.content[0].text;
  }
  return response;
}

/**
 * Extract ID from response text
 */
export function extractIdFromResponse(response) {
  const match = response.match(/(?:ID|Story ID|Task ID|Epic ID|Milestone ID):\s*(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

/**
 * Extract all IDs from response text
 */
export function extractAllIdsFromResponse(response) {
  const matches = response.matchAll(/ID:\s*(\d+)/gi);
  return Array.from(matches).map(m => parseInt(m[1]));
}

/**
 * Extract reference number from response (#123 format)
 */
export function extractReferenceNumber(response) {
  const match = response.match(/(?:Reference:\s*)?#(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract field value from response
 */
export function extractFieldFromResponse(response, fieldName) {
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

/**
 * Check if authentication succeeded
 * Note: authenticate tool returns "Successfully authenticated" without emoji
 */
export function isAuthSuccessful(response) {
  const text = typeof response === 'string' ? response : parseToolResponse(response);
  return text.includes('Successfully') && text.includes('authenticated');
}

/**
 * Check if response indicates an error
 */
export function hasError(response) {
  const text = typeof response === 'string' ? response : parseToolResponse(response);
  return text.toLowerCase().includes('error') ||
         text.toLowerCase().includes('failed') ||
         text.match(/\b404\b/) ||
         text.match(/\b401\b/) ||
         text.match(/\b403\b/);
}
