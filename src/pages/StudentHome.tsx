import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession, useTodayDone, useVocaStore } from '../app-context';
import { Badge, Bar, Button, Card, LevelPill, ProgressRing, SectionTitle } from '../components/ui';
import StudentNav from '../components/StudentNav';
import StudentHeader from '../components/StudentHeader';
import CodingHome from './CodingHome';
import { useSubject } from '../subject-context';
import { buildMission, buildReviewOnly } from '../lib/mission';
import { computeStreak, computeWeekStats, weeklyRanking } from '../lib/stats';
import { LEVEL_META } from '../types';
import { cn, formatKoShort, PAGE_W, pct, todayStr } from '../lib/util';

type Tab = 'today' | 'wrong' | 'rank';
const TABS: Tab[] = ['today', 'wrong', 'rank'];

/**
 * 학생 홈 — 원장님이 열어 준 과목에 따라 영어 홈과 코딩 홈을 갈아 끼웁니다.
 * 영어 기능은 그대로 EnglishHome 안에 있고, 코딩 모드일 때만 CodingHome 이 나옵니다.
 */
export default function StudentHome() {
  const { subject } = useSubject();
  return subject === 'coding' ? <CodingHome /> : <EnglishHome />;
}

function EnglishHome() {
  const store = useVocaStore();
  const navigate = useNavigate();
  const { student, logout } = useSession();
  const done = useTodayDone(student);
  const [params, setParams] = useSearchParams();
  const paramTab = params.get('tab');
  const tab: Tab = TABS.includes(paramTab as Tab) ? (paramTab as Tab) : 'today';
  const setTab = (next: Tab) => setParams(next === 'today' ? {} : { tab: next }, { replace: true });

  if (!student) return null;

  const mission = buildMission(student);
  const progress = store.getProgress(student.id);
  const stats = computeWeekStats(student);
  const streak = computeStreak(student.id);
  const ranking = weeklyRanking(student);
  const myRank = ranking.find((r) => r.isMe);
  const wrongNotes = store.wrongNotesFor(student.id)
    .map((n) => ({ note: n, word: store.wordById(n.word_id) }))
    .filter((x) => x.word);
  const lastWeek = stats.trend.length > 1 ? stats.trend[stats.trend.length - 2].words : 0;
  const delta = stats.wordsDone - lastWeek;

  const answered = progress?.answered ?? 0;
  const target = progress?.target || mission.target;

  const goStudy = (mode: 'today' | 'review') => {
    const m = mode === 'today' ? mission : buildReviewOnly(student);
    if (!m.items.length) return;
    store.startMission(student.id, mode === 'today' ? m.target : (progress?.target ?? m.target));
    navigate('/study', { state: { mode } });
  };

  return (
    <div className="min-h-screen pb-safe">
      <StudentHeader
        icon="📚"
        brand="라피네코딩 두정점 · 학습"
        title="라피네 클래스"
        right={
          <>
            <button
              onClick={() => navigate('/shop')}
              data-testid="home-cash"
              className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-200"
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

      <main className={cn(PAGE_W, 'pb-28 pt-4 md:pb-10')}>
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-extrabold text-white shadow-soft">
            {student.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xl font-extrabold text-slate-900">안녕, {student.name}! 👋</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <LevelPill level={student.level} />
              <span>
                {LEVEL_META[student.level].grades} · TOSEL {student.tosel_level} 대비
              </span>
            </p>
          </div>
        </div>

        {tab === 'today' ? (
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-indigo-700 p-5 text-white shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-white/70">오늘의 미션</p>
                  <p className="mt-1 text-2xl font-extrabold">
                    {done ? '오늘 완료! 🎉' : `${mission.target}단어`}
                  </p>
                  <p className="mt-1 text-[13px] text-white/80">
                    {done ? (
                      '학원 완료 표시가 붙었어요. 집에서는 안 해도 돼요.'
                    ) : (
                      <>
                        오답 {mission.reviewCount} + 신규 {mission.newCount} · 약 3분
                      </>
                    )}
                  </p>
                </div>
                <ProgressRing value={Math.min(answered, target)} total={target} />
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button data-testid="start-mission" variant="sun" size="lg" className="flex-1" onClick={() => goStudy('today')} disabled={!mission.items.length}>
                  {done ? '한 번 더 복습하기' : answered > 0 ? `이어서 하기 (${answered}/${target})` : '3분 시작하기'}
                </Button>
                {mission.reviewCount > 0 ? (
                  <button
                    onClick={() => setTab('wrong')}
                    className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/20"
                  >
                    오답 {mission.reviewCount}개 먼저 보기
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-3 text-center">
                <div>
                  <p className="text-[10px] font-semibold text-white/60">이번 주</p>
                  <p className="text-lg font-extrabold">{stats.wordsDone}</p>
                </div>
                <div className="border-x border-white/15">
                  <p className="text-[10px] font-semibold text-white/60">연속 출석</p>
                  <p className="text-lg font-extrabold">{streak}일</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-white/60">오답 대기</p>
                  <p className="text-lg font-extrabold">{wrongNotes.length}</p>
                </div>
              </div>
            </section>

            <div className="space-y-4">
              <Card>
                <SectionTitle sub="이번 주 기록이 쌓이는 중이에요">이번 주 나의 기록</SectionTitle>
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>완료 단어</span>
                      <span className="text-slate-800">{stats.wordsDone}개</span>
                    </div>
                    <Bar ratio={stats.wordsDone / Math.max(20, LEVEL_META[student.level].dailyNew * 5)} />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                    <span className="text-xs font-semibold text-slate-500">지난주보다</span>
                    <span className={cn('text-sm font-bold', delta >= 0 ? 'text-emerald-600' : 'text-slate-500')}>
                      {delta >= 0 ? `+${delta}` : delta}단어
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    정답률은 마지막 결과 화면에서만 볼 수 있어요. 중간에 숫자에 흔들리지 않게요.
                  </p>
                </div>
              </Card>

              <Card>
                <SectionTitle sub="월요일부터 일요일까지">학원 주간 랭킹</SectionTitle>
                <ul className="mt-3 space-y-1.5">
                  {ranking.slice(0, 5).map((r) => (
                    <li
                      key={r.studentId}
                      className={cn(
                        'flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm',
                        r.isMe ? 'bg-brand-50 font-bold text-brand-700' : 'text-slate-600'
                      )}
                    >
                      <span className="w-6 text-center">{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}</span>
                      <span className="flex-1 truncate">{r.nickname}</span>
                      <span className="tabular-nums">{r.words}단어</span>
                    </li>
                  ))}
                </ul>
                {myRank ? (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                    내 순위 {myRank.rank}위 · {myRank.nickname} · {myRank.words}단어
                  </p>
                ) : null}
              </Card>
            </div>
          </div>
        ) : null}

        {tab === 'today' ? (
          <section className="mt-4">
            <button
              onClick={() => navigate('/game')}
              data-testid="home-game-card"
              className="flex w-full items-center gap-4 rounded-3xl border border-white bg-gradient-to-r from-amber-50 via-white to-brand-50 p-4 text-left shadow-soft transition active:scale-[0.99] hover:shadow-card"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-2xl">🎮</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold text-slate-900">게임 놀이터</span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-slate-500">
                  영어 5종 · 코딩 5종, 오늘 배운 단어로 한 판
                </span>
              </span>
              <span className="text-lg text-slate-300">›</span>
            </button>
          </section>
        ) : null}

        {tab === 'wrong' ? (
          <section className="space-y-4">
            <Card className="bg-gradient-to-br from-amber-50 to-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-amber-700">오답 복습 큐</p>
                  <p className="mt-1 text-xs text-amber-700/80">
                    틀린 단어는 다음 날, 그다음은 2일 · 4일 · 7일 뒤에 다시 나와요.
                  </p>
                </div>
                <Button size="sm" variant="sun" onClick={() => goStudy('review')} disabled={!wrongNotes.length}>
                  복습 시작
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {wrongNotes.length === 0 ? (
                <Card>
                  <p className="py-6 text-center text-sm text-slate-500">오답이 없어요. 아주 좋아요! 🎈</p>
                </Card>
              ) : (
                wrongNotes.map(({ note, word }) => {
                  const due = note.due_date;
                  const isDue = due <= todayStr();
                  return (
                    <div key={note.id} className="flex items-center gap-3 rounded-2xl border border-white bg-white p-3 shadow-sm">
                      <span className={cn('grid h-9 w-9 place-items-center rounded-xl text-sm font-bold', isDue ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}>
                        {note.box}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2">
                          <span className="text-[15px] font-bold text-slate-900">{word!.word}</span>
                          <span className="text-[11px] text-slate-400">{word!.ipa}</span>
                        </p>
                        <p className="truncate text-xs text-slate-500">{word!.meaning}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-slate-400">{isDue ? '오늘 복습' : `${formatKoShort(due)} 예정`}</p>
                        <p className="text-[11px] font-semibold text-rose-400">{note.miss_count}번 틀림</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        ) : null}

        {tab === 'rank' ? (
          <section className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
            <Card>
              <SectionTitle sub={`${stats.weekLabel} · 닉네임으로 표시돼요`}>학원 주간 랭킹</SectionTitle>
              <ul className="mt-4 space-y-2">
                {ranking.map((r) => (
                  <li
                    key={r.studentId}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-3 py-2.5',
                      r.isMe ? 'bg-brand-50 ring-1 ring-brand-100' : 'bg-slate-50/60'
                    )}
                  >
                    <span className="w-7 text-center text-sm font-bold text-slate-500">
                      {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                    </span>
                    <span className={cn('flex-1 truncate text-sm', r.isMe ? 'font-bold text-brand-700' : 'text-slate-700')}>
                      {r.nickname} {r.isMe ? <span className="text-[11px] text-brand-500">(나)</span> : null}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-slate-600">{r.words}단어</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                실명과 학년은 다른 학생에게 보이지 않아요. 내 기록만 쌓이면 순위가 올라가요.
              </p>
            </Card>

            <Card>
              <SectionTitle sub="지난 4주 흐름">나의 성장</SectionTitle>
              <div className="mt-4 flex items-end justify-between gap-2">
                {stats.trend.map((t, i) => {
                  const max = Math.max(1, ...stats.trend.map((x) => x.words));
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold text-slate-500">{t.words}</span>
                      <div className="flex h-28 w-full items-end justify-center">
                        <div
                          className={cn('w-8 rounded-t-lg', i === stats.trend.length - 1 ? 'bg-brand-500' : 'bg-brand-200')}
                          style={{ height: `${Math.max(6, (t.words / max) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">{t.label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                이번 주 정답률은 결과 화면에서 확인해요. (첫 응답 기준 {pct(stats.correct, stats.answered)}%)
              </p>
            </Card>
          </section>
        ) : null}
      </main>

      <StudentNav active="learn" />
    </div>
  );
}
