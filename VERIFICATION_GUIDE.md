# Verification Guide for Python Backend Integration

This guide outlines the steps to verify the new Python backend integration for the "Optimize for AI Search" workflow.

## Pre-requisites
1.  **Python Backend**: Ensure the backend is running at `http://localhost:8000`.
    ```bash
    # In GodsEye - Bridge Backend Code/Pavan-main/Pavan-main/
    uvicorn app.main:app --reload --port 8000
    ```
2.  **Frontend**: The Next.js app should be running (`npm run dev`).
3.  **Feature Flag**: 
    -   To use the **Python Backend**, set `NEXT_PUBLIC_ENABLE_PYTHON_BACKEND=true` in `.env.local`.
    -   To use the **Legacy Logic**, set `NEXT_PUBLIC_ENABLE_PYTHON_BACKEND=false`.

## Verification Steps

### 1. Verify Credit Check (Critical Security Step)
*   **Goal**: Ensure credits are checked *before* any backend call.
*   **Action**: 
    1.  Select a product and some queries in the frontend.
    2.  Manually set your user's credits to `0` in the database.
    3.  Click "Optimize for AI Search".
*   **Expected Result**: You should immediately see an "Insufficient credits" error message. The network tab should show **no** requests to `localhost:8000/api/v1/optimize/start`.

### 2. Verify Legacy Flow (Regression Test)
*   **Goal**: Ensure the old system still works when the flag is off.
*   **Action**:
    1.  Set `NEXT_PUBLIC_ENABLE_PYTHON_BACKEND=false`.
    2.  Restart frontend (to load env vars).
    3.  Run a standard optimization.
*   **Expected Result**: The process should run entirely via the frontend logic (check console for `[Feature Flag] Using legacy frontend logic...`).

### 3. Verify Python Backend Flow (New Feature)
*   **Goal**: Ensure the new backend works end-to-end.
*   **Action**:
    1.  Set `NEXT_PUBLIC_ENABLE_PYTHON_BACKEND=true`.
    2.  Restart frontend.
    3.  Run an optimization.
*   **Expected Result**:
    -   Console should log `[Feature Flag] Using Python backend...`.
    -   Network tab should show a POST to `.../optimize/start`.
    -   Network tab should show repeated GET requests to `.../optimize/status/{id}` (polling).
    -   Once completed, you should be redirected to the results page.
    -   Credits should be deducted from your account.

## Troubleshooting
-   **CORS Errors**: If you see CORS errors in the console, ensure the Python backend allows requests from `localhost:3000`.
-   **Timeout**: If it hangs on "Analyzing...", check the Python backend terminal for errors.
