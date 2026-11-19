import { useEffect, useMemo, useRef, useState } from 'react';
import { useVocaStore } from '../../app-context';
import { sfx } from '../../lib/sound';
import { shuffle } from '../../lib/util';
import type { Student } from '../../types';
import { GameResult, SparkBurst, usePayout, type Reward } from '../common';
import { cn } from '../../lib/util';

interface Vec {
  x: number;
  y: number;
}
interface Round {
  target: Vec;
  vector: Vec;
  distance: number;
  label: string;
}

const VECTORS: { v: Vec; label: string; name: string }[] = [
  { v: { x: 1, y: 0 }, label: 'Vector3(1, 0, 0)', name: '오른쪽' },
  { v: { x: -1, y: 0 }, label: 'Vector3(-1, 0, 0)', name: '왼쪽' },
  { v: { x: 0, y: 1 }, label: 'Vector3(0, 1, 0)', name: '위' },
  { v: { x: 0, y: -1 }, label: 'Vector3(0, -1, 0)', name: '아래' },
];

function makeRounds(count = 5): Round[] {
  const dirs = shuffle(VECTORS);
  return Array.from({ length: count }, (_, i) => {
    const dir = dirs[i % dirs.length];
    const distance = i < 2 ? 1 : 1 + Math.floor(Math.random() * 2);
    return {
      vector: dir.v,
      label: dir.label,
      distance,
      target: { x: dir.v.x * distance, y: dir.v.y * distance },
    };
  });
}

const RANGE = 2; // -2 .. 2 (5×5)
const norm = (x: number, y: number) => ({ left: `${((x + RANGE) / (RANGE * 2)) * 100}%`, top: `${((RANGE - y) / (RANGE * 2)) * 100}%` });

/** 🎮 유니티 방향·좌표 퀴즈 — Vector3 방향을 고르면 캐릭터가 실제로 그 방향으로 날아가요 */
export default function UnityGame({
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
  const [roundKey, setRoundKey] = useState(0);
  const rounds = useMemo(() => makeRounds(5), [roundKey]);
  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState<Vec>({ x: 0, y: 0 });
  const [phase, setPhase] = useState<'idle' | 'moving' | 'wrong' | 'right'>('idle');
  const [picked, setPicked] = useState<number | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [score, setScore] = useState(0);
  const [spark, setSpark] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [trail, setTrail] = useState<Vec[]>([]);
  const scoreRef = useRef(0);
  const limit = store.cashDailyLimit();

  const round = rounds[index];
  const options = useMemo(() => shuffle(VECTORS), [index, roundKey]);
  const answerIndex = round ? options.findIndex((o) => o.v.x === round.vector.x && o.v.y === round.vector.y) : -1;

  useEffect(() => {
    setPos({ x: 0, y: 0 });
    setTrail([]);
    setPicked(null);
    setPhase('idle');
  }, [index]);

  const finish = () => {
    const rows = [
      { label: `정답 ${scoreRef.current} × 2원`, value: scoreRef.current * 2 },
      { label: '만점 보너스', value: scoreRef.current === rounds.length ? 2 : 0 },
    ];
    const r = payout(rows);
    store.recordCodingSession(student.id, {
      game: 'unity',
      score: scoreRef.current,
      total: rounds.length,
      cashEarned: r.earned,
      wrongProblemIds: [],
    });
    setReward(r);
    sfx.win();
  };

  const choose = (i: number) => {
    if (!round || phase !== 'idle' || reward) return;
    setPicked(i);
    const chosen = options[i];
    const correct = i === answerIndex;
    setPhase('moving');
    sfx.fly();
    setTrail([{ x: 0, y: 0 }]);

    if (correct) {
      /* 한 칸 움직인 뒤 목표까지 미끄러져요 */
      window.setTimeout(() => {
        setPos({ x: chosen.v.x * (round.distance >= 2 ? 1 : 1), y: chosen.v.y });
        if (round.distance >= 2) {
          window.setTimeout(() => setPos(round.target), 380);
        }
      }, 60);
      window.setTimeout(() => {
        setPhase('right');
        setSpark((k) => k + 1);
        scoreRef.current += 1;
        setScore(scoreRef.current);
        sfx.goal();
      }, 760);
      window.setTimeout(() => {
        if (index + 1 >= rounds.length) finish();
        else setIndex((n) => n + 1);
      }, 1650);
    } else {
      window.setTimeout(() => {
        setPos({ x: chosen.v.x, y: chosen.v.y });
      }, 60);
      window.setTimeout(() => {
        setPhase('wrong');
        sfx.bump();
        setWrongCount((n) => n + 1);
      }, 620);
      window.setTimeout(() => {
        setPos({ x: 0, y: 0 });
        setTrail([]);
      }, 1150);
      window.setTimeout(() => {
        if (index + 1 >= rounds.length) finish();
        else setIndex((n) => n + 1);
      }, 2100);
    }
  };

  const restart = () => {
    scoreRef.current = 0;
    setScore(0);
    setWrongCount(0);
    setRoundKey((k) => k + 1);
    setIndex(0);
    setReward(null);
    setPhase('idle');
    setPicked(null);
  };

  if (!round) return <p className="rounded-2xl bg-slate-900 p-6 text-center text-sm text-slate-300">좌표 퀴즈를 준비하고 있어요.</p>;

  const charPos = norm(pos.x, pos.y);
  const starPos = norm(round.target.x, round.target.y);

  return (
    <div className="space-y-3">
      {reward ? (
        <GameResult
          emoji="🎮"
          title="좌표 미션 클리어!"
          stats={`정답 ${score} / ${rounds.length} · 틀린 방향 ${wrongCount}`}
          reward={reward}
          limit={limit}
          onReplay={restart}
          onMenu={onMenu}
          onShop={onShop}
          testId="coding-game-summary"
          rewardTestId="coding-game-reward"
          menuLabel="게임 목록"
          accent="dark"
        />
      ) : null}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-extrabold text-slate-900">🎮 유니티 좌표 무대</p>
          <p className="text-[10.5px] text-slate-500">별의 위치를 보고 더해야 할 Vector3를 고르세요</p>
        </div>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white" data-testid="cod-unity-progress">
          {index + 1} / {rounds.length}
        </span>
      </div>

      {/* 좌표 무대 */}
      <div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-2.5 shadow-card ring-1 ring-white/10"
        data-testid="cod-unity-grid"
        data-target={`${round.target.x},${round.target.y}`}
      >
        <div className="relative h-[300px] w-full rounded-2xl bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.25),transparent_70%)] sm:h-[330px]">
          {/* 격자 */}
          <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="border border-indigo-400/15" />
            ))}
          </div>
          {/* 축 */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-300/60" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-300/60" />
          <span className="absolute right-1.5 top-1/2 -translate-y-3 text-[10px] font-bold text-cyan-300">X+</span>
          <span className="absolute left-1.5 top-1/2 -translate-y-3 text-[10px] font-bold text-cyan-300">X-</span>
          <span className="absolute left-1/2 top-1.5 -translate-x-3 text-[10px] font-bold text-cyan-300">Y+</span>
          <span className="absolute bottom-1.5 left-1/2 -translate-x-3 text-[10px] font-bold text-cyan-300">Y-</span>
          {/* 원점 */}
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />

          {/* 이동 궤적 */}
          {trail.length ? (
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              <line
                x1="50%"
                y1="50%"
                x2={charPos.left}
                y2={charPos.top}
                stroke="#67e8f9"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="trail-fade"
              />
            </svg>
          ) : null}

          {/* 별 */}
          <div
            className="star-pulse absolute z-10 -translate-x-1/2 -translate-y-1/2 text-[30px] leading-none"
            style={{ left: starPos.left, top: starPos.top }}
            data-testid="cod-unity-star"
          >
            ⭐
            {phase === 'right' ? (
              <span className="pointer-events-none absolute inset-0 grid place-items-center" key={spark}>
                <SparkBurst count={18} color="#facc15" />
              </span>
            ) : null}
          </div>

          {/* 캐릭터 */}
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
            style={{ left: charPos.left, top: charPos.top, width: '18%' }}
            data-testid="cod-unity-char"
            data-pos={`${pos.x},${pos.y}`}
          >
            <div
              className={cn(
                'relative rounded-full bg-gradient-to-br from-cyan-300 to-indigo-500 p-0.5 shadow-[0_0_16px_rgba(34,211,238,0.6)]',
                phase === 'wrong' && 'animate-shake ring-4 ring-rose-400/70'
              )}
            >
              <svg viewBox="0 0 40 40" className="h-full w-full">
                <circle cx="20" cy="20" r="17" fill="#0f172a" opacity="0.75" />
                <circle cx="20" cy="17" r="9" fill="#fde68a" />
                <circle cx="17" cy="16" r="1.8" fill="#1e293b" />
                <circle cx="23" cy="16" r="1.8" fill="#1e293b" />
                <path d="M17 21 Q20 23.5 23 21" stroke="#b45309" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                <path d="M20 8 L20 4" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
                <circle cx="20" cy="3" r="2" fill="#67e8f9" />
              </svg>
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/80 px-1.5 text-[8px] font-bold text-cyan-200">
              ({pos.x}, {pos.y})
            </span>
          </div>
        </div>

        {/* 코드 트레이스 */}
        <div className="mt-2 rounded-xl bg-black/45 px-2.5 py-1.5 font-mono text-[10px] leading-relaxed text-emerald-300/90 ring-1 ring-white/10">
          <span className="text-slate-500">// 목표 </span>star.position = Vector3({round.target.x}, {round.target.y}, 0)
          <br />
          <span className="text-slate-500">// 내 위치 </span>transform.position = Vector3({pos.x}, {pos.y}, 0)
        </div>
      </div>

      <div className="rounded-3xl bg-white p-3.5 shadow-soft">
        <p className="text-[12px] font-bold text-slate-800" data-testid="cod-unity-prompt">
          ⭐ 별까지 가려면 <span className="text-brand-700">{round.distance === 1 ? '한 칸' : '두 칸'}</span> 움직여야 해요. 어떤 방향 벡터를 더할까요?
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {options.map((opt, i) => {
            const isAnswer = i === answerIndex;
            const state = picked === null ? 'idle' : isAnswer ? 'right' : picked === i ? 'wrong' : 'dim';
            return (
              <button
                key={opt.label}
                data-testid={`cod-unity-option-${i}`}
                data-correct={isAnswer ? '1' : '0'}
                disabled={picked !== null || !!reward}
                onClick={() => choose(i)}
                className={cn(
                  'rounded-2xl px-2.5 py-3 text-left transition active:scale-[0.98]',
                  state === 'idle' && 'bg-slate-50 ring-1 ring-slate-200 hover:bg-white',
                  state === 'right' && 'bg-emerald-50 ring-2 ring-emerald-300',
                  state === 'wrong' && 'bg-rose-50 ring-2 ring-rose-300',
                  state === 'dim' && 'bg-slate-50 opacity-60 ring-1 ring-slate-100'
                )}
              >
                <span className="block font-mono text-[11px] font-bold text-slate-800">{opt.label}</span>
                <span className="mt-0.5 block text-[10px] text-slate-500">→ {opt.name}</span>
              </button>
            );
          })}
        </div>

        {phase === 'wrong' ? (
          <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600">
            그 방향은 별이 아니에요. 정답은 {round.label} → {round.target.y > 0 ? '위' : round.target.y < 0 ? '아래' : round.target.x > 0 ? '오른쪽' : '왼쪽'} 방향!
          </p>
        ) : phase === 'right' ? (
          <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
            정확해요! Vector3({round.target.x}, {round.target.y}, 0)에 도착했어요 ⭐
          </p>
        ) : (
          <p className="mt-2 text-center text-[10.5px] text-slate-400">
            유니티는 +X가 오른쪽, +Y가 위예요. 별 위치와 같은 방향을 고르면 캐릭터가 날아가요.
          </p>
        )}
      </div>
    </div>
  );
}
