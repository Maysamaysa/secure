// ============================================================
// services/jwt.service.js — JWT signing and verification
// ============================================================
// This service handles all JWT operations:
//   - Access tokens: short-lived (15m), carry user identity + role
//   - Refresh tokens: long-lived (7d), only used to mint new access tokens
//
// SECURITY NOTES:
//   - Access tokens are never stored server-side (stateless JWT)
//   - Refresh tokens ARE stored server-side so they can be revoked
//   - Both use separate secrets to limit blast radius if one leaks

import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

// ─── Access Token ──────────────────────────────────────────

/**
 * Sign a new access token containing non-sensitive user claims.
 *
 * Payload includes:
 *   sub   — subject (user ID), standard JWT claim
 *   email — user's email for display purposes
 *   name  — display name
 *   role  — RBAC role ('employee' | 'manager' | 'admin')
 *   iat   — issued-at timestamp (auto-added by jsonwebtoken)
 *   exp   — expiry timestamp (derived from expiresIn option)
 */
export function signAccessToken(user) {
    const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar || null,
        provider: user.provider || 'local',
    };

    return jwt.sign(payload, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiry, // e.g. '15m'
        algorithm: 'HS256',
    });
}

/**
 * Verify and decode an access token.
 * Throws if the token is expired, tampered, or uses the wrong secret.
 * Returns the decoded payload on success.
 */
export function verifyAccessToken(token) {
    // jwt.verify throws JsonWebTokenError, TokenExpiredError, or NotBeforeError
    return jwt.verify(token, config.jwt.accessSecret, { algorithms: ['HS256'] });
}

// ─── Refresh Token ──────────────────────────────────────────

/**
 * Sign a refresh token.
 * Refresh tokens only carry the user ID — the minimum required to
 * look up the user and mint a new access token.
 */
export function signRefreshToken(userId) {
    return jwt.sign({ sub: userId }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiry, // e.g. '7d'
        algorithm: 'HS256',
    });
}

/**
 * Verify a refresh token and return the payload.
 * The caller must also check the token against the server-side store
 * (sessions.js) to ensure it hasn't been revoked.
 */
export function verifyRefreshToken(token) {
    return jwt.verify(token, config.jwt.refreshSecret, { algorithms: ['HS256'] });
}

/**
 * Decode a token WITHOUT verifying the signature.
 * Used only for display/debug purposes (e.g., the JWT inspector on the dashboard).
 * NEVER use this for authentication decisions.
 */
export function decodeTokenUnsafe(token) {
    return jwt.decode(token, { complete: true });
}

/**
 * Calculate the expiry timestamp (ms since epoch) for an access token.
 * Used by the frontend countdown timer.
 */
export function getAccessTokenExpiry() {
    // Parse '15m' → 15 * 60 * 1000 ms
    const expiry = config.jwt.accessExpiry;
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return Date.now() + 15 * 60 * 1000;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return Date.now() + value * multipliers[unit];
}
