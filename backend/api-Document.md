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
