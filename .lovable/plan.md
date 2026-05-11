## Goal
Add 4 high-leverage modules on top of existing app: Smart Collections, AMC Intelligence, Technician Inventory, Customer Portal upgrades, and BI Dashboard.

## Scope (this iteration)

### 1. Smart Collections System (`/app/collections`)
- New page listing all unpaid invoices with aging buckets (0-7d, 8-15d, 16-30d, 30d+).
- Per-row actions: WhatsApp reminder (uses existing `buildInvoiceWhatsAppUrl`), copy UPI link (`upi://pay?...` from `business_settings.upi_id`), regenerate signed PDF, mark paid.
- KPIs: total outstanding, overdue >30d, collected this month.
- Bulk "Send all reminders" opens WhatsApp sequentially.

### 2. AMC Intelligence (extend `/app/contracts`)
- Add "Expiring soon" (next 30 days) and "Overdue" sections at top of Contracts page.
- One-click WhatsApp renewal reminder per contract.
- Auto-recommendation badge: contracts with `next_due_date <= today + 14d` flagged "Renew now".
- Add a "Renewal funnel" mini stat card.

### 3. Technician Inventory (extend `/app/inventory`)
- New table `technician_stock` (technician_id, item_id, quantity).
- New table `inventory_movements` (item_id, technician_id, type: issue/return/consume/restock, quantity, job_id, note, created_at).
- UI tabs in Inventory page: "Stock", "Issued to technicians", "Movements".
- Low-stock alert banner already exists; add "Issue to technician" dialog.

### 4. Business Intelligence Dashboard (extend `/app/` Dashboard or new `/app/insights`)
- Add `Insights.tsx` route with charts:
  - Revenue/day (reuse Reports logic, 30d sparkline)
  - Technician leaderboard (jobs completed, revenue, avg rating)
  - Repeat customer % (customers with >1 completed job / total)
  - Avg resolution time (checkin→checkout)
  - Service category performance (revenue per service_type)
- Add nav link.

### 5. Customer Portal polish (extend `/track/:token`)
- Add service history section: list past jobs for the same customer.
- Add "Download invoice" link if invoice exists & paid/unpaid.
- Already shows live ETA + technician.

## Out of scope (mention as future)
- Barcode scanning, warehouse sync, AI chatbot, AI upsell recommendations engine, automatic scheduled reminders (would need cron + edge function — flag for follow-up).

## Technical Plan

**Migration:**
- `technician_stock(id, technician_id uuid, item_id uuid, quantity numeric, updated_at)` with unique(technician_id, item_id).
- `inventory_movements(id, item_id, technician_id nullable, job_id nullable, type text, quantity numeric, note text, created_at)`.
- Open RLS (matches rest of app's current posture).

**New files:**
- `src/pages/Collections.tsx`
- `src/pages/Insights.tsx`
- `src/lib/upi.ts` — `buildUpiLink({ vpa, name, amount, note })`
- `src/lib/aging.ts` — invoice aging helpers

**Edited files:**
- `src/App.tsx` — routes for `/app/collections`, `/app/insights`
- `src/components/AppSidebar.tsx` — nav entries
- `src/pages/Contracts.tsx` — expiring/overdue sections + renewal WhatsApp
- `src/pages/Inventory.tsx` — tabs, issue dialog, movements
- `src/pages/Track.tsx` — service history section
- `src/lib/invoiceShare.ts` — add `buildPaymentReminderWhatsAppUrl`

After migration, I'll wire UI in one pass and verify build.
