-- MedTrace — Postgres schema (matches server + client expectations)
-- Run in Supabase SQL editor or psql.

-- Drop existing tables if recreating
drop table if exists audit_log;
drop table if exists visit_steps;
drop table if exists visits;
drop table if exists users;
drop table if exists patients;

-- Patients
create table patients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  age integer,
  gender text,
  phone text,
  allergies text[] default '{}',
  known_conditions text[] default '{}',
  current_medications text[] default '{}',
  abha_id text unique,
  created_at timestamp default now()
);

-- Users (doctors, receptionists, admins)
create table users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text check (role in ('doctor', 'receptionist', 'admin')),
  email text unique not null,
  abha_id text unique,
  aadhaar_id text unique,
  created_at timestamp default now()
);

-- Visits
create table visits (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references patients(id),
  doctor_id uuid references users(id),
  chief_complaint text,
  status text default 'in_progress' check (status in ('in_progress', 'completed')),
  visit_date timestamp default now(),
  created_at timestamp default now()
);

-- Visit steps (the legal backbone)
create table visit_steps (
  id uuid default gen_random_uuid() primary key,
  visit_id uuid references visits(id),
  step_type text check (step_type in ('reception','vitals','consultation','procedure','prescription','discharge')),
  performed_by uuid references users(id),
  data jsonb default '{}',
  is_locked boolean default false,
  timestamp timestamp default now()
);

-- Audit log (immutable record of every action)
-- `note` holds JSON for dismissal details (step_type, missed_fields, reason, string ids when not UUIDs).
create table audit_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id),
  action text,
  table_name text,
  record_id uuid,
  note text,
  timestamp timestamp default now()
);

-- Lock policy (prevent updates to locked steps)
create or replace function prevent_locked_step_update()
returns trigger as $$
begin
  if old.is_locked = true then
    raise exception 'This step is locked and cannot be modified.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger lock_visit_steps
before update on visit_steps
for each row execute function prevent_locked_step_update();
