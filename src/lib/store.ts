import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, supabaseReady } from './supabase';
import { materialStore } from './materialStore';
import type {
  AppSettings,
  Assignment,
  CashWallet,
  CodingLevel,
  CodingLog,
  CodingSession,
  CodingWrongNote,
  DailyProgress,
  GameSession,
  Level,
  LevelHistory,
  RedemptionRequest,
  ShopItem,
  Student,
  StudyLog,
  StudyMode,
  Subject,
  WeeklyReport,
  Word,
  WordSet,
  WrongNote,
} from '../types';
import { LEVEL_META, LEVEL_TO_TOSEL } from '../types';
import {
  DEFAULT_CASH_DAILY_LIMIT,
  SEED_ADMIN_PIN,
  SEED_SHOP_ITEMS,
  SEED_STUDENTS,
  SEED_WORD_SETS,
  SEED_WORDS,
  seedCodingWrongNotes,
  seedRedemptions,
  seedWallets,
} from '../data/seed';
import { addDays, hashPin, mulberry32, randomPin, randomToken, todayStr, uid, verifyPin } from './util';

/** 원장 로그인 세션을 기기에 남겨 새로고침 후에도 이어지게 합니다 (기기 로컬 저장) */
const SESSION_MIRROR_KEY = 'rafine-sb-session-v1';

function saveSession(session: { access_token: string; refresh_token?: string }) {
  try {
    localStorage.setItem(
      SESSION_MIRROR_KEY,
      JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token ?? '' })
    );
  } catch {
    /* 저장 실패해도 로그인은 유지 */
  }
}

function readSavedSession(): { access_token: string; refresh_token: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_MIRROR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: string; refresh_token?: string };
    if (!parsed.access_token) return null;
    return { access_token: parsed.access_token, refresh_token: parsed.refresh_token ?? '' };
  } catch {
    return null;
  }
}

function clearSavedSession() {
  try {
    localStorage.removeItem(SESSION_MIRROR_KEY);
  } catch {
    /* ignore */
  }
}

/** 학생 로그인 토큰 (12시간) — 새로고침 후에도 수업자료·학습 데이터를 이어 받기 위해 기기에 남깁니다 */
const STUDENT_TOKEN_KEY = 'rafine-voca-student-token';

function readSavedStudentToken(): string | null {
  try {
    return localStorage.getItem(STUDENT_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

function saveStudentToken(token: string | null) {
  try {
    if (token) localStorage.setItem(STUDENT_TOKEN_KEY, token);
    else localStorage.removeItem(STUDENT_TOKEN_KEY);
  } catch {
    /* 저장 실패해도 로그인은 유지 */
  }
}

const LS_KEY = 'rafine-voca-db-v1';

interface DB {
  students: Student[];
  sets: WordSet[];
  words: Word[];
  assignments: Assignment[];
  logs: StudyLog[];
  wrong_notes: WrongNote[];
  progress: DailyProgress[];
  reports: WeeklyReport[];
  history: LevelHistory[];
  wallets: CashWallet[];
  shop_items: ShopItem[];
  redemptions: RedemptionRequest[];
  games: GameSession[];
  coding_logs: CodingLog[];
  coding_wrong_notes: CodingWrongNote[];
  coding_sessions: CodingSession[];
  settings: AppSettings;
}

const emptyDB = (): DB => ({
  students: [],
  sets: [],
  words: [],
  assignments: [],
  logs: [],
  wrong_notes: [],
  progress: [],
  reports: [],
  history: [],
  wallets: [],
  shop_items: [],
  redemptions: [],
  games: [],
  coding_logs: [],
  coding_wrong_notes: [],
  coding_sessions: [],
  settings: { cash_daily_limit: DEFAULT_CASH_DAILY_LIMIT },
});

export type StoreMode = 'local' | 'supabase';

export interface CsvRow {
  word: string;
  meaning: string;
  pos?: string;
  example?: string;
  example_ko?: string;
  order_no?: number;
}

export interface NewStudentInput {
  name: string;
  grade: number;
  class_name: string;
  nickname?: string;
  level?: Level;
  coding_level?: CodingLevel;
  enabled_subjects?: Subject[];
}

/**
 * 앱의 단일 데이터 레이어.
 * - VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 있으면 Supabase 모드 (실시간 DB)
 * - 없으면 LocalStorage 데모 모드 (샘플 학생 5명 + 100단어 시드, 즉시 시연 가능)
 * 화면 코드는 모드를 신경 쓰지 않고 같은 메서드를 사용한다.
 */
class VocaStore {
  mode: StoreMode = 'local';
  version = 0;
  students: Student[] = [];
  sets: WordSet[] = [];
  words: Word[] = [];
  assignments: Assignment[] = [];
  logs: StudyLog[] = [];
  wrongNotes: WrongNote[] = [];
  progress: DailyProgress[] = [];
  reports: WeeklyReport[] = [];
  history: LevelHistory[] = [];
  wallets: CashWallet[] = [];
  shopItems: ShopItem[] = [];
  redemptions: RedemptionRequest[] = [];
  games: GameSession[] = [];
  codingLogs: CodingLog[] = [];
  codingWrongNotes: CodingWrongNote[] = [];
  codingSessions: CodingSession[] = [];
  settings: AppSettings = { cash_daily_limit: DEFAULT_CASH_DAILY_LIMIT };
  ready: Promise<void>;
  adminEmail: string | null = null;
  /** Supabase 원장 로그인 상태 — 'signed-out' 이면 세션이 끊긴 것(만료 포함)입니다 */
  adminAuth: 'signed-in' | 'signed-out' = 'signed-out';
  lastCloudError: string | null = null;
  studentToken: string | null = null;

  private client: SupabaseClient | null = null;
  private listeners = new Set<() => void>();
  private persistTimer: number | null = null;
  private cloudWarnings = 0;

  constructor() {
    this.ready = this.init();
  }

  /* ---------------------------------- 초기화 --------------------------------- */

  private async init() {
    const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
    const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

    if (url && key && supabaseReady && supabase) {
      try {
        // 앱 전체가 같은 Supabase 클라이언트를 씁니다 (두 개를 만들면 로그인 세션이 서로 지워집니다)
        this.client = supabase;
        this.mode = 'supabase';
        // 학생 로그인 토큰도 기기에 남아 있으면 복원합니다 (새로고침 후 수업자료가 비어 보이지 않게)
        this.studentToken = readSavedStudentToken();
        let session = await this.client.auth.getSession();
        // 새로고침 후 라이브러리 저장소가 비어 있으면, 기기에 남겨 둔 세션으로 복원합니다.
        if (!session.data.session) {
          const saved = readSavedSession();
          if (saved) {
            try {
              const restored = await this.client.auth.setSession(saved);
              session = { data: { session: restored.data.session }, error: restored.error } as typeof session;
            } catch (err) {
              console.warn('[voca] 저장된 로그인 세션 복원 실패', err);
            }
          }
        }
        this.adminEmail = session.data.session?.user?.email ?? null;
        this.adminAuth = session.data.session?.user ? 'signed-in' : 'signed-out';
        // 로그인 전(anon)에는 students 등 개인정보 테이블을 읽을 수 없습니다.
        // 그 실패로 앱 전체를 데모 모드로 떨어뜨리지 않고, 로그인 후에 다시 읽습니다.
        try {
          await this.loadCloud();
        } catch (err) {
          this.lastCloudError = err instanceof Error ? err.message : String(err);
          console.warn('[voca] 로그인 전 클라우드 읽기 보류 — 로그인 후 다시 불러옵니다', err);
        }
        this.watchCloud();
        // 복원한 학생 토큰이 있으면 내 학습·수업자료를 먼저 받아 둡니다
        if (this.studentToken) {
          try {
            await this.loadStudentBundle();
            await materialStore.loadStudentCloud(this.studentToken);
          } catch (err) {
            console.warn('[voca] 저장된 학생 토큰으로 불러오기 실패 — 다시 로그인하면 이어집니다', err);
          }
        }
        // 로그인/로그아웃 이벤트에서 원장 데이터를 다시 읽습니다 (새로고침 후에도 유지)
        this.client.auth.onAuthStateChange((_event, session) => {
          this.adminEmail = session?.user?.email ?? null;
          this.adminAuth = session?.user ? 'signed-in' : 'signed-out';
          if (session?.user) {
            void this.loadCloud()
              .then(() => this.emit())
              .catch((err) => console.warn('[voca] 로그인 후 클라우드 읽기 보류', err));
          }
        });
        this.emit();
        return;
      } catch (err) {
        console.warn('[voca] Supabase 연결 실패 → 로컬 데모 모드로 전환', err);
        this.client = null;
        this.mode = 'local';
      }
    }

    this.loadLocal();
    if (this.students.length === 0) {
      this.seedLocal();
    }
    this.normalizeExtras();
    this.emit();
  }

  /** 예전 저장본(상점·지갑 이전 버전)도 바로 동작하도록 빠진 부분만 채웁니다 */
  private normalizeExtras() {
    const today = todayStr();
    if (!this.settings || typeof this.settings.cash_daily_limit !== 'number') {
      this.settings = { cash_daily_limit: DEFAULT_CASH_DAILY_LIMIT };
    }
    // 수강 과목이 비어 있는 예전 저장본은 코딩 학원 기본값(코딩만)으로 채웁니다
    this.students = this.students.map((s) => ({
      ...s,
      coding_level: s.coding_level ?? 'C1',
      enabled_subjects:
        Array.isArray(s.enabled_subjects) && s.enabled_subjects.length ? s.enabled_subjects : ['coding'],
    }));
    if (!this.shopItems.length) {
      this.shopItems = SEED_SHOP_ITEMS.map((i) => ({ ...i }));
    }
    if (!this.redemptions.length) {
      this.redemptions = seedRedemptions(today);
    }
    const missing = this.students.filter((s) => !this.wallets.some((w) => w.student_id === s.id));
    if (missing.length) {
      this.wallets = [
        ...this.wallets,
        ...missing.map((s) => ({
          student_id: s.id,
          cash_balance: 0,
          daily_cash_earned: 0,
          earned_date: today,
          updated_at: new Date().toISOString(),
        })),
      ];
    }
  }

  private loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const db = JSON.parse(raw) as DB;
      this.students = db.students ?? [];
      this.sets = db.sets ?? [];
      this.words = db.words ?? [];
      this.assignments = db.assignments ?? [];
      this.logs = db.logs ?? [];
      this.wrongNotes = db.wrong_notes ?? [];
      this.progress = db.progress ?? [];
      this.reports = db.reports ?? [];
      this.history = db.history ?? [];
      this.wallets = db.wallets ?? [];
      this.shopItems = db.shop_items ?? [];
      this.redemptions = db.redemptions ?? [];
      this.games = db.games ?? [];
      this.codingLogs = db.coding_logs ?? [];
      this.codingWrongNotes = db.coding_wrong_notes ?? [];
      this.codingSessions = db.coding_sessions ?? [];
      this.settings = db.settings ?? { cash_daily_limit: DEFAULT_CASH_DAILY_LIMIT };
    } catch (err) {
      console.warn('[voca] 로컬 저장소 읽기 실패, 새로 시작합니다', err);
    }
  }

  private persistLocal() {
    if (this.mode !== 'local') return;
    if (this.persistTimer) window.clearTimeout(this.persistTimer);
    this.persistTimer = window.setTimeout(() => {
      const db: DB = {
        students: this.students,
        sets: this.sets,
        words: this.words,
        assignments: this.assignments,
        logs: this.logs,
        wrong_notes: this.wrongNotes,
        progress: this.progress,
        reports: this.reports,
        history: this.history,
        wallets: this.wallets,
        shop_items: this.shopItems,
        redemptions: this.redemptions,
        games: this.games,
        coding_logs: this.codingLogs,
        coding_wrong_notes: this.codingWrongNotes,
        coding_sessions: this.codingSessions,
        settings: this.settings,
      };
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(db));
      } catch (err) {
        console.warn('[voca] 로컬 저장 실패', err);
      }
    }, 120);
  }

  /** 데모 시드: 학생 5명 + 100단어 + 지난 10일 학습 기록 */
  private seedLocal() {
    const now = new Date();
    const students: Student[] = SEED_STUDENTS.map((s) => ({
      ...s,
      pin: hashPin(s.id, s.pin),
    }));
    const sets = SEED_WORD_SETS.map((s) => ({ ...s }));
    const words = SEED_WORDS.map((w) => ({ ...w }));
    const assignments: Assignment[] = [];
    for (const st of students) {
      for (const set of sets.filter((s) => s.level === st.level && s.active)) {
        assignments.push({
          id: uid('asg'),
          student_id: st.id,
          set_id: set.id,
          assigned_on: addDays(todayStr(), -12),
        });
      }
    }

    const rand = mulberry32(20261117);
    const logs: StudyLog[] = [];
    const wrong: WrongNote[] = [];
    const progress: DailyProgress[] = [];
    const accuracyBase: Record<string, number> = {
      'stu-seoyeon': 0.92,
      'stu-junwoo': 0.86,
      'stu-haeun': 0.78,
      'stu-minjun': 0.9,
      'stu-yujin': 0.74,
    };

    const today = todayStr();
    for (let back = 10; back >= 1; back--) {
      const date = addDays(today, -back);
      for (const st of students) {
        // 김서연은 5일 연속, 유진이는 중간에 하루 쉼
        if (st.id === 'stu-yujin' && back === 3) continue;
        if (st.id === 'stu-haeun' && back === 8) continue;

        const levelWords = words.filter((w) => this.levelOfSet(sets, w.set_id) === st.level);
        if (!levelWords.length) continue;
        const dailyNew = Math.min(LEVEL_META[st.level].dailyNew, levelWords.length);
        const start = ((11 - back) * dailyNew) % levelWords.length;
        const dayWords: Word[] = [];
        for (let i = 0; i < dailyNew; i++) dayWords.push(levelWords[(start + i) % levelWords.length]);

        const accuracy = accuracyBase[st.id] ?? 0.8;
        let answered = 0;
        dayWords.forEach((w, i) => {
          const firstCorrect = rand() < accuracy;
          const at = new Date(`${date}T17:${String(10 + Math.floor(i * 1.4)).padStart(2, '0')}:00+09:00`);
          answered++;
          logs.push({
            id: uid('log'),
            student_id: st.id,
            word_id: w.id,
            set_id: w.set_id,
            is_correct: firstCorrect,
            mode: rand() < 0.55 ? 'choice' : 'spell',
            elapsed_ms: 4200 + Math.floor(rand() * 5200),
            answered_at: at.toISOString(),
          });
          if (!firstCorrect) {
            const again = new Date(at.getTime() + 25000);
            logs.push({
              id: uid('log'),
              student_id: st.id,
              word_id: w.id,
              set_id: w.set_id,
              is_correct: true,
              mode: 'choice',
              elapsed_ms: 3000 + Math.floor(rand() * 3000),
              answered_at: again.toISOString(),
            });
            const existing = wrong.find((n) => n.student_id === st.id && n.word_id === w.id);
            if (existing) {
              existing.miss_count += 1;
              existing.box = Math.max(0, existing.box - 1);
              existing.due_date = addDays(today, -1);
            } else {
              wrong.push({
                id: uid('wn'),
                student_id: st.id,
                word_id: w.id,
                box: rand() < 0.4 ? 0 : 1,
                due_date: rand() < 0.5 ? today : addDays(today, 1 + Math.floor(rand() * 3)),
                miss_count: 1 + Math.floor(rand() * 2),
                cleared_at: null,
              });
            }
          }
        });
        progress.push({ student_id: st.id, date, target: dailyNew, answered });
      }
    }

    // 오늘 접속 기록 (대시보드 접속 인원)
    students.forEach((st, i) => {
      if (i < 2) st.last_seen_at = new Date(`${today}T09:${20 + i * 7}:00+09:00`).toISOString();
      else if (i === 2) st.last_seen_at = new Date(`${addDays(today, -1)}T18:40:00+09:00`).toISOString();
      else st.last_seen_at = new Date(`${addDays(today, -3)}T17:10:00+09:00`).toISOString();
    });

    this.students = students;
    this.sets = sets;
    this.words = words;
    this.assignments = assignments;
    this.logs = logs;
    this.wrongNotes = wrong;
    this.progress = progress;
    this.reports = [];
    this.history = students.map((s) => ({
      id: uid('lh'),
      student_id: s.id,
      from_level: null,
      to_level: s.level,
      tosel_level: s.tosel_level,
      changed_at: s.created_at,
    }));
    this.wallets = seedWallets(students, today);
    this.shopItems = SEED_SHOP_ITEMS.map((i) => ({ ...i }));
    this.redemptions = seedRedemptions(today);
    this.games = [];
    this.codingLogs = [];
    this.codingWrongNotes = seedCodingWrongNotes(today);
    this.codingSessions = [];
    this.settings = { cash_daily_limit: DEFAULT_CASH_DAILY_LIMIT };
    this.persistLocal();
  }

  private levelOfSet(sets: WordSet[], setId: string): Level | null {
    return sets.find((s) => s.id === setId)?.level ?? null;
  }

  /* --------------------------------- 구독/알림 -------------------------------- */

  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  getVersion = () => this.version;

  private emit() {
    this.version += 1;
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.warn(err);
      }
    });
  }

  private commit() {
    this.persistLocal();
    this.emit();
  }

  /* ---------------------------------- 학생 ---------------------------------- */

  listStudents(includeInactive = false): Student[] {
    return this.students
      .filter((s) => includeInactive || s.active)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }

  getStudent(id: string): Student | undefined {
    return this.students.find((s) => s.id === id);
  }

  verifyStudentPin(studentId: string, pin: string): boolean {
    if (this.mode === 'supabase') return false; // Supabase 모드에서는 Edge Function pin-login 사용
    const st = this.getStudent(studentId);
    if (!st) return false;
    return verifyPin(st.id, pin, st.pin);
  }

  async loginStudentCloud(name: string, pin: string): Promise<Student | null> {
    if (!this.client || this.mode !== 'supabase') return null;
    const { data, error } = await this.client.rpc('student_login', { p_name: name, p_pin: pin });
    if (error) {
      if (/PIN_MISMATCH|STUDENT_NOT_FOUND/.test(error.message)) return null;
      throw new Error(error.message);
    }
    const token = (data as any)?.token as string | undefined;
    const student = (data as any)?.student as Student | undefined;
    if (!token || !student) return null;
    this.studentToken = token;
    saveStudentToken(token);
    await this.loadStudentBundle();
    return this.getStudent(student.id) ?? student;
  }

  /** 학생 세션 토큰으로 자기 데이터만 받아옵니다 (student_bundle RPC) */
  private async loadStudentBundle() {
    if (!this.client || !this.studentToken) return;
    const { data, error } = await this.client.rpc('student_bundle', { p_token: this.studentToken });
    if (error) {
      console.warn('[voca] student_bundle 실패', error);
      return;
    }
    const bundle = data as any;
    if (!bundle?.student) return;
    const student = bundle.student as Student;
    this.students = [student];
    this.sets = (bundle.sets ?? []) as WordSet[];
    this.words = (bundle.words ?? []) as Word[];
    this.assignments = [];
    this.wrongNotes = ((bundle.wrong_notes ?? []) as any[]).map((n) => ({ ...n, id: String(n.id) }));
    this.logs = ((bundle.logs ?? []) as any[]).map((l) => ({ ...l, id: String(l.id) }));
    this.progress = ((bundle.progress ?? []) as any[]).map((p) => ({
      student_id: student.id,
      date: p.date,
      target: Math.max(LEVEL_META[student.level].dailyNew, p.answered ?? 0),
      answered: p.answered ?? 0,
    }));
    // 캐시 지갑·상점·교환 내역 (student_bundle 이 함께 내려줍니다)
    if (bundle.wallet) {
      this.wallets = [{ ...(bundle.wallet as CashWallet), student_id: student.id }];
    }
    if (Array.isArray(bundle.shop_items)) {
      this.shopItems = bundle.shop_items as ShopItem[];
    }
    if (Array.isArray(bundle.redemptions)) {
      this.redemptions = bundle.redemptions as RedemptionRequest[];
    }
    if (typeof bundle.daily_cash_limit === 'number') {
      this.settings = { cash_daily_limit: bundle.daily_cash_limit };
    }
    // 코딩 확장 — student_coding_bundle RPC 가 있으면 코딩 기록까지 받아옵니다 (없는 스키마에서도 동작)
    try {
      const { data: coding, error: codingError } = await this.client.rpc('student_coding_bundle', {
        p_token: this.studentToken,
      });
      if (!codingError && coding) {
        const c = coding as any;
        if (Array.isArray(c.coding_logs)) this.codingLogs = c.coding_logs as CodingLog[];
        if (Array.isArray(c.coding_wrong_notes)) this.codingWrongNotes = c.coding_wrong_notes as CodingWrongNote[];
        if (Array.isArray(c.coding_sessions)) this.codingSessions = c.coding_sessions as CodingSession[];
      }
    } catch {
      /* 코딩 RPC 미적용 환경 */
    }
    // 코딩 확장 — 서버 번들에 코딩 데이터가 있으면 함께 받아옵니다 (없는 스키마에서도 동작)
    if (Array.isArray(bundle.coding_logs)) this.codingLogs = bundle.coding_logs as CodingLog[];
    if (Array.isArray(bundle.coding_wrong_notes)) this.codingWrongNotes = bundle.coding_wrong_notes as CodingWrongNote[];
    if (Array.isArray(bundle.coding_sessions)) this.codingSessions = bundle.coding_sessions as CodingSession[];
    this.emit();
  }

  async addStudent(input: NewStudentInput): Promise<{ student: Student; pin: string }> {
    const pin = randomPin();
    const level = input.level ?? 1;
    const newId = uid('stu');
    const student: Student = {
      id: newId,
      name: input.name.trim(),
      class_name: input.class_name.trim() || '미지정',
      grade: input.grade,
      level,
      tosel_level: LEVEL_TO_TOSEL[level],
      pin: hashPin(newId, pin),
      nickname: (input.nickname ?? input.name.trim()).slice(0, 12),
      parent_token: randomToken(32),
      active: true,
      created_at: new Date().toISOString(),
      last_seen_at: null,
      coding_level: input.coding_level ?? 'C1',
      enabled_subjects: input.enabled_subjects ?? ['coding'],
    };

    if (this.mode === 'supabase' && this.client) {
      const { data, error } = await this.client.rpc('admin_create_student', {
        p_name: student.name,
        p_grade: student.grade,
        p_class_name: student.class_name,
        p_nickname: student.nickname,
        p_level: student.level,
        p_pin: pin,
      });
      if (error) throw new Error(error.message);
      const created = (data as any)?.student as Student | undefined;
      await this.loadCloud();
      const saved = created ? this.getStudent(created.id) ?? created : null;
      if (saved) return { student: saved, pin };
    }

    this.students = [...this.students, student];
    this.ensureAssignments(student);
    this.history = [
      ...this.history,
      {
        id: uid('lh'),
        student_id: student.id,
        from_level: null,
        to_level: level,
        tosel_level: student.tosel_level,
        changed_at: student.created_at,
      },
    ];
    this.commit();
    return { student, pin };
  }

  async resetPin(studentId: string): Promise<string> {
    const pin = randomPin();
    const st = this.getStudent(studentId);
    if (!st) throw new Error('학생을 찾을 수 없어요');
    if (this.mode === 'supabase' && this.client) {
      const { error } = await this.client.rpc('admin_reset_pin', { p_student_id: studentId, p_pin: pin });
      if (error) throw new Error(error.message);
      await this.loadCloud();
      return pin;
    }
    st.pin = hashPin(studentId, pin);
    this.commit();
    return pin;
  }

  setStudentActive(studentId: string, active: boolean) {
    const st = this.getStudent(studentId);
    if (!st) return;
    st.active = active;
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`students update ${studentId}`, () =>
        this.client!.from('students').update({ active }).eq('id', studentId)
      );
    }
    this.commit();
  }

  /** 라피네 클래스 — 이름·학년·반 수정 (원장님이 학생 정보를 바로 고칩니다) */
  updateStudentBasic(studentId: string, patch: { name?: string; grade?: number; class_name?: string }) {
    const st = this.getStudent(studentId);
    if (!st) return;
    if (patch.name !== undefined && patch.name.trim()) st.name = patch.name.trim();
    if (patch.grade !== undefined && Number.isFinite(patch.grade)) st.grade = Number(patch.grade);
    if (patch.class_name !== undefined && patch.class_name.trim()) st.class_name = patch.class_name.trim();
    this.commit();
  }

  setStudentLevel(studentId: string, level: Level) {
    const st = this.getStudent(studentId);
    if (!st) return;
    if (st.level === level) return;
    const prev = st.level;
    st.level = level;
    st.tosel_level = LEVEL_TO_TOSEL[level];
    this.history = [
      ...this.history,
      {
        id: uid('lh'),
        student_id: studentId,
        from_level: prev,
        to_level: level,
        tosel_level: st.tosel_level,
        changed_at: new Date().toISOString(),
      },
    ];
    this.ensureAssignments(st);
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`students level ${studentId}`, () =>
        this.client!.from('students').update({ level, tosel_level: st.tosel_level }).eq('id', studentId)
      );
      this.cloud(`level history ${studentId}`, () =>
        this.client!.from('level_history').insert({
          student_id: studentId,
          from_level: prev,
          to_level: level,
          tosel_level: st.tosel_level,
        })
      );
    }
    this.commit();
  }

  listLevelHistory(studentId?: string): LevelHistory[] {
    return this.history
      .filter((h) => !studentId || h.student_id === studentId)
      .slice()
      .sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  }

  /* --------------------------- 코딩 레벨 · 수강 과목 --------------------------- */

  /** 원장님 — 학생별 코딩 커리큘럼 레벨(C1~C4) 변경 */
  setStudentCodingLevel(studentId: string, level: CodingLevel) {
    const st = this.getStudent(studentId);
    if (!st || st.coding_level === level) return;
    st.coding_level = level;
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`students coding_level ${studentId}`, () =>
        this.client!.from('students').update({ coding_level: level }).eq('id', studentId)
      );
    }
    this.commit();
  }

  /** 원장님 — 학생별 수강 과목(탭) 열어 주기. 영어·코딩 순서와 중복은 정리합니다. */
  setStudentSubjects(studentId: string, subjects: Subject[]) {
    const st = this.getStudent(studentId);
    if (!st) return;
    const clean: Subject[] = (['coding', 'english'] as Subject[]).filter((s) => subjects.includes(s));
    const next = clean.length ? clean : (['coding'] as Subject[]);
    if (st.enabled_subjects.length === next.length && st.enabled_subjects.every((s, i) => s === next[i])) return;
    st.enabled_subjects = next;
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`students subjects ${studentId}`, () =>
        this.client!.from('students').update({ enabled_subjects: next }).eq('id', studentId)
      );
    }
    this.commit();
  }

  /* -------------------------------- 코딩 미션 -------------------------------- */

  codingLogsFor(studentId: string): CodingLog[] {
    return this.codingLogs.filter((l) => l.student_id === studentId);
  }

  /** 코딩 오답 노트 — 아직 졸업하지 않은 문제 (틀린 횟수 많은 순) */
  codingWrongNotesFor(studentId: string): CodingWrongNote[] {
    return this.codingWrongNotes
      .filter((n) => n.student_id === studentId && !n.cleared_at)
      .slice()
      .sort((a, b) => b.miss_count - a.miss_count || b.last_wrong_at.localeCompare(a.last_wrong_at));
  }

  /** 코딩 문항 답 기록 — 틀리면 오답 노트에 쌓고, 다시 맞히면 졸업 처리 */
  recordCodingAnswer(
    student: Student,
    problem: { id: string; level: CodingLevel; kind: CodingLog['kind'] },
    isCorrect: boolean,
    mode: CodingLog['mode'] = 'mission'
  ) {
    const at = new Date().toISOString();
    const log: CodingLog = {
      id: uid('clog'),
      student_id: student.id,
      problem_id: problem.id,
      level: problem.level,
      kind: problem.kind,
      is_correct: isCorrect,
      mode,
      answered_at: at,
    };
    this.codingLogs = [...this.codingLogs.slice(-4000), log];

    const idx = this.codingWrongNotes.findIndex(
      (n) => n.student_id === student.id && n.problem_id === problem.id
    );
    if (isCorrect) {
      if (idx >= 0) {
        const note: CodingWrongNote = { ...this.codingWrongNotes[idx], cleared_at: at };
        this.codingWrongNotes = this.codingWrongNotes.map((n, i) => (i === idx ? note : n));
        this.cloudCodingWrongNote(note);
      }
    } else {
      const note: CodingWrongNote =
        idx >= 0
          ? {
              ...this.codingWrongNotes[idx],
              miss_count: this.codingWrongNotes[idx].miss_count + 1,
              last_wrong_at: at,
              cleared_at: null,
            }
          : {
              student_id: student.id,
              problem_id: problem.id,
              level: problem.level,
              miss_count: 1,
              last_wrong_at: at,
              cleared_at: null,
            };
      this.codingWrongNotes = idx >= 0 ? this.codingWrongNotes.map((n, i) => (i === idx ? note : n)) : [...this.codingWrongNotes, note];
      this.cloudCodingWrongNote(note);
    }

    if (this.mode === 'supabase' && this.client) {
      this.cloud(`coding answer ${student.id}`, () =>
        this.client!.from('coding_logs').insert({
          student_id: student.id,
          problem_id: problem.id,
          level: problem.level,
          kind: problem.kind,
          is_correct: isCorrect,
          mode,
        })
      );
    }
    this.commit();
  }

  private cloudCodingWrongNote(note: CodingWrongNote) {
    if (this.mode !== 'supabase' || !this.client) return;
    this.cloud(`coding wrong note ${note.problem_id}`, () =>
      this.client!
        .from('coding_wrong_notes')
        .upsert(
          {
            student_id: note.student_id,
            problem_id: note.problem_id,
            level: note.level,
            miss_count: note.miss_count,
            last_wrong_at: note.last_wrong_at,
            cleared_at: note.cleared_at,
          },
          { onConflict: 'student_id,problem_id' }
        )
    );
  }

  recordCodingSession(
    studentId: string,
    input: { game: CodingSession['game']; score: number; total: number; cashEarned: number; wrongProblemIds: string[] }
  ): CodingSession {
    const session: CodingSession = {
      id: uid('cs'),
      student_id: studentId,
      game: input.game,
      score: input.score,
      total: input.total,
      cash_earned: input.cashEarned,
      wrong_problem_ids: input.wrongProblemIds,
      played_at: new Date().toISOString(),
    };
    this.codingSessions = [session, ...this.codingSessions].slice(0, 500);
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`coding session ${studentId}`, () =>
        this.client!.from('coding_sessions').insert({
          student_id: studentId,
          game: session.game,
          score: session.score,
          total: session.total,
          cash_earned: session.cash_earned,
          wrong_problem_ids: session.wrong_problem_ids,
        })
      );
    }
    this.commit();
    return session;
  }

  codingSessionsFor(studentId: string, limit = 10): CodingSession[] {
    return this.codingSessions.filter((s) => s.student_id === studentId).slice(0, limit);
  }

  allCodingSessions(): CodingSession[] {
    return this.codingSessions;
  }

  /** 관리자 화면 — 학생별 코딩 현황 (푼 문제·정답률·오답·게임 판수·오늘 적립) */
  codingOverview(): {
    student: Student;
    solved: number;
    answered: number;
    accuracy: number;
    wrongOpen: number;
    gameRounds: number;
    cashToday: number;
    lastPlayedAt: string | null;
  }[] {
    return this.listStudents(true).map((student) => {
      const logs = this.codingLogsFor(student.id);
      const correct = logs.filter((l) => l.is_correct).length;
      const sessions = this.codingSessionsFor(student.id, 500);
      return {
        student,
        solved: new Set(logs.filter((l) => l.is_correct).map((l) => l.problem_id)).size,
        answered: logs.length,
        accuracy: logs.length ? Math.round((correct / logs.length) * 100) : 0,
        wrongOpen: this.codingWrongNotesFor(student.id).length,
        gameRounds: sessions.length,
        cashToday: this.todayCashEarned(student.id),
        lastPlayedAt: logs.length ? logs[logs.length - 1].answered_at : null,
      };
    });
  }

  private ensureAssignments(student: Student) {
    const today = todayStr();
    for (const set of this.sets.filter((s) => s.level === student.level && s.active)) {
      if (!this.assignments.some((a) => a.student_id === student.id && a.set_id === set.id)) {
        const asg: Assignment = {
          id: uid('asg'),
          student_id: student.id,
          set_id: set.id,
          assigned_on: today,
        };
        this.assignments = [...this.assignments, asg];
        if (this.mode === 'supabase' && this.client) {
          this.cloud(`assign ${student.id}/${set.id}`, () =>
            this.client!.from('assignments').insert({ student_id: student.id, set_id: set.id })
          );
        }
      }
    }
  }

  /* ---------------------------------- 단어장 --------------------------------- */

  listWordSets(level?: Level): WordSet[] {
    return this.sets
      .filter((s) => s.active && (!level || s.level === level))
      .slice()
      .sort((a, b) => a.level - b.level || a.day_index - b.day_index);
  }

  wordsForLevel(level: Level): Word[] {
    const setIds = new Set(this.sets.filter((s) => s.level === level && s.active).map((s) => s.id));
    return this.words
      .filter((w) => setIds.has(w.set_id))
      .slice()
      .sort((a, b) => a.set_id.localeCompare(b.set_id) || a.order_no - b.order_no);
  }

  wordById(id: string): Word | undefined {
    return this.words.find((w) => w.id === id);
  }

  wordsOfStudent(student: Student): Word[] {
    const setIds = new Set(
      this.assignments
        .filter((a) => a.student_id === student.id)
        .map((a) => a.set_id)
        .filter((id) => this.sets.some((s) => s.id === id && s.active))
    );
    const levelSetIds = new Set(this.sets.filter((s) => s.level === student.level && s.active).map((s) => s.id));
    const ids = setIds.size ? setIds : levelSetIds;
    return this.words
      .filter((w) => ids.has(w.set_id))
      .slice()
      .sort((a, b) => a.set_id.localeCompare(b.set_id) || a.order_no - b.order_no);
  }

  addWordsFromCsv(level: Level, dayIndex: number, rows: CsvRow[]): { set: WordSet; added: number } {
    const clean = rows
      .filter((r) => r.word?.trim() && r.meaning?.trim())
      .map((r, i) => ({ ...r, word: r.word.trim(), meaning: r.meaning.trim(), order_no: r.order_no ?? i + 1 }));

    let set = this.sets.find((s) => s.level === level && s.day_index === dayIndex && s.active);
    if (!set) {
      set = {
        id: uid('set'),
        name: `Level ${level} · Day ${String(dayIndex).padStart(2, '0')}`,
        level,
        day_index: dayIndex,
        active: true,
        created_at: new Date().toISOString(),
      };
      this.sets = [...this.sets, set];
      if (this.mode === 'supabase' && this.client) {
        this.cloud(`insert set ${set.id}`, () =>
          this.client!.from('word_sets').insert({ id: set!.id, name: set!.name, level, day_index: dayIndex })
        );
      }
    }

    const existing = new Set(this.words.filter((w) => w.set_id === set!.id).map((w) => w.word.toLowerCase()));
    const newWords: Word[] = [];
    for (const r of clean) {
      if (existing.has(r.word.toLowerCase())) continue;
      existing.add(r.word.toLowerCase());
      newWords.push({
        id: uid('w'),
        set_id: set.id,
        word: r.word,
        meaning: r.meaning,
        pos: r.pos?.trim() || 'n',
        example: r.example?.trim() || '',
        example_ko: r.example_ko?.trim() || '',
        order_no: r.order_no ?? newWords.length + 1,
      });
    }
    this.words = [...this.words, ...newWords];
    for (const st of this.students.filter((s) => s.level === level && s.active)) {
      this.ensureAssignments(st);
    }
    if (this.mode === 'supabase' && this.client && newWords.length) {
      this.cloud(`insert words ${set.id}`, () =>
        this.client!.from('words').insert(
          newWords.map((w) => ({
            id: w.id,
            set_id: w.set_id,
            word: w.word,
            meaning: w.meaning,
            pos: w.pos,
            example: w.example,
            example_ko: w.example_ko,
            order_no: w.order_no,
          }))
        )
      );
    }
    this.commit();
    return { set, added: newWords.length };
  }

  /* ---------------------------------- 학습 ---------------------------------- */

  logsFor(studentId: string): StudyLog[] {
    return this.logs.filter((l) => l.student_id === studentId);
  }

  allLogs(): StudyLog[] {
    return this.logs;
  }

  recordAnswer(student: Student, word: Word, isCorrect: boolean, mode: StudyMode, elapsedMs: number) {
    const log: StudyLog = {
      id: uid('log'),
      student_id: student.id,
      word_id: word.id,
      set_id: word.set_id,
      is_correct: isCorrect,
      mode,
      elapsed_ms: Math.max(0, Math.round(elapsedMs)),
      answered_at: new Date().toISOString(),
    };
    this.logs = [...this.logs, log];
    this.applyWrongNote(student.id, word.id, isCorrect);
    this.bumpProgress(student.id, 1);
    student.last_seen_at = new Date().toISOString();

    if (this.mode === 'supabase' && this.client) {
      if (this.studentToken) {
        this.cloud(`answer ${student.id}`, () =>
          this.client!.rpc('student_answer', {
            p_token: this.studentToken,
            p_word_id: word.id,
            p_correct: isCorrect,
            p_mode: mode,
            p_elapsed_ms: Math.round(elapsedMs),
          })
        );
      } else {
        this.cloud(`log ${student.id}`, () =>
          this.client!.from('study_logs').insert({
            student_id: student.id,
            word_id: word.id,
            set_id: word.set_id,
            is_correct: isCorrect,
            mode,
            elapsed_ms: Math.round(elapsedMs),
          })
        );
      }
    }
    this.commit();
  }

  private applyWrongNote(studentId: string, wordId: string, isCorrect: boolean) {
    const idx = this.wrongNotes.findIndex((n) => n.student_id === studentId && n.word_id === wordId);
    const today = todayStr();
    if (isCorrect) {
      if (idx < 0) return;
      const note = { ...this.wrongNotes[idx] };
      if (note.cleared_at) return;
      note.box = Math.min(4, note.box + 1);
      if (note.box >= 4) {
        note.cleared_at = new Date().toISOString();
      } else {
        const gap = note.box === 1 ? 1 : note.box === 2 ? 2 : note.box === 3 ? 4 : 7;
        note.due_date = addDays(today, gap);
      }
      this.wrongNotes = this.wrongNotes.map((n, i) => (i === idx ? note : n));
      this.cloudWrongNote(note);
    } else {
      if (idx >= 0) {
        const note = {
          ...this.wrongNotes[idx],
          box: 0,
          due_date: addDays(today, 1),
          miss_count: this.wrongNotes[idx].miss_count + 1,
          cleared_at: null,
        };
        this.wrongNotes = this.wrongNotes.map((n, i) => (i === idx ? note : n));
        this.cloudWrongNote(note);
      } else {
        const note: WrongNote = {
          id: uid('wn'),
          student_id: studentId,
          word_id: wordId,
          box: 0,
          due_date: addDays(today, 1),
          miss_count: 1,
          cleared_at: null,
        };
        this.wrongNotes = [...this.wrongNotes, note];
        this.cloudWrongNote(note);
      }
    }
  }

  private cloudWrongNote(note: WrongNote) {
    if (this.mode !== 'supabase' || !this.client) return;
    // 학생 모드에서는 student_answer RPC가 서버에서 오답 노트를 갱신합니다.
    if (this.studentToken) return;
    this.cloud(`wrong note ${note.id}`, () =>
      this.client!
        .from('wrong_notes')
        .upsert(
          {
            student_id: note.student_id,
            word_id: note.word_id,
            box: note.box,
            due_date: note.due_date,
            miss_count: note.miss_count,
            cleared_at: note.cleared_at,
          },
          { onConflict: 'student_id,word_id' }
        )
    );
  }

  wrongNotesFor(studentId: string): WrongNote[] {
    return this.wrongNotes
      .filter((n) => n.student_id === studentId && !n.cleared_at)
      .slice()
      .sort((a, b) => a.due_date.localeCompare(b.due_date) || b.miss_count - a.miss_count);
  }

  allWrongNotes(): WrongNote[] {
    return this.wrongNotes;
  }

  /* --------------------------------- 진행률 --------------------------------- */

  progressFor(studentId: string): DailyProgress[] {
    return this.progress.filter((p) => p.student_id === studentId);
  }

  getProgress(studentId: string, date = todayStr()): DailyProgress | undefined {
    return this.progress.find((p) => p.student_id === studentId && p.date === date);
  }

  startMission(studentId: string, target: number) {
    const date = todayStr();
    const idx = this.progress.findIndex((p) => p.student_id === studentId && p.date === date);
    if (idx >= 0) {
      const cur = this.progress[idx];
      const updated = { ...cur, target: Math.max(cur.target, target) };
      this.progress = this.progress.map((p, i) => (i === idx ? updated : p));
    } else {
      this.progress = [...this.progress, { student_id: studentId, date, target, answered: 0 }];
    }
    this.persistLocal();
    this.emit();
  }

  private bumpProgress(studentId: string, delta: number) {
    const date = todayStr();
    const idx = this.progress.findIndex((p) => p.student_id === studentId && p.date === date);
    if (idx >= 0) {
      const updated = { ...this.progress[idx], answered: this.progress[idx].answered + delta };
      this.progress = this.progress.map((p, i) => (i === idx ? updated : p));
    } else {
      this.progress = [...this.progress, { student_id: studentId, date, target: 1, answered: delta }];
    }
  }

  isCompletedToday(studentId: string): boolean {
    const p = this.getProgress(studentId);
    return !!p && p.target > 0 && p.answered >= Math.ceil(p.target * 0.8);
  }

  /* --------------------------------- 리포트 --------------------------------- */

  listReports(): WeeklyReport[] {
    return this.reports.slice().sort((a, b) => b.week_start.localeCompare(a.week_start));
  }

  saveReport(report: Omit<WeeklyReport, 'id'>) {
    const existing = this.reports.find(
      (r) => r.student_id === report.student_id && r.week_start === report.week_start
    );
    const row: WeeklyReport = {
      ...report,
      id: existing?.id ?? uid('rep'),
      opened_at: existing?.opened_at ?? report.opened_at ?? null,
    };
    this.reports = existing
      ? this.reports.map((r) => (r.id === row.id ? { ...r, ...row } : r))
      : [...this.reports, row];
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`report ${row.student_id}`, () =>
        this.client!
          .from('weekly_reports')
          .upsert(
            {
              student_id: row.student_id,
              week_start: row.week_start,
              words_done: row.words_done,
              accuracy: row.accuracy,
              streak_days: row.streak_days,
              message: row.message,
              opened_at: row.opened_at,
            },
            { onConflict: 'student_id,week_start' }
          )
      );
    }
    this.commit();
  }

  markReportOpened(token: string) {
    const st = this.students.find((s) => s.parent_token === token);
    if (!st) return;
    const latest = this.listReports().find((r) => r.student_id === st.id);
    if (!latest || latest.opened_at) return;
    latest.opened_at = new Date().toISOString();
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`report opened ${st.id}`, () =>
        this.client!
          .from('weekly_reports')
          .update({ opened_at: latest.opened_at })
          .eq('student_id', st.id)
          .eq('week_start', latest.week_start)
      );
    }
    this.commit();
  }

  studentByToken(token: string): Student | undefined {
    return this.students.find((s) => s.parent_token === token);
  }

  /* ----------------------------- 캐시 예산 · 지갑 ----------------------------- */

  /** 학생 1인 하루 적립 상한(원) */
  cashDailyLimit(): number {
    const v = this.settings?.cash_daily_limit;
    return typeof v === 'number' && Number.isFinite(v) ? v : DEFAULT_CASH_DAILY_LIMIT;
  }

  setCashDailyLimit(limit: number) {
    const safe = Math.max(0, Math.min(100000, Math.round(limit || 0)));
    this.settings = { ...this.settings, cash_daily_limit: safe };
    if (this.mode === 'supabase' && this.client) {
      this.cloud('app_settings cash_daily_limit', () =>
        this.client!
          .from('app_settings')
          .upsert({ key: 'cash_daily_limit', value: { value: safe } }, { onConflict: 'key' })
      );
    }
    this.commit();
  }

  /** 지갑을 보장하고, 날짜가 바뀌었으면 오늘 적립을 0으로 되돌립니다 */
  walletOf(studentId: string): CashWallet {
    const today = todayStr();
    const found = this.wallets.find((w) => w.student_id === studentId);
    if (!found) {
      const created: CashWallet = {
        student_id: studentId,
        cash_balance: 0,
        daily_cash_earned: 0,
        earned_date: today,
        updated_at: new Date().toISOString(),
      };
      this.wallets = [...this.wallets, created];
      return created;
    }
    if (found.earned_date !== today) {
      const rolled: CashWallet = { ...found, daily_cash_earned: 0, earned_date: today };
      this.replaceWallet(rolled);
      return rolled;
    }
    return found;
  }

  private replaceWallet(next: CashWallet) {
    this.wallets = this.wallets.map((w) => (w.student_id === next.student_id ? next : w));
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`wallet ${next.student_id}`, () =>
        this.client!
          .from('cash_wallets')
          .upsert(
            {
              student_id: next.student_id,
              cash_balance: next.cash_balance,
              daily_cash_earned: next.daily_cash_earned,
              earned_date: next.earned_date,
            },
            { onConflict: 'student_id' }
          )
      );
    }
  }

  cashBalance(studentId: string): number {
    return this.walletOf(studentId).cash_balance;
  }

  todayCashEarned(studentId: string): number {
    return this.walletOf(studentId).daily_cash_earned;
  }

  /** 오늘 더 모을 수 있는 금액 */
  remainingDailyCash(studentId: string): number {
    return Math.max(0, this.cashDailyLimit() - this.todayCashEarned(studentId));
  }

  /** 게임 보상 지급 — 하루 상한을 넘지 않도록 잘라서 실제 지급액을 돌려줍니다 */
  grantCash(studentId: string, amount: number): number {
    const wallet = this.walletOf(studentId);
    const pay = Math.max(0, Math.min(Math.round(amount), this.cashDailyLimit() - wallet.daily_cash_earned));
    if (pay <= 0) return 0;
    this.replaceWallet({
      ...wallet,
      cash_balance: wallet.cash_balance + pay,
      daily_cash_earned: wallet.daily_cash_earned + pay,
      updated_at: new Date().toISOString(),
    });
    this.commit();
    return pay;
  }

  /** 잔액이 모자라면 false (교환 신청용 차감) */
  private deductCash(studentId: string, amount: number): boolean {
    const wallet = this.walletOf(studentId);
    if (wallet.cash_balance < amount) return false;
    this.replaceWallet({
      ...wallet,
      cash_balance: wallet.cash_balance - amount,
      updated_at: new Date().toISOString(),
    });
    return true;
  }

  /** 관리자 화면 — 학생별 잔액·오늘 적립 현황 */
  cashOverview(): { student: Student; balance: number; earnedToday: number }[] {
    return this.listStudents(true).map((student) => ({
      student,
      balance: this.cashBalance(student.id),
      earnedToday: this.todayCashEarned(student.id),
    }));
  }

  /* -------------------------------- 짝짓기 게임 -------------------------------- */

  recordGameSession(
    studentId: string,
    input: {
      pairs: number;
      attempts: number;
      durationMs: number;
      cashEarned: number;
      wrongWordIds: string[];
      game?: GameSession['game'];
      score?: number;
      total?: number;
    }
  ): GameSession {
    const session: GameSession = {
      id: uid('gs'),
      student_id: studentId,
      pairs: input.pairs,
      attempts: input.attempts,
      duration_ms: Math.max(0, Math.round(input.durationMs)),
      cash_earned: input.cashEarned,
      wrong_word_ids: input.wrongWordIds,
      played_at: new Date().toISOString(),
      game: input.game ?? 'match',
      score: input.score,
      total: input.total,
    };
    this.games = [session, ...this.games].slice(0, 500);
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`game ${studentId}`, () =>
        this.client!.from('game_sessions').insert({
          student_id: studentId,
          pairs: session.pairs,
          attempts: session.attempts,
          duration_ms: session.duration_ms,
          cash_earned: session.cash_earned,
          wrong_word_ids: session.wrong_word_ids,
        })
      );
    }
    this.commit();
    return session;
  }

  gameSessionsFor(studentId: string, limit = 10): GameSession[] {
    return this.games.filter((g) => g.student_id === studentId).slice(0, limit);
  }

  /* --------------------------------- 기프티콘 상점 --------------------------------- */

  listShopItems(includeInactive = false): ShopItem[] {
    return this.shopItems
      .filter((i) => includeInactive || i.active)
      .slice()
      .sort((a, b) => a.sort_no - b.sort_no || a.price - b.price || a.name.localeCompare(b.name, 'ko'));
  }

  addShopItem(input: { name: string; price: number; emoji?: string }): ShopItem {
    const name = input.name.trim();
    if (!name) throw new Error('상품명을 입력해 주세요');
    const price = Math.max(0, Math.round(input.price || 0));
    if (price <= 0) throw new Error('가격은 1원 이상이어야 해요');
    const item: ShopItem = {
      id: uid('item'),
      name,
      price,
      emoji: (input.emoji ?? '').trim() || '🎁',
      active: true,
      sort_no: Math.max(0, ...this.shopItems.map((i) => i.sort_no)) + 1,
      created_at: new Date().toISOString(),
    };
    this.shopItems = [...this.shopItems, item];
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`shop item add ${item.id}`, () =>
        this.client!.from('shop_items').insert({
          name: item.name,
          price: item.price,
          emoji: item.emoji,
          active: item.active,
          sort_no: item.sort_no,
        })
      );
    }
    this.commit();
    return item;
  }

  updateShopItem(id: string, patch: Partial<Pick<ShopItem, 'name' | 'price' | 'emoji' | 'active'>>) {
    const item = this.shopItems.find((i) => i.id === id);
    if (!item) return;
    const name = patch.name !== undefined ? patch.name.trim() || item.name : item.name;
    const price = patch.price !== undefined ? Math.max(0, Math.round(patch.price)) : item.price;
    const next: ShopItem = {
      ...item,
      name,
      price,
      emoji: patch.emoji !== undefined ? patch.emoji.trim() || item.emoji : item.emoji,
      active: patch.active !== undefined ? patch.active : item.active,
    };
    this.shopItems = this.shopItems.map((i) => (i.id === id ? next : i));
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`shop item update ${id}`, () =>
        this.client!
          .from('shop_items')
          .update({ name: next.name, price: next.price, emoji: next.emoji, active: next.active, sort_no: next.sort_no })
          .eq('id', id)
      );
    }
    this.commit();
  }

  /** 상품 삭제 — 이미 신청된 내역은 당시 이름·금액 스냅샷으로 그대로 남습니다 */
  deleteShopItem(id: string) {
    this.shopItems = this.shopItems.filter((i) => i.id !== id);
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`shop item delete ${id}`, () => this.client!.from('shop_items').delete().eq('id', id));
    }
    this.commit();
  }

  listRedemptions(studentId?: string): RedemptionRequest[] {
    return this.redemptions
      .filter((r) => !studentId || r.student_id === studentId)
      .slice()
      .sort((a, b) => b.requested_at.localeCompare(a.requested_at));
  }

  pendingRedemptions(): RedemptionRequest[] {
    return this.listRedemptions().filter((r) => r.status === 'pending');
  }

  /** 교환 신청: 캐시를 즉시 차감하고 ’신청 대기’로 기록합니다 */
  requestRedemption(studentId: string, itemId: string): RedemptionRequest {
    const item = this.shopItems.find((i) => i.id === itemId && i.active);
    if (!item) throw new Error('상품을 찾을 수 없어요');
    if (!this.deductCash(studentId, item.price)) throw new Error('캐시가 부족해요');
    const req: RedemptionRequest = {
      id: uid('rdm'),
      student_id: studentId,
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      status: 'pending',
      requested_at: new Date().toISOString(),
      handled_at: null,
    };
    this.redemptions = [req, ...this.redemptions];
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`redemption ${req.id}`, () =>
        this.client!.from('redemption_requests').insert({
          student_id: studentId,
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          status: 'pending',
        })
      );
    }
    this.commit();
    return req;
  }

  markRedemptionSent(id: string) {
    const req = this.redemptions.find((r) => r.id === id);
    if (!req || req.status !== 'pending') return;
    const next: RedemptionRequest = { ...req, status: 'sent', handled_at: new Date().toISOString() };
    this.redemptions = this.redemptions.map((r) => (r.id === id ? next : r));
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`redemption sent ${id}`, () =>
        this.client!.from('redemption_requests').update({ status: 'sent', handled_at: next.handled_at }).eq('id', id)
      );
    }
    this.commit();
  }

  /** 취소 + 캐시 환불 (이미 발송한 건은 되돌리지 않습니다) */
  cancelRedemption(id: string) {
    const req = this.redemptions.find((r) => r.id === id);
    if (!req || req.status !== 'pending') return;
    const wallet = this.walletOf(req.student_id);
    this.replaceWallet({
      ...wallet,
      cash_balance: wallet.cash_balance + req.price,
      updated_at: new Date().toISOString(),
    });
    const next: RedemptionRequest = { ...req, status: 'canceled', handled_at: new Date().toISOString() };
    this.redemptions = this.redemptions.map((r) => (r.id === id ? next : r));
    if (this.mode === 'supabase' && this.client) {
      this.cloud(`redemption cancel ${id}`, () =>
        this.client!.from('redemption_requests').update({ status: 'canceled', handled_at: next.handled_at }).eq('id', id)
      );
    }
    this.commit();
  }

  /* ------------------------------- 관리자 인증 ------------------------------- */

  verifyAdminPin(pin: string): boolean {
    return this.mode === 'local' && pin === SEED_ADMIN_PIN;
  }

  /** 학생 로그아웃 — 기기에 남긴 토큰도 함께 지웁니다(다른 학생 화면에 이어지지 않게) */
  clearStudentToken() {
    this.studentToken = null;
    saveStudentToken(null);
  }

  async adminSignIn(email: string, password: string): Promise<boolean> {
    if (!this.client || this.mode !== 'supabase') return email.trim() !== '' && password !== '' && this.verifyAdminPin(password);
    this.clearStudentToken();
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    this.adminEmail = data.user?.email ?? null;
    this.adminAuth = data.session ? 'signed-in' : 'signed-out';
    if (data.session) saveSession(data.session);
    await this.loadCloud();
    this.emit();
    return true;
  }

  /** 진단용 상태 요약 (?debug=1 에서만 화면에 보입니다 — 개인정보·토큰은 담지 않습니다) */
  async debugSnapshot(): Promise<Record<string, unknown>> {
    let gotrueEmail: string | null = null;
    let gotrueError: string | null = null;
    if (this.client) {
      try {
        const { data, error } = await this.client.auth.getSession();
        gotrueEmail = data.session?.user?.email ?? null;
        gotrueError = error?.message ?? null;
      } catch (err) {
        gotrueError = err instanceof Error ? err.message : String(err);
      }
    }
    return {
      mode: this.mode,
      hasClient: Boolean(this.client),
      adminEmail: this.adminEmail,
      adminAuth: this.adminAuth,
      gotrueEmail,
      gotrueError,
      savedSession: Boolean(readSavedSession()),
      lastCloudError: this.lastCloudError,
      students: this.students.length,
    };
  }

  async adminSignOut() {
    if (this.mode === 'supabase' && this.client) {
      await this.client.auth.signOut();
      this.adminEmail = null;
      this.adminAuth = 'signed-out';
      clearSavedSession();
    }
  }

  /**
   * 원장 화면에서 ‘다시 시도’ — 세션이 살아 있는지 확인하고 데이터를 다시 읽습니다.
   * 세션이 끊겼으면 adminAuth 가 'signed-out' 으로 남아 화면이 재로그인을 안내합니다.
   */
  async retryCloud(): Promise<{ ok: boolean; error: string | null }> {
    if (!this.client || this.mode !== 'supabase') return { ok: false, error: '서버 연결이 없어요' };
    try {
      const { data } = await this.client.auth.getSession();
      this.adminEmail = data.session?.user?.email ?? null;
      this.adminAuth = data.session?.user ? 'signed-in' : 'signed-out';
      if (!data.session?.user) {
        this.lastCloudError = '로그인 세션이 만료됐어요';
        this.emit();
        return { ok: false, error: this.lastCloudError };
      }
      await this.loadCloud();
      this.lastCloudError = null;
      this.emit();
      return { ok: true, error: null };
    } catch (err) {
      this.lastCloudError = err instanceof Error ? err.message : String(err);
      this.emit();
      return { ok: false, error: this.lastCloudError };
    }
  }

  /* --------------------------------- 백업/CSV -------------------------------- */

  backupStudentsCsv(): string {
    const header = 'name,grade,class_name,level,tosel_level,nickname,parent_token,active,created_at';
    const rows = this.students.map((s) =>
      [s.name, s.grade, s.class_name, s.level, s.tosel_level, s.nickname, s.parent_token, s.active ? 'Y' : 'N', s.created_at]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    return '\uFEFF' + [header, ...rows].join('\n');
  }

  wordsCsv(level: Level): string {
    const header = 'word,meaning,pos,example,example_ko,order_no';
    const rows = this.wordsForLevel(level).map((w) =>
      [w.word, w.meaning, w.pos, w.example, w.example_ko, w.order_no]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    return '\uFEFF' + [header, ...rows].join('\n');
  }

  /* --------------------------------- Supabase -------------------------------- */

  private async loadCloud() {
    if (!this.client) return;
    const c = this.client;
    const [students, sets, words, asgs, logs, notes, reports, hist] = await Promise.all([
      c.from('students').select('*'),
      c.from('word_sets').select('*'),
      c.from('words').select('*'),
      c.from('assignments').select('*'),
      c.from('study_logs').select('*').order('answered_at', { ascending: false }).limit(5000),
      c.from('wrong_notes').select('*'),
      c.from('weekly_reports').select('*'),
      c.from('level_history').select('*').limit(500),
    ]);
    const firstError = [students, sets, words, asgs, logs, notes, reports, hist].find((r) => r.error);
    if (firstError?.error) throw firstError.error;
    this.lastCloudError = null;

    this.students = (students.data ?? []) as any;
    this.sets = (sets.data ?? []) as any;
    this.words = (words.data ?? []) as any;
    this.assignments = (asgs.data ?? []) as any;
    this.logs = ((logs.data ?? []) as any).map((l: any) => ({ ...l, id: String(l.id) }));
    this.wrongNotes = (notes.data ?? []) as any;
    this.reports = (reports.data ?? []) as any;
    this.history = (hist.data ?? []) as any;

    // 캐시·상점 테이블은 스키마 적용 전 환경에서도 앱이 떨어지지 않도록 따로 읽습니다.
    const extras = await Promise.all([
      c.from('cash_wallets').select('*'),
      c.from('shop_items').select('*'),
      c.from('redemption_requests').select('*'),
      c.from('game_sessions').select('*').order('played_at', { ascending: false }).limit(300),
      c.from('app_settings').select('*'),
    ]);
    const [wallets, items, reds, games, settings] = extras;
    if (!wallets.error && wallets.data) this.wallets = wallets.data as any;
    if (!items.error && items.data) this.shopItems = items.data as any;
    if (!reds.error && reds.data) this.redemptions = reds.data as any;
    if (!games.error && games.data) this.games = games.data as any;
    if (!settings.error && settings.data) {
      const row = (settings.data as any[]).find((r) => r.key === 'cash_daily_limit');
      const limit = row?.value?.value ?? row?.value;
      if (typeof limit === 'number') this.settings = { cash_daily_limit: limit };
    }
  }

  private watchCloud() {
    if (!this.client) return;
    const c = this.client;
    c.channel('voca-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_logs' }, async () => {
        await this.loadCloud();
        this.emit();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wrong_notes' }, async () => {
        await this.loadCloud();
        this.emit();
      })
      .subscribe();
  }

  private cloud(label: string, run: () => PromiseLike<any>) {
    if (!this.client) return;
    Promise.resolve(run()).then(
      (res: any) => {
        if (res?.error && this.cloudWarnings < 5) {
          this.cloudWarnings += 1;
          console.warn(`[voca] Supabase 쓰기 실패 (${label})`, res.error);
        }
      },
      (err) => {
        if (this.cloudWarnings < 5) {
          this.cloudWarnings += 1;
          console.warn(`[voca] Supabase 쓰기 실패 (${label})`, err);
        }
      }
    );
  }

  /** 데모 데이터를 처음 상태로 되돌립니다 (로컬 모드 전용) */
  resetDemo() {
    if (this.mode !== 'local') return;
    localStorage.removeItem(LS_KEY);
    this.students = [];
    this.sets = [];
    this.words = [];
    this.assignments = [];
    this.logs = [];
    this.wrongNotes = [];
    this.progress = [];
    this.reports = [];
    this.history = [];
    this.wallets = [];
    this.shopItems = [];
    this.redemptions = [];
    this.games = [];
    this.codingLogs = [];
    this.codingWrongNotes = [];
    this.codingSessions = [];
    this.settings = { cash_daily_limit: DEFAULT_CASH_DAILY_LIMIT };
    this.seedLocal();
    this.emit();
  }
}

export const store = new VocaStore();
