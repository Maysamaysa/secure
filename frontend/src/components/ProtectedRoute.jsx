// ============================================================
// components/ProtectedRoute.jsx
// ============================================================
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export function ProtectedRoute({ children, requiredRoles }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 1rem' }} />
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Checking session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
        return <Navigate to="/forbidden" state={{ requiredRoles, userRole: user.role }} replace />;
    }

    return children;
}
