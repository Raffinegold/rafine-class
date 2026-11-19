import { useEffect, useMemo, useRef, useState } from 'react';
import { useVocaStore } from '../../app-context';
import { duckBgm, sfx } from '../../lib/sound';
import { speak, speechSupported } from '../../lib/speech';
import { cn } from '../../lib/util';
import type { Student } from '../../types';
import { GameResult, SparkBurst, WrongWords, usePayout, type Reward } from '../common';
import { buildChoices, pickWords, toQuizWords, type QuizWord } from './words';

const ROUNDS = 6;

/** 🔊 발음 듣고 맞히기 — 원어민 발음 + 실시간 음파 애니메이션 */
export default function ListenGame({
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
  const supported = speechSupported();

  const pool = useMemo(() => {
    const mine = store.wordsOfStudent(student);
    return toQuizWords(mine.length >= 8 ? mine : store.wordsForLevel(student.level));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id, student.level]);

  const [round, setRound] = useState(0);
  const words = useMemo(() => pickWords(pool, ROUNDS), [pool, round]);
  const [index, setIndex] = useState(0);
  const [rate, setRate] = useState(0.9);
  const [speaking, setSpeaking] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [breaks, setBreaks] = useState(0);
  const [sparkKey, setSparkKey] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [reward, setReward] = useState<Reward | null>(null);
  const [revealed, setRevealed] = useState(false);
  const startRef = useRef(0);
  const correctRef = useRef(0);
  const duckTimer = useRef(0);
  const limit = store.cashDailyLimit();
  const word: QuizWord | undefined = words[index];
  const options = useMemo(() => (word ? buildChoices(word, pool, (w) => w.meaning, 4) : []), [word, pool]);
  const answerIndex = word ? options.findIndex((o) => o.meaning === word.meaning) : -1;
  const answered = picked !== null;

  const play = (text: string, r = rate) => {
    if (!supported) {
      setRevealed(true);
      return;
    }
    const ok = speak(text, r);
    if (!ok) {
      setRevealed(true);
      return;
    }
    setSpeaking(true);
    const ms = 700 + text.length * 78;
    window.setTimeout(() => setSpeaking(false), ms);
    // 발음을 듣는 동안에는 배경음악을 더 낮춰 발음을 가리지 않게 합니다.
    duckBgm(true);
    window.clearTimeout(duckTimer.current);
    duckTimer.current = window.setTimeout(() => duckBgm(false), ms + 120);
  };

  useEffect(
    () => () => {
      window.clearTimeout(duckTimer.current);
      duckBgm(false);
    },
    []
  );

  useEffect(() => {
    setPicked(null);
    setRevealed(!supported);
    startRef.current = Date.now();
    if (!word) return;
    const t = window.setTimeout(() => play(word.word), 320);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, word?.id]);

  const finish = (breaks: number) => {
    const rows = [
      { label: `정답 ${correctRef.current} × 2원`, value: correctRef.current * 2 },
      { label: '스피드 보너스', value: breaks === 0 ? 2 : 0 },
      { label: '만점 보너스', value: correctRef.current === words.length ? 2 : 0 },
    ];
    const r = payout(rows);
    store.recordGameSession(student.id, {
      pairs: words.length,
      attempts: words.length,
      durationMs: 0,
      cashEarned: r.earned,
      wrongWordIds: wrongIds,
      game: 'listen',
      score: correctRef.current,
      total: words.length,
    });
    setReward(r);
    sfx.win();
  };

  const answer = (i: number) => {
    if (picked !== null || reward || !word) return;
    setPicked(i);
    const ok = i === answerIndex;
    if (ok) {
      correctRef.current += 1;
      sfx.combo(correctRef.current);
      setSparkKey((k) => k + 1);
      play(word.word);
      window.setTimeout(() => {
        if (index + 1 >= words.length) finish(breaks);
        else setIndex((n) => n + 1);
      }, 1150);
    } else {
      sfx.miss();
      setWrongIds((w) => (w.includes(word.id) ? w : [...w, word.id]));
      setBreaks((n) => n + 1);
      play(word.word);
    }
  };

  const next = () => {
    if (index + 1 >= words.length) finish(breaks);
    else setIndex((n) => n + 1);
  };

  const restart = () => {
    correctRef.current = 0;
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setBreaks(0);
    setWrongIds([]);
    setReward(null);
    setRevealed(!supported);
    setSparkKey(0);
  };

  const wrongWords = wrongIds.map((id) => pool.find((w) => w.id === id)).filter((w): w is QuizWord => !!w);

  if (!word) {
    return <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">리스닝에 쓸 단어가 아직 없어요.</p>;
  }

  const showWord = !supported || revealed || picked !== null;

  return (
    <div className="space-y-3">
      {reward ? (
        <GameResult
          emoji="🎧"
          title="리스닝 클리어!"
          stats={`정답 ${correctRef.current} / ${words.length} · 다시 들은 횟수 ${breaks}`}
          reward={reward}
          limit={limit}
          onReplay={restart}
          onMenu={onMenu}
          onShop={onShop}
          extras={<WrongWords words={wrongWords} />}
        />
      ) : null}

      {/* 발음 무대 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950 via-violet-900 to-fuchsia-900 p-4 shadow-card">
        <div className="pointer-events-none absolute -left-6 -top-8 h-32 w-32 rounded-full bg-fuchsia-500/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 right-0 h-32 w-32 rounded-full bg-cyan-400/20 blur-2xl" />

        <div className="relative flex flex-col items-center">
          <div className="relative mt-1 grid h-24 w-24 place-items-center">
            {speaking ? (
              <>
                <span className="pulse-ring absolute inset-0 rounded-full border-2 border-cyan-300/70" />
                <span className="pulse-ring absolute inset-0 rounded-full border-2 border-fuchsia-300/60" style={{ animationDelay: '0.5s' }} />
              </>
            ) : null}
            <button
              data-testid="eng-listen-play"
              onClick={() => play(word.word)}
              className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-3xl text-white shadow-[0_0_30px_rgba(34,211,238,0.55)] transition active:scale-95"
              aria-label="발음 듣기"
            >
              🔊
            </button>
          </div>

          {/* 음파 */}
          <div className="mt-3 flex h-10 items-end gap-[3px]">
            {Array.from({ length: 22 }).map((_, i) => {
              const mid = Math.abs(i - 10.5) / 10.5;
              const height = 8 + (1 - mid) * 26;
              return (
                <span
                  key={i}
                  className={cn('w-[4px] rounded-full bg-gradient-to-t from-cyan-300 to-fuchsia-300', speaking && 'eq-bar')}
                  style={{
                    height: speaking ? height : Math.max(4, height * 0.22),
                    animationDelay: `${(i % 7) * 90}ms`,
                    animationDuration: `${520 + (i % 5) * 90}ms`,
                    opacity: speaking ? 0.95 : 0.35,
                  }}
                />
              );
            })}
          </div>

          <p className="mt-2 h-6 text-center text-[15px] font-extrabold tracking-wide text-white" data-testid="eng-listen-word">
            {showWord ? (
              <span className="bubble-in">
                {word.word} <span className="text-[11px] font-semibold text-white/60">{word.ipa}</span>
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-white/60">귀를 기울여 보세요…</span>
            )}
          </p>

          <div className="mt-1 flex items-center gap-2">
            <button
              data-testid="eng-listen-replay"
              onClick={() => play(word.word)}
              className="rounded-full bg-white/15 px-3 py-1 text-[10.5px] font-bold text-white ring-1 ring-white/25 active:scale-95"
            >
              🔁 다시 듣기
            </button>
            <div className="flex overflow-hidden rounded-full bg-white/15 p-0.5 ring-1 ring-white/25">
              {[0.8, 0.9].map((r) => (
                <button
                  key={r}
                  data-testid={`eng-listen-rate-${r}`}
                  onClick={() => {
                    setRate(r);
                    play(word.word, r);
                  }}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-bold transition',
                    rate === r ? 'bg-white text-indigo-900' : 'text-white/80'
                  )}
                >
                  {r === 0.9 ? '1.0x' : '0.8x'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!supported ? (
        <p className="rounded-2xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
          이 기기에서는 음성 재생이 안 돼서 단어를 글자로 보여 줘요. 뜻을 고르는 건 그대로 즐길 수 있어요.
        </p>
      ) : null}

      <div className="rounded-3xl bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
            {index + 1} / {words.length}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">들린 발음의 뜻은?</span>
        </div>
        <div className="relative mt-2.5 grid grid-cols-2 gap-2">
          {options.map((opt, i) => {
            const isAnswer = i === answerIndex;
            const state = picked === null ? 'idle' : isAnswer ? 'right' : picked === i ? 'wrong' : 'dim';
            return (
              <button
                key={`${opt.id}-${i}`}
                data-testid={`eng-listen-option-${i}`}
                data-correct={isAnswer ? '1' : '0'}
                disabled={answered || !!reward}
                onClick={() => answer(i)}
                className={cn(
                  'relative min-h-[52px] rounded-2xl px-3 py-2.5 text-[12.5px] font-bold leading-snug transition active:scale-[0.98]',
                  state === 'idle' && 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-white',
                  state === 'right' && 'bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300',
                  state === 'wrong' && 'bg-rose-50 text-rose-700 ring-2 ring-rose-300',
                  state === 'dim' && 'bg-slate-50 text-slate-400 ring-1 ring-slate-100'
                )}
              >
                {opt.meaning}
                {state === 'right' ? (
                  <span className="pointer-events-none absolute inset-0 grid place-items-center" key={sparkKey}>
                    <SparkBurst count={12} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {answered ? (
          <div className="mt-3">
            <p className={cn('text-[12px] font-bold', picked === answerIndex ? 'text-emerald-600' : 'text-rose-500')}>
              {picked === answerIndex ? '정답이에요! 발음을 한 번 더 들어 봐요 🎧' : `아쉬워요. 정답은 '${word.meaning}'`}
            </p>
            <p className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-[11.5px] text-slate-600">
              {word.word} {word.ipa} · {word.meaning}
            </p>
            {picked !== answerIndex ? (
              <button
                data-testid="eng-listen-next"
                onClick={next}
                className="mt-2 w-full rounded-2xl bg-slate-900 py-2.5 text-[13px] font-bold text-white active:scale-[0.99]"
              >
                다음 단어
              </button>
            ) : null}
          </div>
        ) : (
          <p className="mt-2.5 text-center text-[10.5px] text-slate-400">발음을 듣고 뜻을 고르세요. 정답이면 다음 단어로 넘어가요.</p>
        )}
      </div>
    </div>
  );
}
