import type { ReactNode } from 'react';
import SubjectSwitch from './SubjectSwitch';
import { cn, PAGE_W, PAGE_W_WIDE } from '../lib/util';

/**
 * 학생 화면 공통 헤더 — 브랜딩(라피네 클래스 · 영어 & 코딩)과 📚/💻 과목 전환 스위치.
 * 전환 스위치가 없는 학생(한 과목만 수강)은 스위치 줄이 자동으로 사라집니다.
 * 폭은 화면 본문과 같은 값(PAGE_W / PAGE_W_WIDE)을 써서 태블릿·PC에서도 좌우가 맞습니다.
 */
export default function StudentHeader({
  icon,
  brand,
  title,
  right,
  accent = 'brand',
  hideSubjectSwitch,
  wide,
}: {
  icon: string;
  brand: string;
  title: string;
  right?: ReactNode;
  accent?: 'brand' | 'dark';
  /** 학습 화면이 아닌 탭(내 작품·복습 힌트)에서는 과목 전환을 숨깁니다 */
  hideSubjectSwitch?: boolean;
  /** 📂 수업자료처럼 넓게 쓰는 화면은 본문과 같은 넓은 폭으로 */
  wide?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/85 backdrop-blur">
      <div className={cn(wide ? PAGE_W_WIDE : PAGE_W, 'pb-2 pt-2.5')}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm text-white shadow-soft',
                accent === 'dark' ? 'bg-slate-900' : 'bg-brand-600'
              )}
            >
              {icon}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold leading-tight text-slate-400">{brand}</p>
              <p className="truncate text-[13px] font-bold leading-tight text-slate-900 md:text-[14px]">{title}</p>
            </div>
          </div>
          {right ? <div className="flex shrink-0 items-center gap-1">{right}</div> : null}
        </div>
        {hideSubjectSwitch ? null : (
          <div className="mt-1.5 empty:hidden">
            <SubjectSwitch />
          </div>
        )}
      </div>
    </header>
  );
}
