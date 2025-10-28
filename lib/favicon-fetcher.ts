/**
 * Favicon Fetcher Utility
 * 
 * Fetches website favicon URLs by parsing HTML and checking common locations.
 * Uses browser-like headers to avoid 403 errors.
 */

import * as cheerio from 'cheerio';

export interface FaviconResult {
  url: string | null;
  error?: string;
}

/**
 * Fetches a website's favicon URL by mimicking a browser
 * @param url - The website URL to fetch favicon from
 * @returns Promise resolving to favicon URL or null if not found
 */
export async function getFaviconUrl(url: string): Promise<string | null> {
  // Set User-Agent header to pretend to be a browser
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  };

  // Ensure the URL has a scheme (http/https)
  let normalizedUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    normalizedUrl = 'https://' + url;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalizedUrl);
  } catch {
    return null;
  }
  const origin = parsed.origin;

  try {
    // Fetch the website's HTML content with 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response = await fetch(normalizedUrl, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // If article URL fails, try the homepage
    if (!response.ok) {
      console.warn(`[Favicon] HTTP error for ${url}: ${response.status} ${response.statusText}. Trying homepage...`);
      const homeCtrl = new AbortController();
      const homeTimeout = setTimeout(() => homeCtrl.abort(), 5000);
      try {
        response = await fetch(origin, { headers, signal: homeCtrl.signal });
      } finally {
        clearTimeout(homeTimeout);
      }
      if (!response.ok) {
        console.warn(`[Favicon] Homepage fetch also failed for ${origin}: ${response.status} ${response.statusText}`);
        // fall through to favicon.ico / google fallback below
      }
    }

    if (response.ok) {
      // Get the HTML text
      const htmlText = await response.text();

      // Parse the HTML with cheerio
      const $ = cheerio.load(htmlText);

      // Collect all possible icon links
      const links: { href: string; sizeScore: number; rel: string }[] = [];

      $('link').each((_, el) => {
        const rel = ($(el).attr('rel') || '').toLowerCase();
        const href = $(el).attr('href') || '';
        if (!href) return;

        // Match rel that contains the word 'icon' (handles multiple rel values)
        const isIcon = rel.split(/\s+/).some(r => r === 'icon' || r === 'shortcut' || r === 'shortcut icon' || r === 'apple-touch-icon' || r === 'apple-touch-icon-precomposed' || r === 'mask-icon');
        if (!isIcon) return;

        // Score by sizes attribute if present (prefer largest)
        const sizesAttr = ($(el).attr('sizes') || '').toLowerCase();
        let sizeScore = 0;
        const match = sizesAttr.match(/(\d{2,4})x(\d{2,4})/);
        if (match) {
          const w = parseInt(match[1], 10);
          const h = parseInt(match[2], 10);
          sizeScore = Math.max(w, h);
        }
        // Prefer PNG over ICO over SVG when size ties
        const lowerHref = href.toLowerCase();
        if (sizeScore === 0) {
          if (lowerHref.endsWith('.png')) sizeScore = 256;
          else if (lowerHref.endsWith('.ico')) sizeScore = 128;
          else if (lowerHref.endsWith('.svg')) sizeScore = 200; // svg can scale well
          else sizeScore = 64;
        }

        links.push({ href, sizeScore, rel });
      });

      if (links.length > 0) {
        // Pick the best by sizeScore
        links.sort((a, b) => b.sizeScore - a.sizeScore);
        const best = links[0];
        try {
          const faviconUrl = new URL(best.href, response.url || normalizedUrl).href;
          return faviconUrl;
        } catch {}
      }
    }

    // 4. Fallback: Try the default /favicon.ico
    const fallbackUrl = new URL('/favicon.ico', origin).href;

    try {
      const fallbackController = new AbortController();
      const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 3000);

      const fallbackResponse = await fetch(fallbackUrl, {
        method: 'HEAD',
        headers,
        signal: fallbackController.signal,
      });

      clearTimeout(fallbackTimeoutId);

      if (fallbackResponse.ok) {
        return fallbackUrl;
      }
    } catch (err) {
      // Fallback doesn't exist or timed out
      console.warn(`[Favicon] Fallback /favicon.ico not found for ${url}`);
    }

    // 5. Final fallback: Google S2 favicon service
    try {
      const googleFavicon = `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
      return googleFavicon;
    } catch {}

    return null;
  } catch (error: any) {
    // Handle network errors, timeouts, or parsing errors
    if (error.name === 'AbortError') {
      console.warn(`[Favicon] Timeout fetching favicon for ${url}`);
    } else {
      console.warn(`[Favicon] Error fetching favicon for ${url}:`, error.message);
    }
    return null;
  }
}

/**
 * Fetches favicons for multiple URLs in parallel with rate limiting
 * @param urls - Array of website URLs
 * @param concurrency - Maximum number of concurrent requests (default: 5)
 * @returns Promise resolving to map of URL to favicon URL
 */
export async function getFaviconsForUrls(
  urls: string[],
  concurrency: number = 5
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  // Process URLs in batches to avoid overwhelming the system
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const favicon = await getFaviconUrl(url);
        return { url, favicon };
      })
    );

    batchResults.forEach(({ url, favicon }) => {
      results.set(url, favicon);
    });
  }

  return results;
}
