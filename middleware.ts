import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

export default function middleware(req: NextRequest, event: NextFetchEvent) {
    // 1. Log every incoming request
    console.log(`\n[GodsEye Middleware] 🚦 Request received for: ${req.url}`);

    const userAgent = req.headers.get('user-agent') || '';

    // 2. Log the exact User-Agent string
    console.log(`[GodsEye Middleware] 🕵️ User-Agent: ${userAgent}`);

    // Regex to catch AI Search Bots
    const isAIBot = /PerplexityBot|OAI-SearchBot|ChatGPT-User|GPTBot|ClaudeBot|GoogleOther/i.test(userAgent);

    // 3. Log the Regex evaluation
    console.log(`[GodsEye Middleware] 🤖 Is AI Bot Match? ${isAIBot}`);

    if (isAIBot) {
        const payload = {
            event_type: "bot_crawl",
            user_agent: userAgent,
            target_url: req.url,
            referrer: req.headers.get('referer') || "Direct",
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || "Unknown"
        };

        console.log(`[GodsEye Middleware] 📦 Preparing to send payload to Edge...`);

        // Push to your Cloudflare Ingest Worker
        const sendPing = fetch("https://godseye-ingest.buildai2024.workers.dev", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer ge_live_test_123"
            },
            body: JSON.stringify(payload)
        })
            .then(async (res) => {
                // 4. Log the Cloudflare response
                if (res.ok) {
                    console.log(`[GodsEye Middleware] ✅ Successfully sent bot ping! Status: ${res.status}`);
                } else {
                    const errText = await res.text();
                    console.error(`[GodsEye Middleware] 🔴 Edge API Rejected Ping: ${res.status} - ${errText}`);
                }
            })
            .catch(err => console.error("[GodsEye Middleware] 🔴 Network/Fetch Error:", err));

        // event.waitUntil ensures the ping finishes in the background
        event.waitUntil(sendPing);
    }

    // Allow the website to load normally
    return NextResponse.next();
}

export const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};