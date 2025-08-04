# PS4 - Cash

## Project Overview
A PlayStation session management and cashier system built with Next.js, React, and Supabase.

## Supabase Integration
This project uses [Supabase](https://supabase.com/) as its backend for real-time data and authentication.

### Required Tables

#### 1. `controllers_inventory`
| Column      | Type      | Description                        |
|-------------|-----------|------------------------------------|
| id          | integer   | Primary key (set to 1 for single row)|
| total       | integer   | Total controllers                  |
| out         | integer   | Controllers out                    |
| updated_at  | timestamp | Last update                        |

#### 2. `consoles`
| Column | Type  | Description                |
|--------|-------|----------------------------|
| id     | uuid  | Primary key                |
| name   | text  | Console name (e.g. PS4)    |
| color  | text  | Color for UI               |
| icon   | text  | Icon name (optional)       |

#### 3. `sessions`
| Column       | Type      | Description                |
|--------------|-----------|----------------------------|
| id           | uuid      | Primary key                |
| console_name | text      | Console name (e.g. PS4)    |
| start_time   | timestamp | Session start              |
| end_time     | timestamp | Session end                |
| duration     | float     | Duration in hours          |
| price        | float     | Session price              |
| created_at   | timestamp | Created at                 |
| status       | text      | 'running' or 'completed'   |

## Environment Variables
Create a `.env.local` file in the root directory with:

```
NEXT_PUBLIC_SUPABASE_URL=https://efygepsnvejtyrbhjtpk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmeWdlcHNudmVqdHlyYmhqdHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODM4NTAsImV4cCI6MjA2OTg1OTg1MH0.gQKwCzJu9auOSZgDolHOenWHNiDmO57fmSx4KNfxoio
```

## Setup & Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Make sure your Supabase tables are set up as described above.

## Features
- Real-time session tracking for each console
- Controller inventory management
- Shift reports and PDF export
- All data is persistent and synced with Supabase

## Notes
- Timers and sessions are persistent: if you close and reopen the site, timers continue from the last state.
- All actions (add, delete, update) are reflected in real-time.
