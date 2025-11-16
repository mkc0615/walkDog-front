import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Platform } from 'react-native';

type User = {
    email: string;
    name: string;
}

type AuthContextType = {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

const AUTH_SERVICE_URL = process.env.EXPO_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:9011';

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
                console.log("setting token and user !!!");
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error loading stored auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true);

            const params = new URLSearchParams();
            params.append('grant_type', 'password');
            params.append('username', email);
            params.append('password', password);
            params.append('scope', 'user');

            const response = await axios.post(`${AUTH_SERVICE_URL}/oauth2/token`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ZGV2OmRldi1zZWNyZXQ='
                }
            });

            console.log("check results -> ", response.data);

            const accessToken = response.data.access_token || response.data.token;
            if (!accessToken) {
                throw new Error('No access token in response');
            }
            // Store token and user data
            await storage.setItem(TOKEN_KEY, accessToken);

            const userData: User = {
                email: email,
                name: email.split('@')[0]
            }
            await storage.setItem(USER_KEY, JSON.stringify(userData));

            // Batch state updates to reduce re-renders
            setToken(accessToken);
            setUser(userData);
            setIsLoading(false);

            return true;
        } catch (error) {
            console.error('Login error:', error);
            if (axios.isAxiosError(error) && error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                Alert.alert('Login Failed', error.response.data?.message || error.message);
            } else {
                Alert.alert('Login Failed', 'An unexpected error occurred');
            }
            return false;
        } finally {
            // Only set loading false if not already set (on error path)
            setIsLoading((current) => current ? false : current);
        }
    };

    const logout = async () => {
        console.log("logout entered !!!");
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

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    console.log("use auth and authenticated -> " + context.isAuthenticated);

    return context;
}
