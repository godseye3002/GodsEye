# Source Links Processing Pipeline

## Overview
This document describes the complete implementation of the source links processing pipeline that categorizes third-party websites cited by AI search engines and displays them on the visibility page.

## Architecture

### 1. API Endpoint: `/api/process-sources`
**Location:** `app/api/process-sources/route.ts`

**Purpose:** 
- Filters social media and e-commerce platforms from source links
- Uses Gemini 2.0 Flash to categorize legitimate third-party websites
- Returns structured data with name, URL, description, and category

**Key Features:**
- Excludes: Twitter, Reddit, Facebook, LinkedIn, Quora, Amazon, Flipkart, etc.
- Identifies: Industry publications, professional blogs, review sites, authority websites
- Token usage tracking integrated with pipeline system
- Runs in parallel with strategic analysis

**Request Format:**
```json
{
  "sourceLinks": [...],
  "analysisId": "uuid",
  "pipeline": "perplexity"
}
```

**Response Format:**
```json
{
  "sources": [
    {
      "name": "Professional name",
      "url": "https://...",
      "description": "Brief description",
      "category": "Industry Publication"
    }
  ],
  "success": true
}
```

### 2. State Management
**Location:** `app/optimize/store.ts`

**New State:**
- `processedSources: ProcessedSource[]` - Array of categorized third-party sites
- `setProcessedSources: (sources) => void` - Setter function

**Interface:**
```typescript
export interface ProcessedSource {
  name: string;
  url: string;
  description: string;
  category?: string;
}
```

### 3. Integration in Optimize Flow
**Location:** `app/optimize/page.tsx`

**Implementation:**
```typescript
// Runs in parallel with strategic analysis
const [analysisResponse, sourcesResponse] = await Promise.all([
  fetch('/api/strategic-analysis', {...}),
  fetch('/api/process-sources', {
    method: 'POST',
    body: JSON.stringify({
      sourceLinks: scraperResponse.source_links || [],
      analysisId,
      pipeline: DEFAULT_PIPELINE,
    }),
  }),
]);

// Store results
if (sourcesResponse.ok) {
  const sourcesData = await sourcesResponse.json();
  if (sourcesData.success && sourcesData.sources) {
    setProcessedSources(sourcesData.sources);
  }
}
```

### 4. Visibility Page Display
**Location:** `app/visibility/page.tsx`

**Features:**
- Displays real processed sources from store
- Shows "Start Analysis" message when no sources available
- Each source displays as a card with:
  - Circle indicator
  - Clickable website name/URL
  - "Add Your Product" disabled button with hover tooltip
  - Professional description from Gemini

**UI States:**
1. **No Sources:** Shows prompt to run analysis
2. **Sources Available:** Displays list of categorized third-party sites

## Data Flow

```
User runs analysis
    ↓
Scraper returns source_links
    ↓
[Parallel Execution]
    ├─> Strategic Analysis API
    └─> Process Sources API
        ├─> Filter social media/marketplaces
        ├─> Call Gemini 2.0 Flash
        ├─> Categorize & describe sites
        └─> Return processed sources
    ↓
Store in Zustand state
    ↓
Display on /visibility page
```

## Token Usage Tracking

All API calls log token usage with:
- `analysisId` - Groups tokens by analysis run
- `pipeline` - Tracks tokens by pipeline type (perplexity, etc.)
- `purpose` - "Process Sources" for this endpoint

## Benefits

1. **Professional Categorization:** AI identifies site type and relevance
2. **Quality Filter:** Removes low-value sources automatically
3. **Scalable:** Works with any number of source links
4. **Non-blocking:** Doesn't fail entire flow if processing fails
5. **Performance:** Runs in parallel with strategic analysis

## Future Enhancements

1. **Enable "Add Your Product" button** - Implement placement request flow
2. **Favicon fetching** - Display actual site logos
3. **Source ranking** - Order by authority/relevance
4. **Historical tracking** - Save sources per product
5. **Export functionality** - Download source list as CSV/PDF

## Testing

To test the pipeline:
1. Run an analysis on the optimize page
2. Navigate to `/visibility`
3. Verify real sources display (not dummy data)
4. Check console for token usage logs
5. Verify source quality and categories

## Error Handling

- Source processing failures don't block strategic analysis
- Empty source lists show helpful "Start Analysis" prompt
- Invalid/malformed sources are filtered by Gemini
- Errors logged to console with context

## Configuration

**Model:** Gemini 2.0 Flash Experimental
**Temperature:** 0.3 (for consistent categorization)
**Max Tokens:** 4096
**Response Format:** JSON

## Dependencies

- `@google/generative-ai` - Gemini API client
- Zustand store - State management
- Pipeline system - Token tracking
- Next.js API routes - Backend endpoints
