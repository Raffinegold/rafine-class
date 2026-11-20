import { useMemo, useState } from 'react';
import { useSession } from '../app-context';
import { useClassStore } from '../lib/classStore';
import { REVIEW_CARDS, highlightForWeek, type ConceptCard } from '../lib/reviewHints';
import { TRACK_META, type Track } from '../lib/curriculum';
import { cn, nameWithSubject } from '../lib/util';
import StudentHeader from '../components/StudentHeader';
import StudentNav from '../components/StudentNav';

const TRACK_TABS: Track[] = ['scratch', 'python', 'roblox', 'unity'];

export default function ReviewHintsPage() {
  const cls = useClassStore();
  const { student, logout } = useSession();
  const myTrack = student ? cls.profile(student.id, student.coding_level).track : 'scratch';
  const initial: Track = TRACK_TABS.includes(myTrack) ? myTrack : 'scratch';
  const [track, setTrack] = useState<Track>(initial);
  const [opened, setOpened] = useState<string | null>(null);

  /* 원장님이 체크한 24주 진도 → 다음에 배울 주차를 그대로 힌트로 연결합니다 */
  const highlight = useMemo(() => {
    if (!student) return null;
    const nextWeek = cls.nextWeek(student.id);
    const doneCount = cls.doneWeeks(student.id).length;
    return highlightForWeek(myTrack, nextWeek, doneCount);
    // cls.version 이 바뀌면(주차 체크) 카드가 바로 새 주차로 바뀝니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, myTrack, cls.version]);

  if (!student) return null;
  const cards = REVIEW_CARDS[track] ?? [];
  const meta = TRACK_META[track];
  const highlightIds = new Set(highlight?.cards.map((c) => c.id) ?? []);

  const jumpToCard = (card: ConceptCard) => {
    setTrack(myTrack);
    setOpened(`${card.id}-0`);
    window.setTimeout(() => {
      document.getElementById(`hint-card-${card.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  return (
    <div className="min-h-screen pb-safe">
      <StudentHeader
        icon="💡"
        brand="라피네 클래스"
        title="복습 힌트"
        hideSubjectSwitch
        right={
          <button
            onClick={logout}
            className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
          >
            나가기
          </button>
        }
      />

      <main className="mx-auto w-full max-w-3xl px-4 pb-32 pt-5 md:max-w-5xl md:px-6 md:pb-16 lg:max-w-6xl">
        {highlight ? (
          <section
            data-testid="hint-week-highlight"
            className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-brand-50 px-4 py-4 shadow-card"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-extrabold text-amber-700">
                🔥 지금 {nameWithSubject(student.name)} 배우는 {highlight.plan.week}주차 핵심 힌트
              </p>
              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                {TRACK_META[myTrack].emoji} {TRACK_META[myTrack].short}
              </span>
            </div>

            <p className="mt-1.5 text-[17px] font-extrabold leading-snug text-slate-900" data-testid="hint-week-title">
              {highlight.plan.week}주차 · {highlight.plan.title}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">
              이번 주 목표 — {highlight.plan.goal}
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${Math.round((highlight.doneCount / 24) * 100)}%` }}
                />
              </div>
              <span className="text-[10.5px] font-bold text-slate-400">24주 중 {highlight.doneCount}주 완료</span>
            </div>

            <ul className="mt-3 space-y-2">
              {highlight.cards.map((card) => (
                <li key={card.id} className="rounded-2xl bg-white/90 px-3.5 py-3 ring-1 ring-amber-100">
                  <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-slate-800">
                    <span>{card.emoji}</span>
                    {card.title}
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">{card.oneLiner}</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {card.points.slice(0, 3).map((point) => (
                      <li key={point} className="flex gap-1.5 text-[12px] leading-relaxed text-slate-600">
                        <span className="text-amber-400">·</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => jumpToCard(card)}
                    data-testid={`hint-week-open-${card.id}`}
                    className="mt-2 rounded-xl bg-amber-400/90 px-2.5 py-1.5 text-[11px] font-extrabold text-slate-900 transition active:scale-[0.98] hover:bg-amber-400"
                  >
                    막힐 때 보는 힌트 펼치기
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10.5px] leading-relaxed text-amber-700/80">
              {highlight.plan.week === 24
                ? '마지막 주차예요. 메인 작품 발표까지 힘내요!'
                : `이번 주를 끝내면 다음은 ${highlight.plan.week + 1}주차로 넘어가요.`}
            </p>
          </section>
        ) : null}

        <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-brand-50 px-5 py-5 shadow-soft">
          <h1 className="text-xl font-extrabold text-slate-900">집에서 막힐 때 보는 카드</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            정답 코드는 없어요. 대신 어디를 먼저 보면 되는지 알려 줘요. 스스로 한 번 찾아보는 게 제일 오래 남아요.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {TRACK_TABS.map((t) => (
            <button
              key={t}
              data-testid={`hint-track-${t}`}
              onClick={() => {
                setTrack(t);
                setOpened(null);
              }}
              className={cn(
                'rounded-2xl border px-1 py-2.5 text-[12px] font-bold transition',
                track === t
                  ? 'border-brand-200 bg-brand-600 text-white shadow-soft'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              )}
            >
              <span className="block text-lg leading-none">{TRACK_META[t].emoji}</span>
              <span className="mt-1 block">{TRACK_META[t].short}</span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-[12px] font-semibold text-slate-400">
          {meta.emoji} {meta.label} · {meta.summary}
        </p>

        <div className="mt-3 grid gap-4 md:grid-cols-2 md:items-start lg:grid-cols-2">
          {cards.map((card) => (
            <ConceptCardView
              key={card.id}
              card={card}
              opened={opened}
              setOpened={setOpened}
              thisWeek={highlightIds.has(card.id) && track === myTrack}
            />
          ))}
        </div>
      </main>

      <StudentNav active="hints" />
    </div>
  );
}

function ConceptCardView({
  card,
  opened,
  setOpened,
  thisWeek,
}: {
  card: ConceptCard;
  opened: string | null;
  setOpened: (v: string | null) => void;
  thisWeek?: boolean;
}) {
  return (
    <section
      id={`hint-card-${card.id}`}
      className={cn(
        'scroll-mt-24 rounded-3xl border bg-white p-5 shadow-soft',
        thisWeek ? 'border-amber-300 ring-2 ring-amber-200' : 'border-white'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl">{card.emoji}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-[17px] font-extrabold leading-snug text-slate-900">{card.title}</h2>
            {thisWeek ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">이번 주</span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{card.oneLiner}</p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 rounded-2xl bg-slate-50 px-4 py-3">
        {card.points.map((p) => (
          <li key={p} className="flex gap-2 text-[13px] leading-relaxed text-slate-600">
            <span className="text-brand-400">·</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 space-y-2">
        {card.blockers.map((b, i) => {
          const key = `${card.id}-${i}`;
          const isOpen = opened === key;
          return (
            <div key={key} className="overflow-hidden rounded-2xl border border-slate-100">
              <button
                onClick={() => setOpened(isOpen ? null : key)}
                className="flex w-full items-center justify-between gap-2 bg-white px-4 py-3 text-left"
                data-testid={`hint-${key}`}
              >
                <span className="text-[13px] font-bold text-slate-700">🙋 {b.symptom}</span>
                <span className={cn('text-xs font-bold text-brand-500 transition', isOpen && 'rotate-180')}>▾</span>
              </button>
              {isOpen ? (
                <div className="space-y-2 border-t border-slate-100 bg-amber-50/50 px-4 py-3">
                  {b.hints.map((h, hi) => (
                    <p key={hi} className="text-[13px] leading-relaxed text-slate-700">
                      <span className="mr-1.5 font-extrabold text-amber-600">{hi + 1}</span>
                      {h}
                    </p>
                  ))}
                  <p className="rounded-xl bg-white px-3 py-2 text-[12px] leading-relaxed text-slate-500">
                    스스로 확인: {b.check}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
