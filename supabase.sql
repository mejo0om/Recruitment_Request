create extension if not exists pgcrypto;

create table if not exists public.recruitment_requests (
  id uuid primary key default gen_random_uuid(),
  reference_number text unique not null,
  employer_name text not null,
  mobile text not null,
  email text not null,
  employer_city text not null,
  company_name text not null,
  cr_number text,
  company_address text,
  notes text,
  positions jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.recruitment_requests enable row level security;

-- لا توجد سياسة INSERT عامة.
-- الإدخال يتم من Edge Function باستخدام Service Role Key فقط.
