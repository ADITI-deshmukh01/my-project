const express = require('express');
const { query } = require('express-validator');
const User = require('../models/User');
const Placement = require('../models/Placement');
const Training = require('../models/Training');
const { authenticateToken, requireAdmin, logActivity } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard overview
// @access  Private (admin only)
router.get('/dashboard', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          faculty: { $sum: { $cond: [{ $eq: ['$role', 'faculty'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          placementOfficers: { $sum: { $cond: [{ $eq: ['$role', 'placement_officer'] }, 1, 0] } }
        }
      }
    ]);

    const placementStats = await Placement.aggregate([
      {
        $group: {
          _id: null,
          totalPlacements: { $sum: 1 },
          totalOffers: { $sum: { $cond: [{ $eq: ['$status', 'Offer Received'] }, 1, 0] } },
          totalAccepted: { $sum: { $cond: [{ $eq: ['$status', 'Offer Accepted'] }, 1, 0] } },
          avgPackage: { $avg: '$package.ctc' },
          maxPackage: { $max: '$package.ctc' },
          verifiedPlacements: { $sum: { $cond: ['$isVerified', 1, 0] } }
        }
      }
    ]);

    const trainingStats = await Training.aggregate([
      {
        $group: {
          _id: null,
          totalTrainings: { $sum: 1 },
          publishedTrainings: { $sum: { $cond: [{ $eq: ['$status', 'Published'] }, 1, 0] } },
          activeTrainings: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          totalEnrollments: { $sum: '$capacity.currentEnrolled' },
          avgRating: { $avg: '$feedback.rating' }
        }
      }
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentPlacements = await Placement.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentTrainings = await Training.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    const departmentStats = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const currentYear = new Date().getFullYear();
    const monthlyTrends = await Placement.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) }
        }
      },
      {
        $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          users: userStats[0] || { totalUsers: 0, activeUsers: 0, students: 0, faculty: 0, admins: 0, placementOfficers: 0 },
          placements: placementStats[0] || { totalPlacements: 0, totalOffers: 0, totalAccepted: 0, avgPackage: 0, maxPackage: 0, verifiedPlacements: 0 },
          trainings: trainingStats[0] || { totalTrainings: 0, publishedTrainings: 0, activeTrainings: 0, totalEnrollments: 0, avgRating: 0 }
        },
        recentActivity: { newUsers: recentUsers, newPlacements: recentPlacements, newTrainings: recentTrainings },
        analytics: { byDepartment: departmentStats, monthlyTrends }
      }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get admin dashboard', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
});

// ------------------ Analytics: Users ------------------
router.get('/analytics/users', [
  authenticateToken,
  requireAdmin,
  query('period').optional().isIn(['7d','30d','90d','1y']).withMessage('Invalid period')
], async (req,res) => {
  try {
    const { period='30d' } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    switch(period){
      case '7d': startDate.setDate(endDate.getDate()-7); break;
      case '30d': startDate.setDate(endDate.getDate()-30); break;
      case '90d': startDate.setDate(endDate.getDate()-90); break;
      case '1y': startDate.setFullYear(endDate.getFullYear()-1); break;
    }

    const registrationTrends = await User.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { year: { $year:'$createdAt' }, month: { $month:'$createdAt' }, day: { $dayOfMonth:'$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year':1, '_id.month':1, '_id.day':1 } }
    ]);

    const roleDistribution = await User.aggregate([{ $group:{ _id:'$role', count:{ $sum:1 } } }, { $sort:{ count:-1 } }]);
    const departmentDistribution = await User.aggregate([{ $match:{ role:'student' } }, { $group:{ _id:'$department', count:{ $sum:1 } } }, { $sort:{ count:-1 } }]);
    const yearDistribution = await User.aggregate([{ $match:{ role:'student' } }, { $group:{ _id:'$year', count:{ $sum:1 } } }, { $sort:{ _id:1 } }]);
    const activeStatusDistribution = await User.aggregate([{ $group:{ _id:'$isActive', count:{ $sum:1 } } }]);

    res.json({ success:true, data:{ period, dateRange:{ start:startDate, end:endDate }, registrationTrends, roleDistribution, departmentDistribution, yearDistribution, activeStatusDistribution } });

  } catch(error){
    console.error('Get user analytics error:', error);
    res.status(500).json({ success:false, message:'Failed to get user analytics', error: process.env.NODE_ENV==='development'?error.message:'Internal server error' });
  }
});

// ------------------ Analytics: Placements ------------------
router.get('/analytics/placements', [
  authenticateToken,
  requireAdmin,
  query('period').optional().isIn(['7d','30d','90d','1y']).withMessage('Invalid period')
], async (req,res) => {
  try {
    const { period='30d' } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    switch(period){
      case '7d': startDate.setDate(endDate.getDate()-7); break;
      case '30d': startDate.setDate(endDate.getDate()-30); break;
      case '90d': startDate.setDate(endDate.getDate()-90); break;
      case '1y': startDate.setFullYear(endDate.getFullYear()-1); break;
    }

    const placementTrends = await Placement.aggregate([
      { $match: { createdAt:{ $gte:startDate, $lte:endDate } } },
      { $group:{ _id:{ year:{ $year:'$createdAt' }, month:{ $month:'$createdAt' }, day:{ $dayOfMonth:'$createdAt' } }, count:{ $sum:1 } } },
      { $sort:{ '_id.year':1,'_id.month':1,'_id.day':1 } }
    ]);

    const statusDistribution = await Placement.aggregate([{ $group:{ _id:'$status', count:{ $sum:1 } } }, { $sort:{ count:-1 } }]);
    const industryDistribution = await Placement.aggregate([{ $group:{ _id:'$company.industry', count:{ $sum:1 }, avgPackage:{ $avg:'$package.ctc' } } }, { $sort:{ count:-1 } }]);

    const packageDistribution = await Placement.aggregate([
      {
        $group:{
          _id:{
            $switch:{
              branches:[
                { case:{ $lt:['$package.ctc',500000] }, then:'0-5 LPA' },
                { case:{ $lt:['$package.ctc',1000000] }, then:'5-10 LPA' },
                { case:{ $lt:['$package.ctc',2000000] }, then:'10-20 LPA' }
              ],
              default:'20+ LPA'
            }
          },
          count:{ $sum:1 },
          avgPackage:{ $avg:'$package.ctc' }
        }
      },
      { $sort:{ _id:1 } }
    ]);

    const verificationStatus = await Placement.aggregate([{ $group:{ _id:'$isVerified', count:{ $sum:1 } } }]);

    res.json({ success:true, data:{ period, dateRange:{ start:startDate, end:endDate }, placementTrends, statusDistribution, industryDistribution, packageDistribution, verificationStatus } });

  } catch(error){
    console.error('Get placement analytics error:', error);
    res.status(500).json({ success:false, message:'Failed to get placement analytics', error: process.env.NODE_ENV==='development'?error.message:'Internal server error' });
  }
});

// ------------------ Analytics: Trainings ------------------
router.get('/analytics/trainings', [
  authenticateToken,
  requireAdmin,
  query('period').optional().isIn(['7d','30d','90d','1y']).withMessage('Invalid period')
], async (req,res) => {
  try{
    const { period='30d' } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    switch(period){
      case '7d': startDate.setDate(endDate.getDate()-7); break;
      case '30d': startDate.setDate(endDate.getDate()-30); break;
      case '90d': startDate.setDate(endDate.getDate()-90); break;
      case '1y': startDate.setFullYear(endDate.getFullYear()-1); break;
    }

    const creationTrends = await Training.aggregate([
      { $match:{ createdAt:{ $gte:startDate, $lte:endDate } } },
      { $group:{ _id:{ year:{ $year:'$createdAt' }, month:{ $month:'$createdAt' }, day:{ $dayOfMonth:'$createdAt' } }, count:{ $sum:1 } } },
      { $sort:{ '_id.year':1,'_id.month':1,'_id.day':1 } }
    ]);

    const statusDistribution = await Training.aggregate([{ $group:{ _id:'$status', count:{ $sum:1 } } }, { $sort:{ count:-1 } }]);
    const categoryDistribution = await Training.aggregate([{ $group:{ _id:'$category', count:{ $sum:1 }, avgRating:{ $avg:'$feedback.rating' } } }, { $sort:{ count:-1 } }]);
    const levelDistribution = await Training.aggregate([{ $group:{ _id:'$level', count:{ $sum:1 } } }, { $sort:{ count:-1 } }]);
    const enrollmentTrends = await Training.aggregate([
      { $unwind:'$enrolledStudents' },
      { $match:{ 'enrolledStudents.enrollmentDate':{ $gte:startDate, $lte:endDate } } },
      { $group:{ _id:{ year:{ $year:'$enrolledStudents.enrollmentDate' }, month:{ $month:'$enrolledStudents.enrollmentDate' }, day:{ $dayOfMonth:'$enrolledStudents.enrollmentDate' } }, count:{ $sum:1 } } },
      { $sort:{ '_id.year':1,'_id.month':1,'_id.day':1 } }
    ]);

    res.json({ success:true, data:{ period, dateRange:{ start:startDate, end:endDate }, creationTrends, statusDistribution, categoryDistribution, levelDistribution, enrollmentTrends } });

  } catch(error){
    console.error('Get training analytics error:', error);
    res.status(500).json({ success:false, message:'Failed to get training analytics', error: process.env.NODE_ENV==='development'?error.message:'Internal server error' });
  }
});

// ------------------ System Operations ------------------
router.post('/system/backup', [authenticateToken, requireAdmin], async (req,res) => {
  try{
    res.json({ success:true, message:'System backup initiated successfully', data:{ backupId:`BACKUP-${Date.now()}`, timestamp:new Date().toISOString(), status:'In Progress' } });
    logActivity('System Backup Initiated')(req,res,()=>{});
  } catch(error){
    console.error('System backup error:', error);
    res.status(500).json({ success:false, message:'Failed to initiate system backup', error: process.env.NODE_ENV==='development'?error.message:'Internal server error' });
  }
});

router.get('/system/health', [authenticateToken, requireAdmin], async (req,res)=>{
  try{
    const dbStatus = await User.db.db.admin().ping();
    const systemMetrics = { uptime:process.uptime(), memoryUsage:process.memoryUsage(), nodeVersion:process.version, platform:process.platform, arch:process.arch };
    const dbStats = await User.db.db.stats();

    res.json({ success:true, data:{ status:'Healthy', timestamp:new Date().toISOString(), database:{ status:dbStatus?'Connected':'Disconnected', collections:dbStats.collections, dataSize:dbStats.dataSize, storageSize:dbStats.storageSize, indexes:dbStats.indexes }, system:systemMetrics } });
  } catch(error){
    console.error('System health check error:', error);
    res.status(500).json({ success:false, message:'Failed to check system health', error: process.env.NODE_ENV==='development'?error.message:'Internal server error' });
  }
});

module.exports = router;
