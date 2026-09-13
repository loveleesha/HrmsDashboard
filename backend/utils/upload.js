const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const MESSAGES = require("./messages");
const { CODES } = require("./messages");

const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");
const PROFILE_PICTURES_DIR = path.join(UPLOADS_ROOT, "profile-pictures");
const DOCUMENTS_DIR = path.join(UPLOADS_ROOT, "documents");

for (const dir of [PROFILE_PICTURES_DIR, DOCUMENTS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

function uniqueFilename(originalName) {
  const ext = path.extname(originalName);
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
}

const INVALID_FILE_TYPE = "INVALID_FILE_TYPE";
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
const DOCUMENT_MIME_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

function fileFilterFor(allowedMimeTypes) {
  return (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(Object.assign(new Error(INVALID_FILE_TYPE), { code: INVALID_FILE_TYPE }));
    }
    cb(null, true);
  };
}

const profilePictureUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PROFILE_PICTURES_DIR),
    filename: (req, file, cb) => cb(null, uniqueFilename(file.originalname)),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilterFor(IMAGE_MIME_TYPES),
});

const documentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, DOCUMENTS_DIR),
    filename: (req, file, cb) => cb(null, uniqueFilename(file.originalname)),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilterFor(DOCUMENT_MIME_TYPES),
});

// Wraps a multer single-file middleware so its errors (wrong mimetype, file too large)
// come back as our standard { success, errorCode, message } shape instead of a raw
// Multer error falling through to the generic 500 handler.
function handleUploadErrors(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (!err) return next();

      if (err.code === INVALID_FILE_TYPE) {
        return res
          .status(400)
          .json({ success: false, errorCode: CODES.FILE.INVALID_TYPE, message: MESSAGES.FILE.INVALID_TYPE });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ success: false, errorCode: CODES.FILE.TOO_LARGE, message: MESSAGES.FILE.TOO_LARGE });
      }
      next(err);
    });
  };
}

module.exports = {
  PROFILE_PICTURES_DIR,
  DOCUMENTS_DIR,
  profilePictureUpload,
  documentUpload,
  handleUploadErrors,
};
