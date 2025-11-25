#!/usr/bin/env node

/**
 * HTTP Server Test Suite
 * Tests the HTTP/JSON-RPC transport mode of the MCP server
 */

import http from 'http';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class HttpServerTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.serverProcess = null;
    this.port = 3000;
    this.host = 'localhost';
  }

  async test(name, testFn) {
    try {
      process.stdout.write(`🧪 ${name}... `);
      await testFn();
      console.log('✅ PASS');
      this.passed++;
    } catch (error) {
      console.log('❌ FAIL');
      console.log(`   Error: ${error.message}`);
      this.failed++;
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      const serverPath = join(__dirname, '..', 'src', 'httpServer.js');

      this.serverProcess = spawn('node', [serverPath], {
        env: {
          ...process.env,
          MCP_HTTP_PORT: this.port,
          MCP_HTTP_HOST: this.host,
          TAIGA_API_URL: process.env.TAIGA_API_URL || 'https://api.taiga.io/api/v1',
          TAIGA_USERNAME: process.env.TAIGA_USERNAME || 'test_user',
          TAIGA_PASSWORD: process.env.TAIGA_PASSWORD || 'test_pass'
        }
      });

      let output = '';

      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        // Look for server startup message
        if (output.includes('Taiga MCP Server - HTTP Mode') || output.includes('[HTTP Transport] Started')) {
          // Give it a bit more time to fully start
          setTimeout(() => resolve(), 1000);
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        // Ignore stderr unless server fails to start
        const errorText = data.toString();
        if (errorText.includes('Error') && !output.includes('running')) {
          console.error('Server error:', errorText);
        }
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      // Timeout if server doesn't start in 15 seconds
      setTimeout(() => {
        if (!output.includes('Taiga MCP Server') && !output.includes('[HTTP Transport] Started')) {
          reject(new Error(`Server failed to start within 15 seconds. Output: ${output}`));
        }
      }, 15000);
    });
  }

  async stopServer() {
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      // Give it time to shut down gracefully
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async makeHttpRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const jsonBody = body ? JSON.parse(body) : null;
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: jsonBody
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: body
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async run() {
    console.log('🧪 HTTP Server Test Suite\n');

    try {
      // Start the HTTP server
      console.log('🚀 Starting HTTP server...');
      await this.startServer();
      console.log('✅ Server started successfully\n');

      // Test 1: Health endpoint
      await this.test('Health endpoint responds', async () => {
        const response = await this.makeHttpRequest('GET', '/health');
        this.assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
        this.assert(response.body && response.body.status === 'healthy', 'Health status should be "healthy"');
        this.assert(response.body.timestamp, 'Health response should include timestamp');
        this.assert(response.body.server, 'Health response should include server name');
        this.assert(response.body.version, 'Health response should include version');
      });

      // Test 2: MCP initialize
      await this.test('MCP initialize request', async () => {
        const response = await this.makeHttpRequest('POST', '/mcp', {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '1.0.0',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        });
        this.assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
        this.assert(response.body && response.body.result, 'Should have result object');
        this.assert(response.body.result.serverInfo, 'Should include serverInfo');
      });

      // Test 3: MCP tools/list
      await this.test('MCP tools/list request', async () => {
        const response = await this.makeHttpRequest('POST', '/mcp', {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        });
        this.assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
        this.assert(response.body && response.body.result, 'Should have result object');
        this.assert(Array.isArray(response.body.result.tools), 'Should have tools array');
        this.assert(response.body.result.tools.length > 0, 'Should have at least one tool');
      });

      // Test 4: Invalid JSON-RPC request
      await this.test('Invalid JSON-RPC request handling', async () => {
        const response = await this.makeHttpRequest('POST', '/mcp', {
          invalid: 'request'
        });
        // Server should return error response
        this.assert(response.statusCode === 200 || response.statusCode === 400,
          'Should return 200 or 400 for invalid request');
        if (response.body && response.body.error) {
          this.assert(response.body.error.message, 'Error should have message');
        }
      });

      // Test 5: GET request to /mcp (should fail or return method not allowed)
      await this.test('GET request to /mcp endpoint', async () => {
        const response = await this.makeHttpRequest('GET', '/mcp');
        // Should not be 200 OK
        this.assert(response.statusCode !== 200, 'GET should not be allowed on /mcp');
      });

      // Test 6: Non-existent endpoint
      await this.test('404 for non-existent endpoint', async () => {
        const response = await this.makeHttpRequest('GET', '/nonexistent');
        this.assert(response.statusCode === 404, `Expected 404, got ${response.statusCode}`);
      });

      // Test 7: MCP tools/call with invalid tool
      await this.test('MCP tools/call with invalid tool name', async () => {
        const response = await this.makeHttpRequest('POST', '/mcp', {
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'nonexistentTool',
            arguments: {}
          }
        });
        this.assert(response.statusCode === 200, 'Should return 200');
        this.assert(response.body && response.body.result, 'Should have result object');
        this.assert(response.body.result.error, 'Should have error in result');
        this.assert(response.body.result.error.message.includes('not found'), 'Error should indicate tool not found');
      });

      // Test 8: Invalid JSON handling
      await this.test('Invalid JSON request handling', async () => {
        const response = await new Promise((resolve, reject) => {
          const options = {
            hostname: this.host,
            port: this.port,
            path: '/mcp',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          };

          const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
              try {
                resolve({
                  statusCode: res.statusCode,
                  body: JSON.parse(body)
                });
              } catch {
                resolve({
                  statusCode: res.statusCode,
                  body: body
                });
              }
            });
          });

          req.on('error', reject);
          req.write('invalid json data');
          req.end();
        });

        // Server should return error response
        this.assert(response.statusCode === 500, `Should return 500 for invalid JSON, got ${response.statusCode}`);
        this.assert(response.body && response.body.error, 'Should have error object in response');
      });

      console.log('\n' + '='.repeat(50));
      console.log(`✅ Passed: ${this.passed}`);
      console.log(`❌ Failed: ${this.failed}`);
      console.log('='.repeat(50));

      if (this.failed > 0) {
        console.log('\n⚠️  Some tests failed!');
        process.exit(1);
      } else {
        console.log('\n🎉 All HTTP tests passed!');
      }

    } catch (error) {
      console.error('\n❌ Test suite error:', error.message);
      process.exit(1);
    } finally {
      // Always stop the server
      console.log('\n🛑 Stopping server...');
      await this.stopServer();
      console.log('✅ Server stopped');
    }
  }
}

// Run the tests
const runner = new HttpServerTestRunner();
runner.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
