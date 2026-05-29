-- ============================================================
-- Offline Payment Receipt Submissions
-- Created: 2026-05-29
-- Purpose: Tracks bank-transfer receipt uploads from students
--          before admin admission to a cohort.
-- ============================================================

-- 1. Create the table
create table if not exists public.payment_receipt_submissions (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  email        text not null,
  student_name text,
  course_id    text,
  cohort_id    uuid references public.cohorts(id) on delete set null,
  receipt_url  text not null,
  status       text not null default 'pending', -- pending | admitted | rejected
  admitted_at  timestamptz,
  admitted_by  uuid references auth.users(id) on delete set null
);

-- 2. Enable RLS
alter table public.payment_receipt_submissions enable row level security;

-- 3. Admins can do everything (uses the existing is_admin() helper)
create policy "Admins can manage receipt submissions"
  on public.payment_receipt_submissions
  for all
  using (public.is_admin(auth.uid()));

-- 4. Anyone (including unauthenticated edge-function calls) can insert receipts
create policy "Anyone can insert receipt submissions"
  on public.payment_receipt_submissions
  for insert
  with check (true);

-- 5. Index for fast admin lookups by cohort
create index if not exists idx_prs_cohort_id
  on public.payment_receipt_submissions (cohort_id);

create index if not exists idx_prs_email
  on public.payment_receipt_submissions (email);

-- ============================================================
-- Storage Bucket: payment-receipts
-- ============================================================

-- Create the bucket (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-receipts',
  'payment-receipts',
  false,                          -- private bucket; access via signed URLs
  10485760,                       -- 10 MB max file size
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do nothing;

-- Allow anyone (including unauthenticated) to upload receipts
create policy "Anyone can upload payment receipts"
  on storage.objects
  for insert
  with check (bucket_id = 'payment-receipts');

-- Only admins can read/download receipts
create policy "Admins can view payment receipts"
  on storage.objects
  for select
  using (
    bucket_id = 'payment-receipts'
    and public.is_admin(auth.uid())
  );
