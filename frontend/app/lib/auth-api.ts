export interface AuthUser {
    id: string;
    username: string;
    role: 'user' | 'admin';
    emailVerified?: boolean;
}

interface AuthResponse {
    token: string;
    user: AuthUser;
}

interface CurrentUserResponse {
    user: AuthUser;
}

interface GenericMessageResponse {
    message: string;
    verificationToken?: string;
    resetToken?: string;
    emailVerified?: boolean;
}

interface ApiErrorResponse {
    message?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, options: RequestInit, token?: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });

    const body = (await response.json().catch(() => null)) as T | ApiErrorResponse | null;

    if (!response.ok) {
        const message =
            body && typeof body === 'object' && 'message' in body && body.message
                ? body.message
                : 'Something went wrong. Please try again.';
        throw new Error(message);
    }

    return body as T;
}

export function login(email: string, password: string) {
    return request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export function getCurrentUser(token: string) {
    return request<CurrentUserResponse>('/api/auth/me', { method: 'GET' }, token);
}

export function logout(token: string) {
    return request<{ message: string }>('/api/auth/logout', { method: 'POST' }, token);
}

export function exchangeOAuthCode(code: string) {
    return request<AuthResponse>('/api/auth/oauth/exchange', {
        method: 'POST',
        body: JSON.stringify({ code }),
    });
}

export function getOAuthUrl(provider: 'google' | 'facebook') {
    return `${API_URL}/api/auth/oauth/${provider}`;
}

export function register(username: string, email: string, password: string) {
    return request<{ message: string; user: { id: string; role: AuthUser['role']; emailVerified?: boolean } }>(
        '/api/auth/register',
        {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        },
    );
}

export function requestEmailVerification(email: string) {
    return request<GenericMessageResponse>('/api/auth/request-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export function verifyEmail(token: string) {
    return request<{ message: string; user: AuthUser }>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
}

export function requestPasswordReset(email: string) {
    return request<GenericMessageResponse>('/api/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export function resetPassword(token: string, password: string) {
    return request<{ message: string; user?: AuthUser }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
    });
}

export function storeAuthToken(token: string, rememberMe: boolean) {
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem('volleyconnect.authToken');
    storage.setItem('volleyconnect.authToken', token);
}

export function getStoredAuthToken() {
    return localStorage.getItem('volleyconnect.authToken') || sessionStorage.getItem('volleyconnect.authToken');
}

export function clearStoredAuthToken() {
    localStorage.removeItem('volleyconnect.authToken');
    sessionStorage.removeItem('volleyconnect.authToken');
}
