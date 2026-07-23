-- Device-scoped preset storage for Clean Sheet Sidekick.
-- No auth: each browser generates a random device id kept in localStorage and
-- sends it as the `x-device-id` request header. RLS restricts every row to the
-- device that created it, so there are no table-wide reads or enumeration.

create table if not exists public.saved_presets (
  id uuid primary key default gen_random_uuid(),
  device_id text not null check (char_length(device_id) between 8 and 128),
  kind text not null check (kind in ('squad', 'filters')),
  name text not null check (char_length(name) between 1 and 60),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_presets_device_kind_idx
  on public.saved_presets (device_id, kind, updated_at desc);

alter table public.saved_presets enable row level security;

-- Helper: the device id carried on the current request's custom header.
create or replace function public.current_device_id()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(
    current_setting('request.headers', true)::json ->> 'x-device-id',
    ''
  );
$$;

drop policy if exists "device reads own presets" on public.saved_presets;
create policy "device reads own presets"
  on public.saved_presets for select to anon
  using (device_id = public.current_device_id());

drop policy if exists "device inserts own presets" on public.saved_presets;
create policy "device inserts own presets"
  on public.saved_presets for insert to anon
  with check (device_id = public.current_device_id());

drop policy if exists "device updates own presets" on public.saved_presets;
create policy "device updates own presets"
  on public.saved_presets for update to anon
  using (device_id = public.current_device_id())
  with check (device_id = public.current_device_id());

drop policy if exists "device deletes own presets" on public.saved_presets;
create policy "device deletes own presets"
  on public.saved_presets for delete to anon
  using (device_id = public.current_device_id());

-- Keep updated_at fresh on every write.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saved_presets_set_updated_at on public.saved_presets;
create trigger saved_presets_set_updated_at
  before update on public.saved_presets
  for each row execute function public.set_updated_at();
