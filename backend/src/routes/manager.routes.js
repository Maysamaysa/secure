// ============================================================
// routes/manager.routes.js — Manager-only endpoints
// ============================================================
// Protected by requireRole('manager', 'admin')
// Employees will receive a 403 Forbidden response

import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Mock team data — in production this would query a real database
const MOCK_TEAM = [
    { id: 'e1', name: 'Alice Chen', email: 'alice@demo.com', role: 'employee', department: 'Engineering', joinDate: '2023-01-15', status: 'active' },
    { id: 'e2', name: 'Bob Tanaka', email: 'bob@demo.com', role: 'employee', department: 'Design', joinDate: '2022-08-20', status: 'active' },
    { id: 'e3', name: 'Carol Smith', email: 'carol@demo.com', role: 'employee', department: 'Engineering', joinDate: '2023-06-01', status: 'active' },
    { id: 'e4', name: 'David Park', email: 'david@demo.com', role: 'employee', department: 'Marketing', joinDate: '2021-11-10', status: 'inactive' },
    { id: 'e5', name: 'Emma Wilson', email: 'emma@demo.com', role: 'employee', department: 'Engineering', joinDate: '2024-02-28', status: 'active' },
];

// GET /api/manager/team — requires manager or admin role
router.get('/team', requireAuth, requireRole('manager', 'admin'), (req, res) => {
    return res.json({
        team: MOCK_TEAM,
        fetchedBy: { name: req.user.name, role: req.user.role },
        totalCount: MOCK_TEAM.length,
    });
});

export default router;
