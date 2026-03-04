// ============================================================
// server.js — Entry point: seed database, then start server
// ============================================================
import app from './app.js';
import { config } from './config/index.js';
import { initDb } from './data/db.js';

async function start() {
    // Initialize PostgreSQL schemas and seed if empty
    await initDb();

    app.listen(config.port, () => {
        console.log(`\n🚀 JWT Auth Server running at http://localhost:${config.port}`);
        console.log(`   Environment : ${config.nodeEnv}`);
        console.log(`   Google OAuth: ${config.google.isConfigured ? '✅ Configured' : '⚠️  Not configured (disabled)'}`);
        console.log(`   Frontend URL: ${config.frontendUrl}`);
        console.log(`\n📧 Test Accounts:`);
        console.log(`   employee@demo.com / pass123  (role: employee)`);
        console.log(`   manager@demo.com  / pass123  (role: manager)`);
        console.log(`   admin@demo.com    / pass123  (role: admin)\n`);
    });
}

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
