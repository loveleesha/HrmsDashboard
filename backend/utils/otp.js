const crypto = require("crypto");

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

module.exports = { generateOtp, generateResetToken, hashValue };
