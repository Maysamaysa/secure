// ============================================================
// App.jsx — React Router setup with all routes
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

import LoginPage from './pages/LoginPage.jsx';
import OAuthCallbackPage from './pages/OAuthCallbackPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ManagerPage from './pages/ManagerPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ForbiddenPage from './pages/ForbiddenPage.jsx';
import SSOAppPage from './pages/SSOAppPage.jsx';

function Layout({ children, showNav = true }) {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-surface)' }}>
            {showNav && <Navbar />}
            {children}
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Layout showNav={false}><LoginPage /></Layout>} />
                    <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                    <Route path="/forbidden" element={<Layout><ForbiddenPage /></Layout>} />

                    {/* Protected routes */}
                    <Route path="/dashboard" element={
                        <Layout>
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        </Layout>
                    } />

                    <Route path="/manager" element={
                        <Layout>
                            <ProtectedRoute requiredRoles={['manager', 'admin']}>
                                <ManagerPage />
                            </ProtectedRoute>
                        </Layout>
                    } />

                    <Route path="/admin" element={
                        <Layout>
                            <ProtectedRoute requiredRoles={['admin']}>
                                <AdminPage />
                            </ProtectedRoute>
                        </Layout>
                    } />

                    {/* SSO Demo — accessible to all, handles its own auth state */}
                    <Route path="/sso-app" element={<Layout><SSOAppPage /></Layout>} />

                    {/* Redirects */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
