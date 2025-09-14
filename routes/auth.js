const express = require("express");
const { body, validationResult } = require("express-validator");
const { registerUser, loginUser } = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

/**
 * ========================
 * REGISTER ROUTE
 * ========================
 */
router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("role")
      .isIn(["student", "faculty", "admin", "placement_officer"])
      .withMessage("Invalid role"),

    // Conditional validations
    body("studentId")
      .if(body("role").equals("student"))
      .notEmpty()
      .withMessage("Student ID is required for students"),
    body("department")
      .if(body("role").isIn(["student", "faculty"]))
      .isIn([
        "Computer Engineering",
        "Mechanical Engineering",
        "E&TC Engineering",
      ])
      .withMessage("Invalid department"),
    body("year")
      .if(body("role").equals("student"))
      .isInt({ min: 1, max: 4 })
      .withMessage("Year must be between 1 and 4"),
    body("phone")
      .optional()
      .matches(/^[0-9]{10}$/)
      .withMessage("Please enter a valid 10-digit phone number"),
  ],
  registerUser
);

/**
 * ========================
 * LOGIN ROUTE
 * ========================
 */
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  loginUser
);

/**
 * ========================
 * PROFILE ROUTE
 * ========================
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error("❌ Profile fetch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get profile" });
  }
});

module.exports = router;
