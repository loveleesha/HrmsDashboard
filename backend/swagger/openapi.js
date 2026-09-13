const { ROLES } = require("../models/User");
const {
  QUALIFICATION_TYPES,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  EMPLOYEE_STATUSES,
} = require("../models/Employee");

const userSchema = {
  type: "object",
  properties: {
    id: { type: "string", example: "6aa547a1871a6708a93d715a" },
    name: { type: "string", example: "Lovesha Sharma" },
    email: { type: "string", format: "email", example: "lovesha@example.com" },
    role: { type: "string", enum: ROLES, example: "hr" },
  },
};

function successSchema(statusCode, extraProps = {}) {
  return {
    type: "object",
    properties: {
      statusCode: { type: "integer", example: statusCode },
      success: { type: "boolean", example: true },
      errorCode: { type: "string", nullable: true, example: null },
      ...extraProps,
    },
  };
}

function failResponse(statusCode, description, errorCode, message) {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "integer", example: statusCode },
            success: { type: "boolean", example: false },
            errorCode: { type: "string", example: errorCode },
            message: { type: "string", example: message },
          },
        },
      },
    },
  };
}

function successResponse(description, schema) {
  return {
    description,
    content: { "application/json": { schema } },
  };
}

// --- Employee module schemas ---

const locationSchema = {
  type: "object",
  properties: {
    city: { type: "string", example: "Delhi" },
    officeType: { type: "string", example: "Office" },
  },
};

const reportsToSchema = {
  type: "object",
  nullable: true,
  properties: {
    id: { type: "string", example: "6aa62b1faa059bcdec2cc80e" },
    employeeId: { type: "string", example: "EMP-1001" },
    designation: { type: "string", example: "Engineering Manager" },
    name: { type: "string", example: "Karan Malhotra" },
  },
};

const profilePictureSchema = {
  type: "object",
  properties: {
    url: {
      type: "string",
      nullable: true,
      example: "/uploads/profile-pictures/1789274984065-cbd6df20a58a08fb.png",
    },
    uploadedAt: { type: "string", format: "date-time", nullable: true },
  },
};

const employeeSchema = {
  type: "object",
  properties: {
    id: { type: "string", example: "6aa62ad2aa059bcdec2cc7b6" },
    employeeId: { type: "string", example: "EMP-1101" },
    name: { type: "string", example: "Aarav Sharma" },
    email: { type: "string", format: "email", example: "aarav.sharma@hikeassociate.com" },
    role: { type: "string", enum: ROLES, example: "employee" },
    lastLoginAt: { type: "string", format: "date-time", nullable: true },
    designation: { type: "string", example: "Senior Software Engineer" },
    department: { type: "string", example: "Engineering" },
    seniority: { type: "string", example: "Senior" },
    phone: { type: "string", example: "+91 98100 11234" },
    location: locationSchema,
    joiningDate: { type: "string", format: "date-time" },
    reportsTo: reportsToSchema,
    status: { type: "string", enum: EMPLOYEE_STATUSES, example: "active" },
    skills: { type: "array", items: { type: "string" }, example: ["React", "TypeScript", "Node.js"] },
    profilePicture: profilePictureSchema,
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const employeeDirectoryRowSchema = {
  type: "object",
  properties: {
    id: { type: "string", example: "6aa62ad2aa059bcdec2cc7b6" },
    employeeId: { type: "string", example: "EMP-1101" },
    name: { type: "string", example: "Aarav Sharma" },
    email: { type: "string", format: "email", example: "aarav.sharma@hikeassociate.com" },
    role: { type: "string", enum: ROLES, example: "employee" },
    designation: { type: "string", example: "Senior Software Engineer" },
    department: { type: "string", example: "Engineering" },
    seniority: { type: "string", example: "Senior" },
    status: { type: "string", enum: EMPLOYEE_STATUSES, example: "active" },
  },
};

const paginationSchema = {
  type: "object",
  properties: {
    page: { type: "integer", example: 1 },
    limit: { type: "integer", example: 20 },
    total: { type: "integer", example: 1 },
    totalPages: { type: "integer", example: 1 },
  },
};

const qualificationSchema = {
  type: "object",
  properties: {
    _id: { type: "string", example: "6aa62ae8aa059bcdec2cc7cd" },
    type: { type: "string", enum: QUALIFICATION_TYPES, example: "Graduation" },
    institution: { type: "string", example: "Delhi Technological University" },
    boardOrDegree: { type: "string", example: "B.Tech, Computer Science" },
    startYear: { type: "integer", example: 2012 },
    endYear: { type: "integer", example: 2016 },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const documentSchema = {
  type: "object",
  properties: {
    id: { type: "string", example: "6aa62af5aa059bcdec2cc7d3" },
    title: { type: "string", example: "PAN Card.pdf" },
    category: { type: "string", enum: DOCUMENT_CATEGORIES, example: "Identity" },
    fileSize: { type: "integer", example: 209 },
    mimeType: { type: "string", example: "application/pdf" },
    verificationStatus: { type: "string", enum: DOCUMENT_STATUSES, example: "Pending Review" },
    uploadedAt: { type: "string", format: "date-time" },
  },
};

const idParam = (name, example, description) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string", example },
});

const employeeIdParam = idParam("id", "6aa62ad2aa059bcdec2cc7b6", "Employee document _id");
const qualIdParam = idParam("qualId", "6aa62ae8aa059bcdec2cc7cd", "Qualification subdocument _id");
const docIdParam = idParam("docId", "6aa62af5aa059bcdec2cc7d3", "Document subdocument _id");

const notFoundResponse = failResponse(404, "Employee not found", "NOT_FOUND", "Employee not found");
const forbiddenResponse = failResponse(
  403,
  "Not self and not a privileged role (super-admin/admin/hr)",
  "FORBIDDEN",
  "You do not have permission to perform this action"
);
const unauthorizedResponse = failResponse(
  401,
  "Missing/invalid/expired JWT",
  "INVALID_TOKEN",
  "Invalid or expired token"
);

const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "HRMS API",
    version: "1.0.0",
    description:
      "Auth (registration, OTP verification, login, password reset/change) and Employee " +
      "(profile, qualifications, documents) APIs for the HRMS Dashboard. Every response includes " +
      "`statusCode` (the HTTP status, mirrored into the body), `success` (boolean), and `errorCode` " +
      "(`null` on success, a machine-readable string on failure).",
  },
  servers: [{ url: "/api" }],
  tags: [{ name: "Auth" }, { name: "Employees" }],
  paths: {
    // ============================== AUTH ==============================
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description:
          "Creates an unverified account and emails a 6-digit OTP (purpose: verify-account). " +
          "No token is returned here — the account cannot log in until verify-otp succeeds.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Lovesha Sharma" },
                  email: { type: "string", format: "email", example: "lovesha@example.com" },
                  password: { type: "string", format: "password", example: "Passw0rd1" },
                  role: { type: "string", enum: ROLES, default: "employee", example: "hr" },
                },
              },
            },
          },
        },
        responses: {
          201: successResponse(
            "Account created, OTP emailed",
            successSchema(201, {
              message: {
                type: "string",
                example: "Registration successful. An OTP has been sent to your email for verification.",
              },
              user: userSchema,
            })
          ),
          400: failResponse(
            400,
            "Validation failure (weak password, missing name, invalid role, ...)",
            "VALIDATION_ERROR",
            "Password must be at least 8 characters, Password must include a number"
          ),
          409: failResponse(
            409,
            "Email already registered",
            "EMAIL_ALREADY_REGISTERED",
            "Email already registered"
          ),
        },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify the registration OTP",
        description:
          "Confirms the OTP emailed by /register, sets isVerified=true, and returns a login token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp"],
                properties: {
                  email: { type: "string", format: "email", example: "lovesha@example.com" },
                  otp: { type: "string", minLength: 6, maxLength: 6, example: "907211" },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse(
            "Account verified",
            successSchema(200, {
              message: { type: "string", example: "Account verified successfully" },
              token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
              user: userSchema,
            })
          ),
          400: failResponse(400, "OTP wrong or expired", "OTP_INVALID_OR_EXPIRED", "Invalid or expired OTP"),
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "lovesha@example.com" },
                  password: { type: "string", format: "password", example: "Passw0rd1" },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse(
            "Login successful",
            successSchema(200, {
              message: { type: "string", example: "Login successful" },
              token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
              user: userSchema,
            })
          ),
          401: failResponse(
            401,
            "Wrong email or password",
            "INVALID_CREDENTIALS",
            "Invalid email or password"
          ),
          403: failResponse(
            403,
            "Credentials are correct but the account hasn't completed OTP verification",
            "ACCOUNT_NOT_VERIFIED",
            "Please verify your account using the OTP sent to your email before logging in"
          ),
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request a password-reset link by email",
        description:
          "Always responds 200 with a generic message whether or not the email exists, to avoid " +
          "user enumeration. When the account exists, generates a one-time resetToken (valid 1 hour) " +
          "and emails a clickable link — `${FRONTEND_URL}/resetpassword.html?token=...&email=...` — " +
          "that the user opens to set a new password via /reset-password.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email", example: "lovesha@example.com" } },
              },
            },
          },
        },
        responses: {
          200: successResponse(
            "Generic acknowledgement",
            successSchema(200, {
              message: {
                type: "string",
                example: "If an account with that email exists, a password reset link has been sent.",
              },
            })
          ),
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Set a new password using a resetToken (not logged in)",
        description:
          "Unauthenticated — the forgot-password flow. No Authorization header. Uses the " +
          "resetToken from the link emailed by /forgot-password (single-use, cleared immediately " +
          "after success). For a user who is already logged in, use /change-password instead.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "resetToken", "newPassword", "confirmPassword"],
                properties: {
                  email: { type: "string", format: "email", example: "lovesha@example.com" },
                  resetToken: {
                    type: "string",
                    example: "d18d9f3c77f6bcc388a1ef5d5df25491a4ceacfaff04f93f19e340c34f4770df",
                  },
                  newPassword: { type: "string", format: "password", example: "NewPassw0rd2" },
                  confirmPassword: { type: "string", format: "password", example: "NewPassw0rd2" },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse(
            "Password updated",
            successSchema(200, { message: { type: "string", example: "Password updated" } })
          ),
          400: failResponse(
            400,
            "Reset token invalid/expired/already used, or passwords don't match",
            "RESET_TOKEN_INVALID_OR_EXPIRED",
            "Invalid or expired reset token"
          ),
        },
      },
    },
    "/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Set a new password while logged in",
        description:
          "Authenticated only — requires `Authorization: Bearer <jwt>` from login/verify-otp, plus " +
          "the account's current password (`oldPassword`) as a second factor — this protects against " +
          "a stolen/leaked JWT being used to silently take over the account. No email/resetToken " +
          "needed or accepted. For a user who is not logged in, use /reset-password instead.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["oldPassword", "newPassword", "confirmPassword"],
                properties: {
                  oldPassword: { type: "string", format: "password", example: "Passw0rd1" },
                  newPassword: { type: "string", format: "password", example: "NewPassw0rd2" },
                  confirmPassword: { type: "string", format: "password", example: "NewPassw0rd2" },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse(
            "Password updated",
            successSchema(200, { message: { type: "string", example: "Password updated" } })
          ),
          401: failResponse(
            401,
            "The Bearer token is missing/invalid/expired, its user no longer exists, or oldPassword is wrong",
            "OLD_PASSWORD_INCORRECT",
            "Old password is incorrect"
          ),
        },
      },
    },

    // ============================== EMPLOYEES ==============================
    "/employees/me": {
      get: {
        tags: ["Employees"],
        summary: "Get my employee profile",
        description:
          "Basic Information + Contact + Employment + Skills for the logged-in user. Deliberately " +
          "excludes qualifications/documents — fetch those via their own endpoints only when that " +
          "tab is opened.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("Employee profile", successSchema(200, { employee: employeeSchema })),
          401: unauthorizedResponse,
          404: failResponse(
            404,
            "No Employee record exists yet for this account",
            "PROFILE_NOT_FOUND",
            "Employee profile not found for this account"
          ),
        },
      },
      patch: {
        tags: ["Employees"],
        summary: "Update my employee profile",
        description: "Self-editable fields only. For full edits (designation, department, status, " +
          "reportsTo, ...), a privileged user must use PATCH /employees/{id}.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  phone: { type: "string", example: "+91 99999 00000" },
                  location: locationSchema,
                  skills: { type: "array", items: { type: "string" }, example: ["React", "TypeScript", "GraphQL"] },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse(
            "Profile updated",
            successSchema(200, {
              message: { type: "string", example: "Profile updated successfully" },
              employee: employeeSchema,
            })
          ),
          401: unauthorizedResponse,
          404: failResponse(
            404,
            "No Employee record exists yet for this account",
            "PROFILE_NOT_FOUND",
            "Employee profile not found for this account"
          ),
        },
      },
    },
    "/employees/me/profile-picture": {
      post: {
        tags: ["Employees"],
        summary: "Upload/replace my profile picture",
        description: "JPG/PNG only, max 5 MB. Replaces and deletes any existing photo on disk.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["photo"],
                properties: { photo: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          200: successResponse(
            "Profile picture updated",
            successSchema(200, {
              message: { type: "string", example: "Profile picture updated successfully" },
              profilePicture: profilePictureSchema,
            })
          ),
          400: failResponse(400, "Wrong file type", "INVALID_FILE_TYPE", "Unsupported file type"),
          401: unauthorizedResponse,
        },
      },
      delete: {
        tags: ["Employees"],
        summary: "Remove my profile picture",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse(
            "Profile picture removed",
            successSchema(200, { message: { type: "string", example: "Profile picture removed successfully" } })
          ),
          401: unauthorizedResponse,
          404: failResponse(404, "No picture on file", "PROFILE_PICTURE_NOT_FOUND", "No profile picture on file"),
        },
      },
    },
    "/employees": {
      get: {
        tags: ["Employees"],
        summary: "List employees (Privileged)",
        description:
          "super-admin/admin/hr only. Returns only directory-row fields (no qualifications/documents, " +
          "no reportsTo populate) — stays fast regardless of list size.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "department", in: "query", schema: { type: "string" }, example: "Engineering" },
          { name: "status", in: "query", schema: { type: "string", enum: EMPLOYEE_STATUSES } },
        ],
        responses: {
          200: successResponse(
            "Employee directory",
            successSchema(200, {
              employees: { type: "array", items: employeeDirectoryRowSchema },
              pagination: paginationSchema,
            })
          ),
          401: unauthorizedResponse,
          403: forbiddenResponse,
        },
      },
      post: {
        tags: ["Employees"],
        summary: "Create employee (onboarding, Privileged)",
        description: "super-admin/admin/hr only. Attaches an HR profile to an already registered+verified User.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "employeeId", "designation"],
                properties: {
                  userId: { type: "string", example: "6aa62ac6aa059bcdec2cc7a8" },
                  employeeId: { type: "string", example: "EMP-1101" },
                  designation: { type: "string", example: "Senior Software Engineer" },
                  department: { type: "string", example: "Engineering" },
                  seniority: { type: "string", example: "Senior" },
                  phone: { type: "string", example: "+91 98100 11234" },
                  location: locationSchema,
                  joiningDate: { type: "string", format: "date", example: "2022-03-14" },
                  reportsTo: { type: "string", example: "6aa62b1faa059bcdec2cc80e" },
                  skills: { type: "array", items: { type: "string" }, example: ["React", "TypeScript", "Node.js"] },
                },
              },
            },
          },
        },
        responses: {
          201: successResponse("Employee created", successSchema(201, { employee: employeeSchema })),
          400: failResponse(400, "Validation failure", "VALIDATION_ERROR", "Valid userId is required"),
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: failResponse(404, "userId does not exist", "INVALID_CREDENTIALS", "User not found"),
          409: failResponse(
            409,
            "Duplicate userId (already onboarded) or employeeId",
            "EMPLOYEE_ID_ALREADY_EXISTS",
            "Employee ID already exists"
          ),
        },
      },
    },
    "/employees/{id}": {
      get: {
        tags: ["Employees"],
        summary: "Get employee by id",
        description: "Self (if {id} is your own record) or privileged (super-admin/admin/hr).",
        security: [{ bearerAuth: [] }],
        parameters: [employeeIdParam],
        responses: {
          200: successResponse("Employee profile", successSchema(200, { employee: employeeSchema })),
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
      patch: {
        tags: ["Employees"],
        summary: "Update employee by id (Privileged)",
        description:
          "super-admin/admin/hr only — not even the employee themself; self-edits use PATCH /employees/me.",
        security: [{ bearerAuth: [] }],
        parameters: [employeeIdParam],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  designation: { type: "string" },
                  department: { type: "string" },
                  seniority: { type: "string" },
                  phone: { type: "string" },
                  location: locationSchema,
                  joiningDate: { type: "string", format: "date" },
                  reportsTo: { type: "string", nullable: true },
                  status: { type: "string", enum: EMPLOYEE_STATUSES },
                  skills: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse(
            "Employee updated",
            successSchema(200, {
              message: { type: "string", example: "Profile updated successfully" },
              employee: employeeSchema,
            })
          ),
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
    },
    "/employees/{id}/qualifications": {
      get: {
        tags: ["Employees"],
        summary: "List qualifications",
        security: [{ bearerAuth: [] }],
        parameters: [employeeIdParam],
        responses: {
          200: successResponse(
            "Qualifications",
            successSchema(200, { qualifications: { type: "array", items: qualificationSchema } })
          ),
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
      post: {
        tags: ["Employees"],
        summary: "Add a qualification",
        security: [{ bearerAuth: [] }],
        parameters: [employeeIdParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "institution", "boardOrDegree", "endYear"],
                properties: {
                  type: { type: "string", enum: QUALIFICATION_TYPES, example: "Graduation" },
                  institution: { type: "string", example: "Delhi Technological University" },
                  boardOrDegree: { type: "string", example: "B.Tech, Computer Science" },
                  startYear: { type: "integer", example: 2012 },
                  endYear: { type: "integer", example: 2016 },
                },
              },
            },
          },
        },
        responses: {
          201: successResponse(
            "Qualification added",
            successSchema(201, {
              message: { type: "string", example: "Qualification added successfully" },
              qualifications: { type: "array", items: qualificationSchema },
            })
          ),
          400: failResponse(400, "Validation failure", "VALIDATION_ERROR", "Invalid qualification type"),
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
    },
    "/employees/{id}/qualifications/{qualId}": {
      patch: {
        tags: ["Employees"],
        summary: "Update a qualification",
        security: [{ bearerAuth: [] }],
        parameters: [employeeIdParam, qualIdParam],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  type: { type: "string", enum: QUALIFICATION_TYPES },
                  institution: { type: "string" },
                  boardOrDegree: { type: "string" },
                  startYear: { type: "integer" },
                  endYear: { type: "integer", example: 2017 },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse(
            "Qualification updated",
            successSchema(200, {
              message: { type: "string", example: "Qualification updated successfully" },
              qualifications: { type: "array", items: qualificationSchema },
            })
          ),
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: failResponse(404, "Employee or qualification not found", "QUALIFICATION_NOT_FOUND", "Qualification not found"),
        },
      },
      delete: {
        tags: ["Employees"],
        summary: "Delete a qualification",
        security: [{ bearerAuth: [] }],
        parameters: [employeeIdParam, qualIdParam],
        responses: {
          200: successResponse(
            "Qualification deleted",
            successSchema(200, {
              message: { type: "string", example: "Qualification deleted successfully" },
              qualifications: { type: "array", items: qualificationSchema },
            })
          ),
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
    },
    "/employees/{id}/documents": {
      get: {
        tags: ["Employees"],
        summary: "List documents",
        description: "Metadata only — no file content.",
        security: [{ bearerAuth: [] }],
        parameters: [employeeIdParam],
        responses: {
          200: successResponse(
            "Documents",
            successSchema(200, { documents: { type: "array", items: documentSchema } })
          ),
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
      post: {
        tags: ["Employees"],
        summary: "Upload a document",
        description: "JPG/PNG/PDF only, max 10 MB. New uploads always start as `Pending Review`.",
        security: [{ bearerAuth: [] }],
        parameters: [employeeIdParam],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title", "category", "file"],
                properties: {
                  title: { type: "string", example: "PAN Card.pdf" },
                  category: { type: "string", enum: DOCUMENT_CATEGORIES, example: "Identity" },
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          201: successResponse(
            "Document uploaded",
            successSchema(201, {
              message: { type: "string", example: "Document uploaded successfully" },
              document: documentSchema,
            })
          ),
          400: failResponse(400, "Missing fields or wrong file type", "INVALID_FILE_TYPE", "Unsupported file type"),
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
    },
    "/employees/{id}/documents/{docId}/download": {
      get: {
        tags: ["Employees"],
        summary: "Download a document",
        description:
          "Streams the file with the original title as the download filename. Never served " +
          "statically (unlike profile pictures) — documents can contain PII (PAN, Aadhaar, etc.).",
        security: [{ bearerAuth: [] }],
        parameters: [employeeIdParam, docIdParam],
        responses: {
          200: { description: "The raw file", content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } } },
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: failResponse(404, "Employee or document not found", "DOCUMENT_NOT_FOUND", "Document not found"),
        },
      },
    },
    "/employees/{id}/documents/{docId}/verify": {
      patch: {
        tags: ["Employees"],
        summary: "Verify a document (Privileged only)",
        description:
          "super-admin/admin/hr only — an employee can never verify their own documents, even " +
          "though they can otherwise manage their own documents freely.",
        security: [{ bearerAuth: [] }],
        parameters: [employeeIdParam, docIdParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["verificationStatus"],
                properties: {
                  verificationStatus: { type: "string", enum: DOCUMENT_STATUSES, example: "Verified" },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse(
            "Verification status updated",
            successSchema(200, {
              message: { type: "string", example: "Document verification status updated" },
              verificationStatus: { type: "string", enum: DOCUMENT_STATUSES, example: "Verified" },
            })
          ),
          401: unauthorizedResponse,
          403: failResponse(
            403,
            "Caller is not privileged (e.g. the document's own owner)",
            "FORBIDDEN",
            "You do not have permission to perform this action"
          ),
          404: failResponse(404, "Employee or document not found", "DOCUMENT_NOT_FOUND", "Document not found"),
        },
      },
    },
    "/employees/{id}/documents/{docId}": {
      delete: {
        tags: ["Employees"],
        summary: "Delete a document",
        description: "Removes the subdocument and deletes the file from disk.",
        security: [{ bearerAuth: [] }],
        parameters: [employeeIdParam, docIdParam],
        responses: {
          200: successResponse(
            "Document deleted",
            successSchema(200, { message: { type: "string", example: "Document deleted successfully" } })
          ),
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: failResponse(404, "Employee or document not found", "DOCUMENT_NOT_FOUND", "Document not found"),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
};

module.exports = openapiSpec;
