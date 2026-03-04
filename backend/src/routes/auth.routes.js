// ============================================================
// routes/auth.routes.js — Authentication endpoints
// ============================================================
// Handles: login, refresh, logout, Google OAuth, SSO validation
//
// OAuth 2.0 Authorization Code Flow:
//   1. Frontend redirects to GET /api/auth/google
//   2. Server redirects user to Google's consent screen
//   3. Google redirects back to /api/auth/google/callback with a "code"
//   4. Server exchanges code for Google tokens (server-to-server)
//   5. Server fetches user info from Google
//   6. Server issues its own JWT (uniform auth across the app)
//   7. Server redirects frontend to /oauth/callback with access token

import express from 'express';
import axios from 'axios';
import { z } from 'zod';
import { config } from '../config/index.js';
import { findUserByEmail, validatePassword, findOrCreateOAuthUser } from '../data/users.js';
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    getAccessTokenExpiry,
} from '../services/jwt.service.js';
import {
    storeRefreshToken,
    validateRefreshToken,
    revokeRefreshToken,
    createSSOSession,
    validateSSOSession,
    deleteSSOSession,
} from '../data/sessions.js';
import { findUserById } from '../data/users.js';

const router = express.Router();

// ─── Input Validation Schema ───────────────────────────────
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// ─── Cookie Config ─────────────────────────────────────────
function getRefreshCookieOptions() {
    return {
        httpOnly: true,       // Not accessible via JavaScript (prevents XSS theft)
        secure: config.nodeEnv === 'production', // HTTPS-only in production
        sameSite: 'lax',     // CSRF protection while allowing OAuth redirects
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        path: '/api/auth',   // Cookie only sent to auth endpoints
    };
}

function getSSOCookieOptions() {
    return {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',           // Sent to all paths (needed for SSO across "apps")
    };
}

// ─── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        // Step 1: Validate input schema
        const parseResult = loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                error: 'ValidationError',
                message: parseResult.error.errors[0].message,
            });
        }

        const { email, password } = parseResult.data;

        // Step 2: Look up user by email
        const user = await findUserByEmail(email);
        if (!user) {
            // Intentionally vague — don't reveal which field was wrong (prevents user enumeration)
            return res.status(401).json({ error: 'InvalidCredentials', message: 'Invalid email or password.' });
        }

        // Step 3: Verify password using bcrypt (timing-safe comparison)
        const valid = await validatePassword(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'InvalidCredentials', message: 'Invalid email or password.' });
        }

        // Step 4: Issue JWT access token (short-lived, stored in memory on client)
        const accessToken = signAccessToken(user);
        const expiresAt = getAccessTokenExpiry();

        // Step 5: Issue refresh token (long-lived, stored in httpOnly cookie)
        const refreshToken = signRefreshToken(user.id);
        const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Step 6: Persist refresh token server-side (enables revocation)
        await storeRefreshToken(user.id, refreshToken, refreshExpiresAt);

        // Step 7: Create SSO session (shared session for "second app")
        const ssoToken = await createSSOSession(user.id);

        // Step 8: Set refresh token in httpOnly cookie (JS cannot read this)
        res.cookie('refresh_token', refreshToken, getRefreshCookieOptions());
        res.cookie('sso_token', ssoToken, getSSOCookieOptions());

        // Step 9: Return access token in response body (client stores in memory)
        return res.json({
            accessToken,
            expiresAt,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                provider: user.provider,
            },
        });
    } catch (err) {
        console.error('[login]', err);
        return res.status(500).json({ error: 'ServerError', message: 'Login failed.' });
    }
});

// ─── POST /api/auth/refresh ────────────────────────────────
router.post('/refresh', async (req, res) => {
    try {
        // Step 1: Read the refresh token from the httpOnly cookie
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            return res.status(401).json({ error: 'NoRefreshToken', message: 'No refresh token cookie found.' });
        }

        // Step 2: Verify the refresh token signature and expiry
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            return res.status(401).json({ error: 'InvalidRefreshToken', message: 'Refresh token is invalid or expired.' });
        }

        const userId = payload.sub;

        // Step 3: Check against server-side store (ensures token hasn't been revoked)
        const isValid = await validateRefreshToken(userId, refreshToken);
        if (!isValid) {
            return res.status(401).json({ error: 'RevokedToken', message: 'Refresh token has been revoked.' });
        }

        // Step 4: Look up the user (they may have been deleted)
        const user = await findUserById(userId);
        if (!user) {
            return res.status(401).json({ error: 'UserNotFound', message: 'User no longer exists.' });
        }

        // Step 5: Issue a fresh access token
        const accessToken = signAccessToken(user);
        const expiresAt = getAccessTokenExpiry();

        return res.json({ accessToken, expiresAt });
    } catch (err) {
        console.error('[refresh]', err);
        return res.status(500).json({ error: 'ServerError', message: 'Token refresh failed.' });
    }
});

// ─── POST /api/auth/logout ─────────────────────────────────
router.post('/logout', async (req, res) => {
    const refreshToken = req.cookies.refresh_token;
    const ssoToken = req.cookies.sso_token;

    if (refreshToken) {
        try {
            const payload = verifyRefreshToken(refreshToken);
            await revokeRefreshToken(payload.sub); // Remove from server-side store
        } catch {
            // Token may be expired/invalid, still proceed with logout
        }
    }

    if (ssoToken) {
        await deleteSSOSession(ssoToken);
    }

    // Clear both cookies
    res.clearCookie('refresh_token', { path: '/api/auth' });
    res.clearCookie('sso_token', { path: '/' });

    return res.json({ message: 'Logged out successfully.' });
});

// ─── GET /api/auth/google ──────────────────────────────────
// Step 1 of OAuth 2.0: Redirect user to Google's authorization endpoint
router.get('/google', (req, res) => {
    if (!config.google.isConfigured) {
        return res.status(400).json({
            error: 'OAuthNotConfigured',
            message: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
        });
    }

    // Build the Google OAuth consent URL with required parameters
    const params = new URLSearchParams({
        client_id: config.google.clientId,
        redirect_uri: config.google.redirectUri,
        response_type: 'code',            // Authorization Code flow (not implicit)
        scope: 'openid email profile',    // Request basic user info
        access_type: 'online',
        prompt: 'select_account',         // Always show account picker
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    res.redirect(googleAuthUrl);
});

// ─── GET /api/auth/google/callback ────────────────────────
// Step 2 of OAuth 2.0: Exchange authorization code for tokens
router.get('/google/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error || !code) {
        return res.redirect(`${config.frontendUrl}/login?error=oauth_cancelled`);
    }

    try {
        // Step 2a: Exchange authorization code for Google tokens (server-to-server)
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: config.google.clientId,
            client_secret: config.google.clientSecret,
            redirect_uri: config.google.redirectUri,
            grant_type: 'authorization_code',
        });

        const { access_token: googleAccessToken } = tokenResponse.data;

        // Step 2b: Use google access token to fetch user profile
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${googleAccessToken}` },
        });

        const { email, name, picture: avatar } = userInfoResponse.data;

        // Step 2c: Find or create a local user for this Google account
        const user = await findOrCreateOAuthUser({ email, name, avatar, provider: 'google' });

        // Step 2d: Issue our own JWT (uniform auth — same system as email/password)
        const accessToken = signAccessToken(user);
        const expiresAt = getAccessTokenExpiry();
        const refreshToken = signRefreshToken(user.id);
        const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await storeRefreshToken(user.id, refreshToken, refreshExpiresAt);
        const ssoToken = await createSSOSession(user.id);

        res.cookie('refresh_token', refreshToken, getRefreshCookieOptions());
        res.cookie('sso_token', ssoToken, getSSOCookieOptions());

        // Step 2e: Redirect to frontend with access token (short-lived, in URL fragment)
        // Using fragment (#) so the token never hits server logs
        res.redirect(
            `${config.frontendUrl}/oauth/callback#token=${encodeURIComponent(accessToken)}&expires=${expiresAt}`
        );
    } catch (err) {
        console.error('[google/callback]', err.response?.data || err.message);
        res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
});

// ─── GET /api/auth/sso/validate ───────────────────────────
// Used by the SSO demo: check if a valid SSO session cookie exists
router.get('/sso/validate', async (req, res) => {
    const ssoToken = req.cookies.sso_token;
    const userId = await validateSSOSession(ssoToken);

    if (!userId) {
        return res.status(401).json({ authenticated: false });
    }

    const user = await findUserById(userId);
    if (!user) {
        return res.status(401).json({ authenticated: false });
    }

    // Issue a fresh access token from the SSO session
    const accessToken = signAccessToken(user);
    const expiresAt = getAccessTokenExpiry();

    return res.json({
        authenticated: true,
        accessToken,
        expiresAt,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, provider: user.provider },
    });
});

// ─── GET /api/auth/config ─────────────────────────────────
// Lets the frontend know if Google OAuth is available
router.get('/config', (req, res) => {
    res.json({ googleOAuthEnabled: config.google.isConfigured });
});

export default router;
