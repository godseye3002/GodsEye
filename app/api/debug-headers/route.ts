import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // never cache this — always hits origin

export async function GET(req: NextRequest) {
    const userAgent = req.headers.get('user-agent') || '';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';
    const isPerplexity = /Perplexity/i.test(userAgent);

    // This log ALWAYS appears — it runs on the origin server, not the edge cache
    console.log(JSON.stringify({
        tag: '[GodsEye DEBUG — Origin Hit Confirmed]',
        userAgent,
        ip,
        isPerplexity,
        timestamp: new Date().toISOString(),
    }));

    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => { allHeaders[key] = value; });

    return NextResponse.json({
        confirmed: 'origin server was reached',
        userAgent,
        ip,
        isPerplexity,
        allHeaders,
        timestamp: new Date().toISOString(),
    });
}