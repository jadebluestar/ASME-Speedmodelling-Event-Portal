
# ASME Speed Modeling Competition Platform

A modern React + TypeScript application for managing ASME speed modeling competitions. Built with Vite, Supabase, and Framer Motion.

##  Features

- **Role-Based Access**
  - Admin Dashboard with competition controls
  - Participant Dashboard with submission interface
  - Secure authentication and role management

- **Competition Management**
  - Real-time timer synchronization
  - Start/pause/resume/stop competition controls
  - Material type and reference weight settings
  - Live participant tracking

- **Submission Handling**
  - CAD file upload/download
  - Weight calculation submission
  - Automated scoring system
  - File validation and storage

- **Live Leaderboard**
  - Real-time updates
  - Score-based ranking
  - Animated new entries
  - CSV export functionality

- **Modern UI/UX**
  - Responsive design
  - Smooth animations
  - Dark theme
  - Loading states and error handling

##  Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Backend/Database**: Supabase
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **State Management**: React Hooks + Context
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **UI Components**: Radix UI

##  Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jadebluestar/ASME-Speedmodelling-Event-Portal.git
   cd ASME-Speedmodelling-Event-Portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase project URL and anon key in `.env`

4. Start the development server:
   ```bash
   npm run dev
   ```

##  Configuration

### Supabase Setup

1. Create tables in your Supabase project:
   - `participants`
   - `submissions`
   - `competition_status`
   - `leaderboard`

2. Enable realtime subscriptions for:
   - Competition status updates
   - Leaderboard changes
   - Participant tracking

3. Set up storage buckets for:
   - CAD drawings
   - Participant submissions

### Environment Variables

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_STORAGE_BUCKET=submissions
```

##  Usage

### Admin Dashboard

1. Login as admin
2. Set competition parameters (material type, reference weight)
3. Upload CAD drawing
4. Control competition flow (start/pause/stop)
5. Monitor submissions and export results

### Participant Dashboard

1. Register/login as participant
2. Download reference CAD drawing
3. Create 3D model and calculate weight
4. Submit model file and weight calculation
5. View live leaderboard and status

##  Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a pull request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by ASME Student Section, KLSGIT  ## Supabase setup

  1. Copy `.env.example` to `.env` in the project root and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
  2. Create a `leaderboard` table and a `submissions` table in Supabase (simple columns: id, participant_id, name, weight, score, created_at).
  3. Optionally create a Storage bucket (name from `VITE_SUPABASE_STORAGE_BUCKET`) for submission files and drawings.

  After configuration run `npm i` then `npm run dev`.
  