import { logger } from '../../utils/logger.js'

/**
 * Retry wrapper for API calls with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number
    delay?: number
    maxDelay?: number
    onRetry?: (error: Error, attempt: number) => void
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, maxDelay = 10000, onRetry } = options

  let lastError: Error

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt > retries) {
        throw lastError
      }

      const waitTime = Math.min(delay * Math.pow(2, attempt - 1), maxDelay)

      if (onRetry) {
        onRetry(lastError, attempt)
      } else {
        logger.warn(`Retry attempt ${attempt}/${retries} after ${waitTime}ms: ${lastError.message}`)
      }

      await sleep(waitTime)
    }
  }

  throw lastError!
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Format phone number to WhatsApp JID format
 * Removes non-numeric characters and adds @s.whatsapp.net suffix
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // Brazilian numbers: ensure country code
  if (cleaned.length === 11 || cleaned.length === 10) {
    return `55${cleaned}`
  }

  return cleaned
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  // Minimum 10 digits (Brazilian without country code) to 15 digits (max international)
  return cleaned.length >= 10 && cleaned.length <= 15
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase()

  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    // Videos
    mp4: 'video/mp4',
    avi: 'video/avi',
    mov: 'video/quicktime',
    // Audio
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }

  return mimeTypes[extension || ''] || 'application/octet-stream'
}

/**
 * Get media type from MIME type
 */
export function getMediaType(mimetype: string): 'image' | 'video' | 'audio' | 'document' {
  if (mimetype.startsWith('image/')) return 'image'
  if (mimetype.startsWith('video/')) return 'video'
  if (mimetype.startsWith('audio/')) return 'audio'
  return 'document'
}
