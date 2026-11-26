import { supabase } from './supabase';
import type { Track } from './curriculum';
import type { TemperamentType } from './temperament';

/**
 * '오늘의 원터치' · 대회/IT뉴스 · 포트폴리오 데이터.
 * 학생은 토큰(student_sessions)으로만, 학부모는 승인된 공유 토큰으로만 읽습니다.
 * 서버 RPC: student_today_bundle / student_complete_lesson / student_portfolio_* / portfolio_public
 */

export type MissionKind = 'homework' | 'problem' | 'tip';

export interface TodayMission {
  kind: MissionKind;
  title: string;
  body: string;
  hint: string | null;
  answer: string | null;
  temperament: TemperamentType;
}

export interface TodayBundle {
  server_date: string;
  student: {
    id: string;
    name: string;
    grade: number;
    class_name: string | null;
    coding_level: string;
    temperament_type: TemperamentType | null;
    temperament_code: string | null;
  };
  assignment: { track: Track; week: number; session: 1 | 2 };
  missions: TodayMission[];
  completion: { done: boolean; done_at: string | null };
  progress: number[];
  portfolio: {
    status?: 'pending' | 'approved' | 'rejected';
    share_token?: string | null;
    updated_at?: string;
    review_note?: string | null;
  } | Record<string, never>;
}

export interface PortfolioItem {
  kind: 'work' | 'award';
  title: string;
  description?: string;
  url?: string;
  image_url?: string;
  awarded_by?: string;
  awarded_on?: string;
}

export interface MyPortfolio {
  portfolio: {
    status: 'pending' | 'approved' | 'rejected';
    title: string | null;
    intro: string | null;
    share_token: string | null;
    review_note: string | null;
    updated_at: string;
  } | null;
  items: PortfolioItem[];
}

export interface PublicPortfolio {
  student_name: string;
  grade: number | null;
  track: Track;
  title: string | null;
  intro: string | null;
  approved_at: string | null;
  items: PortfolioItem[];
}

export interface Competition {
  id: string;
  title: string;
  host: string | null;
  target: 'elem' | 'middle' | 'high' | 'all';
  start_date: string | null;
  end_date: string | null;
  event_date: string | null;
  url: string | null;
  summary: string | null;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string | null;
  url: string | null;
  summary: string | null;
  tag: string | null;
  published_at: string | null;
}

function readableError(message: string | undefined, fallback: string): string {
  const m = message ?? '';
  if (/SESSION_INVALID|SESSION_EXPIRED/.test(m)) return '로그인이 만료됐어요. 다시 로그인해 주세요.';
  if (/EMPTY_PORTFOLIO/.test(m)) return '포트폴리오에 작품이나 상장을 1개 이상 담아 주세요.';
  if (/TOO_MANY_ITEMS/.test(m)) return '한 번에 12개까지 담을 수 있어요.';
  if (/IMAGE_TOO_LARGE/.test(m)) return '사진이 너무 커요. 더 작은 사진으로 다시 올려 주세요.';
  if (/IMAGE_URL_INVALID/.test(m)) return '사진 형식을 확인해 주세요.';
  if (/NOT_FOUND/.test(m)) return '링크가 만료됐거나 아직 공개되지 않았어요.';
  return fallback;
}

export async function loadToday(token: string): Promise<TodayBundle> {
  if (!supabase) throw new Error('서버 연결이 없어요');
  const { data, error } = await supabase.rpc('student_today_bundle', { p_token: token });
  if (error) throw new Error(readableError(error.message, '오늘의 수업을 불러오지 못했어요.'));
  return data as TodayBundle;
}

export async function completeLesson(
  token: string,
  done: boolean
): Promise<{ done: boolean; done_at: string | null }> {
  if (!supabase) throw new Error('서버 연결이 없어요');
  const { data, error } = await supabase.rpc('student_complete_lesson', { p_token: token, p_done: done });
  if (error) throw new Error(readableError(error.message, '완료 체크를 저장하지 못했어요.'));
  return data as { done: boolean; done_at: string | null };
}

export async function saveMyPortfolio(
  token: string,
  payload: { title: string; intro: string; items: PortfolioItem[] }
): Promise<{ status: string; share_token: string | null }> {
  if (!supabase) throw new Error('서버 연결이 없어요');
  const { data, error } = await supabase.rpc('student_portfolio_save', {
    p_token: token,
    p_title: payload.title,
    p_intro: payload.intro,
    p_items: payload.items,
  });
  if (error) throw new Error(readableError(error.message, '포트폴리오를 저장하지 못했어요.'));
  return data as { status: string; share_token: string | null };
}

export async function loadMyPortfolio(token: string): Promise<MyPortfolio> {
  if (!supabase) throw new Error('서버 연결이 없어요');
  const { data, error } = await supabase.rpc('student_portfolio_get', { p_token: token });
  if (error) throw new Error(readableError(error.message, '포트폴리오를 불러오지 못했어요.'));
  return data as MyPortfolio;
}

export async function loadPublicPortfolio(shareToken: string): Promise<PublicPortfolio> {
  if (!supabase) throw new Error('서버 연결이 없어요');
  const { data, error } = await supabase.rpc('portfolio_public', { p_share_token: shareToken });
  if (error) throw new Error(readableError(error.message, '포트폴리오를 열 수 없어요.'));
  return data as PublicPortfolio;
}

export async function loadFeed(): Promise<{ competitions: Competition[]; news: NewsItem[] }> {
  if (!supabase) return { competitions: [], news: [] };
  const [comp, news] = await Promise.all([
    supabase
      .from('competitions')
      .select('id,title,host,target,start_date,end_date,event_date,url,summary')
      .eq('visible', true)
      .order('end_date', { ascending: true, nullsFirst: false })
      .order('sort_no', { ascending: true }),
    supabase
      .from('it_news')
      .select('id,title,source,url,summary,tag,published_at')
      .eq('visible', true)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('sort_no', { ascending: true }),
  ]);
  return {
    competitions: (comp.data ?? []) as Competition[],
    news: (news.data ?? []) as NewsItem[],
  };
}

/** D-day 계산 (한국 시간 기준 오늘) */
export function daysUntil(dateStr: string | null | undefined, todayStr?: string): number | null {
  if (!dateStr) return null;
  const today = todayStr ? new Date(`${todayStr}T00:00:00+09:00`) : new Date();
  const target = new Date(`${dateStr}T00:00:00+09:00`);
  if (Number.isNaN(target.getTime())) return null;
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((target.getTime() - base.getTime()) / 86_400_000);
  return diff;
}

export function ddayLabel(days: number | null): { text: string; tone: 'urgent' | 'soon' | 'open' | 'done' | 'none' } {
  if (days === null) return { text: '일정 확인', tone: 'none' };
  if (days > 0) return { text: `D-${days}`, tone: days <= 3 ? 'urgent' : days <= 14 ? 'soon' : 'open' };
  if (days === 0) return { text: '오늘 마감', tone: 'urgent' };
  return { text: '마감', tone: 'done' };
}
