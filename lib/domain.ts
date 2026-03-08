/**
 * Domain configuration for Bus Buddy
 * Centralized domain management
 */

export const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'https://busbuddy.in.net'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://busbuddy.in.net'

/**
 * Get the full URL for a given path
 * @param path - The path to append to the domain
 * @returns Full URL
 */
export function getFullUrl(path: string = ''): string {
  const baseUrl = SITE_URL.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

/**
 * Get the domain name without protocol
 * @returns Domain name (e.g., busbuddy.in.net)
 */
export function getDomainName(): string {
  try {
    const url = new URL(SITE_URL)
    return url.hostname
  } catch {
    return 'busbuddy.in.net'
  }
}

/**
 * Check if running in production
 * @returns boolean
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}






