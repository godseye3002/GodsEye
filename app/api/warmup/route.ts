import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Warm up health endpoints to prevent cold starts
    const healthEndpoints = [];
    
    // Deep analysis service health endpoint
    const deepAnalysisUrl = process.env.DEEP_ANALYSIS_BASE_URL;
    if (deepAnalysisUrl) {
      healthEndpoints.push(`${deepAnalysisUrl}/health`);
    }
    
    // SOV service health endpoint
    healthEndpoints.push('https://godseye-sov-2-production.up.railway.app/health');

    if (healthEndpoints.length === 0) {
      return NextResponse.json({ 
        message: 'No endpoints to warm up',
        endpoints: []
      });
    }

    // Warm up all endpoints in parallel
    const results = await Promise.allSettled(
      healthEndpoints.map(async (endpoint) => {
        const startTime = Date.now();
        try {
          const response = await fetch(endpoint, { method: 'GET' });
          const duration = Date.now() - startTime;
          return {
            endpoint,
            status: response.status,
            success: response.ok,
            duration,
            message: response.ok ? 'Warmed up successfully' : 'Failed to warm up'
          };
        } catch (error) {
          const duration = Date.now() - startTime;
          return {
            endpoint,
            status: 0,
            success: false,
            duration,
            message: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const summary = results.map(result => 
      result.status === 'fulfilled' ? result.value : { 
        endpoint: 'unknown', 
        status: 0, 
        success: false, 
        duration: 0, 
        message: 'Promise rejected' 
      }
    );

    return NextResponse.json({
      message: `Warmed up ${healthEndpoints.length} endpoints`,
      endpoints: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Warmup failed', 
        details: error?.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
