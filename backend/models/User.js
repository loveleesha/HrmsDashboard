const mongoose = require("mongoose");

const ROLES = ["super-admin", "admin", "hr", "manager", "employee"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "employee",
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
    otpHash: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    resetTokenHash: {
      type: String,
      select: false,
    },
    resetTokenExpiry: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
