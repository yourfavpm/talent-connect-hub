-- Create interviews table
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  job_application_id uuid references public.job_applications(id) on delete cascade not null,
  scheduled_at timestamp with time zone not null,
  meeting_link text,
  status text not null check (status in ('scheduled', 'completed', 'cancelled', 'no_show')) default 'scheduled',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.interviews enable row level security;

-- Policies
create policy "Admins can manage interviews"
  on public.interviews for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('super_admin', 'talent_manager', 'account_manager', 'operations_admin')
    )
  );

create policy "Talents can view their own interviews"
  on public.interviews for select
  using (
    exists (
      select 1 from public.job_applications ja
      join public.talents t on ja.talent_id = t.id
      where ja.id = interviews.job_application_id
      and t.user_id = auth.uid()
    )
  );

create policy "Clients can view interviews for their jobs"
  on public.interviews for select
  using (
    exists (
      select 1 from public.job_applications ja
      join public.jobs j on ja.job_id = j.id
      join public.clients c on j.client_id = c.id
      where ja.id = interviews.job_application_id
      and c.user_id = auth.uid()
    )
  );
