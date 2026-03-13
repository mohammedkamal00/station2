<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2c910a8c-b8a8-43d5-8e94-0cc9a15e31ec

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a Supabase project.
3. Run the SQL in [supabase/schema.sql](supabase/schema.sql) inside the Supabase SQL editor.
4. Set the Supabase values in [.env.local](.env.local):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Optional: set the `GEMINI_API_KEY` in [.env.local](.env.local) if you use Gemini features.
6. Run the app:
   `npm run dev`

## Data storage

The app now reads and writes ledger data directly from Supabase instead of the local SQLite database.
