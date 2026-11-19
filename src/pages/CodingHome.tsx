import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession, useVocaStore } from '../app-context';
import StudentNav from '../components/StudentNav';
import StudentHeader from '../components/StudentHeader';
import { Badge, Bar, Button, Card, SectionTitle } from '../components/ui';
import { buildCodingMission, buildCodingReview, CODING_GAME_LIST, CODING_GAME_META, shuffleChoices, type CodingMissionItem } from '../lib/coding';
import { problemById } from '../data/codingSeed';
import { sfx } from '../lib/sound';
import { cn, pct, weekStartStr, ymd } from '../lib/util';
import { CODING_LEVELS, CODING_LEVEL_META, CODING_KIND_META, type CodingGameKey, type CodingProblem, type Student } from '../types';

type Tab = 'today' | 'wrong';

/**
 * 💻 코딩 모드 홈 — 오늘의 코딩 미션과 코딩 오답노트.
 * 영어 홈(StudentHome)과 같은 라우트(`/`, `/?tab=wrong`)를 쓰고 과목에 따라 갈아 끼웁니다.
 */
export default function CodingHome() {
  const store = useVocaStore();
  const navigate = useNavigate();
  const { student, logout } = useSession();
  const [params] = useSearchParams();
  const tab: Tab = params.get('tab') === 'wrong' ? 'wrong' : 'today';

  const [mission, setMission] = useState<{ items: CodingMissionItem[]; mode: 'mission' | 'review' } | null>(null);

  if (!student) return null;

  const level = student.coding_level;
  const meta = CODING_LEVEL_META[level];
  const todayMission = buildCodingMission(student);
  const wrongNotes = store
    .codingWrongNotesFor(student.id)
    .map((n) => ({ note: n, problem: problemById(n.problem_id) }))
    .filter((x): x is { note: typeof x.note; problem: CodingProblem } => !!x.problem);

  const weekStart = weekStartStr();
  const weekLogs = store.codingLogsFor(student.id).filter((l) => ymd(new Date(l.answered_at)) >= weekStart);
  const weekCorrect = weekLogs.filter((l) => l.is_correct).length;

  const startMission = (items: CodingMissionItem[], mode: 'mission' | 'review') => {
    if (!items.length) return;
    setMission({ items, mode });
  };

  return (
    <div className="min-h-screen pb-safe">
      <StudentHeader
        icon="💻"
        brand="라피네코딩 두정점 · 코딩"
        title="라피네 클래스"
        accent="dark"
        right={
          <>
            <button
              onClick={() => navigate('/shop')}
              className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-200"
              data-testid="coding-cash"
            >
              💰 {store.cashBalance(student.id).toLocaleString()}원
            </button>
            <button
              onClick={logout}
              className="whitespace-nowrap rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
            >
              나가기
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-4" data-testid="coding-home">
        {mission ? (
          <MissionRunner
            student={student}
            items={mission.items}
            mode={mission.mode}
            onExit={() => setMission(null)}
            onGoGame={() => navigate('/game')}
          />
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-lg font-extrabold text-white shadow-soft">
                {student.name.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xl font-extrabold text-slate-900">안녕, {student.name}! 👋</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', meta.badge)} data-testid="coding-level-pill">
                    💻 {meta.label}
                  </span>
                  <span>{meta.desc} · {meta.grades}</span>
                </p>
              </div>
            </div>

            {tab === 'today' ? (
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-5 text-white shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white/70">오늘의 코딩 미션</p>
                      <p className="mt-1 text-2xl font-extrabold">{todayMission.target}문제</p>
                      <p className="mt-1 text-[13px] text-white/80">
                        출력 결과 {todayMission.items.filter((i) => i.problem.kind === 'output').length} · 빈칸 채우기{' '}
                        {todayMission.items.filter((i) => i.problem.kind === 'blank').length}
                        {todayMission.reviewCount > 0 ? ` · 오답 복습 ${todayMission.reviewCount}` : ''}
                      </p>
                    </div>
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-3xl">🖥️</div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      data-testid="coding-start-mission"
                      variant="sun"
                      size="lg"
                      className="flex-1"
                      onClick={() => startMission(todayMission.items, 'mission')}
                      disabled={!todayMission.items.length}
                    >
                      오늘의 코딩 미션 시작
                    </Button>
                    <button
                      onClick={() => navigate('/game')}
                      data-testid="coding-go-game"
                      className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/20"
                    >
                      🎮 코딩 게임 하기
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-3 text-center">
                    <div>
                      <p className="text-[10px] font-semibold text-white/60">이번 주 푼 문제</p>
                      <p className="text-lg font-extrabold">{weekLogs.length}</p>
                    </div>
                    <div className="border-x border-white/15">
                      <p className="text-[10px] font-semibold text-white/60">정답률</p>
                      <p className="text-lg font-extrabold">{pct(weekCorrect, weekLogs.length)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-white/60">오답 대기</p>
                      <p className="text-lg font-extrabold" data-testid="coding-wrong-count">
                        {wrongNotes.length}
                      </p>
                    </div>
                  </div>
                </section>

                <div className="space-y-4">
                  <Card>
                    <SectionTitle sub="원장님이 배정한 코딩 레벨이에요">나의 코딩 길</SectionTitle>
                    <ul className="mt-3 space-y-1.5">
                      {CODING_LEVELS.map((lv) => {
                        const active = lv === level;
                        return (
                          <li
                            key={lv}
                            data-testid={`coding-level-${lv}`}
                            className={cn(
                              'flex items-center gap-2 rounded-xl px-3 py-2 text-xs',
                              active ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'
                            )}
                          >
                            <span className="font-bold">{CODING_LEVEL_META[lv].short}</span>
                            <span className={cn('flex-1 truncate', active ? 'text-white/85' : 'text-slate-500')}>
                              {CODING_LEVEL_META[lv].desc}
                            </span>
                            {active ? <span className="text-[10px] font-bold text-sunny">지금</span> : null}
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                      레벨은 원장님이 관리자 화면에서 바꿔 줄 수 있어요. 문제를 다 풀면 다음 레벨로 올라가요.
                    </p>
                  </Card>

                  <Card>
                    <SectionTitle sub="캐시는 영어·코딩이 함께 써요">코딩 게임</SectionTitle>
                    <ul className="mt-3 space-y-1.5">
                      {CODING_GAME_LIST.map((key) => (
                        <li key={key} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                          <span className="text-base">{CODING_GAME_META[key].icon}</span>
                          <span className="flex-1 text-xs font-semibold text-slate-600">{CODING_GAME_META[key].label}</span>
                          <button
                            onClick={() => navigate(`/game?g=${key}`)}
                            className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200"
                          >
                            플레이
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                      오늘 적립 {store.todayCashEarned(student.id)} / {store.cashDailyLimit()}원 · 남은 금액은 영어 게임과 나눠 써요.
                    </p>
                  </Card>
                </div>
              </div>
            ) : (
              <section className="space-y-4">
                <Card className="bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-700">코딩 오답노트</p>
                      <p className="mt-1 text-xs text-slate-500">틀린 문제는 해설과 함께 여기 저장돼요. 다시 맞히면 졸업!</p>
                    </div>
                    <Button
                      size="sm"
                      variant="sun"
                      data-testid="coding-review-start"
                      disabled={!wrongNotes.length}
                      onClick={() => startMission(buildCodingReview(student).items, 'review')}
                    >
                      오답 복습
                    </Button>
                  </div>
                </Card>

                {wrongNotes.length === 0 ? (
                  <Card>
                    <p className="py-6 text-center text-sm text-slate-500" data-testid="coding-wrong-empty">
                      코딩 오답이 없어요. 아주 좋아요! 🎈
                    </p>
                  </Card>
                ) : (
                  wrongNotes.map(({ note, problem }) => (
                    <Card key={problem.id} className="p-4" data-testid="coding-wrong-item">
                      <div className="flex items-start gap-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', CODING_LEVEL_META[problem.level].badge)}>
                          {problem.level}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {CODING_KIND_META[problem.kind].icon} {CODING_KIND_META[problem.kind].label}
                        </span>
                        <span className="ml-auto text-[11px] font-semibold text-rose-400">{note.miss_count}번 틀림</span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-slate-900">{problem.prompt}</p>
                      {problem.code ? <CodeBlock code={problem.code} /> : null}
                      {problem.lines ? <CodeLines lines={problem.lines} answerLine={problem.answerLine} /> : null}
                      <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2" data-testid="coding-wrong-explain">
                        <p className="text-[11px] font-bold text-amber-700">해설</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-amber-900">{problem.explanation}</p>
                      </div>
                    </Card>
                  ))
                )}
              </section>
            )}
          </>
        )}
      </main>

      <StudentNav active="learn" />
    </div>
  );
}

/* ------------------------------- 공통 코드 표시 ------------------------------ */

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 px-3 py-2.5 text-[12px] leading-relaxed text-slate-100 thin-scroll">
      <code>{code}</code>
    </pre>
  );
}

function CodeLines({ lines, answerLine }: { lines: string[]; answerLine?: number }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 px-3 py-2.5 text-[12px] leading-relaxed text-slate-100 thin-scroll">
      <code>
        {lines.map((line, i) => (
          <div key={i} className={cn(answerLine === i && 'text-amber-300')}>
            {line}
          </div>
        ))}
      </code>
    </pre>
  );
}

/* --------------------------------- 미션 풀이 -------------------------------- */

function MissionRunner({
  student,
  items,
  mode,
  onExit,
  onGoGame,
}: {
  student: Student;
  items: CodingMissionItem[];
  mode: 'mission' | 'review';
  onExit: () => void;
  onGoGame: () => void;
}) {
  const store = useVocaStore();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [graded, setGraded] = useState<{ problem: CodingProblem; correct: boolean }[]>([]);
  const [done, setDone] = useState(false);

  const item = items[index];
  const problem = item.problem;
  const opts = useMemo(() => shuffleChoices(problem), [problem.id]);

  if (done) {
    const correct = graded.filter((g) => g.correct).length;
    const wrong = graded.filter((g) => !g.correct);
    return (
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-amber-50" data-testid="coding-result">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-slate-900">코딩 미션 끝! 🎉</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {CODING_LEVEL_META[student.coding_level].label} · 정답 <span data-testid="coding-result-score">{correct}</span> / {graded.length}
            </p>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 text-2xl text-white">
            {correct === graded.length ? '🏆' : '💪'}
          </div>
        </div>

        {wrong.length ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-bold text-slate-700">틀린 문제는 오답노트에 저장했어요 · 해설을 꼭 읽어 보세요</p>
            {wrong.map((g) => (
              <div key={g.problem.id} className="rounded-2xl bg-white px-3 py-2.5" data-testid="coding-result-wrong">
                <p className="text-[13px] font-bold text-slate-800">{g.problem.prompt}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{g.problem.explanation}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            한 문제도 틀리지 않았어요. 완벽해요! ✨
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" data-testid="coding-result-home" onClick={onExit}>
            코딩 홈으로
          </Button>
          <Button variant="sun" className="flex-1" onClick={onGoGame}>
            🎮 코딩 게임 하기
          </Button>
        </div>
      </Card>
    );
  }

  const isLast = index + 1 >= items.length;

  const choose = (i: number) => {
    if (picked !== null) return;
    const correct = i === opts.answer;
    setPicked(i);
    if (correct) sfx.match(1);
    else sfx.miss();
    store.recordCodingAnswer(student, problem, correct, mode === 'review' ? 'review' : 'mission');
    setGraded((g) => [...g, { problem, correct }]);
  };

  const next = () => {
    if (isLast) {
      setDone(true);
      sfx.win();
      return;
    }
    setIndex(index + 1);
    setPicked(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="text-xs font-semibold text-slate-400 hover:text-slate-600">
          ← 그만하기
        </button>
        <span className="text-xs font-bold text-slate-500" data-testid="coding-mission-progress">
          {index + 1} / {items.length}
        </span>
      </div>
      <Bar ratio={(index + (picked !== null ? 1 : 0)) / items.length} />

      <Card className="mt-1">
        <div className="flex items-center gap-1.5">
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', CODING_LEVEL_META[problem.level].badge)}>
            {problem.level}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {CODING_KIND_META[problem.kind].icon} {CODING_KIND_META[problem.kind].label}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">{problem.topic}</span>
          {item.kind === 'review' ? <Badge tone="sun">복습</Badge> : null}
        </div>

        <p className="mt-2 text-[15px] font-bold leading-snug text-slate-900">{problem.prompt}</p>
        {problem.code ? <CodeBlock code={problem.code} /> : null}

        <div className="mt-3 space-y-2">
          {opts.choices.map((choice, i) => {
            const isAnswer = i === opts.answer;
            const state = picked === null ? 'idle' : isAnswer ? 'right' : picked === i ? 'wrong' : 'dim';
            return (
              <button
                key={`${problem.id}-${i}`}
                data-testid={`coding-choice-${i}`}
                data-correct={isAnswer ? '1' : '0'}
                onClick={() => choose(i)}
                disabled={picked !== null}
                className={cn(
                  'flex w-full items-start gap-2 rounded-2xl px-3.5 py-3 text-left text-[13px] font-semibold transition',
                  state === 'idle' && 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-white',
                  state === 'right' && 'bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300',
                  state === 'wrong' && 'bg-rose-50 text-rose-700 ring-2 ring-rose-300',
                  state === 'dim' && 'bg-slate-50 text-slate-400 ring-1 ring-slate-100'
                )}
              >
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/80 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                  {i + 1}
                </span>
                <span className="whitespace-pre-line">{choice}</span>
              </button>
            );
          })}
        </div>

        {picked !== null ? (
          <div className="mt-3" data-testid="coding-feedback">
            <p className={cn('text-sm font-bold', picked === opts.answer ? 'text-emerald-600' : 'text-rose-500')}>
              {picked === opts.answer ? '정답이에요! 🎯' : '아쉬워요. 해설을 읽어 봐요.'}
            </p>
            <p className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-[12px] leading-relaxed text-slate-600" data-testid="coding-explanation">
              {problem.explanation}
            </p>
            <Button className="mt-3 w-full" data-testid="coding-next" onClick={next}>
              {isLast ? '결과 보기' : '다음 문제'}
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
