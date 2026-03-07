// ============================================================
// routes/user.routes.js — Current user info
// ============================================================
import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { findUserById } from '../data/users.js';

const router = express.Router();

// GET /api/user and /api/user/me — return current authenticated user info
// some clients expect /api/user directly, so handle both paths identically
async function sendCurrentUser(req, res) {
    const user = await findUserById(req.user.sub);
    if (!user) {
        return res.status(404).json({ error: 'UserNotFound', message: 'User not found.' });
    }

    const { passwordHash, ...safeUser } = user;
    return res.json({ user: safeUser });
}

router.get('/', requireAuth, sendCurrentUser);
router.get('/me', requireAuth, sendCurrentUser);

export default router;
