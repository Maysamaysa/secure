// ============================================================
// routes/admin.routes.js — Admin-only endpoints
// ============================================================
// Protected by requireRole('admin')
// Managers and employees will receive a 403 Forbidden response

import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { getAllUsers } from '../data/users.js';
import { getSessionSummary, revokeRefreshToken } from '../data/sessions.js';

const router = express.Router();

// GET /api/admin/users — returns all users with session info
router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
    const users = await getAllUsers();
    const sessions = await getSessionSummary();

    // Merge user data with session info
    const usersWithSessions = users.map((user) => ({
        ...user,
        session: sessions[user.id] || { hasRefreshToken: false },
    }));

    return res.json({ users: usersWithSessions, requestedBy: req.user.name });
});

// DELETE /api/admin/revoke/:userId — revoke a user's refresh token (force logout)
router.delete('/revoke/:userId', requireAuth, requireRole('admin'), async (req, res) => {
    const { userId } = req.params;

    // Prevent admins from revoking their own session via this endpoint
    if (userId === req.user.sub) {
        return res.status(400).json({
            error: 'BadRequest',
            message: 'Cannot revoke your own refresh token through this endpoint. Use /logout instead.',
        });
    }

    await revokeRefreshToken(userId);

    return res.json({
        message: `Refresh token revoked for user ${userId}. They will be logged out on next request.`,
        revokedUserId: userId,
        revokedBy: req.user.name,
    });
});

export default router;
