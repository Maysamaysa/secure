// ============================================================
// data/sessions.js — PostgreSQL refresh token & SSO session store
// ============================================================
// Stores refresh tokens and SSO tokens in the PostgreSQL DB.

import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';

// ─── Refresh Token Operations ──────────────────────────────

/**
 * Store a refresh token for a user.
 * Replaces any existing refresh token (single-device model).
 */
export async function storeRefreshToken(userId, token, expiresAt) {
    await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) 
         DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, created_at = NOW()`,
        [userId, token, new Date(expiresAt)]
    );
}

/**
 * Validate that the provided refresh token matches the stored one
 * and has not expired.
 */
export async function validateRefreshToken(userId, token) {
    const { rows } = await pool.query(
        'SELECT token, expires_at FROM refresh_tokens WHERE user_id = $1',
        [userId]
    );

    if (rows.length === 0) return false;

    const entry = rows[0];
    if (entry.token !== token) return false;

    if (new Date() > new Date(entry.expires_at)) {
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
        return false;
    }

    return true;
}

/**
 * Revoke the refresh token for a specific user (force logout).
 * Called by admins or during logout.
 */
export async function revokeRefreshToken(userId) {
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    // Also revoke any SSO sessions for this user
    await pool.query('DELETE FROM sso_sessions WHERE user_id = $1', [userId]);
}

// ─── SSO Session Operations ────────────────────────────────

/**
 * Create an SSO session token for a logged-in user.
 * This token is stored in a cookie shared across "apps".
 * Returns the SSO session token.
 */
export async function createSSOSession(userId) {
    const ssoToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
        `INSERT INTO sso_sessions (sso_token, user_id, expires_at)
         VALUES ($1, $2, $3)`,
        [ssoToken, userId, expiresAt]
    );

    return ssoToken;
}

/**
 * Validate an SSO session token.
 * Returns the userId if valid, null otherwise.
 */
export async function validateSSOSession(ssoToken) {
    if (!ssoToken) return null;

    const { rows } = await pool.query(
        'SELECT user_id, expires_at FROM sso_sessions WHERE sso_token = $1',
        [ssoToken]
    );

    if (rows.length === 0) return null;

    const entry = rows[0];
    if (new Date() > new Date(entry.expires_at)) {
        await pool.query('DELETE FROM sso_sessions WHERE sso_token = $1', [ssoToken]);
        return null;
    }

    return entry.user_id;
}

/**
 * Delete an SSO session (SSO logout).
 */
export async function deleteSSOSession(ssoToken) {
    await pool.query('DELETE FROM sso_sessions WHERE sso_token = $1', [ssoToken]);
}

// ─── Admin Inspection ─────────────────────────────────────

/**
 * Get a summary of all active sessions for the admin panel.
 */
export async function getSessionSummary() {
    const now = new Date();
    const sessions = {};

    const { rows } = await pool.query('SELECT user_id, expires_at, created_at FROM refresh_tokens');

    for (const row of rows) {
        sessions[row.user_id] = {
            hasRefreshToken: true,
            refreshTokenExpiresAt: row.expires_at,
            isExpired: now > new Date(row.expires_at),
            createdAt: row.created_at,
        };
    }

    return sessions;
}
