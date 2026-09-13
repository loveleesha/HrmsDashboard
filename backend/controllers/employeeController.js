const fs = require("fs/promises");
const path = require("path");
const Employee = require("../models/Employee");
const User = require("../models/User");
const MESSAGES = require("../utils/messages");
const { CODES } = require("../utils/messages");
const { PROFILE_PICTURES_DIR, DOCUMENTS_DIR } = require("../utils/upload");

const REPORTS_TO_POPULATE = {
  path: "reportsTo",
  select: "employeeId designation user",
  populate: { path: "user", select: "name" },
};

function formatProfile(employee) {
  const user = employee.user;
  return {
    id: employee._id,
    employeeId: employee.employeeId,
    name: user?.name,
    email: user?.email,
    role: user?.role,
    lastLoginAt: user?.lastLoginAt || null,
    designation: employee.designation,
    department: employee.department,
    seniority: employee.seniority,
    phone: employee.phone,
    location: employee.location,
    joiningDate: employee.joiningDate,
    reportsTo: employee.reportsTo
      ? {
          id: employee.reportsTo._id,
          employeeId: employee.reportsTo.employeeId,
          designation: employee.reportsTo.designation,
          name: employee.reportsTo.user?.name,
        }
      : null,
    status: employee.status,
    skills: employee.skills,
    profilePicture: employee.profilePicture,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

// Single query (plus the small nested reportsTo lookup) — deliberately excludes the
// qualifications/documents arrays so the Basic Information tab stays light; those are
// fetched only when their own tab is opened.
async function fetchFullProfile(filter) {
  return Employee.findOne(filter)
    .select("-qualifications -documents")
    .populate("user", "name email role lastLoginAt")
    .populate(REPORTS_TO_POPULATE);
}

async function getMe(req, res, next) {
  try {
    const employee = await fetchFullProfile({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        errorCode: CODES.EMPLOYEE.PROFILE_NOT_FOUND,
        message: MESSAGES.EMPLOYEE.PROFILE_NOT_FOUND,
      });
    }
    res.status(200).json({ success: true, employee: formatProfile(employee) });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const employee = await fetchFullProfile({ _id: req.employee._id });
    res.status(200).json({ success: true, employee: formatProfile(employee) });
  } catch (err) {
    next(err);
  }
}

async function listEmployees(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.status) filter.status = req.query.status;

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .select("employeeId designation department seniority status user")
        .populate("user", "name email role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Employee.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      employees: employees.map((e) => ({
        id: e._id,
        employeeId: e.employeeId,
        name: e.user?.name,
        email: e.user?.email,
        role: e.user?.role,
        designation: e.designation,
        department: e.department,
        seniority: e.seniority,
        status: e.status,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

async function createEmployee(req, res, next) {
  try {
    const { userId, employeeId, designation, department, seniority, phone, location, joiningDate, reportsTo, skills } =
      req.body;

    const user = await User.findById(userId).select("_id").lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        errorCode: CODES.AUTH.INVALID_CREDENTIALS,
        message: "User not found",
      });
    }

    const existing = await Employee.findOne({ $or: [{ user: userId }, { employeeId }] })
      .select("_id")
      .lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        errorCode: CODES.EMPLOYEE.EMPLOYEE_ID_ALREADY_EXISTS,
        message: MESSAGES.EMPLOYEE.EMPLOYEE_ID_ALREADY_EXISTS,
      });
    }

    const employee = await Employee.create({
      user: userId,
      employeeId,
      designation,
      department,
      seniority,
      phone,
      location,
      joiningDate,
      reportsTo: reportsTo || null,
      skills: skills || [],
    });

    const full = await fetchFullProfile({ _id: employee._id });
    res.status(201).json({ success: true, employee: formatProfile(full) });
  } catch (err) {
    next(err);
  }
}

const SELF_EDITABLE_FIELDS = ["phone", "location", "skills"];
const PRIVILEGED_EDITABLE_FIELDS = [
  "designation",
  "department",
  "seniority",
  "phone",
  "location",
  "joiningDate",
  "reportsTo",
  "status",
  "skills",
];

async function applyUpdate(employeeId, body, allowedFields) {
  const update = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) update[field] = body[field];
  }
  const employee = await Employee.findByIdAndUpdate(employeeId, { $set: update }, { new: true });
  return employee;
}

async function updateMe(req, res, next) {
  try {
    const employee = await Employee.findOne({ user: req.user._id }).select("_id");
    if (!employee) {
      return res.status(404).json({
        success: false,
        errorCode: CODES.EMPLOYEE.PROFILE_NOT_FOUND,
        message: MESSAGES.EMPLOYEE.PROFILE_NOT_FOUND,
      });
    }
    await applyUpdate(employee._id, req.body, SELF_EDITABLE_FIELDS);
    const full = await fetchFullProfile({ _id: employee._id });
    res.status(200).json({ success: true, message: MESSAGES.EMPLOYEE.PROFILE_UPDATED, employee: formatProfile(full) });
  } catch (err) {
    next(err);
  }
}

async function updateById(req, res, next) {
  try {
    await applyUpdate(req.employee._id, req.body, PRIVILEGED_EDITABLE_FIELDS);
    const full = await fetchFullProfile({ _id: req.employee._id });
    res.status(200).json({ success: true, message: MESSAGES.EMPLOYEE.PROFILE_UPDATED, employee: formatProfile(full) });
  } catch (err) {
    next(err);
  }
}

async function deleteOldFile(dir, url) {
  if (!url) return;
  const filePath = path.join(dir, path.basename(url));
  await fs.unlink(filePath).catch(() => {});
}

async function uploadMyProfilePicture(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        errorCode: CODES.EMPLOYEE.PROFILE_PICTURE_REQUIRED,
        message: MESSAGES.EMPLOYEE.PROFILE_PICTURE_REQUIRED,
      });
    }

    const employee = await Employee.findOne({ user: req.user._id }).select("profilePicture");
    if (!employee) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({
        success: false,
        errorCode: CODES.EMPLOYEE.PROFILE_NOT_FOUND,
        message: MESSAGES.EMPLOYEE.PROFILE_NOT_FOUND,
      });
    }

    await deleteOldFile(PROFILE_PICTURES_DIR, employee.profilePicture?.url);

    const url = `/uploads/profile-pictures/${req.file.filename}`;
    employee.profilePicture = { url, uploadedAt: new Date() };
    await employee.save();

    res.status(200).json({
      success: true,
      message: MESSAGES.EMPLOYEE.PROFILE_PICTURE_UPDATED,
      profilePicture: employee.profilePicture,
    });
  } catch (err) {
    next(err);
  }
}

async function removeMyProfilePicture(req, res, next) {
  try {
    const employee = await Employee.findOne({ user: req.user._id }).select("profilePicture");
    if (!employee) {
      return res.status(404).json({
        success: false,
        errorCode: CODES.EMPLOYEE.PROFILE_NOT_FOUND,
        message: MESSAGES.EMPLOYEE.PROFILE_NOT_FOUND,
      });
    }
    if (!employee.profilePicture?.url) {
      return res.status(404).json({
        success: false,
        errorCode: CODES.EMPLOYEE.PROFILE_PICTURE_NOT_FOUND,
        message: MESSAGES.EMPLOYEE.PROFILE_PICTURE_NOT_FOUND,
      });
    }

    await deleteOldFile(PROFILE_PICTURES_DIR, employee.profilePicture.url);
    employee.profilePicture = { url: null, uploadedAt: null };
    await employee.save();

    res.status(200).json({ success: true, message: MESSAGES.EMPLOYEE.PROFILE_PICTURE_REMOVED });
  } catch (err) {
    next(err);
  }
}

async function listQualifications(req, res, next) {
  try {
    const employee = await Employee.findById(req.employee._id).select("qualifications").lean();
    res.status(200).json({ success: true, qualifications: employee.qualifications });
  } catch (err) {
    next(err);
  }
}

async function addQualification(req, res, next) {
  try {
    const { type, institution, boardOrDegree, startYear, endYear } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.employee._id,
      { $push: { qualifications: { type, institution, boardOrDegree, startYear, endYear } } },
      { new: true, select: "qualifications" }
    );
    res.status(201).json({
      success: true,
      message: MESSAGES.EMPLOYEE.QUALIFICATION_ADDED,
      qualifications: employee.qualifications,
    });
  } catch (err) {
    next(err);
  }
}

async function updateQualification(req, res, next) {
  try {
    const { qualId } = req.params;
    const allowedFields = ["type", "institution", "boardOrDegree", "startYear", "endYear"];
    const setOps = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) setOps[`qualifications.$.${field}`] = req.body[field];
    }

    const result = await Employee.updateOne(
      { _id: req.employee._id, "qualifications._id": qualId },
      { $set: setOps }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        errorCode: CODES.EMPLOYEE.QUALIFICATION_NOT_FOUND,
        message: MESSAGES.EMPLOYEE.QUALIFICATION_NOT_FOUND,
      });
    }

    const employee = await Employee.findById(req.employee._id).select("qualifications").lean();
    res.status(200).json({
      success: true,
      message: MESSAGES.EMPLOYEE.QUALIFICATION_UPDATED,
      qualifications: employee.qualifications,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteQualification(req, res, next) {
  try {
    const { qualId } = req.params;
    const employee = await Employee.findByIdAndUpdate(
      req.employee._id,
      { $pull: { qualifications: { _id: qualId } } },
      { new: true, select: "qualifications" }
    );
    res.status(200).json({
      success: true,
      message: MESSAGES.EMPLOYEE.QUALIFICATION_DELETED,
      qualifications: employee.qualifications,
    });
  } catch (err) {
    next(err);
  }
}

async function listDocuments(req, res, next) {
  try {
    const employee = await Employee.findById(req.employee._id).select("documents").lean();
    res.status(200).json({
      success: true,
      documents: employee.documents.map((d) => ({
        id: d._id,
        title: d.title,
        category: d.category,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        verificationStatus: d.verificationStatus,
        uploadedAt: d.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        errorCode: CODES.EMPLOYEE.DOCUMENT_FILE_REQUIRED,
        message: MESSAGES.EMPLOYEE.DOCUMENT_FILE_REQUIRED,
      });
    }

    const { title, category } = req.body;
    const fileUrl = `/uploads/documents/${req.file.filename}`;

    const employee = await Employee.findByIdAndUpdate(
      req.employee._id,
      {
        $push: {
          documents: {
            title,
            category,
            fileUrl,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            uploadedBy: req.user._id,
          },
        },
      },
      { new: true, select: "documents" }
    );

    const created = employee.documents[employee.documents.length - 1];
    res.status(201).json({
      success: true,
      message: MESSAGES.EMPLOYEE.DOCUMENT_UPLOADED,
      document: {
        id: created._id,
        title: created.title,
        category: created.category,
        fileSize: created.fileSize,
        mimeType: created.mimeType,
        verificationStatus: created.verificationStatus,
        uploadedAt: created.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function downloadDocument(req, res, next) {
  try {
    const { docId } = req.params;
    const employee = await Employee.findOne(
      { _id: req.employee._id, "documents._id": docId },
      { "documents.$": 1 }
    ).lean();

    if (!employee || !employee.documents?.length) {
      return res.status(404).json({
        success: false,
        errorCode: CODES.EMPLOYEE.DOCUMENT_NOT_FOUND,
        message: MESSAGES.EMPLOYEE.DOCUMENT_NOT_FOUND,
      });
    }

    const doc = employee.documents[0];
    const filePath = path.join(DOCUMENTS_DIR, path.basename(doc.fileUrl));
    res.download(filePath, doc.title);
  } catch (err) {
    next(err);
  }
}

async function verifyDocument(req, res, next) {
  try {
    const { docId } = req.params;
    const { verificationStatus } = req.body;

    const result = await Employee.updateOne(
      { _id: req.employee._id, "documents._id": docId },
      { $set: { "documents.$.verificationStatus": verificationStatus } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        errorCode: CODES.EMPLOYEE.DOCUMENT_NOT_FOUND,
        message: MESSAGES.EMPLOYEE.DOCUMENT_NOT_FOUND,
      });
    }

    res.status(200).json({ success: true, message: MESSAGES.EMPLOYEE.DOCUMENT_VERIFIED, verificationStatus });
  } catch (err) {
    next(err);
  }
}

async function deleteDocument(req, res, next) {
  try {
    const { docId } = req.params;
    const employee = await Employee.findOne(
      { _id: req.employee._id, "documents._id": docId },
      { "documents.$": 1 }
    );

    if (!employee || !employee.documents?.length) {
      return res.status(404).json({
        success: false,
        errorCode: CODES.EMPLOYEE.DOCUMENT_NOT_FOUND,
        message: MESSAGES.EMPLOYEE.DOCUMENT_NOT_FOUND,
      });
    }

    const fileUrl = employee.documents[0].fileUrl;
    await Employee.updateOne(
      { _id: req.employee._id },
      { $pull: { documents: { _id: docId } } }
    );
    await deleteOldFile(DOCUMENTS_DIR, fileUrl);

    res.status(200).json({ success: true, message: MESSAGES.EMPLOYEE.DOCUMENT_DELETED });
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
