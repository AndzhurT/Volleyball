export interface AuthUser {
    id: string;
    username: string;
    role: 'user' | 'admin';
    emailVerified?: boolean;
}

export interface GameActionRequest {
    _id: string;
    action: 'create' | 'update';
    game: string | null;
    proposedGame: {
        title: string;
        date: string;
        time: string;
        location: string;
        description?: string;
        skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
        totalSpots: number;
        type: 'casual' | 'competitive';
        courtType: 'indoor' | 'outdoor' | 'beach';
    };
    status: 'pending' | 'processing' | 'approved' | 'declined';
    reviewNote?: string;
    createdAt: string;
    reviewedAt?: string | null;
}

export interface GameActionRequestInput {
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
    totalSpots: number;
    type: 'casual' | 'competitive';
    courtType: 'indoor' | 'outdoor' | 'beach';
}

export interface UserProfile {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    bio: string;
    location: string;
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
    positions: string[];
    gamesPlayed: number;
    rating: number;
    reviews: [];
    gamesAttended: [];
    followers: [];
    following: [];
    achievements: [];
    stats: {
        winRate: number;
        hoursPlayed: number;
        favoritePosition: string;
        memberSince: string;
    };
}

export interface UserProfileInput {
    displayName: string;
    avatar: string;
    bio: string;
    location: string;
    skillLevel: UserProfile['skillLevel'];
    positions: string[];
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
let inMemoryAuthToken: string | null = null;

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

export function createGameActionRequest(
    token: string,
    game: GameActionRequestInput,
    options: { action?: 'create' | 'update'; gameId?: string } = {},
) {
    return request<GameActionRequest>(
        '/api/action-requests',
        {
            method: 'POST',
            body: JSON.stringify({ action: options.action || 'create', gameId: options.gameId, game }),
        },
        token,
    );
}

export function getMyGameActionRequests(token: string) {
    return request<{ data: GameActionRequest[] }>('/api/action-requests/mine', { method: 'GET' }, token);
}

export function updateMyGameActionRequest(token: string, requestId: string, game: GameActionRequestInput) {
    return request<GameActionRequest>(
        `/api/action-requests/${encodeURIComponent(requestId)}`,
        {
            method: 'PUT',
            body: JSON.stringify({ game }),
        },
        token,
    );
}

export function deleteMyGameActionRequest(token: string, requestId: string) {
    return request<{ message: string }>(
        `/api/action-requests/${encodeURIComponent(requestId)}`,
        {
            method: 'DELETE',
        },
        token,
    );
}

export function getProfiles() {
    return request<{ data: UserProfile[] }>('/api/profiles', { method: 'GET' });
}

export function getProfile(userId: string) {
    return request<{ profile: UserProfile }>(`/api/profiles/${encodeURIComponent(userId)}`, { method: 'GET' });
}

export function updateMyProfile(token: string, profile: UserProfileInput) {
    return request<{ profile: UserProfile }>(
        '/api/profiles/me',
        {
            method: 'PUT',
            body: JSON.stringify(profile),
        },
        token,
    );
}

export function storeAuthToken(token: string, rememberMe: boolean) {
    sessionStorage.removeItem('volleyconnect.authToken');

    if (rememberMe) {
        inMemoryAuthToken = null;
        localStorage.setItem('volleyconnect.authToken', token);
        return;
    }

    localStorage.removeItem('volleyconnect.authToken');
    inMemoryAuthToken = token;
}

export function getStoredAuthToken() {
    return localStorage.getItem('volleyconnect.authToken') || inMemoryAuthToken;
}

export function clearStoredAuthToken() {
    localStorage.removeItem('volleyconnect.authToken');
    sessionStorage.removeItem('volleyconnect.authToken');
    inMemoryAuthToken = null;
}
