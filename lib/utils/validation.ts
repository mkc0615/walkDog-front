// Input validation utilities

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
        return { isValid: false, error: 'Email is required' };
    }

    const trimmedEmail = email.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    if (trimmedEmail.length > 254) {
        return { isValid: false, error: 'Email is too long' };
    }

    return { isValid: true };
}

// Password validation
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function validatePassword(password: string): ValidationResult {
    if (!password || password.length === 0) {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        return { isValid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
        return { isValid: false, error: 'Password is too long' };
    }

    return { isValid: true };
}

// Password confirmation validation
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
    if (!confirmPassword || confirmPassword.length === 0) {
        return { isValid: false, error: 'Please confirm your password' };
    }

    if (password !== confirmPassword) {
        return { isValid: false, error: 'Passwords do not match' };
    }

    return { isValid: true };
}

// Name validation
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 50;

export function validateName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
        return { isValid: false, error: 'Name is required' };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < NAME_MIN_LENGTH) {
        return { isValid: false, error: `Name must be at least ${NAME_MIN_LENGTH} characters` };
    }

    if (trimmedName.length > NAME_MAX_LENGTH) {
        return { isValid: false, error: 'Name is too long' };
    }

    return { isValid: true };
}

// Sanitize input - trim and remove dangerous characters
export function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, ''); // Remove potential HTML/script injection chars
}

// Validate all login fields
export function validateLoginForm(email: string, password: string): {
    isValid: boolean;
    errors: { email?: string; password?: string };
} {
    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);

    return {
        isValid: emailResult.isValid && passwordResult.isValid,
        errors: {
            email: emailResult.error,
            password: passwordResult.error,
        },
    };
}

// Validate all registration fields
export function validateRegisterForm(
    name: string,
    email: string,
    password: string,
    confirmPassword: string
): {
    isValid: boolean;
    errors: { name?: string; email?: string; password?: string; confirmPassword?: string };
} {
    const nameResult = validateName(name);
    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);
    const confirmResult = validatePasswordMatch(password, confirmPassword);

    return {
        isValid: nameResult.isValid && emailResult.isValid && passwordResult.isValid && confirmResult.isValid,
        errors: {
            name: nameResult.error,
            email: emailResult.error,
            password: passwordResult.error,
            confirmPassword: confirmResult.error,
        },
    };
}
