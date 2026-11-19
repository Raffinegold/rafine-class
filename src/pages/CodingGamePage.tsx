import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession, useVocaStore } from '../app-context';
import StudentNav from '../components/StudentNav';
import StudentHeader from '../components/StudentHeader';
import { Badge, Card, SectionTitle } from '../components/ui';
import { CODING_GAME_LIST, CODING_GAME_META } from '../lib/coding';
import { cn } from '../lib/util';
import { CODING_LEVEL_META, type CodingGameKey, type Student } from '../types';
import { DailyCashCard, GameBgm, GamePickCard, MuteButton } from '../games/common';
import RobotGame from '../games/coding/RobotGame';
import CodingRainGame from '../games/coding/CodingRainGame';
import DebugBossGame from '../games/coding/DebugBossGame';
import UnityGame from '../games/coding/UnityGame';
import HackerGame from '../games/coding/HackerGame';

const BLURB: Record<CodingGameKey, string> = {
  robot: '명령을 조립해 로봇을 움직여요',
  rain: '키워드 운석을 타자로 격추',
  debug: '고장 난 코드를 찾아 보스 처치',
  unity: 'Vector3 방향으로 캐릭터 날리기',
  hacker: '3단계 방화벽 암호 해독',
};

const RULE: Record<CodingGameKey, string> = {
  robot: '스테이지 2원 + 퍼펙트 1원',
  rain: '격추 1원 + 콤보·무피격',
  debug: '수정 2원 + 처치 5원',
  unity: '정답 2원 + 만점 2원',
  hacker: '방화벽 3원 + 완전 침투 2원',
};

const TAG: Record<CodingGameKey, string> = {
  robot: '5스테이지 · 최대 16원',
  rain: '10키워드 · 최대 15원',
  debug: '5문제 · 최대 18원',
  unity: '5문제 · 최대 12원',
  hacker: '3단계 · 최대 13원',
};

/**
 * 💻 코딩 게임 — 🤖 로봇 길찾기 · ⌨️ 키워드 디펜스 · 🐞 디버깅 보스전 · 🎮 유니티 좌표 · 🕵️ 해커 침투.
 * 캐시는 영어 게임과 같은 지갑(하루 상한)을 함께 씁니다.
 */
export default function CodingGamePage() {
  const store = useVocaStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { student } = useSession();

  const initial = params.get('g');
  const game: CodingGameKey | null = CODING_GAME_LIST.includes(initial as CodingGameKey) ? (initial as CodingGameKey) : null;

  const limit = store.cashDailyLimit();
  const earnedToday = student ? store.todayCashEarned(student.id) : 0;
  const balance = student ? store.cashBalance(student.id) : 0;
  const sessions = useMemo(
    () => (student ? store.codingSessionsFor(student.id, 6) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [student?.id, store.version]
  );

  if (!student) return null;

  const open = (key: CodingGameKey) => {
    setParams({ g: key }, { replace: true });
    window.scrollTo({ top: 0 });
  };
  const close = () => {
    setParams({}, { replace: true });
    window.scrollTo({ top: 0 });
  };

  const meta = game ? CODING_GAME_META[game] : null;

  return (
    <div className="min-h-screen pb-safe">
      <StudentHeader
        icon={meta ? meta.icon : '🎮'}
        brand="라피네 클래스 · 코딩 게임"
        title={meta ? `${student.name}의 ${meta.label}` : `${student.name}의 코딩 놀이터`}
        accent="dark"
        right={
          <>
            <span
              className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700"
              data-testid="coding-game-balance"
            >
              💰 {balance.toLocaleString()}원
            </span>
            <MuteButton />
          </>
        }
      />

      <main className="mx-auto max-w-3xl space-y-3 px-4 pb-28 pt-3">
        <DailyCashCard earned={earnedToday} limit={limit} testId="coding-daily-earned" compact={!!game} />

        {game ? <GameBgm mood={game === 'hacker' ? 'cyber' : 'arcade'} /> : null}

        {game === 'robot' ? <RobotGame student={student} onMenu={close} onShop={() => navigate('/shop')} /> : null}
        {game === 'rain' ? <CodingRainGame student={student} onMenu={close} onShop={() => navigate('/shop')} /> : null}
        {game === 'debug' ? <DebugBossGame student={student} onMenu={close} onShop={() => navigate('/shop')} /> : null}
        {game === 'unity' ? <UnityGame student={student} onMenu={close} onShop={() => navigate('/shop')} /> : null}
        {game === 'hacker' ? <HackerGame student={student} onMenu={close} onShop={() => navigate('/shop')} /> : null}

        {!game ? (
          <CodingMenu student={student} earnedToday={earnedToday} limit={limit} sessions={sessions} onPick={open} />
        ) : (
          <button
            onClick={close}
            data-testid="coding-game-menu-button"
            className="w-full rounded-2xl bg-white/80 py-2.5 text-[12px] font-bold text-slate-500 ring-1 ring-white active:scale-[0.99]"
          >
            ← 코딩 게임 5종 목록으로
          </button>
        )}
      </main>

      <StudentNav active="learn" />
    </div>
  );
}

function CodingMenu({
  student,
  earnedToday,
  limit,
  sessions,
  onPick,
}: {
  student: Student;
  earnedToday: number;
  limit: number;
  sessions: { id: string; game: string; score: number; total: number; cash_earned: number }[];
  onPick: (key: CodingGameKey) => void;
}) {
  return (
    <div className="space-y-3" data-testid="coding-game-menu">
      {/* 히어로 */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-5 text-white shadow-card ring-1 ring-white/10">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-cyan-500/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 left-6 h-36 w-36 rounded-full bg-violet-500/25 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.6) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">Rafine Coding Arcade</p>
        <h1 className="relative mt-1 text-[22px] font-extrabold leading-tight">코딩 게임 5종</h1>
        <p className="relative mt-1 text-[12px] text-slate-300">
          로봇을 움직이고, 키워드를 쏘고, 버그 보스를 잡아요. {CODING_LEVEL_META[student.coding_level].label} 문제로 진행!
        </p>
        <div className="relative mt-3 flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold ring-1 ring-white/20">
            오늘 {earnedToday} / {limit}원
          </span>
          <span className={cn('rounded-full px-2.5 py-1 text-[10.5px] font-bold', CODING_LEVEL_META[student.coding_level].badge)}>
            {student.coding_level}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {CODING_GAME_LIST.map((key) => {
          const meta = CODING_GAME_META[key];
          return (
            <GamePickCard
              key={key}
              testId={`coding-pick-${key}`}
              icon={meta.icon}
              title={meta.label}
              desc={BLURB[key]}
              tag={TAG[key]}
              art={<CodingArt kind={key} />}
              onClick={() => onPick(key)}
              tone="dark"
            />
          );
        })}
      </div>

      <Card>
        <SectionTitle sub="틀린 문제는 해설과 함께 오답노트로">코딩 게임 캐시</SectionTitle>
        <ul className="mt-3 space-y-1.5 text-[11.5px] text-slate-600">
          {CODING_GAME_LIST.map((key) => (
            <li key={key} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <span className="whitespace-nowrap">
                {CODING_GAME_META[key].icon} {CODING_GAME_META[key].label}
              </span>
              <span className="text-right font-bold">{RULE[key]}</span>
            </li>
          ))}
        </ul>
      </Card>

      {sessions.length ? (
        <Card>
          <SectionTitle sub="최근 플레이">나의 코딩 게임 기록</SectionTitle>
          <ul className="mt-3 space-y-1.5">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11.5px]">
                <span>{CODING_GAME_META[s.game as CodingGameKey]?.icon ?? '🎮'}</span>
                <span className="flex-1 font-semibold text-slate-600">{CODING_GAME_META[s.game as CodingGameKey]?.label ?? '게임'}</span>
                <span className="text-slate-500">
                  {s.score}/{s.total}
                </span>
                <span className="font-bold text-amber-700">+{s.cash_earned}원</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2">
        <span className="text-[10.5px] text-slate-500">영어·코딩 공용 지갑</span>
        <Badge tone={earnedToday >= limit ? 'sun' : 'mint'}>{earnedToday >= limit ? '연습 모드' : `${limit - earnedToday}원 남음`}</Badge>
      </div>
    </div>
  );
}

/** 코딩 게임 카드 미리보기 아트 */
function CodingArt({ kind }: { kind: CodingGameKey }) {
  if (kind === 'robot') {
    return (
      <div className="relative h-full w-full bg-gradient-to-br from-slate-800 to-slate-950">
        <div className="absolute inset-2 grid grid-cols-5 grid-rows-3 gap-[2px]">
          {Array.from({ length: 15 }).map((_, i) => (
            <span key={i} className={cn('rounded-[2px]', i === 3 || i === 7 ? 'bg-slate-700' : 'bg-slate-800/80')} />
          ))}
        </div>
        <span className="absolute bottom-1.5 left-2 text-[16px]">🤖</span>
        <span className="absolute right-2 top-1.5 text-[14px]">🚩</span>
        <span className="absolute bottom-2 right-6 text-[11px]">🪙</span>
      </div>
    );
  }
  if (kind === 'rain') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#050510] via-[#0b1224] to-[#020617]">
        {['print', 'for', 'return'].map((w, i) => (
          <span key={w} className="absolute rounded bg-slate-900/90 px-1 py-0.5 font-mono text-[7.5px] text-cyan-200 ring-1 ring-cyan-400/30" style={{ left: `${10 + i * 26}%`, top: `${12 + (i % 2) * 26}%` }}>
            {w}
          </span>
        ))}
        <span className="absolute bottom-2 left-1/2 h-[2px] w-[64%] -translate-x-1/2 rotate-[18deg] bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.9)]" />
      </div>
    );
  }
  if (kind === 'debug') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#04121f] to-[#1a0a2e]">
        <div className="absolute inset-x-2 top-1.5 flex gap-1">
          <span className="h-1 flex-1 rounded-full bg-emerald-400/80" />
          <span className="h-1 flex-1 rounded-full bg-rose-500/80" />
        </div>
        <span className="absolute bottom-0 left-3 text-[22px]">🧑‍💻</span>
        <span className="absolute bottom-0 right-2 text-[26px]">🐞</span>
        <span className="absolute left-1/2 top-2 -translate-x-1/2 font-mono text-[7px] text-emerald-300">{'</>'}</span>
      </div>
    );
  }
  if (kind === 'unity') {
    return (
      <div className="relative h-full w-full bg-gradient-to-br from-indigo-950 to-slate-950">
        <div className="absolute inset-2 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="border border-cyan-400/20" />
          ))}
        </div>
        <span className="absolute right-2 top-1.5 text-[13px]">⭐</span>
        <span className="absolute bottom-1 left-1.5 text-[16px]">🎮</span>
        <span className="absolute left-2 top-1 font-mono text-[7px] text-cyan-300">Y+</span>
      </div>
    );
  }
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-slate-950 via-[#04120a] to-slate-950">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(34,197,94,0.25) 0 1px, transparent 1px 5px)' }} />
      <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-2 pt-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="text-[13px]">{i === 0 ? '🔓' : '🔒'}</span>
        ))}
      </div>
      <p className="absolute bottom-1.5 left-0 right-0 text-center font-mono text-[7px] font-bold tracking-widest text-emerald-300">ACCESS GRANTED</p>
    </div>
  );
}
