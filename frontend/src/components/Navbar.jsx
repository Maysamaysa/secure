// ============================================================
// components/Navbar.jsx
// ============================================================
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const roleConfig = {
    employee: { label: 'Employee', cls: 'badge-employee' },
    manager: { label: 'Manager', cls: 'badge-manager' },
    admin: { label: 'Admin', cls: 'badge-admin' },
};

const NavLink = ({ to, label }) => {
    const { pathname } = useLocation();
    const active = pathname.startsWith(to);
    return (
        <Link
            to={to}
            style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '0.4rem',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: active ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
            }}
        >
            {label}
        </Link>
    );
};

export function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const role = user?.role || 'employee';
    const rc = roleConfig[role] || roleConfig.employee;

    return (
        <nav style={{
            position: 'sticky', top: 0, zIndex: 50,
            background: 'rgba(15,14,26,0.85)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
        }}>
            <div style={{
                maxWidth: 1200, margin: '0 auto',
                padding: '0 1.5rem',
                display: 'flex', alignItems: 'center', height: 60, gap: '1rem',
            }}>
                {/* Logo */}
                <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: '0.4rem',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem',
                    }}>🔐</div>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>AuthVault</span>
                </Link>

                {/* Nav links */}
                {isAuthenticated && (
                    <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
                        <NavLink to="/dashboard" label="Dashboard" />
                        {(role === 'manager' || role === 'admin') && <NavLink to="/manager" label="Team" />}
                        {role === 'admin' && <NavLink to="/admin" label="Admin" />}
                        <NavLink to="/sso-app" label="SSO Demo" />
                    </div>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isAuthenticated && user ? (
                        <>
                            {/* Avatar */}
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{
                                    width: 30, height: 30, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem', fontWeight: 700, color: 'white',
                                }}>
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Name */}
                            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{user.name}</span>

                            {/* Role badge */}
                            <span className={rc.cls} style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                                {rc.label}
                            </span>

                            <button
                                onClick={handleLogout}
                                style={{
                                    padding: '0.35rem 0.9rem',
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.25)',
                                    borderRadius: '0.4rem',
                                    color: '#fca5a5',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/login" style={{ textDecoration: 'none', color: '#a5b4fc', fontWeight: 600, fontSize: '0.9rem' }}>
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
