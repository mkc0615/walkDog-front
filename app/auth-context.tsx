import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from 'react-native';
import { enforceHttps, validateSecureUrl, isProduction } from './utils/api-client';

type User = {
    userId?: number;
    username: string;
    email: string;
    phone?: string;
    createdAt?: string;
}

interface GuestWalkData {
    id: string;
    startedAt: string;
    endedAt?: string;
    duration: number;
    distance: number;
    routeCoordinates: Array<{
        latitude: number;
        longitude: number;
        timestamp: number;
        accuracy?: number;
    }>;
    title?: string;
    notes?: string;
    startLatitude: number;
    startLongitude: number;
}

type AuthContextType = {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    migrateGuestWalk: (walkData: GuestWalkData) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

// Enforce HTTPS in production
const API_SERVICE_URL = enforceHttps(process.env.EXPO_PUBLIC_API_SERVICE_URL || 'http://localhost:9010');

// Validate URL on module load
if (isProduction) {
    validateSecureUrl(API_SERVICE_URL);
}

// Token refresh buffer - refresh 5 minutes before expiration
const TOKEN_REFRESH_BUFFER_SECONDS = 5 * 60;

// JWT utility functions
interface JWTPayload {
    exp?: number;
    iat?: number;
    sub?: string;
    [key: string]: unknown;
}

/**
 * Decode JWT token payload without verification (for client-side expiration check)
 * Note: This does NOT verify the signature - that's the server's job
 */
function decodeJWT(token: string): JWTPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        // Decode base64url to base64, then decode
        const payload = parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        // Add padding if needed
        const padded = payload + '='.repeat((4 - payload.length % 4) % 4);

        // Decode base64 to string
        const decoded = atob(padded);

        return JSON.parse(decoded) as JWTPayload;
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
}

/**
 * Check if a token is expired or will expire within the buffer period
 */
function isTokenExpiredOrExpiring(token: string, bufferSeconds: number = TOKEN_REFRESH_BUFFER_SECONDS): boolean {
    const payload = decodeJWT(token);

    if (!payload || !payload.exp) {
        // If we can't decode or no exp claim, assume it might be expired
        return true;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = payload.exp;

    // Token is expired or will expire within buffer period
    return now >= (expiresAt - bufferSeconds);
}

/**
 * Get seconds until token expires (negative if already expired)
 */
function getTokenTimeRemaining(token: string): number | null {
    const payload = decodeJWT(token);

    if (!payload || !payload.exp) {
        return null;
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp - now;
}

// Secure storage using SecureStore (native only - no web support)
const storage = {
    async getItem(key: string): Promise<string | null> {
        return await SecureStore.getItemAsync(key);
    },
    async setItem(key: string, value: string): Promise<void> {
        await SecureStore.setItemAsync(key, value);
    },
    async deleteItem(key: string): Promise<void> {
        await SecureStore.deleteItemAsync(key);
    },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load token and user from SecureStore on app start
    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const storedToken = await storage.getItem(TOKEN_KEY);
            const storedRefreshToken = await storage.getItem(REFRESH_TOKEN_KEY);
            const storedUser = await storage.getItem(USER_KEY);

            if (storedToken && storedUser) {
                // Check token expiration locally first (more efficient)
                const timeRemaining = getTokenTimeRemaining(storedToken);

                if (timeRemaining !== null) {
                    console.log(`Token time remaining: ${timeRemaining}s`);
                }

                // If token is not expired (with buffer), use it directly
                if (timeRemaining !== null && timeRemaining > TOKEN_REFRESH_BUFFER_SECONDS) {
                    console.log('Token still valid, using stored auth');
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));

                    // Optionally validate with server in background (non-blocking)
                    fetchUserProfile(storedToken).then(async (validatedUser) => {
                        if (validatedUser) {
                            await storage.setItem(USER_KEY, JSON.stringify(validatedUser));
                            setUser(validatedUser);
                        }
                    }).catch(() => {
                        // Ignore background validation errors
                    });

                    return;
                }

                // Token expired or expiring soon - try to refresh
                if (storedRefreshToken) {
                    console.log('Token expired or expiring, attempting to refresh...');

                    try {
                        const newTokens = await refreshAccessToken(storedRefreshToken);

                        if (newTokens) {
                            // Refresh successful, validate new token
                            const validatedUser = await fetchUserProfile(newTokens.accessToken);

                            if (validatedUser) {
                                // Store new tokens
                                await storage.setItem(TOKEN_KEY, newTokens.accessToken);
                                await storage.setItem(REFRESH_TOKEN_KEY, newTokens.refreshToken);
                                await storage.setItem(USER_KEY, JSON.stringify(validatedUser));

                                setToken(newTokens.accessToken);
                                setUser(validatedUser);
                                console.log('Token refreshed successfully on startup');
                                return;
                            }
                        }

                        // Refresh failed or new token invalid
                        console.log('Token refresh failed, clearing auth');
                        await clearStoredAuth();
                    } catch (refreshError) {
                        // Network error during refresh - use stored data if token not fully expired
                        if (refreshError instanceof Error && refreshError.message === 'NETWORK_ERROR') {
                            if (timeRemaining !== null && timeRemaining > 0) {
                                console.log('Offline mode: using stored auth (token not fully expired)');
                                setToken(storedToken);
                                setUser(JSON.parse(storedUser));
                                return;
                            }
                        }
                        throw refreshError;
                    }
                } else {
                    // No refresh token - try to validate current token
                    try {
                        const validatedUser = await fetchUserProfile(storedToken);

                        if (validatedUser) {
                            setToken(storedToken);
                            setUser(validatedUser);
                            await storage.setItem(USER_KEY, JSON.stringify(validatedUser));
                        } else {
                            console.log('Token invalid and no refresh token available');
                            await clearStoredAuth();
                        }
                    } catch (validationError) {
                        if (validationError instanceof Error && validationError.message === 'NETWORK_ERROR') {
                            // Offline - use stored data even if might be expired
                            console.log('Offline mode: using stored auth data');
                            setToken(storedToken);
                            setUser(JSON.parse(storedUser));
                        } else {
                            throw validationError;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading stored auth:', error);
            // On error, clear potentially corrupted auth data
            await clearStoredAuth();
        } finally {
            setIsLoading(false);
        }
    };

    const clearStoredAuth = async () => {
        try {
            await storage.deleteItem(TOKEN_KEY);
            await storage.deleteItem(REFRESH_TOKEN_KEY);
            await storage.deleteItem(USER_KEY);
        } catch (clearError) {
            console.error('Error clearing auth data:', clearError);
        }
    };

    // Helper to make authenticated API calls with automatic token refresh
    const authenticatedRequest = async <T,>(
        requestFn: (accessToken: string) => Promise<T>
    ): Promise<T> => {
        if (!token) {
            throw new Error('Not authenticated');
        }

        let currentToken = token;

        // Proactively check if token is expired or about to expire
        if (isTokenExpiredOrExpiring(currentToken)) {
            const timeRemaining = getTokenTimeRemaining(currentToken);
            console.log(`Token expiring soon (${timeRemaining}s remaining), proactively refreshing...`);

            const storedRefreshToken = await storage.getItem(REFRESH_TOKEN_KEY);

            if (storedRefreshToken) {
                const newTokens = await refreshAccessToken(storedRefreshToken);

                if (newTokens) {
                    // Store new tokens
                    await storage.setItem(TOKEN_KEY, newTokens.accessToken);
                    await storage.setItem(REFRESH_TOKEN_KEY, newTokens.refreshToken);
                    setToken(newTokens.accessToken);
                    currentToken = newTokens.accessToken;
                    console.log('Token proactively refreshed successfully');
                } else {
                    // Refresh failed, but token might still work - try anyway
                    console.log('Proactive refresh failed, trying with current token');
                }
            }
        }

        try {
            return await requestFn(currentToken);
        } catch (error) {
            // Check if it's a 401 error and we have a refresh token (fallback)
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                const storedRefreshToken = await storage.getItem(REFRESH_TOKEN_KEY);

                if (storedRefreshToken) {
                    console.log('Access token rejected (401), attempting refresh...');
                    const newTokens = await refreshAccessToken(storedRefreshToken);

                    if (newTokens) {
                        // Store new tokens
                        await storage.setItem(TOKEN_KEY, newTokens.accessToken);
                        await storage.setItem(REFRESH_TOKEN_KEY, newTokens.refreshToken);
                        setToken(newTokens.accessToken);

                        // Retry the request with new token
                        return await requestFn(newTokens.accessToken);
                    } else {
                        // Refresh failed, logout user
                        console.log('Token refresh failed, logging out');
                        await clearStoredAuth();
                        setToken(null);
                        setUser(null);
                    }
                }
            }
            throw error;
        }
    };

    const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> => {
        try {
            const response = await axios.post(
                `${API_SERVICE_URL}/api/v1/auth/refresh`,
                { refresh_token: refreshToken },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                }
            );

            const newAccessToken = response.data.access_token || response.data.token;
            const newRefreshToken = response.data.refresh_token || refreshToken; // Use old refresh token if not rotated

            if (!newAccessToken) {
                return null;
            }

            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // 401/403 means refresh token is invalid or expired
                if (error.response?.status === 401 || error.response?.status === 403) {
                    console.log('Refresh token is invalid or expired');
                    return null;
                }
                // Network error
                if (!error.response) {
                    throw new Error('NETWORK_ERROR');
                }
            }
            console.error('Error refreshing token:', error);
            return null;
        }
    };

    const fetchUserProfile = async (accessToken: string): Promise<User | null> => {
        try {
            const response = await axios.get(`${API_SERVICE_URL}/api/v1/users/me`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                timeout: 10000, // 10 second timeout
            });

            if (response.status === 200 && response.data) {
                return response.data as User;
            }
            return null;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // 401/403 means token is invalid or expired
                if (error.response?.status === 401 || error.response?.status === 403) {
                    console.log('Token is invalid or expired (401/403)');
                    return null;
                }
                // Network error - could be offline, don't invalidate token
                if (!error.response) {
                    console.log('Network error while validating token, keeping session');
                    // Return a special marker to indicate network error
                    throw new Error('NETWORK_ERROR');
                }
            }
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true);

            // Login through API server (backend handles OAuth client credentials securely)
            const response = await axios.post(
                `${API_SERVICE_URL}/api/v1/auth/login`,
                { email, password },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 15000,
                }
            );

            const accessToken = response.data.access_token || response.data.token;
            const refreshToken = response.data.refresh_token;

            if (!accessToken) {
                throw new Error('No access token in response');
            }

            // Store tokens securely
            await storage.setItem(TOKEN_KEY, accessToken);
            if (refreshToken) {
                await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
            }

            // Fetch user profile details
            const userProfile = await fetchUserProfile(accessToken);
            if (!userProfile) {
                throw new Error('Failed to fetch user profile');
            }

            // Store user data
            await storage.setItem(USER_KEY, JSON.stringify(userProfile));

            // Update state
            setToken(accessToken);
            setUser(userProfile);
            setIsLoading(false);

            return true;
        } catch (error) {
            console.error('Login error:', error);
            if (axios.isAxiosError(error) && error.response) {
                const message = error.response.data?.message || error.response.data?.error || 'Invalid credentials';
                Alert.alert('Login Failed', message);
            } else if (axios.isAxiosError(error) && !error.response) {
                Alert.alert('Connection Error', 'Unable to connect to server. Please check your internet connection.');
            } else {
                Alert.alert('Login Failed', 'An unexpected error occurred');
            }
            return false;
        } finally {
            setIsLoading((current) => current ? false : current);
        }
    };

    const register = async (username: string, email: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true);

            const response = await axios.post(
                `${API_SERVICE_URL}/api/v1/auth/register`,
                { username, email, password },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 15000,
                }
            );

            // After successful registration, automatically log in the user
            if (response.status === 200 || response.status === 201) {
                const loginSuccess = await login(email, password);
                return loginSuccess;
            }

            return true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const message = error.response.data?.message || error.response.data?.error || 'Registration failed';
                Alert.alert('Registration Failed', message);
            } else if (axios.isAxiosError(error) && !error.response) {
                Alert.alert('Connection Error', 'Unable to connect to server. Please check your internet connection.');
            } else {
                Alert.alert('Registration Failed', 'An unexpected error occurred');
            }
            return false;
        } finally {
            setIsLoading((current) => current ? false : current);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);

            // Clear stored credentials
            await clearStoredAuth();

            setToken(null);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const migrateGuestWalk = async (walkData: GuestWalkData): Promise<boolean> => {
        if (!token) {
            console.error('Cannot migrate guest walk: no auth token');
            return false;
        }

        try {
            return await authenticatedRequest(async (accessToken) => {
                // Step 1: Create the walk
                const createResponse = await axios.post(
                    `${API_SERVICE_URL}/api/v1/walks`,
                    {
                        title: walkData.title || 'Guest Walk',
                        description: walkData.notes || '',
                        dogIds: [], // Guest walks don't have dogs
                        startLatitude: walkData.startLatitude,
                        startLongitude: walkData.startLongitude,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    }
                );

                if (createResponse.status !== 200 && createResponse.status !== 201) {
                    throw new Error('Failed to create walk');
                }

                const walkId = createResponse.data.walkId;

                // Step 2: Send all coordinates in batches
                if (walkData.routeCoordinates.length > 0) {
                    const trackResponse = await axios.post(
                        `${API_SERVICE_URL}/api/v1/walks/${walkId}/track`,
                        {
                            coordinates: walkData.routeCoordinates,
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${accessToken}`,
                            },
                        }
                    );

                    if (trackResponse.status !== 200 && trackResponse.status !== 201) {
                        console.warn('Failed to send coordinates, but walk was created');
                    }
                }

                // Step 3: Stop the walk with final stats
                const stopResponse = await axios.post(
                    `${API_SERVICE_URL}/api/v1/walks/${walkId}/stop`,
                    {
                        dogIds: [],
                        duration: walkData.duration,
                        distance: walkData.distance,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    }
                );

                if (stopResponse.status !== 200 && stopResponse.status !== 201) {
                    console.warn('Failed to stop walk properly, but walk was created');
                }

                console.log('Guest walk migrated successfully:', walkId);
                return true;
            });
        } catch (error) {
            console.error('Error migrating guest walk:', error);
            if (axios.isAxiosError(error) && error.response) {
                console.error('Migration error details:', error.response.data);
            }
            return false;
        }
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
        migrateGuestWalk,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
