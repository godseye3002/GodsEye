/**
 * Reusable utility to extract and return a website's favicon URL.
 * This implementation uses Google's S2 service, which is robust,
 * handles domain extraction automatically, and avoids CORS issues
 * when used on the frontend.
 */

/**
 * Takes a URL and returns the website's favicon (icon) image URL.
 * 
 * @param url - The website URL (e.g., "https://google.com" or "www.example.com")
 * @param size - The desired icon size in pixels (default 64)
 * @returns A string containing the URL of the favicon image
 * 
 * @example
 * const iconUrl = getWebsiteIcon("https://github.com");
 * // Result: "https://www.google.com/s2/favicons?domain=github.com&sz=64"
 */
export function getWebsiteIcon(url: string, size: number = 64): string {
    if (!url) return "";

    try {
        // Auto-prepend protocol if missing for URL parsing
        let normalizedUrl = url.trim();
        if (!/^https?:\/\//i.test(normalizedUrl)) {
            normalizedUrl = 'https://' + normalizedUrl;
        }

        const domain = new URL(normalizedUrl).hostname;

        // Using Google's favicon service: stable, fast, and no CORS issues
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
    } catch (error) {
        // If URL is invalid, try to extract domain using simple regex
        const domainMatch = url.match(/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/i);
        if (domainMatch) {
            return `https://www.google.com/s2/favicons?domain=${domainMatch[0]}&sz=${size}`;
        }

        // Final fallback: Generic icon
        return `https://www.google.com/s2/favicons?domain=missing&sz=${size}`;
    }
}
