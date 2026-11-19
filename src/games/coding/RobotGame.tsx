import { useEffect, useMemo, useRef, useState } from 'react';
import { useVocaStore } from '../../app-context';
import { sfx } from '../../lib/sound';
import { cn } from '../../lib/util';
import type { Student } from '../../types';
import { GameResult, SparkBurst, usePayout, type Reward } from '../common';

type Cmd = 'F' | 'L' | 'R' | 'REP';

interface StageDef {
  name: string;
  hint: string;
  /** 5줄 × 5칸. . 바닥 · # 벽 · S 시작 · G 목표 · o 코인 */
  grid: string[];
  /** 방향 0=위 1=오른쪽 2=아래 3=왼쪽 */
  dir: number;
  par: number;
  max: number;
  solution: Cmd[];
}

const STAGES: StageDef[] = [
  {
    name: '1. 첫 걸음',
    hint: '깃발까지 곧장! 코인도 빠짐없이 주워요.',
    grid: ['.....', '.....', '.....', '.....', 'SoooG'],
    dir: 1,
    par: 4,
    max: 6,
    solution: ['F', 'F', 'F', 'F'],
  },
  {
    name: '2. 모퉁이를 돌아',
    hint: '위로 쭉 간 뒤 오른쪽으로 회전!',
    grid: ['..G..', 'o#.#.', 'o#.#.', 'o....', 'S.##.'],
    dir: 0,
    par: 7,
    max: 9,
    solution: ['F', 'F', 'F', 'F', 'R', 'F', 'F'],
  },
  {
    name: '3. 반복의 힘',
    hint: '🔁 2회 반복을 쓰면 긴 직진도 명령 2개로!',
    grid: ['S.o..', '####.', '....o', '.###.', '....G'],
    dir: 1,
    par: 9,
    max: 11,
    solution: ['F', 'F', 'REP', 'F', 'R', 'F', 'F', 'REP', 'F'],
  },
  {
    name: '4. 지그재그',
    hint: '벽을 피해 ㄹ자로! 반복 블록을 활용해요.',
    grid: ['S.o..', '.###o', '....G', '.###.', '.....'],
    dir: 1,
    par: 7,
    max: 9,
    solution: ['F', 'F', 'F', 'F', 'R', 'F', 'F'],
  },
  {
    name: '5. 마지막 미로',
    hint: '코인 2개를 모으고 구석의 깃발까지!',
    grid: ['S....', '.#.#.', '.o.o.', '.#.#.', '...G.'],
    dir: 2,
    par: 12,
    max: 14,
    solution: ['F', 'F', 'L', 'F', 'F', 'F', 'F', 'R', 'F', 'F', 'R', 'F'],
  },
];

const DIRS: [number, number][] = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

const CMD_META: Record<Cmd, { icon: string; label: string }> = {
  F: { icon: '⬆️', label: '앞으로' },
  L: { icon: '↩️', label: '좌회전' },
  R: { icon: '↪️', label: '우회전' },
  REP: { icon: '🔁', label: '2회 반복' },
};

function parseStage(stage: StageDef) {
  const walls = new Set<string>();
  const coins: string[] = [];
  let start = { r: 4, c: 0 };
  let goal = { r: 0, c: 4 };
  stage.grid.forEach((row, r) => {
    row.split('').forEach((ch, c) => {
      const key = `${r}-${c}`;
      if (ch === '#') walls.add(key);
      if (ch === 'o') coins.push(key);
      if (ch === 'S') start = { r, c };
      if (ch === 'G') goal = { r, c };
    });
  });
  return { walls, coins, start, goal };
}

function expand(commands: Cmd[]): Cmd[] {
  const out: Cmd[] = [];
  for (let i = 0; i < commands.length; i += 1) {
    const cmd = commands[i];
    if (cmd === 'REP') {
      const next = commands[i + 1];
      if (next && next !== 'REP') {
        out.push(next, next);
        i += 1;
      }
    } else {
      out.push(cmd);
    }
  }
  return out;
}

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** 🤖 로봇 길찾기 — 명령을 조립해 로봇을 실제로 한 칸씩 움직여요 */
export default function RobotGame({
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
  const [stageIndex, setStageIndex] = useState(0);
  const [commands, setCommands] = useState<Cmd[]>([]);
  const [robot, setRobot] = useState(() => {
    const p = parseStage(STAGES[0]);
    return { ...p.start, dir: STAGES[0].dir };
  });
  const [collected, setCollected] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [bumpKey, setBumpKey] = useState(0);
  const [message, setMessage] = useState('명령을 조립하고 ▶ 실행을 눌러요');
  const [stageDone, setStageDone] = useState(false);
  const [sparkKey, setSparkKey] = useState(0);
  const [reward, setReward] = useState<Reward | null>(null);
  const clearedRef = useRef(0);
  const perfectRef = useRef(0);
  const cancelRef = useRef(false);
  const limit = store.cashDailyLimit();

  const stage = STAGES[stageIndex];
  const parsed = useMemo(() => parseStage(stage), [stage]);

  useEffect(
    () => () => {
      cancelRef.current = true;
    },
    []
  );

  const resetRobot = (dir = stage.dir) => {
    setRobot({ ...parsed.start, dir });
    setCollected([]);
    setMessage('명령을 조립하고 ▶ 실행을 눌러요');
    setStageDone(false);
  };

  useEffect(() => {
    resetRobot(stage.dir);
    setCommands([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageIndex]);

  const finish = () => {
    const rows = [
      { label: `스테이지 클리어 ${clearedRef.current} × 2원`, value: clearedRef.current * 2 },
      { label: '퍼펙트 보너스', value: perfectRef.current },
      { label: '올 클리어 보너스', value: clearedRef.current === STAGES.length ? 3 : 0 },
    ];
    const r = payout(rows);
    store.recordCodingSession(student.id, {
      game: 'robot',
      score: clearedRef.current,
      total: STAGES.length,
      cashEarned: r.earned,
      wrongProblemIds: [],
    });
    setReward(r);
    sfx.win();
  };

  const clearStage = () => {
    sfx.goal();
    setSparkKey((k) => k + 1);
    setStageDone(true);
    setMessage('골인! 🎉');
    clearedRef.current += 1;
    if (commands.length <= stage.par) perfectRef.current += 1;
    window.setTimeout(() => {
      if (stageIndex + 1 >= STAGES.length) finish();
      else setStageIndex((i) => i + 1);
    }, 1250);
  };

  const run = async () => {
    if (running || stageDone || !commands.length || reward) return;
    cancelRef.current = false;
    setRunning(true);
    resetRobot(stage.dir);
    setMessage('로봇이 명령을 실행하는 중…');
    await sleep(260);
    const seq = expand(commands);
    let { r, c, dir } = { ...parsed.start, dir: stage.dir };
    const got = new Set<string>();
    for (const cmd of seq) {
      if (cancelRef.current) return;
      if (cmd === 'L') {
        dir = (dir + 3) % 4;
        sfx.turn();
        setRobot({ r, c, dir });
        await sleep(260);
      } else if (cmd === 'R') {
        dir = (dir + 1) % 4;
        sfx.turn();
        setRobot({ r, c, dir });
        await sleep(260);
      } else {
        const [dr, dc] = DIRS[dir];
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr > 4 || nc < 0 || nc > 4 || parsed.walls.has(`${nr}-${nc}`)) {
          sfx.bump();
          setBumpKey((k) => k + 1);
          setRunning(false);
          setMessage('벽에 쿵! 명령을 고쳐서 다시 실행해요');
          return;
        }
        r = nr;
        c = nc;
        sfx.step();
        const key = `${r}-${c}`;
        if (parsed.coins.includes(key) && !got.has(key)) {
          got.add(key);
          setCollected(Array.from(got));
          sfx.coin();
        }
        setRobot({ r, c, dir });
        await sleep(320);
      }
    }
    setRunning(false);
    const atGoal = r === parsed.goal.r && c === parsed.goal.c;
    if (atGoal && got.size === parsed.coins.length) {
      clearStage();
    } else if (atGoal) {
      setMessage(`깃발에 도착했지만 코인이 ${parsed.coins.length - got.size}개 남았어요`);
      sfx.alarm();
    } else {
      setMessage('아직 깃발이 아니에요. 명령을 이어서 붙여 봐요');
      sfx.fail();
    }
  };

  const restart = () => {
    clearedRef.current = 0;
    perfectRef.current = 0;
    setReward(null);
    setStageIndex(0);
    setCommands([]);
    resetRobot(STAGES[0].dir);
    setStageDone(false);
  };

  const toggleCmd = (cmd: Cmd) => {
    if (running || stageDone || reward) return;
    sfx.tap();
    setCommands((list) => {
      if (list.length >= stage.max) return list;
      return [...list, cmd];
    });
  };

  const removeCmd = (index: number) => {
    if (running || stageDone) return;
    sfx.flip();
    setCommands((list) => list.filter((_, i) => i !== index));
  };

  const robotLeft = `${robot.c * 20}%`;
  const robotTop = `${robot.r * 20}%`;

  return (
    <div className="space-y-3">
      {reward ? (
        <GameResult
          emoji="🤖"
          title={clearedRef.current === STAGES.length ? '모든 스테이지 클리어!' : '로봇 미션 종료'}
          stats={`${clearedRef.current} / ${STAGES.length} 스테이지 · 퍼펙트 ${perfectRef.current}`}
          reward={reward}
          limit={limit}
          onReplay={restart}
          onMenu={onMenu}
          onShop={onShop}
          testId="coding-game-summary"
          rewardTestId="coding-game-reward"
          replayLabel="다시 출발"
          menuLabel="게임 목록"
          accent="dark"
        />
      ) : null}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-extrabold text-slate-900" data-testid="cod-robot-stage">
            {stage.name}
          </p>
          <p className="text-[10.5px] text-slate-500">{stage.hint}</p>
        </div>
        <div className="flex items-center gap-1">
          {STAGES.map((s, i) => (
            <span
              key={s.name}
              className={cn(
                'h-1.5 w-4 rounded-full',
                i < stageIndex ? 'bg-emerald-400' : i === stageIndex ? 'bg-slate-900' : 'bg-slate-200'
              )}
            />
          ))}
        </div>
      </div>

      {/* 무대 */}
      <div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 p-2.5 shadow-card ring-1 ring-white/10"
        data-testid="cod-robot-grid"
        data-solution={stage.solution.join(',')}
        data-par={stage.par}
      >
        <div className="relative aspect-square w-full">
          <div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-[3px]">
            {Array.from({ length: 25 }).map((_, i) => {
              const r = Math.floor(i / 5);
              const c = i % 5;
              const key = `${r}-${c}`;
              const wall = parsed.walls.has(key);
              const coin = parsed.coins.includes(key) && !collected.includes(key);
              const isGoal = parsed.goal.r === r && parsed.goal.c === c;
              return (
                <div
                  key={key}
                  data-testid={`cod-robot-cell-${r}-${c}`}
                  className={cn(
                    'relative flex items-center justify-center rounded-[7px]',
                    wall
                      ? 'bg-[repeating-linear-gradient(135deg,#475569_0_5px,#334155_5px_10px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-2px_0_rgba(0,0,0,0.45)]'
                      : 'bg-slate-800/40 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]'
                  )}
                >
                  {wall ? null : isGoal ? (
                    <span className="goal-glow text-[22px] leading-none" data-testid="cod-robot-goal">
                      🚩
                    </span>
                  ) : coin ? (
                    <span className="coin-pop-src text-[16px] leading-none drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]">🪙</span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* 로봇 */}
          <div
            key={`robot-${bumpKey}`}
            className={cn('pointer-events-none absolute z-10 h-1/5 w-1/5 transition-all duration-300 ease-out', bumpKey ? 'robot-bump' : '')}
            style={
              {
                left: robotLeft,
                top: robotTop,
                '--rx': robotLeft,
                '--ry': robotTop,
                '--rot': `${robot.dir * 90}deg`,
              } as React.CSSProperties
            }
            data-testid="cod-robot"
          >
            <div className="grid h-full w-full place-items-center p-1.5">
              <div className="drone-float relative h-full w-full" style={{ transform: `rotate(${robot.dir * 90}deg)` }}>
                <svg viewBox="0 0 60 60" className="h-full w-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
                  <defs>
                    <linearGradient id="robotBody" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7dd3fc" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                  <rect x="8" y="40" width="12" height="8" rx="3" fill="#1e293b" />
                  <rect x="40" y="40" width="12" height="8" rx="3" fill="#1e293b" />
                  <circle cx="30" cy="14" r="5" fill="#fbbf24" />
                  <rect x="28.5" y="14" width="3" height="8" rx="1.5" fill="#94a3b8" />
                  <rect x="12" y="20" width="36" height="30" rx="11" fill="url(#robotBody)" stroke="#0369a1" strokeWidth="1.5" />
                  <rect x="18" y="27" width="24" height="12" rx="6" fill="#0f172a" />
                  <circle cx="24" cy="33" r="3" fill="#67e8f9" />
                  <circle cx="36" cy="33" r="3" fill="#67e8f9" />
                  <rect x="22" y="44" width="16" height="3" rx="1.5" fill="#e0f2fe" opacity="0.7" />
                  <path d="M12 32 L6 32" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                  <path d="M48 32 L54 32" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                </svg>
                {stageDone ? (
                  <span className="absolute inset-0 grid place-items-center" key={sparkKey}>
                    <SparkBurst count={16} />
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-2 rounded-xl bg-white/10 px-2.5 py-1.5 text-center text-[10.5px] font-semibold text-cyan-100" data-testid="cod-robot-message">
          {message}
        </p>
      </div>

      {/* 명령 조립 */}
      <div className="rounded-3xl bg-white p-3 shadow-soft ring-1 ring-white">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold text-slate-500">
            내 명령 <span className="text-slate-900">{commands.length}</span> / {stage.max}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">목표 {stage.par}개 이내 = 퍼펙트</span>
        </div>

        <div className="mt-1.5 flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-2xl bg-slate-50 p-1.5" data-testid="cod-robot-queue">
          {commands.length === 0 ? (
            <span className="px-1.5 text-[11px] text-slate-400">아래 명령 버튼을 눌러 순서대로 쌓아 보세요</span>
          ) : (
            commands.map((cmd, i) => (
              <button
                key={`${cmd}-${i}`}
                onClick={() => removeCmd(i)}
                className={cn(
                  'flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-bold shadow-sm active:scale-95',
                  cmd === 'REP' ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200' : 'bg-white text-slate-700 ring-1 ring-slate-200'
                )}
                title="눌러서 빼기"
              >
                <span className="text-[10px] text-slate-400">{i + 1}</span>
                {CMD_META[cmd].icon} {cmd === 'REP' ? '×2' : CMD_META[cmd].label}
              </button>
            ))
          )}
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {(['F', 'L', 'R', 'REP'] as Cmd[]).map((cmd) => (
            <button
              key={cmd}
              data-testid={`cod-robot-cmd-${cmd}`}
              onClick={() => toggleCmd(cmd)}
              disabled={running || stageDone || !!reward}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-2xl py-2.5 text-[10px] font-bold transition active:scale-95 disabled:opacity-40',
                cmd === 'REP' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-white'
              )}
            >
              <span className="text-base">{CMD_META[cmd].icon}</span>
              {CMD_META[cmd].label}
            </button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button
            data-testid="cod-robot-run"
            onClick={run}
            disabled={running || stageDone || !commands.length || !!reward}
            className="rounded-2xl bg-emerald-500 py-3 text-[13px] font-extrabold text-white shadow-soft transition active:scale-[0.98] disabled:opacity-40"
          >
            {running ? '실행 중…' : '▶ 실행'}
          </button>
          <button
            data-testid="cod-robot-reset"
            onClick={() => {
              setCommands([]);
              resetRobot(stage.dir);
              sfx.flip();
            }}
            disabled={running || stageDone}
            className="rounded-2xl bg-slate-100 py-3 text-[13px] font-bold text-slate-600 transition active:scale-[0.98] disabled:opacity-40"
          >
            ↺ 처음부터
          </button>
        </div>
      </div>

      <p className="text-center text-[10.5px] text-slate-400">
        🔁 2회 반복은 바로 다음 명령을 두 번 실행해요. 벽에 부딪히면 멈추니 명령을 고쳐 다시 실행!
      </p>
    </div>
  );
}
