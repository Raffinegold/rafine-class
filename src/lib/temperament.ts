import type { TemperamentType } from '../data/onetouchSeed';

export type { TemperamentType };

export interface TemperamentMeta {
  key: TemperamentType;
  /** 화면에 보이는 이름 */
  name: string;
  /** 짧은 이름 (버튼·배지) */
  short: string;
  code: string;
  emoji: string;
  tagline: string;
  /** 학생 화면 '내 기질 맞춤' 카드에 쓰는 한 줄 */
  lens: string;
  /** 선생님이 이 아이를 대할 때의 한 줄 */
  teacher: string;
  /** rafine-mind 아이 유형 */
  kid: 'K1' | 'K2' | 'K3' | 'K4';
  chip: string;
  soft: string;
  ring: string;
  solid: string;
}

/**
 * rafine-mind 아이 유형(K1~K4)을 라피네 학습 기질 4종으로 정형화한 표입니다.
 *  K1 도전·실험형 → CHALLENGER(실전·미션형)
 *  K2 표현·발표형 → CREATOR(창작·시각형)
 *  K3 규칙·설계형 → SYSTEMATIC(체계·암기형)
 *  K4 몰입·관찰형 → EXPLORER(탐구·원리형)
 */
export const TEMPERAMENTS: Record<TemperamentType, TemperamentMeta> = {
  SYSTEMATIC: {
    key: 'SYSTEMATIC',
    name: '체계·암기형',
    short: '체계',
    code: 'SYSTEMATIC',
    emoji: '🧩',
    tagline: '순서와 틀을 세우면 힘이 나는 아이',
    lens: '순서와 틀을 먼저 잡으면 힘이 나는 타입 — 오늘도 단계와 규칙으로 정리해요.',
    teacher: '설명은 순서대로, 예시는 하나만. 외운 것을 확인해 주면 가장 안정됩니다.',
    kid: 'K3',
    chip: 'bg-sky-100 text-sky-700',
    soft: 'bg-sky-50/70',
    ring: 'ring-sky-100',
    solid: 'bg-sky-600 text-white',
  },
  EXPLORER: {
    key: 'EXPLORER',
    name: '탐구·원리형',
    short: '탐구',
    code: 'EXPLORER',
    emoji: '🔍',
    tagline: '왜 그런지 끝까지 파고드는 아이',
    lens: '왜 그런지 끝까지 파고들 때 가장 오래 기억하는 타입 — 오늘은 원리를 확인해요.',
    teacher: '정답보다 이유를 물어 주세요. 예측 → 실행 → 비교 순서가 잘 맞습니다.',
    kid: 'K4',
    chip: 'bg-emerald-100 text-emerald-700',
    soft: 'bg-emerald-50/70',
    ring: 'ring-emerald-100',
    solid: 'bg-emerald-600 text-white',
  },
  CREATOR: {
    key: 'CREATOR',
    name: '창작·시각형',
    short: '창작',
    code: 'CREATOR',
    emoji: '🎨',
    tagline: '만들고 보여 줄 때 실력이 붙는 아이',
    lens: '만들고 보여 줄 때 실력이 붙는 타입 — 오늘은 내 것으로 바꿔 표현해요.',
    teacher: '결과물을 예쁘게 다듬고 보여 줄 자리를 만들어 주세요. 발표가 동기입니다.',
    kid: 'K2',
    chip: 'bg-fuchsia-100 text-fuchsia-700',
    soft: 'bg-fuchsia-50/70',
    ring: 'ring-fuchsia-100',
    solid: 'bg-fuchsia-600 text-white',
  },
  CHALLENGER: {
    key: 'CHALLENGER',
    name: '실전·미션형',
    short: '실전',
    code: 'CHALLENGER',
    emoji: '🚀',
    tagline: '일단 해 보고 고치는 아이',
    lens: '일단 해 보고 고치는 타입 — 오늘은 시간을 정해 미션처럼 풀어요.',
    teacher: '짧은 미션과 시간 제한이 잘 맞습니다. 틀려도 바로 다시 시도하게 해 주세요.',
    kid: 'K1',
    chip: 'bg-orange-100 text-orange-700',
    soft: 'bg-orange-50/70',
    ring: 'ring-orange-100',
    solid: 'bg-orange-600 text-white',
  },
};

export const TEMPERAMENT_LIST: TemperamentMeta[] = [
  TEMPERAMENTS.SYSTEMATIC,
  TEMPERAMENTS.EXPLORER,
  TEMPERAMENTS.CREATOR,
  TEMPERAMENTS.CHALLENGER,
];

const KID_TO_TEMPER: Record<string, TemperamentType> = {
  K1: 'CHALLENGER',
  K2: 'CREATOR',
  K3: 'SYSTEMATIC',
  K4: 'EXPLORER',
};

export function isTemperament(value: unknown): value is TemperamentType {
  return value === 'SYSTEMATIC' || value === 'EXPLORER' || value === 'CREATOR' || value === 'CHALLENGER';
}

export function temperamentFromKidType(kid: string | null | undefined): TemperamentType | null {
  if (!kid) return null;
  return KID_TO_TEMPER[kid.trim().toUpperCase()] ?? null;
}

/** RC-XXXX 또는 RC-0K0X → 기질 4종 (아이 유형 자리 기준) */
export function temperamentFromMindCode(code: string | null | undefined): TemperamentType | null {
  if (!code) return null;
  const full = /^RC-?[0-4]([1-4])[0-9A-F]{2}$/i.exec(code.trim());
  if (!full) return null;
  return KID_TO_TEMPER[`K${full[1]}`] ?? null;
}

/** 학생 객체에서 기질을 고릅니다 (DB 값 → RC 코드 → 없음) */
export function temperamentOf(student: {
  temperament_type?: string | null;
  temperament_code?: string | null;
} | null | undefined, code?: string | null): TemperamentType | null {
  if (!student) return null;
  if (isTemperament(student.temperament_type)) return student.temperament_type;
  return temperamentFromMindCode(student.temperament_code) ?? temperamentFromMindCode(code);
}

export function temperamentMeta(type: TemperamentType | null | undefined): TemperamentMeta | null {
  return type ? TEMPERAMENTS[type] : null;
}
