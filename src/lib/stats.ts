import type { Student, StudyLog } from '../types';
import { store } from './store';
import { addDays, formatKoShort, pct, todayStr, weekStartStr, ymd } from './util';

export interface FocusWord {
  word: string;
  meaning: string;
  miss: number;
}

export interface WeekStats {
  weekStart: string;
  weekLabel: string;
  wordsDone: number;
  accuracy: number;
  streakDays: number;
  answered: number;
  correct: number;
  activeDays: number;
  focusWords: FocusWord[];
  trend: { label: string; words: number }[];
  dayDone: boolean[];
}

function firstAttempts(logs: StudyLog[]): StudyLog[] {
  const map = new Map<string, StudyLog>();
  for (const l of logs) {
    if (l.mode === 'card') continue;
    const cur = map.get(l.word_id);
    if (!cur || l.answered_at < cur.answered_at) map.set(l.word_id, l);
  }
  return [...map.values()];
}

export function weekLogs(studentId: string, start: string): StudyLog[] {
  const end = addDays(start, 7);
  return store.logsFor(studentId).filter((l) => {
    const d = ymd(new Date(l.answered_at));
    return d >= start && d < end;
  });
}

export function wordsDoneInWeek(studentId: string, start: string): number {
  const logs = weekLogs(studentId, start).filter((l) => l.mode !== 'card' && l.is_correct);
  return new Set(logs.map((l) => l.word_id)).size;
}

export function computeStreak(studentId: string, today = todayStr()): number {
  const doneDates = new Set(
    store
      .progressFor(studentId)
      .filter((p) => p.target > 0 && p.answered >= Math.ceil(p.target * 0.8))
      .map((p) => p.date)
  );
  let cursor = today;
  if (!doneDates.has(today)) {
    cursor = addDays(today, -1);
    if (!doneDates.has(cursor)) return 0;
  }
  let streak = 0;
  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function computeWeekStats(student: Student, ref = todayStr()): WeekStats {
  const start = weekStartStr(ref);
  const logs = weekLogs(student.id, start);
  const firsts = firstAttempts(logs);
  const correct = firsts.filter((l) => l.is_correct).length;
  const accuracy = pct(correct, firsts.length);
  const answered = logs.filter((l) => l.mode !== 'card').length;

  const dayDone: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    const p = store.progressFor(student.id).find((x) => x.date === d);
    dayDone.push(!!p && p.target > 0 && p.answered >= Math.ceil(p.target * 0.8));
  }

  const focusWords: FocusWord[] = store
    .wrongNotesFor(student.id)
    .map((n) => {
      const w = store.wordById(n.word_id);
      return w ? { word: w.word, meaning: w.meaning, miss: n.miss_count } : null;
    })
    .filter((v): v is FocusWord => !!v)
    .sort((a, b) => b.miss - a.miss)
    .slice(0, 5);

  const trend = [3, 2, 1, 0].map((back) => {
    const ws = addDays(start, -7 * back);
    return { label: formatKoShort(ws), words: wordsDoneInWeek(student.id, ws) };
  });

  return {
    weekStart: start,
    weekLabel: `${formatKoShort(start)} ~ ${formatKoShort(addDays(start, 6))}`,
    wordsDone: wordsDoneInWeek(student.id, start),
    accuracy,
    streakDays: computeStreak(student.id, ref),
    answered,
    correct,
    activeDays: dayDone.filter(Boolean).length,
    focusWords,
    trend,
    dayDone,
  };
}

export interface AdminOverview {
  weekWords: number;
  activeToday: number;
  accuracy: number;
  incomplete: { student: Student; lastSeen: string | null }[];
  classAccuracy: { className: string; accuracy: number; students: number }[];
  todayCompleted: number;
  todayTotal: number;
}

export function computeOverview(ref = todayStr()): AdminOverview {
  const start = weekStartStr(ref);
  const students = store.listStudents();
  let weekWords = 0;
  let totalFirst = 0;
  let totalCorrect = 0;
  const classMap = new Map<string, { correct: number; total: number; students: number }>();
  let activeToday = 0;
  let todayCompleted = 0;
  const incomplete: { student: Student; lastSeen: string | null }[] = [];

  for (const st of students) {
    const logs = weekLogs(st.id, start);
    const firsts = firstAttempts(logs);
    weekWords += new Set(logs.filter((l) => l.is_correct && l.mode !== 'card').map((l) => l.word_id)).size;
    totalFirst += firsts.length;
    const c = firsts.filter((l) => l.is_correct).length;
    totalCorrect += c;

    const cls = classMap.get(st.class_name) ?? { correct: 0, total: 0, students: 0 };
    cls.correct += c;
    cls.total += firsts.length;
    cls.students += 1;
    classMap.set(st.class_name, cls);

    const seenToday = st.last_seen_at ? ymd(new Date(st.last_seen_at)) === ref : false;
    if (seenToday) activeToday += 1;
    if (store.isCompletedToday(st.id)) todayCompleted += 1;
    else incomplete.push({ student: st, lastSeen: st.last_seen_at ?? null });
  }

  incomplete.sort((a, b) => (a.lastSeen ?? '').localeCompare(b.lastSeen ?? ''));

  return {
    weekWords,
    activeToday,
    accuracy: pct(totalCorrect, totalFirst),
    incomplete: incomplete.slice(0, 3),
    classAccuracy: [...classMap.entries()].map(([className, v]) => ({
      className,
      accuracy: pct(v.correct, v.total),
      students: v.students,
    })),
    todayCompleted,
    todayTotal: students.length,
  };
}

export interface RankRow {
  studentId: string;
  nickname: string;
  words: number;
  isMe: boolean;
  rank: number;
}

export function weeklyRanking(student?: Student, ref = todayStr()): RankRow[] {
  const start = weekStartStr(ref);
  const rows = store
    .listStudents()
    .map((st) => ({
      studentId: st.id,
      nickname: st.nickname || st.name,
      words: wordsDoneInWeek(st.id, start),
      isMe: st.id === student?.id,
      rank: 0,
    }))
    .sort((a, b) => b.words - a.words || a.nickname.localeCompare(b.nickname, 'ko'));
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}
