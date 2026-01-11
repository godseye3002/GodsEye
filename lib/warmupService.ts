class WarmupService {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Start warmup service
  start() {
    if (this.isRunning) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[WarmupService] Already running, skipping start');
      }
      return;
    }
    
    this.isRunning = true;
    if (process.env.NODE_ENV !== 'production') {
      console.log('[WarmupService] Starting warmup service');
    }
    
    // Initial warmup
    if (process.env.NODE_ENV !== 'production') {
      console.log('[WarmupService] Performing initial warmup');
    }
    this.warmup();
    
    // Set up recurring warmup every 10 minutes
    this.interval = setInterval(() => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[WarmupService] Performing scheduled warmup (every 10 minutes)');
      }
      this.warmup();
    }, 10 * 60 * 1000); // 10 minutes
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[WarmupService] Warmup service started, next warmup in 10 minutes');
    }
  }

  // Stop warmup service
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    if (process.env.NODE_ENV !== 'production') {
      console.log('[WarmupService] Stopped warmup service');
    }
  }

  // Perform warmup by calling server-side warmup endpoint
  private async warmup() {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[WarmupService] Starting warmup process...');
      }
      
      // Call server-side warmup endpoint that has access to environment variables
      const response = await fetch('/api/warmup', { method: 'GET' });
      
      if (!response.ok) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[WarmupService] Warmup endpoint failed:', {
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString()
          });
        }
        return;
      }

      const result = await response.json();
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('[WarmupService] Warmup completed successfully:', result);
      }
      
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[WarmupService] Warmup failed with error:', {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
      }
    }
  }
}

// Singleton instance
export const warmupService = new WarmupService();
