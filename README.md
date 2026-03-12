# 🔥 StreaksApp

> Track every habit. See your momentum grow.

A beautiful, mobile-first habit tracker with GitHub-style heatmaps, a leaderboard, and sync across all your devices.

**Color palette:** `#EBF4F6` · `#7AB2B2` · `#088395` · `#09637E`
**Stack:** Next.js 14 · Firebase · Vercel (free)

---

## ✨ Features

- **Central heatmap** — 52-week micro-grid showing your combined habit completion rate
- **Individual heatmaps** — Per-habit heatmaps with accent colors
- **Today checklist** — Tap to complete with a satisfying pop animation
- **Recurring schedules** — Daily, specific days of week, or X times per week
- **Dark / Light mode** — Soft charcoal dark, crisp light
- **Leaderboard** — See your circle's streaks, add friends
- **Google + Facebook login** — Sync across Android, iPhone, any device
- **CSV export/import** — Own your data
- **Share as Story** — Generate a 9:16 recap image for Instagram/WhatsApp

---

## 🚀 Setup in ~15 minutes

### Step 1 — Clone and install

```bash
git clone <your-repo>
cd streaks
npm install
```

### Step 2 — Create a Firebase project (free)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → name it `streaks` → Continue (disable analytics is fine)
3. Once created:

#### Enable Authentication
- Left sidebar → **Build → Authentication → Get started**
- Click **"Sign-in method"** tab
- Enable **Google** — add your project support email → Save
- Enable **Facebook**:
  - You'll need a Facebook App. Go to [developers.facebook.com](https://developers.facebook.com)
  - Create an app → Consumer → add Facebook Login product
  - Copy your App ID and App Secret into Firebase
  - In Facebook App settings, add the OAuth redirect URI that Firebase shows you

> 💡 **Just want Google login?** That's totally fine — Facebook is optional. Skip Facebook setup.

#### Create Firestore Database
- Left sidebar → **Build → Firestore Database → Create database**
- Choose **"Start in production mode"** → pick your region → Done
- Go to **Rules** tab → replace content with the `firestore.rules` file from this project → Publish

#### Get your config keys
- Click the ⚙️ gear icon → **Project settings**
- Scroll to **"Your apps"** → click the web icon `</>`
- Register app (nickname: "streaks-web") → **don't** enable Firebase Hosting
- Copy the `firebaseConfig` object values

### Step 3 — Environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Firebase values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 4 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Streaks login screen.

### Step 5 — Deploy to Vercel (free, takes 2 minutes)

1. Push your code to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → sign up free with GitHub
3. Click **"New Project"** → import your repo
4. In **"Environment Variables"**, add all the `NEXT_PUBLIC_FIREBASE_*` variables
5. Click **Deploy** ✓

Your app will be live at `https://streaks-xxx.vercel.app`

> **Custom domain?** Vercel lets you connect a custom domain for free. Just add it in Project Settings → Domains.

#### Fix Firebase authorized domains
After deployment, add your Vercel URL to Firebase:
- Firebase Console → Authentication → Settings → **Authorized domains**
- Add `streaks-xxx.vercel.app` (your Vercel URL)

---

## 📱 Add to Home Screen (make it feel native)

**iPhone (Safari):** Open your Vercel URL → tap the Share button → "Add to Home Screen"

**Android (Chrome):** Open your Vercel URL → tap the three dots → "Add to Home Screen"

Once added, it runs in fullscreen with no browser UI — just like a native app.

---

## 📊 Firestore indexes needed

For the completions query to work efficiently, create this composite index:

Firebase Console → Firestore → Indexes → Add composite index:

| Collection | Fields | Order |
|------------|--------|-------|
| completions | userId (Asc), date (Asc) | — |
| habits | userId (Asc), archived (Asc), order (Asc) | — |

Firebase will also prompt you in the browser console if any indexes are missing — just click the link.

---

## 🎨 Customization

### Colors
Edit `app/globals.css` — change the CSS variables:
```css
:root {
  --teal: #088395;  /* your primary color */
  --deep: #09637E;
  ...
}
```

### Fonts
Edit `app/layout.tsx` — change the Google Fonts import and `app/globals.css` font variables.

### App name
Edit `app/layout.tsx` → metadata title.

---

## 💰 Cost

**Everything is free:**

| Service | Free tier |
|---------|-----------|
| Vercel | Unlimited deployments, 100GB bandwidth/month |
| Firebase Auth | 10,000 sign-ins/month |
| Firestore | 50,000 reads/day, 20,000 writes/day, 1GB storage |

For personal use with a few friends, you'll never hit these limits.

---

## 🛠 Tech stack

- **Next.js 14** (App Router, TypeScript)
- **Firebase** (Authentication + Firestore)
- **Tailwind CSS** + CSS custom properties
- **date-fns** for date math
- **Framer Motion** (coming in v1.1)
- **react-hot-toast** for notifications

---

Made with 🩵 for Nafim & friends
