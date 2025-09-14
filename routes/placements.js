const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Placement = require('../models/Placement');
const User = require('../models/User');
const { authenticateToken, requirePlacementOfficer, requireOwnershipOrAdmin, logActivity } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/placements
// @desc    Get all placements with filters
// @access  Public (for viewing)
router.get('/', [
  query('department').optional().isIn(['Computer Engineering', 'Mechanical Engineering', 'E&TC Engineering']),
  query('year').optional().isInt({ min: 1, max: 4 }),
  query('status').optional().isIn(['Applied', 'Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Offer Received', 'Offer Accepted', 'Offer Declined', 'Rejected']),
  query('company').optional().trim(),
  query('industry').optional().isIn(['Technology', 'Manufacturing', 'Consulting', 'Finance', 'Healthcare', 'Education', 'Other']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const {
      department,
      year,
      status,
      company,
      industry,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    const filters = {};
    if (department) filters['student.department'] = department;
    if (year) filters['student.year'] = parseInt(year);
    if (status) filters.status = status;
    if (company) filters['company.name'] = { $regex: company, $options: 'i' };
    if (industry) filters['company.industry'] = industry;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get placements with populated student data
    const placements = await Placement.find(filters)
      .populate('student', 'firstName lastName studentId department year')
      .sort({ 'timeline.appliedDate': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Placement.countDocuments(filters);

    // Get statistics
    const stats = await Placement.getPlacementStats(filters);

    res.json({
      success: true,
      data: {
        placements,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        stats
      }
    });

  } catch (error) {
    console.error('Get placements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get placements',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/placements/:id
// @desc    Get placement by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id)
      .populate('student', 'firstName lastName studentId department year email phone')
      .populate('verifiedBy', 'firstName lastName');

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: 'Placement not found'
      });
    }

    res.json({
      success: true,
      data: {
        placement
      }
    });

  } catch (error) {
    console.error('Get placement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get placement',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/placements
// @desc    Create new placement record
// @access  Private (authenticated users)
router.post('/', [
  authenticateToken,
  body('company.name').notEmpty().trim().withMessage('Company name is required'),
  body('company.industry').isIn(['Technology', 'Manufacturing', 'Consulting', 'Finance', 'Healthcare', 'Education', 'Other']).withMessage('Invalid industry'),
  body('position.title').notEmpty().trim().withMessage('Job title is required'),
  body('package.ctc').isFloat({ min: 0 }).withMessage('CTC must be a positive number'),
  body('location.city').notEmpty().trim().withMessage('City is required'),
  body('location.state').notEmpty().trim().withMessage('State is required'),
  body('skills').isArray().withMessage('Skills must be an array')
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

    const placementData = {
      ...req.body,
      student: req.user._id
    };

    const placement = new Placement(placementData);
    await placement.save();

    // Populate student data for response
    await placement.populate('student', 'firstName lastName studentId department year');

    res.status(201).json({
      success: true,
      message: 'Placement record created successfully',
      data: {
        placement
      }
    });

    logActivity('Placement Record Created')(req, res, () => {});

  } catch (error) {
    console.error('Create placement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create placement record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/placements/:id
// @desc    Update placement record
// @access  Private (owner or placement officer)
router.put('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('student'),
  body('company.name').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('company.industry').optional().isIn(['Technology', 'Manufacturing', 'Consulting', 'Finance', 'Healthcare', 'Education', 'Other']).withMessage('Invalid industry'),
  body('position.title').optional().trim().notEmpty().withMessage('Job title cannot be empty'),
  body('package.ctc').optional().isFloat({ min: 0 }).withMessage('CTC must be a positive number'),
  body('status').optional().isIn(['Applied', 'Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Offer Received', 'Offer Accepted', 'Offer Declined', 'Rejected']).withMessage('Invalid status')
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

    const placement = await Placement.findById(req.params.id);
    if (!placement) {
      return res.status(404).json({
        success: false,
        message: 'Placement not found'
      });
    }

    // Update placement
    Object.assign(placement, req.body);
    await placement.save();

    // Populate student data for response
    await placement.populate('student', 'firstName lastName studentId department year');

    res.json({
      success: true,
      message: 'Placement record updated successfully',
      data: {
        placement
      }
    });

    logActivity('Placement Record Updated')(req, res, () => {});

  } catch (error) {
    console.error('Update placement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update placement record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/placements/:id
// @desc    Delete placement record
// @access  Private (owner or placement officer)
router.delete('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('student')
], async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id);
    if (!placement) {
      return res.status(404).json({
        success: false,
        message: 'Placement not found'
      });
    }

    await Placement.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Placement record deleted successfully'
    });

    logActivity('Placement Record Deleted')(req, res, () => {});

  } catch (error) {
    console.error('Delete placement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete placement record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/placements/stats/overview
// @desc    Get placement statistics overview
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const overallStats = await Placement.getPlacementStats();
    
    // Get department-wise stats
    const departmentStats = await Placement.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $unwind: '$studentInfo'
      },
      {
        $group: {
          _id: '$studentInfo.department',
          totalPlacements: { $sum: 1 },
          totalOffers: { $sum: { $cond: [{ $eq: ['$status', 'Offer Received'] }, 1, 0] } },
          totalAccepted: { $sum: { $cond: [{ $eq: ['$status', 'Offer Accepted'] }, 1, 0] } },
          avgPackage: { $avg: '$package.ctc' },
          maxPackage: { $max: '$package.ctc' }
        }
      }
    ]);

    // Get industry-wise stats
    const industryStats = await Placement.aggregate([
      {
        $group: {
          _id: '$company.industry',
          count: { $sum: 1 },
          avgPackage: { $avg: '$package.ctc' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await Placement.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$timeline.appliedDate' },
            month: { $month: '$timeline.appliedDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: overallStats,
        byDepartment: departmentStats,
        byIndustry: industryStats,
        monthlyTrends
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get placement statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/placements/student/:studentId
// @desc    Get placements for a specific student
// @access  Private (student or placement officer)
router.get('/student/:studentId', [
  authenticateToken,
  requireOwnershipOrAdmin('studentId')
], async (req, res) => {
  try {
    const placements = await Placement.find({ student: req.params.studentId })
      .sort({ 'timeline.appliedDate': -1 });

    res.json({
      success: true,
      data: {
        placements
      }
    });

  } catch (error) {
    console.error('Get student placements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student placements',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/placements/:id/verify
// @desc    Verify placement record (placement officer only)
// @access  Private (placement officer or admin)
router.post('/:id/verify', [
  authenticateToken,
  requirePlacementOfficer
], async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id);
    if (!placement) {
      return res.status(404).json({
        success: false,
        message: 'Placement not found'
      });
    }

    placement.isVerified = true;
    placement.verifiedBy = req.user._id;
    placement.verifiedAt = new Date();
    await placement.save();

    res.json({
      success: true,
      message: 'Placement record verified successfully',
      data: {
        placement
      }
    });

    logActivity('Placement Record Verified')(req, res, () => {});

  } catch (error) {
    console.error('Verify placement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify placement record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
