const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken, requireFaculty, logActivity } = require('../middleware/auth');

const router = express.Router();

// Mock data for higher studies (in production, this would come from a database)
let higherStudiesData = {
  exams: [
    {
      id: 1,
      name: 'GATE',
      fullName: 'Graduate Aptitude Test in Engineering',
      description: 'National level examination for admission to M.Tech and PhD programs',
      eligibility: 'Final year B.Tech students or graduates',
      examDate: '2025-02-08',
      applicationDeadline: '2024-10-20',
      website: 'https://gate.iit.ac.in',
      subjects: ['Computer Science', 'Mechanical', 'Electronics', 'Civil', 'Electrical'],
      preparationTime: '6-8 months',
      difficulty: 'High',
      topInstitutes: ['IITs', 'NITs', 'IIITs', 'Central Universities'],
      syllabus: ['Engineering Mathematics', 'Core Subject', 'General Aptitude'],
      resources: ['Previous year papers', 'Standard textbooks', 'Online courses']
    },
    {
      id: 2,
      name: 'GRE',
      fullName: 'Graduate Record Examinations',
      description: 'Standardized test for admission to graduate schools worldwide',
      eligibility: 'B.Tech graduates',
      examDate: 'Year-round',
      applicationDeadline: 'Varies by university',
      website: 'https://www.ets.org/gre',
      subjects: ['Verbal Reasoning', 'Quantitative Reasoning', 'Analytical Writing'],
      preparationTime: '3-6 months',
      difficulty: 'High',
      topInstitutes: ['US Universities', 'European Universities', 'Australian Universities'],
      syllabus: ['Verbal', 'Quantitative', 'Analytical Writing'],
      resources: ['ETS official guide', 'Practice tests', 'Vocabulary apps']
    },
    {
      id: 3,
      name: 'CAT',
      fullName: 'Common Admission Test',
      description: 'Entrance exam for MBA programs in IIMs and other top B-schools',
      eligibility: 'Graduates with 50% marks',
      examDate: '2024-11-24',
      applicationDeadline: '2024-09-15',
      website: 'https://iimcat.ac.in',
      subjects: ['Verbal Ability', 'Quantitative Aptitude', 'Data Interpretation', 'Logical Reasoning'],
      preparationTime: '6-12 months',
      difficulty: 'Very High',
      topInstitutes: ['IIMs', 'XLRI', 'FMS Delhi', 'SP Jain'],
      syllabus: ['Verbal', 'Quantitative', 'DI & LR'],
      resources: ['Previous papers', 'Mock tests', 'Study materials']
    },
    {
      id: 4,
      name: 'TOEFL',
      fullName: 'Test of English as a Foreign Language',
      description: 'English proficiency test for international students',
      eligibility: 'Non-native English speakers',
      examDate: 'Year-round',
      applicationDeadline: 'Varies by university',
      website: 'https://www.ets.org/toefl',
      subjects: ['Reading', 'Listening', 'Speaking', 'Writing'],
      preparationTime: '2-4 months',
      difficulty: 'Medium',
      topInstitutes: ['US Universities', 'Canadian Universities', 'European Universities'],
      syllabus: ['Reading', 'Listening', 'Speaking', 'Writing'],
      resources: ['Official guide', 'Practice tests', 'Speaking practice']
    }
  ],
  universities: [
    {
      id: 1,
      name: 'Indian Institute of Technology (IIT)',
      type: 'Public',
      country: 'India',
      ranking: 'Top 1000 globally',
      programs: ['M.Tech', 'PhD', 'MS'],
      specializations: ['Computer Science', 'Mechanical', 'Electrical', 'Civil'],
      admissionProcess: 'GATE score + interview',
      fees: '₹50,000 - ₹2,00,000 per year',
      scholarships: ['MHRD scholarship', 'Institute scholarship', 'Merit-based'],
      applicationDeadline: 'Varies by program',
      website: 'https://www.iit.ac.in'
    },
    {
      id: 2,
      name: 'Massachusetts Institute of Technology (MIT)',
      type: 'Private',
      country: 'USA',
      ranking: 'Top 5 globally',
      programs: ['MS', 'PhD'],
      specializations: ['Computer Science', 'Engineering', 'Technology'],
      admissionProcess: 'GRE + TOEFL + SOP + LORs',
      fees: '$50,000 - $80,000 per year',
      scholarships: ['Merit-based', 'Need-based', 'Research assistantship'],
      applicationDeadline: 'December-January',
      website: 'https://www.mit.edu'
    },
    {
      id: 3,
      name: 'Stanford University',
      type: 'Private',
      country: 'USA',
      ranking: 'Top 10 globally',
      programs: ['MS', 'PhD'],
      specializations: ['Computer Science', 'Engineering', 'Business'],
      admissionProcess: 'GRE + TOEFL + SOP + LORs + Research experience',
      fees: '$60,000 - $90,000 per year',
      scholarships: ['Merit-based', 'Need-based', 'Fellowships'],
      applicationDeadline: 'December',
      website: 'https://www.stanford.edu'
    }
  ],
  scholarships: [
    {
      id: 1,
      name: 'MHRD Scholarship',
      provider: 'Ministry of Human Resource Development',
      amount: '₹12,400 per month',
      eligibility: 'GATE qualified students',
      applicationDeadline: 'Varies by institute',
      website: 'https://www.education.gov.in',
      requirements: ['GATE score', 'Academic performance', 'Financial need']
    },
    {
      id: 2,
      name: 'Fulbright Scholarship',
      provider: 'US Government',
      amount: 'Full tuition + living expenses',
      eligibility: 'Indian students for US universities',
      applicationDeadline: 'July',
      website: 'https://www.fulbright-india.org',
      requirements: ['Academic excellence', 'Leadership potential', 'English proficiency']
    },
    {
      id: 3,
      name: 'Chevening Scholarship',
      provider: 'UK Government',
      amount: 'Full tuition + living expenses',
      eligibility: 'Indian students for UK universities',
      applicationDeadline: 'November',
      website: 'https://www.chevening.org',
      requirements: ['Academic excellence', 'Leadership experience', 'English proficiency']
    }
  ]
};

// @route   GET /api/higher-studies
// @desc    Get overview of higher studies information
// @access  Public
router.get('/', async (req, res) => {
  try {
    const overview = {
      totalExams: higherStudiesData.exams.length,
      totalUniversities: higherStudiesData.universities.length,
      totalScholarships: higherStudiesData.scholarships.length,
      upcomingDeadlines: higherStudiesData.exams
        .filter(exam => new Date(exam.applicationDeadline) > new Date())
        .sort((a, b) => new Date(a.applicationDeadline) - new Date(b.applicationDeadline))
        .slice(0, 5)
    };

    res.json({
      success: true,
      data: {
        overview,
        featured: {
          exams: higherStudiesData.exams.slice(0, 3),
          universities: higherStudiesData.universities.slice(0, 2),
          scholarships: higherStudiesData.scholarships.slice(0, 2)
        }
      }
    });

  } catch (error) {
    console.error('Get higher studies overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get higher studies information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/higher-studies/exams
// @desc    Get all exams with filters
// @access  Public
router.get('/exams', [
  query('difficulty').optional().isIn(['Low', 'Medium', 'High', 'Very High']),
  query('subject').optional().trim(),
  query('upcoming').optional().isBoolean()
], async (req, res) => {
  try {
    const { difficulty, subject, upcoming } = req.query;

    let filteredExams = [...higherStudiesData.exams];

    // Apply filters
    if (difficulty) {
      filteredExams = filteredExams.filter(exam => exam.difficulty === difficulty);
    }

    if (subject) {
      filteredExams = filteredExams.filter(exam => 
        exam.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()))
      );
    }

    if (upcoming === 'true') {
      const now = new Date();
      filteredExams = filteredExams.filter(exam => 
        new Date(exam.applicationDeadline) > now
      );
    }

    // Sort by application deadline
    filteredExams.sort((a, b) => new Date(a.applicationDeadline) - new Date(b.applicationDeadline));

    res.json({
      success: true,
      data: {
        exams: filteredExams,
        total: filteredExams.length
      }
    });

  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exams information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/higher-studies/exams/:id
// @desc    Get specific exam details
// @access  Public
router.get('/exams/:id', async (req, res) => {
  try {
    const examId = parseInt(req.params.id);
    const exam = higherStudiesData.exams.find(e => e.id === examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.json({
      success: true,
      data: {
        exam
      }
    });

  } catch (error) {
    console.error('Get exam details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exam details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/higher-studies/universities
// @desc    Get universities with filters
// @access  Public
router.get('/universities', [
  query('country').optional().trim(),
  query('type').optional().isIn(['Public', 'Private']),
  query('program').optional().trim()
], async (req, res) => {
  try {
    const { country, type, program } = req.query;

    let filteredUniversities = [...higherStudiesData.universities];

    // Apply filters
    if (country) {
      filteredUniversities = filteredUniversities.filter(uni => 
        uni.country.toLowerCase().includes(country.toLowerCase())
      );
    }

    if (type) {
      filteredUniversities = filteredUniversities.filter(uni => uni.type === type);
    }

    if (program) {
      filteredUniversities = filteredUniversities.filter(uni => 
        uni.programs.some(p => p.toLowerCase().includes(program.toLowerCase()))
      );
    }

    res.json({
      success: true,
      data: {
        universities: filteredUniversities,
        total: filteredUniversities.length
      }
    });

  } catch (error) {
    console.error('Get universities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get universities information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/higher-studies/universities/:id
// @desc    Get specific university details
// @access  Public
router.get('/universities/:id', async (req, res) => {
  try {
    const uniId = parseInt(req.params.id);
    const university = higherStudiesData.universities.find(u => u.id === uniId);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    res.json({
      success: true,
      data: {
        university
      }
    });

  } catch (error) {
    console.error('Get university details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get university details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/higher-studies/scholarships
// @desc    Get scholarships with filters
// @access  Public
router.get('/scholarships', [
  query('provider').optional().trim(),
  query('amount').optional().trim()
], async (req, res) => {
  try {
    const { provider, amount } = req.query;

    let filteredScholarships = [...higherStudiesData.scholarships];

    // Apply filters
    if (provider) {
      filteredScholarships = filteredScholarships.filter(sch => 
        sch.provider.toLowerCase().includes(provider.toLowerCase())
      );
    }

    if (amount) {
      filteredScholarships = filteredScholarships.filter(sch => 
        sch.amount.toLowerCase().includes(amount.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: {
        scholarships: filteredScholarships,
        total: filteredScholarships.length
      }
    });

  } catch (error) {
    console.error('Get scholarships error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scholarships information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/higher-studies/scholarships/:id
// @desc    Get specific scholarship details
// @access  Public
router.get('/scholarships/:id', async (req, res) => {
  try {
    const schId = parseInt(req.params.id);
    const scholarship = higherStudiesData.scholarships.find(s => s.id === schId);

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found'
      });
    }

    res.json({
      success: true,
      data: {
        scholarship
      }
    });

  } catch (error) {
    console.error('Get scholarship details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scholarship details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/higher-studies/roadmap/:exam
// @desc    Get preparation roadmap for specific exam
// @access  Public
router.get('/roadmap/:exam', async (req, res) => {
  try {
    const examName = req.params.exam.toUpperCase();
    const exam = higherStudiesData.exams.find(e => e.name === examName);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Generate roadmap based on exam
    const roadmap = {
      exam: exam.name,
      preparationTime: exam.preparationTime,
      phases: [
        {
          phase: 'Phase 1: Foundation (Months 1-2)',
          tasks: [
            'Understand exam pattern and syllabus',
            'Assess current knowledge level',
            'Create study schedule',
            'Gather study materials'
          ]
        },
        {
          phase: 'Phase 2: Core Preparation (Months 3-6)',
          tasks: [
            'Study core subjects systematically',
            'Practice previous year questions',
            'Take mock tests',
            'Identify weak areas'
          ]
        },
        {
          phase: 'Phase 3: Advanced Preparation (Months 7-8)',
          tasks: [
            'Advanced problem solving',
            'Full-length mock tests',
            'Time management practice',
            'Revision and consolidation'
          ]
        }
      ],
      tips: [
        'Start early and be consistent',
        'Practice regularly with mock tests',
        'Focus on weak areas',
        'Maintain good health and sleep',
        'Join study groups or online forums'
      ],
      resources: exam.resources
    };

    res.json({
      success: true,
      data: {
        roadmap
      }
    });

  } catch (error) {
    console.error('Get roadmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preparation roadmap',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/higher-studies/search
// @desc    Search across exams, universities, and scholarships
// @access  Public
router.get('/search', [
  query('q').notEmpty().trim().withMessage('Search query is required')
], async (req, res) => {
  try {
    const { q } = req.query;
    const query = q.toLowerCase();

    const results = {
      exams: higherStudiesData.exams.filter(exam => 
        exam.name.toLowerCase().includes(query) ||
        exam.fullName.toLowerCase().includes(query) ||
        exam.description.toLowerCase().includes(query) ||
        exam.subjects.some(subject => subject.toLowerCase().includes(query))
      ),
      universities: higherStudiesData.universities.filter(uni => 
        uni.name.toLowerCase().includes(query) ||
        uni.country.toLowerCase().includes(query) ||
        uni.programs.some(program => program.toLowerCase().includes(query)) ||
        uni.specializations.some(spec => spec.toLowerCase().includes(query))
      ),
      scholarships: higherStudiesData.scholarships.filter(sch => 
        sch.name.toLowerCase().includes(query) ||
        sch.provider.toLowerCase().includes(query) ||
        sch.eligibility.toLowerCase().includes(query)
      )
    };

    const totalResults = results.exams.length + results.universities.length + results.scholarships.length;

    res.json({
      success: true,
      data: {
        query: q,
        results,
        totalResults,
        summary: {
          exams: results.exams.length,
          universities: results.universities.length,
          scholarships: results.scholarships.length
        }
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
