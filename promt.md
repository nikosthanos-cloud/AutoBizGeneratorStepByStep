# MASTER AI RECREATION PROMPT — advisorai.gr

You are an expert CTO, software architect, and full-stack engineer.

Recreate from scratch a production-ready SaaS platform called **"advisorai.gr"** based on the following specification.

---

## 1. Product

- **Purpose**: `advisorai.gr` is a SaaS platform that captures business problems via conversational flows and forms, auto-generates solution proposals and pricing, converts confirmed leads into detailed build prompts, and orchestrates calls to external builder services. It stores leads, conversations, proposals, prompts, and builder results, and notifies the internal team by email.
- **Core features**: AI sales assistant chat, proposal generator, lead management, build-prompt generator, builder-webhook integration, admin dashboard, AI usage tracking.
- **Users**: public visitors (no login) and internal admin/operators with authentication and roles.
- **Main workflow**: Visitor chats with sales assistant, system gathers context and proposes 3 packages, user chooses one and provides contact details, platform saves a lead, generates a structured proposal, generates a detailed build prompt, saves everything in the DB, optionally calls an external builder endpoint, and sends internal emails.

---

## 2. Tech Stack

- **Frontend**:
  - Next.js (latest, React, TypeScript, App Router).
  - Tailwind CSS, shadcn/ui (or similar) for UI.
  - React Query for data fetching.
- **Backend**:
  - Node.js + NestJS (TypeScript).
  - Layered/hexagonal architecture: controllers, services, repositories, domain models.
- **Database**:
  - PostgreSQL with Prisma ORM and migrations.
- **Infrastructure**:
  - Docker for backend.
  - Vercel (or similar) for frontend.
  - Managed Postgres DB.
  - GitHub Actions for CI/CD.
- **Security**:
  - OAuth2/OIDC (e.g. Auth0) for admin users.
  - JWT-based auth for backend APIs.
  - HTTPS enforcement and secret management via env vars/secret manager.

---

## 3. Architecture

- **Frontend**:
  - Next.js app with public marketing pages and protected admin section under `/app`.
  - Communicates with backend via JSON REST APIs.
- **Backend**:
  - NestJS app exposing REST endpoints under `/api/*`.
  - Modules: `auth`, `users`, `leads`, `conversations`, `proposals`, `build-prompts`, `ai-integration`, `notifications`, `admin`.
  - Uses Prisma to access PostgreSQL.
  - Integrates with AI providers (Anthropic/OpenAI) and email provider (Resend).
  - Optionally integrates with a queue for background jobs (e.g. BullMQ/Redis or a cloud queue).
- **Database**:
  - PostgreSQL schema with tables for users, customers, leads, conversations, proposals, build_prompts, builder_runs, ai_usage_logs, audit_logs.
- **Background workers**:
  - Within NestJS app or as a separate worker process, handling:
    - Build prompt generation jobs.
    - Builder endpoint calls.
    - Non-critical email sending.
- **AI modules**:
  - Central AI client abstraction with configurable system prompts for:
    - Sales assistant behavior.
    - Proposal generation.
    - Build prompt generation.

---

## 4. Folder Structure

Create a monorepo with this structure:

```text
advisorai/
  frontend/
    app/
    components/
    lib/
    hooks/
    styles/
    public/
    tests/
  backend/
    src/
      main.ts
      app.module.ts
      common/
      config/
      modules/
        auth/
        users/
        leads/
        conversations/
        proposals/
        build-prompts/
        ai/
        notifications/
        admin/
      jobs/
      middlewares/
      guards/
      interceptors/
    prisma/
      schema.prisma
      migrations/
    test/
  database/
    migrations/
    seeds/
  config/
    env.example
    app.config.ts
    docker/
      Dockerfile.backend
      Dockerfile.frontend
      nginx.conf
  scripts/
    dev.sh
    build.sh
    deploy-backend.sh
    deploy-frontend.sh
    db-migrate.sh
  infrastructure/
    terraform/
    k8s/
    cloudrun/
  docs/
    ARCHITECTURE.md
    API.md
    DB_SCHEMA.md
    AI_PROMPTS.md
    RUNBOOK.md
  .github/
    workflows/
      ci.yml
      cd-backend.yml
      cd-frontend.yml
  package.json
  README.md
```

Implement minimal README and docs stubs so another team can extend them.

---

## 5. Database Schema (PostgreSQL + Prisma)

Define Prisma models and generate SQL migrations for these entities:

- **users**
  - `id` (UUID, PK)
  - `email` (unique)
  - `name`
  - `role` (`ADMIN`, `OPERATOR`, `VIEW_ONLY`)
  - `auth_provider` (`auth0`, `password`, etc.)
  - `password_hash` (if local auth)
  - `created_at`, `updated_at`

- **customers**
  - `id` (UUID, PK)
  - `name`
  - `email`
  - `phone`
  - `company_name`
  - `industry`
  - `created_at`, `updated_at`

- **leads**
  - `id` (UUID, PK)
  - `customer_id` (FK → customers.id, nullable)
  - `source` (`web_chat`, `form`, `import`)
  - `status` (`new`, `in_review`, `prompt_generated`, `sent_to_builder`, `completed`, `archived`)
  - `selected_package` (`starter`, `pro`, `enterprise`)
  - `selected_price` (numeric)
  - `solution_title`
  - `starter_price`, `starter_features`
  - `pro_price`, `pro_features`
  - `enterprise_price`, `enterprise_features`
  - `problem_summary`
  - `raw_problem_input`
  - `locale`
  - `created_at`, `updated_at`

- **conversations**
  - `id` (UUID, PK)
  - `lead_id` (FK → leads.id)
  - `transcript_json` (JSONB)
  - `model_used`
  - `created_at`, `updated_at`

- **proposals**
  - `id` (UUID, PK)
  - `lead_id` (FK → leads.id, unique per lead)
  - `title`
  - `description`
  - `benefits` (JSONB array)
  - `starter_price`, `starter_features`
  - `pro_price`, `pro_features`
  - `enterprise_price`, `enterprise_features`
  - `proposal_json` (JSONB)
  - `created_at`, `updated_at`

- **build_prompts**
  - `id` (UUID, PK)
  - `lead_id` (FK → leads.id)
  - `prompt_text` (text)
  - `generation_model`
  - `status` (`pending`, `sent_to_builder`, `builder_completed`, `failed`)
  - `builder_endpoint` (text)
  - `created_at`, `updated_at`

- **builder_runs**
  - `id` (UUID, PK)
  - `build_prompt_id` (FK → build_prompts.id)
  - `status` (`queued`, `in_progress`, `success`, `failed`)
  - `request_payload` (JSONB)
  - `response_payload` (JSONB)
  - `error_message` (text)
  - `created_at`, `updated_at`

- **ai_usage_logs**
  - `id` (UUID, PK)
  - `lead_id` (FK → leads.id, nullable)
  - `type` (`chat`, `proposal`, `build_prompt`)
  - `model`
  - `prompt_tokens`
  - `completion_tokens`
  - `cost_estimate`
  - `request_id`
  - `created_at`

- **audit_logs**
  - `id` (UUID, PK)
  - `user_id` (FK → users.id, nullable)
  - `action`
  - `entity_type` (`lead`, `proposal`, `build_prompt`, `config`, etc.)
  - `entity_id`
  - `details` (JSONB)
  - `ip_address`
  - `user_agent`
  - `created_at`

Add appropriate indexes on emails, foreign keys, status, and created_at fields.

---

## 6. Backend Services & APIs (NestJS)

Implement a NestJS backend with modules and REST APIs:

- **AuthModule**:
  - Integrate with Auth0/Cognito (or scaffold local JWT auth).
  - Provide guards (`AuthGuard`) and decorators (`@CurrentUser`) for admin endpoints.

- **UsersModule**:
  - CRUD for internal users.
  - Role management and mapping to external IdP identities.
  - Log changes to `audit_logs`.

- **LeadsModule**:
  - Public endpoint `POST /api/public/leads` to create a lead from the public flow (no auth, rate-limited).
  - Internal endpoints to list, filter, and update leads (auth required).

- **ConversationsModule**:
  - `POST /api/public/chat` to handle customer chat turns.
  - Store full conversational transcript in `conversations` linked to a `lead` (or temporary ID before lead finalization).

- **ProposalsModule**:
  - AI call to generate structured proposals from conversation summary and problem statement.
  - CRUD endpoints for viewing and regenerating proposals for a lead.

- **BuildPromptsModule**:
  - Generate a detailed build prompt from lead + proposal.
  - Save to `build_prompts` and optionally enqueue builder calls.
  - Endpoints to regenerate prompts and see history.

- **AIIntegrationModule**:
  - Wrap calls to AI providers (Anthropic/OpenAI) with:
    - System prompts for sales assistant, proposal generation, build prompt generation.
    - Usage logging into `ai_usage_logs`.
    - Error handling and retries.

- **NotificationsModule**:
  - Send emails via Resend on:
    - New lead created.
    - New build prompt generated.
    - Builder results received.

- **AdminModule**:
  - Endpoints:
    - GET `/api/admin/leads`
    - GET `/api/admin/leads/:id`
    - POST `/api/admin/leads/:id/regenerate-proposal`
    - POST `/api/admin/leads/:id/regenerate-build-prompt`
    - GET `/api/admin/ai-usage`
    - GET `/api/admin/me`
    - POST `/api/admin/webhooks/builder` (to receive builder results).

Apply DTO validation with `class-validator`/`class-transformer`, global error filters, and rate limiting middleware on public endpoints.

---

## 7. Frontend (Next.js)

Implement a Next.js frontend with:

- **Public pages**:
  - `/`: Marketing homepage (explains advisorai.gr).
  - `/pricing`: Shows Starter/Pro/Enterprise tiers, features, and prices.
  - `/start`: Hosts the AI sales assistant chat and final lead form.

- **Admin pages** (protected):
  - `/app/leads`: List leads with filters (status, date, package).
  - `/app/leads/[id]`: Detailed view with:
    - Customer info.
    - Conversation summary.
    - Proposal summary.
    - Build prompts and builder runs.
  - `/app/settings/ai`: Manage system prompts and template texts (read/write to backend).
  - `/app/settings/users`: Manage internal users and roles.

- **Components**:
  - Reusable `ChatWidget`, `LeadForm`, `ProposalCard`, `PromptViewer`, `DataTable`, `StatCards`, etc.

- **Data fetching**:
  - Use React Query for API calls.
  - Maintain auth state in context or via cookies and hooks.

- **Styling**:
  - Use Tailwind CSS + shadcn/ui; define a cohesive visual identity for advisorai.gr.

---

## 8. Security & Infrastructure

- Implement role-based access control for all `/api/admin/*` endpoints.
- Use JWT/OIDC tokens from Auth0/Cognito, stored securely (HttpOnly cookies or secure storage).
- Enforce HTTPS, CORS rules (only trusted origins), and rate limiting for public endpoints.
- Store secrets (DB URL, AI keys, email keys) as environment variables and never hard-code them.
- Provide Dockerfiles for backend and frontend, and optionally Docker Compose for local dev.
- Provide GitHub Actions workflows:
  - CI: lint, test, type-check both frontend and backend.
  - CD: build and deploy backend container, deploy frontend.

---

## 9. Development & Rebuild Instructions

Ensure the generated repository includes:

- Clear README with:
  - Prerequisites (Node, Docker, etc.).
  - Setup steps for dev:
    - `cd backend && npm install && npx prisma migrate dev && npm run start:dev`
    - `cd frontend && npm install && npm run dev`
  - Environment variables required for local dev in `config/env.example`.
- Scripts in `scripts/` for building and deploying.
- Documentation in `docs/` (even if brief) for:
  - Architecture overview.
  - API endpoints.
  - DB schema.
  - AI prompts and how to configure providers.

---

## TASK

Using the entire specification above:

- Generate all necessary code, configuration files, database schema (Prisma models + migrations), API endpoints, frontend pages, and infrastructure definitions.
- Follow the folder structure exactly.
- Make the system runnable locally with simple commands and clearly documented environment variables.
- Prepare the code so that it is production-ready, secure by default, and easy to extend by a human development team.

