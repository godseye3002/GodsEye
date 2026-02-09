# AI Mode Configuration

## Overview
The system supports two AI scraping modes that can be switched via environment variables:
1. **Google Overview Mode** (default) - Direct API calls to Google AI Overview scraper
2. **New AI Mode** - Job submission + polling pattern

## Environment Variables

### Mode Selection
```
NEXT_PUBLIC_GOOGLE_AI_MODE=google_overview | new_ai_mode
```
- `google_overview` (default): Uses direct API calls
- `new_ai_mode`: Uses job submission + polling pattern

### Mode-Specific Endpoints
```
# Google Overview Mode (direct API)
NEXT_PUBLIC_GOOGLE_OVERVIEW_SCRAPER=http://your-scraper-url/scrape

# New AI Mode (job-based)
NEXT_PUBLIC_NEW_AI_MODE_SCRAPER=http://localhost:8080/api/v1/scrape
```

## How It Works

### Google Overview Mode (Direct API)
```
Query → Scraper API → Immediate Response → Strategic Analysis
```

### New AI Mode (Job Polling)
```
Query → Submit Job → Get job_id → Poll for Results → Strategic Analysis
```

## Implementation Details

### Files Created
1. **lib/ai-mode-config.ts** - Configuration layer with mode detection
2. **lib/ai-scraper.ts** - Unified scraper function supporting both patterns

### Key Functions

#### `getAIModeConfig()`
Returns configuration based on current mode:
- Scraper endpoint
- Display name
- Polling settings (if applicable)

#### `callAIScraper(query, location, mode)`
Unified function that:
- Detects active mode
- Calls appropriate scraper pattern
- Handles job polling for New AI Mode
- Returns standardized response format

#### Response Validators
- `validateGoogleOverviewResponse()` - Validates Google Overview responses
- `validateNewAIResponse()` - Validates New AI Mode responses
- `transformNewAIResponse()` - Transforms New AI responses to standard format

## Usage

### In Code
```typescript
import { callAIScraper } from '@/lib/ai-scraper';

// Uses mode from environment variable
const result = await callAIScraper(query, location);

// Or specify mode explicitly
const result = await callAIScraper(query, location, 'new_ai_mode');
```

### Environment Setup

**For Google Overview Mode (default):**
```env
NEXT_PUBLIC_GOOGLE_AI_MODE=google_overview
NEXT_PUBLIC_GOOGLE_OVERVIEW_SCRAPER=https://your-scraper-url.com/scrape
```

**For New AI Mode:**
```env
NEXT_PUBLIC_GOOGLE_AI_MODE=new_ai_mode
NEXT_PUBLIC_NEW_AI_MODE_SCRAPER=http://localhost:8080/api/v1/scrape
```

## Job Polling Details (New AI Mode)

### Polling Configuration
- **Interval**: 3 seconds (configurable via `pollingInterval`)
- **Max Attempts**: 60 attempts (3 minutes total)
- **Timeout**: Throws error if job doesn't complete

### Job Lifecycle
1. Submit job → Get `job_id`
2. Poll `/job-result/{job_id}` every 3 seconds
3. Check status: `pending` | `completed` | `failed`
4. On `completed`: Process results
5. On `failed`: Throw error with message
6. On timeout: Throw timeout error

### Expected Response Format (New AI Mode)
```json
{
  "status": "completed",
  "data": {
    "job_id": "uuid",
    "query": "search query",
    "success": true,
    "location": "USA",
    "ai_overview_found": true,
    "ai_overview_text": "AI content...",
    "source_links": [...],
    "timestamp": "2026-01-24T08:10:22Z"
  }
}
```

## Error Handling

Both modes provide detailed error messages:
- Connection errors
- Timeout errors
- Invalid response format
- Job failure (New AI Mode)
- Insufficient content

## Testing

### Test Google Overview Mode
```env
NEXT_PUBLIC_GOOGLE_AI_MODE=google_overview
```

### Test New AI Mode
```env
NEXT_PUBLIC_GOOGLE_AI_MODE=new_ai_mode
```

## Backward Compatibility

- Default mode is `google_overview`
- Existing code continues to work without changes
- Response format is standardized across modes
- UI remains unchanged

## Migration Guide

To switch from Google Overview to New AI Mode:
1. Set `NEXT_PUBLIC_GOOGLE_AI_MODE=new_ai_mode`
2. Set `NEXT_PUBLIC_NEW_AI_MODE_SCRAPER` to your endpoint
3. Ensure New AI Mode service is running
4. Test with a sample query

## Troubleshooting

### Google Overview Mode Issues
- Check `NEXT_PUBLIC_GOOGLE_OVERVIEW_SCRAPER` endpoint
- Verify scraper service is running
- Check network connectivity

### New AI Mode Issues
- Ensure job submission endpoint is accessible
- Check job polling endpoint
- Verify job_id is returned
- Monitor polling logs for status updates
- Check for timeout issues (adjust `maxPollAttempts` if needed)

## Notes

- No UI changes required
- Switch is controlled entirely via environment variables
- Both modes return identical response format
- Strategic analysis works seamlessly with both modes
