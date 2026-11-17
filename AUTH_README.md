# TRACE Native Authentication & Authorization System

This directory houses TRACE's native, self-hosted authentication and Role-Based Access Control (RBAC) engine, replacing Firebase Authentication.

---

## 1. Architecture Highlights

- **Database:** SQLite (`better-sqlite3`) in WAL (Write-Ahead Logging) mode with ACID foreign keys, located at `backend/data/trace_auth.db`.
- **Password Hashing:** Bcrypt / Argon2id with 12 computational rounds, resistant to GPU/ASIC parallel cracking.
- **Dual-Cookie Token Lifecycle:**
  - `trace_access`: Short-lived JWT (15 minutes), `HttpOnly`, `SameSite=Strict`, `Secure` (production).
  - `trace_refresh`: High-entropy crypto string (7 days), stored as SHA-256 hash in DB, `HttpOnly`, `SameSite=Strict`, path `/api/auth/refresh`.
  - **Zero localStorage token storage**: Immune to client-side XSS token exfiltration.
- **Token Rotation & Replay Attack Defense:** Every refresh issues a new refresh token and revokes the old one. If an already-used token is presented (indicating theft), the entire session family is instantly revoked.
- **Brute-Force & Lockout Defense:** Account lockout for 15 minutes after 5 consecutive failed login attempts on an email.
- **Zero User Enumeration:** Forgot-password and login endpoints return timing-safe generic messages to prevent discovery of registered emails.
- **MFA (TOTP):** RFC 6238-compliant Time-based One-Time Passwords compatible with Google Authenticator, Authy, and 1Password, stored with AES-256-GCM encryption.

---

## 2. Quick Setup & Configuration

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env` and configure your secrets:

```bash
# Generate high-entropy secrets using openssl
AUTH_JWT_SECRET=$(openssl rand -hex 32)
AUTH_MFA_SECRET=$(openssl rand -hex 32)
ADMIN_SESSION_SECRET=$(openssl rand -hex 32)
```

Add them to `.env`:
```env
AUTH_JWT_SECRET="<your-64-character-hex-string>"
AUTH_MFA_SECRET="<your-64-character-hex-string>"
ADMIN_SESSION_SECRET="<your-64-character-hex-string>"
```

### Step 2: Seed the Local Development Administrator
In local development (`NODE_ENV=development`), run the dedicated seed script:

```bash
npm run seed:admin
```

This seeds:
- **Email:** `admin@trace.local` (Username: `admin`)
- **Password:** `password`
- **Role:** `admin`

> ⚠️ **Security Guard:** `seed-dev-admin.ts` strictly enforces `NODE_ENV === 'development'` and **hard-fails with exit code 1** if executed in production or staging.

### Step 3: Migrate Existing Firebase Users & History Records
To link existing local user history files in `backend/data/user_history/*.json` to the new SQLite authentication store, run:

```bash
npm run migrate:users
```

Existing user UIDs are preserved, ensuring all historical fact-check and deepfake records remain 100% accessible to their respective owners.

---

## 3. Production Admin Bootstrapping

In production environments (`NODE_ENV=production`), TRACE automatically provisions the first administrator upon startup if no admin exists in the database.

Set the following environment variables in your hosting environment (e.g., Firebase App Hosting, Cloud Run, Docker):

```env
ADMIN_EMAIL="director@yourdomain.com"
ADMIN_INITIAL_PASSWORD="SecureComplexPassword_2026!"
```

- **Requirements:** Password must be at least 12 characters long.
- **First-Login Enforcement:** The bootstrapped admin account is flagged with `must_change_password: true` and is prompted to register a new password and configure TOTP multi-factor authentication upon first login.
- **Fail-Closed:** If `ADMIN_INITIAL_PASSWORD` is omitted or weak, the server halts startup to prevent unauthenticated deployment states.

---

## 4. Roles and Permissions (RBAC) Matrix

Server-side route guards strictly enforce privileges for every endpoint. Client-side roles are treated purely as UI display hints.

| Capability | Citizen Reader (`user`) | Editorial Fact-Checker (`moderator`) | Operations Director (`admin`) |
|---|:---:|:---:|:---:|
| Run fact-checks & deepfake scans | ✅ | ✅ | ✅ |
| View personal scan history | ✅ | ✅ | ✅ |
| Submit community perspectives | ✅ | ✅ | ✅ |
| Publish/Edit Editorial Wire News | ❌ | ✅ | ✅ |
| Moderate flagged community reviews | ❌ | ✅ | ✅ |
| View user directory & roles | ❌ | ❌ | ✅ |
| Change user roles (`user` ↔ `moderator`) | ❌ | ❌ | ✅ |
| Disable/Suspend accounts | ❌ | ❌ | ✅ |
| Force logout all user devices | ❌ | ❌ | ✅ |
| View Security Audit Ledger | ❌ | ❌ | ✅ |
| Toggle DEFCON / Maintenance mode | ❌ | ❌ | ✅ |

---

## 5. Secret Rotation Runbook

### How to Rotate `AUTH_JWT_SECRET`
1. Access tokens are short-lived (15 minutes).
2. Generate a new 64-character hex secret:
   ```bash
   openssl rand -hex 32
   ```
3. Update `AUTH_JWT_SECRET` in your hosting provider's secret manager and trigger a rolling deployment.
4. Active users with valid `trace_refresh` cookies will automatically exchange their refresh token for a newly signed access token on their next background API call via `/api/auth/refresh` without being logged out.

### How to Invalidate All User Sessions Globally (Emergency Incident)
If credentials or secrets are suspected to be compromised:
- **Single User:** Admin executes `POST /api/admin/users/:id/revoke-sessions`, or user clicks "Log Out of All Devices" in Account Settings.
- **Global Invalidation:** Run SQL migration:
  ```sql
  UPDATE users SET token_version = token_version + 1;
  UPDATE refresh_tokens SET is_revoked = 1;
  ```
  Every active JWT access token will be rejected immediately on its next request.

---

## 6. API Reference

### Public / Client Endpoints (`/api/auth/*`)
- `POST /api/auth/register` - Create account (email, password, display_name)
- `POST /api/auth/login` - Authenticate (email, password, optional mfaCode)
- `POST /api/auth/refresh` - Rotate refresh token & issue fresh access token
- `POST /api/auth/logout` - Clear cookies & revoke current session
- `POST /api/auth/logout-all` - Invalidate all active sessions across all devices
- `GET  /api/auth/me` - Retrieve authenticated user profile
- `POST /api/auth/change-password` - Update password (requires current password)
- `POST /api/auth/forgot-password` - Request reset link (zero user enumeration)
- `POST /api/auth/reset-password` - Complete password reset with single-use token
- `POST /api/auth/verify-email` - Confirm email with verification token
- `POST /api/auth/mfa/setup` - Generate TOTP secret & QR code
- `POST /api/auth/mfa/enable` - Confirm TOTP code and activate MFA
- `POST /api/auth/mfa/disable` - Disable MFA (requires password & code)
- `POST /api/auth/google` - Social login with Google token

### Administrator Operations (`/api/admin/*`)
- `GET    /api/admin/users` - Paginated user directory with search & role filter
- `POST   /api/admin/users/:id/role` - Assign role (`user`, `moderator`, `admin`)
- `POST   /api/admin/users/:id/status` - Suspend or reactivate user account
- `POST   /api/admin/users/:id/revoke-sessions` - Terminate all active user sessions
- `POST   /api/admin/users/:id/reset-password` - Issue temporary password
- `DELETE /api/admin/users/:id` - Permanently delete user account
- `GET    /api/admin/audit-ledger` - View immutable security audit logs

---

## 7. Verification & Automated Test Suite

Run the full authentication and regression test suite:

```bash
# Run 16 dedicated auth tests
npx vitest run tests/auth.test.ts

# Run all test suites (security, auth, API contracts)
npm test

# Run TypeScript type check
npm run lint

# Build production bundle
npm run build
```
