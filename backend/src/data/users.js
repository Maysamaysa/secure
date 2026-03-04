// ============================================================
// data/users.js — PostgreSQL user store
// ============================================================
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';

const SALT_ROUNDS = 12;

// Role hierarchy: admin > manager > employee
export const ROLES = {
    EMPLOYEE: 'employee',
    MANAGER: 'manager',
    ADMIN: 'admin',
};

// Role permission levels for hierarchy checks
export const ROLE_LEVELS = {
    employee: 1,
    manager: 2,
    admin: 3,
};

// Helper to map snake_case DB fields to camelCase for the app
function mapUserRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        passwordHash: row.password_hash,
        role: row.role,
        avatar: row.avatar,
        provider: row.provider,
        createdAt: row.created_at,
    };
}

/**
 * Seed the database with test users.
 * Now handled inside db.js initDb(), but kept for backward compatibility if called elsewhere.
 */
export async function seedUsers() {
    console.log(`[users] seedUsers() is now handled by initDb().`);
}

/** Find user by email (case-insensitive) */
export async function findUserByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return mapUserRow(rows[0]);
}

/** Find user by ID */
export async function findUserById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return mapUserRow(rows[0]);
}

/** Get all users (without password hashes) */
export async function getAllUsers() {
    const { rows } = await pool.query('SELECT id, email, name, role, avatar, provider, created_at FROM users');
    return rows.map(mapUserRow);
}

/** Find or create an OAuth user (Google) */
export async function findOrCreateOAuthUser({ email, name, avatar, provider }) {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        // Update OAuth fields if already exists
        await pool.query(
            'UPDATE users SET name = $1, avatar = $2, provider = $3 WHERE id = $4',
            [name, avatar, provider, existingUser.id]
        );
        existingUser.name = name;
        existingUser.avatar = avatar;
        existingUser.provider = provider;
        return existingUser;
    }

    // Create new user with no password (OAuth-only account)
    const newId = uuidv4();
    const { rows } = await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role, avatar, provider, created_at)
         VALUES ($1, $2, $3, NULL, $4, $5, $6, NOW())
         RETURNING *`,
        [newId, email, name, ROLES.EMPLOYEE, avatar, provider]
    );

    return mapUserRow(rows[0]);
}

/**
 * Validate a password against the stored bcrypt hash.
 * bcrypt.compare is timing-safe and resistant to timing attacks.
 */
export async function validatePassword(plaintext, hash) {
    if (!hash) return false; // OAuth-only users have no password
    return bcrypt.compare(plaintext, hash);
}
