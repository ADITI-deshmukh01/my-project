#!/usr/bin/env node

/**
 * Health Check Script for CampusPlacement Portal
 * 
 * This script is used by Docker to monitor the health of the application.
 * It checks various components and returns appropriate exit codes.
 * 
 * Exit Codes:
 * - 0: Healthy
 * - 1: Unhealthy
 * - 2: Starting up
 */

const http = require('http');
const https = require('https');
const { MongoClient } = require('mongodb');

// Configuration
const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_placement_portal',
  timeout: 5000,
  retries: 3
};

// Health check results
let healthStatus = {
  timestamp: new Date().toISOString(),
  status: 'unknown',
  checks: {
    server: false,
    database: false,
    memory: false,
    disk: false
  },
  details: {}
};

/**
 * Check if the HTTP server is responding
 */
async function checkServer() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: config.port,
      path: '/health',
      method: 'GET',
      timeout: config.timeout
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        healthStatus.checks.server = true;
        healthStatus.details.server = {
          statusCode: res.statusCode,
          responseTime: Date.now() - startTime
        };
        resolve(true);
      } else {
        healthStatus.details.server = {
          statusCode: res.statusCode,
          error: 'Unexpected status code'
        };
        resolve(false);
      }
    });

    req.on('error', (error) => {
      healthStatus.details.server = {
        error: error.message
      };
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      healthStatus.details.server = {
        error: 'Request timeout'
      };
      resolve(false);
    });

    const startTime = Date.now();
    req.end();
  });
}

/**
 * Check MongoDB connection
 */
async function checkDatabase() {
  try {
    const client = new MongoClient(config.mongoUri, {
      serverSelectionTimeoutMS: config.timeout,
      connectTimeoutMS: config.timeout
    });

    await client.connect();
    
    // Check if we can perform a simple operation
    const adminDb = client.db().admin();
    const result = await adminDb.ping();
    
    await client.close();

    if (result.ok === 1) {
      healthStatus.checks.database = true;
      healthStatus.details.database = {
        status: 'connected',
        ping: result.ok
      };
      return true;
    } else {
      healthStatus.details.database = {
        status: 'ping_failed',
        result: result
      };
      return false;
    }
  } catch (error) {
    healthStatus.details.database = {
      status: 'error',
      error: error.message
    };
    return false;
  }
}

/**
 * Check system memory usage
 */
function checkMemory() {
  try {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    // Consider healthy if RSS is less than 500MB
    const isHealthy = memUsageMB.rss < 500;
    
    healthStatus.checks.memory = isHealthy;
    healthStatus.details.memory = {
      ...memUsageMB,
      healthy: isHealthy
    };

    return isHealthy;
  } catch (error) {
    healthStatus.details.memory = {
      error: error.message
    };
    return false;
  }
}

/**
 * Check disk space (basic check)
 */
function checkDisk() {
  try {
    // For now, we'll just check if we can write to the uploads directory
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Try to write a test file
    const testFile = path.join(uploadsDir, '.healthcheck');
    fs.writeFileSync(testFile, 'health check');
    fs.unlinkSync(testFile);
    
    healthStatus.checks.disk = true;
    healthStatus.details.disk = {
      status: 'writable',
      uploadsDir: uploadsDir
    };
    
    return true;
  } catch (error) {
    healthStatus.details.disk = {
      error: error.message
    };
    return false;
  }
}

/**
 * Check application uptime
 */
function checkUptime() {
  const uptime = process.uptime();
  const uptimeMinutes = Math.floor(uptime / 60);
  
  // Consider starting up if less than 2 minutes
  if (uptimeMinutes < 2) {
    healthStatus.status = 'starting';
    return false;
  }
  
  return true;
}

/**
 * Main health check function
 */
async function performHealthCheck() {
  try {
    console.log('🔍 Starting health check...');
    
    // Check uptime first
    const uptimeOk = checkUptime();
    
    // Perform all checks
    const [serverOk, dbOk, memoryOk, diskOk] = await Promise.all([
      checkServer(),
      checkDatabase(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkDisk())
    ]);
    
    // Determine overall health
    const allChecksPassed = serverOk && dbOk && memoryOk && diskOk && uptimeOk;
    
    if (allChecksPassed) {
      healthStatus.status = 'healthy';
      console.log('✅ Application is healthy');
      process.exit(0);
    } else {
      healthStatus.status = 'unhealthy';
      console.log('❌ Application is unhealthy');
      
      // Log detailed status
      console.log('Health Check Details:');
      console.log('- Server:', healthStatus.checks.server ? '✅' : '❌');
      console.log('- Database:', healthStatus.checks.database ? '✅' : '❌');
      console.log('- Memory:', healthStatus.checks.memory ? '✅' : '❌');
      console.log('- Disk:', healthStatus.checks.disk ? '✅' : '❌');
      console.log('- Uptime:', uptimeOk ? '✅' : '❌');
      
      if (healthStatus.status === 'starting') {
        console.log('🔄 Application is still starting up');
        process.exit(2);
      } else {
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('💥 Health check failed with error:', error.message);
    healthStatus.status = 'error';
    healthStatus.details.error = error.message;
    process.exit(1);
  }
}

/**
 * Handle process signals
 */
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Run health check
performHealthCheck();
