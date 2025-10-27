import forge from 'node-forge'

/**
 * Service for encrypting and decrypting sensitive data like API keys
 * Uses AES-256-GCM for encryption with a key derived from environment variable
 */
export class EncryptionService {
  private readonly algorithm = 'AES-GCM'
  private readonly keySize = 32 // 256 bits
  private readonly ivSize = 12 // 96 bits for GCM
  private readonly tagSize = 16 // 128 bits authentication tag

  private encryptionKey: string

  constructor() {
    // Get encryption key from environment or generate a warning
    this.encryptionKey = process.env.ENCRYPTION_KEY || ''

    if (!this.encryptionKey) {
      console.warn(
        'WARNING: ENCRYPTION_KEY not set in environment. Using default key (NOT SECURE FOR PRODUCTION)'
      )
      // Default key for development only - DO NOT USE IN PRODUCTION
      this.encryptionKey = 'dev-only-key-please-change-in-production-environment!'
    }

    // Ensure key is at least 32 bytes
    if (this.encryptionKey.length < this.keySize) {
      this.encryptionKey = this.encryptionKey.padEnd(this.keySize, '0')
    } else if (this.encryptionKey.length > this.keySize) {
      this.encryptionKey = this.encryptionKey.substring(0, this.keySize)
    }
  }

  /**
   * Encrypt a plain text value
   * @param plainText The text to encrypt
   * @returns Base64 encoded encrypted string with format: iv:encryptedData:authTag
   */
  encrypt(plainText: string): string {
    try {
      // Generate random IV
      const iv = forge.random.getBytesSync(this.ivSize)

      // Create cipher
      const cipher = forge.cipher.createCipher(this.algorithm, this.encryptionKey)
      cipher.start({
        iv: iv,
        tagLength: this.tagSize * 8 // Convert bytes to bits
      })

      // Encrypt
      cipher.update(forge.util.createBuffer(plainText, 'utf8'))
      cipher.finish()

      // Get encrypted data and authentication tag
      const encrypted = cipher.output.getBytes()
      const tag = cipher.mode.tag.getBytes()

      // Combine IV, encrypted data, and tag
      const combined = forge.util.encode64(iv + encrypted + tag)

      return combined
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt an encrypted value
   * @param encryptedText Base64 encoded encrypted string with format: iv:encryptedData:authTag
   * @returns Decrypted plain text
   */
  decrypt(encryptedText: string): string {
    try {
      // Decode from base64
      const combined = forge.util.decode64(encryptedText)

      // Extract IV, encrypted data, and tag
      const iv = combined.substring(0, this.ivSize)
      const tag = combined.substring(combined.length - this.tagSize)
      const encrypted = combined.substring(this.ivSize, combined.length - this.tagSize)

      // Create decipher
      const decipher = forge.cipher.createDecipher(this.algorithm, this.encryptionKey)
      decipher.start({
        iv: iv,
        tag: forge.util.createBuffer(tag)
      })

      // Decrypt
      decipher.update(forge.util.createBuffer(encrypted))
      const success = decipher.finish()

      if (!success) {
        throw new Error('Decryption failed - invalid authentication tag')
      }

      return decipher.output.data
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Mask an API key for display purposes
   * Shows only the last 4 characters
   * @param apiKey The API key to mask
   * @returns Masked API key (e.g., "****abcd")
   */
  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 4) {
      return '****'
    }
    const lastFour = apiKey.slice(-4)
    return `****${lastFour}`
  }
}
