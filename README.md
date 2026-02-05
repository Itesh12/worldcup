# Cricket Match Platform

A premium Cricket Match Platform built with Next.js, MongoDB, and NextAuth.js. This platform allows users to be assigned to batting slots and tracks their performance live based on real match data.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- Cricket Live API Key (Mock used by default)

### 2. Environment Setup
Create a `.env.local` file in the root directory and add the following:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/worldcup

# NextAuth
NEXTAUTH_SECRET=your-very-secret-key-change-this
NEXTAUTH_URL=http://localhost:3000

# External APIs
CRICKET_API_KEY=your-cricket-api-key # Optional: Project uses mock data by default
CRON_SECRET=your-cron-secret-for-sync

---

### ℹ️ Note on Mock Data
The project currently uses a mock client (`src/lib/cricketApi.ts`) to simulate match scores. You do **not** need a real API key to test the functionality. 

To integrate real data later, you can get a key from:
- [RapidAPI](https://rapidapi.com/collection/cricket-api)
- [CricAPI](https://www.cricapi.com/)
- [EntitySport](https://www.entitysport.com/)
```

### 3. Installation
```bash
npm install
```

### 4. Running Locally
```bash
npm run dev
```

---

## 🧪 Testing Workflow

### 1. Seed Initial Data
To set up the admin and test player accounts, run the following (ensure the server is running):
```bash
curl -X POST http://localhost:3000/api/seed
```
- **Admin**: `admin@worldcup.com` / `admin123`
- **Player**: `player@worldcup.com` / `player123`

### 2. Admin Setup
1. Login with Admin credentials.
2. Navigate to `/admin/matches`.
3. Click **"Sync Matches"** to fetch fixtures.
4. Select a match and click **"View Slots / Assign"**.
5. Generate slots and assign the "Test Player" to positions.

### 3. Simulate Live Sync
Run the sync engine to update scores for live matches:
```bash
curl http://localhost:3000/api/sync
```
*(Note: In production, this should be triggered via a Cron Job with the `CRON_SECRET` header).*

### 4. Verify Leaderboard
- Visit the Home page (`/`) to see your assigned slots.
- Visit `/leaderboard` to see global rankings update as scores change.

---

## 🛠 Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Lucide Icons
- **Database**: MongoDB (Mongoose)
- **Auth**: NextAuth.js (Credentials Provider)
- **Real-time**: Polling with intelligent delta updates
