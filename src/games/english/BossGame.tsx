import { useEffect, useMemo, useRef, useState } from 'react';
import { useVocaStore } from '../../app-context';
import { sfx } from '../../lib/sound';
import { cn } from '../../lib/util';
import type { Student, Word } from '../../types';
import { GameResult, WrongWords, usePayout, type Reward } from '../common';
import BattleArena, { KnightSVG, MonsterSVG } from '../shared/BattleArena';
import { buildChoices, pickWords, toQuizWords, type QuizWord } from './words';

const BOSS_HP = 125;
const PLAYER_HP = 100;
const HIT = 25;
const BOSS_HIT = 20;
const TIME = 12000;

/** 🗡️ 영단어 몬스터 보스전 — 뜻을 맞히면 기사가 돌진해 보스를 베고, 틀리면 보스가 반격해요 */
export default function BossGame({
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

  const pool = useMemo(() => {
    const mine = store.wordsOfStudent(student);
    return toQuizWords(mine.length >= 8 ? mine : store.wordsForLevel(student.level));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id, student.level]);

  const [round, setRound] = useState(0);
  const words = useMemo(() => pickWords(pool, 6), [pool, round]);
  const [index, setIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(PLAYER_HP);
  const [bossHp, setBossHp] = useState(BOSS_HP);
  const [pAttacks, setPAttacks] = useState(0);
  const [eAttacks, setEAttacks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'hit' | 'miss' | 'timeout' | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [outcome, setOutcome] = useState<'win' | 'lose' | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  const g = useRef({ playerHp: PLAYER_HP, bossHp: BOSS_HP, hits: 0, answered: 0, wrong: [] as string[], locked: false, index: 0 });
  const limit = store.cashDailyLimit();

  const word: QuizWord | undefined = words[index];
  const options = useMemo(() => (word ? buildChoices(word, pool, (w) => w.meaning, 4) : []), [word, pool]);
  const answerIndex = word ? options.findIndex((o) => o.meaning === word.meaning) : -1;

  useEffect(() => {
    setTimeLeft(TIME);
  }, [index]);

  useEffect(() => {
    if (reward || feedback) return;
    const t = window.setInterval(() => {
      setTimeLeft((v) => Math.max(0, v - 200));
    }, 200);
    return () => window.clearInterval(t);
  }, [reward, feedback, index]);

  const finish = (win: boolean) => {
    const hits = g.current.hits;
    const rows = [
      { label: `명중 ${hits} × 2원`, value: hits * 2 },
      { label: '보스 처치 보너스', value: win ? 5 : 0 },
      { label: '노데미지 보너스', value: win && g.current.playerHp === PLAYER_HP ? 3 : 0 },
    ];
    const r = payout(rows);
    store.recordGameSession(student.id, {
      pairs: words.length,
      attempts: g.current.answered,
      durationMs: 0,
      cashEarned: r.earned,
      wrongWordIds: g.current.wrong,
      game: 'boss',
      score: hits,
      total: words.length,
    });
    setReward(r);
    setOutcome(win ? 'win' : 'lose');
    if (win) {
      sfx.victory();
      window.setTimeout(() => sfx.reward(), 500);
    } else {
      sfx.defeat();
    }
  };

  const answer = (choice: number | null) => {
    if (g.current.locked || reward || !word) return;
    g.current.locked = true;
    g.current.answered += 1;
    const ok = choice !== null && choice === answerIndex;
    setPicked(choice);

    if (ok) {
      g.current.hits += 1;
      sfx.combo(g.current.hits);
      setPAttacks((n) => n + 1);
      const next = Math.max(0, g.current.bossHp - HIT);
      g.current.bossHp = next;
      setBossHp(next);
      setFeedback('hit');
      if (next <= 0) {
        window.setTimeout(() => finish(true), 900);
        return;
      }
    } else {
      g.current.wrong.push(word.id);
      setWrongIds((w) => (w.includes(word.id) ? w : [...w, word.id]));
      setEAttacks((n) => n + 1);
      const next = Math.max(0, g.current.playerHp - BOSS_HIT);
      g.current.playerHp = next;
      setPlayerHp(next);
      setFeedback(choice === null ? 'timeout' : 'miss');
      sfx.miss();
      if (next <= 0) {
        window.setTimeout(() => finish(false), 1100);
        return;
      }
    }

    window.setTimeout(() => {
      const nextIndex = g.current.index + 1;
      if (nextIndex >= words.length) {
        finish(g.current.bossHp <= 0);
        return;
      }
      g.current.index = nextIndex;
      g.current.locked = false;
      setIndex(nextIndex);
      setPicked(null);
      setFeedback(null);
    }, ok ? 1050 : 1500);
  };

  useEffect(() => {
    if (timeLeft <= 0 && !g.current.locked && !reward) answer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const restart = () => {
    g.current = { playerHp: PLAYER_HP, bossHp: BOSS_HP, hits: 0, answered: 0, wrong: [], locked: false, index: 0 };
    setRound((r) => r + 1);
    setIndex(0);
    setPlayerHp(PLAYER_HP);
    setBossHp(BOSS_HP);
    setPAttacks(0);
    setEAttacks(0);
    setTimeLeft(TIME);
    setPicked(null);
    setFeedback(null);
    setReward(null);
    setOutcome(null);
    setWrongIds([]);
  };

  const wrongWords = wrongIds.map((id) => pool.find((w) => w.id === id)).filter((w): w is QuizWord => !!w);
  const timeRatio = Math.max(0, timeLeft / TIME);

  if (!word) {
    return <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">보스전에 쓸 단어가 아직 없어요.</p>;
  }

  return (
    <div className="space-y-3">
      {reward ? (
        <GameResult
          emoji={outcome === 'win' ? '🏆' : '💀'}
          title={outcome === 'win' ? '보스 처치 성공!' : '보스에게 밀렸어요'}
          stats={`명중 ${g.current.hits}회 · 남은 HP ${g.current.playerHp} · 시도 ${g.current.answered}회`}
          reward={reward}
          limit={limit}
          onReplay={restart}
          onMenu={onMenu}
          onShop={onShop}
          replayLabel="다시 도전"
          extras={<WrongWords words={wrongWords} />}
        />
      ) : null}

      <BattleArena
        player={<KnightSVG />}
        enemy={<MonsterSVG />}
        playerHp={playerHp}
        playerMax={PLAYER_HP}
        enemyHp={bossHp}
        enemyMax={BOSS_HP}
        playerName="기사"
        enemyName="단어 몬스터"
        playerAttacks={pAttacks}
        enemyAttacks={eAttacks}
        enemyDown={bossHp <= 0}
        testId="eng-boss-arena"
      />

      {/* 타이머 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400">⏱</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className={cn('h-full rounded-full transition-[width] duration-200', timeRatio < 0.3 ? 'bg-rose-500' : 'bg-amber-400')}
            style={{ width: `${timeRatio * 100}%` }}
            data-testid="eng-boss-timer"
          />
        </div>
        <span className="w-8 text-right text-[10px] font-bold tabular-nums text-slate-500">{Math.ceil(timeLeft / 1000)}s</span>
      </div>

      <div className={cn('rounded-3xl bg-white p-4 shadow-soft ring-1 ring-white transition', feedback === 'miss' && 'animate-shake')}>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
            {index + 1} / {words.length}
          </span>
          <span className="text-[10px] font-semibold text-slate-400" data-testid="eng-boss-question">
            {word.word} <span className="text-slate-300">{word.ipa}</span>
          </span>
        </div>

        <p className="mt-2 text-center text-[26px] font-extrabold tracking-tight text-slate-900">{word.word}</p>
        <p className="mt-0.5 text-center text-[11px] text-slate-500">
          {feedback === 'hit' ? '명중! 기사의 검기가 보스를 갈랐어요 ⚔️' : feedback ? '보스가 반격했어요! 정답을 확인해요' : '뜻을 맞히면 기사가 돌진해요!'}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {options.map((opt, i) => {
            const isAnswer = i === answerIndex;
            const state = picked === null ? 'idle' : isAnswer ? 'right' : picked === i ? 'wrong' : 'dim';
            return (
              <button
                key={`${opt.id}-${i}`}
                data-testid={`eng-boss-option-${i}`}
                data-correct={isAnswer ? '1' : '0'}
                disabled={feedback !== null || !!reward}
                onClick={() => answer(i)}
                className={cn(
                  'min-h-[52px] rounded-2xl px-3 py-2.5 text-[12.5px] font-bold leading-snug transition active:scale-[0.98]',
                  state === 'idle' && 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-white',
                  state === 'right' && 'bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300',
                  state === 'wrong' && 'bg-rose-50 text-rose-700 ring-2 ring-rose-300',
                  state === 'dim' && 'bg-slate-50 text-slate-400 ring-1 ring-slate-100'
                )}
              >
                {opt.meaning}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-[10.5px] leading-relaxed text-slate-400">
        정답 1개마다 보스 HP -{HIT} · 오답이면 내 HP -{BOSS_HIT}. 12초 안에 고르지 못해도 보스가 공격해요.
      </p>
    </div>
  );
}
