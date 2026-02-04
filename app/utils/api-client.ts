import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_SERVICE_URL = process.env.EXPO_PUBLIC_API_SERVICE_URL || 'http://localhost:9010';

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production' || !__DEV__;

/**
 * Validate that a URL uses HTTPS in production
 * Allows HTTP for localhost (dev/testing)
 */
function validateSecureUrl(url: string): void {
    // Allow localhost HTTP in any environment (for testing)
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('10.0.2.2');
    if (isLocalhost) {
        if (isProduction) {
            console.warn('Warning: Using HTTP localhost URL. This will not work on a physical device.');
        }
        return;
    }

    // In production, require HTTPS for all non-localhost URLs
    if (isProduction && !url.startsWith('https://')) {
        throw new Error(`Security Error: API URL must use HTTPS in production. Got: ${url}`);
    }
}

/**
 * Upgrade HTTP to HTTPS in production (if not localhost)
 */
function enforceHttps(url: string): string {
    if (!isProduction) {
        return url;
    }

    // Don't upgrade localhost URLs
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('10.0.2.2');
    if (isLocalhost) {
        console.warn('Warning: Using HTTP localhost URL in production build');
        return url;
    }

    // Upgrade HTTP to HTTPS
    if (url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }

    return url;
}

/**
 * Create a secure axios instance with proper configurations
 */
function createSecureApiClient(): AxiosInstance {
    const baseURL = enforceHttps(API_SERVICE_URL);

    // Validate the base URL
    validateSecureUrl(baseURL);

    const client = axios.create({
        baseURL,
        timeout: 30000, // 30 second default timeout
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor - validate URLs and add security headers
    client.interceptors.request.use(
        (config) => {
            // Validate full URL if provided
            if (config.url && config.url.startsWith('http')) {
                const secureUrl = enforceHttps(config.url);
                validateSecureUrl(secureUrl);
                config.url = secureUrl;
            }

            // Log requests in development
            if (!isProduction) {
                console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
            }

            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor - handle common errors
    client.interceptors.response.use(
        (response) => response,
        (error) => {
            // Log errors in development
            if (!isProduction && axios.isAxiosError(error)) {
                console.error(`[API Error] ${error.response?.status || 'Network'}: ${error.message}`);
            }

            // Handle SSL/TLS errors
            if (axios.isAxiosError(error) && error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
                console.error('SSL Certificate verification failed!');
                // In production, this is a security issue
                if (isProduction) {
                    throw new Error('Security Error: SSL certificate verification failed');
                }
            }

            return Promise.reject(error);
        }
    );

    return client;
}

// Export singleton instance
export const apiClient = createSecureApiClient();

// Export helper for creating authenticated requests
export function createAuthHeaders(token: string): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

// Export utilities
export { validateSecureUrl, enforceHttps, isProduction };
