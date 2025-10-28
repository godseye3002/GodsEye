# Source Links Database Implementation

## Overview
Complete professional implementation for storing raw source links and processed third-party sources in the Supabase database.

---

## 1. Database Schema Changes

### Migration File
**Location:** `supabase/migrations/add_source_links.sql`

### New Columns Added to `products` Table

| Column Name | Type | Default | Description |
|------------|------|---------|-------------|
| `source_links` | JSONB | `[]` | Raw source links from AI search engines (all sources before filtering) |
| `processed_sources` | JSONB | `[]` | Filtered and categorized third-party sources (excludes social media, marketplaces, competitors) |

### Indexes Created
- `idx_products_source_links` - GIN index for efficient JSONB queries on source_links
- `idx_products_processed_sources` - GIN index for efficient JSONB queries on processed_sources

### How to Apply Migration
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/add_source_links.sql`
4. Click "Run" to execute

### Verification Query
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('source_links', 'processed_sources');
```

---

## 2. Type Definitions

### Location: `app/optimize/types.ts`

### New Interfaces

```typescript
export interface SourceLink {
  text: string;
  url: string;
  raw_url: string;
  highlight_fragment: string | null;
  related_claim: string;
  extraction_order: number;
}

export interface ProcessedSource {
  name: string;
  url: string;
  description: string;
  category?: string;
}
```

### Updated Interface

```typescript
export interface OptimizedProduct extends OptimizedProductSummary {
  formData: ProductFormData;
  analysis?: OptimizationAnalysis | null;
  sourceLinks?: SourceLink[];        // NEW
  processedSources?: ProcessedSource[]; // NEW
}
```

---

## 3. State Management (Zustand Store)

### Location: `app/optimize/store.ts`

### New State Properties

```typescript
interface ProductStoreState {
  // ... existing properties
  processedSources: ProcessedSource[];
  sourceLinks: any[];
  
  // ... existing methods
  setProcessedSources: (sources: ProcessedSource[]) => void;
  setSourceLinks: (links: any[]) => void;
}
```

### Initial State
```typescript
{
  processedSources: [],
  sourceLinks: [],
}
```

### Methods
- `setProcessedSources(sources)` - Store filtered third-party sources
- `setSourceLinks(links)` - Store raw source links from scraper

---

## 4. API Route Updates

### Location: `app/api/products/route.ts`

### POST Endpoint Changes

**Added to insert payload:**
```typescript
{
  // ... existing fields
  source_links: productData.source_links || [],
  processed_sources: productData.processed_sources || [],
}
```

### Data Flow
```
Client → POST /api/products → Supabase products table
```

---

## 5. Client-Side Integration

### Location: `app/optimize/page.tsx`

### Store Integration

**Destructured from store:**
```typescript
const {
  // ... existing
  setProcessedSources,
  setSourceLinks,
  sourceLinks,
  processedSources,
} = useProductStore();
```

### Data Capture Flow

**Step 1: Capture Raw Source Links**
```typescript
// After scraper response
if (scraperResponse.source_links && Array.isArray(scraperResponse.source_links)) {
  setSourceLinks(scraperResponse.source_links);
  console.log(`[Source Links] Stored ${scraperResponse.source_links.length} raw source links`);
}
```

**Step 2: Process and Filter Sources**
```typescript
// Parallel with strategic analysis
const [analysisResponse, sourcesResponse] = await Promise.all([
  fetch('/api/strategic-analysis', {...}),
  fetch('/api/process-sources', {
    body: JSON.stringify({
      sourceLinks: scraperResponse.source_links || [],
      analysisId,
      pipeline: DEFAULT_PIPELINE,
    }),
  }),
]);

// Store processed sources
if (sourcesResponse.ok) {
  const sourcesData = await sourcesResponse.json();
  if (sourcesData.success && sourcesData.sources) {
    setProcessedSources(sourcesData.sources);
  }
}
```

**Step 3: Include in Product Record**
```typescript
const createProductRecord = (analysisData) => {
  return {
    // ... existing fields
    sourceLinks: sourceLinks || [],
    processedSources: processedSources || [],
  };
};
```

**Step 4: Save to Database**
```typescript
await saveProductToSupabase(productRecord, user.id, query);
```

---

## 6. Store Methods Updates

### Location: `app/optimize/store.ts`

### saveProductToSupabase
**Updated to include source data:**
```typescript
body: JSON.stringify({
  // ... existing fields
  source_links: product.sourceLinks || [],
  processed_sources: product.processedSources || [],
})
```

### loadProductsFromSupabase
**Updated to restore source data:**
```typescript
{
  // ... existing fields
  sourceLinks: p.source_links || [],
  processedSources: p.processed_sources || [],
}
```

---

## 7. Data Structure Examples

### Raw Source Links (from Scraper)
```json
[
  {
    "text": "Visure Solutions",
    "url": "https://visuresolutions.com/alm-guide/best-tender-management-tools/",
    "raw_url": "https://visuresolutions.com/alm-guide/best-tender-management-tools/",
    "highlight_fragment": null,
    "related_claim": "Best tender management tools",
    "extraction_order": 1
  }
]
```

### Processed Sources (from Gemini)
```json
[
  {
    "name": "Visure Solutions - Best Tender Management Tools",
    "url": "https://visuresolutions.com/alm-guide/best-tender-management-tools/",
    "description": "Industry publication providing comprehensive guides on tender management software and tools.",
    "category": "Industry Publication"
  }
]
```

---

## 8. Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Submits Product for Analysis                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Generate Search Query (Gemini API)                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Call Perplexity Scraper                                  │
│    → Returns: answer, source_links[], related_questions     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Store Raw Source Links in State                          │
│    setSourceLinks(scraperResponse.source_links)             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Parallel Processing:                                     │
│    ├─ Strategic Analysis (Gemini 2.5 Pro)                   │
│    └─ Process Sources (Gemini 2.0 Flash)                    │
│       → Filters social media, marketplaces, competitors     │
│       → Categorizes remaining sources                       │
│       → Generates descriptions                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Store Processed Sources in State                         │
│    setProcessedSources(sourcesData.sources)                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Create Product Record                                    │
│    → Includes: formData, analysis, sourceLinks,             │
│                processedSources                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Save to Supabase                                         │
│    POST /api/products                                       │
│    → Stores in products table with JSONB columns            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Display on Visibility Page                               │
│    → Shows processedSources from store                      │
│    → Each source: name, URL, description                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Benefits

### Data Persistence
- ✅ Raw source links preserved for audit/debugging
- ✅ Processed sources stored for quick retrieval
- ✅ No need to re-process sources when loading products

### Performance
- ✅ JSONB columns with GIN indexes for fast queries
- ✅ Efficient storage of nested data structures
- ✅ No additional tables needed

### Flexibility
- ✅ Easy to add new fields to source objects
- ✅ Can query specific sources using JSONB operators
- ✅ Supports complex filtering and aggregation

### User Experience
- ✅ Visibility page shows real data immediately
- ✅ Historical analysis includes source context
- ✅ Users can see which sites AI engines trust

---

## 10. Query Examples

### Get Products with Specific Source
```sql
SELECT * FROM products 
WHERE processed_sources @> '[{"category": "Industry Publication"}]'::jsonb;
```

### Count Sources per Product
```sql
SELECT 
  product_name,
  jsonb_array_length(source_links) as raw_count,
  jsonb_array_length(processed_sources) as filtered_count
FROM products;
```

### Find Products Citing Specific Domain
```sql
SELECT * FROM products 
WHERE source_links::text LIKE '%visuresolutions.com%';
```

---

## 11. Testing Checklist

- [ ] Run migration SQL in Supabase
- [ ] Verify columns exist with correct types
- [ ] Run full analysis flow
- [ ] Check console logs for source storage
- [ ] Verify data saved to Supabase
- [ ] Load product and verify sources restored
- [ ] Check visibility page displays sources
- [ ] Test with empty/missing sources (graceful handling)

---

## 12. Future Enhancements

1. **Source Analytics**
   - Track which sources appear most frequently
   - Identify high-value third-party sites
   - Generate reports on source diversity

2. **Source Validation**
   - Check if URLs are still active
   - Validate domain authority scores
   - Flag broken or suspicious links

3. **Export Functionality**
   - Export source lists as CSV/PDF
   - Generate outreach templates
   - Create placement tracking sheets

4. **Historical Comparison**
   - Compare sources across analysis runs
   - Track changes in AI engine preferences
   - Identify trending authority sites

---

## 13. Troubleshooting

### Sources Not Saving
- Check browser console for errors
- Verify `sourceLinks` and `processedSources` are populated in state
- Check network tab for API call payload
- Verify Supabase columns exist

### Sources Not Loading
- Check `loadProductsFromSupabase` transformation
- Verify JSONB data structure in database
- Check for null/undefined handling

### Empty Processed Sources
- Verify `/api/process-sources` is being called
- Check Gemini API response
- Review filtering logic (may be too strict)
- Check console logs for processing errors

---

## Files Modified

1. ✅ `supabase/migrations/add_source_links.sql` - NEW
2. ✅ `app/optimize/types.ts` - Updated interfaces
3. ✅ `app/optimize/store.ts` - Added state & methods
4. ✅ `app/api/products/route.ts` - Added fields to POST
5. ✅ `app/optimize/page.tsx` - Capture & store sources
6. ✅ `SOURCE_LINKS_IMPLEMENTATION.md` - NEW (this file)

---

## Summary

This implementation provides a complete, professional solution for storing and managing source links in your GodsEye application. All source data is now persisted to the database, enabling historical tracking, analytics, and a richer user experience on the visibility page.

**Key Achievement:** Raw source links and processed third-party sources are now automatically saved with every product analysis and can be retrieved for display or further processing.
