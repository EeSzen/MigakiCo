-- Add date_overrides table for calendar management
-- Allows admin to override the default weekly availability pattern
-- for specific dates (e.g. close for a holiday, open on a normally-off day)

create table date_overrides (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  is_available boolean not null,
  start_time time,
  end_time time,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table date_overrides enable row level security;

-- Public can read overrides (needed for slot picker)
create policy "date_overrides_select_public"
  on date_overrides for select
  to anon, authenticated
  using (true);

-- Only admin can write/update
create policy "date_overrides_insert_admin"
  on date_overrides for insert
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "date_overrides_update_admin"
  on date_overrides for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "date_overrides_delete_admin"
  on date_overrides for delete
  to authenticated
  using (is_admin());
