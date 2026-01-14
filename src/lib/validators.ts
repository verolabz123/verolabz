/**
 * Input Validation Utilities
 * Provides validation and sanitization functions for user inputs
 */

/** 
 * Email validation
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Phone number validation (international format)
 */
export function isValidPhone(phone: string): boolean {
    // Allow: +1234567890, 123-456-7890, (123) 456-7890, etc.
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.trim());
}

/**
 * URL validation
 */
export function isValidUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * File validation
 */
export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export interface FileValidationOptions {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
}

export function validateFile(
    file: File,
    options: FileValidationOptions = {}
): FileValidationResult {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB default
        allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
        ],
    } = options;

    // Check file size
    if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        return {
            valid: false,
            error: `File size exceeds ${maxSizeMB}MB limit`,
        };
    }

    // Check if file has content
    if (file.size === 0) {
        return {
            valid: false,
            error: 'File is empty',
        };
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Supported: PDF, DOC, DOCX, TXT',
        };
    }

    return { valid: true };
}

/**
 * Excel file validation
 */
export function validateExcelFile(file: File): FileValidationResult {
    const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const maxSize = 20 * 1024 * 1024; // 20MB for Excel

    return validateFile(file, { maxSize, allowedTypes });
}

/**
 * Sanitize string input (remove potentially harmful characters)
 */
export function sanitizeString(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validate password strength
 */
export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    // Determine strength
    if (errors.length === 0) {
        strength = 'strong';
    } else if (errors.length <= 2) {
        strength = 'medium';
    }

    return {
        valid: errors.length === 0,
        errors,
        strength,
    };
}

/**
 * Validate required field
 */
export function isRequired(value: string | null | undefined): boolean {
    if (value === null || value === undefined) return false;
    return value.trim().length > 0;
}

/**
 * Validate string length
 */
export function hasMinLength(value: string, minLength: number): boolean {
    return value.trim().length >= minLength;
}

export function hasMaxLength(value: string, maxLength: number): boolean {
    return value.trim().length <= maxLength;
}

/**
 * Validate number range
 */
export function isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}
