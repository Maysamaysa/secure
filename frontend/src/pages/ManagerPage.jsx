// ============================================================
// pages/ManagerPage.jsx — Team Overview (manager + admin only)
// ============================================================
import { useState, useEffect } from 'react';
import { api } from '../api/axios.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { HowItWorks } from '../components/HowItWorks.jsx';

const statusColors = { active: '#34d399', inactive: '#94a3b8' };

export default function ManagerPage() {
    const { user } = useAuth();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        api.get('/api/manager/team')
            .then(({ data }) => { setTeam(data.team); setLoading(false); })
            .catch((err) => { setError(err.response?.data?.message || 'Failed to load team'); setLoading(false); });
    }, []);

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem' }} className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>👔</span>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#e2e8f0' }}>Team Overview</h1>
                    <span className="badge-manager" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 600 }}>manager+</span>
                </div>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)' }}>Viewing as: <strong style={{ color: '#fde047' }}>{user?.name}</strong></p>
            </div>

            {loading && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ width: 20, height: 20, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Loading team data...
                </div>
            )}

            {error && (
                <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', color: '#fca5a5' }}>⚠️ {error}</div>
            )}

            {!loading && !error && (
                <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                {['Name', 'Email', 'Department', 'Join Date', 'Status', ''].map((h) => (
                                    <th key={h} style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {team.map((member, i) => (
                                <tr key={member.id} style={{ borderBottom: i < team.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.15s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '0.85rem 1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                                {member.name.charAt(0)}
                                            </div>
                                            <span style={{ fontWeight: 500, color: '#e2e8f0', fontSize: '0.9rem' }}>{member.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{member.email}</td>
                                    <td style={{ padding: '0.85rem 1.25rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{member.department}</td>
                                    <td style={{ padding: '0.85rem 1.25rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{new Date(member.joinDate).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.85rem 1.25rem' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: statusColors[member.status] }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[member.status] }} />
                                            {member.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem' }}>
                                        <button
                                            onClick={() => setSelected(selected?.id === member.id ? null : member)}
                                            style={{ padding: '0.3rem 0.65rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '0.35rem', color: '#a5b4fc', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selected && (
                <div className="glass-strong" style={{ marginTop: '1rem', padding: '1.25rem', borderRadius: '0.75rem', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0, color: '#e2e8f0', fontWeight: 700 }}>Record: {selected.name}</h3>
                        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                    </div>
                    <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
                        {JSON.stringify(selected, null, 2)}
                    </pre>
                </div>
            )}

            <HowItWorks
                title="How role-based access protects this route"
                mechanism="RBAC Middleware"
                steps={[
                    'The frontend ProtectedRoute component checks your role before rendering this page.',
                    'Navigate to /manager as an employee — you get redirected to /forbidden.',
                    'On the API side, GET /api/manager/team uses requireRole("manager", "admin") middleware.',
                    'The middleware reads req.user.role (set by the JWT middleware) and compares against allowed roles.',
                    'Employees calling the API directly also receive a 403 Forbidden JSON response.',
                ]}
            />
        </div>
    );
}
