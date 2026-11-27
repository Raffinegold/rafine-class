import { supabase } from './supabase';
import type { Competition, NewsItem, PortfolioItem } from './onetouch';
import type { TemperamentType } from './temperament';

/**
 * 원장 화면 전용 API (authenticated + is_admin RLS).
 * 학생·학부모에게는 열리지 않는 테이블을 직접 읽고 씁니다.
 */

export interface AdminBoardRow {
  id: string;
  name: string;
  grade: number;
  class_name: string | null;
  active: boolean;
  coding_level: string;
  temperament_type: TemperamentType | null;
  temperament_code: string | null;
  /** 수강 트랙 (class_profiles) */
  profile_track: string;
  /** 이번 주 배정 트랙 (material_assignments) */
  track: string;
  week: number;
  session: 1 | 2;
  done_today: boolean;
  done_at: string | null;
  last_done_date: string | null;
  done_weeks: number;
  portfolio_status: 'pending' | 'approved' | 'rejected' | null;
  share_token: string | null;
}

export interface AdminPortfolioRow {
  id: string;
  student_id: string;
  student_name: string;
  grade: number | null;
  status: 'pending' | 'approved' | 'rejected';
  title: string | null;
  intro: string | null;
  /** 학부모 공유 화면에 보이는 원장 한 줄 코멘트 (DB 적용 전에는 null) */
  teacher_note?: string | null;
  share_token: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  updated_at: string;
  view_count: number;
  items: PortfolioItem[];
}

function client() {
  if (!supabase) throw new Error('서버 연결이 없어요');
  return supabase;
}

/** 오늘(KST) 날짜 */
export function kstToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts;
}

export async function loadBoard(): Promise<AdminBoardRow[]> {
  const db = client();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const [students, profiles, assigns, completions, progress, portfolios] = await Promise.all([
    db.from('students').select('id,name,grade,class_name,active,coding_level,temperament_type,temperament_code').order('name'),
    db.from('class_profiles').select('student_id,track,code'),
    db.from('material_assignments').select('student_id,track,week,session'),
    db.from('lesson_completions').select('student_id,date,done_at').gte('date', since).order('date', { ascending: false }),
    db.from('class_progress').select('student_id,week').eq('done', true),
    db.from('portfolios').select('student_id,status,share_token'),
  ]);
  const err = students.error ?? profiles.error ?? assigns.error ?? completions.error ?? progress.error ?? portfolios.error;
  if (err) throw new Error(err.message);

  const trackOf = new Map((profiles.data ?? []).map((p: { student_id: string; track: string | null }) => [p.student_id, p.track ?? '']));
  const assignOf = new Map(
    (assigns.data ?? []).map((a: { student_id: string; track: string | null; week: number | null; session: 1 | 2 | null }) => [a.student_id, a])
  );
  const doneByStudent = new Map<string, { date: string; done_at: string | null }[]>();
  (completions.data ?? []).forEach((c: { student_id: string; date: string; done_at: string | null }) => {
    if (!c.done_at) return;
    const arr = doneByStudent.get(c.student_id) ?? [];
    arr.push({ date: c.date, done_at: c.done_at });
    doneByStudent.set(c.student_id, arr);
  });
  const weeksByStudent = new Map<string, number>();
  (progress.data ?? []).forEach((p: { student_id: string }) => {
    weeksByStudent.set(p.student_id, (weeksByStudent.get(p.student_id) ?? 0) + 1);
  });
  const portfolioOf = new Map(
    (portfolios.data ?? []).map((p: { student_id: string; status: AdminPortfolioRow['status']; share_token: string | null }) => [p.student_id, p])
  );
  const today = kstToday();

  return ((students.data ?? []) as StudentRow[]).map((s) => {
    const a = assignOf.get(s.id);
    const list = doneByStudent.get(s.id) ?? [];
    const todays = list.find((c) => c.date === today);
    const pf = portfolioOf.get(s.id);
    return {
      id: s.id,
      name: s.name,
      grade: s.grade,
      class_name: s.class_name,
      active: s.active,
      coding_level: s.coding_level,
      temperament_type: s.temperament_type as TemperamentType | null,
      temperament_code: s.temperament_code,
      profile_track: trackOf.get(s.id) || defaultTrack(s.coding_level),
      track: (a?.track as string) || trackOf.get(s.id) || defaultTrack(s.coding_level),
      week: a?.week ?? 1,
      session: (a?.session as 1 | 2) ?? 1,
      done_today: !!todays,
      done_at: todays?.done_at ?? null,
      last_done_date: list[0]?.date ?? null,
      done_weeks: weeksByStudent.get(s.id) ?? 0,
      portfolio_status: pf?.status ?? null,
      share_token: pf?.share_token ?? null,
    };
  });
}

interface StudentRow {
  id: string;
  name: string;
  grade: number;
  class_name: string | null;
  active: boolean;
  coding_level: string;
  temperament_type: string | null;
  temperament_code: string | null;
}

function defaultTrack(codingLevel: string): string {
  if (codingLevel === 'C2') return 'python';
  if (codingLevel === 'C3') return 'roblox';
  if (codingLevel === 'C4') return 'unity';
  return 'scratch';
}

export async function setTemperament(studentId: string, type: TemperamentType | null): Promise<void> {
  const { error } = await client().rpc('admin_set_temperament', {
    p_student_id: studentId,
    p_type: type,
  });
  if (error) throw new Error(error.message);
}

export async function loadPortfolios(status?: AdminPortfolioRow['status']): Promise<AdminPortfolioRow[]> {
  const db = client();
  let q = db
    .from('portfolios')
    .select('id,student_id,status,title,intro,share_token,review_note,reviewed_at,updated_at,view_count')
    .order('updated_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (!rows.length) return [];

  const ids = rows.map((r: { id: string }) => r.id);
  const studentIds = Array.from(new Set(rows.map((r: { student_id: string }) => r.student_id)));
  const [items, students] = await Promise.all([
    db.from('portfolio_items').select('portfolio_id,kind,title,description,url,image_url,awarded_by,awarded_on,sort_no').in('portfolio_id', ids).order('sort_no'),
    db.from('students').select('id,name,grade').in('id', studentIds),
  ]);
  if (items.error) throw new Error(items.error.message);
  const studentOf = new Map((students.data ?? []).map((s: { id: string; name: string; grade: number }) => [s.id, s]));
  const itemsOf = new Map<string, PortfolioItem[]>();  (items.data ?? []).forEach((i: PortfolioItem & { portfolio_id: string }) => {
    const arr = itemsOf.get(i.portfolio_id) ?? [];
    arr.push({
      kind: i.kind,
      title: i.title,
      description: i.description ?? '',
      url: i.url ?? '',
      image_url: i.image_url ?? '',
      awarded_by: i.awarded_by ?? '',
      awarded_on: i.awarded_on ?? '',
    });
    itemsOf.set(i.portfolio_id, arr);
  });

  // 원장 한 줄 코멘트는 DB 패치(patch-portfolio-teacher-note.sql) 적용 전에는 컬럼이 없어 실패합니다.
  // 그래도 승인함 자체는 열려야 하므로 따로 읽고, 없으면 빈 값으로 둡니다.
  const noteOf = new Map<string, string | null>();
  try {
    const notes = await db.from('portfolios').select('id,teacher_note').in('id', ids);
    (notes.data ?? []).forEach((n: { id: string; teacher_note: string | null }) => noteOf.set(n.id, n.teacher_note));
  } catch {
    /* 컬럼 미적용 — 무시 */
  }

  return rows.map((r: Omit<AdminPortfolioRow, 'student_name' | 'grade' | 'items' | 'teacher_note'>) => ({
    ...r,
    student_name: studentOf.get(r.student_id)?.name ?? '(이름 없음)',
    grade: studentOf.get(r.student_id)?.grade ?? null,
    teacher_note: noteOf.get(r.id) ?? null,
    items: itemsOf.get(r.id) ?? [],
  }));
}

/**
 * 학부모 공유 링크에 보일 ‘원장 한 줄 코멘트’ 저장.
 * portfolios.teacher_note 컬럼 + admin_set_portfolio_note RPC 가 필요합니다.
 */
export async function savePortfolioNote(id: string, note: string): Promise<void> {
  const { error } = await client().rpc('admin_set_portfolio_note', {
    p_id: id,
    p_note: note.trim() || null,
  });
  if (error) {
    if (/Could not find the function|schema cache|does not exist/i.test(error.message)) {
      throw new Error('아직 준비 중이에요 — DB에 teacher_note 컬럼·RPC를 먼저 적용해야 저장됩니다(자비스에게 요청).');
    }
    throw new Error(error.message);
  }
}

export async function reviewPortfolio(
  id: string,
  action: 'approve' | 'reject',
  note?: string
): Promise<{ status: string; share_token: string | null }> {
  const { data, error } = await client().rpc('admin_review_portfolio', {
    p_id: id,
    p_action: action,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as { status: string; share_token: string | null };
}

/* ------------------------------ 대회 · IT뉴스 관리 ------------------------------ */

export interface AdminCompetition extends Competition {
  visible: boolean;
  sort_no: number;
}

export interface AdminNews extends NewsItem {
  visible: boolean;
  sort_no: number;
}

export async function loadFeedAdmin(): Promise<{ competitions: AdminCompetition[]; news: AdminNews[] }> {
  const db = client();
  const [comp, news] = await Promise.all([
    db.from('competitions').select('*').order('sort_no').order('end_date', { ascending: true, nullsFirst: false }),
    db.from('it_news').select('*').order('sort_no').order('published_at', { ascending: false, nullsFirst: false }),
  ]);
  if (comp.error) throw new Error(comp.error.message);
  if (news.error) throw new Error(news.error.message);
  return { competitions: (comp.data ?? []) as AdminCompetition[], news: (news.data ?? []) as AdminNews[] };
}

export type CompetitionInput = {
  id?: string;
  title: string;
  host: string;
  target: Competition['target'];
  start_date: string | null;
  end_date: string | null;
  event_date: string | null;
  url: string;
  summary: string;
  visible: boolean;
  sort_no: number;
};

export async function saveCompetition(input: CompetitionInput): Promise<void> {
  const db = client();
  const row = { ...input, updated_at: new Date().toISOString() };
  const { error } = input.id
    ? await db.from('competitions').update(row).eq('id', input.id)
    : await db.from('competitions').insert(row);
  if (error) throw new Error(error.message);
}

export async function deleteCompetition(id: string): Promise<void> {
  const { error } = await client().from('competitions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleCompetition(id: string, visible: boolean): Promise<void> {
  const { error } = await client().from('competitions').update({ visible }).eq('id', id);
  if (error) throw new Error(error.message);
}

export type NewsInput = {
  id?: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  tag: string;
  published_at: string | null;
  visible: boolean;
  sort_no: number;
};

export async function saveNews(input: NewsInput): Promise<void> {
  const db = client();
  const { error } = input.id
    ? await db.from('it_news').update(input).eq('id', input.id)
    : await db.from('it_news').insert(input);
  if (error) throw new Error(error.message);
}

export async function deleteNews(id: string): Promise<void> {
  const { error } = await client().from('it_news').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleNews(id: string, visible: boolean): Promise<void> {
  const { error } = await client().from('it_news').update({ visible }).eq('id', id);
  if (error) throw new Error(error.message);
}
