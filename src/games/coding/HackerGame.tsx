import { useEffect, useMemo, useRef, useState } from 'react';
import { useVocaStore } from '../../app-context';
import { buildGameProblems, shuffleChoices } from '../../lib/coding';
import { sfx } from '../../lib/sound';
import { cn } from '../../lib/util';
import type { CodingProblem, Student } from '../../types';
import { GameResult, usePayout, type Reward } from '../common';

/** 터미널 배경의 매트릭스 비 (가볍게 24fps) */
function MatrixRain({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let last = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width));
      canvas.height = Math.max(1, Math.round(rect.height));
    };
    resize();
    const cols = () => Math.max(8, Math.floor(canvas.width / 16));
    let drops = Array.from({ length: cols() }, () => Math.random() * canvas.height);
    const glyphs = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ{}[]()<>=;:$#'.split('');
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 45) return;
      last = now;
      if (canvas.width !== Math.round(canvas.getBoundingClientRect().width)) {
        resize();
        drops = Array.from({ length: cols() }, () => Math.random() * canvas.height);
      }
      ctx.fillStyle = 'rgba(2, 6, 23, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '12px ui-monospace, monospace';
      drops.forEach((y, i) => {
        const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
        const x = i * 16;
        ctx.fillStyle = Math.random() > 0.92 ? 'rgba(190,242,255,0.85)' : 'rgba(34,197,94,0.55)';
        ctx.fillText(ch, x, y);
        drops[i] = y > canvas.height && Math.random() > 0.975 ? 0 : y + 15;
      });
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full opacity-40" aria-hidden />;
}

const BOOT_LINES = [
  '> rafine_net uplink ........ OK',
  '> proxy chain 3 hops ..... OK',
  '> firewall scanner ....... READY',
  '> target: rafine-class.local',
];

/** 🕵️ 해커 침투 미션 — 3단계 방화벽 암호를 풀면 ACCESS GRANTED */
export default function HackerGame({
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
  const [round, setRound] = useState(0);
  const problems = useMemo(
    () => buildGameProblems('hacker', student.coding_level),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [student.coding_level, round]
  );
  const [index, setIndex] = useState(0);
  const [trace, setTrace] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [openLocks, setOpenLocks] = useState<number[]>([]);
  const [bootStep, setBootStep] = useState(0);
  const [granted, setGranted] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [failed, setFailed] = useState(false);
  const [wrongProblems, setWrongProblems] = useState<CodingProblem[]>([]);
  const solvedRef = useRef(0);
  const wrongTries = useRef(0);
  const loggedRef = useRef<Set<string>>(new Set());
  const limit = store.cashDailyLimit();

  const problem = problems[index];
  const options = useMemo(() => (problem ? shuffleChoices(problem) : { choices: [], answer: 0 }), [problem]);

  useEffect(() => {
    setBootStep(0);
    const timers = BOOT_LINES.map((_, i) => window.setTimeout(() => setBootStep(i + 1), 260 * (i + 1)));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [round]);

  const finish = (win: boolean) => {
    const rows = [
      { label: `방화벽 해제 ${solvedRef.current} × 3원`, value: solvedRef.current * 3 },
      { label: '완전 침투 보너스', value: win ? 2 : 0 },
      { label: '무흔적 보너스', value: win && wrongTries.current === 0 ? 2 : 0 },
    ];
    const r = payout(rows);
    store.recordCodingSession(student.id, {
      game: 'hacker',
      score: solvedRef.current,
      total: problems.length,
      cashEarned: r.earned,
      wrongProblemIds: wrongProblems.map((p) => p.id),
    });
    setReward(r);
    if (win) {
      setGranted(true);
      sfx.grant();
      window.setTimeout(() => sfx.reward(), 600);
    } else {
      setFailed(true);
      sfx.defeat();
    }
  };

  const answer = (i: number) => {
    if (!problem || picked !== null || reward) return;
    setPicked(i);
    const correct = i === options.answer;
    if (!loggedRef.current.has(problem.id)) {
      loggedRef.current.add(problem.id);
      store.recordCodingAnswer(student, problem, correct, 'game');
    }
    if (correct) {
      sfx.lockOpen();
      setOpenLocks((l) => [...l, index]);
      solvedRef.current += 1;
      window.setTimeout(() => {
        if (index + 1 >= problems.length) {
          finish(true);
        } else {
          setIndex((n) => n + 1);
          setPicked(null);
        }
      }, 1250);
    } else {
      sfx.trace();
      wrongTries.current += 1;
      setTrace((t) => t + 1);
      setWrongProblems((w) => (w.some((p) => p.id === problem.id) ? w : [...w, problem]));
      if (wrongTries.current >= 3) {
        window.setTimeout(() => finish(false), 900);
      } else {
        window.setTimeout(() => setPicked(null), 900);
      }
    }
  };

  const restart = () => {
    solvedRef.current = 0;
    wrongTries.current = 0;
    loggedRef.current = new Set();
    setRound((r) => r + 1);
    setIndex(0);
    setTrace(0);
    setPicked(null);
    setOpenLocks([]);
    setGranted(false);
    setReward(null);
    setFailed(false);
    setWrongProblems([]);
  };

  if (!problem) {
    return <p className="rounded-2xl bg-slate-900 p-6 text-center text-sm text-slate-300">해킹 문제를 준비하고 있어요.</p>;
  }

  return (
    <div className="space-y-3">
      {reward ? (
        <GameResult
          emoji={granted ? '🕵️' : '🚨'}
          title={granted ? 'ACCESS GRANTED — 침투 성공!' : 'TRACE DETECTED — 발각됐어요'}
          stats={`방화벽 ${solvedRef.current} / ${problems.length} 해제 · 경보 ${trace}회`}
          reward={reward}
          limit={limit}
          onReplay={restart}
          onMenu={onMenu}
          onShop={onShop}
          testId="coding-game-summary"
          rewardTestId="coding-game-reward"
          replayLabel="다시 침투"
          menuLabel="게임 목록"
          accent="dark"
        />
      ) : null}

      {/* 터미널 */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-card ring-1 ring-emerald-400/20">
        <MatrixRain active={!reward} />
        <div className="relative">
          {/* 창 상단 */}
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-slate-900/80 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="ml-1.5 font-mono text-[9.5px] text-slate-400">root@rafine — secure shell</span>
            <span className="ml-auto rounded bg-emerald-400/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-300">
              {granted ? 'CONNECTED' : `TRACE ${trace}/3`}
            </span>
          </div>

          <div className="px-3 pb-3 pt-2 font-mono text-[10px] leading-relaxed text-emerald-300/90">
            {BOOT_LINES.slice(0, bootStep).map((line) => (
              <p key={line} className="caret">
                {line}
              </p>
            ))}
            {bootStep >= BOOT_LINES.length ? (
              <p className="text-cyan-300">
                {index + 1}번째 방화벽을 찾았습니다. 암호를 해독하세요<span className="caret">_</span>
              </p>
            ) : null}
          </div>

          {/* 자물쇠 3단계 */}
          <div className="relative flex items-center justify-around px-4 pb-3">
            {problems.map((_, i) => {
              const open = openLocks.includes(i);
              const current = i === index && !open;
              return (
                <div key={i} className="flex flex-col items-center gap-1" data-testid={`cod-hacker-lock-${i}`} data-open={open ? '1' : '0'}>
                  <svg viewBox="0 0 40 48" className="h-10 w-9">
                    <path
                      d="M12 22 V15 a8 8 0 0 1 16 0 V22"
                      fill="none"
                      stroke={open ? '#34d399' : current ? '#fbbf24' : '#475569'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      className={open ? 'lock-open' : ''}
                      style={{ transformOrigin: '20px 22px' }}
                    />
                    <rect x="7" y="22" width="26" height="21" rx="6" fill={open ? '#065f46' : current ? '#78350f' : '#1e293b'} stroke={open ? '#34d399' : current ? '#fbbf24' : '#475569'} strokeWidth="2" />
                    <circle cx="20" cy="31" r="3" fill={open ? '#6ee7b7' : '#94a3b8'} />
                    <rect x="18.6" y="32" width="2.8" height="6" rx="1.4" fill={open ? '#6ee7b7' : '#94a3b8'} />
                  </svg>
                  <span className={cn('text-[8.5px] font-bold', open ? 'text-emerald-300' : current ? 'text-amber-300' : 'text-slate-500')}>
                    FW{i + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 경보 */}
          <div className="mx-3 mb-3 flex items-center gap-1.5" data-testid="cod-hacker-trace">
            <span className="font-mono text-[9px] text-slate-400">TRACE</span>
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < trace ? 'bg-rose-500' : 'bg-white/10')} />
            ))}
          </div>

          {granted ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-950/60 backdrop-blur-[1px]" data-testid="cod-hacker-granted">
              <div className="text-center">
                <p className="glitch-text text-[24px] font-black tracking-widest text-emerald-300 drop-shadow-[0_0_18px_rgba(52,211,153,0.8)]">
                  ACCESS GRANTED
                </p>
                <p className="mt-1 font-mono text-[10px] text-emerald-200/70">3 / 3 firewalls bypassed</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 암호 해독 문제 */}
      <div className="rounded-3xl bg-white p-3.5 shadow-soft">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono text-[9.5px] font-bold text-emerald-300">FW {index + 1}</span>
          <span className="text-[10px] font-semibold text-slate-400">{problem.topic}</span>
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-bold text-slate-500">{problem.level}</span>
        </div>
        <p className="mt-1.5 text-[12.5px] font-bold leading-snug text-slate-900" data-testid="cod-hacker-prompt">
          🔐 {problem.prompt}
        </p>

        {problem.code ? (
          <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 px-3 py-2.5 text-[11.5px] leading-relaxed text-emerald-200 thin-scroll" data-testid="cod-hacker-code">
            <code>{problem.code}</code>
          </pre>
        ) : null}

        <div className="mt-2 space-y-1.5">
          {options.choices.map((choice, i) => {
            const isAnswer = i === options.answer;
            const state = picked === null ? 'idle' : isAnswer ? 'right' : picked === i ? 'wrong' : 'dim';
            return (
              <button
                key={`${choice}-${i}`}
                data-testid={`cod-hacker-option-${i}`}
                data-correct={isAnswer ? '1' : '0'}
                disabled={picked !== null || !!reward}
                onClick={() => answer(i)}
                className={cn(
                  'flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left font-mono text-[11.5px] font-semibold transition active:scale-[0.99]',
                  state === 'idle' && 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-white',
                  state === 'right' && 'bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300',
                  state === 'wrong' && 'bg-rose-50 text-rose-700 ring-2 ring-rose-300',
                  state === 'dim' && 'bg-slate-50 text-slate-400 ring-1 ring-slate-100'
                )}
              >
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded bg-slate-900 text-[9px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="whitespace-pre-line">{choice}</span>
              </button>
            );
          })}
        </div>

        {picked !== null ? (
          <div className="animate-pop mt-2 rounded-xl bg-slate-50 px-3 py-2" data-testid="cod-hacker-feedback">
            <p className={cn('text-[11px] font-bold', picked === options.answer ? 'text-emerald-600' : 'text-rose-500')}>
              {picked === options.answer ? '🔓 암호 해독 성공! 자물쇠가 열렸어요' : '⚠️ 잘못된 암호 — 추적 경보가 올라갔어요'}
            </p>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-500">{problem.explanation}</p>
          </div>
        ) : (
          <p className="mt-2 text-center text-[10px] text-slate-400">
            암호를 풀 때마다 방화벽이 하나씩 열려요. 3번 틀리면 추적당해 미션이 끝나요.
          </p>
        )}
      </div>

      {failed ? <p className="text-center text-[10.5px] font-bold text-rose-500">추적당했어요… 다시 침투해 보세요</p> : null}
    </div>
  );
}
