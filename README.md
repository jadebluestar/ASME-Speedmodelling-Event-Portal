# 🏁 Speed Modeling Competition Management System

A complete web-based system for managing CAD speed modeling competitions with real-time leaderboards, timer synchronization, and file submissions.

## 📋 Features

- **Dual Login System**: Separate admin and participant portals
- **Real-time Timer**: Synchronized across all users
- **File Upload**: Support for multiple CAD formats
- **Live Leaderboard**: Auto-updating rankings
- **Competition Control**: Start, pause, and stop functionality
- **CSV Export**: Download competition results
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🗂️ Project Structure

```
speedportal/
│
├── public/
│   ├── index.html          # Login page
│   ├── admin.html          # Admin dashboard
│   ├── participant.html    # Participant dashboard
│   ├── leaderboard.html    # Public leaderboard
│   └── styles.css          # Global styling
│
├── src/
│   ├── supabase.js         # Supabase configuration
│   ├── index.js            # Login logic
│   ├── admin.js            # Admin functionality
│   ├── participant.js      # Participant functionality
│   ├── leaderboard.js      # Leaderboard updates
│   └── utils.js            # Helper functions
│
└── README.md
```

## 🚀 Quick Start

### 1. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings > API**
3. Copy your **Project URL** and **anon public key**

### 2. Configure Database

Run this SQL in your Supabase SQL Editor:

```sql
-- Create admins table
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin (username: admin, password: admin123)
INSERT INTO admins (username, password) VALUES ('admin', 'admin123');

-- Create participants table
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  college TEXT NOT NULL,
  submitted_weight FLOAT,
  file_url TEXT,
  score FLOAT DEFAULT 0,
  time_submitted TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create competitions table
CREATE TABLE competitions (
  id INTEGER PRIMARY KEY,
  name TEXT DEFAULT 'Speed Modeling Competition',
  round INTEGER DEFAULT 1,
  reference_weight FLOAT,
  tolerance FLOAT DEFAULT 5,
  material TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMP,
  drawing_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default competition
INSERT INTO competitions (id, name, round) 
VALUES (1, 'Speed Modeling Competition', 1);
```

### 3. Setup Storage

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Name it `submissions`
4. Make it **Public** (or set policies as shown below)

#### Storage Policies

Run this SQL to allow file uploads:

```sql
-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'submissions');

-- Allow uploads
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'submissions');

-- Allow updates
CREATE POLICY "Allow updates"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'submissions');
```

### 4. Enable Realtime (Recommended)

1. Go to **Database > Replication**
2. Enable realtime for:
   - `participants`
   - `competitions`

### 5. Configure Application

Edit `src/supabase.js` and replace placeholders:

```javascript
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";
```

### 6. Run the Application

#### Option A: Local Server (Recommended)

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open: `http://localhost:8000/public/index.html`

#### Option B: Live Server (VS Code)

1. Install "Live Server" extension
2. Right-click on `public/index.html`
3. Select "Open with Live Server"

## 👥 User Guide

### For Admins

**Default Login:**
- Username: `admin`
- Password: `admin123`

**Dashboard Features:**
1. **Material & Weight**: Enter reference values before starting
2. **START**: Begin the competition (activates timer for all)
3. **PAUSE**: Temporarily pause the timer
4. **STOP**: End competition and disable submissions
5. **Upload Drawing**: Share reference CAD drawing
6. **Leaderboard**: View all submissions in real-time
7. **Export**: Download results as CSV

### For Participants

**First Time:**
1. Click "Login" → "Participant Login"
2. Enter your name, college email, and college name
3. Click "Login" (account created automatically)

**During Competition:**
1. Wait for admin to start
2. Timer will begin automatically
3. Upload your CAD file
4. Timer stops on submission
5. View your rank on the leaderboard

### Public Leaderboard

Access `leaderboard.html` directly for a display-only view perfect for projection screens.

## 🎯 Competition Workflow

1. **Admin** logs in and sets material + reference weight
2. **Participants** log in and wait
3. **Admin** clicks START
4. **All participants** see timer begin simultaneously
5. **Participants** upload CAD files
6. **Leaderboard** updates in real-time
7. **Admin** stops competition and exports results

## 🔧 Customization

### Change Color Scheme

Edit `styles.css`:

```css
.orange-btn { background-color: #your-color; }
.orange-background { background-color: #your-color; }
```

### Adjust Scoring

Edit `utils.js` → `calculateScore()` function:

```javascript
function calculateScore(submitted, reference, tolerance = 5) {
  // Customize scoring logic here
}
```

### Add More Admin Users

Run SQL in Supabase:

```sql
INSERT INTO admins (username, password) 
VALUES ('newadmin', 'securepassword');
```

## 🐛 Troubleshooting

### Login Not Working

1. Check browser console for errors
2. Verify Supabase credentials in `supabase.js`
3. Ensure tables exist in Supabase dashboard
4. Check if admin exists: `SELECT * FROM admins;`

### Timer Not Syncing

1. Enable Realtime in Supabase (Database > Replication)
2. Check browser console for subscription errors
3. Ensure `competitions` table has realtime enabled

### File Upload Fails

1. Verify storage bucket `submissions` exists
2. Check bucket is PUBLIC or has correct policies
3. Ensure file size < 50MB
4. Check accepted formats in `utils.js` → `pickFile()`

### Leaderboard Not Updating

1. Enable Realtime for `participants` table
2. Check browser console for errors
3. Try manual refresh button
4. Verify data exists: `SELECT * FROM participants;`

## 📱 Mobile Support

The system is fully responsive:
- Login screens adapt to mobile
- Dashboard layouts stack vertically
- Buttons remain touch-friendly
- Leaderboard scrolls horizontally if needed

## 🔐 Security Notes

⚠️ **For Production Use:**

1. **Never store passwords in plain text**
   - Use Supabase Auth instead
   - Or hash passwords using bcrypt

2. **Add Row Level Security (RLS)**
   ```sql
   ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can only update own data"
   ON participants FOR UPDATE
   TO public
   USING (email = current_setting('request.jwt.claims')::json->>'email');
   ```

3. **Validate file uploads**
   - Check file types server-side
   - Scan for malware
   - Limit file sizes

4. **Use environment variables**
   - Don't commit Supabase keys to Git
   - Use `.env` files

## 📊 Database Schema

### Tables Overview

**admins**
- `id` (UUID, Primary Key)
- `username` (Text, Unique)
- `password` (Text)
- `created_at` (Timestamp)

**participants**
- `id` (UUID, Primary Key)
- `name` (Text)
- `email` (Text, Unique)
- `college` (Text)
- `submitted_weight` (Float)
- `file_url` (Text)
- `score` (Float)
- `time_submitted` (Timestamp)
- `created_at` (Timestamp)

**competitions**
- `id` (Integer, Primary Key)
- `name` (Text)
- `round` (Integer)
- `reference_weight` (Float)
- `tolerance` (Float)
- `material` (Text)
- `is_active` (Boolean)
- `start_time` (Timestamp)
- `drawing_url` (Text)
- `created_at` (Timestamp)

## 🎨 Supported CAD Formats

- `.step` - STEP files
- `.iges` - IGES files
- `.sldprt` - SolidWorks Parts
- `.stl` - STL files
- `.obj` - Wavefront OBJ
- `.ipt` - Autodesk Inventor Parts
- `.iam` - Inventor Assemblies
- `.dwg` - AutoCAD Drawings
- `.dxf` - Drawing Exchange Format
- `.zip` / `.rar` - Compressed files

## 🚀 Performance Tips

1. **Enable Supabase CDN** for faster file downloads
2. **Use indexes** on frequently queried columns:
   ```sql
   CREATE INDEX idx_participants_email ON participants(email);
   CREATE INDEX idx_participants_score ON participants(score DESC);
   ```
3. **Optimize realtime** by only subscribing to needed events
4. **Cache static assets** using service workers

## 📝 Future Enhancements

- [ ] Automatic scoring based on CAD analysis
- [ ] Multi-round competition support
- [ ] Team-based competitions
- [ ] Live video feed integration
- [ ] Mobile app versions
- [ ] Judge scoring interface
- [ ] Automated email notifications
- [ ] Competition history/archives

## 🤝 Contributing

Feel free to fork and customize this system for your events!

## 📄 License

MIT License - Use freely for educational and commercial purposes.

## 💬 Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase configuration
3. Review troubleshooting section above
4. Check Supabase dashboard for data

---

**Built for EFx KLSGIT Speed Modeling Events** 🏆