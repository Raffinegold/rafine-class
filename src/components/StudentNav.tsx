import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/util';

/** 학생 하단 탭 — 크게 네 개만: 학습 · 내 작품 · 복습 힌트 · 상점 */
export type StudentTabKey = 'learn' | 'works' | 'hints' | 'shop';

interface NavItem {
  key: StudentTabKey;
  label: string;
  icon: string;
  to: string;
}

const ITEMS: NavItem[] = [
  { key: 'learn', label: '학습', icon: '📚', to: '/' },
  { key: 'works', label: '내 작품', icon: '🎨', to: '/works' },
  { key: 'hints', label: '복습 힌트', icon: '💡', to: '/hints' },
  { key: 'shop', label: '상점', icon: '🎁', to: '/shop' },
];

export default function StudentNav({ active }: { active: StudentTabKey }) {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white bg-white/95 backdrop-blur"
      data-testid="student-nav"
    >
      <div className="mx-auto flex max-w-3xl items-stretch justify-around px-3 pb-safe pt-2">
        {ITEMS.map((item) => (
          <button
            key={item.key}
            data-testid={`nav-${item.key}`}
            onClick={() => navigate(item.to)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-3xl py-2.5 text-[12px] font-bold transition',
              active === item.key ? 'bg-brand-50 text-brand-700' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <span className={cn('text-[22px] leading-none transition', active === item.key && 'scale-110')}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
