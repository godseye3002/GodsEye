"use client";

import createCache from "@emotion/cache";

// Create a cache with a stable insertion point to avoid hydration mismatches
export function createEmotionCache() {
  let insertionPoint: HTMLElement | undefined;

  if (typeof document !== "undefined") {
    const metaTag = document.querySelector<HTMLMetaElement>(
      'meta[name="emotion-insertion-point"]'
    );
    // If present, styles will be injected right after this meta
    insertionPoint = metaTag ?? undefined as any;
  }

  return createCache({ key: "css", insertionPoint: insertionPoint as any });
}
