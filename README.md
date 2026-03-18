# Shop Work Order App

A mobile-friendly, multi-user shop work order management system hosted on GitHub Pages with Firebase as the backend.

## Features

- **Active Queue** — real-time work order queue with priorities and statuses
- **Work Order Form** — preserved from original, with Firebase save and sequence numbering
- **Equipment Dashboard** — inspection progress tracking with per-type reset cycles
- **Searchable History** — search by WO#, unit, employee, keywords, date range
- **Admin Panel** — user management, invite codes, equipment list, checklist editor, CSV export
- **Editable Checklists** — admins can add/remove checklist types and items without code changes
- **Sequence Numbers** — globally unique WO numbers (WO-0001001) assigned at creation, concurrent-safe
- **Multi-tenant** — each company has isolated data in Firestore
- **White-label** — company name and logo configurable from the Settings page
- **GitHub Pages** — entirely static frontend, no server needed

---

## Setup Instructions

### Step 1 — Create Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add Project** → name it → disable Analytics → Create
3. In the left menu, go to **Build > Authentication** → Get Started → Enable **Email/Password**
4. Go to **Build > Firestore Database** → Create database → Start in **Test mode** → choose a region
5. Go to **Build > Storage** (optional, for future photo uploads)
6. On the Project Overview page, click the **Web icon (`</>`)** → Register app → name it
7. Copy the `firebaseConfig` object shown

### Step 2 — Configure the App

1. Open the app in your browser (or run locally with Live Server)
2. Navigate to **settings.html**
3. Paste each Firebase config value into the Firebase Configuration section
4. Enter your **Company Name** and a **Company ID** (e.g., `pineview-2026`, lowercase, no spaces)
5. Optionally enter a **Logo URL** for PDF reports
6. Click **Save Firebase Config** and **Save Company Settings**

### Step 3 — Create First Admin Account

1. Still on **settings.html**, scroll to **First-Time Admin Setup**
2. Enter your name, email, and password
3. Click **Create Admin Account**
4. You will be redirected to login

### Step 4 — Deploy Firestore Security Rules

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run `firebase login` and `firebase init firestore` in this project folder
3. Copy the contents of `firestore.rules` into your project
4. Run `firebase deploy --only firestore:rules`

> **Note:** Until you deploy the security rules, Firestore is in Test mode (open access for 30 days). Deploy rules before going live.

### Step 5 — Deploy to GitHub Pages

1. Push this entire folder to a GitHub repository
2. In the repo Settings → Pages → set source to **main branch / root**
3. Your app will be live at `https://yourusername.github.io/your-repo-name/`

### Step 6 — Add Workers

1. Log in as admin, go to **Admin → Users tab**
2. Click **Generate Invite Code**
3. Share the code with your worker
4. Worker goes to `register.html`, enters the code, creates their account

---

## App Structure

```
index.html              → Landing / redirect
login.html              → Login page
register.html           → Worker self-registration with invite code
new-work-order.html     → Work order form (edit & create)
queue.html              → Active shop queue (real-time)
history.html            → Searchable work order history
dashboard.html          → Equipment inspection dashboard
admin.html              → User management, equipment, checklists, export
settings.html           → Firebase config, company branding, Drive settings

js/
  firebase-init.js      → Firebase initialization from localStorage config
  auth.js               → Login, logout, registration, role checking
  db.js                 → All Firestore CRUD operations
  checklists.js         → Checklist definitions, rendering, data extraction
  nav.js                → Shared navigation bar

css/
  styles.css            → Shared styles and print styles

firestore.rules         → Firestore security rules (deploy via Firebase CLI)
```

---

## Work Order Number Format

Every work order gets a unique number at creation time:
- Display format: `WO-0001043`
- Concurrent-safe: uses Firestore transactions so two users can't get the same number
- Assigned on creation, not on completion — so drafts already have a reference number

---

## Checklist Editing

Admins can edit checklists without touching code:
1. Go to **Admin → Checklists tab**
2. Edit section names, item names, or add/remove items
3. Add entirely new equipment types with custom sections
4. Click **Save All** — workers see the new checklists on next page load
5. Custom checklists are stored per company in Firestore and override the built-in defaults

---

## Unit Number Matching

The `Unit # / Description` field is required on every work order but flexible:
- If the text matches a unit in your Equipment List, it links to that unit's history and inspection tracking
- If it doesn't match, it still saves as a valid work order (pump, hose, misc item, etc.)
- Matching happens automatically in the background — workers don't need to choose

---

## Multi-Company / Resale

To deploy for a new company:
1. Create a new Firebase project OR use the same project with a different **Company ID**
2. Go to settings.html on their browser and enter their Firebase credentials + Company ID
3. Each Company ID is a separate isolated namespace in Firestore
4. The app is fully white-label — logo, company name, and all data are per-company
