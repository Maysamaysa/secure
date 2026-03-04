# AuthVault — JWT / OAuth 2.0 / SSO Demo

> A full-stack educational app demonstrating JWT authentication, OAuth 2.0 (Google), and Single Sign-On with role-based access control.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express |
| Auth | JWT (jsonwebtoken), bcryptjs, httpOnly cookies |
| Storage | In-memory (no DB required) |

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env     # Edit secrets if desired
npm install
npm run dev              # Starts on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev              # Starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Test Accounts

| Email | Password | Role |
|---|---|---|
| `employee@demo.com` | `pass123` | employee |
| `manager@demo.com` | `pass123` | manager |
| `admin@demo.com` | `pass123` | admin |

Use the **Quick Fill** buttons on the login page.

---

## How to Test Each Auth Flow

### JWT Authentication
1. Log in as any user → you land on `/dashboard`
2. The **JWT Inspector** shows decoded header, payload, and signature
3. The **countdown ring** counts down to expiry (15 min)
4. Wait for expiry — Axios interceptor silently refreshes using the httpOnly cookie

### Role-Based Access Control
- Log in as `employee` → try navigating to `/manager` → redirected to `/forbidden`
- Log in as `manager` → `/manager` works, `/admin` → forbidden
- Log in as `admin` → full access to `/admin`, `/manager`, `/dashboard`

### Token Revocation (Admin only)
1. Log in as `admin@demo.com` in one browser tab
2. Open another tab, log in as `manager@demo.com`
3. As admin, go to `/admin` → find the manager row → click **Revoke**
4. Manager's next API call will fail (401) → auto-logout

### SSO Session Sharing
1. Log in as any user
2. Navigate to `/sso-app` — you are **auto-authenticated** (no second login)
3. Click **Logout (SSO)** on the SSO page
4. Navigate back to `/dashboard` — you are logged out there too

### Google OAuth 2.0
1. Create OAuth credentials at https://console.cloud.google.com
2. Set **Authorized JavaScript origins**: `http://localhost:5173`, `http://localhost:3001`
3. Set **Authorized redirect URI**: `http://localhost:3001/api/auth/google/callback`
4. Add credentials to `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```
5. Restart the backend → the "Login with Google" button becomes active

---

## SSO Session Sharing — Architecture

```
┌────────────────────────────────────────────────────────────┐
│                       Browser                               │
│                                                             │
│   App A (localhost:5173)    App B (/sso-app route)          │
│   ┌──────────────────┐      ┌──────────────────┐           │
│   │  accessToken     │      │  no token yet    │           │
│   │  (React state)   │      │                  │           │
│   └──────────────────┘      └────────┬─────────┘           │
│                                      │ GET /sso/validate    │
│   ┌─────────────────────────────────────────────────────┐ │
│   │            httpOnly Cookie: sso_token               │ │
│   │         (shared across all paths, same origin)      │ │
│   └─────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                              │
                     ┌────────▼────────┐
                     │   Backend API   │
                     │  Sessions Map   │
                     │  userId ↔ token │
                     └─────────────────┘
```

**Flow**: Login → server creates `sso_token`, stores `{userId}` in memory, sets httpOnly cookie.  
App B loads → sends cookie automatically → server validates → issues fresh access token → App B auto-authenticates.  
Logout → `sso_token` deleted from server store → cookie cleared → both apps lose session.

---

## Environment Variables

```bash
# backend/.env
PORT=3001
JWT_ACCESS_SECRET=at_least_32_random_chars
JWT_REFRESH_SECRET=different_at_least_32_random_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
GOOGLE_CLIENT_ID=         # Optional — leave empty to disable OAuth button
GOOGLE_CLIENT_SECRET=     # Optional
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## Security Design Decisions

| Decision | Rationale |
|---|---|
| Access token in React state (memory) | Not accessible to XSS; cleared on page refresh (acceptable tradeoff for short expiry) |
| Refresh token in httpOnly cookie | JS cannot read it; CSRF-resistant via `SameSite=Lax` and `path=/api/auth` scope |
| bcrypt with 12 rounds | Strong enough to resist brute-force; seeded at startup |
| Vague auth error messages | Prevents user enumeration ("Invalid email or password" not "User not found") |
| Rate limiting on `/api/auth/*` | Max 20 requests/15min per IP to slow brute-force |
| Helmet security headers | Sets CSP, X-Frame-Options, etc. |
| Separate JWT secrets | Access and refresh tokens use different secrets (limits blast radius) |
| Token revocation store | Server-side refresh token store enables force-logout even before expiry |
