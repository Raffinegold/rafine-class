import { useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import { defaultTrackFor, asTrack, type Track } from './curriculum';
import { todayStr, uid } from './util';

/**
 * 라피네 클래스 전용 데이터 (학생 관리 · 24주 진도 · 작품 · 수업 메모)
 * - localStorage 에 영구 저장합니다. 원장님 브라우저에 그대로 남습니다.
 * - 기존 영단어/코딩/캐시 데이터(store)는 그대로 두고, 클래스 기능만 이 저장소를 씁니다.
 */

export interface ClassProfile {
  student_id: string;
  track: Track;
  /** 기질 코드 RC-XXXX (없으면 빈 문자열) */
  code: string;
}

export interface LessonMemo {
  id: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  made: string; // 오늘 만든 것
  good: string; // 잘한 점
  todo: string; // 아쉬운 점 · 보완할 점
}

export interface Work {
  id: string;
  student_id: string;
  title: string;
  date: string; // YYYY-MM-DD
  tool: string;
  comment: string;
  link: string;
  /** 작품 사진 1장 (가로 800px JPEG data URL) — 카드와 월말 리포트에 함께 나옵니다 */
  photo?: string;
}

interface DB {
  profiles: Record<string, { track: Track; code: string }>;
  memos: LessonMemo[];
  works: Work[];
  done: Record<string, number[]>;
  /** 원장님이 직접 고친 월말 리포트 종합 소견 — `${student_id}:${YYYY-MM}` 키 */
  counselors: Record<string, string>;
}

const KEY = 'rafine-class-db-v1';

function seed(): DB {
  const profiles: DB['profiles'] = {
    'stu-seoyeon': { track: 'roblox', code: 'RC-14E1' },
    'stu-junwoo': { track: 'python', code: 'RC-22F6' },
    'stu-haeun': { track: 'scratch', code: 'RC-31E2' },
    'stu-minjun': { track: 'unity', code: 'RC-43A8' },
    'stu-yujin': { track: 'tosel', code: 'RC-12B4' },
  };
  const memos: LessonMemo[] = [
    {
      id: 'memo-sy-3',
      student_id: 'stu-seoyeon',
      date: '2026-11-18',
      made: '움직이는 발판 3개와 떨어지는 지점을 만들었어요',
      good: '실패한 이유를 끝까지 찾아내고 스스로 고쳤어요',
      todo: '테스트 플레이 전에 "오늘의 도착지"를 먼저 정하기',
    },
    {
      id: 'memo-sy-2',
      student_id: 'stu-seoyeon',
      date: '2026-11-12',
      made: '터치하면 점수가 오르는 파트와 점수 화면을 붙였어요',
      good: '점수 규칙을 자기 말로 설명했어요',
      todo: '터치가 두 번 실행되는지 확인하는 습관',
    },
    {
      id: 'memo-sy-1',
      student_id: 'stu-seoyeon',
      date: '2026-11-05',
      made: '장애물 코스 첫 맵을 파트 12개로 만들었어요',
      good: '좌표를 직접 고치며 길을 만들었어요',
      todo: '저장을 자주 누르기 — 작업이 날아가지 않게',
    },
    {
      id: 'memo-sy-oct',
      student_id: 'stu-seoyeon',
      date: '2026-10-22',
      made: '스튜디오 조작과 파트 색·재질 바꾸기를 익혔어요',
      good: '새 도구를 두려움 없이 먼저 눌러 봤어요',
      todo: '마무리 3분을 정해 두고 끝내기',
    },
    {
      id: 'memo-jw-2',
      student_id: 'stu-junwoo',
      date: '2026-11-13',
      made: '숫자 맞히기 게임을 5번 기회로 완성했어요',
      good: '친구에게 규칙을 설명하며 스스로 정리했어요',
      todo: 'while 조건과 끝나는 시점을 더 분명하게',
    },
    {
      id: 'memo-jw-1',
      student_id: 'stu-junwoo',
      date: '2026-11-06',
      made: 'input으로 숫자를 받아 비교하는 코드를 짰어요',
      good: '오류 메시지를 읽고 스스로 고쳤어요',
      todo: '변수 이름을 뜻이 보이게 짓기',
    },
    {
      id: 'memo-he-2',
      student_id: 'stu-haeun',
      date: '2026-11-14',
      made: '점수 변수와 게임오버 화면을 만들었어요',
      good: '점수 변수를 스스로 만들어 봤어요',
      todo: '복제본이 쌓이지 않게 정리하기',
    },
    {
      id: 'memo-he-1',
      student_id: 'stu-haeun',
      date: '2026-11-07',
      made: '고양이가 아이템을 피하는 미니게임을 만들었어요',
      good: '블록을 먼저 눌러 보며 배우는 힘이 좋아요',
      todo: '마지막 3분에 마무리하고 끝내기',
    },
    {
      id: 'memo-mj-1',
      student_id: 'stu-minjun',
      date: '2026-11-08',
      made: '굴러가는 공을 키보드로 조작했어요',
      good: '물리 값을 끝까지 바꿔 가며 시도했어요',
      todo: '씬 저장 위치를 확인하고 씬 이름 붙이기',
    },
  ];
  const works: Work[] = [
    {
      id: 'work-sy-2',
      student_id: 'stu-seoyeon',
      title: '우주 탈출 미로',
      date: '2026-11-18',
      tool: '로블록스 스튜디오',
      comment: '움직이는 발판을 피해 끝까지 가면 이기는 게임',
      link: 'https://www.roblox.com/',
    },
    {
      id: 'work-sy-1',
      student_id: 'stu-seoyeon',
      title: '점수 오르는 장애물 코스',
      date: '2026-11-12',
      tool: '로블록스 스튜디오',
      comment: '닿으면 점수가 오르는 파트를 5개 숨겨 두었어요',
      link: '',
    },
    {
      id: 'work-jw-1',
      student_id: 'stu-junwoo',
      title: '숫자 맞히기 게임',
      date: '2026-11-13',
      tool: '파이썬',
      comment: '1~50 사이 숫자를 5번 안에 맞히는 콘솔 게임',
      link: '',
    },
    {
      id: 'work-he-1',
      student_id: 'stu-haeun',
      title: '고양이 피하기',
      date: '2026-11-14',
      tool: '스크래치',
      comment: '떨어지는 사과를 피하는 30초 게임',
      link: 'https://scratch.mit.edu/',
    },
  ];
  const done: DB['done'] = {
    'stu-seoyeon': [1, 2, 3, 4, 5, 6, 7],
    'stu-junwoo': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    'stu-haeun': [1, 2, 3, 4, 5],
    'stu-minjun': [1, 2, 3],
    'stu-yujin': [1, 2],
  };
  return { profiles, memos, works, done, counselors: {} };
}

function load(): DB {
  if (typeof localStorage === 'undefined') return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Partial<DB>;
    return {
      profiles: parsed.profiles ?? {},
      memos: parsed.memos ?? [],
      works: parsed.works ?? [],
      done: parsed.done ?? {},
      counselors: parsed.counselors ?? {},
    };
  } catch {
    return seed();
  }
}

class ClassStore {
  private db: DB = load();
  version = 0;
  private listeners = new Set<() => void>();

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getVersion = () => this.version;

  private commit() {
    this.version += 1;
    try {
      localStorage.setItem(KEY, JSON.stringify(this.db));
    } catch {
      /* 저장 공간이 없어도 화면은 계속 동작 */
    }
    this.listeners.forEach((fn) => fn());
  }

  /* ----------------------------- 학생별 설정 ----------------------------- */

  profile(studentId: string, codingLevel?: string): ClassProfile {
    const saved = this.db.profiles[studentId];
    return {
      student_id: studentId,
      track: saved?.track ?? defaultTrackFor(codingLevel),
      code: saved?.code ?? '',
    };
  }

  setProfile(studentId: string, patch: { track?: Track; code?: string }) {
    const cur = this.profile(studentId);
    this.db.profiles[studentId] = {
      track: patch.track ?? cur.track,
      code: patch.code !== undefined ? patch.code.trim().toUpperCase() : cur.code,
    };
    this.commit();
    void this.pushProfile(studentId);
  }

  /* ------------------------------ 수업 메모 ------------------------------ */

  memosFor(studentId: string): LessonMemo[] {
    return this.db.memos
      .filter((m) => m.student_id === studentId)
      .sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));
  }

  memosInMonth(studentId: string, month: string): LessonMemo[] {
    return this.memosFor(studentId).filter((m) => m.date.startsWith(month));
  }

  addMemo(input: { student_id: string; date: string; made: string; good: string; todo: string }): LessonMemo {
    const memo: LessonMemo = {
      id: uid('memo'),
      student_id: input.student_id,
      date: input.date || todayStr(),
      made: input.made.trim(),
      good: input.good.trim(),
      todo: input.todo.trim(),
    };
    this.db.memos = [memo, ...this.db.memos];
    this.commit();
    void this.pushMemo(memo);
    return memo;
  }

  deleteMemo(id: string) {
    this.db.memos = this.db.memos.filter((m) => m.id !== id);
    this.commit();
    void this.removeMemoCloud(id);
  }

  /* ------------------------------ 작품 보관함 ----------------------------- */

  worksFor(studentId: string): Work[] {
    return this.db.works
      .filter((w) => w.student_id === studentId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  worksInMonth(studentId: string, month: string): Work[] {
    return this.worksFor(studentId).filter((w) => w.date.startsWith(month));
  }

  addWork(input: Omit<Work, 'id'>): Work {
    const work: Work = {
      ...input,
      id: uid('work'),
      title: input.title.trim(),
      comment: input.comment.trim(),
      link: input.link.trim(),
      date: input.date || todayStr(),
      photo: input.photo || undefined,
    };
    this.db.works = [work, ...this.db.works];
    this.commit();
    if (this.sessionToken) void this.pushStudentWork(work);
    else void this.pushWork(work);
    return work;
  }

  deleteWork(id: string) {
    this.db.works = this.db.works.filter((w) => w.id !== id);
    this.commit();
    if (this.sessionToken) void this.removeStudentWork(id);
    else void this.removeWorkCloud(id);
  }

  /* ------------------------------ 24주 진도 ------------------------------ */

  doneWeeks(studentId: string): number[] {
    return (this.db.done[studentId] ?? []).slice().sort((a, b) => a - b);
  }

  isDone(studentId: string, week: number): boolean {
    return (this.db.done[studentId] ?? []).includes(week);
  }

  toggleWeek(studentId: string, week: number) {
    const cur = new Set(this.db.done[studentId] ?? []);
    if (cur.has(week)) cur.delete(week);
    else cur.add(week);
    this.db.done[studentId] = Array.from(cur).sort((a, b) => a - b);
    this.commit();
    void this.pushWeek(studentId, week, cur.has(week));
  }

  setWeekDone(studentId: string, week: number, done: boolean) {
    const cur = new Set(this.db.done[studentId] ?? []);
    if (done) cur.add(week);
    else cur.delete(week);
    this.db.done[studentId] = Array.from(cur).sort((a, b) => a - b);
    this.commit();
    void this.pushWeek(studentId, week, done);
  }

  /* ------------------------ 월말 리포트 종합 소견 직접 수정 ------------------------ */

  counselorOverride(studentId: string, month: string): string | null {
    const v = this.db.counselors[`${studentId}:${month}`];
    return typeof v === 'string' ? v : null;
  }

  setCounselorOverride(studentId: string, month: string, text: string) {
    const key = `${studentId}:${month}`;
    const next = text.trim() ? text : '';
    if ((this.db.counselors[key] ?? '') === next) return;
    if (next) this.db.counselors[key] = next;
    else delete this.db.counselors[key];
    this.commit();
    void this.pushCounselor(studentId, month, next);
  }

  clearCounselorOverride(studentId: string, month: string) {
    const key = `${studentId}:${month}`;
    if (!(key in this.db.counselors)) return;
    delete this.db.counselors[key];
    this.commit();
  }

  /** 다음에 할 주차 (1~24, 모두 끝났으면 25) */
  nextWeek(studentId: string): number {
    const done = new Set(this.doneWeeks(studentId));
    for (let w = 1; w <= 24; w += 1) if (!done.has(w)) return w;
    return 25;
  }


  /* ---------------------- Supabase 동기화 (2026-11-20) ---------------------- */
  /** 원장 로그인 상태에서 켭니다. 끄면 지금처럼 localStorage 전용. */
  cloudEnabled = false;

  /** 학생 로그인 토큰 (student_sessions) — 학생 화면에서 받은 작품을 서버에 올릴 때 씁니다 */
  private sessionToken: string | null = null;

  private async pushProfile(studentId: string) {
    if (!this.cloudEnabled || !supabase) return;
    const p = this.db.profiles[studentId];
    if (!p) return;
    const { error } = await supabase
      .from('class_profiles')
      .upsert({ student_id: studentId, track: p.track, code: p.code, updated_at: new Date().toISOString() });
    if (error) console.warn('[class] profile 저장 실패', error.message);
  }

  private async pushWeek(studentId: string, week: number, done: boolean) {
    if (!this.cloudEnabled || !supabase) return;
    const { error } = await supabase
      .from('class_progress')
      .upsert({ student_id: studentId, week, done, updated_at: new Date().toISOString() });
    if (error) console.warn('[class] 진도 저장 실패', error.message);
  }

  private async pushMemo(m: LessonMemo) {
    if (!this.cloudEnabled || !supabase) return;
    const { error } = await supabase.from('lesson_memos').upsert(
      { local_key: m.id, student_id: m.student_id, date: m.date, made: m.made, good: m.good, todo: m.todo },
      { onConflict: 'student_id,local_key' }
    );
    if (error) console.warn('[class] 메모 저장 실패', error.message);
  }

  private async removeMemoCloud(id: string) {
    if (!this.cloudEnabled || !supabase) return;
    await supabase.from('lesson_memos').delete().eq('local_key', id);
  }

  private async pushWork(w: Work) {
    if (!this.cloudEnabled || !supabase) return;
    const { error } = await supabase.from('student_works').upsert(
      {
        local_key: w.id,
        student_id: w.student_id,
        title: w.title,
        date: w.date,
        tool: w.tool,
        comment: w.comment,
        link: w.link,
        photo: w.photo ?? null,
      },
      { onConflict: 'student_id,local_key' }
    );
    if (error) console.warn('[class] 작품 저장 실패', error.message);
  }

  private async removeWorkCloud(id: string) {
    if (!this.cloudEnabled || !supabase) return;
    await supabase.from('student_works').delete().eq('local_key', id);
  }

  /** 학생 기기에서 만든 작품을 서버에 올립니다 — 원장 화면·월말 리포트·다른 기기에도 보입니다 */
  private async pushStudentWork(w: Work) {
    if (!supabase || !this.sessionToken) return;
    const { error } = await supabase.rpc('student_work_save', {
      p_token: this.sessionToken,
      p_local_key: w.id,
      p_title: w.title,
      p_date: w.date,
      p_tool: w.tool,
      p_comment: w.comment,
      p_link: w.link,
      p_photo: w.photo ?? null,
    });
    if (error) console.warn('[class] 학생 작품 저장 실패', error.message);
  }

  private async removeStudentWork(id: string) {
    if (!supabase || !this.sessionToken) return;
    const { error } = await supabase.rpc('student_work_delete', { p_token: this.sessionToken, p_local_key: id });
    if (error) console.warn('[class] 학생 작품 삭제 실패', error.message);
  }

  private async pushCounselor(studentId: string, month: string, text: string) {
    if (!this.cloudEnabled || !supabase) return;
    if (!text) {
      await supabase.from('report_notes').delete().eq('student_id', studentId).eq('month', month);
      return;
    }
    const { error } = await supabase
      .from('report_notes')
      .upsert({ student_id: studentId, month, text, updated_at: new Date().toISOString() });
    if (error) console.warn('[class] 소견 저장 실패', error.message);
  }

  /** 원장 로그인 후 서버 데이터를 받아 로컬과 합칩니다 (수업 메모·작품·진도·소견) */
  async pullCloud(): Promise<void> {
    if (!supabase) return;
    this.cloudEnabled = true;
    const [profiles, progress, memos, works, notes] = await Promise.all([
      supabase.from('class_profiles').select('*'),
      supabase.from('class_progress').select('*').eq('done', true),
      supabase.from('lesson_memos').select('*'),
      supabase.from('student_works').select('*'),
      supabase.from('report_notes').select('*'),
    ]);
    if (profiles.error) {
      console.warn('[class] pull 실패', profiles.error.message);
      return;
    }
    (profiles.data ?? []).forEach((p: { student_id: string; track: string | null; code: string | null }) => {
      this.db.profiles[p.student_id] = { track: (p.track ?? 'python') as Track, code: p.code ?? '' };
    });
    (progress.data ?? []).forEach((p: { student_id: string; week: number }) => {
      const set = new Set(this.db.done[p.student_id] ?? []);
      set.add(p.week);
      this.db.done[p.student_id] = Array.from(set).sort((a, b) => a - b);
    });
    const memoKeys = new Set(this.db.memos.map((m) => m.id));
    (memos.data ?? []).forEach(
      (m: { local_key: string; student_id: string; date: string; made: string; good: string; todo: string }) => {
        if (!m.local_key || memoKeys.has(m.local_key)) return;
        this.db.memos.push({ id: m.local_key, student_id: m.student_id, date: m.date, made: m.made, good: m.good, todo: m.todo });
      }
    );
    const workKeys = new Set(this.db.works.map((w) => w.id));
    (works.data ?? []).forEach(
      (w: {
        local_key: string;
        student_id: string;
        title: string;
        date: string;
        tool: string | null;
        comment: string | null;
        link: string | null;
        photo: string | null;
      }) => {
        if (!w.local_key || workKeys.has(w.local_key)) return;
        this.db.works.push({
          id: w.local_key,
          student_id: w.student_id,
          title: w.title,
          date: w.date,
          tool: w.tool ?? '',
          comment: w.comment ?? '',
          link: w.link ?? '',
          photo: w.photo ?? undefined,
        });
      }
    );
    (notes.data ?? []).forEach((n: { student_id: string; month: string; text: string }) => {
      this.db.counselors[`${n.student_id}:${n.month}`] = n.text;
    });
    this.commit();
  }

  /** 학생 기기에서 내 진도·작품을 받아옵니다 (수업 메모·교사 메모는 제외) */
  async pullStudentCloud(token: string, studentId?: string): Promise<void> {
    if (!token) return;
    this.sessionToken = token;
    if (!supabase) return;
    const { data, error } = await supabase.rpc('student_class_bundle', { p_token: token });
    if (error || !data) return;
    const bundle = data as {
      profile?: { track?: string | null; code?: string | null };
      progress?: number[];
      assignments?: { student_id: string }[];
      works?: { id: string; local_key?: string | null; title: string; date: string; tool: string | null; comment: string | null; link: string | null; photo: string | null }[];
    };
    const sid = studentId ?? bundle.assignments?.[0]?.student_id;
    if (!sid) return;
    // 원장님이 서버에서 바꾼 수강 트랙·기질 코드를 학생 화면에도 그대로 반영합니다
    if (bundle.profile?.track) {
      this.db.profiles[sid] = { track: asTrack(bundle.profile.track, 'python'), code: bundle.profile.code ?? '' };
    }
    if (bundle.progress?.length) {
      this.db.done[sid] = bundle.progress.slice().sort((a, b) => a - b);
    }
    // 학생이 다른 기기에서 등록한 작품도 이어서 보이게 (없는 것만 합칩니다)
    if (Array.isArray(bundle.works) && bundle.works.length) {
      const known = new Set(this.db.works.map((w) => w.id));
      bundle.works.forEach((w) => {
        const id = w.local_key || w.id;
        if (!id || known.has(id)) return;
        this.db.works.push({
          id,
          student_id: sid,
          title: w.title,
          date: w.date,
          tool: w.tool ?? '',
          comment: w.comment ?? '',
          link: w.link ?? '',
          photo: w.photo ?? undefined,
        });
        known.add(id);
      });
    }
    this.commit();
  }
}

export const classStore = new ClassStore();

export function useClassStore() {
  useSyncExternalStore(classStore.subscribe, classStore.getVersion, classStore.getVersion);
  return classStore;
}

export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1, 12);
  return monthKey(d);
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${y}년 ${m}월`;
}

/** 오늘 기준 남은 개월 목록 (최근 6개월) — 리포트 월 선택용 */
export function recentMonths(count = 6): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1, 12);
    out.push(monthKey(d));
  }
  return out;
}
