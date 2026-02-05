/**
 * Client-side rate limiting utility
 * Implements exponential backoff after failed attempts
 */

interface RateLimitState {
    failedAttempts: number;
    lastAttemptTime: number;
    lockedUntil: number | null;
}

// Configuration
const CONFIG = {
    // Maximum failed attempts before lockout
    maxFailedAttempts: 5,

    // Base cooldown in milliseconds (doubles with each failed attempt)
    baseCooldownMs: 1000, // 1 second

    // Maximum cooldown in milliseconds
    maxCooldownMs: 60000, // 1 minute

    // Lockout duration after max attempts (in milliseconds)
    lockoutDurationMs: 5 * 60 * 1000, // 5 minutes

    // Time after which failed attempts reset (if no new attempts)
    resetAfterMs: 15 * 60 * 1000, // 15 minutes
};

// Store rate limit state per action type
const rateLimitStates: Map<string, RateLimitState> = new Map();

/**
 * Get or create rate limit state for an action
 */
function getState(action: string): RateLimitState {
    if (!rateLimitStates.has(action)) {
        rateLimitStates.set(action, {
            failedAttempts: 0,
            lastAttemptTime: 0,
            lockedUntil: null,
        });
    }
    return rateLimitStates.get(action)!;
}

/**
 * Calculate cooldown duration based on failed attempts (exponential backoff)
 */
function calculateCooldown(failedAttempts: number): number {
    if (failedAttempts === 0) return 0;

    // Exponential backoff: base * 2^(attempts-1)
    const cooldown = CONFIG.baseCooldownMs * Math.pow(2, failedAttempts - 1);
    return Math.min(cooldown, CONFIG.maxCooldownMs);
}

/**
 * Check if an action is currently rate limited
 * Returns: { allowed: boolean, waitMs: number, message: string }
 */
export function checkRateLimit(action: string): {
    allowed: boolean;
    waitMs: number;
    message: string;
} {
    const state = getState(action);
    const now = Date.now();

    // Check if attempts should be reset (no activity for resetAfterMs)
    if (state.lastAttemptTime > 0 && now - state.lastAttemptTime > CONFIG.resetAfterMs) {
        resetRateLimit(action);
        return { allowed: true, waitMs: 0, message: '' };
    }

    // Check if currently locked out
    if (state.lockedUntil && now < state.lockedUntil) {
        const waitMs = state.lockedUntil - now;
        const waitSeconds = Math.ceil(waitMs / 1000);
        return {
            allowed: false,
            waitMs,
            message: `Too many failed attempts. Please wait ${formatWaitTime(waitMs)} before trying again.`,
        };
    }

    // Check cooldown from last failed attempt
    if (state.failedAttempts > 0) {
        const cooldown = calculateCooldown(state.failedAttempts);
        const timeSinceLastAttempt = now - state.lastAttemptTime;

        if (timeSinceLastAttempt < cooldown) {
            const waitMs = cooldown - timeSinceLastAttempt;
            return {
                allowed: false,
                waitMs,
                message: `Please wait ${formatWaitTime(waitMs)} before trying again.`,
            };
        }
    }

    return { allowed: true, waitMs: 0, message: '' };
}

/**
 * Record a failed attempt
 */
export function recordFailedAttempt(action: string): void {
    const state = getState(action);
    const now = Date.now();

    state.failedAttempts += 1;
    state.lastAttemptTime = now;

    // Lock out after max attempts
    if (state.failedAttempts >= CONFIG.maxFailedAttempts) {
        state.lockedUntil = now + CONFIG.lockoutDurationMs;
        console.log(`[RateLimiter] Action "${action}" locked out for ${CONFIG.lockoutDurationMs / 1000}s`);
    } else {
        const cooldown = calculateCooldown(state.failedAttempts);
        console.log(`[RateLimiter] Action "${action}" failed attempt ${state.failedAttempts}, cooldown: ${cooldown}ms`);
    }
}

/**
 * Record a successful attempt (resets the rate limit)
 */
export function recordSuccessfulAttempt(action: string): void {
    resetRateLimit(action);
}

/**
 * Reset rate limit for an action
 */
export function resetRateLimit(action: string): void {
    rateLimitStates.set(action, {
        failedAttempts: 0,
        lastAttemptTime: 0,
        lockedUntil: null,
    });
}

/**
 * Get current state for an action (for UI display)
 */
export function getRateLimitInfo(action: string): {
    failedAttempts: number;
    isLockedOut: boolean;
    remainingLockoutMs: number;
} {
    const state = getState(action);
    const now = Date.now();

    const isLockedOut = state.lockedUntil !== null && now < state.lockedUntil;
    const remainingLockoutMs = isLockedOut ? state.lockedUntil! - now : 0;

    return {
        failedAttempts: state.failedAttempts,
        isLockedOut,
        remainingLockoutMs,
    };
}

/**
 * Format wait time for display
 */
function formatWaitTime(ms: number): string {
    const seconds = Math.ceil(ms / 1000);

    if (seconds < 60) {
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }

    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Hook for React components to use rate limiting
 */
export function useRateLimitedAction(action: string) {
    return {
        check: () => checkRateLimit(action),
        recordFailure: () => recordFailedAttempt(action),
        recordSuccess: () => recordSuccessfulAttempt(action),
        reset: () => resetRateLimit(action),
        getInfo: () => getRateLimitInfo(action),
    };
}

// Action constants
export const RATE_LIMIT_ACTIONS = {
    LOGIN: 'login',
    REGISTER: 'register',
    FORGOT_PASSWORD: 'forgot_password',
} as const;
