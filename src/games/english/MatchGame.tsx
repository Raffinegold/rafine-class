import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVocaStore } from '../../app-context';
import { Badge, Bar, Button, Card, LevelPill } from '../../components/ui';
import { sfx } from '../../lib/sound';
import { cn, shuffle } from '../../lib/util';
import { LEVEL_META, type Level, type Student, type Word } from '../../types';
import { GameResult, SparkBurst, WrongWords, usePayout, type Reward } from '../common';

type Face = 'en' | 'ko';

interface Cell {
  key: string;
  pairId: string;
  face: Face;
  wordId: string;
}

const PAIR_OPTIONS: { pairs: number; label: string }[] = [
  { pairs: 6, label: '6쌍 · 12장' },
  { pairs: 8, label: '8쌍 · 16장' },
];

function buildDeck(pool: Word[], pairs: number): Cell[] {
  const picked = shuffle(pool).slice(0, Math.min(pairs, pool.length));
  const cells: Cell[] = [];
  picked.forEach((w) => {
    cells.push({ key: `${w.id}-en`, pairId: w.id, face: 'en', wordId: w.id });
    cells.push({ key: `${w.id}-ko`, pairId: w.id, face: 'ko', wordId: w.id });
  });
  return shuffle(cells);
}

function defaultPairs(level: Level): number {
  return level >= 4 ? 8 : 6;
}

/** 🃏 단어 짝맞추기 — 카드를 뒤집어 영단어와 뜻을 짝지어요 */
export default function MatchGame({
  student,
  onMenu,
  onShop,
}: {
  student: Student;
  onMenu: () => void;
  onShop: () => void;
}) {
  const store = useVocaStore();
  const payout = usePayout(student);

  const [pairs, setPairs] = useState<number>(() => defaultPairs(student.level));
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'done'>('playing');
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [reward, setReward] = useState<Reward | null>(null);
  const [comboFlash, setComboFlash] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);

  const startRef = useRef<number | null>(null);
  const lockedRef = useRef(false);
  const finishedRef = useRef(false);

  const pool = useMemo(() => {
    const mine = store.wordsOfStudent(student);
    return mine.length >= 8 ? mine : store.wordsForLevel(student.level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, store, store.version]);

  const poolKey = `${pool.length}:${pool[0]?.id ?? ''}:${pool[pool.length - 1]?.id ?? ''}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deck = useMemo(() => buildDeck(pool, pairs), [poolKey, pairs, round]);

  const wordOf = useCallback((id: string) => pool.find((w) => w.id === id), [pool]);
  const limit = store.cashDailyLimit();
  const earnedToday = store.todayCashEarned(student.id);
  const remaining = Math.max(0, limit - earnedToday);

  const flip = (index: number, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (phase !== 'playing' || lockedRef.current) return;
    const cell = deck[index];
    if (!cell || matched.includes(cell.pairId) || flipped.includes(index)) return;
    if (flipped.length >= 2) return;

    if (!startRef.current) startRef.current = Date.now();
    sfx.flip();
    const next = [...flipped, index];
    setFlipped(next);
    if (next.length < 2) return;

    const [a, b] = next.map((i) => deck[i]);
    setAttempts((n) => n + 1);

    if (a && b && a.pairId === b.pairId) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((m) => Math.max(m, nextCombo));
      if (nextCombo >= 2) {
        setComboFlash(nextCombo);
        window.setTimeout(() => setComboFlash(0), 900);
      }
      sfx.match(nextCombo);
      const rect = event?.currentTarget?.getBoundingClientRect();
      if (rect) {
        setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        setBurstKey((k) => k + 1);
      }
      window.setTimeout(() => {
        setMatched((m) => (m.includes(a.pairId) ? m : [...m, a.pairId]));
        setFlipped([]);
      }, 360);
    } else {
      lockedRef.current = true;
      setCombo(0);
      sfx.miss();
      setWrongIds((prev) => Array.from(new Set([...prev, a.wordId, b.wordId])));
      window.setTimeout(() => {
        setFlipped([]);
        lockedRef.current = false;
      }, 800);
    }
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = window.setInterval(() => {
      if (startRef.current) setElapsed(Date.now() - startRef.current);
    }, 250);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing' || finishedRef.current) return;
    if (!deck.length || matched.length < pairs) return;
    finishedRef.current = true;

    const durationMs = startRef.current ? Date.now() - startRef.current : 0;
    const base = pairs >= 8 ? 15 : 10;
    const perfect = attempts <= pairs ? 5 : 0;
    const comboBonus = maxCombo >= pairs ? 2 : maxCombo >= 3 ? 1 : 0;
    const speedBonus = durationMs > 0 && durationMs <= pairs * 7000 ? 3 : 0;
    const earnedReward = payout([
      { label: pairs >= 8 ? '8쌍 클리어' : '6쌍 클리어', value: base },
      { label: '퍼펙트 보너스', value: perfect },
      { label: '콤보 보너스', value: comboBonus },
      { label: '스피드 보너스', value: speedBonus },
    ]);
    store.recordGameSession(student.id, {
      pairs,
      attempts,
      durationMs,
      cashEarned: earnedReward.earned,
      wrongWordIds: wrongIds,
      game: 'match',
      score: pairs,
      total: pairs,
    });
    setElapsed(durationMs);
    setReward(earnedReward);
    setPhase('done');
    sfx.win();
    window.setTimeout(() => sfx.reward(), 420);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched, attempts, phase, pairs, maxCombo]);

  const restart = (nextPairs = pairs) => {
    setPairs(nextPairs);
    setRound((r) => r + 1);
    setPhase('playing');
    setFlipped([]);
    setMatched([]);
    setAttempts(0);
    setCombo(0);
    setMaxCombo(0);
    setWrongIds([]);
    setElapsed(0);
    setReward(null);
    setComboFlash(0);
    startRef.current = null;
    lockedRef.current = false;
    finishedRef.current = false;
  };

  const total = pairs * 2;
  const cleared = matched.length;
  const speedTargetSec = pairs * 7;
  const remainSec = Math.max(0, speedTargetSec - Math.floor(elapsed / 1000));
  const wrongWords = wrongIds.map((id) => wordOf(id)).filter((w): w is Word => !!w);

  return (
    <div className="space-y-3">
      {reward ? (
        <GameResult
          emoji="🃏"
          title="짝맞추기 성공! 🎉"
          stats={`${pairs}쌍 · 시도 ${attempts}회 · 콤보 최대 ${maxCombo} · ${formatDuration(elapsed)}`}
          reward={reward}
          limit={limit}
          onReplay={() => restart()}
          onMenu={onMenu}
          onShop={onShop}
          menuLabel="게임 목록"
          extras={<WrongWords words={wrongWords} />}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {PAIR_OPTIONS.map((opt) => (
          <button
            key={opt.pairs}
            data-testid={`game-pairs-${opt.pairs}`}
            onClick={() => restart(opt.pairs)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[11px] font-bold transition',
              pairs === opt.pairs ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
            )}
          >
            {opt.label}
          </button>
        ))}
        <span className="flex-1" />
        <span className="text-[11px] font-semibold text-slate-500" data-testid="game-stats">
          {phase === 'playing'
            ? `⏱ 남은 ${remainSec}초 · 시도 ${attempts}회 · ${cleared}/${pairs}쌍`
            : `⏱ ${formatDuration(elapsed)} · 시도 ${attempts}회 · ${cleared}/${pairs}쌍`}
        </span>
      </div>

      <div className="relative">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }} data-testid="game-board">
          {deck.map((cell, index) => {
            const word = wordOf(cell.wordId);
            const isMatched = matched.includes(cell.pairId);
            const isFlipped = flipped.includes(index) || isMatched;
            return (
              <button
                key={cell.key}
                data-testid={`game-card-${index}`}
                data-pair={cell.pairId}
                data-face={cell.face}
                data-word={word?.word ?? ''}
                aria-label={isFlipped ? (cell.face === 'en' ? word?.word : word?.meaning) : '뒤집히지 않은 카드'}
                onClick={(e) => flip(index, e)}
                disabled={isMatched || phase === 'done'}
                className={cn(
                  'card-flip relative aspect-[4/5] w-full select-none rounded-2xl outline-none transition',
                  isMatched ? 'opacity-70' : 'active:scale-[0.97]'
                )}
              >
                <div className={cn('card-inner relative h-full w-full', isFlipped && 'flipped')}>
                  <div className="card-face absolute inset-0 grid place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-700 text-white shadow-soft">
                    <span className="text-xl opacity-90">🃏</span>
                    <span className="absolute inset-1.5 rounded-xl border border-white/20" />
                  </div>
                  <div
                    className={cn(
                      'card-face card-back absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl px-1.5 text-center shadow-soft',
                      isMatched
                        ? 'bg-emerald-50 ring-2 ring-emerald-300'
                        : cell.face === 'en'
                          ? 'bg-white ring-1 ring-slate-200'
                          : 'bg-amber-50 ring-1 ring-amber-200'
                    )}
                  >
                    <span
                      className={cn(
                        'break-keep font-bold leading-tight',
                        cell.face === 'en' ? 'text-[13px] text-slate-900' : 'text-[12px] text-amber-900'
                      )}
                    >
                      {cell.face === 'en' ? word?.word : word?.meaning}
                    </span>
                    {isMatched ? <span className="text-[10px] font-bold text-emerald-600">✓</span> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {comboFlash >= 2 ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="animate-pop rounded-2xl bg-slate-900/85 px-4 py-2 text-lg font-extrabold text-white shadow-card">
              {comboFlash}콤보! 🔥
            </span>
          </div>
        ) : null}

        {burst ? (
          <div className="pointer-events-none fixed z-30" style={{ left: burst.x, top: burst.y }} key={burstKey}>
            <SparkBurst count={14} />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-white">
        <div className="flex items-center gap-2">
          <LevelPill level={student.level} />
          <span className="text-[10.5px] text-slate-400">{LEVEL_META[student.level].grades} 단어</span>
        </div>
        <span className="text-[10.5px] font-semibold text-slate-500">
          {remaining === 0 ? '연습 모드' : `오늘 ${remaining}원 더 모을 수 있어요`}
        </span>
      </div>

      <Card className="bg-white/70 p-3.5">
        <p className="text-[11px] leading-relaxed text-slate-500">
          카드를 뒤집어 영단어와 뜻을 짝지어요. {speedTargetSec}초 안에 끝내면 스피드 +3원, 한 번도 틀리지 않으면 퍼펙트 +5원,
          콤보를 이어 가면 콤보 보너스까지 붙어요.
        </p>
      </Card>

      {combo >= 3 && phase === 'playing' ? (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-30 flex justify-center">
          <Badge tone="sun">🔥 {combo}콤보 진행 중</Badge>
        </div>
      ) : null}
    </div>
  );
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}분 ${String(s).padStart(2, '0')}초` : `${s}초`;
}
