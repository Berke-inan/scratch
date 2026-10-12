/**
 * Utility for resolving application base URL and building standardized QR code target URLs.
 */

const FALLBACK_PRODUCTION_URL = "https://scratch-e6j4kgn11-berke-inan.vercel.app"

/**
 * Resolves the application base URL:
 * 1. Client-side origin: typeof window !== 'undefined' ? window.location.origin : ...
 *    (Automatically falls back to NEXT_PUBLIC_APP_URL if client is on localhost to prevent non-routable phone scans)
 * 2. Environment variable: process.env.NEXT_PUBLIC_APP_URL
 * 3. Fallback: https://scratch-e6j4kgn11-berke-inan.vercel.app
 */
export function getAppBaseUrl(forceLiveProduction = false): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "")

  if (forceLiveProduction) {
    return envUrl || FALLBACK_PRODUCTION_URL
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"

    // If accessing locally, prefer production URL so mobile devices scanning the QR can reach the app
    if (isLocalhost) {
      return envUrl || FALLBACK_PRODUCTION_URL
    }

    return window.location.origin.replace(/\/+$/, "")
  }

  return envUrl || FALLBACK_PRODUCTION_URL
}

/**
 * Standard QR target URL schema:
 * ${baseUrl}/?cafeId=${cafeId}&table=${tableNumber}
 */
export function buildQrTargetUrl(
  cafeId: string,
  tableNumber: number | string,
  customBaseUrl?: string
): string {
  const base = (
    customBaseUrl?.trim().replace(/\/+$/, "") || getAppBaseUrl()
  ).replace(/\/+$/, "")

  return `${base}/?cafeId=${encodeURIComponent(cafeId)}&table=${encodeURIComponent(
    String(tableNumber)
  )}`
}
