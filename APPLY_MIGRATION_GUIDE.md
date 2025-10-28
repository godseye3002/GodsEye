# Quick Migration Guide: Add Source Links to Database

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your GodsEye project

### 2. Navigate to SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New Query" button

### 3. Copy Migration SQL
- Open file: `supabase/migrations/add_source_links.sql`
- Copy the entire contents (Ctrl+A, Ctrl+C)

### 4. Paste and Execute
- Paste the SQL into the Supabase SQL Editor
- Click "Run" button (or press Ctrl+Enter)
- Wait for success message

### 5. Verify Migration
Run this verification query in SQL Editor:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('source_links', 'processed_sources');
```

**Expected Result:**
| column_name | data_type | column_default |
|------------|-----------|----------------|
| source_links | jsonb | '[]'::jsonb |
| processed_sources | jsonb | '[]'::jsonb |

### 6. Test the Implementation
1. Run a product analysis in your app
2. Check browser console for:
   - `[Source Links] Stored X raw source links`
   - `[Process Sources] Stored X processed sources`
3. Navigate to `/visibility` page
4. Verify sources are displayed
5. Check Supabase database:
   ```sql
   SELECT 
     product_name,
     jsonb_array_length(source_links) as raw_sources,
     jsonb_array_length(processed_sources) as filtered_sources
   FROM products
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## What This Migration Does

✅ Adds `source_links` column (JSONB) to store raw AI search sources  
✅ Adds `processed_sources` column (JSONB) to store filtered third-party sites  
✅ Creates GIN indexes for efficient JSONB queries  
✅ Sets default values to empty arrays  
✅ Adds documentation comments

## Rollback (If Needed)

If you need to undo this migration:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_products_source_links;
DROP INDEX IF EXISTS idx_products_processed_sources;

-- Remove columns
ALTER TABLE public.products DROP COLUMN IF EXISTS source_links;
ALTER TABLE public.products DROP COLUMN IF EXISTS processed_sources;
```

## Troubleshooting

### Error: "column already exists"
- Migration was already applied
- Run verification query to confirm columns exist
- No action needed

### Error: "permission denied"
- Ensure you're using the correct Supabase project
- Check you have admin/owner access
- Try using service role key if available

### Error: "relation does not exist"
- Verify `products` table exists
- Check you're connected to the correct database
- Run main schema.sql first if needed

## Next Steps

After successful migration:
1. ✅ Columns are ready
2. ✅ Code is already updated
3. ✅ Run an analysis to test
4. ✅ Check visibility page
5. ✅ Review stored data in Supabase

## Support

If you encounter issues:
1. Check `SOURCE_LINKS_IMPLEMENTATION.md` for detailed documentation
2. Review console logs for error messages
3. Verify all code changes were applied
4. Check Supabase logs in dashboard

---

**Migration Status:** Ready to apply  
**Estimated Time:** < 1 minute  
**Risk Level:** Low (only adds columns, doesn't modify existing data)  
**Reversible:** Yes (see rollback section)
