# advisorai.gr

**SaaS Orchestrator** που μετατρέπει conversational leads σε build-ready prompts, με AI sales assistant, proposals, πληρωμές και αυτοματοποιημένα build specs.

---

## Project Overview

Το **advisorai.gr** είναι πλατφόρμα που:

- Καταγράφει business problems μέσω **conversational flows** (chat).
- Παράγει **proposals και pricing** (Starter / Pro / Enterprise) με AI.
- Μετά την επιβεβαίωση πληρωμής (Stripe), παράγει **λεπτομερή τεχνικό πλάνο** (Technical Specs, User Stories, Style Guide) και το στέλνει σε builder endpoint και email.
- Διαχειρίζεται leads, συνομιλίες, proposals, build prompts και ειδοποιήσεις (Resend).

Χρήστες: επισκέπτες χωρίς login (public chat) και admin/operators με σύνδεση (dashboard).

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui, React Query |
| **Backend**  | NestJS (Node.js), TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **Payments** | Stripe (Checkout + Webhooks) |
| **Email**    | Resend |
| **AI**       | OpenAI (chat, proposal, build-prompt generation) |

---

## Prerequisites

- **Node.js** 20+
- **npm**
- **PostgreSQL** (τοπικά ή Docker)
- (Προαιρετικά) **Docker** για PostgreSQL ή για backend image

---

## Quick Start Guide

### 1. Clone & install

Από τη **ρίζα** του repository:

```bash
cd backend && npm install
cd ../frontend && npm install
```

(Ή: `cd backend && npm install` και σε νέο terminal `cd frontend && npm install`.)

### 2. Ρύθμιση `.env`

Δημιούργησε αρχείο **`backend/.env`** (αντγράφοντας από `config/env.example`) με τα απαραίτητα κλειδιά. Παράδειγμα για local dev:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/advisorai?schema=public"

# Backend
PORT=3001

# OpenAI (υποχρεωτικό για chat & proposals)
OPENAI_API_KEY="sk-..."
OPENAI_CHAT_MODEL="gpt-4o-mini"
OPENAI_PROPOSAL_MODEL="gpt-4o-mini"

# Stripe (για webhook μετά την πληρωμή)
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend – admin & customer notifications)
RESEND_API_KEY="re_..."
NOTIFICATION_FROM_EMAIL="AdvisorAI <noreply@yourdomain.com>"

# Frontend (στο frontend/.env.local)
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

Για **frontend**: δημιούργησε `frontend/.env.local` με μόνο το `NEXT_PUBLIC_API_URL=http://localhost:3001` (αν τρέχει το backend τοπικά).

### 3. Database: migrations & seed

Με τη **PostgreSQL** ενεργή:

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

**Supabase:** Χρησιμοποίησε πάντα το **pooler** (όχι το direct DB). Στο Free Plan το direct host είναι IPv6-only και δεν φτάνει από GitHub Actions. Για **migrations και CI** χρειάζεσαι **session mode** (όχι transaction): στο Dashboard → **Project Settings → Database** πάρε το connection string με **connection pooling** και χρησιμοποίησε **port 5432** (session mode) στο pooler host, π.χ. `aws-1-eu-west-2.pooler.supabase.com:5432` — **όχι** port 6543 (transaction mode), αλλιώς το `prisma migrate deploy` μπορεί να κολλάει πάνω από 7 λεπτά. Πρόσθεσε `?sslmode=require` και βάλ’ το ως `DATABASE_URL` (και στο GitHub secret). Για migrations: **`npm run prisma:migrate:deploy`**.

Το seed δημιουργεί **admin λογαριασμό**:

- **Email:** `nikosthanos@gmail.com`  
- **Password:** `N1k0$666!`  
- **Role:** ADMIN  

(Σύνδεση στο `/admin/login`.)

### 4. Τρέξιμο backend και frontend

**Terminal 1 – Backend:**

```bash
cd backend
npm run start:dev
```

(Backend: http://localhost:3001)

**Terminal 2 – Frontend:**

```bash
cd frontend
npm run dev
```

(Frontend: http://localhost:3000)

### 5. Σημεία εισόδου

- **Chat / Proposal:** http://localhost:3000/start  
- **Pricing:** http://localhost:3000/pricing  
- **Admin login:** http://localhost:3000/admin/login  
- **Dashboard (μετά login):** http://localhost:3000/app/dashboard  

Λεπτομέρειες και εναλλακτικά (Docker) στο **`scripts/start-local.md`**.

### Database: "Can't reach database server" (P1001)

Αν χρησιμοποιείς **Supabase** και βλέπεις:

```text
Error: P1001: Can't reach database server at `db.xxx.supabase.co:5432`
```

**Supabase (Free Plan): χρήση pooler (υποχρεωτικό) — session mode για migrations**  
Το direct DB host (`db.xxx.supabase.co`) είναι **IPv6-only**· GitHub Actions δεν μπορούν να συνδεθούν. Χρησιμοποίησε το **pooler**. Για **Prisma migrate** χρειάζεται **session mode** (port **5432**), όχι transaction (6543)· αλλιώς το migrate μπορεί να κολλάει πολλά λεπτά.

1. **Dashboard** → **Project Settings → Database** → **Connection string**.
2. Επίλεξε **"Use connection pooling"** και πάρε το host `aws-1-<region>.pooler.supabase.com` (ή παρόμοιο).
3. Για **migrations / CI:** χρησιμοποίησε **port 5432** (session mode). Μη χρησιμοποιείς port 6543 (transaction) για migrate.
4. Πρόσθεσε **`?sslmode=require`** και βάλ’ το ως **`DATABASE_URL`** (και στο GitHub Actions secret).

Παράδειγμα (session mode, για migrations):  
`postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:5432/postgres?sslmode=require`

Επιπλέον:

- **SSL:** Αν χρησιμοποιείς direct URL αλλού, πάντα **`?sslmode=require`**.
- **Paused project:** Free tier παύει μετά αδράνεια· στο Dashboard κάνε **Restore**.
- **Restrict connections:** Αν είναι ενεργό, τα runners μπορεί να μπλοκάρονται· disable ή allowlist αν χρειάζεται.

---

## Architecture Map

Ροή από συνομιλία μέχρι build prompt και ειδοποιήσεις:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Public Chat    │     │  Lead + Proposal │     │ Stripe Payment  │
│  /start         │────▶│  (AI proposal)  │────▶│ (Checkout)      │
│  AI Sales       │     │  Get Proposal   │     │ Webhook         │
│  Assistant      │     │  3 packages      │     │ checkout.       │
└─────────────────┘     └──────────────────┘     │ completed      │
                                                  └────────┬────────┘
                                                           │
                     ┌─────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Event: lead.confirmed → BuildPromptService.generateAndSend()      │
│  • AI Build Prompt (problem_summary + transcript + package)         │
│  • Αποθήκευση στο build_prompts, status → PROMPT_GENERATED          │
│  • (Optional) POST στο BUILDER_ENDPOINT → builder_runs              │
│  • Email: admin (payment notification) + customer (build prompt)    │
└─────────────────────────────────────────────────────────────────────┘
```

**Συνοπτικά:**

1. **Public Chat** – Ο επισκέπτης μιλάει με το AI στο `/start`, ζητά proposal και εμφανίζονται οι 3 κάρτες (Starter / Pro / Enterprise).
2. **Stripe Payment** – Επιλέγει πακέτο και ολοκληρώνει πληρωμή· το **Stripe webhook** (`checkout.session.completed`) ενημερώνει το lead σε **CONFIRMED** και πυροδοτεί το event `lead.confirmed`.
3. **AI Build Prompt** – Το listener καλεί `generateAndSend(leadId)`: παράγεται το τεχνικό πλάνο (Markdown) με AI, αποθηκεύεται στο `build_prompts`, ενημερώνεται το status σε **PROMPT_GENERATED**. Αν υπάρχει `BUILDER_ENDPOINT`, γίνεται POST και εγγραφή στο `builder_runs`.
4. **Email Notification** – Αμέσως μετά την πληρωμή στέλνεται email στο admin (Resend). Μετά τη δημιουργία του build prompt στέλνεται email στον πελάτη με το τεχνικό πλάνο.

---

## Deployment

Το **GitHub Actions** (`.github/workflows/main.yml`) τρέχει σε **push / PR στο `main`** και κάνει:

### CI (κάθε push/PR)

- **Backend:** `npm ci` → `npm run build` → `npm run lint` → `npm run test` (στο `backend/`).
- **Frontend:** `npm ci` → `npm run lint` → `npm run build` → `npm run test` (στο `frontend/`).

### CD (μόνο σε push στο `main`)

1. **Prisma Sync**  
   - Τρέχει `npx prisma migrate deploy` στο backend.  
   - Χρειάζεται GitHub secret: **`DATABASE_URL`** (production PostgreSQL). Για **Supabase** χρησιμοποίησε το **pooler session mode** URL (pooler host, **port 5432**, `?sslmode=require`), όχι 6543 ούτε direct `db.xxx.supabase.co` (βλ. P1001 / Supabase πάνω).

2. **Backend**  
   - Build Docker image από **`config/docker/Dockerfile.backend`**.  
   - Push στο **GitHub Container Registry** (`ghcr.io/<owner>/advisorai-backend:latest` και `@<sha>`).  
   - Για push στο GHCR (ειδικά σε **organization**): χρειάζεται secret **`GHCR_TOKEN`** (Personal Access Token). Αν βλέπεις *"installation not allowed"* ή *"token does not match expected scopes"*: δημιούργησε **Classic** PAT (Settings → Developer settings → **Personal access tokens** → **Tokens (classic)**) με scope **`write:packages`** (επίλεξε το checkbox· μπορεί να χρειαστεί και **`read:packages`**). Μην χρησιμοποιείς Fine-grained PAT χωρίς **Packages: Read and write** για το repo. Βάλ’ το token ως **`GHCR_TOKEN`** στα repository secrets.  
   - Στο workflow υπάρχουν (commented) optional steps για **Google Cloud Run** ή **Railway**· ξε-σχολιάζεις και ορίζεις τα αντίστοιχα secrets.

3. **Frontend**  
   - Deploy στο **Vercel** με το **Vercel Action** (`amondnet/vercel-action`), `working-directory: frontend`, `--prod`.  
   - Απαιτούνται GitHub secrets: **`VERCEL_TOKEN`**, **`VERCEL_ORG_ID`**, **`VERCEL_PROJECT_ID`**.  
   - Αν εμφανίζεται *"Project not found"*: τα IDs πρέπει να αντιστοιχούν στο project που κάνεις deploy. Το πιο αξιόπιστο τρόπο: τοπικά στο **`frontend/`** τρέξε **`npx vercel link`**, διάλεξε το σωστό Vercel project (και team αν χρησιμοποιείς team). Μετά **`cat .vercel/project.json`** — το **`orgId`** είναι το **VERCEL_ORG_ID** και το **`projectId`** το **VERCEL_PROJECT_ID**. Αν το project είναι σε **team**, το `orgId` είναι συχνά τύπου `team_xxxx`.  
   - Αν εμφανίζεται *"No Next.js version detected"*: στο Vercel project → **Settings** → **Build & Development Settings** βάλε **Root Directory** σε **κενό** (μην βάλεις `frontend`), γιατί το workflow στέλνει ήδη από `frontend/`, οπότε το root του deploy είναι ήδη ο φάκελος της εφαρμογής.

Άρα: με κάθε push στο `main`, ο κώδικας περνάει από CI, η βάση ενημερώνεται με migrations, το backend image ανεβαίνει στο GHCR (και opcional στο Cloud Run/Railway), και το frontend αναπτύσσεται αυτόματα στο Vercel.

---

## Repository structure (summary)

```
├── backend/          # NestJS API, Prisma, AI, Stripe, Resend
├── frontend/         # Next.js 14 (public + /app admin)
├── config/           # env.example, docker/
├── scripts/          # start-local.md, deploy helpers
├── .github/workflows # main.yml (CI/CD)
└── README.md
```

Περισσότερα για API, schema και prompts μπορούν να τεκμηριωθούν στο `docs/` (architecture, endpoints, DB schema).
