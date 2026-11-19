import { useState } from 'react';
import { useSession } from '../app-context';
import { useClassStore } from '../lib/classStore';
import { REVIEW_CARDS, type ConceptCard } from '../lib/reviewHints';
import { TRACK_META, type Track } from '../lib/curriculum';
import { cn } from '../lib/util';
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

  if (!student) return null;
  const cards = REVIEW_CARDS[track] ?? [];
  const meta = TRACK_META[track];

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

      <main className="mx-auto max-w-3xl px-4 pb-32 pt-5">
        <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-white to-brand-50 px-5 py-5 shadow-soft">
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

        <div className="mt-3 space-y-4">
          {cards.map((card) => (
            <ConceptCardView
              key={card.id}
              card={card}
              opened={opened}
              setOpened={setOpened}
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
}: {
  card: ConceptCard;
  opened: string | null;
  setOpened: (v: string | null) => void;
}) {
  return (
    <section className="rounded-3xl border border-white bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl">{card.emoji}</span>
        <div>
          <h2 className="text-[17px] font-extrabold leading-snug text-slate-900">{card.title}</h2>
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
