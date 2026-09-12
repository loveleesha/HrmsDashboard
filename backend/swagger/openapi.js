const ROLES = ["super-admin", "admin", "hr", "manager", "employee"];

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

const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "HRMS Auth API",
    version: "1.0.0",
    description:
      "Registration, OTP verification, Login, Forgot Password, Reset Password, and Change Password " +
      "for the HRMS Dashboard. Every response includes `statusCode` (the HTTP status, mirrored " +
      "into the body), `success` (boolean), and `errorCode` (`null` on success, a machine-readable " +
      "string on failure).",
  },
  servers: [{ url: "/api/auth" }],
  tags: [{ name: "Auth" }],
  paths: {
    "/register": {
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
    "/verify-otp": {
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
    "/login": {
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
    "/forgot-password": {
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
    "/reset-password": {
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
    "/change-password": {
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
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
};

module.exports = openapiSpec;
