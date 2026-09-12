const { validationResult } = require("express-validator");
const { CODES } = require("../utils/messages");

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(", ");
    return res.status(400).json({ success: false, errorCode: CODES.COMMON.VALIDATION_ERROR, message });
  }
  next();
}

module.exports = validate;
