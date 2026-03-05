# Ξεκίνημα τοπικά (μέχρι να ανοίξεις localhost)

1. **PostgreSQL** (ένα από τα δύο):
   - Εγκατεστημένο τοπικά: δημιούργησε DB `advisorai` και άλλαξε `backend/.env` → `DATABASE_URL`.
   - Με Docker: `docker compose up -d` (από το root του project).

2. **Migrations** (μόνο αν τρέχει η βάση):
   ```bash
   cd backend
   npx prisma migrate dev
   ```

3. **Seed (admin λογαριασμός)**:
   ```bash
   cd backend
   npx prisma db seed
   ```
   Δημιουργεί χρήστη: **nikosthanos@gmail.com** / **N1k0$666!** (ADMIN).

4. **OpenAI API key**: Άνοιξε `backend/.env` και βάλε πραγματικό `OPENAI_API_KEY=sk-...`.

5. **Backend**:
   ```bash
   cd backend
   npm run start:dev
   ```
   (θα τρέχει στο http://localhost:3001)

6. **Frontend** (σε νέο terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   (θα τρέχει στο http://localhost:3000)

7. **Άνοιξε**:
   - Chat / proposal: http://localhost:3000/start
   - Pricing: http://localhost:3000/pricing
   - Admin login: http://localhost:3000/admin/login (email: nikosthanos@gmail.com, password: N1k0$666!)

**Test run (Chat → Pricing → πληρωμή)**  
Στο /start μίλα με το AI· ζήτα proposal/pricing ώστε να εμφανιστούν οι κάρτες. Για να δοκιμάσεις το **Stripe webhook** (ότι "πιάνει" την πληρωμή):  
- Ορίστε `STRIPE_WEBHOOK_SECRET` και `STRIPE_SECRET_KEY` στο backend.  
- Τοπικά: `stripe listen --forward-to localhost:3001/api/webhooks/stripe` και χρησιμοποίησε το `whsec_...` που εμφανίζεται ως webhook secret στο `.env`.  
- Όταν ο πελάτης ολοκληρώσει checkout, το webhook θα ενημερώσει το lead σε CONFIRMED, θα στείλει admin email και θα τρέξει generateAndSend (αν υπάρχει BUILDER_ENDPOINT).
