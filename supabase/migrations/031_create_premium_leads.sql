-- Premium interest leads: tracks users who hit free-tier limits
create table if not exists premium_leads (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    memorial_id uuid references memorials(id) on delete set null,
    trigger_type text not null check (trigger_type in ('photo_limit', 'video_upload', 'size_limit')),
    created_at timestamptz not null default now()
);

-- Index for quick lookups
create index if not exists idx_premium_leads_user on premium_leads(user_id);
create index if not exists idx_premium_leads_trigger on premium_leads(trigger_type);

-- RLS
alter table premium_leads enable row level security;

-- Policies (drop first to avoid conflicts)
drop policy if exists "Users can insert own leads" on premium_leads;
create policy "Users can insert own leads"
    on premium_leads for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "Service role can read all leads" on premium_leads;
create policy "Service role can read all leads"
    on premium_leads for select
    to service_role
    using (true);

-- Allow authenticated users to read their own leads (needed for duplicate check)
drop policy if exists "Users can read own leads" on premium_leads;
create policy "Users can read own leads"
    on premium_leads for select
    to authenticated
    using (auth.uid() = user_id);
