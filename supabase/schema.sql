-- ============================================================================
--  라피네 영단어 MVP — Supabase 스키마
--  라피네코딩컴퓨터학원 두정점 / TOSEL 연계 5단계
--  Supabase 대시보드 → SQL Editor 에 통째로 붙여 실행하세요.
--  (여러 번 실행해도 되도록 if not exists / drop policy if exists 사용)
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) 학생
--    pin_hash: bcrypt 해시 (pgcrypto crypt). 평문 저장 금지.
-- ---------------------------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_name text,
  grade smallint,
  level smallint not null default 1 check (level between 1 and 5),
  tosel_level text,
  pin_hash text not null,
  nickname text,
  parent_token text unique,
  active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 2) 단어 세트 (트랙·일차 단위)
-- ---------------------------------------------------------------------------
create table if not exists public.word_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level smallint not null check (level between 1 and 5),
  day_index smallint,
  active boolean not null default true,
  created_at timestamptz default now(),
  unique (level, day_index)
);

-- ---------------------------------------------------------------------------
-- 3) 단어 (ipa 는 카드 화면 발음기호용 확장 컬럼)
-- ---------------------------------------------------------------------------
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  set_id uuid references public.word_sets(id) on delete cascade,
  word text not null,
  meaning text not null,
  pos text,
  ipa text,
  example text,
  example_ko text,
  order_no smallint,
  unique (set_id, word)
);

-- ---------------------------------------------------------------------------
-- 4) 배정 (오늘의 미션 = 학생 × 세트)
-- ---------------------------------------------------------------------------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  set_id uuid references public.word_sets(id) on delete cascade,
  assigned_on date not null default current_date,
  unique (student_id, set_id)
);

-- ---------------------------------------------------------------------------
-- 5) 풀이 로그 (문항 단위)
-- ---------------------------------------------------------------------------
create table if not exists public.study_logs (
  id bigserial primary key,
  student_id uuid references public.students(id) on delete cascade,
  word_id uuid references public.words(id) on delete cascade,
  set_id uuid references public.word_sets(id),
  is_correct boolean not null,
  mode text check (mode in ('card', 'choice', 'spell')),
  elapsed_ms int,
  answered_at timestamptz default now()
);
create index if not exists study_logs_student_time on public.study_logs (student_id, answered_at desc);

-- ---------------------------------------------------------------------------
-- 6) 오답 노트 (간격 반복 상태) — box 0→다음 날, 1→2일, 2→4일, 3→7일, 4=졸업
-- ---------------------------------------------------------------------------
create table if not exists public.wrong_notes (
  id bigserial primary key,
  student_id uuid references public.students(id) on delete cascade,
  word_id uuid references public.words(id) on delete cascade,
  box smallint not null default 0 check (box between 0 and 4),
  due_date date not null default current_date,
  miss_count int not null default 1,
  cleared_at timestamptz,
  unique (student_id, word_id)
);
create index if not exists wrong_notes_due on public.wrong_notes (student_id, due_date);

-- ---------------------------------------------------------------------------
-- 7) 주간 리포트 스냅샷 (금요일에 복사한 문구 보관)
-- ---------------------------------------------------------------------------
create table if not exists public.weekly_reports (
  id bigserial primary key,
  student_id uuid references public.students(id) on delete cascade,
  week_start date not null,
  words_done int,
  accuracy int,
  streak_days int,
  message text,
  opened_at timestamptz,
  unique (student_id, week_start)
);

-- ---------------------------------------------------------------------------
-- 8) 레벨 배정 이력 (설계서 4-2 「배정 이력이 남습니다」 구현용 확장 테이블)
-- ---------------------------------------------------------------------------
create table if not exists public.level_history (
  id bigserial primary key,
  student_id uuid references public.students(id) on delete cascade,
  from_level smallint,
  to_level smallint not null,
  tosel_level text,
  changed_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 9) 학생 세션 (PIN 로그인 후 12시간 유효한 토큰)
--    브라우저에는 anon 키만 있고, 학생 데이터 접근은 아래 RPC 로만 허용합니다.
-- ---------------------------------------------------------------------------
create table if not exists public.student_sessions (
  token text primary key,
  student_id uuid references public.students(id) on delete cascade,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);
create index if not exists student_sessions_expiry on public.student_sessions (expires_at);

-- ---------------------------------------------------------------------------
-- 10) 캐시 지갑 (학생 1명당 1행) — 보유 캐시(cash_balance)와 오늘 적립(daily_cash_earned)
--     하루 적립 상한은 app_settings.cash_daily_limit (기본 50원) 로 관리합니다.
-- ---------------------------------------------------------------------------
create table if not exists public.cash_wallets (
  student_id uuid primary key references public.students(id) on delete cascade,
  cash_balance int not null default 0 check (cash_balance >= 0),
  daily_cash_earned int not null default 0 check (daily_cash_earned >= 0),
  earned_date date not null default (now() at time zone 'Asia/Seoul')::date,
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 11) 기프티콘 상점 상품
-- ---------------------------------------------------------------------------
create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price int not null check (price > 0),
  emoji text default '🎁',
  active boolean not null default true,
  sort_no smallint not null default 0,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 12) 기프티콘 교환 신청 (신청 시점에 캐시는 즉시 차감, 취소 시 환불)
--     item_name·price 는 신청 당시 스냅샷 — 상품이 수정·삭제되어도 내역은 유지됩니다.
-- ---------------------------------------------------------------------------
create table if not exists public.redemption_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  item_id uuid references public.shop_items(id) on delete set null,
  item_name text not null,
  price int not null check (price >= 0),
  status text not null default 'pending' check (status in ('pending', 'sent', 'canceled')),
  requested_at timestamptz default now(),
  handled_at timestamptz
);
create index if not exists redemption_status_idx on public.redemption_requests (status, requested_at desc);

-- ---------------------------------------------------------------------------
-- 13) 짝짓기 게임 판 기록 (어떤 단어를 헷갈렸는지 포함)
-- ---------------------------------------------------------------------------
create table if not exists public.game_sessions (
  id bigserial primary key,
  student_id uuid references public.students(id) on delete cascade,
  pairs smallint not null check (pairs in (6, 8)),
  attempts smallint,
  duration_ms int,
  cash_earned int not null default 0,
  wrong_word_ids jsonb not null default '[]'::jsonb,
  played_at timestamptz default now()
);
create index if not exists game_sessions_student_idx on public.game_sessions (student_id, played_at desc);

-- ---------------------------------------------------------------------------
-- 14) 앱 설정 — 일일 캐시 상한 등 (key/value)
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
insert into public.app_settings (key, value)
values ('cash_daily_limit', '{"value": 50}'::jsonb)
on conflict (key) do nothing;

-- ============================================================================
--  RLS (행 수준 보안)
--  - anon: 개인정보 테이블 접근 불가. 단어장(word_sets, words)만 읽기 허용.
--  - authenticated(원장님): app_metadata.role = 'admin' 이면 전 테이블.
--  - 학생: student_sessions 토큰을 받은 RPC 로만 자기 데이터 접근.
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role'),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
    ''
  ) = 'admin';
$$;

alter table public.students enable row level security;
alter table public.word_sets enable row level security;
alter table public.words enable row level security;
alter table public.assignments enable row level security;
alter table public.study_logs enable row level security;
alter table public.wrong_notes enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.level_history enable row level security;
alter table public.student_sessions enable row level security;
alter table public.cash_wallets enable row level security;
alter table public.shop_items enable row level security;
alter table public.redemption_requests enable row level security;
alter table public.game_sessions enable row level security;
alter table public.app_settings enable row level security;

-- 원장님 전체 권한
drop policy if exists admin_all_students on public.students;
create policy admin_all_students on public.students for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_sets on public.word_sets;
create policy admin_all_sets on public.word_sets for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_words on public.words;
create policy admin_all_words on public.words for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_assignments on public.assignments;
create policy admin_all_assignments on public.assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_logs on public.study_logs;
create policy admin_all_logs on public.study_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_notes on public.wrong_notes;
create policy admin_all_notes on public.wrong_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_reports on public.weekly_reports;
create policy admin_all_reports on public.weekly_reports for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_history on public.level_history;
create policy admin_all_history on public.level_history for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 원장님: 상점·교환·캐시 전권
drop policy if exists admin_all_wallets on public.cash_wallets;
create policy admin_all_wallets on public.cash_wallets for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_shop_items on public.shop_items;
create policy admin_all_shop_items on public.shop_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_redemptions on public.redemption_requests;
create policy admin_all_redemptions on public.redemption_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_game_sessions on public.game_sessions;
create policy admin_all_game_sessions on public.game_sessions for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_settings on public.app_settings;
create policy admin_all_settings on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 상품 목록은 개인정보가 없으니 읽기 공개 (숨김 상품은 제외)
drop policy if exists public_read_shop_items on public.shop_items;
create policy public_read_shop_items on public.shop_items for select to anon, authenticated using (active);

-- 단어장은 학습 콘텐츠라 읽기 공개 (개인정보 없음)
drop policy if exists public_read_sets on public.word_sets;
create policy public_read_sets on public.word_sets for select to anon, authenticated using (true);

drop policy if exists public_read_words on public.words;
create policy public_read_words on public.words for select to anon, authenticated using (true);

-- 학생이 커스텀 JWT(sub=학생 id)를 받은 경우 자기 행만 조회
drop policy if exists student_read_self on public.students;
create policy student_read_self on public.students for select to authenticated
  using (id::text = coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', ''));

drop policy if exists student_read_own_assignments on public.assignments;
create policy student_read_own_assignments on public.assignments for select to authenticated
  using (student_id::text = coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', ''));

-- 부모 링크(weekly_reports, students)는 정책을 열지 않습니다.
-- 학부모 화면은 Edge Function(parent-report)이 service_role 로 집계값만 돌려줍니다.

-- ============================================================================
--  학생 로그인 / 학습 RPC
--  SECURITY DEFINER 로 RLS 를 우회하되, 토큰이 없으면 아무것도 돌려주지 않습니다.
-- ============================================================================

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
    'student', to_jsonb(v_student) - 'pin_hash'
  );
end;
$$;

-- 로그인 후 한 번에 받아 가는 학생 데이터 묶음 (미션 계산에 필요한 것 전부)
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
    'student', to_jsonb(v_student) - 'pin_hash',
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

-- 문항 1건 저장 + 오답 노트 간격 반복 갱신
create or replace function public.student_answer(
  p_token text,
  p_word_id uuid,
  p_correct boolean,
  p_mode text,
  p_elapsed_ms int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session public.student_sessions%rowtype;
  v_set uuid;
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_box smallint;
  v_gap int;
begin
  select * into v_session
    from public.student_sessions
   where token = p_token and expires_at > now();
  if not found then
    raise exception 'SESSION_EXPIRED';
  end if;

  select set_id into v_set from public.words where id = p_word_id;

  insert into public.study_logs(student_id, word_id, set_id, is_correct, mode, elapsed_ms)
  values (v_session.student_id, p_word_id, v_set, p_correct,
          case when p_mode in ('card','choice','spell') then p_mode else 'choice' end,
          greatest(coalesce(p_elapsed_ms, 0), 0));

  if p_correct then
    select box into v_box from public.wrong_notes
     where student_id = v_session.student_id and word_id = p_word_id;
    if found then
      v_gap := case v_box when 0 then 1 when 1 then 2 when 2 then 4 when 3 then 7 else 7 end;
      if v_box >= 4 then
        update public.wrong_notes set cleared_at = coalesce(cleared_at, now())
         where student_id = v_session.student_id and word_id = p_word_id;
      else
        update public.wrong_notes
           set box = v_box + 1,
               due_date = v_today + v_gap,
               cleared_at = case when v_box + 1 >= 4 then now() else null end
         where student_id = v_session.student_id and word_id = p_word_id;
      end if;
    end if;
  else
    insert into public.wrong_notes(student_id, word_id, box, due_date, miss_count, cleared_at)
    values (v_session.student_id, p_word_id, 0, v_today + 1, 1, null)
    on conflict (student_id, word_id) do update
      set box = 0,
          due_date = v_today + 1,
          miss_count = public.wrong_notes.miss_count + 1,
          cleared_at = null;
  end if;

  update public.students set last_seen_at = now() where id = v_session.student_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================================
--  캐시 · 기프티콘 상점 RPC
--  보상 금액과 일일 상한은 서버에서 계산합니다. 클라이언트가 보낸 금액을 믿지 않습니다.
-- ============================================================================

-- 오늘의 일일 적립 상한 (기본 50원)
create or replace function public.cash_daily_limit()
returns int
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(
    (select nullif(value ->> 'value', '')::int from public.app_settings where key = 'cash_daily_limit'),
    50
  );
$$;

-- 지갑 보장 + 날짜가 바뀌었으면 오늘 적립을 0으로 되돌립니다
create or replace function public.ensure_wallet(p_student_id uuid)
returns public.cash_wallets
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_wallet public.cash_wallets%rowtype;
  v_today date := (now() at time zone 'Asia/Seoul')::date;
begin
  insert into public.cash_wallets (student_id, earned_date)
  values (p_student_id, v_today)
  on conflict (student_id) do nothing;

  update public.cash_wallets
     set daily_cash_earned = 0, earned_date = v_today, updated_at = now()
   where student_id = p_student_id
     and earned_date <> v_today;

  select * into v_wallet from public.cash_wallets where student_id = p_student_id;
  return v_wallet;
end;
$$;

-- 짝짓기 게임 1판 적립 — 서버 규칙으로 보상을 계산하고 하루 상한까지만 지급
create or replace function public.student_game_reward(
  p_token text,
  p_pairs smallint,
  p_attempts smallint,
  p_max_combo smallint,
  p_duration_ms int,
  p_wrong_word_ids jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session public.student_sessions%rowtype;
  v_wallet public.cash_wallets%rowtype;
  v_pairs smallint := case when p_pairs = 8 then 8 else 6 end;
  v_attempts smallint := greatest(coalesce(p_attempts, 0), v_pairs);
  v_limit int := public.cash_daily_limit();
  v_base int := case when v_pairs = 8 then 15 else 10 end;
  v_perfect int := case when v_attempts <= v_pairs then 5 else 0 end;
  v_combo int := case
                   when coalesce(p_max_combo, 0) >= v_pairs then 2
                   when coalesce(p_max_combo, 0) >= 3 then 1
                   else 0
                 end;
  v_speed int := case
                   when coalesce(p_duration_ms, 0) > 0 and p_duration_ms <= v_pairs * 7000 then 3
                   else 0
                 end;
  v_raw int;
  v_pay int;
begin
  select * into v_session from public.student_sessions
   where token = p_token and expires_at > now();
  if not found then
    raise exception 'SESSION_EXPIRED';
  end if;

  v_wallet := public.ensure_wallet(v_session.student_id);
  v_raw := v_base + v_perfect + v_combo + v_speed;
  v_pay := greatest(0, least(v_raw, v_limit - v_wallet.daily_cash_earned));

  update public.cash_wallets
     set cash_balance = cash_balance + v_pay,
         daily_cash_earned = daily_cash_earned + v_pay,
         updated_at = now()
   where student_id = v_session.student_id
   returning * into v_wallet;

  insert into public.game_sessions(student_id, pairs, attempts, duration_ms, cash_earned, wrong_word_ids)
  values (v_session.student_id, v_pairs, v_attempts, greatest(coalesce(p_duration_ms, 0), 0), v_pay,
          coalesce(p_wrong_word_ids, '[]'::jsonb));

  return jsonb_build_object(
    'raw', v_raw,
    'earned', v_pay,
    'capped', v_pay < v_raw,
    'limit', v_limit,
    'wallet', to_jsonb(v_wallet)
  );
end;
$$;

-- 기프티콘 교환 신청 — 잔액 확인 후 즉시 차감, ’신청 대기’로 기록
create or replace function public.student_redeem(p_token text, p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session public.student_sessions%rowtype;
  v_item public.shop_items%rowtype;
  v_wallet public.cash_wallets%rowtype;
  v_request public.redemption_requests%rowtype;
begin
  select * into v_session from public.student_sessions
   where token = p_token and expires_at > now();
  if not found then
    raise exception 'SESSION_EXPIRED';
  end if;

  select * into v_item from public.shop_items where id = p_item_id and active;
  if not found then
    raise exception 'ITEM_NOT_FOUND';
  end if;

  perform public.ensure_wallet(v_session.student_id);
  select * into v_wallet from public.cash_wallets where student_id = v_session.student_id for update;
  if v_wallet.cash_balance < v_item.price then
    raise exception 'NOT_ENOUGH_CASH';
  end if;

  update public.cash_wallets
     set cash_balance = cash_balance - v_item.price, updated_at = now()
   where student_id = v_session.student_id
   returning * into v_wallet;

  insert into public.redemption_requests(student_id, item_id, item_name, price, status)
  values (v_session.student_id, v_item.id, v_item.name, v_item.price, 'pending')
  returning * into v_request;

  return jsonb_build_object('request', to_jsonb(v_request), 'wallet', to_jsonb(v_wallet));
end;
$$;

-- 원장님: 교환 처리 (sent = 발송 완료 / cancel = 취소 후 캐시 환불)
create or replace function public.admin_handle_redemption(p_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_request public.redemption_requests%rowtype;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  if p_action not in ('sent', 'cancel') then
    raise exception 'BAD_ACTION';
  end if;

  select * into v_request from public.redemption_requests where id = p_id for update;
  if not found then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  if v_request.status <> 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'ALREADY_HANDLED', 'status', v_request.status);
  end if;

  if p_action = 'cancel' then
    perform public.ensure_wallet(v_request.student_id);
    update public.cash_wallets
       set cash_balance = cash_balance + v_request.price, updated_at = now()
     where student_id = v_request.student_id;
  end if;

  update public.redemption_requests
     set status = case when p_action = 'sent' then 'sent' else 'canceled' end,
         handled_at = now()
   where id = p_id
   returning * into v_request;

  return jsonb_build_object('ok', true, 'request', to_jsonb(v_request));
end;
$$;

-- 원장님: 일일 캐시 적립 상한 변경
create or replace function public.admin_set_cash_limit(p_limit int)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_limit int := greatest(0, least(100000, coalesce(p_limit, 50)));
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  insert into public.app_settings(key, value, updated_at)
  values ('cash_daily_limit', jsonb_build_object('value', v_limit), now())
  on conflict (key) do update
    set value = excluded.value, updated_at = now();

  return jsonb_build_object('ok', true, 'limit', v_limit);
end;
$$;

-- 원장님: 학생 추가 (bcrypt PIN 발급) — 앱 관리자 화면에서 호출
create or replace function public.admin_create_student(
  p_name text,
  p_grade smallint,
  p_class_name text,
  p_nickname text,
  p_level smallint,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students%rowtype;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  insert into public.students (name, class_name, grade, level, tosel_level, pin_hash, nickname, parent_token)
  values (
    trim(p_name),
    p_class_name,
    p_grade,
    greatest(1, least(5, p_level)),
    case greatest(1, least(5, p_level))
      when 1 then 'Pre-Starter' when 2 then 'Starter' when 3 then 'Basic' when 4 then 'Junior' else 'High Junior'
    end,
    crypt(p_pin, gen_salt('bf')),
    coalesce(p_nickname, trim(p_name)),
    encode(gen_random_bytes(16), 'hex')
  )
  returning * into v_student;

  insert into public.assignments (student_id, set_id)
  select v_student.id, ws.id from public.word_sets ws where ws.level = v_student.level and ws.active;

  insert into public.level_history (student_id, from_level, to_level, tosel_level)
  values (v_student.id, null, v_student.level, v_student.tosel_level);

  return jsonb_build_object('student', to_jsonb(v_student) - 'pin_hash', 'pin', p_pin);
end;
$$;

-- 원장님: PIN 재발급
create or replace function public.admin_reset_pin(p_student_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  update public.students set pin_hash = crypt(p_pin, gen_salt('bf')) where id = p_student_id;
  delete from public.student_sessions where student_id = p_student_id;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.admin_create_student(text, smallint, text, text, smallint, text) to authenticated;
grant execute on function public.admin_reset_pin(uuid, text) to authenticated;
grant execute on function public.admin_handle_redemption(uuid, text) to authenticated;
grant execute on function public.admin_set_cash_limit(int) to authenticated;

-- 오래된 세션 정리 (Cron 또는 수동 실행)
create or replace function public.cleanup_sessions()
returns void
language sql
security definer
set search_path = public, extensions
as $$ delete from public.student_sessions where expires_at < now(); $$;

-- anon/authenticated 는 테이블 직접 접근 대신 RPC 만 사용
revoke all on function public.student_login(text, text) from public;
revoke all on function public.student_bundle(text) from public;
revoke all on function public.student_answer(text, uuid, boolean, text, int) from public;
revoke all on function public.student_game_reward(text, smallint, smallint, smallint, int, jsonb) from public;
revoke all on function public.student_redeem(text, uuid) from public;
revoke all on function public.cash_daily_limit() from public;
grant execute on function public.student_login(text, text) to anon, authenticated;
grant execute on function public.student_bundle(text) to anon, authenticated;
grant execute on function public.student_answer(text, uuid, boolean, text, int) to anon, authenticated;
grant execute on function public.student_game_reward(text, smallint, smallint, smallint, int, jsonb) to anon, authenticated;
grant execute on function public.student_redeem(text, uuid) to anon, authenticated;
grant execute on function public.cash_daily_limit() to anon, authenticated;

-- ============================================================================
--  시드 예시 — 5명 학생 + Level 1 샘플 세트 1개
--  (앱의 100단어 시드는 src/data/seed.ts 에 있고, 필요하면 아래처럼 넣습니다)
-- ============================================================================
-- insert into public.students (name, class_name, grade, level, tosel_level, pin_hash, nickname, parent_token)
-- values
--   ('김서연', '초등B', 5, 3, 'Basic', crypt('1111', gen_salt('bf')), '별빛서연', encode(gen_random_bytes(16), 'hex')),
--   ('박준우', '초등B', 6, 3, 'Basic', crypt('2222', gen_salt('bf')), '코딩준우', encode(gen_random_bytes(16), 'hex'));

-- insert into public.word_sets (name, level, day_index) values ('Level 3 · Day 01', 3, 1);
-- insert into public.words (set_id, word, meaning, pos, ipa, example, example_ko, order_no)
-- select id, 'honest', '정직한', 'adj', '/ˈɑːnɪst/', 'An honest answer is always better.', '정직한 대답이 항상 더 좋아요.', 1
--   from public.word_sets where level = 3 and day_index = 1;
-- insert into public.assignments (student_id, set_id)
-- select s.id, ws.id from public.students s join public.word_sets ws on ws.level = s.level;

-- 기프티콘 상점 초기 상품 (앱의 데모 시드와 동일)
-- insert into public.shop_items (name, price, emoji, sort_no) values
--   ('츄파춥스', 300, '🍭', 1),
--   ('바나나맛 우유', 1500, '🥛', 2),
--   ('CU 모바일금액권 3,000원', 3000, '🎟️', 3),
--   ('배스킨라빈스 싱글레귤러', 3900, '🍦', 4);


-- ============================================================================
--  15) 코딩 확장 (2026-11-17) — 영어 + 코딩 통합 학습
--      · students.coding_level        : C1 블록·기초 / C2 파이썬 / C3 C언어 / C4 유니티 C#
--      · students.enabled_subjects    : 원장님이 열어 준 수강 과목 (english, coding)
--      · coding_logs / coding_wrong_notes / coding_sessions
--  여러 번 실행해도 되도록 add column if not exists / drop policy if exists 를 씁니다.
-- ============================================================================

alter table public.students
  add column if not exists coding_level text not null default 'C1',
  add column if not exists enabled_subjects text[] not null default '{english,coding}'::text[];

alter table public.students drop constraint if exists students_coding_level_check;
alter table public.students
  add constraint students_coding_level_check check (coding_level in ('C1', 'C2', 'C3', 'C4'));

alter table public.students drop constraint if exists students_subjects_check;
alter table public.students
  add constraint students_subjects_check
  check (enabled_subjects <@ array['english', 'coding']::text[] and array_length(enabled_subjects, 1) >= 1);

-- 코딩 문항 풀이 로그 (problem_id 는 앱 시드 src/data/codingSeed.ts 의 id)
create table if not exists public.coding_logs (
  id bigserial primary key,
  student_id uuid references public.students(id) on delete cascade,
  problem_id text not null,
  level text not null,
  kind text not null check (kind in ('output', 'blank', 'bug', 'order')),
  is_correct boolean not null,
  mode text not null default 'mission' check (mode in ('mission', 'game', 'review')),
  answered_at timestamptz default now()
);
create index if not exists coding_logs_student_idx on public.coding_logs (student_id, answered_at desc);

-- 코딩 오답 노트 (문제 단위 누적 · 다시 맞히면 cleared_at)
create table if not exists public.coding_wrong_notes (
  student_id uuid references public.students(id) on delete cascade,
  problem_id text not null,
  level text not null,
  miss_count smallint not null default 1,
  last_wrong_at timestamptz default now(),
  cleared_at timestamptz,
  primary key (student_id, problem_id)
);

-- 코딩 게임 판 기록 (버그 찾기 · 블록 순서 · 출력 스피드)
create table if not exists public.coding_sessions (
  id bigserial primary key,
  student_id uuid references public.students(id) on delete cascade,
  game text not null check (game in ('bug', 'order', 'speed')),
  score smallint not null default 0,
  total smallint not null default 0,
  cash_earned int not null default 0,
  wrong_problem_ids jsonb not null default '[]'::jsonb,
  played_at timestamptz default now()
);
create index if not exists coding_sessions_student_idx on public.coding_sessions (student_id, played_at desc);

alter table public.coding_logs enable row level security;
alter table public.coding_wrong_notes enable row level security;
alter table public.coding_sessions enable row level security;

drop policy if exists admin_all_coding_logs on public.coding_logs;
create policy admin_all_coding_logs on public.coding_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_coding_notes on public.coding_wrong_notes;
create policy admin_all_coding_notes on public.coding_wrong_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_coding_sessions on public.coding_sessions;
create policy admin_all_coding_sessions on public.coding_sessions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 원장님 — 학생 수강 과목(영어만 / 코딩만 / 영어+코딩) 한 줄 변경
create or replace function public.admin_set_subjects(p_student_id uuid, p_subjects text[])
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_subjects is null or array_length(p_subjects, 1) is null then raise exception 'SUBJECTS_REQUIRED'; end if;
  if not (p_subjects <@ array['english', 'coding']::text[]) then raise exception 'INVALID_SUBJECT'; end if;
  update public.students set enabled_subjects = p_subjects where id = p_student_id;
end;
$$;
grant execute on function public.admin_set_subjects(uuid, text[]) to authenticated;

-- 학생 — 자기 코딩 기록만 받아오는 RPC (student_bundle 과 같은 세션 토큰 사용)
create or replace function public.student_coding_bundle(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students;
begin
  select s.* into v_student
    from public.students s
    join public.student_sessions ss on ss.student_id = s.id
   where ss.token = p_token and ss.expires_at > now()
   limit 1;
  if v_student.id is null then raise exception 'SESSION_INVALID'; end if;

  return jsonb_build_object(
    'coding_level', v_student.coding_level,
    'enabled_subjects', v_student.enabled_subjects,
    'coding_logs', coalesce(
      (select jsonb_agg(to_jsonb(l) order by l.answered_at desc)
         from public.coding_logs l where l.student_id = v_student.id), '[]'::jsonb),
    'coding_wrong_notes', coalesce(
      (select jsonb_agg(to_jsonb(n))
         from public.coding_wrong_notes n
        where n.student_id = v_student.id and n.cleared_at is null), '[]'::jsonb),
    'coding_sessions', coalesce(
      (select jsonb_agg(to_jsonb(g) order by g.played_at desc)
         from public.coding_sessions g where g.student_id = v_student.id), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.student_coding_bundle(text) from public;
grant execute on function public.student_coding_bundle(text) to anon, authenticated;

-- ============================================================================
--  원장님 계정 만들기 (Supabase Auth)
--  1) Authentication → Users → Add user 로 이메일/비밀번호 계정 1개 생성
--  2) 아래처럼 app_metadata 에 role=admin 부여 (service_role 키로만 가능)
--     update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
--      where email = 'wonjang@example.com';
--  3) 2단계 인증(TOTP)을 켜 두세요. service_role 키는 절대 브라우저에 넣지 않습니다.
-- ============================================================================

-- ============================================================================
--  16) 학생 참고 자료실 · 선생님 수업안 · 학생별 배정 (2026-11-20)
--      · materials            : 차시별 자료 (학생용 내용 / 교사용 수업안 / 정답 분리)
--      · material_assignments : 학생별 과정·현재 주차·회차 배정
--      · material_extra_assignments : 특정 학생에게만 따로 배정한 자료
--      · material_views       : 학생 열람·완료 기록
--      핵심 규칙 — teacher_guide / answer_code 는 학생 RPC 결과에 절대 담지 않습니다.
--  여러 번 실행해도 되도록 if not exists / drop policy if exists 를 씁니다.
-- ============================================================================

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  seed_key text unique,                       -- 시드 자료 갱신용 키 (직접 등록한 자료는 null)
  kind text not null default 'theory',
  title text not null,
  track text,                                 -- null = 전 트랙
  week smallint,                              -- 1~24, null = 주차 무관
  session smallint,                           -- 1 = 이론+만들기 / 2 = 마무리·수정·업그레이드
  class_name text,                            -- null = 전체 반
  summary text,
  student_content jsonb not null default '{}'::jsonb, -- 학생 화면용(목표·개념·따라하기·힌트·미션·자가점검)
  teacher_guide jsonb,                        -- 새 선생님용 수업안(비유·설명 순서·AI 코칭·자주 나는 에러)
  answer_code text,                           -- 정답 코드 — 학생 화면 노출 금지
  ai_tip text,                                -- AI 틈틈이 힌트 (학생에게 보이는 문구)
  image_url text,
  link_url text,
  code_lang text default 'python',
  published boolean not null default false,
  sort_no smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint materials_kind_check check (kind in ('theory', 'code', 'image', 'link', 'upgrade')),
  constraint materials_track_check check (track is null or track in ('scratch', 'python', 'roblox', 'unity', 'tosel')),
  constraint materials_week_check check (week is null or (week between 1 and 24)),
  constraint materials_session_check check (session is null or session in (1, 2))
);

create index if not exists materials_lookup on public.materials (track, week, session)
  where published;
create index if not exists materials_week_idx on public.materials (week, session, sort_no);

-- 학생별 배정 — 과정(track) · 현재 주차(week) · 회차(session) 숫자
create table if not exists public.material_assignments (
  student_id uuid primary key references public.students(id) on delete cascade,
  track text,
  week smallint,
  session smallint,
  memo text,                                  -- 원장님 메모 (학생에게 보이지 않음)
  updated_at timestamptz not null default now(),
  constraint material_assignments_track_check check (track is null or track in ('scratch', 'python', 'roblox', 'unity', 'tosel')),
  constraint material_assignments_week_check check (week is null or (week between 1 and 24)),
  constraint material_assignments_session_check check (session is null or session in (1, 2))
);

-- 반 전체 자료와 별개로 특정 학생에게만 붙이는 자료
create table if not exists public.material_extra_assignments (
  material_id uuid references public.materials(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (material_id, student_id)
);

-- 학생 열람 · 완료 기록
create table if not exists public.material_views (
  student_id uuid references public.students(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  opened_at timestamptz not null default now(),
  done_at timestamptz,
  primary key (student_id, material_id)
);
create index if not exists material_views_material_idx on public.material_views (material_id);

alter table public.materials enable row level security;
alter table public.material_assignments enable row level security;
alter table public.material_extra_assignments enable row level security;
alter table public.material_views enable row level security;

-- anon 은 직접 접근 불가 (학생은 아래 RPC 만 사용), 원장님(authenticated + role=admin)은 전권
revoke all on public.materials from anon;
revoke all on public.material_assignments from anon;
revoke all on public.material_extra_assignments from anon;
revoke all on public.material_views from anon;
grant select, insert, update, delete on public.materials to authenticated;
grant select, insert, update, delete on public.material_assignments to authenticated;
grant select, insert, update, delete on public.material_extra_assignments to authenticated;
grant select, insert, update, delete on public.material_views to authenticated;

drop policy if exists admin_all_materials on public.materials;
create policy admin_all_materials on public.materials for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_material_assignments on public.material_assignments;
create policy admin_all_material_assignments on public.material_assignments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_material_extras on public.material_extra_assignments;
create policy admin_all_material_extras on public.material_extra_assignments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_material_views on public.material_views;
create policy admin_all_material_views on public.material_views for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 실시간 구독 (이미 들어가 있으면 통과)
do $$
begin
  alter publication supabase_realtime add table public.materials;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.material_views;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.material_assignments;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------------
--  학생용 RPC — 토큰이 유효할 때만, 교사용 필드(teacher_guide·answer_code) 제외
-- ---------------------------------------------------------------------------
create or replace function public.student_materials(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students%rowtype;
  v_assign public.material_assignments%rowtype;
  v_track text;
  v_week smallint;
  v_session smallint;
  v_items jsonb;
begin
  select s.* into v_student
    from public.students s
    join public.student_sessions ss on ss.student_id = s.id
   where ss.token = p_token and ss.expires_at > now()
   limit 1;
  if v_student.id is null then raise exception 'SESSION_INVALID'; end if;

  select * into v_assign from public.material_assignments where student_id = v_student.id;
  v_track := coalesce(v_assign.track, 'python');
  v_week := coalesce(v_assign.week, 1);
  v_session := coalesce(v_assign.session, 1);

  select coalesce(jsonb_agg(item order by (item ->> 'week_sort')::int, (item ->> 'session_sort')::int,
                                     (item ->> 'sort_no')::int, item ->> 'title'), '[]'::jsonb)
    into v_items
    from (
      select jsonb_build_object(
               'id', m.id,
               'kind', m.kind,
               'title', m.title,
               'track', m.track,
               'week', m.week,
               'session', m.session,
               'class_name', m.class_name,
               'summary', m.summary,
               'student_content', m.student_content,
               'ai_tip', m.ai_tip,
               'image_url', m.image_url,
               'link_url', m.link_url,
               'code_lang', m.code_lang,
               'published', m.published,
               'sort_no', m.sort_no,
               'week_sort', coalesce(m.week, v_week),
               'session_sort', coalesce(m.session, v_session),
               'opened_at', vw.opened_at,
               'done_at', vw.done_at
             ) as item
        from public.materials m
        left join public.material_views vw
               on vw.material_id = m.id and vw.student_id = v_student.id
       where m.published
         and (m.class_name is null or m.class_name = v_student.class_name)
         and (
              (m.track is null or m.track = v_track)
              or exists (select 1 from public.material_extra_assignments x
                          where x.material_id = m.id and x.student_id = v_student.id)
             )
    ) s;

  return jsonb_build_object(
    'assignment', jsonb_build_object('track', v_track, 'week', v_week, 'session', v_session),
    'materials', v_items
  );
end;
$$;

create or replace function public.material_mark(p_token text, p_material_id uuid, p_done boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student_id uuid;
begin
  select ss.student_id into v_student_id
    from public.student_sessions ss
   where ss.token = p_token and ss.expires_at > now()
   limit 1;
  if v_student_id is null then raise exception 'SESSION_INVALID'; end if;

  if not exists (select 1 from public.materials m where m.id = p_material_id and m.published) then
    raise exception 'MATERIAL_NOT_FOUND';
  end if;

  insert into public.material_views (student_id, material_id, opened_at, done_at)
  values (v_student_id, p_material_id, now(), case when p_done then now() else null end)
  on conflict (student_id, material_id) do update
     set done_at = case when p_done then now() else null end;

  return jsonb_build_object('ok', true, 'done', p_done);
end;
$$;

-- 학생 기기에서 24주 진도·작품을 읽을 때 (수업 메모·교사 메모는 제외)
create or replace function public.student_class_bundle(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students%rowtype;
begin
  select s.* into v_student
    from public.students s
    join public.student_sessions ss on ss.student_id = s.id
   where ss.token = p_token and ss.expires_at > now()
   limit 1;
  if v_student.id is null then raise exception 'SESSION_INVALID'; end if;

  return jsonb_build_object(
    'profile', (select to_jsonb(p) - 'student_id' from public.class_profiles p
                 where p.student_id = v_student.id),
    'progress', coalesce((select jsonb_agg(w.week order by w.week) from public.class_progress w
                           where w.student_id = v_student.id and w.done), '[]'::jsonb),
    'assignments', coalesce((select jsonb_agg(a) from public.material_assignments a
                              where a.student_id = v_student.id), '[]'::jsonb),
    'works', coalesce((select jsonb_agg(to_jsonb(k) order by k.date desc) from public.student_works k
                        where k.student_id = v_student.id), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.student_materials(text) from public;
revoke all on function public.material_mark(text, uuid, boolean) from public;
revoke all on function public.student_class_bundle(text) from public;
grant execute on function public.student_materials(text) to anon, authenticated;
grant execute on function public.material_mark(text, uuid, boolean) to anon, authenticated;
grant execute on function public.student_class_bundle(text) to anon, authenticated;

-- ============================================================================
--  17) 클래스 데이터 서버 동기화 (2026-11-20) — 24주 진도 · 수업 메모 · 작품 · 소견
--      localStorage 는 그대로 쓰고(오프라인), 로그인 상태에서는 서버와 함께 맞춥니다.
-- ============================================================================

create table if not exists public.class_profiles (
  student_id uuid primary key references public.students(id) on delete cascade,
  track text,
  code text,
  updated_at timestamptz not null default now()
);

create table if not exists public.class_progress (
  student_id uuid references public.students(id) on delete cascade,
  week smallint not null check (week between 1 and 24),
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (student_id, week)
);

create table if not exists public.lesson_memos (
  id uuid primary key default gen_random_uuid(),
  local_key text,                             -- 앱 localStorage 메모 id (중복 방지)
  student_id uuid references public.students(id) on delete cascade,
  date date not null default current_date,
  made text,
  good text,
  todo text,
  created_at timestamptz not null default now(),
  unique (student_id, local_key)
);

create table if not exists public.student_works (
  id uuid primary key default gen_random_uuid(),
  local_key text,
  student_id uuid references public.students(id) on delete cascade,
  title text not null,
  date date not null default current_date,
  tool text,
  comment text,
  link text,
  photo text,                                 -- 작품 사진 (800px JPEG data URL)
  created_at timestamptz not null default now(),
  unique (student_id, local_key)
);

create table if not exists public.report_notes (
  student_id uuid references public.students(id) on delete cascade,
  month text not null,                        -- YYYY-MM
  text text not null,
  updated_at timestamptz not null default now(),
  primary key (student_id, month)
);

alter table public.class_profiles enable row level security;
alter table public.class_progress enable row level security;
alter table public.lesson_memos enable row level security;
alter table public.student_works enable row level security;
alter table public.report_notes enable row level security;

grant select, insert, update, delete on public.class_profiles to authenticated;
grant select, insert, update, delete on public.class_progress to authenticated;
grant select, insert, update, delete on public.lesson_memos to authenticated;
grant select, insert, update, delete on public.student_works to authenticated;
grant select, insert, update, delete on public.report_notes to authenticated;

drop policy if exists admin_all_class_profiles on public.class_profiles;
create policy admin_all_class_profiles on public.class_profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all_class_progress on public.class_progress;
create policy admin_all_class_progress on public.class_progress for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all_lesson_memos on public.lesson_memos;
create policy admin_all_lesson_memos on public.lesson_memos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all_student_works on public.student_works;
create policy admin_all_student_works on public.student_works for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all_report_notes on public.report_notes;
create policy admin_all_report_notes on public.report_notes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
--  18) 테이블 권한 명시 (2026-11-20)
--   새 프로젝트에서는 public 스키마 기본 권한이 자동 부여되지 않습니다.
--   RLS 정책이 실제로 동작하려면 role 에 권한이 있어야 하므로 여기서 한 번에 줍니다.
--   · anon  : 단어장·상점 상품 읽기만 (나머지는 RPC 전용)
--   · authenticated : 원장님 계정 — RLS 의 is_admin() 이 실제 접근을 결정
-- ============================================================================
grant usage on schema public to anon, authenticated;

grant select on public.word_sets to anon;
grant select on public.words to anon;
grant select on public.shop_items to anon;

grant select, insert, update, delete on
  public.students,
  public.word_sets,
  public.words,
  public.assignments,
  public.study_logs,
  public.wrong_notes,
  public.weekly_reports,
  public.level_history,
  public.student_sessions,
  public.cash_wallets,
  public.shop_items,
  public.redemption_requests,
  public.game_sessions,
  public.app_settings,
  public.coding_logs,
  public.coding_wrong_notes,
  public.coding_sessions
to authenticated;

grant usage, select on all sequences in schema public to authenticated;
