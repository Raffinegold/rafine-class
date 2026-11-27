-- ============================================================================
--  학부모 공유 포트폴리오 — ‘원장 한 줄 코멘트’ (teacher_note)
--  · 실행 위치: Supabase 대시보드 → SQL Editor (한 번만)
--  · 대상 프로젝트: ckuxpbeemamovepzkoja (라피네 클래스)
--  · 이 파일은 rafine-class 앱의 프론트가 기대하는 DB 변경 명세입니다.
--    적용 전에는 앱이 정상 동작하고, 승인함의 ‘원장 한 줄’ 저장만
--    “아직 준비 중이에요 …” 안내로 막힙니다.
-- ============================================================================

-- 1) 컬럼 (학부모에게 그대로 보이는 문장, 최대 120자)
alter table public.portfolios
  add column if not exists teacher_note text;

comment on column public.portfolios.teacher_note is '학부모 공유 링크(/p/...)에 표시되는 원장 한 줄 코멘트. 내부 메모는 review_note 사용.';

-- 2) 원장 저장/수정 RPC — 승인 상태와 무관하게 코멘트만 바꿉니다.
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

revoke all on function public.admin_set_portfolio_note(uuid, text) from public;
grant execute on function public.admin_set_portfolio_note(uuid, text) to authenticated;

-- 3) 공개 조회 RPC — teacher_note 한 필드만 추가 (기존 응답 구조 유지)
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
    'teacher_note', v_p.teacher_note,          -- ← 추가된 필드
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

revoke all on function public.portfolio_public(text) from public;
grant execute on function public.portfolio_public(text) to anon, authenticated;

-- 4) 확인
--   select id, student_id, status, teacher_note from public.portfolios order by updated_at desc limit 5;
--   select public.portfolio_public('<공유토큰>') -> 'teacher_note';
