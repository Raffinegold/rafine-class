import type { Word } from '../../types';
import { shuffle } from '../../lib/util';

/** 게임에서 쓰는 단어 카드 (뜻·예문·발음) */
export interface QuizWord {
  id: string;
  word: string;
  meaning: string;
  ipa: string;
  example: string;
  exampleKo: string;
}

export function toQuizWords(words: Word[]): QuizWord[] {
  return words.map((w) => ({
    id: w.id,
    word: w.word,
    meaning: w.meaning,
    ipa: w.ipa ?? '',
    example: w.example,
    exampleKo: w.example_ko,
  }));
}

/** 정답 + 오답 보기 count 개 (정답 포함, 중복 없음) */
export function buildChoices<T>(correct: T, pool: T[], pick: (item: T) => string, count = 4): T[] {
  const seen = new Set([pick(correct)]);
  const others: T[] = [];
  for (const item of shuffle(pool)) {
    const key = pick(item);
    if (seen.has(key)) continue;
    seen.add(key);
    others.push(item);
    if (others.length >= count - 1) break;
  }
  return shuffle([correct, ...others]);
}

/** 예문에서 단어를 빈칸으로 바꿉니다 (대소문자 무시, 단어 경계) */
export function blankSentence(word: QuizWord): { before: string; after: string; matched: string } | null {
  const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`, 'i');
  const m = re.exec(word.example);
  if (!m) return null;
  return {
    before: word.example.slice(0, m.index),
    after: word.example.slice(m.index + m[0].length),
    matched: m[0],
  };
}

/** 풀에서 n개 뽑기 (모자라면 있는 만큼) */
export function pickWords<T>(pool: T[], n: number): T[] {
  return shuffle(pool).slice(0, Math.min(n, pool.length));
}
