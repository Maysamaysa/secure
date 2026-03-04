// ============================================================
// pages/DashboardPage.jsx — JWT Inspector + countdown
// ============================================================
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { HowItWorks } from '../components/HowItWorks.jsx';

// Decode a JWT without verification (for display only)
function decodeJWT(token) {
    if (!token) return null;
    try {
        const [headerB64, payloadB64, signature] = token.split('.');
        const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
        const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
        return { header, payload, signature: signature?.substring(0, 32) + '...' };
    } catch { return null; }
}

function JSONPanel({ data, color, label }) {
    return (
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{
                background: `${color}0d`,
                border: `1px solid ${color}30`,
                borderRadius: '0.5rem',
                padding: '0.85rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.75)',
                overflow: 'auto',
                maxHeight: 200,
                wordBreak: 'break-all',
            }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
            </div>
        </div>
    );
}

function SigPanel({ sig, color }) {
    return (
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signature</div>
            <div style={{
                background: `${color}0d`,
                border: `1px solid ${color}30`,
                borderRadius: '0.5rem',
                padding: '0.85rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                lineHeight: 1.7,
                color: color,
                wordBreak: 'break-all',
            }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem', fontSize: '0.68rem' }}>HMACSHA256(base64url(header) + "." + base64url(payload), secret)</div>
                {sig}
            </div>
        </div>
    );
}

function CountdownRing({ expiresAt }) {
    const [remaining, setRemaining] = useState(0);
    const total = 15 * 60; // 15 minutes in seconds

    useEffect(() => {
        const update = () => {
            const secs = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            setRemaining(secs);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    const pct = remaining / total;
    const r = 36, circumference = 2 * Math.PI * r;
    const dashOffset = circumference * (1 - pct);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const color = remaining > 120 ? '#34d399' : remaining > 30 ? '#f59e0b' : '#f87171';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="5"
                    strokeDasharray={circumference} strokeDashoffset={dashOffset}
                    strokeLinecap="round" transform="rotate(-90 44 44)"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 1s' }}
                />
                <text x="44" y="44" dominantBaseline="middle" textAnchor="middle" fill={color} fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </text>
            </svg>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>token expires in</span>
        </div>
    );
}

const roleConfig = { employee: { label: 'Employee', cls: 'badge-employee', icon: '👤' }, manager: { label: 'Manager', cls: 'badge-manager', icon: '👔' }, admin: { label: 'Admin', cls: 'badge-admin', icon: '🛡️' } };

export default function DashboardPage() {
    const { user, accessToken, tokenExpiresAt } = useAuth();
    const decoded = decodeJWT(accessToken);
    const rc = roleConfig[user?.role] || roleConfig.employee;

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#e2e8f0' }}>
                        Welcome back, {user?.name?.split(' ')[0]} {rc.icon}
                    </h1>
                    <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
                        You're authenticated via JWT. Your session details are shown below.
                    </p>
                    {user?.avatar && <img src={user.avatar} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', marginTop: '0.75rem', border: '2px solid rgba(99,102,241,0.5)' }} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <CountdownRing expiresAt={tokenExpiresAt} />
                </div>
            </div>

            {/* User info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Name', value: user?.name, icon: '👤' },
                    { label: 'Email', value: user?.email, icon: '📧' },
                    { label: 'Role', value: <span className={rc.cls} style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 700 }}>{rc.label}</span>, icon: '🎭' },
                    { label: 'Provider', value: user?.provider || 'local', icon: '🔌' },
                ].map((item) => (
                    <div key={item.label} className="glass" style={{ padding: '1rem 1.25rem', borderRadius: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                            {item.icon} {item.label}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#e2e8f0', fontWeight: 500, wordBreak: 'break-all' }}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* JWT Inspector */}
            <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>🔍</span>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0' }}>Live JWT Inspector</h2>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '0.3rem' }}>
                        decoded in-browser, no verification
                    </span>
                </div>

                {/* Raw token */}
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', wordBreak: 'break-all', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>
                    {accessToken?.split('.').map((part, i) => {
                        const colors = ['#6366f1', '#10b981', '#f59e0b'];
                        return <span key={i} style={{ color: colors[i] }}>{part}{i < 2 ? '.' : ''}</span>;
                    })}
                </div>

                {decoded && (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <JSONPanel data={decoded.header} color="#6366f1" label="Header (alg + typ)" />
                        <JSONPanel data={decoded.payload} color="#10b981" label="Payload (claims)" />
                        <SigPanel sig={decoded.signature} color="#f59e0b" />
                    </div>
                )}
            </div>

            <HowItWorks
                title="How JWT authentication protects this page"
                mechanism="JWT Bearer Token"
                steps={[
                    'On login, the server signs a JWT with a secret key and sends it back in the response body.',
                    'Your browser stores the token in React state (memory) — never in localStorage or sessionStorage.',
                    'Every API request attaches the token as "Authorization: Bearer <token>".',
                    'The server middleware calls jwt.verify() to check the signature and expiry.',
                    'If the token expires, the Axios interceptor automatically calls /api/auth/refresh using the httpOnly cookie.',
                    'The refresh endpoint validates the refresh token against the server-side store, then issues a new access token.',
                ]}
            />
        </div>
    );
}
