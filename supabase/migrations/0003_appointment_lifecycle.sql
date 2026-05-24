-- 0002_appointment_lifecycle.sql
-- Enforce lifecycle statuses and index fields used by dashboard/KPI queries.

alter table appointments
  add constraint appointments_status_check
  check (
    status in (
      'scheduled',
      'ready_for_pickup',
      'delivered',
      'no_show',
      'cancelled'
    )
  );

create index if not exists appointments_status_idx on appointments (status);
create index if not exists appointments_slot_start_idx on appointments (slot_start);
