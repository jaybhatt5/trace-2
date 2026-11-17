# TRACE (truthlens-ai) Baseline Audit Report

**Date & Time**: 2026-11-17T16:47:00+05:30  
**Environment**: Windows, Node.js, React 19, Vite 6, Express 4, TypeScript 5.8.2  
**Working Directory**: `d:\jaybhatt\collage\PROJECT\news cheker\!ts\ui changes\truthlens-ai-ALPHA2ui2`

---

## 1. Initial Command Execution Baseline

### `npm install`
- **Status**: PASSED (Exit Code: 0)
- **Output**: 365 packages audited.
- **Vulnerabilities**: 10 vulnerabilities flagged by `npm audit` (1 moderate, 8 high, 1 critical in transitive dependencies).

### `npm run lint` (`tsc --noEmit`)
- **Status**: PASSED (Exit Code: 0)
- **TypeScript Errors**: 0 errors.

### `npm run build` (`vite build && esbuild ...`)
- **Status**: PASSED (Exit Code: 0)
- **Frontend Output**: `dist/index.html` (2.80 kB), `dist/assets/index-MKm0AWRJ.css` (127.29 kB), `dist/assets/index-DuH3oV_y.js` (800.48 kB / gzip: 193.84 kB)
- **Server Bundle Output**: `dist/server.cjs` (129.1 kB)
- **Bundle Notice**: `index-DuH3oV_y.js` > 500 kB (needs code splitting in Phase 3/4).

### `npm test`
- **Status**: NOT CONFIGURED (No test runner currently in `package.json`).
- **Plan**: Install Vitest + Supertest in Phase 1/2 for automated security and API regression suites.

---

## 2. Source Tree Baseline Observations
- **Backend Architecture**: Monolithic `backend/server.ts` (~1,900 lines) with in-memory JSON state and SQLite/file-based history under `backend/data/`.
- **Security Posture**:
  - `firebase.json` contains exposed hash signer keys.
  - `.env` file present in root.
  - Weak admin authentication fallback with hardcoded strings.
  - Wide-open CORS reflection with credentials.
  - Unrestricted remote media fetching (SSRF risk).
  - Unauthenticated review submission route.
  - Sensitive error messages returned directly in 500 responses.
- **Python AI Engine**: Running FastAPI without authentication, listening with unrestricted CORS.

This baseline marks the clean starting point before any architectural, security, or feature alterations.
