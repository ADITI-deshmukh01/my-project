/**
 * MongoDB Initialization Script for CampusPlacement Portal
 * 
 * This script sets up the initial database structure and sample data.
 * It's used by Docker Compose to initialize the MongoDB container.
 */

// Database and collection names
const DB_NAME = 'campus_placement_portal';

// Sample data for initial setup
const sampleData = {
  // Sample departments
  departments: [
    { name: 'Computer Engineering', code: 'COMP', description: 'Computer Science and Engineering' },
    { name: 'Information Technology', code: 'IT', description: 'Information Technology' },
    { name: 'Electronics & Telecommunication', code: 'ENTC', description: 'Electronics and Telecommunication Engineering' },
    { name: 'Mechanical Engineering', code: 'MECH', description: 'Mechanical Engineering' },
    { name: 'Civil Engineering', code: 'CIVIL', description: 'Civil Engineering' }
  ],

  // Sample companies for placements
  companies: [
    {
      name: 'Google',
      logo: 'https://via.placeholder.com/150x80/4285F4/FFFFFF?text=Google',
      website: 'https://www.google.com',
      industry: 'Technology',
      size: '10000+',
      description: 'Leading technology company specializing in internet services'
    },
    {
      name: 'Microsoft',
      logo: 'https://via.placeholder.com/150x80/00A4EF/FFFFFF?text=Microsoft',
      website: 'https://www.microsoft.com',
      industry: 'Technology',
      size: '10000+',
      description: 'Global technology leader in software and cloud services'
    },
    {
      name: 'Amazon',
      logo: 'https://via.placeholder.com/150x80/FF9900/FFFFFF?text=Amazon',
      website: 'https://www.amazon.com',
      industry: 'E-commerce',
      size: '10000+',
      description: 'World\'s largest online retailer and cloud computing provider'
    },
    {
      name: 'TCS',
      logo: 'https://via.placeholder.com/150x80/0066CC/FFFFFF?text=TCS',
      website: 'https://www.tcs.com',
      industry: 'IT Services',
      size: '5000-10000',
      description: 'Leading IT services and consulting company'
    },
    {
      name: 'Infosys',
      logo: 'https://via.placeholder.com/150x80/007CC3/FFFFFF?text=Infosys',
      website: 'https://www.infosys.com',
      industry: 'IT Services',
      size: '5000-10000',
      description: 'Global leader in next-generation digital services'
    }
  ],

  // Sample training categories
  trainingCategories: [
    { name: 'Programming', description: 'Software development and programming languages' },
    { name: 'Data Science', description: 'Data analysis, machine learning, and AI' },
    { name: 'Web Development', description: 'Frontend and backend web development' },
    { name: 'Cloud Computing', description: 'AWS, Azure, and Google Cloud platforms' },
    { name: 'Cybersecurity', description: 'Information security and ethical hacking' },
    { name: 'Soft Skills', description: 'Communication, leadership, and teamwork' }
  ],

  // Sample higher studies exams
  exams: [
    {
      name: 'GATE',
      fullName: 'Graduate Aptitude Test in Engineering',
      description: 'National level examination for admission to M.Tech programs',
      difficulty: 'High',
      subjects: ['Computer Science', 'Information Technology', 'Electronics'],
      nextDate: '2024-02-03',
      registrationDeadline: '2024-01-15',
      website: 'https://gate.iitk.ac.in'
    },
    {
      name: 'GRE',
      fullName: 'Graduate Record Examinations',
      description: 'Standardized test for graduate school admissions',
      difficulty: 'High',
      subjects: ['General', 'Subject Specific'],
      nextDate: '2024-01-20',
      registrationDeadline: '2024-01-05',
      website: 'https://www.ets.org/gre'
    },
    {
      name: 'CAT',
      fullName: 'Common Admission Test',
      description: 'Entrance exam for MBA programs in India',
      difficulty: 'High',
      subjects: ['Quantitative Aptitude', 'Verbal Ability', 'Data Interpretation'],
      nextDate: '2024-11-24',
      registrationDeadline: '2024-09-15',
      website: 'https://iimcat.ac.in'
    }
  ],

  // Sample universities
  universities: [
    {
      name: 'IIT Bombay',
      country: 'India',
      type: 'Public',
      programs: ['M.Tech', 'Ph.D'],
      ranking: 'Top 10 in India',
      website: 'https://www.iitb.ac.in',
      description: 'Premier engineering institute in India'
    },
    {
      name: 'MIT',
      country: 'USA',
      type: 'Private',
      programs: ['M.S', 'Ph.D'],
      ranking: 'Top 5 globally',
      website: 'https://www.mit.edu',
      description: 'World-renowned research university'
    },
    {
      name: 'Stanford University',
      country: 'USA',
      type: 'Private',
      programs: ['M.S', 'Ph.D'],
      ranking: 'Top 10 globally',
      website: 'https://www.stanford.edu',
      description: 'Leading research university in Silicon Valley'
    }
  ],

  // Sample scholarships
  scholarships: [
    {
      name: 'Google Women Techmakers',
      provider: 'Google',
      amount: '10000 USD',
      currency: 'USD',
      description: 'Scholarship for women in technology',
      eligibility: 'Women pursuing computer science or related fields',
      deadline: '2024-03-15',
      website: 'https://www.womentechmakers.com/scholars'
    },
    {
      name: 'Microsoft Research PhD Fellowship',
      provider: 'Microsoft',
      amount: '42000 USD',
      currency: 'USD',
      description: 'Fellowship for outstanding PhD students',
      eligibility: 'PhD students in computer science and related fields',
      deadline: '2024-09-15',
      website: 'https://www.microsoft.com/en-us/research/academic-program/phd-fellowship/'
    }
  ]
};

// Initialize database
async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Connect to MongoDB
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://root:password@localhost:27017');
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Create collections with validation
    await createCollections(db);
    
    // Insert sample data
    await insertSampleData(db);
    
    // Create indexes for performance
    await createIndexes(db);
    
    console.log('✅ Database initialization completed successfully!');
    
    // Display database statistics
    await displayDatabaseStats(db);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Create collections with schema validation
async function createCollections(db) {
  console.log('📋 Creating collections...');
  
  // Users collection
  await db.createCollection('users', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['email', 'password', 'role'],
        properties: {
          email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
          password: { bsonType: 'string', minLength: 6 },
          role: { enum: ['student', 'faculty', 'admin', 'placement_officer'] }
        }
      }
    }
  });
  
  // Placements collection
  await db.createCollection('placements', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['student', 'company', 'position', 'status'],
        properties: {
          status: { enum: ['applied', 'interviewing', 'offered', 'accepted', 'rejected'] }
        }
      }
    }
  });
  
  // Training collection
  await db.createCollection('training', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['title', 'category', 'status'],
        properties: {
          status: { enum: ['draft', 'active', 'completed', 'cancelled'] }
        }
      }
    }
  });
  
  console.log('✅ Collections created with validation');
}

// Insert sample data
async function insertSampleData(db) {
  console.log('📊 Inserting sample data...');
  
  try {
    // Insert departments
    if (await db.collection('departments').countDocuments() === 0) {
      await db.collection('departments').insertMany(sampleData.departments);
      console.log('✅ Departments inserted');
    }
    
    // Insert companies
    if (await db.collection('companies').countDocuments() === 0) {
      await db.collection('companies').insertMany(sampleData.companies);
      console.log('✅ Companies inserted');
    }
    
    // Insert training categories
    if (await db.collection('trainingCategories').countDocuments() === 0) {
      await db.collection('trainingCategories').insertMany(sampleData.trainingCategories);
      console.log('✅ Training categories inserted');
    }
    
    // Insert exams
    if (await db.collection('exams').countDocuments() === 0) {
      await db.collection('exams').insertMany(sampleData.exams);
      console.log('✅ Exams inserted');
    }
    
    // Insert universities
    if (await db.collection('universities').countDocuments() === 0) {
      await db.collection('universities').insertMany(sampleData.universities);
      console.log('✅ Universities inserted');
    }
    
    // Insert scholarships
    if (await db.collection('scholarships').countDocuments() === 0) {
      await db.collection('scholarships').insertMany(sampleData.scholarships);
      console.log('✅ Scholarships inserted');
    }
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
    throw error;
  }
}

// Create database indexes for performance
async function createIndexes(db) {
  console.log('🔍 Creating database indexes...');
  
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ department: 1 });
    await db.collection('users').createIndex({ year: 1 });
    
    // Placements collection indexes
    await db.collection('placements').createIndex({ student: 1 });
    await db.collection('placements').createIndex({ company: 1 });
    await db.collection('placements').createIndex({ status: 1 });
    await db.collection('placements').createIndex({ appliedDate: -1 });
    await db.collection('placements').createIndex({ industry: 1 });
    await db.collection('placements').createIndex({ ctc: -1 });
    
    // Training collection indexes
    await db.collection('training').createIndex({ category: 1 });
    await db.collection('training').createIndex({ level: 1 });
    await db.collection('training').createIndex({ status: 1 });
    await db.collection('training').createIndex({ startDate: 1 });
    await db.collection('training').createIndex({ isFeatured: 1 });
    
    console.log('✅ Database indexes created');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
    throw error;
  }
}

// Display database statistics
async function displayDatabaseStats(db) {
  console.log('\n📊 Database Statistics:');
  console.log('========================');
  
  try {
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`${collection.name}: ${count} documents`);
    }
    
    // Display database size
    const stats = await db.stats();
    const sizeInMB = Math.round(stats.dataSize / 1024 / 1024 * 100) / 100;
    console.log(`\nDatabase size: ${sizeInMB} MB`);
    
  } catch (error) {
    console.error('❌ Error getting database stats:', error.message);
  }
}

// Handle process signals
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Run initialization
if (require.main === module) {
  initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase };
