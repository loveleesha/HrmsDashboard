const MESSAGES = require("../utils/messages");
const { CODES } = require("../utils/messages");

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, errorCode: CODES.AUTH.FORBIDDEN, message: MESSAGES.AUTH.FORBIDDEN });
    }
    next();
  };
}

module.exports = requireRole;
