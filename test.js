/**
 * Simple Test Script for CampusPlacement Portal
 * 
 * This script tests the basic functionality of the application
 * including server startup, database connection, and basic API endpoints.
 */

const http = require('http');
const { MongoClient } = require('mongodb');

// Test configuration
const config = {
  serverUrl: 'http://localhost:5000',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_placement_portal',
  timeout: 5000
};

// Test results
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

/**
 * Add test result
 */
function addResult(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: ${details}`);
  }
  
  testResults.details.push({
    test: testName,
    passed,
    details
  });
}

/**
 * Test server connectivity
 */
async function testServerConnectivity() {
  return new Promise((resolve) => {
    const req = http.request(`${config.serverUrl}/health`, {
      method: 'GET',
      timeout: config.timeout
    }, (res) => {
      if (res.statusCode === 200) {
        addResult('Server Connectivity', true);
        resolve(true);
      } else {
        addResult('Server Connectivity', false, `Status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      addResult('Server Connectivity', false, error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      addResult('Server Connectivity', false, 'Request timeout');
      resolve(false);
    });

    req.end();
  });
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  try {
    const client = new MongoClient(config.mongoUri, {
      serverSelectionTimeoutMS: config.timeout,
      connectTimeoutMS: config.timeout
    });

    await client.connect();
    
    // Test basic database operations
    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    await client.close();
    
    addResult('Database Connection', true, `Found ${collections.length} collections`);
    return true;
  } catch (error) {
    addResult('Database Connection', false, error.message);
    return false;
  }
}

/**
 * Test API endpoints
 */
async function testAPIEndpoints() {
  const endpoints = [
    { path: '/api/auth/register', method: 'POST', expectedStatus: 400 }, // Should fail without data
    { path: '/api/placements', method: 'GET', expectedStatus: 200 },    // Should return placements
    { path: '/api/training', method: 'GET', expectedStatus: 200 },      // Should return training
    { path: '/api/chatbot/health', method: 'GET', expectedStatus: 200 } // Should return health
  ];

  let passed = 0;
  let total = endpoints.length;

  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(endpoint);
      if (result) passed++;
    } catch (error) {
      console.log(`⚠️  Endpoint test failed: ${endpoint.path} - ${error.message}`);
    }
  }

  const success = passed === total;
  addResult('API Endpoints', success, `${passed}/${total} endpoints working`);
  return success;
}

/**
 * Test individual endpoint
 */
async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const req = http.request(`${config.serverUrl}${endpoint.path}`, {
      method: endpoint.method,
      timeout: config.timeout
    }, (res) => {
      if (res.statusCode === endpoint.expectedStatus) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
}

/**
 * Test environment variables
 */
function testEnvironmentVariables() {
  const requiredVars = [
    'PORT',
    'NODE_ENV',
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length === 0) {
    addResult('Environment Variables', true);
    return true;
  } else {
    addResult('Environment Variables', false, `Missing: ${missing.join(', ')}`);
    return false;
  }
}

/**
 * Test file structure
 */
function testFileStructure() {
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'package.json',
    'server.js',
    'models/User.js',
    'models/Placement.js',
    'models/Training.js',
    'routes/auth.js',
    'routes/placements.js',
    'routes/training.js',
    'middleware/auth.js',
    'public/index.html',
    'public/app.js',
    'public/app.css'
  ];

  const missing = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missing.length === 0) {
    addResult('File Structure', true);
    return true;
  } else {
    addResult('File Structure', false, `Missing: ${missing.join(', ')}`);
    return false;
  }
}

/**
 * Display test summary
 */
function displayTestSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(result => !result.passed)
      .forEach(result => {
        console.log(`  - ${result.test}: ${result.details}`);
      });
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (testResults.failed === 0) {
    console.log('🎉 All tests passed! Your application is ready to run.');
    console.log('\nNext steps:');
    console.log('1. Run: npm start');
    console.log('2. Open: http://localhost:5000');
    console.log('3. Check the README.md for more information');
  } else {
    console.log('⚠️  Some tests failed. Please check the issues above.');
    process.exit(1);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting CampusPlacement Portal Tests...\n');
  
  try {
    // Run all tests
    await testFileStructure();
    await testEnvironmentVariables();
    await testDatabaseConnection();
    await testServerConnectivity();
    await testAPIEndpoints();
    
    // Display results
    displayTestSummary();
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testResults };
