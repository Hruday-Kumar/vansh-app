/**
 * 🪷 VANSH UTILITIES - Validation Helpers
 */

// ═══════════════════════════════════════════════════════════
// STRING VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Check if a string is empty or only whitespace
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Check if a string is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a string is a valid phone number (Indian format)
 */
export function isValidPhone(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  // Indian phone: +91 followed by 10 digits, or just 10 digits
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
}

/**
 * Check if a string is a valid name (letters, spaces, some special chars)
 */
export function isValidName(name: string): boolean {
  // Allow letters (including Unicode for Indian names), spaces, hyphens, apostrophes
  return /^[\p{L}\s'-]{2,50}$/u.test(name);
}

// ═══════════════════════════════════════════════════════════
// DATE VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Check if a date is valid
 */
export function isValidDate(date: Date | string): boolean {
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  return new Date(date) < new Date();
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  return new Date(date) > new Date();
}

/**
 * Check if a birth date is reasonable (not future, not too old)
 */
export function isValidBirthDate(date: Date | string): boolean {
  const d = new Date(date);
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 150, 0, 1); // 150 years ago
  
  return d <= now && d >= minDate;
}

// ═══════════════════════════════════════════════════════════
// CONTENT VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Check if text is within length limits
 */
export function isWithinLength(text: string, min: number, max: number): boolean {
  const len = text.trim().length;
  return len >= min && len <= max;
}

/**
 * Check if an array has items
 */
export function hasItems<T>(arr: T[] | null | undefined): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validate a Vasiyat message
 */
export interface VasiyatValidation {
  isValid: boolean;
  errors: string[];
}

export function validateVasiyat(data: {
  title?: string;
  message?: string;
  recipients?: string[];
}): VasiyatValidation {
  const errors: string[] = [];
  
  if (isEmpty(data.title)) {
    errors.push('Please add a title for your message');
  } else if (!isWithinLength(data.title!, 1, 100)) {
    errors.push('Title must be between 1-100 characters');
  }
  
  if (isEmpty(data.message)) {
    errors.push('Please write your message');
  } else if (!isWithinLength(data.message!, 10, 10000)) {
    errors.push('Message must be between 10-10,000 characters');
  }
  
  if (!hasItems(data.recipients)) {
    errors.push('Please select at least one recipient');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a Katha recording
 */
export function validateKatha(data: {
  duration?: number;
  audioUri?: string;
}): VasiyatValidation {
  const errors: string[] = [];
  
  if (!data.audioUri) {
    errors.push('No recording found');
  }
  
  if (!data.duration || data.duration < 3) {
    errors.push('Recording must be at least 3 seconds');
  }
  
  if (data.duration && data.duration > 3600) {
    errors.push('Recording cannot exceed 1 hour');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════
// SANITIZATION
// ═══════════════════════════════════════════════════════════

/**
 * Sanitize a string for display (trim, normalize whitespace)
 */
export function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize a name (capitalize properly)
 */
export function sanitizeName(name: string): string {
  return sanitizeText(name)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + '...';
}
