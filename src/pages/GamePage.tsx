import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession, useVocaStore } from '../app-context';
import StudentNav from '../components/StudentNav';
import StudentHeader from '../components/StudentHeader';
import CodingGamePage from './CodingGamePage';
import { useSubject } from '../subject-context';
import { Badge, Bar, Card, SectionTitle } from '../components/ui';
import { cn } from '../lib/util';
import type { EnglishGameKey } from '../types';
import { DailyCashCard, GameBgm, GamePickCard, MuteButton } from '../games/common';
import MatchGame from '../games/english/MatchGame';
import RainGame from '../games/english/RainGame';
import BossGame from '../games/english/BossGame';
import ListenGame from '../games/english/ListenGame';
import BlankGame from '../games/english/BlankGame';

const GAMES: { key: EnglishGameKey; icon: string; title: string; desc: string; tag: string }[] = [
  { key: 'match', icon: '🃏', title: '단어 짝맞추기', desc: '카드를 뒤집어 영단어와 뜻을 연결', tag: '6~8쌍 · 최대 25원' },
  { key: 'rain', icon: '⌨️', title: '단어 산성비', desc: '떨어지는 운석을 타자로 격추', tag: '10단어 · 최대 15원' },
  { key: 'boss', icon: '🗡️', title: '몬스터 보스전', desc: '뜻을 맞혀 기사로 보스를 처치', tag: '6문제 · 최대 20원' },
  { key: 'listen', icon: '🔊', title: '발음 리스닝', desc: '원어민 발음을 듣고 뜻 맞히기', tag: '6단어 · 최대 16원' },
  { key: 'blank', icon: '🧩', title: '예문 빈칸', desc: '문장 속 빈칸에 단어 블록 채우기', tag: '6문장 · 최대 20원' },
];

export default function GamePage() {
  const { subject } = useSubject();
  return subject === 'coding' ? <CodingGamePage /> : <EnglishGamePage />;
}

function EnglishGamePage() {
  const store = useVocaStore();
  const navigate = useNavigate();
  const { student } = useSession();
  const [params, setParams] = useSearchParams();

  const initial = params.get('g');
  const game: EnglishGameKey | null = GAMES.some((g) => g.key === initial) ? (initial as EnglishGameKey) : null;

  const limit = store.cashDailyLimit();
  const earnedToday = student ? store.todayCashEarned(student.id) : 0;
  const balance = student ? store.cashBalance(student.id) : 0;
  const sessions = useMemo(
    () => (student ? store.gameSessionsFor(student.id, 8) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [student?.id, store.version]
  );

  const meta = GAMES.find((g) => g.key === game);

  const open = (key: EnglishGameKey) => {
    setParams({ g: key }, { replace: true });
    window.scrollTo({ top: 0 });
  };
  const close = () => {
    setParams({}, { replace: true });
    window.scrollTo({ top: 0 });
  };

  if (!student) return null;

  return (
    <div className="min-h-screen pb-safe">
      <StudentHeader
        icon={meta ? meta.icon : '🎮'}
        brand="라피네 클래스 · 영어 게임"
        title={meta ? `${student.name}의 ${meta.title}` : `${student.name}의 게임`}
        right={
          <>
            <span
              className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700"
              data-testid="game-balance"
            >
              💰 {balance.toLocaleString()}원
            </span>
            <MuteButton />
          </>
        }
      />

      <main className="mx-auto max-w-3xl space-y-3 px-4 pb-28 pt-3">
        <DailyCashCard earned={earnedToday} limit={limit} compact={!!game} />

        {game ? <GameBgm mood="arcade" /> : null}

        {game === 'match' ? <MatchGame student={student} onMenu={close} onShop={() => navigate('/shop')} /> : null}
        {game === 'rain' ? <RainGame student={student} onMenu={close} onShop={() => navigate('/shop')} /> : null}
        {game === 'boss' ? <BossGame student={student} onMenu={close} onShop={() => navigate('/shop')} /> : null}
        {game === 'listen' ? <ListenGame student={student} onMenu={close} onShop={() => navigate('/shop')} /> : null}
        {game === 'blank' ? <BlankGame student={student} onMenu={close} onShop={() => navigate('/shop')} /> : null}

        {!game ? (
          <EnglishMenu student={student} earnedToday={earnedToday} limit={limit} sessions={sessions} onPick={open} />
        ) : (
          <button
            onClick={close}
            data-testid="game-menu-button"
            className="w-full rounded-2xl bg-white/80 py-2.5 text-[12px] font-bold text-slate-500 ring-1 ring-white active:scale-[0.99]"
          >
            ← 게임 5종 목록으로
          </button>
        )}
      </main>

      <StudentNav active="learn" />
    </div>
  );
}

function EnglishMenu({
  student,
  earnedToday,
  limit,
  sessions,
  onPick,
}: {
  student: { id: string; level: number; name: string };
  earnedToday: number;
  limit: number;
  sessions: { id: string; game?: string; cash_earned: number; played_at: string; pairs: number }[];
  onPick: (key: EnglishGameKey) => void;
}) {
  const recent = sessions.filter((s) => s.game && s.game !== 'match').slice(0, 4);
  return (
    <div className="space-y-3" data-testid="eng-game-menu">
      {/* 히어로 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-card">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 left-8 h-36 w-36 rounded-full bg-amber-300/20 blur-2xl" />
        <p className="text-[10.5px] font-bold uppercase tracking-widest text-white/70">Rafine Class Arcade</p>
        <h1 className="mt-1 text-[22px] font-extrabold leading-tight">5가지 영어 게임</h1>
        <p className="mt-1 text-[12px] text-white/80">단어가 운석이 되고, 보스가 되고, 빈칸이 돼요. 한 판마다 캐시 적립!</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10.5px] font-bold ring-1 ring-white/30">
            오늘 {earnedToday} / {limit}원
          </span>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10.5px] font-bold ring-1 ring-white/30">Level {student.level}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-amber-300" style={{ width: `${limit ? Math.min(100, (earnedToday / limit) * 100) : 0}%` }} />
        </div>
      </div>

      {/* 게임 카드 */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {GAMES.map((g) => (
          <GamePickCard
            key={g.key}
            testId={`eng-pick-${g.key}`}
            icon={g.icon}
            title={g.title}
            desc={g.desc}
            tag={g.tag}
            art={<GameArt kind={g.key} />}
            onClick={() => onPick(g.key)}
            tone={g.key === 'rain' || g.key === 'boss' ? 'dark' : 'light'}
          />
        ))}
        <div className="col-span-2 rounded-3xl bg-white/80 p-3 ring-1 ring-white sm:col-span-3">
          <p className="text-[11px] font-bold text-slate-700">🎁 캐시는 어디에 쓰나요?</p>
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-500">
            모은 캐시로 상점에서 기프티콘을 신청할 수 있어요. 하루 50원까지 모이고, 다 채운 뒤에도 연습 모드로 계속 놀 수 있어요.
          </p>
        </div>
      </div>

      {recent.length ? (
        <Card className="p-4">
          <SectionTitle sub="최근에 즐긴 게임">나의 플레이 기록</SectionTitle>
          <ul className="mt-2.5 space-y-1.5">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11.5px]">
                <span>{GAMES.find((g) => g.key === s.game)?.icon ?? '🎮'}</span>
                <span className="flex-1 font-semibold text-slate-600">{GAMES.find((g) => g.key === s.game)?.title ?? '게임'}</span>
                <span className="font-bold text-amber-700">+{s.cash_earned}원</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2">
        <span className="text-[10.5px] text-slate-500">오늘 적립 현황</span>
        <span className="flex items-center gap-2">
          <Bar ratio={limit ? earnedToday / limit : 0} tone={earnedToday >= limit ? 'sun' : 'mint'} />
          <Badge tone={earnedToday >= limit ? 'sun' : 'mint'}>{earnedToday >= limit ? '연습 모드' : `${limit - earnedToday}원 남음`}</Badge>
        </span>
      </div>
    </div>
  );
}

/** 게임 선택 카드 미리보기 아트 (CSS/SVG) */
function GameArt({ kind }: { kind: EnglishGameKey }) {
  if (kind === 'match') {
    return (
      <div className="relative h-full w-full bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-700">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="absolute top-1/2 h-[30px] w-[22px] -translate-y-1/2 rounded-md bg-white/90 shadow-md"
            style={{ left: `${12 + i * 20}%`, transform: `translateY(-50%) rotate(${i % 2 ? 8 : -6}deg)` }}
          >
            <span className="absolute inset-0 grid place-items-center text-[11px]">🃏</span>
          </span>
        ))}
      </div>
    );
  }
  if (kind === 'rain') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-indigo-950 via-violet-900 to-slate-900">
        <span className="absolute right-3 top-2 h-5 w-5 rounded-full bg-amber-200/80 shadow-[0_0_18px_6px_rgba(253,230,138,0.4)]" />
        {[
          { t: 'apple', x: 14, y: 30 },
          { t: 'robot', x: 46, y: 14 },
          { t: 'music', x: 30, y: 56 },
        ].map((w) => (
          <span
            key={w.t}
            className="absolute rounded bg-slate-900/80 px-1 py-0.5 text-[8px] font-bold text-white ring-1 ring-white/20"
            style={{ left: `${w.x}%`, top: `${w.y}%` }}
          >
            {w.t}
          </span>
        ))}
        <span className="absolute bottom-3 left-1/2 h-[2px] w-[70%] -translate-x-1/2 rotate-[-24deg] bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
      </div>
    );
  }
  if (kind === 'boss') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#1a1145] via-[#43207a] to-[#7c2d12]">
        <div className="absolute inset-x-2 top-1.5 flex gap-1">
          <span className="h-1 flex-1 rounded-full bg-emerald-400/80" />
          <span className="h-1 flex-1 rounded-full bg-rose-500/80" />
        </div>
        <span className="absolute bottom-0 left-3 text-[26px] leading-none drop-shadow">🛡️</span>
        <span className="absolute bottom-0 right-3 text-[30px] leading-none drop-shadow">👹</span>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-20deg] text-[16px] text-amber-200 drop-shadow">⚡</span>
      </div>
    );
  }
  if (kind === 'listen') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900">
        <div className="absolute inset-x-0 bottom-2 flex h-8 items-end justify-center gap-[2px]">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-gradient-to-t from-cyan-300 to-fuchsia-300"
              style={{ height: 6 + (i % 5) * 5 }}
            />
          ))}
        </div>
        <span className="absolute left-3 top-2 text-[16px]">🔊</span>
        <span className="absolute right-3 top-2 h-6 w-6 animate-ping rounded-full border border-cyan-300/60" />
      </div>
    );
  }
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100">
      <div className="absolute left-2 top-3 right-2 rounded-xl bg-white px-2 py-1.5 shadow-sm">
        <p className="text-[7px] font-semibold text-slate-500">I eat an</p>
        <p className="text-[7px] font-extrabold text-slate-800">
          <span className="rounded border-b border-dashed border-amber-500 bg-amber-100 px-2 text-amber-700">?</span> after class.
        </p>
      </div>
      <span className="absolute bottom-1 right-2 text-[16px]">🧩</span>
    </div>
  );
}
