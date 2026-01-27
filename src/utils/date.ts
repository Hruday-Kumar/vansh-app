/**
 * 🪷 VANSH UTILITIES - Date & Time Helpers
 */

import type { DateString, Timestamp } from '../types';

// ═══════════════════════════════════════════════════════════
// DATE FORMATTING
// ═══════════════════════════════════════════════════════════

/**
 * Format a timestamp to a relative time string
 */
export function formatTimeAgo(date: Date | string | number): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  if (diffYears === 1) return '1 year ago';
  return `${diffYears} years ago`;
}

/**
 * Format a date for display (Month Day, Year)
 */
export function formatDate(date: Date | string | number): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date as short format (MMM D)
 */
export function formatDateShort(date: Date | string | number): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date as ISO string (for API)
 */
export function toISODate(date: Date): DateString {
  return date.toISOString().split('T')[0] as DateString;
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration in seconds to human readable
 */
export function formatDurationLong(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)} seconds`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''}`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Get age from birthdate
 */
export function calculateAge(birthDate: DateString | Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string | number): boolean {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Check if a date is this week
 */
export function isThisWeek(date: Date | string | number): boolean {
  const d = new Date(date);
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart;
}

/**
 * Get timestamp from Date
 */
export function toTimestamp(date: Date): Timestamp {
  return date.getTime() as Timestamp;
}

/**
 * Convert timestamp to Date
 */
export function fromTimestamp(timestamp: Timestamp): Date {
  return new Date(timestamp);
}

// ═══════════════════════════════════════════════════════════
// ERA HELPERS (for Time River)
// ═══════════════════════════════════════════════════════════

/**
 * Get decade label from year
 */
export function getDecadeLabel(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

/**
 * Get era name from year (customizable per family)
 */
export function getEraName(year: number): string {
  const currentYear = new Date().getFullYear();
  const yearsAgo = currentYear - year;
  
  if (yearsAgo <= 0) return 'Present';
  if (yearsAgo <= 1) return 'This Year';
  if (yearsAgo <= 5) return 'Recent';
  if (yearsAgo <= 10) return 'Last Decade';
  if (yearsAgo <= 25) return 'A Generation Ago';
  if (yearsAgo <= 50) return 'Parents Era';
  if (yearsAgo <= 75) return 'Grandparents Era';
  return 'Ancestral Times';
}
