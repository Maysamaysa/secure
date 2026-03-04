// ============================================================
// app.js — Express application setup
// ============================================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import promBundle from 'express-prom-bundle';
import client from 'prom-client';
import { config } from './config/index.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import managerRoutes from './routes/manager.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// ─── Prometheus Metrics ───────────────────────────────────
// enable default collection including process, GC, and nodejs metrics
client.collectDefaultMetrics({ timeout: 5000 });

// middleware that automatically instruments request metrics and exposes /metrics
const metricsMiddleware = promBundle({
    collectDefaultMetrics: true, // Collect default Node.js process metrics
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    // you can normalize or ignore paths if needed
    // normalizePath: [/^\/api\/[^\/]+\/?/],
    metricsPath: '/metrics',
});
app.use(metricsMiddleware);

// ─── Security Headers ──────────────────────────────────────
// helmet sets secure HTTP headers (X-Frame-Options, CSP, etc.)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ──────────────────────────────────────────────────
// Only allow requests from the frontend origin
// Credentials: true allows cookies to be sent cross-origin
app.use(cors({
    origin: config.frontendUrl,
    credentials: true, // Required for httpOnly cookie exchange
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing / Cookies ────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // Parse Cookie header (for refresh_token)

// ─── Rate Limiting ─────────────────────────────────────────
// Stricter limits on auth endpoints to slow brute-force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 20 : 1000, // relaxed in dev
    message: { error: 'TooManyRequests', message: 'Too many auth requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production', // skip entirely in dev
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'TooManyRequests', message: 'Too many requests. Please try again later.' },
});

app.use(generalLimiter);

// ─── Routes ────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);

// ─── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'NotFound', message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ──────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('[error]', err);
    res.status(500).json({ error: 'ServerError', message: 'An unexpected error occurred.' });
});

export default app;
