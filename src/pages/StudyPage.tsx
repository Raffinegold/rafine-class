import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession, useVocaStore } from '../app-context';
import { Button, Card, Modal, ProgressRing, useToast } from '../components/ui';
import { buildChoices, buildMission, buildReviewOnly, type MissionItem } from '../lib/mission';
import { computeStreak, computeWeekStats } from '../lib/stats';
import { speak, speechSupported } from '../lib/speech';
import { cn, levenshtein, pct, shuffle } from '../lib/util';
import type { Word } from '../types';

type Stage = 'card' | 'choice' | 'spell' | 'result';

interface ChoiceQuestion {
  item: MissionItem;
  direction: 'word-to-meaning' | 'meaning-to-word';
  options: Word[];
}
interface SpellQuestion {
  item: MissionItem;
}

export default function StudyPage() {
  const store = useVocaStore();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { student } = useSession();
  const mode = ((location.state as { mode?: 'today' | 'review' } | null)?.mode ?? 'today') as 'today' | 'review';

  const [mission] = useState(() => (student ? (mode === 'today' ? buildMission(student) : buildReviewOnly(student)) : null));
  const items = mission?.items ?? [];

  const [stage, setStage] = useState<Stage>('card');
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [spellIndex, setSpellIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [spellValue, setSpellValue] = useState('');
  const [spellFeedback, setSpellFeedback] = useState<{ ok: boolean; note?: string } | null>(null);
  const [graded, setGraded] = useState<{ wordId: string; correct: boolean }[]>([]);
  const [questionStart, setQuestionStart] = useState(() => Date.now());
  const [exitOpen, setExitOpen] = useState(false);

  const choiceQuestions = useMemo<ChoiceQuestion[]>(() => {
    if (!student) return [];
    return items.map((item, i) => {
      const direction: ChoiceQuestion['direction'] =
        student.level <= 1
          ? 'word-to-meaning'
          : student.level === 2
            ? 'meaning-to-word'
            : student.level === 3
              ? i % 2 === 0
                ? 'word-to-meaning'
                : 'meaning-to-word'
              : 'meaning-to-word';
      const options = shuffle(buildChoices(item.word, student));
      return { item, direction, options };
    });
  }, [items, student]);

  const spellQuestions = useMemo<SpellQuestion[]>(() => items.map((item) => ({ item })), [items]);

  if (!student || !mission) return null;

  const totalSteps = Math.max(1, items.length);
  const overallDone =
    stage === 'card' ? cardIndex : stage === 'choice' ? totalSteps + choiceIndex : stage === 'spell' ? totalSteps * 2 + spellIndex : totalSteps * 3;
  const overallTotal = totalSteps * 3;

  const currentCard = items[cardIndex];
  const currentChoice = choiceQuestions[choiceIndex];
  const currentSpell = spellQuestions[spellIndex];

  const finish = () => setStage('result');

  const nextStage = () => {
    if (stage === 'card') {
      setStage('choice');
      setQuestionStart(Date.now());
      return;
    }
    if (stage === 'choice') {
      if (choiceIndex + 1 < choiceQuestions.length) {
        setChoiceIndex(choiceIndex + 1);
        setAnswer(null);
        setQuestionStart(Date.now());
      } else {
        setStage('spell');
        setQuestionStart(Date.now());
      }
      return;
    }
    if (stage === 'spell') {
      if (spellIndex + 1 < spellQuestions.length) {
        setSpellIndex(spellIndex + 1);
        setSpellValue('');
        setSpellFeedback(null);
        setQuestionStart(Date.now());
      } else {
        finish();
      }
    }
  };

  const onCardAnswer = (knew: boolean) => {
    store.recordAnswer(student, currentCard.word, knew, 'card', 3000);
    setFlipped(false);
    if (cardIndex + 1 < items.length) setCardIndex(cardIndex + 1);
    else {
      setStage('choice');
      setQuestionStart(Date.now());
    }
  };

  const onChoose = (word: Word) => {
    if (answer !== null) return;
    const correct = word.id === currentChoice.item.word.id;
    setAnswer(word.id);
    store.recordAnswer(student, currentChoice.item.word, correct, 'choice', Date.now() - questionStart);
    setGraded((g) => [...g, { wordId: currentChoice.item.word.id, correct }]);
  };

  const submitSpell = () => {
    if (spellFeedback) return;
    const target = currentSpell.item.word.word.toLowerCase().trim();
    const typed = spellValue.toLowerCase().trim();
    if (!typed) return;
    const dist = levenshtein(typed, target);
    const allowTypo = student.level >= 3;
    const ok = typed === target || (allowTypo && dist === 1);
    const note = ok && typed !== target ? '오타 1자는 봐줬어요. 철자를 한 번 더 확인해요.' : undefined;
    setSpellFeedback({ ok, note });
    store.recordAnswer(student, currentSpell.item.word, ok, 'spell', Date.now() - questionStart);
    setGraded((g) => [...g, { wordId: currentSpell.item.word.id, correct: ok }]);
  };

  const exitStudy = () => {
    setExitOpen(false);
    toast('여기까지 자동 저장했어요');
    navigate('/');
  };

  const gradedCorrect = graded.filter((g) => g.correct).length;
  const accuracy = pct(gradedCorrect, graded.length);
  const stats = computeWeekStats(student);
  const streak = computeStreak(student.id);

  if (!items.length) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-sm text-center">
          <p className="py-6 text-sm text-slate-600">배정된 단어가 없어요. 선생님께 레벨 배정을 부탁해 주세요.</p>
          <Button className="w-full" onClick={() => navigate('/')}>
            홈으로
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-safe">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExitOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
              aria-label="그만하기"
            >
              ✕
            </button>
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>
                  {stage === 'card' && '카드 암기'}
                  {stage === 'choice' && '4지선다 퀴즈'}
                  {stage === 'spell' && '스펠링 퀴즈'}
                  {stage === 'result' && '오늘의 결과'}
                </span>
                <span>
                  {stage !== 'result' ? `${Math.min(overallDone, overallTotal)}/${overallTotal}` : '완료'}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${stage === 'result' ? 100 : (overallDone / overallTotal) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {stage === 'card' && currentCard ? (
          <div>
            <p className="mb-3 text-center text-xs font-semibold text-slate-400">
              카드 {cardIndex + 1} / {items.length} · 카드를 눌러 뜻을 확인하세요
            </p>
            <div className="card-flip mx-auto max-w-md">
              <div className={cn('card-inner relative h-[320px] w-full', flipped && 'flipped')}>
                <button
                  onClick={() => setFlipped((f) => !f)}
                  className="card-face absolute inset-0 flex flex-col items-center justify-center rounded-[28px] bg-white p-6 text-center shadow-card ring-1 ring-slate-100"
                >
                  {currentCard.kind === 'review' ? (
                    <span className="mb-3 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">오답 복습</span>
                  ) : (
                    <span className="mb-3 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-600">신규 단어</span>
                  )}
                  <p className="text-[38px] font-extrabold leading-tight text-slate-900">{currentCard.word.word}</p>
                  <p className="mt-1 text-sm text-slate-400">{currentCard.word.ipa}</p>
                  {speechSupported() ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(currentCard.word.word);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') speak(currentCard.word.word);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                    >
                      🔊 발음 듣기
                    </span>
                  ) : null}
                  <p className="absolute bottom-4 text-[11px] text-slate-300">눌러서 뜻 보기</p>
                </button>
                <div className="card-face card-back absolute inset-0 flex flex-col justify-center rounded-[28px] bg-gradient-to-br from-brand-600 to-indigo-700 p-6 text-center text-white shadow-card">
                  <p className="text-lg font-extrabold">{currentCard.word.meaning}</p>
                  <p className="mt-1 text-xs text-white/60">
                    {currentCard.word.pos} · {currentCard.word.word} {currentCard.word.ipa}
                  </p>
                  {currentCard.word.example ? (
                    <div className="mt-5 rounded-2xl bg-white/10 p-3 text-left">
                      <p className="text-[13px] leading-relaxed">{currentCard.word.example}</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-white/75">{currentCard.word.example_ko}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mx-auto mt-5 flex max-w-md gap-2">
              <Button data-testid="card-unsure" variant="danger" className="flex-1" onClick={() => onCardAnswer(false)}>
                헷갈려요
              </Button>
              <Button data-testid="card-know" className="flex-1" onClick={() => onCardAnswer(true)}>
                외웠어요
              </Button>
            </div>
          </div>
        ) : null}

        {stage === 'choice' && currentChoice ? (
          <div className="mx-auto max-w-md">
            <p className="mb-3 text-center text-xs font-semibold text-slate-400">
              {choiceIndex + 1} / {choiceQuestions.length} · 정답을 고르세요
            </p>
            <Card className="text-center">
              {currentChoice.direction === 'word-to-meaning' ? (
                <>
                  <p className="text-[30px] font-extrabold text-slate-900">{currentChoice.item.word.word}</p>
                  <p className="mt-1 text-xs text-slate-400">{currentChoice.item.word.ipa}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">이 단어의 뜻은?</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-extrabold text-slate-900">{currentChoice.item.word.meaning}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">이 뜻에 맞는 영단어는?</p>
                </>
              )}
            </Card>
            <div className="mt-4 space-y-2">
              {currentChoice.options.map((opt, i) => {
                const isTarget = opt.id === currentChoice.item.word.id;
                const chosen = answer === opt.id;
                const revealed = answer !== null;
                return (
                  <button
                    key={opt.id}
                    data-testid="choice-option"
                    onClick={() => onChoose(opt)}
                    disabled={revealed}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left text-[15px] font-semibold transition',
                      !revealed && 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 active:scale-[0.99]',
                      revealed && isTarget && 'border-emerald-300 bg-emerald-50 text-emerald-800',
                      revealed && chosen && !isTarget && 'border-rose-300 bg-rose-50 text-rose-700',
                      revealed && !isTarget && !chosen && 'border-slate-100 text-slate-400'
                    )}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                      {i + 1}
                    </span>
                    <span className="flex-1">
                      {currentChoice.direction === 'word-to-meaning' ? opt.meaning : opt.word}
                    </span>
                    {revealed && isTarget ? <span className="text-emerald-600">✓</span> : null}
                    {revealed && chosen && !isTarget ? <span className="text-rose-500">✕</span> : null}
                  </button>
                );
              })}
            </div>

            {answer !== null ? (
              <div className="mt-4 animate-pop">
                {answer === currentChoice.item.word.id ? (
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">정답이에요! 👏</div>
                ) : (
                  <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <p className="font-bold">정답은 {currentChoice.item.word.word} ({currentChoice.item.word.meaning})</p>
                    <p className="mt-1 text-xs text-rose-500">괜찮아요. 내일 다시 만나요.</p>
                  </div>
                )}
                <Button data-testid="next-step" className="mt-3 w-full" size="lg" onClick={nextStage}>
                  다음
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {stage === 'spell' && currentSpell ? (
          <div className="mx-auto max-w-md">
            <p className="mb-3 text-center text-xs font-semibold text-slate-400">
              {spellIndex + 1} / {spellQuestions.length} · 철자를 입력하세요
              {student.level >= 3 ? ' (오타 1자 허용)' : ''}
            </p>
            <Card className="text-center">
              <p className="text-2xl font-extrabold text-slate-900">{currentSpell.item.word.meaning}</p>
              <p className="mt-1 text-xs text-slate-400">{currentSpell.item.word.pos}</p>
              {currentSpell.item.word.example ? (
                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[12px] leading-relaxed text-slate-500">
                  {currentSpell.item.word.example.replace(new RegExp(currentSpell.item.word.word, 'i'), '_____')}
                </p>
              ) : null}
              {speechSupported() ? (
                <button onClick={() => speak(currentSpell.item.word.word)} className="mt-3 text-xs font-semibold text-brand-600">
                  🔊 발음 힌트
                </button>
              ) : null}
            </Card>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSpell();
              }}
              className="mt-4"
            >
              <input
                autoFocus
                data-testid="spell-input"
                value={spellValue}
                onChange={(e) => setSpellValue(e.target.value)}
                disabled={!!spellFeedback}
                placeholder="영단어 입력"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={cn(
                  'w-full rounded-2xl border-2 bg-white px-4 py-4 text-center text-xl font-bold tracking-wide outline-none transition',
                  !spellFeedback && 'border-slate-200 focus:border-brand-400',
                  spellFeedback?.ok && 'border-emerald-300 bg-emerald-50 text-emerald-700',
                  spellFeedback && !spellFeedback.ok && 'border-rose-300 bg-rose-50 text-rose-700'
                )}
              />
              {!spellFeedback ? (
                <Button data-testid="spell-submit" type="submit" size="lg" className="mt-3 w-full" disabled={!spellValue.trim()}>
                  확인
                </Button>
              ) : (
                <div className="mt-3 animate-pop">
                  <div className={cn('rounded-2xl px-4 py-3 text-sm', spellFeedback.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
                    {spellFeedback.ok ? (
                      <p className="font-bold">정확해요! {spellFeedback.note ? <span className="font-medium">({spellFeedback.note})</span> : null}</p>
                    ) : (
                      <>
                        <p className="font-bold">정답은 {currentSpell.item.word.word}</p>
                        <p className="mt-1 text-xs text-rose-500">내일 다시 만나요.</p>
                      </>
                    )}
                  </div>
                  <Button data-testid="next-step" className="mt-3 w-full" size="lg" onClick={nextStage}>
                    다음
                  </Button>
                </div>
              )}
            </form>
          </div>
        ) : null}

        {stage === 'result' ? (
          <div className="mx-auto max-w-md space-y-4">
            <Card className="text-center">
              <p className="text-xs font-semibold text-slate-400">오늘의 결과</p>
              <div className="mt-3 flex justify-center">
                <div className="relative">
                  <ProgressRing
                    value={accuracy}
                    total={100}
                    size={140}
                    track="#e2e8f0"
                    labelClass="text-brand-700"
                    label={<span className="text-3xl font-extrabold">{accuracy}%</span>}
                  />
                </div>
              </div>
              <p className="mt-3 text-lg font-extrabold text-slate-900">
                {accuracy >= 90 ? '완벽에 가까워요! 🌟' : accuracy >= 70 ? '좋아요, 계속 가요! 💪' : '오늘도 해냈어요. 내일 다시 보면 돼요 🙂'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {items.length}단어 · 정답 {gradedCorrect} / {graded.length}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400">연속 출석</p>
                  <p className="text-lg font-extrabold text-slate-800">{streak}일</p>
                </div>
                <div className="border-x border-slate-200/70">
                  <p className="text-[10px] font-semibold text-slate-400">이번 주</p>
                  <p className="text-lg font-extrabold text-slate-800">{stats.wordsDone}단어</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400">오답</p>
                  <p className="text-lg font-extrabold text-slate-800">{store.wrongNotesFor(student.id).length}개</p>
                </div>
              </div>
              {store.isCompletedToday(student.id) ? (
                <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                  오늘 미션 완료! 학원 완료 표시가 붙었어요.
                </p>
              ) : null}
            </Card>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => navigate('/')}>
                홈으로
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  toast('오답 노트는 홈에서 다시 볼 수 있어요');
                  navigate('/');
                }}
              >
                오답 확인
              </Button>
            </div>
            <p className="text-center text-[11px] text-slate-400">결과와 오답은 자동으로 저장됐어요.</p>
          </div>
        ) : null}
      </main>

      <Modal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title="여기서 그만할까요?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExitOpen(false)}>
              계속하기
            </Button>
            <Button variant="danger" onClick={exitStudy}>
              그만하기
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          지금까지 푼 문항은 이미 저장됐어요. 나중에 같은 계정으로 다시 들어오면 이어서 풀 수 있어요.
        </p>
      </Modal>
    </div>
  );
}
