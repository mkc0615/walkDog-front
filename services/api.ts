import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// TODO: Replace with your actual API service URL
const API_BASE_URL = 'http://your-api-service.com/api';

const TOKEN_KEY = 'auth_token';

// Storage wrapper that uses SecureStore on native and AsyncStorage on web
const storage = {
    async getItem(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return await AsyncStorage.getItem(key);
        }
        return await SecureStore.getItemAsync(key);
    },
    async deleteItem(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            await AsyncStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    },
};

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach JWT token to every request
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await storage.getItem(TOKEN_KEY);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error retrieving token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle token expiration and errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized (token expired or invalid)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // TODO: Implement token refresh logic here if you have refresh tokens
            // For now, just clear the stored token and redirect to login
            try {
                await storage.deleteItem(TOKEN_KEY);
                await storage.deleteItem('user_data');
                // You might want to emit an event or use navigation here to redirect to login
            } catch (e) {
                console.error('Error clearing auth data:', e);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
