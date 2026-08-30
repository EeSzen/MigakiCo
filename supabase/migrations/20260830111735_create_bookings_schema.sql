-- Migaki booking schema
-- Run via: supabase migration new create_bookings_schema
-- then paste this into the generated file, and run: supabase db push

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ============================================================
-- ADMIN ROLE TABLE
-- Lets us check "is this logged-in user an admin?" inside RLS
-- policies. After creating your admin user in Supabase Auth,
-- insert their user_id into this table (see note at bottom).
-- ============================================================
create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Helper function so policies stay short and reusable
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admins where user_id = auth.uid()
  );
$$;

-- ============================================================
-- CUSTOMERS
-- Optional record, mainly useful later for repeat-customer
-- lookups / loyalty tracking. Not required for guest checkout.
-- ============================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text unique not null,
  created_at timestamptz not null default now()
);

alter table customers enable row level security;

-- Anyone can create a customer record (guest checkout flow)
create policy "customers_insert_public"
  on customers for insert
  to anon, authenticated
  with check (true);

-- Only admin can read/update/delete customer records
create policy "customers_select_admin"
  on customers for select
  to authenticated
  using (is_admin());

create policy "customers_update_admin"
  on customers for update
  to authenticated
  using (is_admin());

create policy "customers_delete_admin"
  on customers for delete
  to authenticated
  using (is_admin());

-- ============================================================
-- SERVICES
-- Public needs to read these to render the services grid.
-- Only admin can add/edit/remove services.
-- ============================================================
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10, 2) not null,
  duration_minutes int not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table services enable row level security;

create policy "services_select_public"
  on services for select
  to anon, authenticated
  using (is_active = true or is_admin());

create policy "services_insert_admin"
  on services for insert
  to authenticated
  with check (is_admin());

create policy "services_update_admin"
  on services for update
  to authenticated
  using (is_admin());

create policy "services_delete_admin"
  on services for delete
  to authenticated
  using (is_admin());

-- ============================================================
-- AVAILABILITY
-- Defines your working hours per day of week, used to render
-- the live slot picker. Public reads this; only you edit it.
-- ============================================================
create table availability (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true
);

alter table availability enable row level security;

create policy "availability_select_public"
  on availability for select
  to anon, authenticated
  using (true);

create policy "availability_insert_admin"
  on availability for insert
  to authenticated
  with check (is_admin());

create policy "availability_update_admin"
  on availability for update
  to authenticated
  using (is_admin());

create policy "availability_delete_admin"
  on availability for delete
  to authenticated
  using (is_admin());

-- ============================================================
-- BOOKINGS
-- Core table. Public can INSERT (create a booking) but cannot
-- read other people's bookings back -- only admin can view,
-- approve, reject, or complete them.
--
-- The partial unique index below is what prevents double-booking:
-- only one 'pending' or 'confirmed' booking can exist per exact
-- timestamp, since you're a solo operator working one bike at a time.
-- ============================================================
create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  location_type text not null check (location_type in ('home', 'onsite')),
  address text, -- required only when location_type = 'onsite', enforce in app layer
  bike_cc int,
  bike_plate text not null,
  bike_model text not null,
  remarks text,
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'completed')),
  hold_expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

-- Prevents two active (pending/confirmed) bookings at the same exact slot
create unique index bookings_active_slot_unique
  on bookings (scheduled_at)
  where status in ('pending', 'confirmed');

alter table bookings enable row level security;

-- Public can create bookings (this is the actual "book now" action)
create policy "bookings_insert_public"
  on bookings for insert
  to anon, authenticated
  with check (status = 'pending'); -- customers can only ever create as pending

-- Only admin can view the booking list (protects customer privacy/PII)
create policy "bookings_select_admin"
  on bookings for select
  to authenticated
  using (is_admin());

-- Only admin can approve/reject/complete
create policy "bookings_update_admin"
  on bookings for update
  to authenticated
  using (is_admin());

create policy "bookings_delete_admin"
  on bookings for delete
  to authenticated
  using (is_admin());

-- ============================================================
-- BOOKING_SERVICES (junction table)
-- Supports multiple services per booking (e.g. wash + wax).
-- ============================================================
create table booking_services (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  service_id uuid not null references services(id)
);

alter table booking_services enable row level security;

-- Public can insert rows here as part of creating a booking
create policy "booking_services_insert_public"
  on booking_services for insert
  to anon, authenticated
  with check (true);

create policy "booking_services_select_admin"
  on booking_services for select
  to authenticated
  using (is_admin());

create policy "booking_services_delete_admin"
  on booking_services for delete
  to authenticated
  using (is_admin());

-- ============================================================
-- BOOKING_PHOTOS
-- Before/after photos tied to a completed booking.
-- Admin-only for now (uploaded by you after each job).
-- ============================================================
create table booking_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  url text not null,
  type text not null check (type in ('before', 'after')),
  uploaded_at timestamptz not null default now()
);

alter table booking_photos enable row level security;

create policy "booking_photos_all_admin"
  on booking_photos for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- AFTER RUNNING THIS MIGRATION:
--
-- 1. Create your admin user in Supabase Dashboard ->
--    Authentication -> Users -> Add user (email + password).
--
-- 2. Copy that user's UUID, then run this manually in the
--    SQL Editor to grant admin access:
--
--    insert into admins (user_id) values ('paste-your-user-uuid-here');
--
-- 3. Insert your actual services and availability rows, e.g.:
--
--    insert into services (name, description, price, duration_minutes)
--    values ('Basic Wash', 'Exterior wash and dry', 25.00, 45);
--
--    insert into availability (day_of_week, start_time, end_time)
--    values (1, '09:00', '18:00'); -- Monday 9am-6pm
-- ============================================================