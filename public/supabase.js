/**
 * speedportal/src/supabase.js
 * Supabase client initialization
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://supabase.com and create a new project
 * 2. Get your project URL and anon key from Settings > API
 * 3. Replace the placeholders below with your actual credentials
 * 4. Create the required tables and storage bucket (see schema below)
 */

// ⚠️ REPLACE THESE WITH YOUR ACTUAL SUPABASE CREDENTIALS ⚠️
const SUPABASE_URL = "https://lgulbvojlfnlxgxvwtio.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndWxidm9qbGZubHhneHZ3dGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzODY2NDEsImV4cCI6MjA3Njk2MjY0MX0.p0EFVcpDNK4lFMv_ZDbYKs6rICaH4fQXc9fOqQM951E";

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * REQUIRED SUPABASE SETUP:
 * 
 * 1. Create Tables (SQL):
 * 
 * -- Admins table
 * CREATE TABLE admins (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   username TEXT UNIQUE NOT NULL,
 *   password TEXT NOT NULL,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * -- Insert default admin
 * INSERT INTO admins (username, password) VALUES ('admin', 'admin123');
 * 
 * -- Participants table
 * CREATE TABLE participants (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   email TEXT UNIQUE NOT NULL,
 *   college TEXT NOT NULL,
 *   submitted_weight FLOAT,
 *   file_url TEXT,
 *   score FLOAT DEFAULT 0,
 *   time_submitted TIMESTAMP,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * -- Competitions table
 * CREATE TABLE competitions (
 *   id INTEGER PRIMARY KEY,
 *   name TEXT DEFAULT 'Speed Modeling Competition',
 *   round INTEGER DEFAULT 1,
 *   reference_weight FLOAT,
 *   tolerance FLOAT DEFAULT 5,
 *   material TEXT,
 *   is_active BOOLEAN DEFAULT FALSE,
 *   start_time TIMESTAMP,
 *   drawing_url TEXT,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * -- Insert default competition
 * INSERT INTO competitions (id, name, round) VALUES (1, 'Speed Modeling Competition', 1);
 * 
 * 
 * 2. Create Storage Bucket:
 *    - Go to Storage in Supabase dashboard
 *    - Create a new bucket called "submissions"
 *    - Set it to PUBLIC or configure appropriate policies
 * 
 * 
 * 3. Enable Realtime (optional but recommended):
 *    - Go to Database > Replication
 *    - Enable realtime for: participants, competitions
 * 
 * 
 * 4. Storage Policies (for "submissions" bucket):
 * 
 * -- Allow public read access
 * CREATE POLICY "Public read access"
 * ON storage.objects FOR SELECT
 * TO public
 * USING (bucket_id = 'submissions');
 * 
 * -- Allow authenticated uploads
 * CREATE POLICY "Allow uploads"
 * ON storage.objects FOR INSERT
 * TO public
 * WITH CHECK (bucket_id = 'submissions');
 */

// Test connection (optional - for debugging)

async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('❌ Supabase connection error:', error);
            return false;
        }
        
        console.log('✅ Supabase connected successfully');
        return true;
    } catch (err) {
        console.error('❌ Supabase connection failed:', err);
        return false;
    }
}

// Uncomment to test connection on page load
testConnection();