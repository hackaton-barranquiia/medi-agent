create extension if not exists "uuid-ossp";

create table patients (
  id              uuid primary key default uuid_generate_v4(),
  full_name       text not null,
  phone_e164      text unique not null,
  last_4_cc       text not null,
  birth_date      date,
  created_at      timestamptz default now()
);
create index on patients (phone_e164);
create index on patients (last_4_cc);

create table medications (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  presentation    text,
  stock_qty       int not null default 0,
  expires_at      date,
  reorder_eta_days int default 7
);

create table prescriptions (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references patients(id),
  status          text not null default 'ready',
  created_at      timestamptz default now()
);
create index on prescriptions (patient_id);
create index on prescriptions (status);

create table prescription_items (
  id              uuid primary key default uuid_generate_v4(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  medication_id   uuid not null references medications(id),
  qty             int not null default 1,
  fulfilled       boolean not null default false
);
create index on prescription_items (prescription_id);

create table appointments (
  id              uuid primary key default uuid_generate_v4(),
  prescription_id uuid not null references prescriptions(id),
  slot_start      timestamptz not null,
  slot_end        timestamptz not null,
  status          text not null default 'scheduled',
  copay_cents     int default 0,
  delivery_for_pending boolean default false,
  delivery_date   date,
  created_at      timestamptz default now()
);
create index on appointments (prescription_id);

create table call_logs (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid references patients(id),
  vapi_call_id    text,
  outcome         text,
  started_at      timestamptz,
  ended_at        timestamptz
);

-- Enable Realtime on appointments and call_logs only
alter publication supabase_realtime add table appointments;
alter publication supabase_realtime add table call_logs;
