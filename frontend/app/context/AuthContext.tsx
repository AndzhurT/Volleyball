import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
    clearStoredAuthToken,
    exchangeOAuthCode,
    getCurrentUser,
    getStoredAuthToken,
    logout as logoutRequest,
    storeAuthToken,
    type AuthUser,
} from '../lib/auth-api';

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    setAuthenticatedUser: (user: AuthUser) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const processedOAuthCode = useRef<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const params = new URLSearchParams(window.location.search);
        const oauthCode = params.get('oauthCode');
        const oauthError = params.get('oauthError');

        if (oauthCode || oauthError) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (oauthCode) {
            if (processedOAuthCode.current === oauthCode) {
                setIsLoading(false);
                return;
            }
            processedOAuthCode.current = oauthCode;

            exchangeOAuthCode(oauthCode)
                .then((response) => {
                    storeAuthToken(response.token, true);
                    setUser(response.user);
                })
                .catch((err) => {
                    console.error('OAuth exchange failed:', err);
                    clearStoredAuthToken();
                })
                .finally(() => {
                    setIsLoading(false);
                });

            return;
        }

        if (oauthError) {
            setIsLoading(false);
            return;
        }

        // Normal token restore path
        const token = getStoredAuthToken();
        if (!token) {
            setIsLoading(false);
            return;
        }

        getCurrentUser(token)
            .then((response) => {
                if (!cancelled) setUser(response.user);
            })
            .catch(() => {
                if (!cancelled) {
                    clearStoredAuthToken();
                    setUser(null);
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const setAuthenticatedUser = (authenticatedUser: AuthUser) => {
        setUser(authenticatedUser);
    };

    const logout = async () => {
        const token = getStoredAuthToken();

        try {
            if (token) await logoutRequest(token);
        } catch {
            // The local session must still be cleared if the API is unavailable.
        } finally {
            clearStoredAuthToken();
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, setAuthenticatedUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
