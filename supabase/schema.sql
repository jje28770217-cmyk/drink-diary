-- Drink Balance - Supabase 구조 (로그인 + 클라우드 저장 + 친구 공유 + 사진)
-- 사용법: Supabase 대시보드 → SQL Editor → New query → 이 파일 전체를 붙여 넣고 Run (여러 번 실행해도 안전하게 작성됨)
--
-- 보안 원칙
--  1) 모든 테이블은 RLS(행 단위 보안)를 켭니다. 내 데이터는 나만 읽고 쓸 수 있습니다.
--  2) 친구는 "수락된 친구"일 때만, 아래 friend_state() 가 돌려주는 범위만 볼 수 있습니다.
--     공유 범위: 날짜별 기록(제품·양·시간·컨디션·메모) + 성별 설정(기준 계산용) + 사진
--     공유 안 함: 임신 설정, 나이, 즐겨찾기·최근 기록, 제품 수정값, 직접 추가한 제품
--  3) 앱 코드에는 publishable(anon) 키만 넣습니다. secret/service_role 키는 절대 넣지 않습니다.

-- ───────────── 테이블 ─────────────

-- 프로필: 친구 코드와 표시 이름 (이메일은 여기 두지 않음)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  friend_code text not null unique,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

-- 내 기록 전체(앱의 state JSON 그대로). 한 사람당 한 줄
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  constraint state_size check (octet_length(state::text) < 8000000)
);

-- 친구 관계: requester 가 요청, addressee 가 수락하면 accepted
create table if not exists public.friendships (
  id bigint generated always as identity primary key,
  requester uuid not null references auth.users(id) on delete cascade,
  addressee uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  constraint not_self check (requester <> addressee)
);
-- 같은 두 사람 사이에 방향과 관계없이 한 건만
create unique index if not exists friendships_pair_uq
  on public.friendships (least(requester, addressee), greatest(requester, addressee));

-- ───────────── 새 가입자 처리: 프로필 + 친구 코드 자동 생성 ─────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare c text;
begin
  loop
    c := substr(replace(upper(gen_random_uuid()::text), '-', ''), 1, 8);
    exit when not exists (select 1 from public.profiles where friend_code = c);
  end loop;
  insert into public.profiles (id, friend_code, display_name) values (new.id, c, '');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── RLS ─────────────
alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.friendships enable row level security;

-- profiles: 내 것만 보고, 표시 이름만 고칠 수 있음 (친구 코드는 못 바꿈)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke insert, delete, update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;

-- user_data: 내 것만 읽기·쓰기
drop policy if exists user_data_own on public.user_data;
create policy user_data_own on public.user_data for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- friendships: 당사자만 보고, 수락은 받은 사람만, 삭제(거절·끊기)는 둘 다. 요청 만들기는 request_friend() 로만
drop policy if exists friendships_select on public.friendships;
create policy friendships_select on public.friendships for select to authenticated
  using (requester = auth.uid() or addressee = auth.uid());
drop policy if exists friendships_accept on public.friendships;
create policy friendships_accept on public.friendships for update to authenticated
  using (addressee = auth.uid() and status = 'pending') with check (addressee = auth.uid() and status = 'accepted');
drop policy if exists friendships_delete on public.friendships;
create policy friendships_delete on public.friendships for delete to authenticated
  using (requester = auth.uid() or addressee = auth.uid());
revoke insert on public.friendships from authenticated, anon;
revoke update on public.friendships from authenticated, anon;
grant update (status) on public.friendships to authenticated;

-- anon(로그인 전) 은 어떤 테이블도 접근 불가
revoke all on public.profiles, public.user_data, public.friendships from anon;

-- ───────────── 함수 ─────────────

-- 수락된 친구인지
create or replace function public.is_friend(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester = auth.uid() and f.addressee = other) or (f.addressee = auth.uid() and f.requester = other))
  );
$$;

-- 친구 요청: 친구 코드로. 결과: sent / accepted(상대가 먼저 보낸 요청이 있어 바로 친구가 됨) / exists / self / not_found
create or replace function public.request_friend(code text)
returns text language plpgsql security definer set search_path = public as $$
declare target uuid; rel public.friendships;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select id into target from public.profiles where friend_code = upper(trim(code));
  if target is null then return 'not_found'; end if;
  if target = auth.uid() then return 'self'; end if;
  select * into rel from public.friendships
   where (requester = auth.uid() and addressee = target) or (requester = target and addressee = auth.uid());
  if found then
    if rel.status = 'pending' and rel.addressee = auth.uid() then
      update public.friendships set status = 'accepted' where id = rel.id; return 'accepted';
    end if;
    return 'exists';
  end if;
  insert into public.friendships (requester, addressee) values (auth.uid(), target);
  return 'sent';
end $$;

-- 내 친구 목록(받은 요청·보낸 요청 포함). 상대의 이메일은 내려주지 않음
create or replace function public.list_friends()
returns table (friend_id uuid, name text, code text, status text, direction text)
language sql stable security definer set search_path = public as $$
  select p.id,
         case when p.display_name <> '' then p.display_name else '친구 ' || substr(p.friend_code, 1, 4) end,
         p.friend_code, f.status,
         case when f.requester = auth.uid() then 'outgoing' else 'incoming' end
  from public.friendships f
  join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where auth.uid() is not null and (f.requester = auth.uid() or f.addressee = auth.uid())
  order by f.created_at desc;
$$;

-- 친구의 기록(공유 범위만). 수락된 친구가 아니면 null
create or replace function public.friend_state(friend uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_friend(friend) then (
    select jsonb_build_object(
      'v', 1,
      'days', coalesce(d.state -> 'days', '{}'::jsonb),
      'profile', jsonb_build_object('sex', coalesce(d.state -> 'profile' ->> 'sex', 'unset'))
    ) from public.user_data d where d.user_id = friend
  ) end;
$$;

revoke execute on function public.is_friend(uuid), public.request_friend(text), public.list_friends(), public.friend_state(uuid) from public, anon;
grant execute on function public.is_friend(uuid), public.request_friend(text), public.list_friends(), public.friend_state(uuid) to authenticated;

-- ───────────── 사진 저장소 (비공개 버킷) ─────────────
-- 경로 규칙: photos/<내 user id>/<사진 id>.jpg  (앱이 이 규칙으로 올림)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg'];

drop policy if exists photos_select on storage.objects;
create policy photos_select on storage.objects for select to authenticated using (
  bucket_id = 'photos' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_friend(((storage.foldername(name))[1])::uuid)
  )
);
drop policy if exists photos_insert on storage.objects;
create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists photos_update on storage.objects;
create policy photos_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists photos_delete on storage.objects;
create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ───────────── 일시정지 방지용 신호 (.github/workflows/keepalive.yml 이 하루 한 번 호출) ─────────────
-- 무료 플랜은 일주일 정도 데이터베이스 사용이 없으면 일시정지될 수 있어, 값을 "기록하는" 작은 호출을 보냅니다.
-- 이 함수는 한 줄의 시각만 갱신하고 다른 데이터에는 접근하지 못합니다.
create table if not exists public.keepalive (
  id int primary key check (id = 1),
  pinged_at timestamptz not null default now()
);
alter table public.keepalive enable row level security;
revoke all on public.keepalive from anon, authenticated;

create or replace function public.keepalive_ping()
returns timestamptz language sql security definer set search_path = public as $$
  insert into public.keepalive (id, pinged_at) values (1, now())
  on conflict (id) do update set pinged_at = now()
  returning pinged_at;
$$;
revoke execute on function public.keepalive_ping() from public;
grant execute on function public.keepalive_ping() to anon, authenticated;
