const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @desc    Register new user
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, studentId, department, year } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      studentId,
      department,
      year,
      emailVerificationToken
    });

    await user.save();

    // TODO: Send email (we’ll configure nodemailer later)
    console.log(`✅ Verification link: http://localhost:5000/api/auth/verify-email/${emailVerificationToken}`);

    res.status(201).json({ message: 'User registered! Please verify your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.isVerified = true;
    user.emailVerificationToken = undefined; // remove token
    await user.save();

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isVerified) return res.status(400).json({ message: 'Please verify your email first' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    await user.updateLastLogin();

    const token = generateToken(user);

    res.json({
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
