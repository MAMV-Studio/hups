begin;
-- Hups v34. Run once in the HUPS project's SQL Editor. Does not change challenges.
create table if not exists public.hups_play_sessions (
 round_id uuid not null, player_id uuid not null,
 app text not null check (app in ('hups','pikkuhups')),
 mode text not null check (mode in ('solo','shared','practice')),
 started_at timestamptz not null default now(), finished_at timestamptz,
 primary key(round_id,player_id)
);
alter table public.hups_play_sessions enable row level security;
revoke all on public.hups_play_sessions from anon,authenticated;
grant all on public.hups_play_sessions to service_role;
create index if not exists hups_play_started on public.hups_play_sessions(started_at);
create or replace function public.hups_record_plays(p_entries jsonb) returns boolean
language plpgsql security invoker set search_path=public as $$
begin
 if jsonb_array_length(p_entries)>12 then raise exception 'Too many entries'; end if;
 insert into public.hups_play_sessions(round_id,player_id,app,mode,finished_at)
 select (v->>'round_id')::uuid,(v->>'player_id')::uuid,v->>'app',v->>'mode',case when (v->>'finished')::boolean then now() end
 from jsonb_array_elements(p_entries) v
 on conflict(round_id,player_id) do update set finished_at=coalesce(hups_play_sessions.finished_at,excluded.finished_at);
 return true;
end $$;
create or replace function public.hups_play_totals() returns jsonb
language sql stable security invoker set search_path=public as $$
with periods as (
 select 'today' as period, (date_trunc('day',now() at time zone 'Europe/Helsinki') at time zone 'Europe/Helsinki') as since
 union all select 'week',((date_trunc('day',now() at time zone 'Europe/Helsinki')-interval '6 days') at time zone 'Europe/Helsinki')
 union all select 'all','-infinity'::timestamptz
), rounds as (
 select round_id,app,mode,min(started_at) as started_at,bool_and(finished_at is not null) as finished,
 count(*) as participants,count(finished_at) as participants_finished from public.hups_play_sessions group by round_id,app,mode
), totals as (
 select p.period,r.app,r.mode,count(*) as started,count(*) filter(where r.finished) as completed,
 sum(r.participants) as participations,sum(r.participants_finished) as participations_completed
 from periods p join rounds r on r.started_at>=p.since group by p.period,r.app,r.mode
)
select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(t)) from totals t),'[]'::jsonb),
 'first', (select min(started_at) from public.hups_play_sessions),'updated',now());
$$;
revoke all on function public.hups_record_plays(jsonb) from public,anon,authenticated;
revoke all on function public.hups_play_totals() from public,anon,authenticated;
grant execute on function public.hups_record_plays(jsonb) to service_role;
grant execute on function public.hups_play_totals() to service_role;

commit;
