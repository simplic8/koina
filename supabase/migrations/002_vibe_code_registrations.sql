-- Vibe Code workshop interest registrations (public form, no auth required)

create table if not exists public.vibe_code_registrations (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  whatsapp text,
  telegram text,
  discord text,
  consent_vibe_code boolean not null default false,
  consent_koina boolean not null default false,
  created_at timestamptz not null default now(),
  constraint vibe_code_registrations_email_unique unique (email),
  constraint vibe_code_registrations_consent_vibe_required
    check (consent_vibe_code = true)
);

create index if not exists vibe_code_registrations_created_at_idx
  on public.vibe_code_registrations (created_at desc);

alter table public.vibe_code_registrations enable row level security;

-- No public policies: inserts/reads go through the service role API route.
drop policy if exists "Admins can read vibe code registrations"
  on public.vibe_code_registrations;
create policy "Admins can read vibe code registrations"
  on public.vibe_code_registrations for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
