-- ============================================================
-- CHASE BOARD — TABLE, ROW LEVEL SECURITY, POLICIES
-- Run this once in the SQL editor of your own Supabase project,
-- then run seed.sql underneath it.
-- ============================================================

-- One row per chase item (the thing you are chasing), not one row per
-- column on the batch. `id` and `created_at` are the two you asked for;
-- the rest are the fields the board actually prints, without which a
-- row could not show a client, a reason, days waiting or rupees at risk.
create table if not exists public.chase_items (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  client        text        not null,
  batch_code    text        not null,
  reason        text        not null
                  check (reason in (
                    'feedback_not_collected',
                    'trainer_report_pending',
                    'client_sign_off_waiting',
                    'invoice_unpaid'
                  )),
  -- Money is stored as whole paise (1 rupee = 100 paise) as an integer,
  -- so no rounding error can creep into the total. Zero for the three
  -- reasons that are not money.
  amount_paise  bigint      not null default 0 check (amount_paise >= 0),
  -- When the waiting started. "Days waiting" is worked out from this,
  -- so it is a date, not a typed-in number.
  opened_at     timestamptz not null default now(),

  status        text        not null default 'open'
                  check (status in ('open', 'reminder_sent', 'signed_off')),
  last_outcome  text,
  last_action_at timestamptz
);

-- The two columns the board sorts and filters on.
create index if not exists chase_items_status_idx
  on public.chase_items (status);

-- Row Level Security ON, as requested.
alter table public.chase_items enable row level security;

-- Re-runnable: drop the four policies before recreating them.
drop policy if exists "chase_items_select" on public.chase_items;
drop policy if exists "chase_items_insert" on public.chase_items;
drop policy if exists "chase_items_update" on public.chase_items;
drop policy if exists "chase_items_delete" on public.chase_items;

create policy "chase_items_select"
  on public.chase_items for select
  using (true);

create policy "chase_items_insert"
  on public.chase_items for insert
  with check (true);

create policy "chase_items_update"
  on public.chase_items for update
  using (true)
  with check (true);

create policy "chase_items_delete"
  on public.chase_items for delete
  using (true);

-- The publishable key acts as the `anon` role, so it needs table rights.
grant select, insert, update, delete on table public.chase_items
  to anon, authenticated;
