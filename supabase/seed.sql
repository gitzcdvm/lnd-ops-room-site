-- ============================================================
-- CHASE BOARD — DEMO DATA
-- Run this AFTER setup.sql.
-- Wipes the board first so re-running gives the same demo every
-- time. Delete the first line of the transaction if you want to keep
-- the outcomes you have already logged.
--
-- The wipe and the refill share one transaction on purpose: if the
-- insert fails, the delete rolls back instead of leaving an empty board.
-- ============================================================

begin;

delete from public.chase_items;

insert into public.chase_items
  (client, batch_code, reason, amount_paise, opened_at, status, last_outcome, last_action_at)
values
  -- Invoices unpaid. Only these rows carry money.
  ('Northbridge Financial',  'B-2214', 'invoice_unpaid',          128000000, now() - interval '67 days', 'open', null, null),
  ('Meridian Retail Ltd',    'B-2201', 'invoice_unpaid',           64500000, now() - interval '41 days', 'open', null, null),
  ('Orchid Hotels',          'B-2231', 'invoice_unpaid',           17500000, now() - interval '58 days', 'open', null, null),
  ('Bluewave Telecom',       'B-2247', 'invoice_unpaid',           32000000, now() - interval '19 days', 'open', null, null),

  -- Same two batches as above, waiting on a trainer report as well.
  -- They must appear once each in the total, never twice.
  ('Meridian Retail Ltd',    'B-2201', 'trainer_report_pending',           0, now() - interval '44 days', 'open', null, null),
  ('Orchid Hotels',          'B-2231', 'trainer_report_pending',           0, now() - interval '31 days', 'open', null, null),

  -- Feedback not collected.
  ('Sunrise Pharma',         'B-2208', 'feedback_not_collected',           0, now() - interval '23 days', 'open', null, null),
  ('Pinnacle Manufacturing', 'B-2252', 'feedback_not_collected',           0, now() - interval '5 days',  'open', null, null),

  -- Already reminded once. The clock below did NOT restart, by choice:
  -- a reminder is activity, not progress.
  ('Kaveri Logistics',       'B-2219', 'trainer_report_pending',           0, now() - interval '12 days', 'reminder_sent', 'Reminder sent', now() - interval '2 days'),

  -- Sign-off still waiting.
  ('Vantage Insurance',      'B-2240', 'client_sign_off_waiting',          0, now() - interval '8 days',  'open', null, null),

  -- Already signed off, so it must NOT show on the board.
  ('Kaveri Logistics',       'B-2219', 'client_sign_off_waiting',          0, now() - interval '27 days', 'signed_off', 'Signed off', now() - interval '3 days');

commit;
