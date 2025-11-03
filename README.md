
  # Revamp Competition Platform Design

  This is a code bundle for Revamp Competition Platform Design. The original project is available at https://www.figma.com/design/pAq2UMTb8MLravhxpw3Dco/Revamp-Competition-Platform-Design.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
  ## Supabase setup

  1. Copy `.env.example` to `.env` in the project root and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
  2. Create a `leaderboard` table and a `submissions` table in Supabase (simple columns: id, participant_id, name, weight, score, created_at).
  3. Optionally create a Storage bucket (name from `VITE_SUPABASE_STORAGE_BUCKET`) for submission files and drawings.

  After configuration run `npm i` then `npm run dev`.
  