import { useMemo, useRef, useState } from 'react';
import { useVocaStore } from '../../app-context';
import { buildGameProblems, CODING_GAME_META } from '../../lib/coding';
import { sfx } from '../../lib/sound';
import { cn } from '../../lib/util';
import { CODING_LEVEL_META, type CodingProblem, type Student } from '../../types';
import { GameResult, usePayout, type Reward } from '../common';
import BattleArena, { BugBossSVG, DeveloperSVG } from '../shared/BattleArena';

const BOSS_HP = 100;
const PLAYER_HP = 100;
const HIT = 20;
const COUNTER = 20;

/** 🐞 디버깅 보스전 — 고장 난 코드 줄을 찾아 고칠 때마다 버그 보스의 HP가 깎여요 */
export default function DebugBossGame({
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
    () => buildGameProblems('debug', student.coding_level),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [student.coding_level, round]
  );

  const [index, setIndex] = useState(0);
  const [bossHp, setBossHp] = useState(BOSS_HP);
  const [playerHp, setPlayerHp] = useState(PLAYER_HP);
  const [pAttacks, setPAttacks] = useState(0);
  const [eAttacks, setEAttacks] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealLine, setRevealLine] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [outcome, setOutcome] = useState<'win' | 'lose' | null>(null);
  const [wrongProblems, setWrongProblems] = useState<CodingProblem[]>([]);
  const triesRef = useRef(0);
  const loggedRef = useRef<Set<string>>(new Set());
  const solvedRef = useRef(0);
  const limit = store.cashDailyLimit();
  const meta = CODING_GAME_META.debug;
  const problem: CodingProblem | undefined = problems[index];

  const finish = (win: boolean) => {
    const rows = [
      { label: `버그 수정 ${solvedRef.current} × 2원`, value: solvedRef.current * 2 },
      { label: '보스 처치 보너스', value: win ? 5 : 0 },
      { label: '노데미지 보너스', value: win && playerHp === PLAYER_HP ? 3 : 0 },
    ];
    const r = payout(rows);
    store.recordCodingSession(student.id, {
      game: 'debug',
      score: solvedRef.current,
      total: problems.length,
      cashEarned: r.earned,
      wrongProblemIds: wrongProblems.map((p) => p.id),
    });
    setReward(r);
    setOutcome(win ? 'win' : 'lose');
    if (win) {
      sfx.victory();
      window.setTimeout(() => sfx.reward(), 450);
    } else {
      sfx.defeat();
    }
  };

  const next = () => {
    const nextIndex = index + 1;
    if (nextIndex >= problems.length) {
      finish(bossHp <= 0);
      return;
    }
    setIndex(nextIndex);
    setPicked(null);
    setRevealLine(null);
    setSolved(false);
    triesRef.current = 0;
  };

  const tapLine = (i: number) => {
    if (!problem || solved || reward || picked !== null) return;
    const correct = i === problem.answerLine;
    setPicked(i);
    if (!loggedRef.current.has(problem.id)) {
      loggedRef.current.add(problem.id);
      store.recordCodingAnswer(student, problem, correct, 'game');
    }
    if (correct) {
      setSolved(true);
      solvedRef.current += 1;
      const nextBoss = Math.max(0, bossHp - HIT);
      setBossHp(nextBoss);
      setPAttacks((n) => n + 1);
      sfx.hit();
      window.setTimeout(() => {
        if (nextBoss <= 0) finish(true);
        else next();
      }, 1050);
    } else {
      triesRef.current += 1;
      setWrongProblems((w) => (w.some((p) => p.id === problem.id) ? w : [...w, problem]));
      setEAttacks((n) => n + 1);
      const nextPlayer = Math.max(0, playerHp - COUNTER);
      setPlayerHp(nextPlayer);
      sfx.hurt();
      if (nextPlayer <= 0) {
        window.setTimeout(() => finish(false), 900);
        return;
      }
      if (triesRef.current >= 2) {
        setRevealLine(problem.answerLine ?? -1);
        sfx.fail();
        window.setTimeout(() => next(), 1800);
      } else {
        window.setTimeout(() => setPicked(null), 700);
      }
    }
  };

  const restart = () => {
    solvedRef.current = 0;
    loggedRef.current = new Set();
    triesRef.current = 0;
    setRound((r) => r + 1);
    setIndex(0);
    setBossHp(BOSS_HP);
    setPlayerHp(PLAYER_HP);
    setPAttacks(0);
    setEAttacks(0);
    setPicked(null);
    setRevealLine(null);
    setSolved(false);
    setReward(null);
    setOutcome(null);
    setWrongProblems([]);
  };

  if (!problem) {
    return <p className="rounded-2xl bg-slate-900 p-6 text-center text-sm text-slate-300">디버깅 문제가 아직 없어요.</p>;
  }

  const levelBadge = CODING_LEVEL_META[problem.level].badge;

  return (
    <div className="space-y-3">
      {reward ? (
        <GameResult
          emoji={outcome === 'win' ? '🏆' : '💀'}
          title={outcome === 'win' ? '버그 보스 처치!' : '버그에게 당했어요'}
          stats={`버그 수정 ${solvedRef.current} / ${problems.length} · 남은 HP ${playerHp}`}
          reward={reward}
          limit={limit}
          onReplay={restart}
          onMenu={onMenu}
          onShop={onShop}
          testId="coding-game-summary"
          rewardTestId="coding-game-reward"
          replayLabel="다시 도전"
          menuLabel="게임 목록"
          accent="dark"
        />
      ) : null}

      <BattleArena
        player={<DeveloperSVG />}
        enemy={<BugBossSVG />}
        playerHp={playerHp}
        playerMax={PLAYER_HP}
        enemyHp={bossHp}
        enemyMax={BOSS_HP}
        playerName="개발자"
        enemyName="버그 보스"
        playerAttacks={pAttacks}
        enemyAttacks={eAttacks}
        enemyDown={bossHp <= 0}
        theme="dungeon"
        testId="cod-debug-arena"
      />

      <div className="rounded-3xl bg-slate-900 p-3 shadow-card ring-1 ring-white/10">
        <div className="flex items-center gap-1.5">
          <span className={cn('rounded-full px-2 py-0.5 text-[9.5px] font-bold', levelBadge)}>{problem.level}</span>
          <span className="text-[10px] font-semibold text-slate-400">{problem.topic}</span>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9.5px] font-bold text-white" data-testid="cod-debug-progress">
            {meta.icon} {index + 1} / {problems.length}
          </span>
        </div>
        <p className="mt-1.5 text-[13px] font-bold leading-snug text-white" data-testid="cod-debug-prompt">
          {problem.prompt}
        </p>

        <div className="mt-2 overflow-hidden rounded-xl bg-black/50 ring-1 ring-white/10">
          {(problem.lines ?? []).map((line, i) => {
            const isBug = i === problem.answerLine;
            const state = revealLine !== null ? (isBug ? 'right' : i === picked ? 'wrong' : 'dim') : solved ? (isBug ? 'right' : 'dim') : picked === null ? 'idle' : i === picked ? 'wrong' : isBug && solved ? 'right' : 'dim';
            return (
              <button
                key={i}
                data-testid={`cod-debug-line-${i}`}
                data-correct={isBug ? '1' : '0'}
                disabled={solved || picked !== null || !!reward}
                onClick={() => tapLine(i)}
                className={cn(
                  'flex w-full items-start gap-2 border-l-2 border-transparent px-2.5 py-1.5 text-left font-mono text-[12px] leading-snug transition',
                  state === 'idle' && 'text-slate-100 hover:bg-white/10 active:bg-white/20',
                  state === 'right' && 'border-emerald-300 bg-emerald-500 font-semibold text-white',
                  state === 'wrong' && 'border-rose-300 bg-rose-500 font-semibold text-white',
                  state === 'dim' && 'text-slate-500'
                )}
              >
                <span className="w-3 shrink-0 select-none text-right text-slate-500">{i + 1}</span>
                <span className="whitespace-pre">{line}</span>
                {state === 'right' ? <span className="ml-auto text-[10px] font-bold">수정!</span> : null}
              </button>
            );
          })}
        </div>

        {solved ? (
          <div className="animate-pop mt-2 rounded-xl bg-emerald-500/15 px-2.5 py-2 ring-1 ring-emerald-400/30" data-testid="cod-debug-feedback">
            <p className="text-[11px] font-bold text-emerald-300">버그를 찾았어요! 보스 HP -{HIT}</p>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-emerald-100/80">{problem.explanation}</p>
          </div>
        ) : picked !== null ? (
          <div className="animate-pop mt-2 rounded-xl bg-rose-500/15 px-2.5 py-2 ring-1 ring-rose-400/30" data-testid="cod-debug-feedback">
            <p className="text-[11px] font-bold text-rose-300">그 줄은 버그가 아니에요. 보스가 반격! 내 HP -{COUNTER}</p>
            <p className="mt-0.5 text-[10.5px] text-rose-100/70">
              {triesRef.current >= 2 ? '두 번 틀렸어요. 정답 줄을 표시하고 넘어갈게요.' : '한 번 더 찾아볼 수 있어요.'}
            </p>
          </div>
        ) : revealLine !== null ? (
          <p className="mt-2 rounded-xl bg-white/5 px-2.5 py-2 text-[10.5px] text-slate-300">
            {problem.explanation}
          </p>
        ) : (
          <p className="mt-2 text-center text-[10px] text-slate-400">고장 난 줄을 터치하면 개발자가 달려들어 고쳐요!</p>
        )}
      </div>
    </div>
  );
}
