import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Platform } from 'react-native';
import base64 from 'react-native-base64';

// Cross-platform alert helper
const showAlert = (title: string, message?: string) => {
    if (Platform.OS === 'web') {
        window.alert(message ? `${title}\n${message}` : title);
    } else {
        Alert.alert(title, message);
    }
};

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
const USER_KEY = 'user_data';

let AUTH_SERVICE_URL = process.env.EXPO_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:9011';
let API_SERVICE_URL = process.env.EXPO_PUBLIC_API_SERVICE_URL || 'http://localhost:9010';
let CLIENT_ID = process.env.CLIENT_ID || 'dev';
let CLIENT_PW = process.env.CLIENT_PW || 'secret';

// Storage wrapper that uses SecureStore on native and AsyncStorage on web
const storage = {
    async getItem(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return await AsyncStorage.getItem(key);
        }
        return await SecureStore.getItemAsync(key);
    },
    async setItem(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            await AsyncStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },
    async deleteItem(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            await AsyncStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
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
            const storedUser = await storage.getItem(USER_KEY);

            if (storedToken && storedUser) {
                try {
                    // Validate token by fetching user profile
                    const validatedUser = await fetchUserProfile(storedToken);

                    if (validatedUser) {
                        // Token is still valid
                        setToken(storedToken);
                        setUser(validatedUser);
                        // Update stored user data with fresh data
                        await storage.setItem(USER_KEY, JSON.stringify(validatedUser));
                    } else {
                        // Token is invalid or expired - clear stored auth
                        console.log('Stored token is invalid or expired, logging out');
                        await storage.deleteItem(TOKEN_KEY);
                        await storage.deleteItem(USER_KEY);
                    }
                } catch (validationError) {
                    // Network error - keep the stored session (user might be offline)
                    if (validationError instanceof Error && validationError.message === 'NETWORK_ERROR') {
                        console.log('Offline mode: using stored auth data');
                        setToken(storedToken);
                        setUser(JSON.parse(storedUser));
                    } else {
                        throw validationError;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading stored auth:', error);
            // On error, clear potentially corrupted auth data
            try {
                await storage.deleteItem(TOKEN_KEY);
                await storage.deleteItem(USER_KEY);
            } catch (clearError) {
                console.error('Error clearing auth data:', clearError);
            }
        } finally {
            setIsLoading(false);
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

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true);

            const params = new URLSearchParams();
            params.append('grant_type', 'password');
            params.append('username', username);
            params.append('password', password);
            params.append('scope', 'user');
            
            const authHeader = encodeBasicAuth(`${CLIENT_ID}`, `${CLIENT_PW}`);
            const response = await axios.post(`${AUTH_SERVICE_URL}/oauth2/token`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authHeader
                }
            });

            const accessToken = response.data.access_token || response.data.token;
            if (!accessToken) {
                throw new Error('No access token in response');
            }

            // Store token
            await storage.setItem(TOKEN_KEY, accessToken);

            // Fetch user profile details
            const userProfile = await fetchUserProfile(accessToken);
            if (!userProfile) {
                throw new Error('Failed to fetch user profile');
            }

            // Store user data
            await storage.setItem(USER_KEY, JSON.stringify(userProfile));

            // Batch state updates to reduce re-renders
            setToken(accessToken);
            setUser(userProfile);
            setIsLoading(false);

            return true;
        } catch (error) {
            console.error('Login error:', error);
            if (axios.isAxiosError(error) && error.response) {
                showAlert('Login Failed', error.response.data?.message || error.message);
            } else {
                showAlert('Login Failed', 'An unexpected error occurred');
            }
            return false;
        } finally {
            setIsLoading((current) => current ? false : current);
        }
    };

    const register = async (username: string, email: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true);

            const response = await axios.post(`${API_SERVICE_URL}/api/v1/users/register`, {
                username,
                email,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // After successful registration, automatically log in the user
            if (response.status === 200 || response.status === 201) {
                const loginSuccess = await login(email, password);
                return loginSuccess;
            }

            return true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                showAlert('Registration Failed', error.response.data?.message || error.message);
            } else {
                showAlert('Registration Failed', 'An unexpected error occurred');
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
            await storage.deleteItem(TOKEN_KEY);
            await storage.deleteItem(USER_KEY);

            setToken(null);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const encodeBasicAuth = (clientId: string, clientSecret: string) => {
        const raw = `${clientId}:${clientSecret}`;
        const encoded = base64.encode(raw);
        return `Basic ${encoded}`;
    }

    const migrateGuestWalk = async (walkData: GuestWalkData): Promise<boolean> => {
        if (!token) {
            console.error('Cannot migrate guest walk: no auth token');
            return false;
        }

        try {
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
                        'Authorization': `Bearer ${token}`,
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
                            'Authorization': `Bearer ${token}`,
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
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (stopResponse.status !== 200 && stopResponse.status !== 201) {
                console.warn('Failed to stop walk properly, but walk was created');
            }

            console.log('Guest walk migrated successfully:', walkId);
            return true;
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
