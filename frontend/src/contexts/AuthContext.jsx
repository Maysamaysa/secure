// ============================================================
// contexts/AuthContext.jsx — Global authentication state
// ============================================================
// Stores the access token in React state (memory), never in localStorage.
// The refresh token lives in an httpOnly cookie managed by the server.
//
// Features:
//   - login()         → POST /api/auth/login, store access token in state
//   - logout()        → POST /api/auth/logout, clear state + cookie on server
//   - refreshToken()  → POST /api/auth/refresh, update access token in state
//   - Auto-refresh    → Sets a timer to refresh 60s before expiry
//   - SSO validate    → On mount, checks for an existing SSO session

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api, setupInterceptors } from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // True while checking SSO session
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const refreshTimerRef = useRef(null);

    // ─── Helpers ───────────────────────────────────────────────

    const clearAuthState = useCallback(() => {
        setUser(null);
        setAccessToken(null);
        setTokenExpiresAt(null);
        setIsAuthenticated(false);
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    }, []);

    const setAuthState = useCallback((token, expiresAt, userData) => {
        setAccessToken(token);
        setTokenExpiresAt(expiresAt);
        setUser(userData);
        setIsAuthenticated(true);
    }, []);

    // ─── Auto-Refresh Timer ────────────────────────────────────
    // Schedules a silent token refresh 60s before expiry

    const scheduleRefresh = useCallback((expiresAt) => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

        const msUntilRefresh = expiresAt - Date.now() - 60_000; // 60s before expiry
        if (msUntilRefresh <= 0) {
            // Already close to expiry, refresh immediately
            doRefresh();
            return;
        }

        refreshTimerRef.current = setTimeout(() => doRefresh(), msUntilRefresh);
    }, []); // eslint-disable-line

    const doRefresh = useCallback(async () => {
        try {
            const { data } = await api.post('/api/auth/refresh');
            setAccessToken(data.accessToken);
            setTokenExpiresAt(data.expiresAt);
            scheduleRefresh(data.expiresAt);
        } catch {
            // Refresh token expired/revoked — clear state and redirect to login
            clearAuthState();
        }
    }, [clearAuthState, scheduleRefresh]);

    // ─── Wire Axios Interceptors ───────────────────────────────

    useEffect(() => {
        setupInterceptors({
            getAccessToken: () => accessToken,
            onRefreshed: (newToken, newExpiresAt) => {
                setAccessToken(newToken);
                setTokenExpiresAt(newExpiresAt);
                scheduleRefresh(newExpiresAt);
            },
            onLogout: () => clearAuthState(),
        });
    }, [accessToken, clearAuthState, scheduleRefresh]);

    // ─── SSO / Refresh Check on Mount ─────────────────────────
    // On app load: check if there's an existing SSO session (via cookie)
    // This enables auto-authentication when visiting the "second app"

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // Try SSO validate first (also works as a refresh if logged in)
                const { data } = await api.get('/api/auth/sso/validate');
                if (!cancelled && data.authenticated) {
                    setAuthState(data.accessToken, data.expiresAt, data.user);
                    scheduleRefresh(data.expiresAt);
                }
            } catch {
                // No valid session — user needs to log in
                if (!cancelled) clearAuthState();
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line

    // ─── Public Auth Functions ─────────────────────────────────

    const login = async (email, password) => {
        const { data } = await api.post('/api/auth/login', { email, password });
        setAuthState(data.accessToken, data.expiresAt, data.user);
        scheduleRefresh(data.expiresAt);
        return data;
    };

    const logout = async () => {
        try { await api.post('/api/auth/logout'); } catch { /* ignore */ }
        clearAuthState();
    };

    // Called by OAuthCallbackPage after extracting token from URL fragment
    const setOAuthTokens = (token, expiresAt, userData) => {
        setAuthState(token, expiresAt, userData);
        scheduleRefresh(expiresAt);
    };

    const value = {
        user,
        accessToken,
        tokenExpiresAt,
        isAuthenticated,
        isLoading,
        login,
        logout,
        setOAuthTokens,
        doRefresh,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
