export interface AuthUser {
    id: string;
    username: string;
    role: 'user' | 'admin';
}

interface AuthResponse {
    token: string;
    user: AuthUser;
}

interface CurrentUserResponse {
    user: AuthUser;
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

export function register(username: string, email: string, password: string) {
    return request<{ message: string; user: { id: string; role: AuthUser['role'] } }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
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
