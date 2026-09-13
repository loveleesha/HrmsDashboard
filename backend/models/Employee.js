const mongoose = require("mongoose");

const QUALIFICATION_TYPES = [
  "10th",
  "12th",
  "Diploma",
  "Graduation",
  "Post-Graduation",
  "Certification",
  "Other",
];

const DOCUMENT_CATEGORIES = ["Identity", "Employment", "Financial", "Other"];
const DOCUMENT_STATUSES = ["Pending Review", "Verified", "Rejected"];
const EMPLOYEE_STATUSES = ["active", "inactive", "on-leave", "terminated"];

const qualificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: QUALIFICATION_TYPES, required: true },
    institution: { type: String, required: true, trim: true },
    boardOrDegree: { type: String, required: true, trim: true },
    startYear: { type: Number },
    endYear: { type: Number, required: true },
  },
  { timestamps: true }
);

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: DOCUMENT_CATEGORIES, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    verificationStatus: { type: String, enum: DOCUMENT_STATUSES, default: "Pending Review" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    designation: { type: String, required: true, trim: true },
    department: { type: String, trim: true, index: true },
    seniority: { type: String, trim: true },
    phone: { type: String, trim: true },
    location: {
      city: { type: String, trim: true },
      officeType: { type: String, trim: true },
    },
    joiningDate: { type: Date },
    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    status: { type: String, enum: EMPLOYEE_STATUSES, default: "active", index: true },
    skills: [{ type: String, trim: true }],
    profilePicture: {
      url: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
    },
    qualifications: [qualificationSchema],
    documents: [documentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
module.exports.QUALIFICATION_TYPES = QUALIFICATION_TYPES;
module.exports.DOCUMENT_CATEGORIES = DOCUMENT_CATEGORIES;
module.exports.DOCUMENT_STATUSES = DOCUMENT_STATUSES;
module.exports.EMPLOYEE_STATUSES = EMPLOYEE_STATUSES;
