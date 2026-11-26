-- ============================================================================
--  학생이 등록한 작품을 서버에 저장 (2026-11-26)
--  · 지금까지 작품은 학생 기기(localStorage)에만 남아 원장 화면·월말 리포트에 안 보였습니다.
--  · 학생 토큰(student_sessions)으로 자기 작품만 저장/삭제합니다.
-- ============================================================================

create or replace function public.student_work_save(
  p_token text,
  p_local_key text,
  p_title text,
  p_date date,
  p_tool text,
  p_comment text,
  p_link text,
  p_photo text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student_id uuid;
  v_id uuid;
begin
  select ss.student_id into v_student_id
    from public.student_sessions ss
   where ss.token = p_token and ss.expires_at > now()
   limit 1;
  if v_student_id is null then raise exception 'SESSION_INVALID'; end if;

  if coalesce(trim(p_title), '') = '' then raise exception 'TITLE_REQUIRED'; end if;
  if p_local_key is null or trim(p_local_key) = '' then raise exception 'LOCAL_KEY_REQUIRED'; end if;
  if length(coalesce(p_photo, '')) > 800000 then raise exception 'IMAGE_TOO_LARGE'; end if;
  if coalesce(p_photo, '') <> '' and not (p_photo like 'data:image/%' or p_photo like 'https://%') then
    raise exception 'IMAGE_URL_INVALID';
  end if;

  insert into public.student_works (student_id, local_key, title, date, tool, comment, link, photo)
  values (v_student_id, trim(p_local_key), left(trim(p_title), 120), coalesce(p_date, public.kst_today()),
          left(coalesce(p_tool, ''), 80), left(coalesce(p_comment, ''), 600),
          left(coalesce(p_link, ''), 500), nullif(coalesce(p_photo, ''), ''))
  on conflict (student_id, local_key) do update
     set title = excluded.title,
         date = excluded.date,
         tool = excluded.tool,
         comment = excluded.comment,
         link = excluded.link,
         photo = excluded.photo
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.student_work_delete(p_token text, p_local_key text)
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

  delete from public.student_works
   where student_id = v_student_id and local_key = trim(p_local_key);

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.student_work_save(text, text, text, date, text, text, text, text) from public;
revoke all on function public.student_work_delete(text, text) from public;
grant execute on function public.student_work_save(text, text, text, date, text, text, text, text) to anon, authenticated;
grant execute on function public.student_work_delete(text, text) to anon, authenticated;
