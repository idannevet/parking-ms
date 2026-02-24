# Parking Management System

A full-stack parking management dashboard with an AI-powered natural language query interface.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Recharts
- **Backend:** Supabase (PostgreSQL)
- **AI:** Anthropic Claude (claude-sonnet-4-6) for NL → SQL
- **Icons:** Lucide React

## Features

- **Dashboard** — KPI cards, revenue charts, occupancy heatmap, violations donut
- **Lots** — CRUD for parking lots with real-time occupancy tracking
- **Vehicles** — Vehicle registry with search, filters, and registration modal
- **Sessions** — Parking session history with status filters
- **Payments** — Transaction ledger with method/status breakdown
- **Violations** — Fine management with one-click mark-paid
- **Subscriptions** — Subscription tracker with expiry warnings and MRR
- **AI Console** — Ask any question in plain English → Claude generates SQL → live results

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Run `supabase/seed.sql` to populate 5000+ rows of mock data

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI Console

The AI Query Console translates plain English questions into SQL queries using Claude. Examples:

- *"Which lot earned the most revenue last month?"*
- *"Show me vehicles with unpaid violations over ₪200"*
- *"What is the average session duration per lot type?"*

**Security:** All queries are validated server-side to be `SELECT`-only before execution. The PostgreSQL `execute_ai_query` function provides a second layer of enforcement.

## Project Structure

```
parking-ms/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/      # KPI + charts (server component)
│   │   ├── lots/           # CRUD with modal
│   │   ├── vehicles/       # Search + register
│   │   ├── sessions/       # Session history
│   │   ├── payments/       # Transaction ledger
│   │   ├── violations/     # Fine management
│   │   ├── subscriptions/  # Subscription tracker
│   │   └── ai-console/     # AI Query Console
│   └── api/                # API routes
├── components/
│   ├── dashboard/          # Chart components
│   ├── layout/             # Sidebar, Header
│   └── ui/                 # Badge, Spinner, Modal, StatCard
├── lib/                    # Supabase clients, utils, AI prompt
├── types/                  # TypeScript interfaces
└── supabase/               # schema.sql + seed.sql
```
