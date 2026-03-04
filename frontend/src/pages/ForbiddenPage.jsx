// ============================================================
// pages/ForbiddenPage.jsx — Custom 403 page
// ============================================================
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const roleMessages = {
    admin: { icon: '🛡️', needed: 'admin', color: '#fca5a5', badge: 'badge-admin' },
    manager: { icon: '👔', needed: 'manager or admin', color: '#fde047', badge: 'badge-manager' },
    employee: { icon: '👤', needed: 'any authenticated user', color: '#93c5fd', badge: 'badge-employee' },
};

export default function ForbiddenPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const requiredRoles = location.state?.requiredRoles || ['admin'];
    const primaryRequired = requiredRoles[0];
    const rm = roleMessages[primaryRequired] || roleMessages.admin;
    const userRole = user?.role || 'employee';
    const userRm = roleMessages[userRole] || roleMessages.employee;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--color-surface)' }}>
            <div style={{ textAlign: 'center', maxWidth: 540, animation: 'fadeIn 0.4s ease' }}>
                {/* Big 403 */}
                <div style={{ fontSize: '5rem', lineHeight: 1, fontWeight: 900, background: 'linear-gradient(135deg, #f87171, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
                    403
                </div>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🚫</div>
                <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.6rem', fontWeight: 700, color: '#e2e8f0' }}>Access Forbidden</h1>
                <p style={{ margin: '0 0 2rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                    You don't have permission to view this page. This content is restricted to users with a higher role.
                </p>

                {/* Role comparison */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: '0.75rem', minWidth: 160 }}>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Your Role</div>
                        <span className={userRm.badge} style={{ fontSize: '0.9rem', padding: '0.3rem 0.8rem', borderRadius: '9999px', fontWeight: 700 }}>
                            {userRm.icon} {userRole}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '1.2rem' }}>✗</div>
                    <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: '0.75rem', minWidth: 160 }}>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Required</div>
                        <span className={rm.badge} style={{ fontSize: '0.9rem', padding: '0.3rem 0.8rem', borderRadius: '9999px', fontWeight: 700 }}>
                            {rm.icon} {rm.needed}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(-1)} className="btn-secondary" style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>← Go Back</button>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>Go to Dashboard</button>
                </div>
            </div>
        </div>
    );
}
