// ============================================================
// pages/SSOAppPage.jsx — SSO "second app" simulation
// ============================================================
// This page acts as a second, independent "App B".
// It detects shared auth via the sso_token cookie (httpOnly).
// When the user is logged in to App A (the main app), visiting
// this page auto-authenticates them without a new login prompt.
// Logging out here clears the shared SSO session (affects both apps).

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { HowItWorks } from '../components/HowItWorks.jsx';

const roleConfig = {
    employee: { label: 'Employee', cls: 'badge-employee', icon: '👤' },
    manager: { label: 'Manager', cls: 'badge-manager', icon: '👔' },
    admin: { label: 'Admin', cls: 'badge-admin', icon: '🛡️' },
};

export default function SSOAppPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [logoutDone, setLogoutDone] = useState(false);

    const rc = roleConfig[user?.role] || roleConfig.employee;

    const handleSSOLogout = async () => {
        await logout();
        setLogoutDone(true);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
            {/* App B banner */}
            <div style={{
                background: 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
                borderBottom: '1px solid rgba(16,185,129,0.2)',
                padding: '0.6rem 1.5rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.82rem', color: '#6ee7b7', fontWeight: 600,
            }}>
                <span>🌐</span> SSO Demo — App B (second application sharing the same SSO session)
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ width: '100%', maxWidth: 620, animation: 'fadeIn 0.4s ease' }}>

                    {/* App B header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🌐</div>
                        <div>
                            <h1 style={{ margin: 0, fontWeight: 800, color: '#e2e8f0', fontSize: '1.5rem' }}>Analytics Portal (App B)</h1>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>A separate application sharing the SSO session</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                            <div style={{ width: 20, height: 20, border: '2px solid rgba(16,185,129,0.3)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            Checking SSO session...
                        </div>
                    ) : logoutDone ? (
                        <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👋</div>
                            <h2 style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontWeight: 700 }}>Logged out of all apps</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
                                The logout from App B also cleared the shared SSO session. You are now logged out of App A too.
                            </p>
                            <button className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }} onClick={() => navigate('/login')}>
                                Sign In Again
                            </button>
                        </div>
                    ) : isAuthenticated ? (
                        <>
                            {/* Authenticated state */}
                            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.08))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                                    <span style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '0.9rem' }}>Auto-authenticated via SSO</span>
                                </div>
                                <p style={{ margin: '0 0 1.25rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                                    You were automatically authenticated in App B using the shared SSO session cookie. No additional login was required.
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    {[
                                        { label: 'Name', value: user?.name, icon: '👤' },
                                        { label: 'Email', value: user?.email, icon: '📧' },
                                        { label: 'Role', value: <span className={rc.cls} style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>{rc.icon} {rc.label}</span>, icon: '🎭' },
                                        { label: 'Provider', value: user?.provider || 'local', icon: '🔌' },
                                    ].map((item) => (
                                        <div key={item.label} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem' }}>{item.icon} {item.label}</div>
                                            <div style={{ color: '#e2e8f0', fontSize: '0.85rem', wordBreak: 'break-all' }}>{item.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SSO logout */}
                            <div className="glass" style={{ padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontWeight: 700, fontSize: '1rem' }}>🔗 SSO Logout Test</h3>
                                <p style={{ margin: '0 0 1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                    Click below to log out. This clears the shared SSO session cookie — you will be logged out of both App A and App B simultaneously.
                                </p>
                                <button className="btn-danger" onClick={handleSSOLogout} style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}>
                                    🚪 Logout (SSO — affects both apps)
                                </button>
                            </div>

                            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                                ← Back to App A Dashboard
                            </button>
                        </>
                    ) : (
                        /* Not authenticated state */
                        <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔐</div>
                            <h2 style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontWeight: 700 }}>Not authenticated</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                No active SSO session found. Sign in to App A first — then return here to see SSO auto-authentication in action.
                            </p>
                            <button className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }} onClick={() => navigate('/login')}>
                                Sign In to App A
                            </button>
                        </div>
                    )}

                    <HowItWorks
                        title="How SSO session sharing works"
                        mechanism="Shared Session Cookie"
                        steps={[
                            'When you log in (App A), the server sets an httpOnly "sso_token" cookie with path="/" — accessible from any path on the same origin.',
                            'The sso_token is stored server-side (in-memory sessions Map), linked to your userId.',
                            'When App B loads, it calls GET /api/auth/sso/validate, which reads the sso_token cookie.',
                            'If the token is valid, the server looks up the user and issues a fresh access token.',
                            'App B receives the access token and auto-authenticates you — no login required.',
                            'SSO logout: App B calls POST /api/auth/logout, which deletes the sso_token from the server store and clears the cookie. Both apps lose the session.',
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}
