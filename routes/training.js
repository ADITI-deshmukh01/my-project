const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Training = require('../models/Training');
const User = require('../models/User');
const { authenticateToken, requireFaculty, requireOwnershipOrAdmin, logActivity } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/training
// @desc    Get all training programs with filters
// @access  Public (for viewing)
router.get('/', [
  query('category').optional().isIn(['Technical Skills', 'Soft Skills', 'Interview Preparation', 'Aptitude', 'Coding', 'Communication', 'Leadership', 'Other']),
  query('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels']),
  query('type').optional().isIn(['Workshop', 'Seminar', 'Online Course', 'Bootcamp', 'Certification', 'Mock Interview', 'Practice Session']),
  query('status').optional().isIn(['Draft', 'Published', 'Enrollment Open', 'Enrollment Closed', 'In Progress', 'Completed', 'Cancelled']),
  query('isFeatured').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const {
      category,
      level,
      type,
      status,
      isFeatured,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    const filters = {};
    if (category) filters.category = category;
    if (level) filters.level = level;
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get trainings with populated instructor data
    const trainings = await Training.find(filters)
      .populate('instructor', 'name designation company')
      .sort({ 'schedule.startDate': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Training.countDocuments(filters);

    res.json({
      success: true,
      data: {
        trainings,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get trainings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get training programs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/training/:id
// @desc    Get training program by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('instructor', 'name designation company expertise bio')
      .populate('enrolledStudents.student', 'firstName lastName studentId department year');

    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training program not found'
      });
    }

    res.json({
      success: true,
      data: {
        training
      }
    });

  } catch (error) {
    console.error('Get training error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get training program',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/training
// @desc    Create new training program
// @access  Private (faculty or admin)
router.post('/', [
  authenticateToken,
  requireFaculty,
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('description').notEmpty().trim().withMessage('Description is required'),
  body('category').isIn(['Technical Skills', 'Soft Skills', 'Interview Preparation', 'Aptitude', 'Coding', 'Communication', 'Leadership', 'Other']).withMessage('Invalid category'),
  body('type').isIn(['Workshop', 'Seminar', 'Online Course', 'Bootcamp', 'Certification', 'Mock Interview', 'Practice Session']).withMessage('Invalid type'),
  body('level').isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).withMessage('Invalid level'),
  body('instructor.name').notEmpty().trim().withMessage('Instructor name is required'),
  body('schedule.startDate').isISO8601().withMessage('Valid start date is required'),
  body('schedule.endDate').isISO8601().withMessage('Valid end date is required'),
  body('schedule.duration').isFloat({ min: 1 }).withMessage('Duration must be at least 1 hour'),
  body('capacity.maxStudents').isInt({ min: 1 }).withMessage('Maximum capacity must be at least 1')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const trainingData = {
      ...req.body,
      createdBy: req.user._id
    };

    const training = new Training(trainingData);
    await training.save();

    // Populate instructor data for response
    await training.populate('instructor', 'name designation company');

    res.status(201).json({
      success: true,
      message: 'Training program created successfully',
      data: {
        training
      }
    });

    logActivity('Training Program Created')(req, res, () => {});

  } catch (error) {
    console.error('Create training error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create training program',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/training/:id
// @desc    Update training program
// @access  Private (creator or admin)
router.put('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('createdBy'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('category').optional().isIn(['Technical Skills', 'Soft Skills', 'Interview Preparation', 'Aptitude', 'Coding', 'Communication', 'Leadership', 'Other']).withMessage('Invalid category'),
  body('type').optional().isIn(['Workshop', 'Seminar', 'Online Course', 'Bootcamp', 'Certification', 'Mock Interview', 'Practice Session']).withMessage('Invalid type'),
  body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).withMessage('Invalid level'),
  body('status').optional().isIn(['Draft', 'Published', 'Enrollment Open', 'Enrollment Closed', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training program not found'
      });
    }

    // Update training
    Object.assign(training, req.body);
    await training.save();

    // Populate instructor data for response
    await training.populate('instructor', 'name designation company');

    res.json({
      success: true,
      message: 'Training program updated successfully',
      data: {
        training
      }
    });

    logActivity('Training Program Updated')(req, res, () => {});

  } catch (error) {
    console.error('Update training error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update training program',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/training/:id
// @desc    Delete training program
// @access  Private (creator or admin)
router.delete('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('createdBy')
], async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training program not found'
      });
    }

    // Check if students are enrolled
    if (training.enrolledStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete training program with enrolled students'
      });
    }

    await Training.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Training program deleted successfully'
    });

    logActivity('Training Program Deleted')(req, res, () => {});

  } catch (error) {
    console.error('Delete training error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete training program',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/training/:id/enroll
// @desc    Enroll student in training program
// @access  Private (authenticated students)
router.post('/:id/enroll', [
  authenticateToken,
  body('studentId').notEmpty().withMessage('Student ID is required')
], async (req, res) => {
  try {
    const { studentId } = req.body;

    // Verify student ID matches authenticated user
    if (req.user.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only enroll yourself in training programs'
      });
    }

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training program not found'
      });
    }

    // Check if enrollment is open
    if (!training.enrollment.isOpen) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment is not open for this training program'
      });
    }

    // Check if student is already enrolled
    const isEnrolled = training.enrolledStudents.some(
      enrollment => enrollment.student.toString() === req.user._id.toString()
    );

    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this training program'
      });
    }

    // Check capacity
    if (training.capacity.currentEnrolled >= training.capacity.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Training program is at full capacity'
      });
    }

    // Add student to enrolled list
    training.enrolledStudents.push({
      student: req.user._id,
      enrollmentDate: new Date(),
      status: 'Enrolled',
      progress: 0
    });

    training.capacity.currentEnrolled += 1;
    await training.save();

    res.json({
      success: true,
      message: 'Successfully enrolled in training program',
      data: {
        training: training._id,
        enrollmentDate: new Date()
      }
    });

    logActivity('Training Enrollment')(req, res, () => {});

  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in training program',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/training/:id/progress
// @desc    Update student progress in training
// @access  Private (enrolled student or instructor)
router.put('/:id/progress', [
  authenticateToken,
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  body('status').optional().isIn(['Enrolled', 'Completed', 'Dropped', 'On Hold']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { studentId, progress, status } = req.body;

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training program not found'
      });
    }

    // Find student enrollment
    const enrollment = training.enrolledStudents.find(
      e => e.student.toString() === req.user._id.toString()
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this training program'
      });
    }

    // Update progress and status
    enrollment.progress = progress;
    if (status) enrollment.status = status;

    // Check if completed
    if (progress === 100 && enrollment.status === 'Enrolled') {
      enrollment.status = 'Completed';
      enrollment.certificate.issued = true;
      enrollment.certificate.issuedDate = new Date();
      enrollment.certificate.certificateId = `CERT-${training._id}-${req.user._id}-${Date.now()}`;
    }

    await training.save();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        progress,
        status: enrollment.status,
        certificate: enrollment.certificate
      }
    });

    logActivity('Training Progress Updated')(req, res, () => {});

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/training/:id/feedback
// @desc    Submit feedback for training program
// @access  Private (enrolled students)
router.post('/:id/feedback', [
  authenticateToken,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
], async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training program not found'
      });
    }

    // Check if student is enrolled
    const isEnrolled = training.enrolledStudents.some(
      enrollment => enrollment.student.toString() === req.user._id.toString()
    );

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled to submit feedback'
      });
    }

    // Check if feedback already exists
    const existingFeedback = training.feedback.find(
      f => f.student.toString() === req.user._id.toString()
    );

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this training program'
      });
    }

    // Add feedback
    training.feedback.push({
      student: req.user._id,
      rating,
      comment,
      date: new Date()
    });

    await training.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

    logActivity('Training Feedback Submitted')(req, res, () => {});

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/training/featured
// @desc    Get featured training programs
// @access  Public
router.get('/featured/list', async (req, res) => {
  try {
    const featuredTrainings = await Training.find({ 
      isFeatured: true,
      status: { $in: ['Published', 'Enrollment Open'] }
    })
    .populate('instructor', 'name designation company')
    .sort({ 'schedule.startDate': 1 })
    .limit(6);

    res.json({
      success: true,
      data: {
        trainings: featuredTrainings
      }
    });

  } catch (error) {
    console.error('Get featured trainings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured training programs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
