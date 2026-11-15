create table if not exists public.hups_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 nickname text not null check (char_length(btrim(nickname)) between 1 and 18),
 avatar smallint not null check (avatar between 0 and 5)
);
alter table public.hups_profiles enable row level security;
revoke all on public.hups_profiles from public, anon, authenticated;
grant select, insert, update on public.hups_profiles to authenticated;
drop policy if exists hups_own_profile on public.hups_profiles;
create policy hups_own_profile on public.hups_profiles for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create table if not exists public.hups_account_rounds (
 user_id uuid not null references auth.users(id) on delete cascade,
 round_id uuid not null,
 won boolean not null default false,
 primary key(user_id,round_id)
);
alter table public.hups_account_rounds enable row level security;
revoke all on public.hups_account_rounds from public, anon, authenticated;
grant select, insert(user_id,round_id) on public.hups_account_rounds to authenticated;
grant select, insert, update on public.hups_account_rounds to service_role;
drop policy if exists hups_own_account_rounds on public.hups_account_rounds;
create policy hups_own_account_rounds on public.hups_account_rounds for select to authenticated
 using ((select auth.uid())=user_id);
drop policy if exists hups_own_solo_round on public.hups_account_rounds;
create policy hups_own_solo_round on public.hups_account_rounds for insert to authenticated
 with check ((select auth.uid())=user_id and not won);

create or replace function public.hups_my_account_totals()
 returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('games',count(*),'wins',count(*) filter (where won))
 from public.hups_account_rounds where user_id=(select auth.uid());
$$;
revoke all on function public.hups_my_account_totals() from public, anon, authenticated;
grant execute on function public.hups_my_account_totals() to authenticated;

create or replace function public.hups_record_account_rounds(p_entries jsonb)
 returns boolean language plpgsql security definer set search_path='' as $$
begin
 insert into public.hups_account_rounds(user_id,round_id,won)
 select player.user_id,player.round_id,bool_or(player.won)
 from jsonb_to_recordset(p_entries) as player(user_id uuid,round_id uuid,won boolean)
 join auth.users as existing on existing.id=player.user_id
 group by player.user_id,player.round_id
 on conflict(user_id,round_id) do update
 set won=hups_account_rounds.won or excluded.won;
 return true;
end;
$$;
-- Only the Hups server may write wins.
revoke all on function public.hups_record_account_rounds(jsonb) from public, anon, authenticated;
grant execute on function public.hups_record_account_rounds(jsonb) to service_role;
