// ============================================================
// api/axios.js — Axios instance with JWT interceptors
// ============================================================
// This file sets up:
//   1. A base Axios instance pointing to the backend
//   2. A request interceptor that attaches the access token
//   3. A response interceptor that silently refreshes the token on 401

import axios from 'axios';

const API_BASE = 'http://localhost:3001';

// The shared Axios instance used throughout the app
export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true, // Sends cookies (refresh_token, sso_token) with every request
});

// We store a reference to the auth context's token state here.
// This is a simple alternative to React context in non-component code.
let _getAccessToken = null;
let _onRefreshed = null;
let _onLogout = null;
let _isRefreshing = false;
let _refreshQueue = []; // Queue of failed requests waiting for token refresh

/**
 * Wire up the interceptors with auth context callbacks.
 * Called once in AuthContext when the context initializes.
 */
export function setupInterceptors({ getAccessToken, onRefreshed, onLogout }) {
    _getAccessToken = getAccessToken;
    _onRefreshed = onRefreshed;
    _onLogout = onLogout;
}

// ─── Request Interceptor ───────────────────────────────────
// Attach the in-memory access token to every request
api.interceptors.request.use((config) => {
    const token = _getAccessToken?.();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Response Interceptor ──────────────────────────────────
// On 401 (expired token): call /refresh, then retry the original request
api.interceptors.response.use(
    (response) => response, // Pass through successful responses
    async (error) => {
        const originalRequest = error.config;

        // Only handle 401 errors from the API (not from /auth/refresh itself)
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/api/auth/refresh')
        ) {
            if (_isRefreshing) {
                // Another refresh is in progress — queue this request
                return new Promise((resolve, reject) => {
                    _refreshQueue.push({ resolve, reject });
                }).then((newToken) => {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            _isRefreshing = true;

            try {
                // Call the refresh endpoint — uses the httpOnly cookie automatically
                const { data } = await api.post('/api/auth/refresh');
                const newToken = data.accessToken;

                // Update the token in the auth context
                _onRefreshed?.(newToken, data.expiresAt);

                // Flush the queue of waiting requests
                _refreshQueue.forEach(({ resolve }) => resolve(newToken));
                _refreshQueue = [];

                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh token is also expired/revoked — log the user out
                _refreshQueue.forEach(({ reject }) => reject(refreshError));
                _refreshQueue = [];
                _onLogout?.();
                return Promise.reject(refreshError);
            } finally {
                _isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
