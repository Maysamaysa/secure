// ============================================================
// config/index.js — Load & validate environment variables
// ============================================================
import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key, fallback) {
  const val = process.env[key];
  if (!val) {
    if (fallback !== undefined) return fallback;
    console.warn(`[config] Warning: ${key} is not set.`);
    return '';
  }
  return val;
}

export const config = {
  port: parseInt(requireEnv('PORT', '3001')),
  nodeEnv: requireEnv('NODE_ENV', 'development'),
  frontendUrl: requireEnv('FRONTEND_URL', 'http://localhost:5173'),

  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET', 'dev_access_secret_must_be_changed_in_production'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET', 'dev_refresh_secret_must_be_changed_in_production'),
    accessExpiry: requireEnv('JWT_ACCESS_EXPIRY', '15m'),
    refreshExpiry: requireEnv('JWT_REFRESH_EXPIRY', '7d'),
  },

  google: {
    clientId: requireEnv('GOOGLE_CLIENT_ID', ''),
    clientSecret: requireEnv('GOOGLE_CLIENT_SECRET', ''),
    redirectUri: requireEnv('GOOGLE_REDIRECT_URI', 'http://localhost:3001/api/auth/google/callback'),
    // OAuth is only available when both client ID and secret are configured
    isConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },

  dbUrl: requireEnv('DATABASE_URL'),
};
