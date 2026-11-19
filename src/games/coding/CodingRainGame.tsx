import { useMemo, useState } from 'react';
import { useVocaStore } from '../../app-context';
import { CODING_KEYWORDS } from '../../lib/coding';
import { shuffle } from '../../lib/util';
import type { Student } from '../../types';
import { GameResult, usePayout, type Reward } from '../common';
import TypeDefense, { type RainResult } from '../shared/TypeDefense';

/** ⌨️ 코딩 키워드 타자 디펜스 — 레벨별 핵심 키워드가 네온 운석으로 떨어져요 */
export default function CodingRainGame({
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
  const keywords = CODING_KEYWORDS[student.coding_level] ?? CODING_KEYWORDS.C1;
  const picked = useMemo(() => shuffle(keywords).slice(0, 10), [keywords, round]);
  const items = useMemo(
    () => picked.map((k, i) => ({ id: `kw-${i}-${k.word}`, text: k.word, hint: k.hint })),
    [picked]
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
    store.recordCodingSession(student.id, {
      game: 'rain',
      score: r.kills,
      total: items.length,
      cashEarned: rw.earned,
      wrongProblemIds: [],
    });
    setResult(r);
    setReward(rw);
  };

  const restart = () => {
    setResult(null);
    setReward(null);
    setRound((n) => n + 1);
  };

  const missed = result ? result.missedIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) : [];

  return (
    <div className="space-y-3">
      {result && reward ? (
        <GameResult
          emoji={result.cleared ? '🛡️' : '💥'}
          title={result.cleared ? '방화벽 사수 성공!' : '키워드가 뚫고 들어왔어요'}
          stats={`격추 ${result.kills} / ${result.total} · 최대 콤보 ${result.maxCombo} · 남은 하트 ${result.heartsLeft}`}
          reward={reward}
          limit={limit}
          onReplay={restart}
          onMenu={onMenu}
          onShop={onShop}
          testId="coding-game-summary"
          rewardTestId="coding-game-reward"
          accent="dark"
          extras={
            missed.length ? (
              <div className="mt-3">
                <p className="text-[11px] font-bold text-slate-200">놓친 키워드</p>
                <ul className="mt-1.5 space-y-1">
                  {missed.slice(0, 6).map((k) => (
                    <li key={k!.id} className="flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-1.5 text-[12px] text-white">
                      <span className="font-mono font-bold">{k!.text}</span>
                      <span className="ml-auto text-[11px] text-slate-300">{k!.hint}</span>
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
        theme="cyber"
        maxHearts={5}
        onFinish={finish}
        testIdPrefix="cod-rain"
        sceneLabel="💾 키워드 디펜스"
        hintLabel="기능"
        accentText="키워드를 그대로 입력!"
      />

      {!result ? (
        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-[10.5px] text-slate-300 ring-1 ring-white/10">
          <span className="text-base">⌨️</span>
          <span>
            {student.coding_level} 키워드 10개가 운석이 돼요. 대소문자까지 정확히 입력하면 레이저가 발사! 하트 5개로 막아내세요.
          </span>
        </div>
      ) : null}
    </div>
  );
}
