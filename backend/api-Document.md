# HRMS API Documentation

Two modules are documented here: **[Auth API](#auth-api-documentation)** (`/api/auth`) and
**[Employee API](#employee-api-documentation)** (`/api/employees`, further down this file).

# Auth API Documentation

Base URL: `http://localhost:5000/api/auth`

All requests/responses are JSON. All endpoints are `POST`. Roles: `super-admin | admin | hr | manager | employee`.

**Response envelope**: every response — success or failure — carries the same top-level keys, added
automatically by [middleware/responseFormatter.js](middleware/responseFormatter.js) (no controller
sets them directly):

```json
{ "statusCode": 200, "success": true, "errorCode": null, "message": "...", "...": "endpoint-specific fields" }
```

- `statusCode` — the actual HTTP status code of the response.
- `success` — `true`/`false`.
- `errorCode` — `null` on success; a machine-readable string on failure (e.g. `INVALID_CREDENTIALS`,
  `OTP_INVALID_OR_EXPIRED`), auto-derived from [utils/messages.js](utils/messages.js) so a code can
  never drift out of sync with its message text.
- `message` — human-readable text.

There is never an `errors` array — multiple validation failures are joined into one `message` string.

**Interactive docs**: run the server and open `http://localhost:5000/api-docs` for a live Swagger UI
built from [swagger/openapi.js](swagger/openapi.js) — request/response schemas, "Try it out", the works.

---

## 1. Register

`POST /api/auth/register`

Creates a new user. `role` is optional — if omitted or invalid, defaults to `employee`. The account
is created **unverified**: no JWT is returned here, and login is blocked until the OTP emailed by
this call is confirmed via `verify-otp` (step 2).

### Request body

| Field    | Type   | Required | Notes                                                              |
|----------|--------|----------|---------------------------------------------------------------------|
| name     | string | yes      | non-empty                                                           |
| email    | string | yes      | valid email, unique                                                 |
| password | string | yes      | min 8 chars, 1 uppercase, 1 lowercase, 1 number                     |
| role     | string | no       | one of `super-admin, admin, hr, manager, employee` (default: employee) |

### curl

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lovesha Sharma",
    "email": "lovesha@example.com",
    "password": "Passw0rd1",
    "role": "hr"
  }'
```

### Success response — `201 Created`

```json
{
  "statusCode": 201,
  "success": true,
  "errorCode": null,
  "message": "Registration successful. An OTP has been sent to your email for verification.",
  "user": {
    "id": "6aa547a1871a6708a93d715a",
    "name": "Lovesha Sharma",
    "email": "lovesha@example.com",
    "role": "hr"
  }
}
```

### Error responses

Email already registered — `409 Conflict`
```json
{ "statusCode": 409, "success": false, "errorCode": "EMAIL_ALREADY_REGISTERED", "message": "Email already registered" }
```

Validation failure (e.g. weak password, missing name, invalid role) — `400 Bad Request`.
Multiple violations are combined into one comma-separated message:
```json
{
  "statusCode": 400,
  "success": false,
  "errorCode": "VALIDATION_ERROR",
  "message": "Password must be at least 8 characters, Password must include a number"
}
```

---

## 2. Verify OTP (registration)

`POST /api/auth/verify-otp`

Confirms the OTP sent by `register`, activates the account (`isVerified: true`), and returns a login
JWT so the client doesn't need a separate `login` call right after.

### Request body

| Field | Type   | Required | Notes            |
|-------|--------|----------|-------------------|
| email | string | yes      |                   |
| otp   | string | yes      | exactly 6 digits  |

### curl

```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lovesha@example.com",
    "otp": "907211"
  }'
```

### Success response — `200 OK`

```json
{
  "statusCode": 200,
  "success": true,
  "errorCode": null,
  "message": "Account verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6aa547a1871a6708a93d715a",
    "name": "Lovesha Sharma",
    "email": "lovesha@example.com",
    "role": "hr"
  }
}
```

### Error response

Wrong or expired OTP — `400 Bad Request`
```json
{ "statusCode": 400, "success": false, "errorCode": "OTP_INVALID_OR_EXPIRED", "message": "Invalid or expired OTP" }
```

---

## 3. Login

`POST /api/auth/login`

### Request body

| Field    | Type   | Required |
|----------|--------|----------|
| email    | string | yes      |
| password | string | yes      |

### curl

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lovesha@example.com",
    "password": "Passw0rd1"
  }'
```

### Success response — `200 OK`

```json
{
  "statusCode": 200,
  "success": true,
  "errorCode": null,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYTU0N2ExODcxYTY3MDhhOTNkNzE1YSIsInJvbGUiOiJociIsImlhdCI6MTc4OTIxNjY3MywiZXhwIjoxNzg5ODIxNDczfQ.BnWb_bB0d8vXAklEhyVMcluGl8TBqD0dWK8X15aSZVo",
  "user": {
    "id": "6aa547a1871a6708a93d715a",
    "name": "Lovesha Sharma",
    "email": "lovesha@example.com",
    "role": "hr"
  }
}
```

### Error responses

Wrong email or password — `401 Unauthorized` (deliberately generic, doesn't reveal which field is wrong)
```json
{ "statusCode": 401, "success": false, "errorCode": "INVALID_CREDENTIALS", "message": "Invalid email or password" }
```

Correct credentials, but the account hasn't completed OTP verification yet — `403 Forbidden`
```json
{ "statusCode": 403, "success": false, "errorCode": "ACCOUNT_NOT_VERIFIED", "message": "Please verify your account using the OTP sent to your email before logging in" }
```

---

## 4. Forgot Password

`POST /api/auth/forgot-password`

**No OTP for this flow.** Generates a one-time reset token directly, stores its hash (never the raw
token) with a 1-hour expiry, and emails a clickable link:
`${FRONTEND_URL}/resetpassword.html?token=<resetToken>&email=<email>`.
[resetpassword.html](../resetpassword.html) reads `token`/`email` straight from the URL and posts
them to `/reset-password` — no separate OTP-entry step.

### Request body

| Field | Type   | Required |
|-------|--------|----------|
| email | string | yes      |

### curl

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lovesha@example.com"
  }'
```

### Response — `200 OK`

Always returns the same generic message, whether or not the email exists in the system (prevents user enumeration):

```json
{
  "statusCode": 200,
  "success": true,
  "errorCode": null,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

---

## 5. Reset Password

`POST /api/auth/reset-password`

**Unauthenticated** — the forgot-password flow. No `Authorization` header. Uses the `resetToken`
from the link emailed by `forgot-password`; the token is single-use — cleared immediately after a
successful password change and cannot be replayed.

### Request body

| Field           | Type   | Required | Notes                                                        |
|-----------------|--------|----------|----------------------------------------------------------------|
| email           | string | yes      |                                                                  |
| resetToken      | string | yes      | from the link's `token` query param                             |
| newPassword     | string | yes      | min 8 chars, 1 uppercase, 1 lowercase, 1 number                 |
| confirmPassword | string | yes      | must match `newPassword`                                        |

### curl

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lovesha@example.com",
    "resetToken": "d18d9f3c77f6bcc388a1ef5d5df25491a4ceacfaff04f93f19e340c34f4770df",
    "newPassword": "NewPassw0rd2",
    "confirmPassword": "NewPassw0rd2"
  }'
```

### Success response — `200 OK`

```json
{ "statusCode": 200, "success": true, "errorCode": null, "message": "Password updated" }
```

### Error responses

Reset token invalid, expired, or already used — `400 Bad Request`:
```json
{ "statusCode": 400, "success": false, "errorCode": "RESET_TOKEN_INVALID_OR_EXPIRED", "message": "Invalid or expired reset token" }
```

Passwords don't match — `400 Bad Request`:
```json
{ "statusCode": 400, "success": false, "errorCode": "VALIDATION_ERROR", "message": "Passwords do not match" }
```

---

## 6. Change Password

`POST /api/auth/change-password`

**Authenticated only** — for a user who is already logged in and wants to set a new password.
Requires `Authorization: Bearer <jwt>` from `login`/`verify-otp`; the route is guarded by
[middleware/auth.js](middleware/auth.js)'s `protect`, which runs before body validation. No `email`
or `resetToken` — the user is identified by the JWT.

### Request body

| Field           | Type   | Required | Notes                                            |
|-----------------|--------|----------|----------------------------------------------------|
| oldPassword     | string | yes      | must match the user's current password             |
| newPassword     | string | yes      | min 8 chars, 1 uppercase, 1 lowercase, 1 number   |
| confirmPassword | string | yes      | must match `newPassword`                          |

The JWT identifies the account, but the change also requires `oldPassword` — this protects against
someone with a stolen/leaked JWT silently taking over the account.

### curl

```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt from login/verify-otp>" \
  -d '{
    "oldPassword": "Passw0rd1",
    "newPassword": "NewPassw0rd2",
    "confirmPassword": "NewPassw0rd2"
  }'
```

### Success response — `200 OK`

```json
{ "statusCode": 200, "success": true, "errorCode": null, "message": "Password updated" }
```

### Error responses

Missing/invalid/expired token, or the token's user no longer exists — `401 Unauthorized`:
```json
{ "statusCode": 401, "success": false, "errorCode": "INVALID_TOKEN", "message": "Invalid or expired token" }
```

`oldPassword` doesn't match the account's current password — `401 Unauthorized`:
```json
{ "statusCode": 401, "success": false, "errorCode": "OLD_PASSWORD_INCORRECT", "message": "Old password is incorrect" }
```

Passwords don't match — `400 Bad Request`:
```json
{ "statusCode": 400, "success": false, "errorCode": "VALIDATION_ERROR", "message": "Passwords do not match" }
```

---

## Common error shapes

Every error response has exactly the same shape — `statusCode`, `success`, `errorCode`, `message`.

| statusCode | Meaning                                   | `errorCode`                       | Shape                                              |
|------------|---------------------------------------------|-------------------------------------|-----------------------------------------------------|
| 400        | Validation error                             | `VALIDATION_ERROR`                  | `{ "statusCode": 400, "success": false, "errorCode": "VALIDATION_ERROR", "message": "..." }` |
| 400        | Bad/expired registration OTP                 | `OTP_INVALID_OR_EXPIRED`            | `{ "statusCode": 400, "success": false, "errorCode": "OTP_INVALID_OR_EXPIRED", "message": "Invalid or expired OTP" }` |
| 400        | Bad/expired/reused reset token               | `RESET_TOKEN_INVALID_OR_EXPIRED`    | `{ "statusCode": 400, "success": false, "errorCode": "RESET_TOKEN_INVALID_OR_EXPIRED", "message": "Invalid or expired reset token" }` |
| 401        | Invalid login credentials                    | `INVALID_CREDENTIALS`               | `{ "statusCode": 401, "success": false, "errorCode": "INVALID_CREDENTIALS", "message": "Invalid email or password" }` |
| 401        | Missing/invalid/expired JWT (change-password)| `INVALID_TOKEN`                     | `{ "statusCode": 401, "success": false, "errorCode": "INVALID_TOKEN", "message": "Invalid or expired token" }` |
| 401        | Wrong current password (change-password)     | `OLD_PASSWORD_INCORRECT`            | `{ "statusCode": 401, "success": false, "errorCode": "OLD_PASSWORD_INCORRECT", "message": "Old password is incorrect" }` |
| 403        | Valid credentials, account not yet verified  | `ACCOUNT_NOT_VERIFIED`              | `{ "statusCode": 403, "success": false, "errorCode": "ACCOUNT_NOT_VERIFIED", "message": "Please verify your account using the OTP sent to your email before logging in" }` |
| 409        | Duplicate email on register                  | `EMAIL_ALREADY_REGISTERED`          | `{ "statusCode": 409, "success": false, "errorCode": "EMAIL_ALREADY_REGISTERED", "message": "Email already registered" }` |
| 500        | Unexpected server error                      | `INTERNAL_SERVER_ERROR`             | `{ "statusCode": 500, "success": false, "errorCode": "INTERNAL_SERVER_ERROR", "message": "Internal server error" }` |

All response messages are centralized in [utils/messages.js](utils/messages.js); `errorCode` values
are auto-derived from the same object (`CODES.AUTH.INVALID_CREDENTIALS === "INVALID_CREDENTIALS"`),
so update strings/codes there rather than in the controllers/routes. `statusCode` and `errorCode`
are both injected automatically by [middleware/responseFormatter.js](middleware/responseFormatter.js)
— no controller sets them directly (controllers only set `success`, `message`, and any extra data).

## End-to-end flows

Registration (account is unusable until verified):
```
register (name, email, password, role) ──▶ OTP emailed
        │
        ▼
verify-otp (email, otp) ──▶ isVerified = true, returns login token
        │
        ▼
login (email, password) ──▶ now succeeds
```

Password reset (forgot-password, not logged in):
```
forgot-password (email) ──▶ link emailed: resetpassword.html?token=...&email=...
        │
        ▼
   user clicks the link, lands on resetpassword.html
        │
        ▼
reset-password (email, resetToken, newPassword, confirmPassword)
```

Change password (already logged in):
```
login or verify-otp ──▶ jwt
        │
        ▼
change-password (Authorization: Bearer <jwt>, oldPassword, newPassword, confirmPassword)
```

`reset-password` and `change-password` are separate endpoints for separate situations —
`reset-password` never accepts a JWT, `change-password` never accepts a `resetToken`.

## Full curl sequence (copy/paste)

```bash
BASE=http://localhost:5000/api/auth

# 1. Register (account created unverified, OTP emailed)
curl -s -X POST $BASE/register -H "Content-Type: application/json" -d '{
  "name": "Lovesha Sharma", "email": "lovesha@example.com", "password": "Passw0rd1", "role": "hr"
}'

# 2. Login before verifying -> 403 (expected)
curl -s -X POST $BASE/login -H "Content-Type: application/json" -d '{
  "email": "lovesha@example.com", "password": "Passw0rd1"
}'

# 3. Verify OTP from step 1 (check email/SMTP logs) -> activates account, returns token
curl -s -X POST $BASE/verify-otp -H "Content-Type: application/json" -d '{
  "email": "lovesha@example.com", "otp": "123456"
}'

# 4. Login now succeeds
curl -s -X POST $BASE/login -H "Content-Type: application/json" -d '{
  "email": "lovesha@example.com", "password": "Passw0rd1"
}'
# copy the "token" from the response above into TOKEN, then change password while logged in:
# curl -s -X POST $BASE/change-password -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $TOKEN" -d '{"oldPassword":"Passw0rd1","newPassword":"NewPassw0rd2","confirmPassword":"NewPassw0rd2"}'

# 5. Forgot password (check email/SMTP logs for the reset LINK) — for a user who is NOT logged in
curl -s -X POST $BASE/forgot-password -H "Content-Type: application/json" -d '{
  "email": "lovesha@example.com"
}'

# 6. Reset password (not logged in) using the token from the emailed link
#    (link looks like: http://localhost:5500/resetpassword.html?token=<TOKEN>&email=lovesha%40example.com)
curl -s -X POST $BASE/reset-password -H "Content-Type: application/json" -d '{
  "email": "lovesha@example.com",
  "resetToken": "<paste token from the emailed link>",
  "newPassword": "NewPassw0rd2",
  "confirmPassword": "NewPassw0rd2"
}'
```

---
---

# Employee API Documentation

Base URL: `http://localhost:5000/api/employees`

Every route requires `Authorization: Bearer <jwt>` (from `login`/`verify-otp` in the Auth API) —
enforced globally by [middleware/auth.js](middleware/auth.js)'s `protect`, mounted for the whole
router in [routes/employeeRoutes.js](routes/employeeRoutes.js). The response envelope
(`statusCode`/`success`/`errorCode`/`message`) is identical to the Auth API — see
[the shared explanation above](#auth-api-documentation).

## Data model

An `Employee` document ([models/Employee.js](models/Employee.js)) is a separate collection linked
1:1 to a `User` via `user` (unique, indexed) — auth data (email/password/role) stays in `User`;
HR/profile data lives here. `qualifications` and `documents` are **embedded subdocuments**, not
separate collections — a person has only a handful of each, so the whole "Qualification" or
"Documents" tab is one query, no joins.

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → User | required, unique |
| `employeeId` | String | required, unique — the human-readable code, e.g. `EMP-1101` |
| `designation` | String | required |
| `department`, `seniority` | String | optional; `department` is indexed |
| `phone` | String | optional |
| `location` | `{ city, officeType }` | optional |
| `joiningDate` | Date | optional |
| `reportsTo` | ObjectId → Employee | optional, nullable |
| `status` | enum | `active \| inactive \| on-leave \| terminated`, default `active`, indexed |
| `skills` | String[] | optional |
| `profilePicture` | `{ url, uploadedAt }` | set via the profile-picture endpoints |
| `qualifications[]` | embedded | `{ type, institution, boardOrDegree, startYear, endYear }` |
| `documents[]` | embedded | `{ title, category, fileUrl, fileSize, mimeType, verificationStatus, uploadedBy }` |

`type` enum: `10th, 12th, Diploma, Graduation, Post-Graduation, Certification, Other`.
`category` enum: `Identity, Employment, Financial, Other`.
`verificationStatus` enum: `Pending Review, Verified, Rejected` (default `Pending Review`).

## Roles and access

Two access levels, enforced by [middleware/employeeAccess.js](middleware/employeeAccess.js) and
[middleware/role.js](middleware/role.js):

- **Self** — a user can always read/manage their *own* employee record (matched via `req.user._id === employee.user`).
- **Privileged** (`super-admin`, `admin`, `hr`) — can read/manage *any* employee's record.

One exception: **document verification is privileged-only** — an employee can never verify their
own documents, even though they can otherwise manage their own qualifications/documents freely.

| Route | Self | Privileged | Notes |
|---|---|---|---|
| `GET/PATCH /me`, profile picture | ✅ | ✅ (their own) | self-service |
| `GET /`, `POST /` (directory, onboarding) | ❌ | ✅ | |
| `GET /:id` | ✅ (own) | ✅ (any) | |
| `PATCH /:id` (full edit) | ❌ | ✅ | self must use `/me` instead, which only allows `phone`/`location`/`skills` |
| Qualifications (all) | ✅ (own) | ✅ (any) | |
| Documents — list/upload/download/delete | ✅ (own) | ✅ (any) | |
| Documents — **verify** | ❌ | ✅ only | |

---

## 1. Get My Profile

`GET /api/employees/me`

Returns Basic Information + Contact + Employment + Skills for the logged-in user — deliberately
**excludes** `qualifications`/`documents` (fetched only when those tabs are opened; see
[Query optimization](#query-optimization) below).

### curl

```bash
curl http://localhost:5000/api/employees/me -H "Authorization: Bearer $TOKEN"
```

### Success response — `200 OK`

```json
{
  "statusCode": 200,
  "success": true,
  "errorCode": null,
  "employee": {
    "id": "6aa62ad2aa059bcdec2cc7b6",
    "employeeId": "EMP-1101",
    "name": "Aarav Sharma",
    "email": "aarav.sharma@hikeassociate.com",
    "role": "employee",
    "lastLoginAt": "2026-09-13T04:33:00.000Z",
    "designation": "Senior Software Engineer",
    "department": "Engineering",
    "seniority": "Senior",
    "phone": "+91 98100 11234",
    "location": { "city": "Delhi", "officeType": "Office" },
    "joiningDate": "2022-03-14T00:00:00.000Z",
    "reportsTo": { "id": "6aa62b1faa059bcdec2cc80e", "employeeId": "EMP-1001", "designation": "Engineering Manager", "name": "Karan Malhotra" },
    "status": "active",
    "skills": ["React", "TypeScript", "Node.js"],
    "profilePicture": { "url": "/uploads/profile-pictures/1789274984065-cbd6df20a58a08fb.png", "uploadedAt": "2026-09-13T04:49:44.066Z" },
    "createdAt": "2026-09-13T04:47:14.824Z",
    "updatedAt": "2026-09-13T04:49:44.070Z"
  }
}
```

### Error response

No employee profile exists yet for this account — `404 Not Found`:
```json
{ "statusCode": 404, "success": false, "errorCode": "PROFILE_NOT_FOUND", "message": "Employee profile not found for this account" }
```

---

## 2. Update My Profile

`PATCH /api/employees/me`

Self-editable fields only — `phone`, `location`, `skills`. To change `designation`, `department`,
`status`, `reportsTo`, etc., a privileged user must use `PATCH /:id` (section 8).

### Request body (all optional)

| Field | Type |
|---|---|
| `phone` | string |
| `location` | object `{ city, officeType }` |
| `skills` | string[] |

### curl

```bash
curl -X PATCH http://localhost:5000/api/employees/me \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{ "phone": "+91 99999 00000", "skills": ["React", "TypeScript", "Node.js", "GraphQL"] }'
```

### Success response — `200 OK`

```json
{ "statusCode": 200, "success": true, "errorCode": null, "message": "Profile updated successfully", "employee": { "...": "same shape as GET /me" } }
```

---

## 3. Upload My Profile Picture

`POST /api/employees/me/profile-picture` — `multipart/form-data`, field name **`photo`**.

JPG/PNG only, max 5 MB (matches the "up to 5 MB, JPG or PNG" UI copy). Replaces and deletes any
existing photo on disk. Served back publicly at `/uploads/profile-pictures/<filename>` — low
sensitivity (just an avatar), unlike documents (see below).

### curl

```bash
curl -X POST http://localhost:5000/api/employees/me/profile-picture \
  -H "Authorization: Bearer $TOKEN" -F "photo=@/path/to/photo.png;type=image/png"
```

### Success response — `200 OK`

```json
{ "statusCode": 200, "success": true, "errorCode": null, "message": "Profile picture updated successfully", "profilePicture": { "url": "/uploads/profile-pictures/1789274984065-cbd6df20a58a08fb.png", "uploadedAt": "2026-09-13T04:49:44.066Z" } }
```

### Error responses

Wrong file type — `400 Bad Request`: `{ "statusCode": 400, "success": false, "errorCode": "INVALID_FILE_TYPE", "message": "Unsupported file type" }`
Too large (> 5 MB) — `400 Bad Request`: `{ "statusCode": 400, "success": false, "errorCode": "TOO_LARGE", "message": "File is too large" }`
No file attached — `400 Bad Request`: `{ "statusCode": 400, "success": false, "errorCode": "PROFILE_PICTURE_REQUIRED", "message": "A profile picture file is required" }`

## 4. Remove My Profile Picture

`DELETE /api/employees/me/profile-picture` — deletes the file from disk and clears the field.

```bash
curl -X DELETE http://localhost:5000/api/employees/me/profile-picture -H "Authorization: Bearer $TOKEN"
```

Success — `200 OK`: `{ "statusCode": 200, "success": true, "errorCode": null, "message": "Profile picture removed successfully" }`
No picture on file — `404 Not Found`: `{ "statusCode": 404, "success": false, "errorCode": "PROFILE_PICTURE_NOT_FOUND", "message": "No profile picture on file" }`

---

## 5. List Employees (Privileged)

`GET /api/employees` — `super-admin`/`admin`/`hr` only.

### Query params

| Param | Default | Notes |
|---|---|---|
| `page` | 1 | |
| `limit` | 20 | max 100 |
| `department` | — | exact match |
| `status` | — | exact match |

Returns only the directory-row fields (no qualifications/documents, no `reportsTo` populate) —
kept intentionally light regardless of list size.

```bash
curl "http://localhost:5000/api/employees?department=Engineering&page=1&limit=20" \
  -H "Authorization: Bearer $HR_TOKEN"
```

```json
{
  "statusCode": 200, "success": true, "errorCode": null,
  "employees": [
    { "id": "6aa62ad2aa059bcdec2cc7b6", "employeeId": "EMP-1101", "name": "Aarav Sharma", "email": "aarav.sharma@hikeassociate.com", "role": "employee", "designation": "Senior Software Engineer", "department": "Engineering", "seniority": "Senior", "status": "active" }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

Non-privileged caller — `403 Forbidden`: `{ "statusCode": 403, "success": false, "errorCode": "FORBIDDEN", "message": "You do not have permission to perform this action" }`

---

## 6. Create Employee (Onboarding, Privileged)

`POST /api/employees` — `super-admin`/`admin`/`hr` only. Attaches an HR profile to an already
registered+verified `User`.

### Request body

| Field | Type | Required |
|---|---|---|
| `userId` | ObjectId | yes — must be an existing `User` |
| `employeeId` | string | yes — unique, e.g. `EMP-1101` |
| `designation` | string | yes |
| `department`, `seniority`, `phone` | string | no |
| `location` | object | no |
| `joiningDate` | date | no |
| `reportsTo` | ObjectId (Employee) | no |
| `skills` | string[] | no |

```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" -H "Authorization: Bearer $HR_TOKEN" -d '{
    "userId": "6aa62ac6aa059bcdec2cc7a8",
    "employeeId": "EMP-1101",
    "designation": "Senior Software Engineer",
    "department": "Engineering",
    "seniority": "Senior",
    "phone": "+91 98100 11234",
    "location": { "city": "Delhi", "officeType": "Office" },
    "joiningDate": "2022-03-14",
    "skills": ["React", "TypeScript", "Node.js"]
  }'
```

Success — `201 Created`: same shape as `GET /me`'s `employee` object.
Duplicate `userId` or `employeeId` — `409 Conflict`: `{ "statusCode": 409, "success": false, "errorCode": "EMPLOYEE_ID_ALREADY_EXISTS", "message": "Employee ID already exists" }`
`userId` doesn't exist — `404 Not Found`.

---

## 7. Get Employee By Id

`GET /api/employees/:id` — self (if `:id` is your own record) or privileged. Same response shape as `GET /me`.

```bash
curl http://localhost:5000/api/employees/6aa62ad2aa059bcdec2cc7b6 -H "Authorization: Bearer $TOKEN"
```

Not self, not privileged — `403 Forbidden`. Unknown `:id` — `404 Not Found` (`errorCode: "NOT_FOUND"`).

## 8. Update Employee By Id (Privileged)

`PATCH /api/employees/:id` — `super-admin`/`admin`/`hr` only (not even the employee themself — they
use `PATCH /me` for their limited self-editable fields).

### Request body (all optional)

`designation`, `department`, `seniority`, `phone`, `location`, `joiningDate`, `reportsTo`, `status`, `skills`.

```bash
curl -X PATCH http://localhost:5000/api/employees/6aa62ad2aa059bcdec2cc7b6 \
  -H "Content-Type: application/json" -H "Authorization: Bearer $HR_TOKEN" \
  -d '{ "reportsTo": "6aa62b1faa059bcdec2cc80e", "status": "active" }'
```

Success — `200 OK`, same shape as `GET /me`.

---

## 9. Qualifications

Base: `/api/employees/:id/qualifications` — self (own record) or privileged.

### GET — list

```bash
curl http://localhost:5000/api/employees/6aa62ad2aa059bcdec2cc7b6/qualifications -H "Authorization: Bearer $TOKEN"
```
```json
{ "statusCode": 200, "success": true, "errorCode": null, "qualifications": [
  { "_id": "6aa62ae8aa059bcdec2cc7cd", "type": "Graduation", "institution": "Delhi Technological University", "boardOrDegree": "B.Tech, Computer Science", "startYear": 2012, "endYear": 2016, "createdAt": "...", "updatedAt": "..." }
] }
```

### POST — add

Body: `type` (enum above, required), `institution` (required), `boardOrDegree` (required),
`endYear` (required, integer), `startYear` (optional, integer).

```bash
curl -X POST http://localhost:5000/api/employees/6aa62ad2aa059bcdec2cc7b6/qualifications \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
    "type": "Graduation", "institution": "Delhi Technological University",
    "boardOrDegree": "B.Tech, Computer Science", "startYear": 2012, "endYear": 2016
  }'
```
Success — `201 Created`, `message: "Qualification added successfully"`, full updated `qualifications[]`.

### PATCH `/:qualId` — update (all fields optional)

```bash
curl -X PATCH http://localhost:5000/api/employees/6aa62ad2aa059bcdec2cc7b6/qualifications/6aa62ae8aa059bcdec2cc7cd \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{ "endYear": 2017 }'
```
Unknown `qualId` — `404 Not Found`: `errorCode: "QUALIFICATION_NOT_FOUND"`.

### DELETE `/:qualId`

```bash
curl -X DELETE http://localhost:5000/api/employees/6aa62ad2aa059bcdec2cc7b6/qualifications/6aa62ae8aa059bcdec2cc7cd -H "Authorization: Bearer $TOKEN"
```

---

## 10. Documents

Base: `/api/employees/:id/documents` — self (own record) or privileged, **except verification**.

### GET — list

Returns metadata only (no file content):
```bash
curl http://localhost:5000/api/employees/6aa62ad2aa059bcdec2cc7b6/documents -H "Authorization: Bearer $TOKEN"
```
```json
{ "statusCode": 200, "success": true, "errorCode": null, "documents": [
  { "id": "6aa62af5aa059bcdec2cc7d3", "title": "PAN Card.pdf", "category": "Identity", "fileSize": 209, "mimeType": "application/pdf", "verificationStatus": "Pending Review", "uploadedAt": "2026-09-13T04:47:49.078Z" }
] }
```

### POST — upload

`multipart/form-data`: `title` (required), `category` (required — `Identity|Employment|Financial|Other`),
`file` (required — JPG/PNG/PDF, max 10 MB). New uploads always start as `Pending Review`.

```bash
curl -X POST http://localhost:5000/api/employees/6aa62ad2aa059bcdec2cc7b6/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=PAN Card.pdf" -F "category=Identity" -F "file=@/path/to/pan.pdf;type=application/pdf"
```
Success — `201 Created`, `message: "Document uploaded successfully"`.

### GET `/:docId/download`

Streams the file with the original title as the download filename — **never served statically**
(unlike profile pictures) since documents can contain PII (PAN, Aadhaar, bank passbook).

```bash
curl -OJ http://localhost:5000/api/employees/6aa62ad2aa059bcdec2cc7b6/documents/6aa62af5aa059bcdec2cc7d3/download \
  -H "Authorization: Bearer $TOKEN"
```

### PATCH `/:docId/verify` — **privileged only**

Body: `verificationStatus` — `Pending Review | Verified | Rejected`.

```bash
curl -X PATCH http://localhost:5000/api/employees/6aa62ad2aa059bcdec2cc7b6/documents/6aa62af5aa059bcdec2cc7d3/verify \
  -H "Content-Type: application/json" -H "Authorization: Bearer $HR_TOKEN" -d '{ "verificationStatus": "Verified" }'
```
Success — `200 OK`: `{ "statusCode": 200, "success": true, "errorCode": null, "message": "Document verification status updated", "verificationStatus": "Verified" }`
Called by the document's own owner instead of a privileged role — `403 Forbidden`.

### DELETE `/:docId`

Removes the subdocument and deletes the file from disk.
```bash
curl -X DELETE http://localhost:5000/api/employees/6aa62ad2aa059bcdec2cc7b6/documents/6aa62af5aa059bcdec2cc7d3 -H "Authorization: Bearer $TOKEN"
```

---

## Common error shapes (Employee API)

| statusCode | Meaning | `errorCode` |
|---|---|---|
| 400 | Validation error (bad enum, missing required field, malformed id) | `VALIDATION_ERROR` |
| 400 | Wrong file mimetype | `INVALID_FILE_TYPE` |
| 400 | File over the size limit | `TOO_LARGE` |
| 401 | Missing/invalid/expired JWT | `INVALID_TOKEN` |
| 403 | Not self and not a privileged role | `FORBIDDEN` |
| 404 | Employee/qualification/document not found | `NOT_FOUND` / `QUALIFICATION_NOT_FOUND` / `DOCUMENT_NOT_FOUND` |
| 404 | No Employee record exists yet for this account | `PROFILE_NOT_FOUND` |
| 409 | Duplicate `employeeId` or `userId` already onboarded | `EMPLOYEE_ID_ALREADY_EXISTS` |

## Query optimization

- **Per-tab endpoints, not one bloated payload.** `GET /me` never returns `qualifications`/`documents`
  — those two arrays (especially documents, with file metadata) are fetched only when their own tab
  is opened, via their own `.select()`-projected query.
- **Embedded subdocuments, not extra collections.** Qualifications and documents live inside the
  `Employee` document. Opening the Qualifications or Documents tab is exactly one query — no joins.
- **Atomic subdocument writes.** Adding/editing/deleting a qualification or verifying a document uses
  `$push` / positional `$set` / `$pull` — never fetch-the-whole-array-then-save-it-back.
- **List endpoint stays flat.** `GET /` (directory) uses `.lean()` and a field projection that
  excludes both embedded arrays and the `reportsTo` populate — cost doesn't grow with how many
  documents/qualifications any given employee has.
- **Indexes**: `Employee.user` (unique), `Employee.employeeId` (unique), `Employee.department`,
  `Employee.status` — every filter used by the directory/list endpoint is indexed.
- **`reportsTo` is a bounded nested populate** (one manager, not a list) — 2 extra queries total for
  `GET /me`/`GET /:id`, never N+1, and skipped entirely on the list endpoint where it isn't needed.
