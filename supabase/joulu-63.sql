begin;
-- Aja Supabasen SQL Editorissa tilit.sql:n jälkeen.
alter table public.hups_profiles drop constraint if exists hups_profiles_avatar_check;
alter table public.hups_profiles add constraint hups_profiles_avatar_check check(avatar between 0 and 8);
alter table public.hups_profiles add column if not exists accessory text not null default 'none';
create table if not exists public.hups_daily_results(
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null, score integer not null check(score between 0 and 5000),
 primary key(user_id,day)
);
alter table public.hups_daily_results enable row level security;
grant select,insert,update on public.hups_daily_results to authenticated;
drop policy if exists daily_owner on public.hups_daily_results;
create policy daily_owner on public.hups_daily_results for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create table if not exists public.hups_friend_results(
 round_id uuid not null, user_id uuid not null references auth.users(id) on delete cascade,
 friend_id uuid not null references auth.users(id) on delete cascade,
 friend_name text not null, outcome text not null check(outcome in ('win','loss','draw')),
 played_at timestamptz not null default now(), primary key(round_id,user_id,friend_id)
);
alter table public.hups_friend_results enable row level security;
grant select on public.hups_friend_results to authenticated;
grant all on public.hups_friend_results to service_role;
drop policy if exists friends_owner on public.hups_friend_results;
create policy friends_owner on public.hups_friend_results for select to authenticated using(auth.uid()=user_id);
create or replace function public.hups_record_friend_results(p_entries jsonb) returns boolean language sql security definer set search_path='' as $$
 with inserted as (
 insert into public.hups_friend_results(round_id,user_id,friend_id,friend_name,outcome)
 select x.round_id,x.user_id,x.friend_id,left(x.friend_name,18),x.outcome
 from jsonb_to_recordset(p_entries) x(round_id uuid,user_id uuid,friend_id uuid,friend_name text,outcome text)
 where x.user_id<>x.friend_id on conflict do nothing returning 1
 ) select true;
$$;
revoke all on function public.hups_record_friend_results(jsonb) from public,anon,authenticated;
grant execute on function public.hups_record_friend_results(jsonb) to service_role;
create or replace function public.hups_avatar_allowed() returns trigger language plpgsql security definer set search_path='' as $$
 declare games integer;
 begin
 select count(*) into games from public.hups_account_rounds where user_id=new.user_id;
 if new.avatar>=6 and games < (case new.avatar when 6 then 10 when 7 then 25 else 50 end) then raise exception 'Hahmo on vielä lukittu'; end if;
 if new.accessory not in ('none','crown','bow','glasses') then raise exception 'Tuntematon asuste'; end if;
 if games < (case new.accessory when 'crown' then 5 when 'bow' then 15 when 'glasses' then 30 else 0 end) then raise exception 'Asuste on vielä lukittu'; end if;
 return new;
 end;
$$;
drop trigger if exists check_avatar on public.hups_profiles;
create trigger check_avatar before insert or update on public.hups_profiles for each row execute function public.hups_avatar_allowed();

revoke insert,update on public.hups_daily_results from authenticated;
create or replace function public.hups_save_daily(p_day date,p_score integer) returns integer language plpgsql security definer set search_path='' as $$
 declare result integer;
 begin
 if auth.uid() is null or p_day<>(now() at time zone 'Europe/Helsinki')::date or p_score not between 0 and 5000 then raise exception 'Virheellinen päivän tulos'; end if;
 insert into public.hups_daily_results(user_id,day,score) values(auth.uid(),p_day,p_score)
 on conflict(user_id,day) do update set score=greatest(hups_daily_results.score,excluded.score) returning score into result;
 return result;
 end;
$$;
revoke all on function public.hups_save_daily(date,integer) from public,anon;
grant execute on function public.hups_save_daily(date,integer) to authenticated;
create or replace function public.hups_my_friend_stats() returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(stats),'[]'::jsonb) from (
 select friend_id,(array_agg(friend_name order by played_at desc))[1] friend_name,
 count(*) filter(where outcome='win') wins,count(*) filter(where outcome='loss') losses,count(*) filter(where outcome='draw') draws,
 (array_agg(outcome order by played_at desc))[1] last_outcome
 from public.hups_friend_results where user_id=auth.uid() group by friend_id
 ) stats;
$$;
revoke all on function public.hups_my_friend_stats() from public,anon;
grant execute on function public.hups_my_friend_stats() to authenticated;

commit;
