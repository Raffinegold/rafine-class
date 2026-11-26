import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/util';

export type AdminTab = 'home' | 'board' | 'portfolio' | 'feed' | 'tools';

const ITEMS: { key: AdminTab; label: string; short: string; to: string; icon: string }[] = [
  { key: 'home', label: '원장 홈', short: '홈', to: '/admin', icon: '🧠' },
  { key: 'board', label: '진도·완료 보드', short: '보드', to: '/admin/board', icon: '📊' },
  { key: 'portfolio', label: '포트폴리오 승인', short: '승인', to: '/admin/portfolio', icon: '🖼️' },
  { key: 'feed', label: '대회·IT뉴스', short: '대회', to: '/admin/feed', icon: '🏆' },
  { key: 'tools', label: '관리 도구', short: '도구', to: '/admin/tools', icon: '⚙️' },
];

/** 원장 화면 공통 이동 탭 (원장 홈 · 진도 보드 · 포트폴리오 승인 · 대회/뉴스 · 관리 도구) */
export default function AdminNav({ active }: { active: AdminTab }) {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let alive = true;
    if (!supabase) return () => undefined;
    supabase
      .from('portfolios')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => {
        if (alive) setPending(count ?? 0);
      });
    return () => {
      alive = false;
    };
  }, [active]);

  return (
    <nav className="no-print flex gap-1 overflow-x-auto thin-scroll" data-testid="admin-nav">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          data-testid={`admin-nav-${item.key}`}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold transition',
            active === item.key
              ? 'bg-brand-600 text-white shadow-soft'
              : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
          )}
        >
          <span aria-hidden>{item.icon}</span>
          <span className="hidden sm:inline">{item.label}</span>
          <span className="sm:hidden">{item.short}</span>
          {item.key === 'portfolio' && pending > 0 ? (
            <span
              className={cn(
                'ml-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9.5px] font-extrabold',
                active === 'portfolio' ? 'bg-white text-brand-700' : 'bg-rose-500 text-white'
              )}
            >
              {pending}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
