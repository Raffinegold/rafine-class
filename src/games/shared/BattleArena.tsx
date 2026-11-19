import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HpBar } from '../common';
import { cn } from '../../lib/util';
import { sfx } from '../../lib/sound';

interface FloatPopup {
  id: number;
  side: 'player' | 'enemy';
  text: string;
  color: string;
}

/**
 * 2D 전투 아레나 — 플레이어와 보스가 마주 보고, 공격할 때마다 돌진·피격·데미지 팝업이 뜹니다.
 * 영어 보스전과 코딩 디버깅 보스전이 같은 아레나를 씁니다.
 */
export default function BattleArena({
  player,
  enemy,
  playerHp,
  playerMax,
  enemyHp,
  enemyMax,
  playerName,
  enemyName,
  playerAttacks,
  enemyAttacks,
  enemyDown = false,
  theme = 'twilight',
  testId,
  extra,
}: {
  player: ReactNode;
  enemy: ReactNode;
  playerHp: number;
  playerMax: number;
  enemyHp: number;
  enemyMax: number;
  playerName: string;
  enemyName: string;
  playerAttacks: number;
  enemyAttacks: number;
  enemyDown?: boolean;
  theme?: 'twilight' | 'dungeon';
  testId?: string;
  extra?: ReactNode;
}) {
  const [pAnim, setPAnim] = useState<{ n: number; kind: 'attack' | 'hurt' }>({ n: 0, kind: 'attack' });
  const [eAnim, setEAnim] = useState<{ n: number; kind: 'hit' | 'lunge' }>({ n: 0, kind: 'hit' });
  const [popups, setPopups] = useState<FloatPopup[]>([]);
  const prevHp = useRef({ player: playerHp, enemy: enemyHp });
  const prevAttacks = useRef({ player: playerAttacks, enemy: enemyAttacks });
  const idRef = useRef(0);

  const addPopup = (side: 'player' | 'enemy', text: string, color: string) => {
    idRef.current += 1;
    const id = idRef.current;
    setPopups((p) => [...p, { id, side, text, color }]);
    window.setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 1100);
  };

  /* 플레이어 공격 */
  useEffect(() => {
    if (playerAttacks <= 0 || playerAttacks === prevAttacks.current.player) return;
    prevAttacks.current.player = playerAttacks;
    const dmg = Math.max(1, prevHp.current.enemy - enemyHp);
    prevHp.current.enemy = enemyHp;
    setPAnim((p) => ({ n: p.n + 1, kind: 'attack' }));
    sfx.slash();
    const t1 = window.setTimeout(() => {
      setEAnim((p) => ({ n: p.n + 1, kind: 'hit' }));
      sfx.hit();
      addPopup('enemy', `-${dmg}!`, '#fde68a');
    }, 160);
    return () => window.clearTimeout(t1);
  }, [playerAttacks, enemyHp]);

  /* 보스 반격 */
  useEffect(() => {
    if (enemyAttacks <= 0 || enemyAttacks === prevAttacks.current.enemy) return;
    prevAttacks.current.enemy = enemyAttacks;
    const dmg = Math.max(1, prevHp.current.player - playerHp);
    prevHp.current.player = playerHp;
    setEAnim((p) => ({ n: p.n + 1, kind: 'lunge' }));
    const t1 = window.setTimeout(() => {
      setPAnim((p) => ({ n: p.n + 1, kind: 'hurt' }));
      sfx.hurtPlayer();
      addPopup('player', `-${dmg}`, '#fca5a5');
    }, 240);
    return () => window.clearTimeout(t1);
  }, [enemyAttacks, playerHp]);

  useEffect(() => {
    if (!enemyDown) return;
    sfx.victory();
  }, [enemyDown]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl shadow-card ring-1 ring-white/10',
        theme === 'twilight' ? 'bg-indigo-950' : 'bg-slate-950'
      )}
      data-testid={testId}
    >
      {/* 하늘 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            theme === 'twilight'
              ? 'linear-gradient(180deg, #0b1026 0%, #241a5c 38%, #5b2a86 66%, #b45309 100%)'
              : 'linear-gradient(180deg, #05070f 0%, #0b1224 45%, #131033 75%, #052e26 100%)',
        }}
      />
      {/* 달 / 네온 */}
      {theme === 'twilight' ? (
        <>
          <div className="absolute right-6 top-6 h-14 w-14 rounded-full bg-amber-100/90 shadow-[0_0_50px_18px_rgba(253,230,138,0.32)]" />
          <div className="absolute right-8 top-8 h-3 w-3 rounded-full bg-amber-200/70" />
          <div className="absolute right-12 top-14 h-1.5 w-1.5 rounded-full bg-amber-200/60" />
          {[18, 34, 52, 70, 88, 12, 44].map((x, i) => (
            <span
              key={x}
              className="absolute h-1 w-1 rounded-full bg-white/80"
              style={{ left: `${x}%`, top: `${8 + ((i * 7) % 22)}%`, opacity: 0.5 + (i % 3) * 0.15 }}
            />
          ))}
        </>
      ) : (
        <>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(34,211,238,0.4), transparent 45%), radial-gradient(circle at 85% 30%, rgba(168,85,247,0.35), transparent 40%)' }} />
          <div className="absolute inset-x-0 top-0 h-1/2 opacity-25" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.35) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        </>
      )}

      {/* 능선 */}
      <div
        className={cn('absolute inset-x-0 bottom-[34%] h-[30%]', theme === 'twilight' ? 'text-indigo-950' : 'text-emerald-950')}
        style={{ background: 'currentColor', clipPath: 'polygon(0 100%, 0 62%, 12% 36%, 26% 70%, 42% 30%, 58% 66%, 74% 26%, 88% 58%, 100% 38%, 100% 100%)', opacity: theme === 'twilight' ? 0.85 : 0.9 }}
      />
      {/* 바닥 */}
      <div
        className="absolute inset-x-0 bottom-0 h-[36%]"
        style={{
          background:
            theme === 'twilight'
              ? 'linear-gradient(180deg, #3b0764 0%, #1e1b4b 55%, #0f172a 100%)'
              : 'linear-gradient(180deg, #052e2b 0%, #04121f 60%, #020617 100%)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: theme === 'twilight' ? 'radial-gradient(circle at 30% 40%, rgba(251,191,36,0.4), transparent 30%), radial-gradient(circle at 75% 60%, rgba(167,139,250,0.4), transparent 30%)' : 'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.25), transparent 45%)' }} />
      </div>

      {/* HP 바 */}
      <div className="relative z-10 flex items-start gap-3 px-3 pt-2.5">
        <div className="flex-1">
          <HpBar hp={playerHp} max={playerMax} tone="emerald" label={playerName} testId="arena-player-hp" />
        </div>
        <span className="mt-1 text-[10px] font-black text-white/60">VS</span>
        <div className="flex-1">
          <HpBar hp={enemyHp} max={enemyMax} tone="rose" label={enemyName} testId="arena-enemy-hp" />
        </div>
      </div>

      {/* 전투 무대 */}
      <div className="relative z-10 h-[186px] sm:h-[200px]">
        {/* 플레이어 */}
        <div className="absolute bottom-1 left-[3%] w-[104px]">
          <div key={`p-${pAnim.n}`} className={cn('relative', pAnim.n > 0 && (pAnim.kind === 'attack' ? 'player-attack' : 'player-hurt'))}>
            <div className="fighter-idle relative">{player}</div>
            {popups
              .filter((p) => p.side === 'player')
              .map((p) => (
                <span key={p.id} className="damage-pop left-1/2 top-2 text-[19px] font-black" style={{ color: p.color }}>
                  {p.text}
                </span>
              ))}
            <span className="absolute -bottom-1 left-1/2 h-2 w-16 -translate-x-1/2 rounded-full bg-black/35 blur-[3px]" />
          </div>
        </div>

        {/* 보스 */}
        <div className={cn('absolute bottom-0 right-[2%] w-[124px]', enemyDown && 'enemy-die')}>
          <div key={`e-${eAnim.n}`} className={cn('relative', eAnim.n > 0 && (eAnim.kind === 'hit' ? 'enemy-hit' : 'enemy-attack'))}>
            <div className="fighter-idle relative" style={{ animationDelay: '400ms' }}>
              {enemy}
            </div>
            {popups
              .filter((p) => p.side === 'enemy')
              .map((p) => (
                <span key={p.id} className="damage-pop left-1/2 top-0 text-[21px] font-black" style={{ color: p.color }}>
                  {p.text}
                </span>
              ))}
            <span className="absolute -bottom-1 left-1/2 h-2 w-20 -translate-x-1/2 rounded-full bg-black/35 blur-[3px]" />
          </div>
          {pAnim.kind === 'attack' && pAnim.n > 0 ? <span key={`s-${pAnim.n}`} className="slash-arc -left-2 bottom-10" /> : null}
        </div>

        {/* 타격 스파크 */}
        {eAnim.kind === 'hit' && eAnim.n > 0 ? (
          <span key={`spark-${eAnim.n}`} className="pointer-events-none absolute right-[18%] top-[30%]">
            <span className="spark" style={{ '--dx': '18px', '--dy': '-14px', background: '#fde68a' } as React.CSSProperties} />
            <span className="spark" style={{ '--dx': '-16px', '--dy': '-10px', background: '#ffffff' } as React.CSSProperties} />
            <span className="spark" style={{ '--dx': '6px', '--dy': '16px', background: '#fca5a5' } as React.CSSProperties} />
          </span>
        ) : null}

        {extra}
      </div>

    </div>
  );
}

/* ------------------------------ 캐릭터 SVG ------------------------------ */

export function KnightSVG() {
  return (
    <svg viewBox="0 0 110 130" className="w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)]">
      <defs>
        <linearGradient id="armor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="45%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
        <linearGradient id="cape" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#9f1239" />
        </linearGradient>
      </defs>
      {/* 망토 */}
      <path d="M40 58 Q24 82 28 112 Q34 116 40 112 Q38 88 50 66 Z" fill="url(#cape)" />
      {/* 다리 */}
      <rect x="44" y="92" width="11" height="24" rx="5" fill="#475569" />
      <rect x="58" y="92" width="11" height="24" rx="5" fill="#475569" />
      <rect x="42" y="112" width="15" height="8" rx="4" fill="#1e293b" />
      <rect x="57" y="112" width="15" height="8" rx="4" fill="#1e293b" />
      {/* 몸통 */}
      <rect x="37" y="56" width="40" height="42" rx="13" fill="url(#armor)" />
      <path d="M37 76 H77" stroke="#94a3b8" strokeWidth="2" />
      <circle cx="57" cy="68" r="4" fill="#f59e0b" />
      {/* 어깨 */}
      <circle cx="36" cy="62" r="9" fill="#94a3b8" />
      <circle cx="78" cy="62" r="9" fill="#94a3b8" />
      {/* 투구 */}
      <circle cx="57" cy="38" r="21" fill="url(#armor)" />
      <rect x="39" y="34" width="36" height="12" rx="5" fill="#0f172a" />
      <rect x="43" y="38" width="9" height="3" rx="1.5" fill="#67e8f9" />
      <rect x="58" y="38" width="9" height="3" rx="1.5" fill="#67e8f9" />
      <path d="M57 18 Q62 8 70 10 Q64 16 62 21 Z" fill="#fb7185" />
      {/* 방패 */}
      <ellipse cx="31" cy="76" rx="14" ry="17" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
      <path d="M31 64 L35 72 H44 L37 77 L40 86 L31 80 L22 86 L25 77 L18 72 H27 Z" fill="#f59e0b" />
      {/* 검 */}
      <g transform="rotate(-18 84 60)">
        <rect x="82" y="20" width="7" height="46" rx="3" fill="url(#blade)" />
        <rect x="75" y="64" width="21" height="5" rx="2.5" fill="#f59e0b" />
        <rect x="82" y="69" width="7" height="14" rx="3" fill="#78350f" />
        <circle cx="85.5" cy="86" r="3" fill="#fbbf24" />
      </g>
    </svg>
  );
}

export function MonsterSVG() {
  return (
    <svg viewBox="0 0 130 130" className="w-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.5)]">
      <defs>
        <radialGradient id="monsterBody" cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#3b0764" />
        </radialGradient>
        <linearGradient id="horn" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
      </defs>
      {/* 날개 */}
      <path d="M30 58 Q8 34 12 20 Q30 30 40 46 Z" fill="#4c1d95" opacity="0.9" />
      <path d="M100 58 Q122 34 118 20 Q100 30 90 46 Z" fill="#4c1d95" opacity="0.9" />
      {/* 몸통 */}
      <ellipse cx="65" cy="80" rx="42" ry="38" fill="url(#monsterBody)" />
      <ellipse cx="65" cy="96" rx="26" ry="20" fill="#4c1d95" opacity="0.55" />
      {/* 뿔 */}
      <path d="M42 50 Q30 26 36 14 Q48 26 52 44 Z" fill="url(#horn)" />
      <path d="M88 50 Q100 26 94 14 Q82 26 78 44 Z" fill="url(#horn)" />
      {/* 눈 */}
      <ellipse cx="50" cy="70" rx="11" ry="12" fill="#fef08a" />
      <ellipse cx="80" cy="70" rx="11" ry="12" fill="#fef08a" />
      <ellipse cx="52" cy="71" rx="4" ry="7" fill="#111827" />
      <ellipse cx="82" cy="71" rx="4" ry="7" fill="#111827" />
      <circle cx="54" cy="68" r="1.6" fill="#ffffff" />
      <circle cx="84" cy="68" r="1.6" fill="#ffffff" />
      {/* 눈썹 */}
      <path d="M38 58 L58 64" stroke="#2e1065" strokeWidth="4" strokeLinecap="round" />
      <path d="M92 58 L72 64" stroke="#2e1065" strokeWidth="4" strokeLinecap="round" />
      {/* 입 */}
      <path d="M46 92 Q65 108 84 92 Q65 100 46 92 Z" fill="#1e1b4b" />
      <path d="M52 93 L56 101 L60 94 Z" fill="#fef3c7" />
      <path d="M70 94 L74 101 L78 93 Z" fill="#fef3c7" />
      {/* 팔 */}
      <path d="M24 78 Q12 86 14 100 Q22 100 30 92 Z" fill="#6d28d9" />
      <path d="M106 78 Q118 86 116 100 Q108 100 100 92 Z" fill="#6d28d9" />
      {/* 발 */}
      <ellipse cx="46" cy="118" rx="15" ry="8" fill="#3b0764" />
      <ellipse cx="84" cy="118" rx="15" ry="8" fill="#3b0764" />
      <ellipse cx="46" cy="118" rx="9" ry="4" fill="#5b21b6" />
      <ellipse cx="84" cy="118" rx="9" ry="4" fill="#5b21b6" />
    </svg>
  );
}

export function DeveloperSVG() {
  return (
    <svg viewBox="0 0 110 130" className="w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)]">
      <defs>
        <linearGradient id="hoodie" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      {/* 다리 */}
      <rect x="42" y="96" width="12" height="24" rx="5" fill="#334155" />
      <rect x="58" y="96" width="12" height="24" rx="5" fill="#334155" />
      <rect x="38" y="116" width="18" height="8" rx="4" fill="#0f172a" />
      <rect x="56" y="116" width="18" height="8" rx="4" fill="#0f172a" />
      {/* 후드 몸통 */}
      <path d="M34 58 Q34 48 46 46 H66 Q78 48 78 58 L82 100 Q82 106 76 106 H36 Q30 106 30 100 Z" fill="url(#hoodie)" />
      <path d="M50 46 Q57 56 64 46" stroke="#0c4a6e" strokeWidth="3" fill="none" />
      <rect x="50" y="72" width="13" height="20" rx="6" fill="#0c4a6e" opacity="0.6" />
      {/* 머리 */}
      <circle cx="56" cy="32" r="20" fill="#fcd9b6" />
      <path d="M36 30 Q38 10 58 10 Q76 12 76 30 Q70 20 56 20 Q44 20 36 30 Z" fill="#1e293b" />
      <rect x="42" y="29" width="12" height="9" rx="3" fill="none" stroke="#0f172a" strokeWidth="2" />
      <rect x="58" y="29" width="12" height="9" rx="3" fill="none" stroke="#0f172a" strokeWidth="2" />
      <path d="M54 33 H58" stroke="#0f172a" strokeWidth="2" />
      <circle cx="48" cy="34" r="2" fill="#0f172a" />
      <circle cx="64" cy="34" r="2" fill="#0f172a" />
      <path d="M52 41 Q57 45 62 41" stroke="#b45309" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* 노트북 */}
      <g transform="rotate(-4 56 84)">
        <rect x="28" y="72" width="52" height="30" rx="4" fill="url(#screen)" stroke="#0ea5e9" strokeWidth="2" />
        <rect x="33" y="77" width="20" height="2.5" rx="1" fill="#22d3ee" />
        <rect x="33" y="83" width="30" height="2.5" rx="1" fill="#a78bfa" />
        <rect x="33" y="89" width="14" height="2.5" rx="1" fill="#22d3ee" />
        <path d="M23 102 H86 L82 106 H27 Z" fill="#94a3b8" />
      </g>
      {/* 팔 */}
      <path d="M32 62 Q24 76 30 90 Q36 88 38 78 Z" fill="#0ea5e9" />
      <path d="M80 62 Q90 76 84 90 Q76 88 74 78 Z" fill="#0ea5e9" />
    </svg>
  );
}

export function BugBossSVG() {
  return (
    <svg viewBox="0 0 140 130" className="w-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.5)]">
      <defs>
        <radialGradient id="bugShell" cx="40%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="55%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#4c0519" />
        </radialGradient>
        <linearGradient id="bugEye" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      {/* 다리 */}
      {[
        'M34 74 Q14 66 8 80',
        'M32 86 Q10 86 6 98',
        'M36 98 Q16 104 14 116',
        'M100 74 Q120 66 126 80',
        'M102 86 Q124 86 128 98',
        'M98 98 Q118 104 120 116',
      ].map((d, i) => (
        <path key={i} d={d} stroke="#7f1d1d" strokeWidth="5" strokeLinecap="round" fill="none" />
      ))}
      {/* 더듬이 */}
      <path d="M52 34 Q40 12 26 8" stroke="#7f1d1d" strokeWidth="3" fill="none" />
      <path d="M82 34 Q96 12 110 8" stroke="#7f1d1d" strokeWidth="3" fill="none" />
      <circle cx="25" cy="7" r="5" fill="#fb7185" />
      <circle cx="111" cy="7" r="5" fill="#fb7185" />
      {/* 몸통 */}
      <ellipse cx="67" cy="74" rx="40" ry="36" fill="url(#bugShell)" />
      <path d="M67 40 Q67 74 67 108" stroke="#4c0519" strokeWidth="3" opacity="0.6" />
      <path d="M38 60 Q67 52 96 60" stroke="#4c0519" strokeWidth="2.5" opacity="0.5" fill="none" />
      <path d="M36 82 Q67 92 98 82" stroke="#4c0519" strokeWidth="2.5" opacity="0.5" fill="none" />
      {/* 얼굴 */}
      <ellipse cx="53" cy="64" rx="10" ry="11" fill="url(#bugEye)" />
      <ellipse cx="81" cy="64" rx="10" ry="11" fill="url(#bugEye)" />
      <ellipse cx="55" cy="66" rx="3" ry="5" fill="#111827" />
      <ellipse cx="83" cy="66" rx="3" ry="5" fill="#111827" />
      {/* 입 */}
      <path d="M52 90 Q67 102 82 90" stroke="#111827" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M57 92 L60 99 L63 92 Z" fill="#fef3c7" />
      <path d="M71 92 L74 99 L77 92 Z" fill="#fef3c7" />
      {/* ERROR 스티커 */}
      <g transform="rotate(-12 100 30)">
        <rect x="84" y="22" width="34" height="14" rx="3" fill="#fbbf24" />
        <text x="101" y="32.5" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="700" fill="#7c2d12">
          ERROR
        </text>
      </g>
    </svg>
  );
}
