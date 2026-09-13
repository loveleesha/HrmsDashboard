const MESSAGES = {
  VALIDATION: {
    NAME_REQUIRED: "Name is required",
    EMAIL_INVALID: "Valid email is required",
    PASSWORD_REQUIRED: "Password is required",
    PASSWORD_MIN_LENGTH: "Password must be at least 8 characters",
    PASSWORD_LOWERCASE: "Password must include a lowercase letter",
    PASSWORD_UPPERCASE: "Password must include an uppercase letter",
    PASSWORD_NUMBER: "Password must include a number",
    PASSWORDS_MISMATCH: "Passwords do not match",
    ROLE_INVALID: "Invalid role",
    OTP_LENGTH: "OTP must be 6 digits",
    RESET_TOKEN_REQUIRED: "Reset token is required",
    OLD_PASSWORD_REQUIRED: "Old password is required",
    EMPLOYEE_ID_REQUIRED: "Employee ID is required",
    DESIGNATION_REQUIRED: "Designation is required",
    QUALIFICATION_TYPE_INVALID: "Invalid qualification type",
    INSTITUTION_REQUIRED: "Institution is required",
    BOARD_OR_DEGREE_REQUIRED: "Board / degree / course is required",
    END_YEAR_REQUIRED: "End year is required",
    DOCUMENT_TITLE_REQUIRED: "Document title is required",
    DOCUMENT_CATEGORY_INVALID: "Invalid document category",
    VERIFICATION_STATUS_INVALID: "Invalid verification status",
  },
  AUTH: {
    EMAIL_ALREADY_REGISTERED: "Email already registered",
    INVALID_CREDENTIALS: "Invalid email or password",
    OLD_PASSWORD_INCORRECT: "Old password is incorrect",
    ACCOUNT_NOT_VERIFIED: "Please verify your account using the OTP sent to your email before logging in",
    REGISTER_OTP_SENT: "Registration successful. An OTP has been sent to your email for verification.",
    ACCOUNT_VERIFIED: "Account verified successfully",
    LOGIN_SUCCESS: "Login successful",
    FORGOT_PASSWORD_SENT: "If an account with that email exists, a password reset link has been sent.",
    OTP_INVALID_OR_EXPIRED: "Invalid or expired OTP",
    RESET_TOKEN_INVALID_OR_EXPIRED: "Invalid or expired reset token",
    PASSWORD_UPDATED: "Password updated",
    INVALID_TOKEN: "Invalid or expired token",
    FORBIDDEN: "You do not have permission to perform this action",
  },
  EMPLOYEE: {
    NOT_FOUND: "Employee not found",
    PROFILE_NOT_FOUND: "Employee profile not found for this account",
    EMPLOYEE_ID_ALREADY_EXISTS: "Employee ID already exists",
    PROFILE_UPDATED: "Profile updated successfully",
    PROFILE_PICTURE_UPDATED: "Profile picture updated successfully",
    PROFILE_PICTURE_REMOVED: "Profile picture removed successfully",
    PROFILE_PICTURE_REQUIRED: "A profile picture file is required",
    PROFILE_PICTURE_NOT_FOUND: "No profile picture on file",
    QUALIFICATION_ADDED: "Qualification added successfully",
    QUALIFICATION_UPDATED: "Qualification updated successfully",
    QUALIFICATION_DELETED: "Qualification deleted successfully",
    QUALIFICATION_NOT_FOUND: "Qualification not found",
    DOCUMENT_UPLOADED: "Document uploaded successfully",
    DOCUMENT_DELETED: "Document deleted successfully",
    DOCUMENT_NOT_FOUND: "Document not found",
    DOCUMENT_FILE_REQUIRED: "A document file is required",
    DOCUMENT_VERIFIED: "Document verification status updated",
  },
  FILE: {
    TOO_LARGE: "File is too large",
    INVALID_TYPE: "Unsupported file type",
  },
  COMMON: {
    INTERNAL_SERVER_ERROR: "Internal server error",
    VALIDATION_ERROR: "Validation failed",
  },
};

// Machine-readable error codes, auto-derived from MESSAGES so they never drift out of sync
// (e.g. CODES.AUTH.INVALID_CREDENTIALS === "INVALID_CREDENTIALS").
function buildCodes(node) {
  const codes = {};
  for (const key of Object.keys(node)) {
    codes[key] = typeof node[key] === "string" ? key : buildCodes(node[key]);
  }
  return codes;
}

const CODES = buildCodes(MESSAGES);

module.exports = MESSAGES;
module.exports.CODES = CODES;
