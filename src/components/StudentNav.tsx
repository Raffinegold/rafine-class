import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/util';

/** 학생 하단 탭 — 학습 · 자료실 · 내 작품 · 복습 힌트 · 상점 */
export type StudentTabKey = 'learn' | 'materials' | 'works' | 'hints' | 'shop';

interface NavItem {
  key: StudentTabKey;
  label: string;
  icon: string;
  to: string;
}

const ITEMS: NavItem[] = [
  { key: 'learn', label: '학습', icon: '💻', to: '/' },
  { key: 'materials', label: '수업자료', icon: '📂', to: '/materials' },
  { key: 'works', label: '내 작품', icon: '🎨', to: '/works' },
  { key: 'hints', label: '복습 힌트', icon: '💡', to: '/hints' },
  { key: 'shop', label: '상점', icon: '🎁', to: '/shop' },
];

/**
 * 하단 탭 (2026-11-20)
 *  · 폰: 지금처럼 아이콘 위 · 글자 아래 5칸.
 *  · 태블릿·PC: 폭을 본문과 맞추고, 탭은 가운데로 모아 아이콘+글자를 한 줄 칩으로 —
 *    넓은 화면에서 좁게 떠 보이거나 다섯 칸이 과하게 벌어지지 않게 합니다.
 */
export default function StudentNav({ active }: { active: StudentTabKey }) {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white bg-white/95 backdrop-blur"
      data-testid="student-nav"
    >
      <div className="mx-auto flex w-full max-w-3xl items-stretch justify-around px-3 pb-safe pt-2 md:max-w-5xl md:justify-center md:gap-1.5 md:px-6 md:pb-3 md:pt-2.5 lg:max-w-6xl 2xl:max-w-[1360px]">
        {ITEMS.map((item) => (
          <button
            key={item.key}
            data-testid={`nav-${item.key}`}
            onClick={() => navigate(item.to)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-3xl py-2.5 text-[11px] font-bold transition',
              'md:flex-none md:flex-row md:gap-1.5 md:rounded-2xl md:px-4 md:py-2 md:text-[12.5px]',
              active === item.key ? 'bg-brand-50 text-brand-700' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <span
              className={cn(
                'text-[22px] leading-none transition md:text-[18px]',
                active === item.key && 'scale-110 md:scale-100'
              )}
            >
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
