import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

export default function middleware(req: NextRequest, event: NextFetchEvent) {
    const userAgent = req.headers.get('user-agent') || '';

    // Regex to catch AI Search Bots
    const isAIBot = /PerplexityBot|OAI-SearchBot|ChatGPT-User|GPTBot|ClaudeBot|GoogleOther/i.test(userAgent);

    if (isAIBot) {
        const payload = {
            event_type: "bot_crawl",
            user_agent: userAgent,
            target_url: req.url,
            referrer: req.headers.get('referer') || "Direct",
            // FIXED: Safely extract IP from headers without triggering TS errors
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || "Unknown"
        };

        // Push to your Cloudflare Ingest Worker
        const sendPing = fetch("https://godseye-ingest.buildai2024.workers.dev", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // The client puts their unique GodsEye ID here
                "Authorization": "Bearer ge_live_test_123"
            },
            body: JSON.stringify(payload)
        }).catch(err => console.error("GodsEye Ping Failed:", err));

        // event.waitUntil ensures the ping finishes in the background
        event.waitUntil(sendPing);
    }

    // Allow the website to load normally for the bot/user
    return NextResponse.next();
}

// Only run this middleware on actual web pages, ignore static files and images
export const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};