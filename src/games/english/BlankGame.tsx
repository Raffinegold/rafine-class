import { useEffect, useMemo, useRef, useState } from 'react';
import { useVocaStore } from '../../app-context';
import { sfx } from '../../lib/sound';
import { cn } from '../../lib/util';
import type { Student } from '../../types';
import { GameResult, SparkBurst, WrongWords, usePayout, type Reward } from '../common';
import { blankSentence, buildChoices, pickWords, toQuizWords, type QuizWord } from './words';

const ROUNDS = 6;

/** 🧩 예문 빈칸 채우기 — 말풍선 속 문장의 빈칸에 단어 블록이 쏙 들어가요 */
export default function BlankGame({
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

  const blanks = useMemo(() => pool.filter((w) => blankSentence(w)), [pool]);

  const [round, setRound] = useState(0);
  const words = useMemo(() => pickWords(blanks.length >= 4 ? blanks : pool, ROUNDS), [blanks, pool, round]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [filled, setFilled] = useState(false);
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [reward, setReward] = useState<Reward | null>(null);
  const [sparkKey, setSparkKey] = useState(0);
  const correctRef = useRef(0);
  const firstTryRef = useRef(0);
  const limit = store.cashDailyLimit();

  const word: QuizWord | undefined = words[index];
  const split = word ? blankSentence(word) : null;
  const options = useMemo(
    () => (word ? buildChoices(word, pool.length >= 4 ? pool : [word], (w) => w.word, 4) : []),
    [word, pool]
  );
  const answerIndex = word ? options.findIndex((o) => o.word === word.word) : -1;

  useEffect(() => {
    setPicked(null);
    setFilled(false);
    setWrongPicks([]);
  }, [index]);

  const finish = () => {
    const rows = [
      { label: `정답 ${correctRef.current} × 2원`, value: correctRef.current * 2 },
      { label: '한 번에 맞힌 보너스', value: firstTryRef.current },
      { label: '만점 보너스', value: correctRef.current === words.length ? 2 : 0 },
    ];
    const r = payout(rows);
    store.recordGameSession(student.id, {
      pairs: words.length,
      attempts: words.length,
      durationMs: 0,
      cashEarned: r.earned,
      wrongWordIds: wrongIds,
      game: 'blank',
      score: correctRef.current,
      total: words.length,
    });
    setReward(r);
    sfx.win();
  };

  const choose = (i: number) => {
    if (!word || filled || reward || wrongPicks.includes(i)) return;
    setPicked(i);
    if (i === answerIndex) {
      const first = wrongPicks.length === 0;
      correctRef.current += 1;
      if (first) firstTryRef.current += 1;
      setWrongIds((w) => (w.includes(word.id) ? w : first ? w : [...w, word.id]));
      setFilled(true);
      sfx.combo(correctRef.current);
      window.setTimeout(() => sfx.coin(), 180);
      window.setTimeout(() => {
        if (index + 1 >= words.length) finish();
        else setIndex((n) => n + 1);
      }, 1500);
    } else {
      sfx.miss();
      setWrongPicks((w) => [...w, i]);
      setWrongIds((w) => (w.includes(word.id) ? w : [...w, word.id]));
    }
  };

  const next = () => {
    if (index + 1 >= words.length) finish();
    else setIndex((n) => n + 1);
  };

  const restart = () => {
    correctRef.current = 0;
    firstTryRef.current = 0;
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setFilled(false);
    setWrongPicks([]);
    setWrongIds([]);
    setReward(null);
    setSparkKey(0);
  };

  const wrongWords = wrongIds.map((id) => pool.find((w) => w.id === id)).filter((w): w is QuizWord => !!w);

  if (!word) {
    return <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">빈칸 게임에 쓸 예문이 아직 없어요.</p>;
  }

  const solved = correctRef.current;

  return (
    <div className="space-y-3">
      {reward ? (
        <GameResult
          emoji="🧩"
          title="문장 완성!"
          stats={`정답 ${correctRef.current} / ${words.length} · 한 번에 맞힌 문장 ${firstTryRef.current}`}
          reward={reward}
          limit={limit}
          onReplay={restart}
          onMenu={onMenu}
          onShop={onShop}
          extras={<WrongWords words={wrongWords} />}
        />
      ) : null}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 shadow-soft ring-1 ring-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-amber-200/50 blur-2xl" />
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
            {index + 1} / {words.length} · {solved}개 완성
          </span>
          <span className="text-[10px] font-semibold text-amber-700/70">빈칸에 알맞은 단어를 골라요</span>
        </div>

        {/* 말풍선 */}
        <div className="mt-3 flex items-start gap-2.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl shadow-soft">
            🧑‍🏫
          </div>
          <div className="bubble-in relative flex-1 rounded-3xl rounded-tl-md bg-white px-4 py-3.5 shadow-soft ring-1 ring-amber-100">
            <span className="absolute -left-1.5 top-3 h-3 w-3 rotate-45 bg-white ring-1 ring-amber-100" />
            <p className="text-[15px] font-semibold leading-7 text-slate-800" data-testid="eng-blank-sentence">
              {split ? (
                <>
                  {split.before}
                  <span
                    data-testid="eng-blank-slot"
                    className={cn(
                      'relative mx-0.5 inline-flex min-w-[74px] items-center justify-center rounded-lg border-b-2 px-1.5 align-middle transition',
                      filled ? 'border-emerald-400 bg-emerald-50' : 'border-dashed border-amber-400 bg-amber-50/80'
                    )}
                  >
                    {filled ? (
                      <span className="block-drop font-extrabold text-emerald-700">{split.matched}</span>
                    ) : (
                      <span className="h-5 w-12 rounded bg-amber-200/70" />
                    )}
                  </span>
                  {split.after}
                </>
              ) : (
                word.example
              )}
            </p>
            <p className="mt-1 text-[10.5px] text-slate-400">{word.exampleKo}</p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-end gap-1.5">
          <span className="text-[10px] text-slate-400">뜻</span>
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">{word.meaning}</span>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-2">
        {options.map((opt, i) => {
          const isAnswer = i === answerIndex;
          const used = wrongPicks.includes(i);
          const state = filled ? (isAnswer ? 'right' : 'dim') : used ? 'wrong' : 'idle';
          return (
            <button
              key={`${opt.id}-${i}`}
              data-testid={`eng-blank-option-${i}`}
              data-correct={isAnswer ? '1' : '0'}
              disabled={filled || used || !!reward}
              onClick={() => choose(i)}
              className={cn(
                'relative rounded-2xl px-3 py-3 text-[14px] font-extrabold transition active:scale-[0.98]',
                state === 'idle' && 'bg-white text-slate-800 shadow-soft ring-1 ring-slate-200 hover:-translate-y-0.5',
                state === 'right' && 'bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300',
                state === 'wrong' && 'animate-shake bg-rose-50 text-rose-400 ring-1 ring-rose-200 line-through',
                state === 'dim' && 'bg-slate-50 text-slate-400 ring-1 ring-slate-100'
              )}
            >
              {opt.word}
              {state === 'right' && filled ? (
                <span className="pointer-events-none absolute inset-0 grid place-items-center" key={sparkKey}>
                  <SparkBurst count={10} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {filled ? (
        <p className="animate-pop rounded-2xl bg-emerald-50 px-3 py-2 text-center text-[11.5px] font-semibold text-emerald-700">
          정답! {word.word} = {word.meaning} · {word.exampleKo}
        </p>
      ) : wrongPicks.length ? (
        <p className="rounded-2xl bg-rose-50 px-3 py-2 text-center text-[11.5px] font-semibold text-rose-600">
          아쉬워요. 문장의 뜻을 다시 읽고 다른 단어를 골라 봐요.
        </p>
      ) : (
        <p className="text-center text-[10.5px] text-slate-400">단어를 고르면 빈칸으로 날아가 문장이 완성돼요.</p>
      )}

      {filled && index + 1 < words.length ? (
        <button onClick={next} className="w-full rounded-2xl bg-slate-900 py-2.5 text-[13px] font-bold text-white active:scale-[0.99]">
          다음 문장
        </button>
      ) : null}
    </div>
  );
}
