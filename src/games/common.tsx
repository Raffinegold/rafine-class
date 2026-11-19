import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useVocaStore } from '../app-context';
import { Badge, Bar, Button, Card } from '../components/ui';
import { cn } from '../lib/util';
import type { Student } from '../types';
import { isSoundMuted, setSoundMuted, sfx, startBgm, stopBgm, type BgmMood } from '../lib/sound';
import { useState } from 'react';

/* --------------------------------- 보상 ---------------------------------- */

export interface RewardRow {
  label: string;
  value: number;
}

export interface Reward {
  raw: number;
  earned: number;
  rows: RewardRow[];
  capped: boolean;
}

/** 보상 행 합계를 하루 상한(영어·코딩 공용 지갑) 안에서 적립하고 결과를 돌려줍니다 */
export function usePayout(student: Student) {
  const store = useVocaStore();
  return useCallback(
    (rows: RewardRow[]): Reward => {
      const raw = rows.reduce((sum, r) => sum + Math.max(0, r.value), 0);
      const earned = store.grantCash(student.id, raw);
      return { raw, earned, rows, capped: earned < raw };
    },
    [store, student]
  );
}

export function DailyCashCard({
  earned,
  limit,
  note,
  testId = 'game-daily-earned',
  compact = false,
}: {
  earned: number;
  limit: number;
  note?: string;
  testId?: string;
  /** 게임 플레이 화면에서는 한 줄로 접어 무대를 넓게 씁니다 */
  compact?: boolean;
}) {
  const remaining = Math.max(0, limit - earned);
  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white bg-white/90 px-3 py-1.5 shadow-sm" data-testid={`${testId}-wrap`}>
        <span className="whitespace-nowrap text-[10.5px] font-bold text-slate-600">오늘 적립</span>
        <span className="whitespace-nowrap text-[10.5px] font-semibold text-slate-500" data-testid={testId}>
          {earned} / {limit}원
        </span>
        <span className="min-w-0 flex-1">
          <Bar ratio={limit > 0 ? earned / limit : 1} tone={remaining === 0 ? 'sun' : earned > 0 ? 'mint' : 'brand'} />
        </span>
        <span className="whitespace-nowrap rounded-full bg-slate-50 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-500">
          {remaining === 0 ? '연습 모드' : `${remaining}원 남음`}
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border border-white bg-white/90 p-3.5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-slate-800">오늘 적립</p>
          <span className="text-[11px] font-semibold text-slate-500" data-testid={testId}>
            {earned} / {limit}원
          </span>
        </div>
        {remaining === 0 ? <Badge tone="sun">연습 모드</Badge> : <Badge tone="mint">오늘 {remaining}원 더</Badge>}
      </div>
      <div className="mt-2">
        <Bar ratio={limit > 0 ? earned / limit : 1} tone={remaining === 0 ? 'sun' : earned > 0 ? 'mint' : 'brand'} />
      </div>
      <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-400">
        {note ?? `게임으로 모은 캐시는 한 지갑에 모여요. 하루 최대 ${limit}원, 다 채우면 연습 모드로 계속 놀 수 있어요.`}
      </p>
    </div>
  );
}

/* ------------------------------- 결과 화면 ------------------------------- */

export function GameResult({
  emoji,
  title,
  stats,
  reward,
  limit,
  extras,
  onReplay,
  onMenu,
  onShop,
  replayLabel = '한 판 더',
  menuLabel = '게임 목록',
  testId = 'game-summary',
  rewardTestId = 'game-reward',
  accent = 'brand',
}: {
  emoji: string;
  title: string;
  stats: ReactNode;
  reward: Reward;
  limit: number;
  extras?: ReactNode;
  onReplay: () => void;
  onMenu: () => void;
  onShop?: () => void;
  replayLabel?: string;
  menuLabel?: string;
  testId?: string;
  rewardTestId?: string;
  accent?: 'brand' | 'dark';
}) {
  const best = reward.earned >= Math.max(8, reward.raw * 0.8);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => {
      const el = rootRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 108;
      window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    }, 140);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div
      ref={rootRef}
      className={cn(
        'animate-pop scroll-mt-48 overflow-hidden rounded-3xl shadow-card ring-1',
        accent === 'dark' ? 'bg-slate-900 text-white ring-white/10' : 'bg-gradient-to-br from-brand-50 via-white to-amber-50 ring-white'
      )}
      data-testid={testId}
    >
      <div
        className={cn(
          'flex items-center gap-3 px-5 py-4',
          accent === 'dark' ? 'bg-gradient-to-r from-violet-600/30 to-cyan-500/20' : 'bg-gradient-to-r from-brand-600 to-indigo-600'
        )}
      >
        <span className="animate-floaty text-3xl drop-shadow">{emoji}</span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-[16px] font-extrabold leading-tight', accent === 'dark' ? 'text-white' : 'text-white')}>{title}</p>
          <p className={cn('mt-0.5 text-[11px] font-semibold', accent === 'dark' ? 'text-white/70' : 'text-white/80')}>{stats}</p>
        </div>
        <div className="text-right">
          <p className={cn('text-[10px] font-semibold', accent === 'dark' ? 'text-white/60' : 'text-white/70')}>이번 판</p>
          <p className="text-2xl font-extrabold leading-tight text-amber-300" data-testid={rewardTestId}>
            +{reward.earned}원
          </p>
        </div>
      </div>

      <div className="px-5 py-4">
        <ul className={cn('space-y-1 rounded-2xl p-3 text-[12px]', accent === 'dark' ? 'bg-white/5 text-slate-200' : 'bg-white/70 text-slate-600')}>
          {reward.rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between">
              <span>{row.label}</span>
              <span className={cn('font-bold', row.value ? (accent === 'dark' ? 'text-cyan-300' : 'text-slate-800') : 'text-slate-400/50')}>
                {row.value ? `+${row.value}원` : '—'}
              </span>
            </li>
          ))}
          <li className={cn('flex items-center justify-between border-t pt-1.5 font-bold', accent === 'dark' ? 'border-white/10 text-white' : 'border-slate-100 text-slate-800')}>
            <span>합계</span>
            <span>+{reward.raw}원</span>
          </li>
        </ul>

        {reward.capped ? (
          <p className="mt-2 rounded-xl bg-amber-100/80 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
            오늘 적립 상한({limit}원)에 닿아서 {reward.earned}원만 적립했어요. 남은 판은 연습 모드로 기록됩니다.
          </p>
        ) : best ? (
          <p
            className={cn(
              'mt-2 rounded-xl px-3 py-2 text-[11px] font-semibold leading-relaxed',
              accent === 'dark' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-100/70 text-emerald-700'
            )}
          >
            실력이 붙었어요! 이번 판 최고 기록이에요 ✨
          </p>
        ) : null}

        {extras}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button data-testid="game-restart" className="flex-1" onClick={onReplay}>
            {replayLabel}
          </Button>
          <Button data-testid="game-other" variant="soft" className="flex-1" onClick={onMenu}>
            {menuLabel}
          </Button>
          {onShop ? (
            <Button data-testid="game-shop-link" variant="sun" className="flex-1" onClick={onShop}>
              상점 가기
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- 공통 조각 ------------------------------- */

/** 터치한 자리에서 사방으로 튀는 스파크 (CSS 파티클) */
export function SparkBurst({ count = 16, color = '#fbbf24', size = 6 }: { count?: number; color?: string; size?: number }) {
  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const dist = 26 + Math.random() * 30;
        return (
          <span
            key={i}
            className="spark"
            style={
              {
                '--dx': `${Math.cos(angle) * dist}px`,
                '--dy': `${Math.sin(angle) * dist}px`,
                width: size,
                height: size,
                background: i % 3 === 0 ? '#ffffff' : color,
                animationDelay: `${i * 6}ms`,
              } as CSSProperties
            }
          />
        );
      })}
    </span>
  );
}

/** 게임 화면에 들어온 동안 배경음악을 켜고, 화면을 벗어나면 자동으로 끕니다 */
export function GameBgm({ mood }: { mood: BgmMood }) {
  useEffect(() => {
    startBgm(mood);
    return () => stopBgm();
  }, [mood]);
  return null;
}

export function MuteButton() {
  const [muted, setMuted] = useState(() => isSoundMuted());
  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
    if (!next) sfx.tap();
  };
  return (
    <button
      data-testid="game-mute"
      onClick={toggle}
      aria-label={muted ? '소리 켜기' : '소리 끄기'}
      className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

export function BackBar({ onBack, label = '게임 목록', right }: { onBack: () => void; label?: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        data-testid="game-back"
        onClick={onBack}
        className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200/70"
      >
        ← {label}
      </button>
      {right}
    </div>
  );
}

/** 게임 선택 카드 — 미리보기 아트 + 제목 */
export function GamePickCard({
  testId,
  icon,
  title,
  desc,
  tag,
  art,
  onClick,
  tone = 'light',
}: {
  testId: string;
  icon: string;
  title: string;
  desc: string;
  tag?: string;
  art: ReactNode;
  onClick: () => void;
  tone?: 'light' | 'dark';
}) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'group relative flex w-full flex-col overflow-hidden rounded-3xl text-left shadow-soft transition active:scale-[0.985] hover:-translate-y-0.5 hover:shadow-card',
        tone === 'dark' ? 'bg-slate-900 text-white ring-1 ring-white/10' : 'bg-white text-slate-900 ring-1 ring-white'
      )}
    >
      <div className="relative h-[76px] w-full overflow-hidden">{art}</div>
      <div className="flex flex-1 flex-col gap-0.5 px-3 pb-3 pt-2">
        <span className="flex items-center gap-1.5 text-[13px] font-extrabold leading-tight">
          <span className="text-base">{icon}</span>
          {title}
        </span>
        <span className={cn('text-[10.5px] leading-relaxed', tone === 'dark' ? 'text-slate-400' : 'text-slate-500')}>{desc}</span>
        {tag ? (
          <span
            className={cn(
              'mt-1.5 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold',
              tone === 'dark' ? 'bg-cyan-400/15 text-cyan-300' : 'bg-brand-50 text-brand-700'
            )}
          >
            {tag}
          </span>
        ) : null}
      </div>
    </button>
  );
}

/** 결과에서 틀린 단어 목록 */
export function WrongWords({ words }: { words: { word: string; meaning: string; ipa?: string }[] }) {
  if (!words.length) {
    return (
      <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
        이번 판에 틀린 단어가 없어요. 완벽해요! ✨
      </p>
    );
  }
  return (
    <div className="mt-3">
      <p className="text-[11px] font-bold text-slate-700">이번 판에서 헷갈린 단어</p>
      <ul className="mt-1.5 space-y-1" data-testid="game-wrong-list">
        {words.slice(0, 6).map((w) => (
          <li key={w.word} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 text-[12px]">
            <span className="font-bold text-slate-900">{w.word}</span>
            <span className="text-[10px] text-slate-400">{w.ipa}</span>
            <span className="ml-auto text-[11px] text-slate-600">{w.meaning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HpBar({
  hp,
  max,
  tone = 'rose',
  label,
  testId,
}: {
  hp: number;
  max: number;
  tone?: 'rose' | 'emerald' | 'cyan';
  label?: string;
  testId?: string;
}) {
  const ratio = Math.max(0, Math.min(1, hp / max));
  const colors = {
    rose: 'from-rose-500 via-rose-400 to-orange-400',
    emerald: 'from-emerald-500 via-emerald-400 to-lime-400',
    cyan: 'from-cyan-400 via-sky-400 to-violet-400',
  };
  return (
    <div className="w-full" data-testid={testId}>
      <div className="mb-0.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-white/85">
        <span className="drop-shadow">{label}</span>
        <span className="tabular-nums drop-shadow">
          {Math.max(0, hp)}/{max}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-900/50 ring-1 ring-white/25">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out', colors[tone])}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
