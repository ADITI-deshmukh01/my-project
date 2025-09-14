const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * ==============================
 * AUTHENTICATE TOKEN (JWT Verify)
 * ==============================
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expect: Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Invalid token user' });
    }

    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * ==============================
 * ADMIN ONLY
 * ==============================
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
  }
  next();
};

/**
 * ==============================
 * OWN PROFILE OR ADMIN
 * ==============================
 */
const requireOwnProfile = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?._id.toString() === req.params.id) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied: Not your profile' });
};

/**
 * ==============================
 * OWNERSHIP OR ADMIN (Generic)
 * ==============================
 */
const requireOwnershipOrAdmin = (paramKey = 'id') => {
  return (req, res, next) => {
    // Allow if admin
    if (req.user?.role === 'admin') {
      return next();
    }

    // Allow if resource belongs to logged-in user
    if (req.user && req.params[paramKey] && req.user._id.toString() === req.params[paramKey]) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied: Not your resource'
    });
  };
};

/**
 * ==============================
 * PLACEMENT OFFICER OR ADMIN
 * ==============================
 */
const requirePlacementOfficer = (req, res, next) => {
  if (req.user?.role !== 'placement_officer' && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Placement officers or admins only' });
  }
  next();
};

/**
 * ==============================
 * FACULTY OR ADMIN
 * ==============================
 */
const requireFaculty = (req, res, next) => {
  if (req.user?.role !== 'faculty' && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Faculty or admins only' });
  }
  next();
};

/**
 * ==============================
 * STUDENT ONLY
 * ==============================
 */
const requireStudent = (req, res, next) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied: Students only' });
  }
  next();
};

/**
 * ==============================
 * ROLE-BASED ACCESS
 * ==============================
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied: ${roles.join(' or ')} only` 
      });
    }
    next();
  };
};

/**
 * ==============================
 * ACTIVITY LOGGER
 * ==============================
 */
const logActivity = (action) => (req, res, next) => {
  console.log(`[Activity] ${action} by ${req.user?.email || 'Unknown User'}`);
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requirePlacementOfficer,
  requireFaculty,
  requireStudent,
  requireRole,
  requireOwnProfile,
  requireOwnershipOrAdmin,
  logActivity
};
