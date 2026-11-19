import { CODING_PROBLEMS, problemById, problemsOfKind } from '../data/codingSeed';
import type { AnyCodingGameKey, CodingGameKey, CodingLevel, CodingProblem, Student } from '../types';
import { CODING_LEVELS } from '../types';
import { store } from './store';
import { mulberry32, shuffle, todayStr } from './util';

/** 오늘의 코딩 미션 — 오답 복습(최대 2) + 출력/빈칸 문제로 5문제 */
export const CODING_MISSION_SIZE = 5;

/** 오늘 미션에 쓸 수 있는 종류 (선택지가 있는 문제만) */
const MISSION_KINDS: CodingProblem['kind'][] = ['output', 'blank'];

export interface CodingMissionItem {
  problem: CodingProblem;
  kind: 'review' | 'new';
}

export interface CodingMission {
  items: CodingMissionItem[];
  reviewCount: number;
  target: number;
  level: CodingLevel;
}

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function levelDistance(a: CodingLevel, b: CodingLevel): number {
  return Math.abs(CODING_LEVELS.indexOf(a) - CODING_LEVELS.indexOf(b));
}

/** 학생 레벨 → 가까운 레벨 순서 (같은 레벨 문제가 모자랄 때 채웁니다) */
function levelsByProximity(level: CodingLevel): CodingLevel[] {
  return [...CODING_LEVELS].sort((a, b) => levelDistance(level, a) - levelDistance(level, b));
}

/** 레벨별 문제를 가까운 레벨 순서로 모아 최대 count 개 (중복 없이) */
function collect(kind: CodingProblem['kind'], level: CodingLevel, count: number): CodingProblem[] {
  const out: CodingProblem[] = [];
  for (const lv of levelsByProximity(level)) {
    for (const p of shuffle(problemsOfKind(lv, kind))) {
      if (out.length >= count) break;
      if (!out.some((x) => x.id === p.id)) out.push(p);
    }
    if (out.length >= count) break;
  }
  return out;
}

/** 하루 한 번, 학생·날짜로 고정되는 오늘의 코딩 미션 (새로고침해도 같은 문제) */
export function buildCodingMission(student: Student, date = todayStr()): CodingMission {
  const level = student.coding_level ?? 'C1';
  const rand = mulberry32(hashSeed(`${student.id}:${date}:coding`));

  const wrongIds = store
    .codingWrongNotesFor(student.id)
    .filter((n) => problemById(n.problem_id)?.level === level)
    .map((n) => n.problem_id);
  const review = wrongIds
    .map((id) => problemById(id))
    .filter((p): p is CodingProblem => !!p && MISSION_KINDS.includes(p.kind))
    .slice(0, 2);

  const pools = [...shuffle(problemsOfKind(level, 'output'), rand), ...shuffle(problemsOfKind(level, 'blank'), rand)];
  const picked: CodingProblem[] = [...review];
  for (const p of pools) {
    if (picked.length >= CODING_MISSION_SIZE) break;
    if (picked.some((x) => x.id === p.id)) continue;
    picked.push(p);
  }
  // 출력·빈칸이 모자라면 다른 종류로 채웁니다 (C4처럼 문제 수가 적은 레벨 대비)
  if (picked.length < CODING_MISSION_SIZE) {
    for (const p of collect('output', level, CODING_MISSION_SIZE * 2)) {
      if (picked.length >= CODING_MISSION_SIZE) break;
      if (picked.some((x) => x.id === p.id)) continue;
      picked.push(p);
    }
  }

  const items: CodingMissionItem[] = picked.map((p) => ({
    problem: p,
    kind: review.some((r) => r.id === p.id) ? 'review' : 'new',
  }));

  return { items, reviewCount: review.length, target: items.length, level };
}

/** 오답노트 복습 — 틀린 문제만 모아 미션으로 */
export function buildCodingReview(student: Student, limit = 5): CodingMission {
  const notes = store.codingWrongNotesFor(student.id).slice(0, limit);
  const items: CodingMissionItem[] = notes
    .map((n) => problemById(n.problem_id))
    .filter((p): p is CodingProblem => !!p && MISSION_KINDS.includes(p.kind))
    .map((p) => ({ problem: p, kind: 'review' as const }));
  return { items, reviewCount: items.length, target: items.length, level: student.coding_level ?? 'C1' };
}

/** 선택지를 섞고 정답 위치를 다시 계산합니다 (정답은 항상 화면마다 달라짐) */
export function shuffleChoices(problem: CodingProblem): { choices: string[]; answer: number } {
  const choices = problem.choices ?? [];
  const answerText = choices[problem.answer ?? 0];
  const mixed = shuffle(choices);
  return { choices: mixed, answer: Math.max(0, mixed.indexOf(answerText)) };
}

export const CODING_GAME_META: Record<AnyCodingGameKey, { label: string; icon: string; desc: string; rounds: number }> = {
  robot: {
    label: '로봇 길찾기',
    icon: '🤖',
    desc: '5×5 격자에서 명령을 조립해 코인을 먹고 깃발에 골인',
    rounds: 5,
  },
  rain: {
    label: '키워드 디펜스',
    icon: '⌨️',
    desc: '레벨별 핵심 키워드가 운석으로! 타자로 레이저 격추',
    rounds: 10,
  },
  debug: {
    label: '디버깅 보스전',
    icon: '🐞',
    desc: '고장 난 코드 5문제를 고쳐 버그 보스 HP 0으로',
    rounds: 5,
  },
  unity: {
    label: '유니티 좌표 퀴즈',
    icon: '🎮',
    desc: 'Vector3 방향을 골라 캐릭터를 별까지 날려 보내기',
    rounds: 5,
  },
  hacker: {
    label: '해커 침투 미션',
    icon: '🕵️',
    desc: '3단계 방화벽 암호를 풀고 ACCESS GRANTED',
    rounds: 3,
  },
  /* --- 예전 3종 (기록 표시용) --- */
  bug: { label: '버그 찾기', icon: '🐛', desc: '예전 게임 기록', rounds: 5 },
  order: { label: '블록 순서 맞추기', icon: '🧩', desc: '예전 게임 기록', rounds: 4 },
  speed: { label: '출력 스피드 퀴즈', icon: '⚡', desc: '예전 게임 기록', rounds: 6 },
};

/** 지금 플레이할 수 있는 코딩 게임 5종 (순서 고정) */
export const CODING_GAME_LIST: CodingGameKey[] = ['robot', 'rain', 'debug', 'unity', 'hacker'];

/** 레벨별 타자 디펜스 키워드 (짧은 설명과 함께) */
export const CODING_KEYWORDS: Record<CodingLevel, { word: string; hint: string }[]> = {
  C1: [
    { word: 'move', hint: '앞으로 이동' },
    { word: 'turn', hint: '방향 바꾸기' },
    { word: 'repeat', hint: '반복하기' },
    { word: 'if', hint: '만약 ~라면' },
    { word: 'loop', hint: '반복 블록' },
    { word: 'start', hint: '시작하기' },
    { word: 'block', hint: '블록' },
    { word: 'sprite', hint: '주인공' },
    { word: 'jump', hint: '점프' },
    { word: 'flag', hint: '깃발(목표)' },
  ],
  C2: [
    { word: 'print', hint: '화면에 출력' },
    { word: 'input', hint: '입력받기' },
    { word: 'for', hint: '횟수 반복' },
    { word: 'while', hint: '조건 반복' },
    { word: 'list', hint: '리스트' },
    { word: 'len', hint: '길이 구하기' },
    { word: 'def', hint: '함수 정의' },
    { word: 'return', hint: '값 돌려주기' },
    { word: 'import', hint: '모듈 가져오기' },
    { word: 'range', hint: '숫자 범위' },
  ],
  C3: [
    { word: 'printf', hint: '출력 함수' },
    { word: 'scanf', hint: '입력 함수' },
    { word: 'int', hint: '정수형' },
    { word: 'for', hint: '반복문' },
    { word: 'while', hint: '조건 반복' },
    { word: 'array', hint: '배열' },
    { word: 'main', hint: '시작 함수' },
    { word: 'include', hint: '헤더 포함' },
    { word: 'char', hint: '문자형' },
    { word: 'float', hint: '실수형' },
  ],
  C4: [
    { word: 'Vector3', hint: '3D 좌표/방향' },
    { word: 'Transform', hint: '위치·회전·크기' },
    { word: 'Input', hint: '키·터치 입력' },
    { word: 'GetComponent', hint: '컴포넌트 가져오기' },
    { word: 'Start', hint: '처음 한 번' },
    { word: 'Update', hint: '매 프레임' },
    { word: 'Rigidbody', hint: '물리' },
    { word: 'Collider', hint: '충돌체' },
    { word: 'public', hint: '공개 접근' },
    { word: 'void', hint: '반환값 없음' },
  ],
};

/** 게임 한 판에 쓸 문제 목록 */
export function buildGameProblems(game: CodingGameKey, level: CodingLevel): CodingProblem[] {
  const rounds = CODING_GAME_META[game].rounds;
  if (game === 'debug') return collect('bug', level, rounds);
  if (game === 'hacker') return collect('blank', level, rounds);
  if (game === 'unity') return collect('output', level, rounds);
  return [];
}

export function allCodingProblems(): CodingProblem[] {
  return CODING_PROBLEMS;
}
