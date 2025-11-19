#!/usr/bin/env node

/**
 * List all MCP tools registered in the server
 * This helps verify that tools are properly registered and visible
 */

import { getAllTools } from '../src/tools/index.js';

console.log('🔍 Listing all registered MCP tools...\n');

const tools = getAllTools();

console.log(`Total tools: ${tools.length}\n`);

// Group tools by category
const epicTools = tools.filter(t => t.name.includes('Epic') || t.name.includes('Story'));

console.log('🏛️ Epic and User Story related tools:');
epicTools.forEach(tool => {
  console.log(`  - ${tool.name}: ${tool.description}`);
});

console.log('\n📋 All tools:');
tools.forEach((tool, index) => {
  console.log(`${index + 1}. ${tool.name}`);
});

console.log('\n✅ Tool listing complete!');
