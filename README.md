# Dunrite Construction Group — SOP Workbook

A full-stack project management workbook and standard operating procedures (SOP) portal for **Dunrite Construction Group LLC**, built with TanStack Start, React, Supabase, and Tailwind CSS.

## Features

- **Executive Summary Dashboard** — KPI cards, milestone progress, and budget overview
- **Projects** — multi-project tracking with status pipeline (Bid → Under Contract → Active → Complete)
- **Bid Log** — trade bid tracking with awarded contracts and budget variances
- **Purchasing Log** — cost-code budget vs. contracted amounts with PO references
- **PO Log** — purchase order register with vendor, cost code, and amount
- **RFI Log** — requests for information with aging, overdue alerts, and cost impact
- **Submittal Log** — shop drawings, samples, and product data with status tracking
- **Schedule Delays** — milestone timeline and logged delay events
- **Procurement Buyout Log** — material commitment, shop drawing, and delivery tracking
- **Team & Roles** — user management with role-based access control (Admin, Executive, PM, Viewer)
- **Workbook Export** — download as PDF or DOCX, or email directly from the app

## Tech Stack

- **TanStack Start** (SSR React framework) + **TanStack Router** (file-based routing)
- **React 19** + **TypeScript**
- **Vite 7** for builds
- **Tailwind CSS v4** with Dunrite brand theme (charcoal + sky blue)
- **Supabase** — authentication, PostgreSQL database, file storage, row-level security
- **jsPDF + jspdf-autotable** — PDF workbook generation
- **docx** — DOCX workbook generation
- **Radix UI** + **shadcn/ui** component library
- **Recharts** for data visualization
- **Zod** for schema validation

## Setup

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Supabase environment variables (create a `.env` file):
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── routes/              # File-based routes (TanStack Router)
│   ├── __root.tsx       # App shell with sidebar layout
│   ├── index.tsx        # Dashboard (/)
│   ├── projects.tsx     # Projects (/projects)
│   ├── bids.tsx         # Bid Log (/bids)
│   ├── purchasing.tsx   # Purchasing Log (/purchasing)
│   ├── purchase-orders.tsx  # PO Log (/purchase-orders)
│   ├── rfis.tsx         # RFI Log (/rfis)
│   ├── submittals.tsx   # Submittal Log (/submittals)
│   ├── schedule.tsx     # Schedule Delays (/schedule)
│   ├── procurement.tsx  # Procurement Buyout (/procurement)
│   ├── team.tsx         # Team & Roles (/team)
│   └── auth.tsx         # Sign In (/auth)
├── components/          # Shared UI components
├── data/
│   └── projectData.ts   # Static project data and selectors
├── lib/
│   ├── project-data.ts  # PDF/DOCX data source
│   ├── workbook-pdf.ts  # PDF generation
│   ├── workbook-docx.ts # DOCX generation
│   └── auth.tsx         # Auth context and role helpers
└── integrations/
    └── supabase/        # Supabase client and types
```

## User Roles

| Role | Permissions |
|------|------------|
| Admin | Full access — manage users, create/edit/delete projects |
| Executive | View all data, export workbooks |
| Project Manager | Create and edit projects, manage logs |
| Viewer | Read-only access |

## License

Proprietary — Dunrite Construction Group LLC. All rights reserved.
