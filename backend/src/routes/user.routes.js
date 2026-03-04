// ============================================================
// routes/user.routes.js — Current user info
// ============================================================
import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { findUserById } from '../data/users.js';

const router = express.Router();

// GET /api/user/me — return current authenticated user info
router.get('/me', requireAuth, async (req, res) => {
    const user = await findUserById(req.user.sub);
    if (!user) {
        return res.status(404).json({ error: 'UserNotFound', message: 'User not found.' });
    }

    const { passwordHash, ...safeUser } = user;
    return res.json({ user: safeUser });
});

export default router;
