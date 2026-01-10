class WarmupService {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Start warmup service
  start() {
    if (this.isRunning) {
      console.log('[WarmupService] Already running, skipping start');
      return;
    }
    
    this.isRunning = true;
    console.log('[WarmupService] Starting warmup service');
    
    // Initial warmup
    console.log('[WarmupService] Performing initial warmup');
    this.warmup();
    
    // Set up recurring warmup every 10 minutes
    this.interval = setInterval(() => {
      console.log('[WarmupService] Performing scheduled warmup (every 10 minutes)');
      this.warmup();
    }, 10 * 60 * 1000); // 10 minutes
    
    console.log('[WarmupService] Warmup service started, next warmup in 10 minutes');
  }

  // Stop warmup service
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('[WarmupService] Stopped warmup service');
  }

  // Perform warmup by calling server-side warmup endpoint
  private async warmup() {
    try {
      console.log('[WarmupService] Starting warmup process...');
      
      // Call server-side warmup endpoint that has access to environment variables
      const response = await fetch('/api/warmup', { method: 'GET' });
      
      if (!response.ok) {
        console.error('[WarmupService] Warmup endpoint failed:', response.status, response.statusText);
        return;
      }

      const result = await response.json();
      
      console.log('[WarmupService] Warmup completed successfully:', result);
      
    } catch (error) {
      console.error('[WarmupService] Warmup failed with error:', error);
    }
  }
}

// Singleton instance
export const warmupService = new WarmupService();
