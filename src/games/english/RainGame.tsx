import { useMemo, useState } from 'react';
import { useVocaStore } from '../../app-context';
import { sfx } from '../../lib/sound';
import type { Student } from '../../types';
import { GameResult, usePayout, type Reward } from '../common';
import TypeDefense, { type RainResult } from '../shared/TypeDefense';
import { pickWords, toQuizWords, type QuizWord } from './words';

/** ⌨️ 영단어 산성비 타자 디펜스 — Canvas 2D 밤하늘에서 단어 운석이 떨어져요 */
export default function RainGame({
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
  const words = useMemo(() => pickWords(pool, 10), [pool, round]);
  const items = useMemo(
    () => words.map((w) => ({ id: w.id, text: w.word, hint: w.meaning })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words]
  );
  const [result, setResult] = useState<RainResult | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const limit = store.cashDailyLimit();

  const finish = (r: RainResult) => {
    const comboBonus = r.maxCombo >= 8 ? 3 : r.maxCombo >= 5 ? 2 : r.maxCombo >= 3 ? 1 : 0;
    const noMiss = r.escaped === 0 ? 2 : 0;
    const rows = [
      { label: `격추 ${r.kills} × 1원`, value: r.kills },
      { label: '콤보 보너스', value: comboBonus },
      { label: '무피격 보너스', value: noMiss },
    ];
    const rw = payout(rows);
    store.recordGameSession(student.id, {
      pairs: words.length,
      attempts: r.shots + r.wrongInputs,
      durationMs: r.durationMs,
      cashEarned: rw.earned,
      wrongWordIds: r.missedIds,
      game: 'rain',
      score: r.kills,
      total: words.length,
    });
    setResult(r);
    setReward(rw);
    window.setTimeout(() => sfx.reward(), 320);
  };

  const restart = () => {
    setResult(null);
    setReward(null);
    setRound((n) => n + 1);
  };

  const missedWords = result
    ? result.missedIds.map((id) => pool.find((w) => w.id === id)).filter((w): w is QuizWord => !!w)
    : [];

  return (
    <div className="space-y-3">
      {result && reward ? (
        <GameResult
          emoji={result.cleared ? '🛡️' : '💥'}
          title={result.cleared ? '방어 성공! 밤하늘을 지켰어요' : '방어막이 무너졌어요'}
          stats={`격추 ${result.kills} / ${result.total} · 최대 콤보 ${result.maxCombo} · 남은 하트 ${result.heartsLeft}`}
          reward={reward}
          limit={limit}
          onReplay={restart}
          onMenu={onMenu}
          onShop={onShop}
          extras={
            missedWords.length ? (
              <div className="mt-3">
                <p className="text-[11px] font-bold text-slate-700">놓친 단어</p>
                <ul className="mt-1.5 space-y-1" data-testid="game-wrong-list">
                  {missedWords.slice(0, 6).map((w) => (
                    <li key={w.id} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 text-[12px]">
                      <span className="font-bold text-slate-900">{w.word}</span>
                      <span className="text-[10px] text-slate-400">{w.ipa}</span>
                      <span className="ml-auto text-[11px] text-slate-600">{w.meaning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : undefined
          }
        />
      ) : null}

      <TypeDefense
        key={round}
        items={items}
        theme="sky"
        maxHearts={5}
        onFinish={finish}
        testIdPrefix="eng-rain"
        sceneLabel="🌠 단어 산성비"
        hintLabel="뜻"
      />

      {!result ? (
        <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-[10.5px] text-slate-500 ring-1 ring-white">
          <span className="text-base">💡</span>
          <span>
            단어를 다 치면 레이저가 자동 발사돼요. 하트 5개로 10개 운석을 막아내면 완파! 콤보를 이어 가면 보너스가 붙어요.
          </span>
        </div>
      ) : null}
    </div>
  );
}
