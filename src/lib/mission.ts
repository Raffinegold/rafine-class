import type { Student, Word } from '../types';
import { LEVEL_META } from '../types';
import { store } from './store';
import { todayStr } from './util';

export interface MissionItem {
  word: Word;
  kind: 'review' | 'new';
}

export interface Mission {
  items: MissionItem[];
  reviewCount: number;
  newCount: number;
  target: number;
  dueReviewTotal: number;
}

/**
 * 오늘의 미션 = (기한 도래 오답, 최대 신규의 50%) + 신규 단어(트랙별 표)
 * 순서는 오답 먼저, 신규 나중.
 */
export function buildMission(student: Student, date = todayStr()): Mission {
  const allWords = store.wordsOfStudent(student);
  const wordMap = new Map(allWords.map((w) => [w.id, w]));
  const meta = LEVEL_META[student.level];

  const dueNotes = store
    .wrongNotesFor(student.id)
    .filter((n) => !n.cleared_at && n.due_date <= date && wordMap.has(n.word_id));

  const gradedLogs = store.logsFor(student.id).filter((l) => l.mode !== 'card');
  const everCorrect = new Set(gradedLogs.filter((l) => l.is_correct).map((l) => l.word_id));

  const reviewLimit = Math.min(dueNotes.length, Math.max(2, Math.ceil(meta.dailyNew * 0.5)));
  const reviewItems: MissionItem[] = dueNotes
    .slice(0, reviewLimit)
    .map((n) => ({ word: wordMap.get(n.word_id)!, kind: 'review' as const }));

  const reviewIds = new Set(reviewItems.map((r) => r.word.id));
  const fresh = allWords.filter((w) => !everCorrect.has(w.id) && !reviewIds.has(w.id));

  const newItems: MissionItem[] = fresh
    .slice(0, meta.dailyNew)
    .map((w) => ({ word: w, kind: 'new' as const }));

  // 신규가 모자라면(모든 단어를 한 번 이상 맞힌 경우) 정답 이력이 적은 단어로 채움
  if (newItems.length < Math.min(meta.dailyNew, allWords.length)) {
    const picked = new Set([...reviewIds, ...newItems.map((n) => n.word.id)]);
    const correctCount = new Map<string, number>();
    for (const l of gradedLogs) {
      if (l.is_correct) correctCount.set(l.word_id, (correctCount.get(l.word_id) ?? 0) + 1);
    }
    const fillers = allWords
      .filter((w) => !picked.has(w.id))
      .sort((a, b) => (correctCount.get(a.id) ?? 0) - (correctCount.get(b.id) ?? 0))
      .slice(0, Math.min(meta.dailyNew, allWords.length) - newItems.length)
      .map((w) => ({ word: w, kind: 'new' as const }));
    newItems.push(...fillers);
  }

  const items = [...reviewItems, ...newItems];
  return {
    items,
    reviewCount: reviewItems.length,
    newCount: newItems.length,
    target: items.length,
    dueReviewTotal: dueNotes.length,
  };
}

/** 오답 복습 전용 미션 (오답노트 탭에서 시작) */
export function buildReviewOnly(student: Student, limit = 10): Mission {
  const allWords = store.wordsOfStudent(student);
  const wordMap = new Map(allWords.map((w) => [w.id, w]));
  const notes = store
    .wrongNotesFor(student.id)
    .filter((n) => wordMap.has(n.word_id))
    .slice(0, limit);
  const items: MissionItem[] = notes.map((n) => ({ word: wordMap.get(n.word_id)!, kind: 'review' as const }));
  return { items, reviewCount: items.length, newCount: 0, target: items.length, dueReviewTotal: items.length };
}

/** 같은 레벨·같은 품사에서 오답 보기 3개를 뽑습니다. */
export function buildChoices(target: Word, levelStudent: Student, random: () => number = Math.random) {
  const pool = store.wordsForLevel(levelStudent.level).filter((w) => w.id !== target.id);
  const samePos = pool.filter((w) => w.pos === target.pos);
  const source = samePos.length >= 3 ? samePos : pool;
  const picked: Word[] = [];
  const used = new Set<string>([target.id]);
  const shuffled = [...source].sort(() => random() - 0.5);
  for (const w of shuffled) {
    if (picked.length >= 3) break;
    if (used.has(w.id)) continue;
    // 뜻이 같은 단어는 오답 보기로 쓰지 않음
    if (w.meaning === target.meaning) continue;
    used.add(w.id);
    picked.push(w);
  }
  return [target, ...picked];
}
