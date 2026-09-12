const User = require("../models/User");
const verifyToken = require("../utils/verifyToken");
const MESSAGES = require("../utils/messages");
const { CODES } = require("../utils/messages");

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, errorCode: CODES.AUTH.INVALID_TOKEN, message: MESSAGES.AUTH.INVALID_TOKEN });
  }

  try {
    const decoded = verifyToken(authHeader.slice(7));
    const user = await User.findById(decoded.id).select("_id role");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, errorCode: CODES.AUTH.INVALID_TOKEN, message: MESSAGES.AUTH.INVALID_TOKEN });
    }
    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, errorCode: CODES.AUTH.INVALID_TOKEN, message: MESSAGES.AUTH.INVALID_TOKEN });
  }
}

module.exports = protect;
