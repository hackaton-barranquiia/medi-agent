create table call_events (
  id              uuid primary key default uuid_generate_v4(),
  vapi_call_id    text not null,
  event_type      text not null,
  payload         jsonb,
  created_at      timestamptz default now()
);

create index on call_events (vapi_call_id, created_at desc);

-- Enable Realtime for live log panel
alter publication supabase_realtime add table call_events;
