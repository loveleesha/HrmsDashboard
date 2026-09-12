const MESSAGES = require("../utils/messages");
const { CODES } = require("../utils/messages");

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    errorCode: err.code || (status === 500 ? CODES.COMMON.INTERNAL_SERVER_ERROR : undefined),
    message: status === 500 ? MESSAGES.COMMON.INTERNAL_SERVER_ERROR : err.message,
  });
}

module.exports = errorHandler;
