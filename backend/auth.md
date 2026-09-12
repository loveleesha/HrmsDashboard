# Authentication Module

Backend spec for the HRMS Dashboard auth module — Node.js (Express) + MongoDB (Mongoose).

Note: the linked Google Doc (`docs.google.com/document/d/198MP8jFA7JZq8rxq9h7WZmZY5TlsXYZ8`) returned
401 Unauthorized when fetched (private doc, no access) — this spec is derived from the request
requirements and the existing frontend pages (`login.html`, `forgotpassword.html`, `otp.html`,
`resetpassword.html`, `permission.html`). If the doc contains different field names or extra rules,
update this file and the code to match.

## Scope

Six APIs:

1. Register (sends an account-verification OTP; does not log the user in)
2. Verify OTP (confirms registration, activates the account, returns a login token)
3. Login (blocked until the account is verified)
4. Forgot Password (emails a password-reset **link** — no OTP for this flow)
5. Reset Password (unauthenticated — sets a new password using the resetToken from the link)
6. Change Password (authenticated only — logged-in users change their own password via JWT)

Role is **not** hardcoded on the backend — it is supplied by the frontend at registration
(`super-admin | admin | hr | manager | employee`, matching the roles already defined in
`permission.html`) and stored on the user document. It is embedded in the JWT and returned on
login so the frontend can drive role-based UI (sidebar links, permission screens, etc.)
without a second lookup.

## Data model

### User

| Field       | Type    | Notes                                                                 |
|-------------|---------|------------------------------------------------------------------------|
| name        | String  | required                                                              |
| email       | String  | required, unique, lowercase, trimmed, indexed                        |
| password    | String  | required, bcrypt hash, `select: false`                               |
| role        | String  | enum: `super-admin, admin, hr, manager, employee`, default `employee`, indexed |
| isVerified  | Boolean | default `false`; set `true` once the registration OTP is confirmed    |
| otpHash     | String  | sha256 hash of the registration OTP, `select: false` (only purpose left: `verify-account`) |
| otpExpiry   | Date    | OTP validity (10 min), `select: false`                               |
| resetTokenHash | String | sha256 hash of one-time password-reset token (emailed as a link), `select: false` |
| resetTokenExpiry | Date | reset token validity (1 hour), `select: false`                  |
| createdAt / updatedAt | Date | timestamps                                                 |

Indexes: `email` unique (login/lookup path), `role` (role-filtered admin queries).
OTP/reset-token fields are hashed at rest — never store the raw OTP or reset token in the DB.

## Response envelope

Every response — success or failure — shares the same top-level keys, added automatically by
[middleware/responseFormatter.js](middleware/responseFormatter.js) (no controller sets them
directly):

```json
{ "statusCode": 200, "success": true, "errorCode": null, "message": "...", "...": "endpoint-specific fields (user, token, resetToken)" }
```

- `statusCode` — the actual HTTP status code of the response (mirrors `res.statusCode`).
- `success` — `true`/`false`.
- `errorCode` — `null` on success; a machine-readable string (e.g. `INVALID_CREDENTIALS`,
  `OTP_INVALID_OR_EXPIRED`) on failure, auto-derived from [utils/messages.js](utils/messages.js) so
  it can never drift out of sync with the human-readable `message`.
- `message` — human-readable text.

## API contract

Base path: `/api/auth`

### POST /register
Request:
```json
{ "name": "Lovesha Sharma", "email": "lovesha@example.com", "password": "Passw0rd!", "role": "employee" }
```
- Rejects if `role` is not one of the five valid roles.
- Rejects if email already exists.
- Password hashed with bcrypt (12 rounds) before save.
- Creates the user with `isVerified: false`, issues a 6-digit OTP, and emails it.
  **Does not return a JWT** — the account cannot be used until verified.
Response `201`:
```json
{ "statusCode": 201, "success": true, "errorCode": null, "message": "Registration successful. An OTP has been sent to your email for verification.", "user": { "id", "name", "email", "role" } }
```

### POST /verify-otp
Request: `{ "email", "otp" }`
- Fetches `otpHash, otpExpiry` via `.select(...)`, compares `sha256(otp)` against the stored hash, checks expiry.
- On success: sets `isVerified: true`, clears the OTP fields, and returns a login JWT immediately
  (no separate login call needed right after verifying).
Response `200`:
```json
{ "statusCode": 200, "success": true, "errorCode": null, "message": "Account verified successfully", "token": "<jwt>", "user": { "id", "name", "email", "role" } }
```
`400` (`errorCode: "OTP_INVALID_OR_EXPIRED"`) on a wrong/expired OTP.

### POST /login
Request: `{ "email", "password" }`
- Looks up user with `.select('+password')`, compares with bcrypt.
- **Blocked if `isVerified` is `false`** — returns `403` with a message telling the user to verify
  via the OTP sent at registration.
- Signs JWT containing `{ id, role }`.
Response `200`:
```json
{ "statusCode": 200, "success": true, "errorCode": null, "message": "Login successful", "token": "<jwt>", "user": { "id", "name", "email", "role" } }
```
`401` (`errorCode: "INVALID_CREDENTIALS"`) on invalid credentials (generic message — do not reveal whether email exists).
`403` (`errorCode: "ACCOUNT_NOT_VERIFIED"`) if the account exists, the password is correct, but it isn't verified yet.

### POST /forgot-password
Request: `{ "email" }`
- No OTP for this flow. Generates a random reset token directly, stores `sha256(resetToken)` +
  `resetTokenExpiry` (Date.now()+1hour) via a single update (no read-then-write round trip).
- Emails a clickable link (nodemailer, `utils/sendEmail.js`'s `sendResetLinkEmail`):
  `${FRONTEND_URL}/resetpassword.html?token=<resetToken>&email=<email>`.
- Always responds `200` with a generic message, whether or not the email exists, to avoid user enumeration.
- [resetpassword.html](../resetpassword.html) reads `token`/`email` from the URL query string and
  POSTs them straight to `/reset-password` — no separate verify step.

### POST /reset-password
Unauthenticated — the forgot-password flow. **No `Authorization` header accepted or required.**
Request: `{ "email", "resetToken", "newPassword", "confirmPassword" }`
- Validates `newPassword === confirmPassword` and password strength (min 8 chars, upper+lower+digit —
  matches the rules already shown in `resetpassword.html`).
- Fetches `.select('+resetTokenHash +resetTokenExpiry')`, verifies hash + expiry.
- Hashes new password, clears reset token fields, single `findOneAndUpdate`. The token is single-use.
- `400` (`errorCode: "RESET_TOKEN_INVALID_OR_EXPIRED"`) if the reset token is missing/invalid/expired/reused.
Response `200`: `{ "statusCode": 200, "success": true, "errorCode": null, "message": "Password updated" }`

### POST /change-password
Authenticated only — for a user who is already logged in and wants to set a new password.
**Requires `Authorization: Bearer <jwt>`**; the route is guarded by [middleware/auth.js](middleware/auth.js)'s
`protect`, which runs before any other validation.
Request: `{ "oldPassword", "newPassword", "confirmPassword" }` (no `email`/`resetToken` — the user is
identified by the JWT).
- `protect` verifies the JWT (`utils/verifyToken.js`) and loads the user by the token's `id`; `401`
  (`errorCode: "INVALID_TOKEN"`) if the token is missing/invalid/expired or the user no longer exists.
- Fetches the user's password hash (`.select('+password')`) and compares `oldPassword` with bcrypt;
  `401` (`errorCode: "OLD_PASSWORD_INCORRECT"`) if it doesn't match — this protects against someone
  with a stolen/leaked JWT silently taking over the account.
- On success: hashes and sets the new password.
Response `200`: `{ "statusCode": 200, "success": true, "errorCode": null, "message": "Password updated" }`

## Query optimization notes

- Every auth read that only needs specific fields uses `.select(...)` instead of loading the full
  document (`password`, `otpHash`, `resetTokenHash` are `select: false` by default and opted into
  only where needed).
- OTP/reset-token verification updates use a single `findOneAndUpdate` instead of `find` + mutate +
  `save()`, cutting the round trip in half.
- `email` has a unique index — login/register/forgot-password lookups are all indexed point queries.
- `role` is indexed since permission/admin screens will filter users by role.
- No password or OTP/token comparison is ever done by pulling all users and filtering in app code —
  always a single indexed `findOne`.

## Environment variables (`.env`)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/hrms
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="HRMS <no-reply@hrms.local>"

# Base URL where the frontend HTML pages are served — used to build the
# /forgot-password reset link: ${FRONTEND_URL}/resetpassword.html?token=...&email=...
FRONTEND_URL=http://localhost:5500
```

## Frontend role usage

`role` returned from `/login` and `/register` should be persisted client-side (e.g.
`localStorage.setItem('role', user.role)`) and used to:
- Show/hide sidebar items and pages (e.g. only `super-admin`/`admin` can open `permission.html`).
- Pre-select the correct role context when calling role-scoped APIs later.

No role-based authorization middleware is included here since only the five auth APIs above are
in scope — enforcing role checks on other module routes is a follow-up once those APIs exist.
