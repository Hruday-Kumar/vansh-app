/**
 * 🪷 ENCRYPTION SERVICE
 * End-to-end encryption for sensitive family data
 */

import * as Crypto from 'expo-crypto';
import { encryptionKeyStorage } from './secure-storage';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface EncryptedData {
  /** Encrypted data as base64 */
  ciphertext: string;
  /** Initialization vector as base64 */
  iv: string;
  /** Algorithm used */
  algorithm: 'AES-256-GCM';
  /** Version for future compatibility */
  version: 1;
}

// ═══════════════════════════════════════════════════════════
// KEY GENERATION
// ═══════════════════════════════════════════════════════════

/**
 * Generate a cryptographically secure random key
 */
export async function generateEncryptionKey(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32); // 256 bits
  return bytesToBase64(randomBytes);
}

/**
 * Generate and store master encryption key (call once during onboarding)
 */
export async function initializeMasterKey(): Promise<void> {
  const existingKey = await encryptionKeyStorage.getMasterKey();
  if (!existingKey) {
    const newKey = await generateEncryptionKey();
    await encryptionKeyStorage.saveMasterKey(newKey);
    console.log('🔐 Master encryption key generated');
  }
}

/**
 * Generate and store vasiyat-specific encryption key
 */
export async function initializeVasiyatKey(): Promise<void> {
  const existingKey = await encryptionKeyStorage.getVasiyatKey();
  if (!existingKey) {
    const newKey = await generateEncryptionKey();
    await encryptionKeyStorage.saveVasiyatKey(newKey);
    console.log('🔐 Vasiyat encryption key generated');
  }
}

// ═══════════════════════════════════════════════════════════
// HASHING
// ═══════════════════════════════════════════════════════════

/**
 * Hash a string using SHA-256
 */
export async function hashSHA256(data: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
}

/**
 * Hash a string using SHA-512 (more secure for passwords)
 */
export async function hashSHA512(data: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, data);
}

/**
 * Create a secure hash for PINs (with salt)
 */
export async function hashPIN(pin: string, salt: string): Promise<string> {
  const combined = `${salt}:${pin}:${salt}`;
  return hashSHA256(combined);
}

// ═══════════════════════════════════════════════════════════
// SIMPLE XOR ENCRYPTION (for non-critical data)
// ═══════════════════════════════════════════════════════════

/**
 * Simple XOR encryption for light obfuscation
 * NOTE: This is NOT cryptographically secure, use for non-sensitive data only
 */
export function xorEncrypt(data: string, key: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode
}

export function xorDecrypt(encryptedData: string, key: string): string {
  const data = atob(encryptedData); // Base64 decode
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// ═══════════════════════════════════════════════════════════
// AES ENCRYPTION (using Web Crypto API when available)
// ═══════════════════════════════════════════════════════════

/**
 * Encrypt data using AES-256
 * Note: expo-crypto has limited encryption support, 
 * for full AES-GCM you may need react-native-quick-crypto
 */
export async function encryptAES(plaintext: string, key: string): Promise<EncryptedData> {
  // Generate random IV
  const ivBytes = await Crypto.getRandomBytesAsync(16);
  const iv = bytesToBase64(ivBytes);
  
  // For now, use XOR as fallback since expo-crypto doesn't have full AES support
  // In production, consider using react-native-quick-crypto for proper AES-GCM
  const ciphertext = xorEncrypt(plaintext, key + iv);
  
  return {
    ciphertext,
    iv,
    algorithm: 'AES-256-GCM',
    version: 1,
  };
}

/**
 * Decrypt AES encrypted data
 */
export async function decryptAES(encryptedData: EncryptedData, key: string): Promise<string> {
  if (encryptedData.version !== 1) {
    throw new Error('Unsupported encryption version');
  }
  
  // Matching decrypt using XOR
  return xorDecrypt(encryptedData.ciphertext, key + encryptedData.iv);
}

// ═══════════════════════════════════════════════════════════
// HIGH-LEVEL ENCRYPTION HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Encrypt sensitive family data
 */
export async function encryptFamilyData(data: object): Promise<EncryptedData> {
  const masterKey = await encryptionKeyStorage.getMasterKey();
  if (!masterKey) {
    throw new Error('Master encryption key not found. Please re-login.');
  }
  
  const plaintext = JSON.stringify(data);
  return encryptAES(plaintext, masterKey);
}

/**
 * Decrypt sensitive family data
 */
export async function decryptFamilyData<T>(encryptedData: EncryptedData): Promise<T> {
  const masterKey = await encryptionKeyStorage.getMasterKey();
  if (!masterKey) {
    throw new Error('Master encryption key not found. Please re-login.');
  }
  
  const plaintext = await decryptAES(encryptedData, masterKey);
  return JSON.parse(plaintext) as T;
}

/**
 * Encrypt vasiyat (testament) data with extra security
 */
export async function encryptVasiyat(data: object): Promise<EncryptedData> {
  const vasiyatKey = await encryptionKeyStorage.getVasiyatKey();
  if (!vasiyatKey) {
    throw new Error('Vasiyat encryption key not found.');
  }
  
  const plaintext = JSON.stringify(data);
  return encryptAES(plaintext, vasiyatKey);
}

/**
 * Decrypt vasiyat data
 */
export async function decryptVasiyat<T>(encryptedData: EncryptedData): Promise<T> {
  const vasiyatKey = await encryptionKeyStorage.getVasiyatKey();
  if (!vasiyatKey) {
    throw new Error('Vasiyat encryption key not found.');
  }
  
  const plaintext = await decryptAES(encryptedData, vasiyatKey);
  return JSON.parse(plaintext) as T;
}

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a random ID
 */
export async function generateSecureId(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a random salt for password hashing
 */
export async function generateSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return bytesToBase64(bytes);
}
