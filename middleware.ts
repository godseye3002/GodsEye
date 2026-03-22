// import { NextResponse } from 'next/server';
// import type { NextFetchEvent, NextRequest } from 'next/server';

// export default function middleware(req: NextRequest, event: NextFetchEvent) {
//     // 1. Log every incoming request
//     console.log(`\n[GodsEye Middleware] 🚦 Request received for: ${req.url}`);

//     const userAgent = req.headers.get('user-agent') || '';

//     // 2. Log the exact User-Agent string
//     console.log(`[GodsEye Middleware] 🕵️ User-Agent: ${userAgent}`);

//     // Regex to catch AI Search Bots
//     // const isAIBot = /PerplexityBot|OAI-SearchBot|ChatGPT-User|GPTBot|ClaudeBot|GoogleOther/i.test(userAgent);
//     // Updated to catch both PerplexityBot AND Perplexity-User
//     const isAIBot = /Perplexity|OAI-SearchBot|ChatGPT-User|GPTBot|ClaudeBot|GoogleOther/i.test(userAgent);
//     // 3. Log the Regex evaluation
//     console.log(`[GodsEye Middleware] 🤖 Is AI Bot Match? ${isAIBot}`);

//     if (isAIBot) {
//         const payload = {
//             event_type: "bot_crawl",
//             user_agent: userAgent,
//             target_url: req.url,
//             referrer: req.headers.get('referer') || "Direct",
//             ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || "Unknown"
//         };

//         console.log(`[GodsEye Middleware] 📦 Preparing to send payload to Edge...`);

//         // Push to your Cloudflare Ingest Worker
//         const sendPing = fetch("https://godseye-ingest.buildai2024.workers.dev", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Authorization": "Bearer ge_live_test_123"
//             },
//             body: JSON.stringify(payload)
//         })
//             .then(async (res) => {
//                 // 4. Log the Cloudflare response
//                 if (res.ok) {
//                     console.log(`[GodsEye Middleware] ✅ Successfully sent bot ping! Status: ${res.status}`);
//                 } else {
//                     const errText = await res.text();
//                     console.error(`[GodsEye Middleware] 🔴 Edge API Rejected Ping: ${res.status} - ${errText}`);
//                 }
//             })
//             .catch(err => console.error("[GodsEye Middleware] 🔴 Network/Fetch Error:", err));

//         // event.waitUntil ensures the ping finishes in the background
//         event.waitUntil(sendPing);
//     }

//     // Allow the website to load normally
//     return NextResponse.next();
// }

// export const config = {
//     matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
// };


import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

export default function middleware(req: NextRequest, event: NextFetchEvent) {
    const userAgent = req.headers.get('user-agent') || '';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';
    const isAIBot = /Perplexity|OAI-SearchBot|ChatGPT-User|GPTBot|ClaudeBot|GoogleOther/i.test(userAgent);

    // EDIT 1: Single combined log — Vercel Edge only reliably flushes ONE log per request
    console.log(JSON.stringify({
        tag: '[GodsEye]',
        url: req.url,
        userAgent,   // ← this is what was missing before
        ip,
        isAIBot,
    }));

    if (isAIBot) {
        const payload = {
            event_type: "bot_crawl",
            user_agent: userAgent,
            target_url: req.url,
            referrer: req.headers.get('referer') || "Direct",
            ip_address: ip
        };

        const sendPing = fetch("https://godseye-ingest.buildai2024.workers.dev", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer ge_live_test_123"
            },
            body: JSON.stringify(payload)
        })
            .then(async (res) => {
                if (res.ok) {
                    console.log(JSON.stringify({ tag: '[GodsEye Ping OK]', status: res.status }));
                } else {
                    const errText = await res.text();
                    console.error(JSON.stringify({ tag: '[GodsEye Ping FAILED]', status: res.status, error: errText }));
                }
            })
            .catch(err => console.error(JSON.stringify({ tag: '[GodsEye Network Error]', error: String(err) })));

        event.waitUntil(sendPing);
    }

    const response = NextResponse.next();

    // ← This is the homepage fix.
    // Sets Cache-Control on the response Vercel stores in its edge cache.
    // Next time any bot requests /, Vercel fetches fresh from origin instead of
    // returning the cached copy before middleware runs.
    if (req.nextUrl.pathname === '/') {
        response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
        response.headers.set('CDN-Cache-Control', 'no-store');
        response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
    }

    return response;
}

export const config = {
    matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};