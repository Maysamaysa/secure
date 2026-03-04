// ============================================================
// pages/LoginPage.jsx
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api/axios.js';

// ─── Auth Flow Diagram ─────────────────────────────────────
function FlowDiagram({ type }) {
    const jwtSteps = [
        { icon: '📝', label: 'Submit credentials' },
        { icon: '🔍', label: 'Server validates + bcrypt' },
        { icon: '🪙', label: 'Issue JWT (15m) + refresh (7d)' },
        { icon: '🔒', label: 'Access protected routes' },
        { icon: '♻️', label: 'Silent refresh on expiry' },
    ];
    const oauthSteps = [
        { icon: '🔗', label: 'Redirect to Google' },
        { icon: '✅', label: 'User consents' },
        { icon: '📦', label: 'Google returns "code"' },
        { icon: '🔄', label: 'Server exchanges code' },
        { icon: '🪙', label: 'Server issues own JWT' },
    ];
    const steps = type === 'jwt' ? jwtSteps : oauthSteps;
    const color = type === 'jwt' ? '#6366f1' : '#db4437';

    return (
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.75rem', border: `1px solid ${color}30` }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {type === 'jwt' ? '🔐 JWT Auth Flow' : '🌐 OAuth 2.0 Flow'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem' }}>{s.icon}</span>
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>{s.label}</span>
                        {i < steps.length - 1 && (
                            <div style={{ width: 1, height: 12, background: `${color}40`, margin: '0 0 0 0.2rem', alignSelf: 'flex-end', marginLeft: 'auto', marginRight: '0.5rem' }} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function LoginPage() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleEnabled, setGoogleEnabled] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const from = location.state?.from?.pathname || '/dashboard';
    const oauthError = new URLSearchParams(location.search).get('error');

    useEffect(() => {
        if (isAuthenticated) navigate(from, { replace: true });
    }, [isAuthenticated, navigate, from]);

    useEffect(() => {
        api.get('/api/auth/config').then(({ data }) => setGoogleEnabled(data.googleOAuthEnabled)).catch(() => { });
        if (oauthError) setError(oauthError === 'oauth_cancelled' ? 'Google sign-in was cancelled.' : 'Google sign-in failed. Please try again.');
    }, [oauthError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const quickFill = (role) => {
        const creds = { employee: ['employee@demo.com', 'pass123'], manager: ['manager@demo.com', 'pass123'], admin: ['admin@demo.com', 'pass123'] };
        setEmail(creds[role][0]);
        setPassword(creds[role][1]);
        setError('');
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--color-surface)', position: 'relative', overflow: 'hidden' }}>
            {/* Background glow */}
            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Left panel — form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', maxWidth: 520 }}>
                <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.5s ease' }}>
                    {/* Logo */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: '0 8px 25px rgba(99,102,241,0.4)' }}>🔐</div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#e2e8f0' }}>AuthVault</h1>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>JWT · OAuth 2.0 · SSO Demo</p>
                            </div>
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#e2e8f0' }}>Sign in</h2>
                        <p style={{ margin: '0.4rem 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Use a test account or your Google credentials</p>
                    </div>

                    {/* Quick fill buttons */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Fill</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['employee', 'manager', 'admin'].map((role) => (
                                <button key={role} onClick={() => quickFill(role)} style={{
                                    flex: 1, padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.04)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                                    color: role === 'employee' ? '#93c5fd' : role === 'manager' ? '#fde047' : '#fca5a5',
                                    transition: 'all 0.2s',
                                }}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }}>Email</label>
                            <input id="email" type="email" className="input-field" placeholder="you@demo.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }}>Password</label>
                            <input id="password" type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                        </div>

                        {error && (
                            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', color: '#fca5a5', fontSize: '0.875rem' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.25rem' }}>
                            {loading ? <><span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} /> Signing in...</> : '→ Sign In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>OR</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                    </div>

                    {/* Google OAuth button */}
                    <div style={{ position: 'relative' }}>
                        {!googleEnabled && (
                            <div
                                onMouseEnter={() => setShowTooltip(true)}
                                onMouseLeave={() => setShowTooltip(false)}
                                style={{ position: 'absolute', inset: 0, zIndex: 2, cursor: 'not-allowed' }}
                            />
                        )}
                        {showTooltip && (
                            <div style={{
                                position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                                background: '#1e1b4b', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '0.5rem',
                                padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#a5b4fc',
                                whiteSpace: 'nowrap', zIndex: 10, boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                            }}>
                                ⚙️ Configure GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in .env to enable
                            </div>
                        )}
                        <button
                            id="google-oauth-btn"
                            className="btn-secondary"
                            disabled={!googleEnabled}
                            onClick={() => window.location.href = 'http://localhost:3001/api/auth/google'}
                            style={{ gap: '0.75rem' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18">
                                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                            </svg>
                            {googleEnabled ? 'Continue with Google' : 'Google OAuth (not configured)'}
                        </button>
                    </div>

                    <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                        <Link to="/sso-app" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.2s' }}>
                            View SSO App Demo →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right panel — diagrams */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 3rem', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Auth Flow Diagrams</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <FlowDiagram type="jwt" />
                    <FlowDiagram type="oauth" />
                </div>

                {/* Test users table */}
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Test Accounts</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                            <tr>
                                {['Email', 'Password', 'Role'].map((h) => (
                                    <th key={h} style={{ textAlign: 'left', padding: '0.3rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { email: 'employee@demo.com', pwd: 'pass123', role: 'employee', cls: 'badge-employee' },
                                { email: 'manager@demo.com', pwd: 'pass123', role: 'manager', cls: 'badge-manager' },
                                { email: 'admin@demo.com', pwd: 'pass123', role: 'admin', cls: 'badge-admin' },
                            ].map((u) => (
                                <tr key={u.email}>
                                    <td style={{ padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{u.email}</td>
                                    <td style={{ padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{u.pwd}</td>
                                    <td style={{ padding: '0.4rem 0.5rem' }}>
                                        <span className={u.cls} style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 600 }}>{u.role}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
