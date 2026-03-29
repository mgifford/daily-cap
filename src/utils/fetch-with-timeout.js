/**
 * Fetch with timeout utility
 *
 * Wraps the native fetch API with:
 * - AbortController-based timeout to prevent hanging requests
 * - A descriptive User-Agent header so servers can identify the scanner
 *
 * Usage:
 *   const response = await fetchWithTimeout(url);
 *   const response = await fetchWithTimeout(url, { headers: {...} }, 15_000);
 */

export const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

export const DAILY_CAP_USER_AGENT =
  "DailyCAPBot/1.0 (Government of Canada accessibility monitoring; +https://github.com/mgifford/daily-cap)";

/**
 * Fetch a URL with an explicit timeout and a default User-Agent.
 *
 * @param {string} url - The URL to fetch.
 * @param {RequestInit} [options] - Standard fetch options.
 * @param {number} [timeoutMs] - Milliseconds before the request is aborted.
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      headers: {
        "User-Agent": DAILY_CAP_USER_AGENT,
        ...options.headers
      },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}
