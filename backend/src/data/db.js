import pkg from 'pg';
const { Pool } = pkg;
import { config } from '../config/index.js';
import bcrypt from 'bcryptjs';

const pool = new Pool({
    connectionString: config.dbUrl,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export async function initDb() {
    console.log('Initializing PostgreSQL database...');

    // Create users table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255),
            password_hash VARCHAR(255),
            role VARCHAR(50) NOT NULL,
            avatar TEXT,
            provider VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Create refresh_tokens table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            token TEXT NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Create sso_sessions table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS sso_sessions (
            sso_token UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Seed test users if the users table is empty
    const { rows } = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(rows[0].count) === 0) {
        console.log('Seeding initial test users...');
        const SALT_ROUNDS = 12;
        const passHash = await bcrypt.hash('pass123', SALT_ROUNDS);

        await pool.query(
            `INSERT INTO users (id, email, name, password_hash, role, provider, created_at)
             VALUES
             (gen_random_uuid(), 'employee@demo.com', 'Alex Employee', $1, 'employee', 'local', NOW()),
             (gen_random_uuid(), 'manager@demo.com', 'Sam Manager', $1, 'manager', 'local', NOW()),
             (gen_random_uuid(), 'admin@demo.com', 'Jordan Admin', $1, 'admin', 'local', NOW())
            `, [passHash]
        );
        console.log('Seeded 3 test users.');
    } else {
        console.log('Users table already contains data. Skipping seed.');
    }
}

export default pool;
