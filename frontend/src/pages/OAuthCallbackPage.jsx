// ============================================================
// pages/OAuthCallbackPage.jsx
// ============================================================
// Handles the OAuth redirect from the backend.
// The backend redirects to: /oauth/callback#token=...&expires=...
// We extract the token from the URL fragment (never logged by server).

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api/axios.js';

export default function OAuthCallbackPage() {
    const { setOAuthTokens } = useAuth();
    const navigate = useNavigate();
    const done = useRef(false);

    useEffect(() => {
        if (done.current) return;
        done.current = true;

        const fragment = window.location.hash.substring(1);
        const params = new URLSearchParams(fragment);
        const token = params.get('token');
        const expiresAt = parseInt(params.get('expires'));

        if (!token) {
            navigate('/login?error=oauth_failed', { replace: true });
            return;
        }

        // Fetch user info with the new token, then set auth state
        api.get('/api/user/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(({ data }) => {
                setOAuthTokens(token, expiresAt, data.user);
                navigate('/dashboard', { replace: true });
            })
            .catch(() => navigate('/login?error=oauth_failed', { replace: true }));
    }, []); // eslint-disable-line

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>Completing sign-in...</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Exchanging Google authorization code</p>
            </div>
        </div>
    );
}
