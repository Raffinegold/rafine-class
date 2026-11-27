-- ============================================================================
--  라피네 학원 원터치화 1단계 (2026-11-26)
--  · 기질 4종 정형화(SYSTEMATIC·EXPLORER·CREATOR·CHALLENGER) + 검사 결과 저장
--  · 오늘의 원터치(이론 → 기질 맞춤 → 완료 체크) + 기질별 미션
--  · 대회 & IT뉴스 피드
--  · 작품·상장 포트폴리오(원장 승인 → 학부모 공유 링크)
--  여러 번 실행해도 안전합니다(if not exists / create or replace / drop policy if exists).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 0) 학생 기질 4종
-- ---------------------------------------------------------------------------
alter table public.students add column if not exists temperament_type text;
alter table public.students add column if not exists temperament_code text;
alter table public.students add column if not exists temperament_updated_at timestamptz;

alter table public.students drop constraint if exists students_temperament_chk;
alter table public.students add constraint students_temperament_chk
  check (temperament_type is null or temperament_type in ('SYSTEMATIC','EXPLORER','CREATOR','CHALLENGER'));

-- 한국 시간 기준 '오늘' (UTC 서버 기준으로 하루가 밀리지 않게)
create or replace function public.kst_today()
returns date language sql stable as $$
  select (now() at time zone 'Asia/Seoul')::date
$$;

-- rafine-mind 아이 유형(K1~K4) → 라피네 학습 기질 4종
create or replace function public.temperament_from_kid(p_kid text)
returns text language sql immutable as $$
  select case upper(trim(coalesce(p_kid,'')))
           when 'K1' then 'CHALLENGER'
           when 'K2' then 'CREATOR'
           when 'K3' then 'SYSTEMATIC'
           when 'K4' then 'EXPLORER'
           else null end
$$;

-- ---------------------------------------------------------------------------
-- 1) 기질 검사 결과 (rafine-mind → 저장)
-- ---------------------------------------------------------------------------
create table if not exists public.temperament_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  student_name text not null,
  source text not null default 'rafine-mind',
  kid_type text not null check (kid_type in ('K1','K2','K3','K4')),
  temperament_type text not null check (temperament_type in ('SYSTEMATIC','EXPLORER','CREATOR','CHALLENGER')),
  mind_code text,
  axes jsonb,
  shares jsonb,
  created_at timestamptz not null default now()
);
create index if not exists temperament_results_student_idx on public.temperament_results (student_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2) 기질별 맞춤 숙제·문제·추가 팁 (과정·주차·회차 단위)
-- ---------------------------------------------------------------------------
create table if not exists public.temperament_missions (
  id uuid primary key default gen_random_uuid(),
  track text not null default 'python',
  week smallint not null check (week between 1 and 24),
  session smallint not null check (session in (1,2)),
  temperament text not null check (temperament in ('SYSTEMATIC','EXPLORER','CREATOR','CHALLENGER')),
  kind text not null check (kind in ('homework','problem','tip')),
  title text not null,
  body text not null,
  hint text,
  answer text,
  sort_no smallint not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (track, week, session, temperament, kind)
);

-- ---------------------------------------------------------------------------
-- 3) 오늘 수업 완료 체크
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_completions (
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null default public.kst_today(),
  week smallint,
  session smallint,
  done_at timestamptz,
  note text,
  updated_at timestamptz not null default now(),
  primary key (student_id, date)
);
create index if not exists lesson_completions_date_idx on public.lesson_completions (date desc, done_at);

-- ---------------------------------------------------------------------------
-- 4) 대회 & IT뉴스
-- ---------------------------------------------------------------------------
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host text,
  target text not null default 'all' check (target in ('elem','middle','high','all')),
  start_date date,
  end_date date,
  event_date date,
  url text,
  summary text,
  visible boolean not null default true,
  sort_no smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.it_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text,
  url text,
  summary text,
  tag text,
  published_at date,
  visible boolean not null default true,
  sort_no smallint not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5) 작품·상장 포트폴리오 (학생 1명당 1개 · 승인 후 공유 링크)
-- ---------------------------------------------------------------------------
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  title text,
  intro text,
  share_token text unique,
  review_note text,
  teacher_note text,                           -- 학부모 공유 링크에 보이는 원장 한 줄 코멘트
  reviewed_at timestamptz,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  kind text not null check (kind in ('work','award')),
  title text not null,
  description text,
  url text,
  image_url text,
  awarded_by text,
  awarded_on date,
  sort_no smallint not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists portfolio_items_portfolio_idx on public.portfolio_items (portfolio_id, sort_no);

-- ---------------------------------------------------------------------------
-- 6) RLS
-- ---------------------------------------------------------------------------
alter table public.temperament_results enable row level security;
alter table public.temperament_missions enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.competitions enable row level security;
alter table public.it_news enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_items enable row level security;

drop policy if exists admin_all_temperament_results on public.temperament_results;
create policy admin_all_temperament_results on public.temperament_results for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_temperament_missions on public.temperament_missions;
create policy admin_all_temperament_missions on public.temperament_missions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_lesson_completions on public.lesson_completions;
create policy admin_all_lesson_completions on public.lesson_completions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_competitions on public.competitions;
create policy admin_all_competitions on public.competitions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_it_news on public.it_news;
create policy admin_all_it_news on public.it_news for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_portfolios on public.portfolios;
create policy admin_all_portfolios on public.portfolios for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_portfolio_items on public.portfolio_items;
create policy admin_all_portfolio_items on public.portfolio_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 대회·IT뉴스는 개인정보가 없어 '노출 ON' 항목만 읽기 공개 (학생·학부모·비로그인 모두)
drop policy if exists public_read_visible_competitions on public.competitions;
create policy public_read_visible_competitions on public.competitions for select to anon, authenticated
  using (visible);

drop policy if exists public_read_visible_it_news on public.it_news;
create policy public_read_visible_it_news on public.it_news for select to anon, authenticated
  using (visible);

grant select on public.competitions to anon;
grant select on public.it_news to anon;
grant select, insert, update, delete on
  public.temperament_results,
  public.temperament_missions,
  public.lesson_completions,
  public.competitions,
  public.it_news,
  public.portfolios,
  public.portfolio_items
to authenticated;

-- ---------------------------------------------------------------------------
-- 7) 학생 RPC (토큰 필요 · anon 실행 허용)
-- ---------------------------------------------------------------------------

-- 오늘의 원터치 한 번에: 학생·배정·기질별 미션·완료·진도·포트폴리오 상태
create or replace function public.student_today_bundle(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students%rowtype;
  v_track text;
  v_week smallint;
  v_session smallint;
  v_done_at timestamptz;
  v_portfolio jsonb;
begin
  select s.* into v_student
    from public.students s
    join public.student_sessions ss on ss.student_id = s.id
   where ss.token = p_token and ss.expires_at > now()
   order by ss.expires_at desc
   limit 1;
  if v_student.id is null then raise exception 'SESSION_INVALID'; end if;

  select a.track, a.week, a.session into v_track, v_week, v_session
    from public.material_assignments a
   where a.student_id = v_student.id;

  if v_track is null then
    select p.track into v_track from public.class_profiles p where p.student_id = v_student.id;
  end if;
  v_track := coalesce(v_track, case v_student.coding_level
                                  when 'C2' then 'python'
                                  when 'C3' then 'roblox'
                                  when 'C4' then 'unity'
                                  else 'scratch' end);
  v_week := coalesce(v_week, 1);
  v_session := coalesce(v_session, 1);

  select lc.done_at into v_done_at
    from public.lesson_completions lc
   where lc.student_id = v_student.id and lc.date = public.kst_today();

  select jsonb_build_object(
           'status', p.status,
           'share_token', p.share_token,
           'updated_at', p.updated_at,
           'review_note', p.review_note)
    into v_portfolio
    from public.portfolios p
   where p.student_id = v_student.id;

  return jsonb_build_object(
    'server_date', public.kst_today(),
    'student', jsonb_build_object(
      'id', v_student.id,
      'name', v_student.name,
      'grade', v_student.grade,
      'class_name', v_student.class_name,
      'coding_level', v_student.coding_level,
      'temperament_type', v_student.temperament_type,
      'temperament_code', v_student.temperament_code),
    'assignment', jsonb_build_object('track', v_track, 'week', v_week, 'session', v_session),
    'missions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'kind', m.kind, 'title', m.title, 'body', m.body,
               'hint', m.hint, 'answer', m.answer, 'temperament', m.temperament)
             order by m.kind, m.sort_no)
        from public.temperament_missions m
       where m.published
         and m.track = v_track
         and m.week = v_week
         and m.session = v_session
         and m.temperament = coalesce(v_student.temperament_type, 'SYSTEMATIC')
    ), '[]'::jsonb),
    'completion', jsonb_build_object('done', v_done_at is not null, 'done_at', v_done_at),
    'progress', coalesce((
      select jsonb_agg(w.week order by w.week)
        from public.class_progress w
       where w.student_id = v_student.id and w.done
    ), '[]'::jsonb),
    'portfolio', coalesce(v_portfolio, '{}'::jsonb)
  );
end;
$$;

-- 오늘 수업 완료 체크 / 해제
create or replace function public.student_complete_lesson(p_token text, p_done boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students%rowtype;
  v_track text;
  v_week smallint;
  v_session smallint;
  v_done_at timestamptz;
begin
  select s.* into v_student
    from public.students s
    join public.student_sessions ss on ss.student_id = s.id
   where ss.token = p_token and ss.expires_at > now()
   order by ss.expires_at desc
   limit 1;
  if v_student.id is null then raise exception 'SESSION_INVALID'; end if;

  select a.track, a.week, a.session into v_track, v_week, v_session
    from public.material_assignments a
   where a.student_id = v_student.id;
  v_week := coalesce(v_week, 1);
  v_session := coalesce(v_session, 1);

  insert into public.lesson_completions (student_id, date, week, session, done_at, updated_at)
  values (v_student.id, public.kst_today(), v_week, v_session,
          case when p_done then now() else null end, now())
  on conflict (student_id, date) do update
     set week = excluded.week,
         session = excluded.session,
         done_at = excluded.done_at,
         updated_at = now();

  select lc.done_at into v_done_at
    from public.lesson_completions lc
   where lc.student_id = v_student.id and lc.date = public.kst_today();

  return jsonb_build_object('ok', true, 'done', v_done_at is not null, 'done_at', v_done_at);
end;
$$;

-- 내 포트폴리오 저장(승인 요청) — 올린 뒤에는 항상 pending 으로 돌아가 원장 확인을 다시 받습니다
create or replace function public.student_portfolio_save(
  p_token text,
  p_title text,
  p_intro text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students%rowtype;
  v_id uuid;
  v_token text;
begin
  select s.* into v_student
    from public.students s
    join public.student_sessions ss on ss.student_id = s.id
   where ss.token = p_token and ss.expires_at > now()
   order by ss.expires_at desc
   limit 1;
  if v_student.id is null then raise exception 'SESSION_INVALID'; end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_PORTFOLIO';
  end if;
  if jsonb_array_length(p_items) > 12 then
    raise exception 'TOO_MANY_ITEMS';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
     where length(coalesce(e->>'image_url','')) > 800000
  ) then
    raise exception 'IMAGE_TOO_LARGE';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
     where coalesce(e->>'image_url','') <> ''
       and not (e->>'image_url' like 'data:image/%' or e->>'image_url' like 'https://%')
  ) then
    raise exception 'IMAGE_URL_INVALID';
  end if;

  insert into public.portfolios (student_id, status, title, intro, review_note, updated_at)
  values (v_student.id, 'pending', left(coalesce(p_title,''), 120), left(coalesce(p_intro,''), 1200), null, now())
  on conflict (student_id) do update
     set status = 'pending',
         title = excluded.title,
         intro = excluded.intro,
         review_note = null,
         updated_at = now()
  returning id, share_token into v_id, v_token;

  delete from public.portfolio_items where portfolio_id = v_id;

  insert into public.portfolio_items
    (portfolio_id, kind, title, description, url, image_url, awarded_by, awarded_on, sort_no)
  select v_id,
         case when e->>'kind' = 'award' then 'award' else 'work' end,
         left(coalesce(e->>'title',''), 120),
         left(coalesce(e->>'description',''), 600),
         nullif(left(coalesce(e->>'url',''), 500), ''),
         nullif(left(coalesce(e->>'image_url',''), 800000), ''),
         nullif(left(coalesce(e->>'awarded_by',''), 120), ''),
         nullif(nullif(e->>'awarded_on',''), '')::date,
         (row_number() over ())::smallint
    from jsonb_array_elements(p_items) e;

  return jsonb_build_object('ok', true, 'status', 'pending', 'share_token', v_token);
end;
$$;

-- 내 포트폴리오 보기
create or replace function public.student_portfolio_get(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students%rowtype;
  v_p public.portfolios%rowtype;
begin
  select s.* into v_student
    from public.students s
    join public.student_sessions ss on ss.student_id = s.id
   where ss.token = p_token and ss.expires_at > now()
   order by ss.expires_at desc
   limit 1;
  if v_student.id is null then raise exception 'SESSION_INVALID'; end if;

  select * into v_p from public.portfolios where student_id = v_student.id;
  if v_p.id is null then
    return jsonb_build_object('portfolio', null, 'items', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'portfolio', jsonb_build_object(
      'status', v_p.status,
      'title', v_p.title,
      'intro', v_p.intro,
      'share_token', v_p.share_token,
      'review_note', v_p.review_note,
      'updated_at', v_p.updated_at),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'kind', i.kind, 'title', i.title, 'description', i.description,
               'url', i.url, 'image_url', i.image_url,
               'awarded_by', i.awarded_by, 'awarded_on', i.awarded_on)
             order by i.sort_no)
        from public.portfolio_items i
       where i.portfolio_id = v_p.id
    ), '[]'::jsonb)
  );
end;
$$;

-- 학부모 공유 링크 — 승인된 포트폴리오만, 개인정보 최소(이름·학년·과정)만
create or replace function public.portfolio_public(p_share_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_p public.portfolios%rowtype;
  v_student public.students%rowtype;
  v_track text;
begin
  if p_share_token is null or length(trim(p_share_token)) < 8 then
    raise exception 'NOT_FOUND';
  end if;

  select * into v_p from public.portfolios
   where share_token = trim(p_share_token) and status = 'approved' and share_token is not null;
  if v_p.id is null then raise exception 'NOT_FOUND'; end if;

  select * into v_student from public.students where id = v_p.student_id;
  if v_student.id is null then raise exception 'NOT_FOUND'; end if;

  select p.track into v_track from public.class_profiles p where p.student_id = v_student.id;
  v_track := coalesce(v_track, case v_student.coding_level
                                  when 'C2' then 'python'
                                  when 'C3' then 'roblox'
                                  when 'C4' then 'unity'
                                  else 'scratch' end);

  update public.portfolios set view_count = view_count + 1 where id = v_p.id;

  return jsonb_build_object(
    'student_name', v_student.name,
    'grade', v_student.grade,
    'track', v_track,
    'title', v_p.title,
    'intro', v_p.intro,
    'teacher_note', v_p.teacher_note,
    'approved_at', v_p.reviewed_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'kind', i.kind, 'title', i.title, 'description', i.description,
               'url', i.url, 'image_url', i.image_url,
               'awarded_by', i.awarded_by, 'awarded_on', i.awarded_on)
             order by i.sort_no)
        from public.portfolio_items i
       where i.portfolio_id = v_p.id
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 8) rafine-mind 검사 결과 저장 (이름 + PIN 확인 필요 → 익명 도배 차단)
-- ---------------------------------------------------------------------------
create or replace function public.mind_submit(
  p_name text,
  p_pin text,
  p_kid text,
  p_code text default null,
  p_axes jsonb default null,
  p_shares jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students%rowtype;
  v_temper text;
  v_recent int;
begin
  v_temper := public.temperament_from_kid(p_kid);
  if v_temper is null then raise exception 'BAD_KID_TYPE'; end if;

  select * into v_student
    from public.students
   where lower(trim(name)) = lower(trim(coalesce(p_name,'')))
     and active
   order by created_at
   limit 1;
  if not found then raise exception 'STUDENT_NOT_FOUND'; end if;

  if v_student.pin_hash is null or v_student.pin_hash = ''
     or crypt(coalesce(p_pin,''), v_student.pin_hash) <> v_student.pin_hash then
    raise exception 'PIN_MISMATCH';
  end if;

  select count(*) into v_recent
    from public.temperament_results
   where student_id = v_student.id and created_at > now() - interval '1 hour';
  if v_recent >= 10 then raise exception 'TOO_MANY_REQUESTS'; end if;

  insert into public.temperament_results
    (student_id, student_name, source, kid_type, temperament_type, mind_code, axes, shares)
  values
    (v_student.id, v_student.name, 'rafine-mind', upper(trim(p_kid)), v_temper,
     nullif(trim(coalesce(p_code,'')), ''), p_axes, p_shares);

  update public.students
     set temperament_type = v_temper,
         temperament_code = nullif(trim(coalesce(p_code,'')), ''),
         temperament_updated_at = now()
   where id = v_student.id;

  return jsonb_build_object(
    'ok', true,
    'student_name', v_student.name,
    'temperament_type', v_temper,
    'saved_at', now()
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 9) 원장 RPC (인증된 원장 계정만)
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_temperament(p_student_id uuid, p_type text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_type text;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;

  v_type := nullif(upper(trim(coalesce(p_type,''))), '');
  if v_type is not null and lower(v_type) <> 'auto'
     and v_type not in ('SYSTEMATIC','EXPLORER','CREATOR','CHALLENGER') then
    raise exception 'BAD_TYPE';
  end if;
  if v_type = 'AUTO' then v_type := null; end if;

  update public.students
     set temperament_type = v_type,
         temperament_updated_at = now()
   where id = p_student_id;
  if not found then raise exception 'STUDENT_NOT_FOUND'; end if;

  return jsonb_build_object('ok', true, 'student_id', p_student_id, 'temperament_type', v_type);
end;
$$;

-- 학부모 공유 링크에 보일 ‘원장 한 줄 코멘트’ 저장 (승인 상태와 무관하게 코멘트만 바꿈)
create or replace function public.admin_set_portfolio_note(p_id uuid, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_note text;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  v_note := nullif(left(trim(coalesce(p_note, '')), 120), '');

  update public.portfolios
     set teacher_note = v_note,
         updated_at = now()
   where id = p_id;
  if not found then raise exception 'PORTFOLIO_NOT_FOUND'; end if;

  return jsonb_build_object('ok', true, 'teacher_note', v_note);
end;
$$;

create or replace function public.admin_review_portfolio(p_id uuid, p_action text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
  v_status text;
  v_note text;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  v_note := nullif(trim(coalesce(p_note,'')), '');

  if p_action = 'approve' then
    update public.portfolios
       set status = 'approved',
           reviewed_at = now(),
           review_note = v_note,
           share_token = coalesce(share_token, encode(gen_random_bytes(12), 'hex'))
     where id = p_id
    returning share_token, status into v_token, v_status;
  elsif p_action = 'reject' then
    update public.portfolios
       set status = 'rejected',
           reviewed_at = now(),
           review_note = v_note
     where id = p_id
    returning share_token, status into v_token, v_status;
  else
    raise exception 'BAD_ACTION';
  end if;

  if v_status is null then raise exception 'PORTFOLIO_NOT_FOUND'; end if;
  return jsonb_build_object('ok', true, 'status', v_status, 'share_token', v_token);
end;
$$;

-- ---------------------------------------------------------------------------
-- 10) 실행 권한
-- ---------------------------------------------------------------------------
revoke all on function public.student_today_bundle(text) from public;
revoke all on function public.student_complete_lesson(text, boolean) from public;
revoke all on function public.student_portfolio_save(text, text, text, jsonb) from public;
revoke all on function public.student_portfolio_get(text) from public;
revoke all on function public.portfolio_public(text) from public;
revoke all on function public.mind_submit(text, text, text, text, jsonb, jsonb) from public;
revoke all on function public.admin_set_temperament(uuid, text) from public;
revoke all on function public.admin_review_portfolio(uuid, text, text) from public;
revoke all on function public.admin_set_portfolio_note(uuid, text) from public;

grant execute on function public.student_today_bundle(text) to anon, authenticated;
grant execute on function public.student_complete_lesson(text, boolean) to anon, authenticated;
grant execute on function public.student_portfolio_save(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.student_portfolio_get(text) to anon, authenticated;
grant execute on function public.portfolio_public(text) to anon, authenticated;
grant execute on function public.mind_submit(text, text, text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.admin_set_temperament(uuid, text) to authenticated;
grant execute on function public.admin_review_portfolio(uuid, text, text) to authenticated;
grant execute on function public.admin_set_portfolio_note(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 11) 학생 로그인 응답에서 parent_token(학부모 리포트 열쇠) 제거
--     학생 브라우저에 학부모 공유 열쇠가 남지 않게 합니다.
-- ---------------------------------------------------------------------------
create or replace function public.student_login(p_name text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students%rowtype;
  v_token text;
begin
  select * into v_student
    from public.students
   where lower(trim(name)) = lower(trim(p_name))
     and active
   order by created_at
   limit 1;

  if not found then
    raise exception 'STUDENT_NOT_FOUND';
  end if;

  if v_student.pin_hash is null
     or v_student.pin_hash = ''
     or crypt(p_pin, v_student.pin_hash) <> v_student.pin_hash then
    raise exception 'PIN_MISMATCH';
  end if;

  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.student_sessions(token, student_id, expires_at)
  values (v_token, v_student.id, now() + interval '12 hours');

  update public.students set last_seen_at = now() where id = v_student.id;

  return jsonb_build_object(
    'token', v_token,
    'student', to_jsonb(v_student) - 'pin_hash' - 'parent_token'
  );
end;
$$;

create or replace function public.student_bundle(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session public.student_sessions%rowtype;
  v_student public.students%rowtype;
begin
  select * into v_session
    from public.student_sessions
   where token = p_token and expires_at > now();
  if not found then
    raise exception 'SESSION_EXPIRED';
  end if;

  select * into v_student from public.students where id = v_session.student_id;
  if not found then
    raise exception 'STUDENT_NOT_FOUND';
  end if;

  return jsonb_build_object(
    'student', to_jsonb(v_student) - 'pin_hash' - 'parent_token',
    'sets', coalesce((
      select jsonb_agg(to_jsonb(s)) from public.word_sets s
       where s.level = v_student.level and s.active
    ), '[]'::jsonb),
    'words', coalesce((
      select jsonb_agg(to_jsonb(w))
        from public.words w
        join public.word_sets s on s.id = w.set_id
       where s.level = v_student.level and s.active
    ), '[]'::jsonb),
    'wrong_notes', coalesce((
      select jsonb_agg(to_jsonb(n)) from public.wrong_notes n
       where n.student_id = v_student.id
    ), '[]'::jsonb),
    'logs', coalesce((
      select jsonb_agg(to_jsonb(l))
        from public.study_logs l
       where l.student_id = v_student.id
         and l.answered_at > now() - interval '30 days'
    ), '[]'::jsonb),
    'progress', coalesce((
      select jsonb_agg(jsonb_build_object('date', d.day, 'answered', d.cnt))
        from (
          select (l.answered_at at time zone 'Asia/Seoul')::date as day, count(*) as cnt
            from public.study_logs l
           where l.student_id = v_student.id
             and l.answered_at > now() - interval '30 days'
           group by 1
        ) d
    ), '[]'::jsonb),
    'wallet', (
      select to_jsonb(w) from public.cash_wallets w where w.student_id = v_student.id
    ),
    'shop_items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.sort_no)
        from public.shop_items i
       where i.active
    ), '[]'::jsonb),
    'redemptions', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.requested_at desc)
        from public.redemption_requests r
       where r.student_id = v_student.id
    ), '[]'::jsonb),
    'daily_cash_limit', public.cash_daily_limit()
  );
end;
$$;
