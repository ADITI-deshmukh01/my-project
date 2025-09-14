const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireOwnProfile, logActivity } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (admin)
router.get('/', [
  authenticateToken,
  requireAdmin,
  query('role').optional().isIn(['student', 'faculty', 'admin', 'placement_officer']),
  query('department').optional().isIn(['Computer Engineering', 'Mechanical Engineering', 'E&TC Engineering']),
  query('year').optional().isInt({ min: 1, max: 4 }),
  query('isActive').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const {
      role,
      department,
      year,
      isActive,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    const filters = {};
    if (role) filters.role = role;
    if (department) filters.department = department;
    if (year) filters.year = parseInt(year);
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(filters)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filters);

    // Get user statistics
    const stats = await User.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          faculty: { $sum: { $cond: [{ $eq: ['$role', 'faculty'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          placementOfficers: { $sum: { $cond: [{ $eq: ['$role', 'placement_officer'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        stats: stats[0] || {
          totalUsers: 0,
          students: 0,
          faculty: 0,
          admins: 0,
          placementOfficers: 0
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (own profile or admin)
router.get('/:id', [
  authenticateToken,
  requireOwnProfile
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (own profile or admin)
router.put('/:id', [
  authenticateToken,
  requireOwnProfile,
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('department').optional().isIn(['Computer Engineering', 'Mechanical Engineering', 'E&TC Engineering']).withMessage('Invalid department'),
  body('year').optional().isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object')
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

    const updateData = {};
    const { firstName, lastName, phone, department, year, preferences } = req.body;

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;
    if (year) updateData.year = year;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user
      }
    });

    logActivity('Profile Update')(req, res, () => {});

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (admin)
router.delete('/:id', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

    logActivity('User Deleted')(req, res, () => {});

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (admin only)
// @access  Private (admin)
router.put('/:id/status', [
  authenticateToken,
  requireAdmin,
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: user.getPublicProfile()
      }
    });

    logActivity(`User ${isActive ? 'Activated' : 'Deactivated'}`)(req, res, () => {});

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (admin only)
// @access  Private (admin)
router.put('/:id/role', [
  authenticateToken,
  requireAdmin,
  body('role').isIn(['student', 'faculty', 'admin', 'placement_officer']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });

    logActivity('User Role Updated')(req, res, () => {});

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/students/department/:department
// @desc    Get students by department
// @access  Private (faculty, placement officer, admin)
router.get('/students/department/:department', [
  authenticateToken,
  query('year').optional().isInt({ min: 1, max: 4 })
], async (req, res) => {
  try {
    const { department } = req.params;
    const { year } = req.query;

    const filters = {
      role: 'student',
      department: department,
      isActive: true
    };

    if (year) {
      filters.year = parseInt(year);
    }

    const students = await User.find(filters)
      .select('firstName lastName studentId department year email phone')
      .sort({ year: 1, firstName: 1 });

    res.json({
      success: true,
      data: {
        students,
        total: students.length,
        department,
        year: year || 'All'
      }
    });

  } catch (error) {
    console.error('Get students by department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get students',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/students/year/:year
// @desc    Get students by year
// @access  Private (faculty, placement officer, admin)
router.get('/students/year/:year', [
  authenticateToken,
  query('department').optional().isIn(['Computer Engineering', 'Mechanical Engineering', 'E&TC Engineering'])
], async (req, res) => {
  try {
    const { year } = req.params;
    const { department } = req.query;

    const filters = {
      role: 'student',
      year: parseInt(year),
      isActive: true
    };

    if (department) {
      filters.department = department;
    }

    const students = await User.find(filters)
      .select('firstName lastName studentId department year email phone')
      .sort({ department: 1, firstName: 1 });

    res.json({
      success: true,
      data: {
        students,
        total: students.length,
        year: parseInt(year),
        department: department || 'All'
      }
    });

  } catch (error) {
    console.error('Get students by year error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get students',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/profile/me
// @desc    Get current user's complete profile
// @access  Private
router.get('/profile/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('enrolledTrainings', 'title category status')
      .populate('placements', 'company position status package');

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview (admin only)
// @access  Private (admin)
router.get('/stats/overview', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactiveUsers: { $sum: { $cond: ['$isActive', 0, 1] } },
          students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          faculty: { $sum: { $cond: [{ $eq: ['$role', 'faculty'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          placementOfficers: { $sum: { $cond: [{ $eq: ['$role', 'placement_officer'] }, 1, 0] } }
        }
      }
    ]);

    // Get department-wise student distribution
    const departmentStats = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get year-wise student distribution
    const yearStats = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: '$year',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          students: 0,
          faculty: 0,
          admins: 0,
          placementOfficers: 0
        },
        byDepartment: departmentStats,
        byYear: yearStats
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
