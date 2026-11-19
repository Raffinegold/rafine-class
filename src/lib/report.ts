import type { Student } from '../types';
import { LEVEL_META } from '../types';
import type { WeekStats } from './stats';

/**
 * 배포 도메인 — .env의 VITE_PUBLIC_APP_URL 로 덮어쓸 수 있음.
 * 값이 없으면 현재 접속 주소를 쓰되, GitHub Pages 처럼 하위 경로에 배포된 경우
 * (https://<owner>.github.io/rafine-voca-app/) 그 경로까지 포함합니다.
 */
export function appBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.trim();
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    return `${window.location.origin}${base}`;
  }
  return 'https://rafine-voca.pages.dev';
}

export function reportUrl(student: Student): string {
  return `${appBaseUrl()}/r/${student.parent_token}`;
}

/**
 * 금요일 학부모 카톡 요약 문구.
 * 카톡이 일부 특수문자를 걸러내므로 쉼표·슬래시·줄바꿈만 사용합니다.
 */
export function buildParentMessage(student: Student, stats: WeekStats): string {
  const meta = LEVEL_META[student.level];
  const done = stats.wordsDone;
  const streak = stats.streakDays;
  const head =
    done > 0
      ? `${student.name} 학생, 이번 주 ${done}단어 / 정답률 ${stats.accuracy}% / ${streak}일 연속 완료`
      : `${student.name} 학생, 이번 주 학습 기록을 준비 중이에요`;
  const focus =
    stats.focusWords.length > 0
      ? `자주 틀린 단어, ${stats.focusWords.slice(0, 3).map((f) => f.word).join(', ')}`
      : '자주 틀린 단어, 아직 없어요';

  return [
    '라피네코딩 두정점, 이번 주 영단어',
    head,
    `지금 단계, Level ${student.level} (${meta.grades}, TOSEL ${meta.tosel} 대비)`,
    focus,
    `자세히 보기, ${reportUrl(student)}`,
  ].join('\n');
}

/** 반 전체 복사용: 학생 블록을 빈 줄로 이어 붙임 */
export function buildClassMessage(entries: { student: Student; stats: WeekStats }[]): string {
  return entries.map((e) => buildParentMessage(e.student, e.stats)).join('\n\n');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallthrough */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
