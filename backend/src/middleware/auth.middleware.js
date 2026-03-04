// ============================================================
// middleware/auth.middleware.js — JWT validation & role-based access
// ============================================================
// Two middleware functions:
//   requireAuth  — validates the JWT from the Authorization header
//   requireRole  — checks the user's role against allowed roles
//
// JWT Validation Flow:
//   1. Extract "Bearer <token>" from the Authorization header
//   2. Verify signature using the access token secret
//   3. Check expiry (handled by jwt.verify internally)
//   4. Attach the decoded payload to req.user for downstream handlers

import { verifyAccessToken } from '../services/jwt.service.js';

// ─── requireAuth ──────────────────────────────────────────

/**
 * Middleware: validate JWT access token.
 *
 * Expects: Authorization: Bearer <access_token>
 * Sets:    req.user = decoded JWT payload
 * Errors:
 *   401 — no token present
 *   401 — token invalid or expired
 */
export function requireAuth(req, res, next) {
    // Step 1: Extract the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'No access token provided. Include "Authorization: Bearer <token>" header.',
        });
    }

    // Step 2: Extract the raw token string
    const token = authHeader.split(' ')[1];

    try {
        // Step 3: Verify signature + expiry using the access secret
        // Throws JsonWebTokenError (bad signature), TokenExpiredError, or NotBeforeError
        const decoded = verifyAccessToken(token);

        // Step 4: Attach decoded payload to request for use in route handlers
        req.user = decoded;

        next();
    } catch (err) {
        // Distinguish between expiry and other JWT errors for better client UX
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'TokenExpired',
                message: 'Access token has expired. Use /api/auth/refresh to obtain a new one.',
            });
        }

        return res.status(401).json({
            error: 'InvalidToken',
            message: 'Access token is invalid or malformed.',
        });
    }
}

// ─── requireRole ──────────────────────────────────────────

// Role hierarchy levels — higher number = more permissions
const ROLE_LEVELS = { employee: 1, manager: 2, admin: 3 };

/**
 * Middleware factory: require a minimum role level.
 *
 * Usage: requireRole('manager', 'admin')
 * This checks if req.user.role is in the allowed list.
 *
 * Must be used AFTER requireAuth (depends on req.user being set).
 */
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        // requireAuth must have run first
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated.' });
        }

        const userRole = req.user.role;

        // Check if user's role is in the allowed list
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`,
                requiredRoles: allowedRoles,
                userRole,
            });
        }

        next();
    };
}
