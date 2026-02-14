/**
 * Cryptography utilities for PII data encryption (LGPD Compliance)
 * 
 * Uses AES-256-GCM for authenticated encryption with strong security guarantees.
 * 
 * @requires DATA_ENCRYPTION_KEY environment variable (32 bytes in hex format)
 * @example
 * ```bash
 * # Generate encryption key (NEVER commit to git!)
 * node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * ```
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

// Encryption key from environment (32 bytes = 256 bits)
const getEncryptionKey = (): Buffer => {
    const key = process.env.DATA_ENCRYPTION_KEY
    if (!key) {
        throw new Error(
            'DATA_ENCRYPTION_KEY environment variable is required for PII encryption'
        )
    }
    if (key.length !== 64) {
        // 32 bytes in hex = 64 characters
        throw new Error(
            'DATA_ENCRYPTION_KEY must be 64 hex characters (32 bytes)'
        )
    }
    return Buffer.from(key, 'hex')
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 * 
 * @param text - Plaintext to encrypt (e.g., phone number, email)
 * @returns Encrypted string in format: "iv:authTag:ciphertext" (hex encoded)
 * 
 * @example
 * ```typescript
 * const encrypted = encrypt("11999887766")
 * // => "a1b2c3d4....:e5f6g7h8....:i9j0k1l2...."
 * ```
 */
export function encrypt(text: string): string {
    if (!text) return ''

    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Format: iv:authTag:encrypted (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts an encrypted string using AES-256-GCM
 * 
 * @param encryptedText - Encrypted string in format "iv:authTag:ciphertext"
 * @returns Original plaintext
 * @throws Error if decryption fails (tampered data or wrong key)
 * 
 * @example
 * ```typescript
 * const decrypted = decrypt("a1b2c3d4....:e5f6g7h8....:i9j0k1l2....")
 * // => "11999887766"
 * ```
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText) return ''

    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted format. Expected "iv:authTag:ciphertext"')
    }

    const [ivHex, authTagHex, encryptedHex] = parts
    const key = getEncryptionKey()
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}

/**
 * Encrypts a nullable/optional field
 * 
 * @param text - Text to encrypt (can be null/undefined)
 * @returns Encrypted text or null if input was null/undefined
 */
export function encryptOptional(text: string | null | undefined): string | null {
    return text ? encrypt(text) : null
}

/**
 * Decrypts a nullable/optional field
 * 
 * @param encryptedText - Encrypted text (can be null/undefined)
 * @returns Decrypted text or null if input was null/undefined
 */
export function decryptOptional(
    encryptedText: string | null | undefined
): string | null {
    return encryptedText ? decrypt(encryptedText) : null
}

/**
 * Validates that encryption key is properly configured
 * 
 * @returns true if key is valid, false otherwise
 */
export function validateEncryptionKey(): boolean {
    try {
        getEncryptionKey()
        return true
    } catch {
        return false
    }
}
