import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '../lib/util';

/* ------------------------------- 버튼 / 배지 ------------------------------- */

type ButtonVariant = 'primary' | 'soft' | 'ghost' | 'sun' | 'danger';

export function Button({
  children,
  variant = 'primary',
  className,
  size = 'md',
  ...rest
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2';
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-brand-600 text-white shadow-soft hover:bg-brand-700',
    soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
    ghost: 'bg-white/70 text-slate-600 hover:bg-white border border-slate-200',
    sun: 'bg-sunny text-slate-900 hover:brightness-105 shadow-soft',
    danger: 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50',
  };
  const sizes = { sm: 'text-sm px-3 py-2', md: 'text-[15px] px-4 py-3', lg: 'text-base px-5 py-4' };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = 'brand',
  className,
}: {
  children: ReactNode;
  tone?: 'brand' | 'mint' | 'sun' | 'slate' | 'rose' | 'sky';
  className?: string;
}) {
  const tones = {
    brand: 'bg-brand-100 text-brand-700',
    mint: 'bg-emerald-100 text-emerald-700',
    sun: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-100 text-slate-600',
    rose: 'bg-rose-100 text-rose-600',
    sky: 'bg-sky-100 text-sky-700',
  };
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-3xl bg-white/90 shadow-soft border border-white p-5', className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{children}</h2>
        {sub ? <p className="mt-0.5 text-sm text-slate-500">{sub}</p> : null}
      </div>
    </div>
  );
}

/* -------------------------------- 진행 링 -------------------------------- */

export function ProgressRing({
  value,
  total,
  size = 92,
  stroke = 10,
  label,
  track = 'rgba(255,255,255,0.35)',
  labelClass = 'text-white',
}: {
  value: number;
  total: number;
  size?: number;
  stroke?: number;
  label?: ReactNode;
  track?: string;
  labelClass?: string;
}) {
  const ratio = total > 0 ? Math.min(1, value / total) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#facc15"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 400ms ease' }}
        />
      </svg>
      <div className={cn('absolute inset-0 flex flex-col items-center justify-center', labelClass)}>
        {label ?? (
          <>
            <span className="text-xl font-extrabold leading-none">
              {value}/{total}
            </span>
            <span className="mt-0.5 text-[10px] font-medium opacity-80">단어</span>
          </>
        )}
      </div>
    </div>
  );
}

export function Bar({ ratio, tone = 'brand' }: { ratio: number; tone?: 'brand' | 'mint' | 'sun' }) {
  const colors = { brand: 'bg-brand-500', mint: 'bg-emerald-400', sun: 'bg-amber-400' };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cn('h-full rounded-full transition-all', colors[tone])} style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }} />
    </div>
  );
}

/* --------------------------------- 모달 ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        className={cn(
          'w-full animate-pop rounded-t-3xl bg-white p-5 shadow-card sm:rounded-3xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100" aria-label="닫기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto thin-scroll">{children}</div>
        {footer ? <div className="mt-4 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

/* --------------------------------- 토스트 --------------------------------- */

type ToastItem = { id: number; message: string; tone: 'ok' | 'err' };
const ToastContext = createContext<(message: string, tone?: 'ok' | 'err') => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, tone: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 2600);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((i) => (
          <div
            key={i.id}
            className={cn(
              'animate-pop rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-card',
              i.tone === 'ok' ? 'bg-slate-900/90' : 'bg-rose-600/95'
            )}
          >
            {i.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* --------------------------------- PIN 패드 -------------------------------- */

export function PinPad({
  value,
  onChange,
  onSubmit,
  error,
  length = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (value: string) => void;
  error?: string | null;
  length?: number;
}) {
  const press = (d: string) => {
    if (value.length >= length) return;
    const next = value + d;
    onChange(next);
    if (next.length === length) window.setTimeout(() => onSubmit(next), 120);
  };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  return (
    <div className={cn('w-full', error && 'animate-shake')}>
      <div className="mb-4 flex justify-center gap-3">
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-3.5 w-3.5 rounded-full transition',
              value.length > i ? 'scale-110 bg-brand-600' : 'bg-slate-200'
            )}
          />
        ))}
      </div>
      {error ? <p className="mb-3 text-center text-sm font-medium text-rose-500">{error}</p> : null}
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              data-testid={`pin-${k === 'del' ? 'del' : k}`}
              onClick={() => (k === 'del' ? onChange(value.slice(0, -1)) : press(k))}
              className="rounded-2xl bg-slate-50 py-3.5 text-xl font-bold text-slate-700 transition active:scale-95 hover:bg-slate-100"
            >
              {k === 'del' ? '⌫' : k}
            </button>
          )
        )}
      </div>
    </div>
  );
}

/* --------------------------------- 레벨 표시 ------------------------------- */

export function LevelPill({ level, className }: { level: number; className?: string }) {
  const tones = ['bg-emerald-100 text-emerald-700', 'bg-sky-100 text-sky-700', 'bg-brand-100 text-brand-700', 'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700'];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold', tones[level - 1] ?? tones[0], className)}>
      Level {level}
    </span>
  );
}
