const express = require("express");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");
const protect = require("../middleware/auth");
const requireRole = require("../middleware/role");
const { loadEmployee, authorizeSelfOrPrivileged, PRIVILEGED_ROLES } = require("../middleware/employeeAccess");
const { profilePictureUpload, documentUpload, handleUploadErrors } = require("../utils/upload");
const { QUALIFICATION_TYPES, DOCUMENT_CATEGORIES, DOCUMENT_STATUSES } = require("../models/Employee");
const MESSAGES = require("../utils/messages");
const {
  getMe,
  getById,
  listEmployees,
  createEmployee,
  updateMe,
  updateById,
  uploadMyProfilePicture,
  removeMyProfilePicture,
  listQualifications,
  addQualification,
  updateQualification,
  deleteQualification,
  listDocuments,
  uploadDocument,
  downloadDocument,
  verifyDocument,
  deleteDocument,
} = require("../controllers/employeeController");

const router = express.Router();
const { VALIDATION } = MESSAGES;

router.use(protect);

const idParamRule = param("id").isMongoId().withMessage("Invalid employee id");
const qualIdParamRule = param("qualId").isMongoId().withMessage("Invalid qualification id");
const docIdParamRule = param("docId").isMongoId().withMessage("Invalid document id");

// --- Self-service ("me") ---

router.get("/me", getMe);

router.patch(
  "/me",
  [
    body("phone").optional().isString(),
    body("location").optional().isObject(),
    body("skills").optional().isArray(),
  ],
  validate,
  updateMe
);

router.post(
  "/me/profile-picture",
  handleUploadErrors(profilePictureUpload.single("photo")),
  uploadMyProfilePicture
);

router.delete("/me/profile-picture", removeMyProfilePicture);

// --- Directory (privileged) ---

router.get("/", requireRole(...PRIVILEGED_ROLES), listEmployees);

router.post(
  "/",
  requireRole(...PRIVILEGED_ROLES),
  [
    body("userId").isMongoId().withMessage("Valid userId is required"),
    body("employeeId").trim().notEmpty().withMessage(VALIDATION.EMPLOYEE_ID_REQUIRED),
    body("designation").trim().notEmpty().withMessage(VALIDATION.DESIGNATION_REQUIRED),
    body("reportsTo").optional().isMongoId(),
    body("skills").optional().isArray(),
  ],
  validate,
  createEmployee
);

// --- Single employee (self or privileged) ---

router.get("/:id", [idParamRule], validate, loadEmployee, authorizeSelfOrPrivileged, getById);

router.patch(
  "/:id",
  [idParamRule],
  validate,
  requireRole(...PRIVILEGED_ROLES),
  loadEmployee,
  updateById
);

// --- Qualifications ---

router.get(
  "/:id/qualifications",
  [idParamRule],
  validate,
  loadEmployee,
  authorizeSelfOrPrivileged,
  listQualifications
);

router.post(
  "/:id/qualifications",
  [
    idParamRule,
    body("type").isIn(QUALIFICATION_TYPES).withMessage(VALIDATION.QUALIFICATION_TYPE_INVALID),
    body("institution").trim().notEmpty().withMessage(VALIDATION.INSTITUTION_REQUIRED),
    body("boardOrDegree").trim().notEmpty().withMessage(VALIDATION.BOARD_OR_DEGREE_REQUIRED),
    body("endYear").isInt().withMessage(VALIDATION.END_YEAR_REQUIRED),
    body("startYear").optional().isInt(),
  ],
  validate,
  loadEmployee,
  authorizeSelfOrPrivileged,
  addQualification
);

router.patch(
  "/:id/qualifications/:qualId",
  [
    idParamRule,
    qualIdParamRule,
    body("type").optional().isIn(QUALIFICATION_TYPES).withMessage(VALIDATION.QUALIFICATION_TYPE_INVALID),
    body("endYear").optional().isInt(),
    body("startYear").optional().isInt(),
  ],
  validate,
  loadEmployee,
  authorizeSelfOrPrivileged,
  updateQualification
);

router.delete(
  "/:id/qualifications/:qualId",
  [idParamRule, qualIdParamRule],
  validate,
  loadEmployee,
  authorizeSelfOrPrivileged,
  deleteQualification
);

// --- Documents ---

router.get(
  "/:id/documents",
  [idParamRule],
  validate,
  loadEmployee,
  authorizeSelfOrPrivileged,
  listDocuments
);

router.post(
  "/:id/documents",
  [idParamRule],
  validate,
  loadEmployee,
  authorizeSelfOrPrivileged,
  handleUploadErrors(documentUpload.single("file")),
  [
    body("title").trim().notEmpty().withMessage(VALIDATION.DOCUMENT_TITLE_REQUIRED),
    body("category").isIn(DOCUMENT_CATEGORIES).withMessage(VALIDATION.DOCUMENT_CATEGORY_INVALID),
  ],
  validate,
  uploadDocument
);

router.get(
  "/:id/documents/:docId/download",
  [idParamRule, docIdParamRule],
  validate,
  loadEmployee,
  authorizeSelfOrPrivileged,
  downloadDocument
);

// Verification is privileged-only — an employee cannot verify their own documents.
router.patch(
  "/:id/documents/:docId/verify",
  [
    idParamRule,
    docIdParamRule,
    body("verificationStatus").isIn(DOCUMENT_STATUSES).withMessage(VALIDATION.VERIFICATION_STATUS_INVALID),
  ],
  validate,
  requireRole(...PRIVILEGED_ROLES),
  loadEmployee,
  verifyDocument
);

router.delete(
  "/:id/documents/:docId",
  [idParamRule, docIdParamRule],
  validate,
  loadEmployee,
  authorizeSelfOrPrivileged,
  deleteDocument
);

module.exports = router;
