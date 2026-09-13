const Employee = require("../models/Employee");
const MESSAGES = require("../utils/messages");
const { CODES } = require("../utils/messages");

const PRIVILEGED_ROLES = ["super-admin", "admin", "hr"];

async function loadEmployee(req, res, next) {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, errorCode: CODES.EMPLOYEE.NOT_FOUND, message: MESSAGES.EMPLOYEE.NOT_FOUND });
    }
    req.employee = employee;
    next();
  } catch (err) {
    next(err);
  }
}

function authorizeSelfOrPrivileged(req, res, next) {
  const isSelf = req.employee.user.toString() === req.user._id.toString();
  const isPrivileged = PRIVILEGED_ROLES.includes(req.user.role);
  if (!isSelf && !isPrivileged) {
    return res
      .status(403)
      .json({ success: false, errorCode: CODES.AUTH.FORBIDDEN, message: MESSAGES.AUTH.FORBIDDEN });
  }
  next();
}

module.exports = { loadEmployee, authorizeSelfOrPrivileged, PRIVILEGED_ROLES };
