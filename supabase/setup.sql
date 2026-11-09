-- Run in the NEW Hups project's SQL Editor. This does not create user accounts.
create table if not exists public.hups_challenges (
 code text primary key check (code ~ '^[1-9][0-9]{3}$'),
 data jsonb not null,
 revision bigint not null default 0
);
alter table public.hups_challenges enable row level security;
revoke all on table public.hups_challenges from anon, authenticated;
grant select, insert, update, delete on table public.hups_challenges to service_role;

-- Claim a fresh code or atomically recycle an expired room. Concurrent
-- creators cannot overwrite a room that is still active.
create or replace function public.hups_create_challenge(
 p_code text, p_data jsonb, p_expired_before bigint
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare affected integer;
begin
 insert into public.hups_challenges(code,data,revision)
 values(p_code,p_data,0)
 on conflict(code) do update
 set data=excluded.data, revision=public.hups_challenges.revision+1
 where (public.hups_challenges.data->>'created')::bigint < p_expired_before;
 get diagnostics affected = row_count;
 return affected=1;
end;
$$;
revoke all on function public.hups_create_challenge(text,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.hups_create_challenge(text,jsonb,bigint) to service_role;
