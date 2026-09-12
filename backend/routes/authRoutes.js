const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const protect = require("../middleware/auth");
const { ROLES } = require("../models/User");
const MESSAGES = require("../utils/messages");
const {
  register,
  verifyOtp,
  login,
  forgotPassword,
  changePassword,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

const { VALIDATION } = MESSAGES;

const emailRule = body("email").isEmail().withMessage(VALIDATION.EMAIL_INVALID).normalizeEmail();
const otpRule = body("otp").isLength({ min: 6, max: 6 }).withMessage(VALIDATION.OTP_LENGTH);

const strongPasswordRule = (field) =>
  body(field)
    .isLength({ min: 8 })
    .withMessage(VALIDATION.PASSWORD_MIN_LENGTH)
    .matches(/[a-z]/)
    .withMessage(VALIDATION.PASSWORD_LOWERCASE)
    .matches(/[A-Z]/)
    .withMessage(VALIDATION.PASSWORD_UPPERCASE)
    .matches(/[0-9]/)
    .withMessage(VALIDATION.PASSWORD_NUMBER);

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage(VALIDATION.NAME_REQUIRED),
    emailRule,
    strongPasswordRule("password"),
    body("role").optional().isIn(ROLES).withMessage(VALIDATION.ROLE_INVALID),
  ],
  validate,
  register
);

router.post("/verify-otp", [emailRule, otpRule], validate, verifyOtp);

router.post(
  "/login",
  [emailRule, body("password").notEmpty().withMessage(VALIDATION.PASSWORD_REQUIRED)],
  validate,
  login
);

router.post("/forgot-password", [emailRule], validate, forgotPassword);

const confirmPasswordRule = body("confirmPassword").custom((value, { req }) => {
  if (value !== req.body.newPassword) {
    throw new Error(VALIDATION.PASSWORDS_MISMATCH);
  }
  return true;
});

// Logged-in users only: requires a valid Authorization: Bearer <jwt> plus the current password.
router.post(
  "/change-password",
  protect,
  [
    body("oldPassword").notEmpty().withMessage(VALIDATION.OLD_PASSWORD_REQUIRED),
    strongPasswordRule("newPassword"),
    confirmPasswordRule,
  ],
  validate,
  changePassword
);

// Forgot-password flow: no auth, authenticated instead via the resetToken emailed by /forgot-password.
router.post(
  "/reset-password",
  [
    emailRule,
    body("resetToken").notEmpty().withMessage(VALIDATION.RESET_TOKEN_REQUIRED),
    strongPasswordRule("newPassword"),
    confirmPasswordRule,
  ],
  validate,
  resetPassword
);

module.exports = router;
