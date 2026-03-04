// ============================================================
// pages/AdminPage.jsx — Admin panel with token revocation
// ============================================================
import { useState, useEffect } from 'react';
import { api } from '../api/axios.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { HowItWorks } from '../components/HowItWorks.jsx';

const roleConfig = {
    employee: { cls: 'badge-employee', icon: '👤' },
    manager: { cls: 'badge-manager', icon: '👔' },
    admin: { cls: 'badge-admin', icon: '🛡️' },
};

export default function AdminPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [revoking, setRevoking] = useState(null);
    const [revokeMsg, setRevokeMsg] = useState('');

    const fetchUsers = () => {
        setLoading(true);
        api.get('/api/admin/users')
            .then(({ data }) => { setUsers(data.users); setLoading(false); })
            .catch((err) => { setError(err.response?.data?.message || 'Failed to load users'); setLoading(false); });
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleRevoke = async (userId, userName) => {
        if (!window.confirm(`Revoke refresh token for ${userName}? They will be logged out on their next request.`)) return;
        setRevoking(userId);
        setRevokeMsg('');
        try {
            const { data } = await api.delete(`/api/admin/revoke/${userId}`);
            setRevokeMsg(`✅ ${data.message}`);
            fetchUsers(); // Refresh session data
        } catch (err) {
            setRevokeMsg(`❌ ${err.response?.data?.message || 'Revocation failed'}`);
        } finally {
            setRevoking(null);
        }
    };

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }} className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#e2e8f0' }}>Admin Panel</h1>
                    <span className="badge-admin" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 600 }}>admin only</span>
                </div>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)' }}>Manage users, view active sessions, and revoke tokens.</p>
            </div>

            {revokeMsg && (
                <div style={{
                    padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem',
                    background: revokeMsg.startsWith('✅') ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${revokeMsg.startsWith('✅') ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: revokeMsg.startsWith('✅') ? '#6ee7b7' : '#fca5a5',
                    animation: 'fadeIn 0.2s ease',
                }}>
                    {revokeMsg}
                </div>
            )}

            {loading && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ width: 20, height: 20, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Loading users...
                </div>
            )}

            {error && (
                <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', color: '#fca5a5' }}>⚠️ {error}</div>
            )}

            {!loading && !error && (
                <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{users.length} users total</span>
                        <button onClick={fetchUsers} style={{ padding: '0.3rem 0.75rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '0.4rem', color: '#a5b4fc', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                            ↻ Refresh
                        </button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                {['User', 'Email', 'Role', 'Provider', 'Session', 'Actions'].map((h) => (
                                    <th key={h} style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, i) => {
                                const rc = roleConfig[u.role] || roleConfig.employee;
                                const isCurrentUser = u.id === currentUser?.id;
                                const hasSession = u.session?.hasRefreshToken && !u.session?.isExpired;
                                return (
                                    <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: isCurrentUser ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
                                        <td style={{ padding: '0.85rem 1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                                    {u.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, color: '#e2e8f0', fontSize: '0.9rem' }}>{u.name}</div>
                                                    {isCurrentUser && <div style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>← you</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.85rem 1.25rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{u.email}</td>
                                        <td style={{ padding: '0.85rem 1.25rem' }}>
                                            <span className={rc.cls} style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontWeight: 600 }}>
                                                {rc.icon} {u.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.85rem 1.25rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{u.provider || 'local'}</td>
                                        <td style={{ padding: '0.85rem 1.25rem' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: hasSession ? '#34d399' : '#94a3b8' }}>
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: hasSession ? '#34d399' : '#94a3b8', boxShadow: hasSession ? '0 0 6px #34d399' : 'none' }} />
                                                {hasSession ? 'Active' : 'No session'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.85rem 1.25rem' }}>
                                            <button
                                                id={`revoke-${u.id}`}
                                                className="btn-danger"
                                                disabled={isCurrentUser || revoking === u.id || !hasSession}
                                                onClick={() => handleRevoke(u.id, u.name)}
                                                title={isCurrentUser ? 'Cannot revoke your own session here' : !hasSession ? 'No active session' : `Force logout ${u.name}`}
                                            >
                                                {revoking === u.id ? '...' : '⊗ Revoke'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <HowItWorks
                title="How token revocation works"
                mechanism="Server-Side Session + JWT"
                steps={[
                    'JWTs are stateless — you cannot "un-sign" them. A valid JWT will work until it expires.',
                    'The solution: store refresh tokens server-side. When revoked, the refresh token is deleted from the Map.',
                    'The user\'s current access token (up to 15m) remains valid until it expires naturally.',
                    'On their next access token request (refresh), the server rejects it → they get logged out.',
                    'Revoking a token also deletes the user\'s SSO session, logging them out of all "apps".',
                ]}
            />
        </div>
    );
}
