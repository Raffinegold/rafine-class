/** 날짜·문자열·해시 유틸 (모두 로컬 시간대 기준) */

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return ymd(new Date());
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
}

export function addDays(s: string, n: number): string {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

/** 월요일 시작 주간의 월요일 */
export function weekStartStr(s: string = todayStr()): string {
  const d = parseYmd(s);
  const day = d.getDay(); // 0=일
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return ymd(d);
}

export function weekDays(startStr: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startStr, i));
}

const KO_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function formatKoTimestamp(iso: string | null | undefined): string {
  if (!iso) return '없음';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '없음';
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatKoShort(s: string): string {
  const d = parseYmd(s);
  return `${d.getMonth() + 1}/${d.getDate()}(${KO_DAYS[d.getDay()]})`;
}

export function dayLabel(s: string): string {
  const d = parseYmd(s);
  return KO_DAYS[d.getDay()];
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 재현 가능한 난수 (데모 시드용) */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 데모용 PIN 해시 — 실서비스는 Supabase Edge Function에서 bcrypt 사용 */
export function hashPin(studentId: string, pin: string): string {
  const input = `${studentId}::${pin}::rafine-voca`;
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
  }
  return `demo$${h1.toString(16)}${h2.toString(16)}`;
}

export function verifyPin(studentId: string, pin: string, hash: string): boolean {
  return hashPin(studentId, pin) === hash;
}

export function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function randomToken(len = 32): string {
  const chars = 'abcdef0123456789';
  let out = '';
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  for (let i = 0; i < len; i++) out += chars[buf[i] % chars.length];
  return out;
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ------------------------------ 화면 폭 (2026-11-20) ------------------------------ */
/*
 * 폰은 지금처럼 1단(읽기 좋은 폭), 태블릿·PC에서는 넓게 써서 양옆 여백을 줄입니다.
 *  · PAGE_W      — 학습·상점·작품처럼 읽는 화면 (태블릿 5xl · PC 6xl)
 *  · PAGE_W_WIDE — 수업 중 띄워 보거나 관리하는 화면 (태블릿 6xl · PC 7xl)
 * 헤더·하단 탭도 같은 폭을 써서 넓은 화면에서 좁게 떠 보이지 않게 맞춥니다.
 */
export const PAGE_W = 'mx-auto w-full max-w-3xl px-4 md:max-w-5xl md:px-6 lg:max-w-6xl';
export const PAGE_W_WIDE = 'mx-auto w-full max-w-3xl px-4 md:max-w-6xl md:px-6 lg:max-w-7xl';

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

export function pct(correct: number, total: number): number {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * 이름 뒤에 붙는 주격 조사 — 받침이 있으면 "서연이가", 없으면 "태호가".
 * 학생 이름을 문장 안에 자연스럽게 넣을 때 씁니다.
 */
export function nameWithSubject(name: string): string {
  const last = (name || '').trim().slice(-1);
  if (!last) return '친구가';
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return `${name}가`;
  const hasJong = (code - 0xac00) % 28 !== 0;
  return hasJong ? `${name}이가` : `${name}가`;
}
