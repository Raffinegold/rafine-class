export type Level = 1 | 2 | 3 | 4 | 5;

export interface Student {
  id: string;
  name: string;
  class_name: string;
  grade: number;
  level: Level;
  tosel_level: string;
  pin: string;
  nickname: string;
  parent_token: string;
  active: boolean;
  created_at: string;
  last_seen_at?: string | null;
  /** 코딩 커리큘럼 레벨 (C1~C4) */
  coding_level: CodingLevel;
  /** 원장님이 열어 준 수강 과목 — 이 중에서만 학생 화면 탭이 보입니다 */
  enabled_subjects: Subject[];
}

export interface WordSet {
  id: string;
  name: string;
  level: Level;
  day_index: number;
  active: boolean;
  created_at?: string;
}

export interface Word {
  id: string;
  set_id: string;
  word: string;
  meaning: string;
  pos: string;
  ipa?: string;
  example: string;
  example_ko: string;
  order_no: number;
}

export interface Assignment {
  id: string;
  student_id: string;
  set_id: string;
  assigned_on: string;
}

export type StudyMode = 'card' | 'choice' | 'spell';

export interface StudyLog {
  id: string;
  student_id: string;
  word_id: string;
  set_id: string;
  is_correct: boolean;
  mode: StudyMode;
  elapsed_ms: number;
  answered_at: string;
}

export interface WrongNote {
  id: string;
  student_id: string;
  word_id: string;
  box: number;
  due_date: string;
  miss_count: number;
  cleared_at: string | null;
}

export interface WeeklyReport {
  id: string;
  student_id: string;
  week_start: string;
  words_done: number;
  accuracy: number;
  streak_days: number;
  message: string;
  opened_at: string | null;
}

export interface DailyProgress {
  student_id: string;
  date: string;
  target: number;
  answered: number;
}

export interface LevelHistory {
  id: string;
  student_id: string;
  from_level: Level | null;
  to_level: Level;
  tosel_level: string;
  changed_at: string;
}

export type ToselLevel = 'Pre-Starter' | 'Starter' | 'Basic' | 'Junior' | 'High Junior';

export const LEVEL_META: Record<Level, { label: string; grades: string; tosel: ToselLevel; dailyNew: number; dailyReview: number; cumulative: number; quiz: string }> = {
  1: { label: 'Level 1', grades: '초1~2', tosel: 'Pre-Starter', dailyNew: 8, dailyReview: 4, cumulative: 300, quiz: '뜻 4지선다 → 알파벳 타일' },
  2: { label: 'Level 2', grades: '초3~4', tosel: 'Starter', dailyNew: 10, dailyReview: 5, cumulative: 600, quiz: '뜻→단어 4지선다, 철자 빈칸' },
  3: { label: 'Level 3', grades: '초5~6', tosel: 'Basic', dailyNew: 12, dailyReview: 6, cumulative: 1000, quiz: '4지선다 + 직접 입력(오타 1자 허용)' },
  4: { label: 'Level 4', grades: '중1~3', tosel: 'Junior', dailyNew: 15, dailyReview: 7, cumulative: 1800, quiz: '예문 빈칸, 4지선다' },
  5: { label: 'Level 5', grades: '고1~2', tosel: 'High Junior', dailyNew: 20, dailyReview: 10, cumulative: 3000, quiz: '문맥 빈칸, 유의어 고르기' },
};

export const TOSEL_TO_LEVEL: Record<ToselLevel, Level> = {
  'Pre-Starter': 1,
  Starter: 2,
  Basic: 3,
  Junior: 4,
  'High Junior': 5,
};

export const LEVEL_TO_TOSEL: Record<Level, ToselLevel> = {
  1: 'Pre-Starter',
  2: 'Starter',
  3: 'Basic',
  4: 'Junior',
  5: 'High Junior',
};

/* ------------------------------ 캐시 / 상점 / 게임 ------------------------------ */

/** 학생 캐시 지갑 — 하루 적립 상한(daily_cash_earned)과 잔액(cash_balance)을 함께 보관 */
export interface CashWallet {
  student_id: string;
  /** 보유 캐시(원) */
  cash_balance: number;
  /** earned_date 하루 동안 적립한 금액 */
  daily_cash_earned: number;
  /** daily_cash_earned 의 기준일 (YYYY-MM-DD) */
  earned_date: string;
  updated_at: string;
}

/** 영어 게임 5종 */
export type EnglishGameKey = 'match' | 'rain' | 'boss' | 'listen' | 'blank';

/** 짝맞추기 게임 1판 기록 (다른 영어 게임도 같은 기록에 game 으로 구분해 남깁니다) */
export interface GameSession {
  id: string;
  student_id: string;
  /** 6 또는 8 (쌍 수) — 다른 게임은 라운드 수 */
  pairs: number;
  attempts: number;
  duration_ms: number;
  cash_earned: number;
  wrong_word_ids: string[];
  played_at: string;
  /** 게임 종류 (없으면 예전 짝맞추기 기록) */
  game?: EnglishGameKey;
  /** 맞힌 수 / 전체 */
  score?: number;
  total?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  active: boolean;
  sort_no: number;
  created_at: string;
}

export type RedemptionStatus = 'pending' | 'sent' | 'canceled';

/** 기프티콘 교환 신청 */
export interface RedemptionRequest {
  id: string;
  student_id: string;
  item_id: string;
  /** 신청 당시 상품명·가격 스냅샷 (상품이 삭제·수정되어도 내역은 유지) */
  item_name: string;
  price: number;
  status: RedemptionStatus;
  requested_at: string;
  handled_at: string | null;
}

/** 앱 전역 설정 (관리자 화면에서 수정) */
export interface AppSettings {
  /** 학생 1인 하루 캐시 적립 상한 (기본 50원) */
  cash_daily_limit: number;
}

export interface Session {
  role: 'student' | 'admin';
  studentId?: string;
  name?: string;
}

/* ------------------------------ 과목 · 코딩 커리큘럼 ------------------------------ */

/** 학생이 수강하는 과목. 영어·코딩 둘 다 켜면 상단 전환 스위치가 보입니다. */
export type Subject = 'english' | 'coding';

export const SUBJECT_META: Record<Subject, { label: string; icon: string; short: string }> = {
  english: { label: '영어', icon: '📚', short: '영어' },
  coding: { label: '코딩', icon: '💻', short: '코딩' },
};

export type CodingLevel = 'C1' | 'C2' | 'C3' | 'C4';

export const CODING_LEVELS: CodingLevel[] = ['C1', 'C2', 'C3', 'C4'];

export const CODING_LEVEL_META: Record<
  CodingLevel,
  { label: string; short: string; grades: string; desc: string; badge: string }
> = {
  C1: {
    label: 'C1 블록·기초',
    short: 'C1',
    grades: '초1~3',
    desc: '스크래치 · 순서도 논리',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  C2: {
    label: 'C2 파이썬 기초',
    short: 'C2',
    grades: '초4~6',
    desc: '변수 · if · for · 리스트 · 문자열',
    badge: 'bg-sky-100 text-sky-700',
  },
  C3: {
    label: 'C3 C언어',
    short: 'C3',
    grades: '중1~3',
    desc: 'printf/scanf · 중첩 for · 배열 · 조건문',
    badge: 'bg-brand-100 text-brand-700',
  },
  C4: {
    label: 'C4 유니티 C#',
    short: 'C4',
    grades: '중등~고',
    desc: 'Start/Update · Vector3 · GetComponent · 충돌',
    badge: 'bg-violet-100 text-violet-700',
  },
};

/** 코딩 문제 종류 — output/blank 는 오늘 미션, bug/order 는 게임, 네 가지 모두 게임에 쓰입니다 */
export type CodingKind = 'output' | 'blank' | 'bug' | 'order';

export const CODING_KIND_META: Record<CodingKind, { label: string; icon: string }> = {
  output: { label: '출력 맞히기', icon: '🖨️' },
  blank: { label: '빈칸 채우기', icon: '✏️' },
  bug: { label: '버그 찾기', icon: '🐛' },
  order: { label: '블록 순서', icon: '🧩' },
};

export interface CodingProblem {
  id: string;
  level: CodingLevel;
  kind: CodingKind;
  /** 변수 · for · 배열 · Transform 등 소주제 */
  topic: string;
  prompt: string;
  /** output · blank : 화면에 보여 줄 코드 (blank 는 ____ 포함) */
  code?: string;
  /** bug : 줄 단위 코드. answerLine 번째 줄이 오류 */
  lines?: string[];
  /** order : 정답 순서대로 나열한 블록 (게임에서 섞어 보여 줌) */
  blocks?: string[];
  /** output · blank : 선택지 */
  choices?: string[];
  /** output · blank : 정답 선택지 index */
  answer?: number;
  /** bug : 오류가 있는 줄 index (0부터) */
  answerLine?: number;
  explanation: string;
}

/** 코딩 문항 풀이 로그 */
export interface CodingLog {
  id: string;
  student_id: string;
  problem_id: string;
  level: CodingLevel;
  kind: CodingKind;
  is_correct: boolean;
  /** mission | game | review */
  mode: 'mission' | 'game' | 'review';
  answered_at: string;
}

/** 코딩 오답 노트 — 문제 단위로 틀린 횟수를 쌓고, 다시 맞히면 졸업 */
export interface CodingWrongNote {
  student_id: string;
  problem_id: string;
  level: CodingLevel;
  miss_count: number;
  last_wrong_at: string;
  cleared_at: string | null;
}

/** 코딩 게임 5종 — 로봇·키워드 디펜스·디버깅 보스·유니티 좌표·해커 */
export type CodingGameKey = 'robot' | 'rain' | 'debug' | 'unity' | 'hacker';

/** 예전 3종 게임 기록 호환 (기록 화면에서만 쓰입니다) */
export type LegacyCodingGameKey = 'bug' | 'order' | 'speed';

export type AnyCodingGameKey = CodingGameKey | LegacyCodingGameKey;

/** 코딩 게임 1판 기록 */
export interface CodingSession {
  id: string;
  student_id: string;
  game: AnyCodingGameKey;
  score: number;
  total: number;
  cash_earned: number;
  wrong_problem_ids: string[];
  played_at: string;
}

/* ==========================================================================
 *  참고 자료실 (2026-11-20)
 *  - 교사용 필드(teacher_guide·answer_code)는 학생 화면에 절대 내려가지 않습니다.
 * ========================================================================== */

export type MaterialKind = 'theory' | 'code' | 'image' | 'link' | 'upgrade';

export interface MaterialConceptRow {
  code: string;
  mean: string;
}

export interface MaterialStep {
  title: string;
  code?: string;
  note?: string;
}

export interface MaterialMission {
  basic: string;
  challenge: string;
  deep: string;
}

/** 학생 화면에 그대로 그리는 내용 — 정답·교사용 수업안은 여기에 없습니다 */
export interface MaterialStudentContent {
  goal?: string;
  preview?: string;
  words?: string[];
  conceptTitle?: string;
  concept?: MaterialConceptRow[];
  predict?: { code: string; answer: string };
  steps?: MaterialStep[];
  mistakes?: { symptom: string; cause: string }[];
  hints?: string[];
  missions?: MaterialMission;
  selfcheck?: string[];
  note?: string;
}

/** 새 선생님이 수업 전에 읽는 강의안 (원장·교사 전용) */
export interface MaterialTeacherGuide {
  demo?: string;
  analogy?: string;
  board?: { say: string; write: string }[];
  ai?: { when: string; what: string; prompt?: string; rule?: string }[];
  errors?: { symptom: string; cause: string; coach: string }[];
  tips?: string[];
}

export interface Material {
  id: string;
  kind: MaterialKind;
  title: string;
  track: string | null;
  week: number | null;
  session: 1 | 2 | null;
  class_name?: string | null;
  summary?: string | null;
  student_content: MaterialStudentContent;
  teacher_guide?: MaterialTeacherGuide | null;
  answer_code?: string | null;
  ai_tip?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  code_lang?: string | null;
  published: boolean;
  sort_no: number;
  opened_at?: string | null;
  done_at?: string | null;
}

export interface MaterialAssignment {
  student_id: string;
  track: string | null;
  week: number | null;
  session: 1 | 2 | null;
  memo?: string | null;
  updated_at?: string;
}
