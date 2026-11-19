import { AXES, COMBOS, KID_TYPES, MOM_TYPES, type Combo, type MindType } from './data';

export type MomKey = 'M1' | 'M2' | 'M3' | 'M4';
export type KidKey = 'K1' | 'K2' | 'K3' | 'K4';
export type AxisDirection = 'up' | 'down';

export interface AxisReading {
  id: string;
  short: string;
  name: string;
  direction: AxisDirection;
  label: string;
}

export interface MindReading {
  ok: true;
  code: string;
  momKey: MomKey;
  kidKey: KidKey;
  mom: MindType;
  kid: MindType;
  momAxes: AxisReading[];
  kidAxes: AxisReading[];
  combo: Combo;
  comboKey: string;
}

export interface MindError {
  ok: false;
  error: string;
}

/** 코드 한 글자(hex)를 축 4개의 ↑/↓ 로 — 원본 decodeMask 와 같은 비트 순서(8·4·2·1) */
function decodeMask(ch: string): AxisDirection[] {
  const v = parseInt(ch, 16);
  return AXES.map((_, i) => ((v & (1 << (3 - i))) !== 0 ? 'up' : 'down'));
}

function reading(mask: AxisDirection[]): AxisReading[] {
  return AXES.map((a, i) => ({
    id: a.id,
    short: a.short,
    name: a.name,
    direction: mask[i],
    label: mask[i] === 'up' ? a.high : a.low,
  }));
}

/** RC-XXXX 를 rafine-mind 와 동일한 규칙으로 해석합니다. */
export function parseMindCode(raw: string): MindReading | MindError {
  const trimmed = (raw ?? '').trim().toUpperCase().replace(/\s/g, '');
  const normalized = /^RC-?[1-4][1-4][0-9A-F][0-9A-F]$/.test(trimmed)
    ? trimmed.startsWith('RC-')
      ? trimmed
      : `RC-${trimmed.slice(2)}`
    : trimmed;
  const m = /^RC-([1-4])([1-4])([0-9A-F])([0-9A-F])$/.exec(normalized);
  if (!m) {
    return { ok: false, error: 'RC-XXXX 형식이 아니에요. 예) RC-14E1' };
  }
  const momKey = `M${m[1]}` as MomKey;
  const kidKey = `K${m[2]}` as KidKey;
  return {
    ok: true,
    code: normalized,
    momKey,
    kidKey,
    mom: MOM_TYPES[momKey],
    kid: KID_TYPES[kidKey],
    momAxes: reading(decodeMask(m[3])),
    kidAxes: reading(decodeMask(m[4])),
    combo: COMBOS[`${momKey}-${kidKey}`],
    comboKey: `${momKey}-${kidKey}`,
  };
}

export function maskText(axes: AxisReading[]): string {
  return axes.map((a) => (a.direction === 'up' ? '↑' : '↓')).join('');
}

/** 원본의 {mom} · {kid:는} 같은 토큰을 학생 이름으로 채웁니다 (받침에 맞춘 조사 처리) */
export function fillTokens(text: string, kidName: string, momName = ''): string {
  if (!text) return '';
  const hasJong = (word: string) => {
    const code = word.charCodeAt(word.length - 1);
    if (code < 0xac00 || code > 0xd7a3) return true;
    return (code - 0xac00) % 28 !== 0;
  };
  const josa = (key: string) => {
    const jong = hasJong(kidName || '아이');
    const map: Record<string, [string, string]> = {
      이: ['이', '가'],
      가: ['이', '가'],
      는: ['은', '는'],
      은: ['은', '는'],
      을: ['을', '를'],
      를: ['을', '를'],
      과: ['과', '와'],
      와: ['과', '와'],
    };
    const pair = map[key];
    return pair ? (jong ? pair[0] : pair[1]) : key;
  };
  return text
    .replace(/\{mom\}님/g, momName ? `${momName}님` : '어머님')
    .replace(/\{mom\}/g, momName || '어머니')
    .replace(/\{kid:([이가은는을를과와]+)\}/g, (_m, k: string) => `${kidName || '아이'}${josa(k)}`)
    .replace(/\{kid\}/g, kidName || '아이');
}

export { AXES, MOM_TYPES, KID_TYPES, COMBOS, KID_TRACK_RECOMMEND } from './data';
export type { Combo, MindType } from './data';
