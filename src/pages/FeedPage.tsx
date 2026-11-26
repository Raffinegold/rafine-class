import { useEffect, useMemo, useState } from 'react';
import { useSession } from '../app-context';
import StudentHeader from '../components/StudentHeader';
import StudentNav from '../components/StudentNav';
import { Card } from '../components/ui';
import { ddayLabel, daysUntil, loadFeed, type Competition, type NewsItem } from '../lib/onetouch';
import { cn, PAGE_W } from '../lib/util';

type Tab = 'contest' | 'news';
type Target = 'all' | 'elem' | 'middle' | 'high';

const TARGET_LABEL: Record<Target, string> = { all: '전체', elem: '초등', middle: '중등', high: '고등' };
const TARGET_CHIP: Record<Target, string> = {
  all: 'bg-slate-100 text-slate-600',
  elem: 'bg-sky-100 text-sky-700',
  middle: 'bg-emerald-100 text-emerald-700',
  high: 'bg-violet-100 text-violet-700',
};

export default function FeedPage() {
  const { student, logout } = useSession();
  const [tab, setTab] = useState<Tab>('contest');
  const [target, setTarget] = useState<Target>('all');
  const [data, setData] = useState<{ competitions: Competition[]; news: NewsItem[] }>({ competitions: [], news: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadFeed()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const competitions = useMemo(
    () => (target === 'all' ? data.competitions : data.competitions.filter((c) => c.target === 'all' || c.target === target)),
    [data.competitions, target]
  );

  const upcoming = competitions.filter((c) => {
    const d = daysUntil(c.end_date);
    return d === null || d >= 0;
  });
  const past = competitions.filter((c) => {
    const d = daysUntil(c.end_date);
    return d !== null && d < 0;
  });

  return (
    <div className="min-h-screen pb-safe">
      <StudentHeader
        icon="🏆"
        brand="라피네 클래스"
        title="대회 & IT뉴스"
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

      <main className={cn(PAGE_W, 'pb-28 pt-4 md:pb-10')} data-testid="feed-page">
        <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-5 py-5 text-white shadow-card">
          <p className="text-xs font-semibold text-white/60">코딩 대회 · 새 소식</p>
          <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">도전할 대회와 오늘의 IT 소식</h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/75">
            {student ? `${student.name} 학생이 볼 수 있게 ` : ''}학원에서 확인한 일정과 소식을 모았어요. 마감일은 주최 측 공고를 한 번 더 확인해 주세요.
          </p>
        </section>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 sm:w-auto sm:min-w-[280px]">
            {(
              [
                ['contest', '🏆 대회'],
                ['news', '📰 IT뉴스'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                data-testid={`feed-tab-${key}`}
                className={cn(
                  'rounded-xl px-3 py-2.5 text-[13px] font-bold transition',
                  tab === key ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'contest' ? (
            <div className="flex w-full gap-1 overflow-x-auto thin-scroll sm:w-auto">
              {(['all', 'elem', 'middle', 'high'] as Target[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  data-testid={`feed-target-${t}`}
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold transition',
                    target === t ? 'bg-brand-600 text-white shadow-soft' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
                  )}
                >
                  {TARGET_LABEL[t]}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm font-semibold text-slate-400">불러오는 중…</p>
        ) : error ? (
          <Card className="mt-4 py-10 text-center">
            <p className="text-3xl">😥</p>
            <p className="mt-2 text-sm font-bold text-slate-700">소식을 불러오지 못했어요</p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
          </Card>
        ) : tab === 'contest' ? (
          <section className="mt-4 space-y-5" data-testid="feed-competitions">
            {upcoming.length === 0 && past.length === 0 ? (
              <EmptyCard text="지금은 확인된 대회 일정이 없어요. 새 일정이 올라오면 바로 보여 드릴게요." />
            ) : null}

            {upcoming.length ? (
              <div>
                <h2 className="mb-2 px-1 text-[13px] font-extrabold text-slate-700">
                  지금 도전할 수 있어요 <span className="text-brand-600">{upcoming.length}</span>
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {upcoming.map((c) => (
                    <CompetitionCard key={c.id} c={c} />
                  ))}
                </div>
              </div>
            ) : null}

            {past.length ? (
              <div>
                <h2 className="mb-2 px-1 text-[13px] font-extrabold text-slate-400">지난 일정 (내년 계획용)</h2>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {past.map((c) => (
                    <CompetitionCard key={c.id} c={c} muted />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="feed-news">
            {data.news.length === 0 ? <EmptyCard text="아직 등록된 소식이 없어요." /> : null}
            {data.news.map((n) => (
              <NewsCard key={n.id} n={n} />
            ))}
          </section>
        )}

        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
          일정·접수 조건은 주최 기관 공고가 기준입니다. 신청 전에 공식 페이지에서 꼭 확인하세요.
        </p>
      </main>

      <StudentNav active="feed" />
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <Card className="py-10 text-center md:col-span-2 xl:col-span-3">
      <p className="text-3xl">🗓️</p>
      <p className="mt-2 text-sm font-semibold text-slate-600">{text}</p>
    </Card>
  );
}

function CompetitionCard({ c, muted = false }: { c: Competition; muted?: boolean }) {
  const days = daysUntil(c.end_date);
  const badge = ddayLabel(days);
  const tone =
    badge.tone === 'urgent'
      ? 'bg-rose-500 text-white'
      : badge.tone === 'soon'
      ? 'bg-amber-400 text-slate-900'
      : badge.tone === 'open'
      ? 'bg-emerald-500 text-white'
      : badge.tone === 'done'
      ? 'bg-slate-200 text-slate-500'
      : 'bg-slate-100 text-slate-500';

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-3xl border border-white bg-white p-4 shadow-soft transition hover:shadow-card',
        muted && 'opacity-70'
      )}
      data-testid={`competition-${c.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-slate-400">{c.host ?? '주최 기관'}</p>
          <h3 className="mt-0.5 text-[15px] font-extrabold leading-snug text-slate-900">{c.title}</h3>
        </div>
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold tabular-nums', tone)} data-testid="competition-dday">
          {badge.text}
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', TARGET_CHIP[c.target])}>
          {TARGET_LABEL[c.target]}
        </span>
        {c.end_date ? (
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            접수 ~ {c.end_date.replace(/-/g, '.')}
          </span>
        ) : null}
        {c.event_date ? (
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            대회 {c.event_date.replace(/-/g, '.')}
          </span>
        ) : null}
      </div>

      {c.summary ? (
        <p className="mt-2 line-clamp-5 whitespace-pre-line text-[12px] leading-relaxed text-slate-600">{c.summary}</p>
      ) : null}

      <div className="mt-auto pt-3">
        {c.url ? (
          <a
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-brand-50 px-3 py-2.5 text-[12.5px] font-bold text-brand-700 transition hover:bg-brand-100"
          >
            공식 안내 보기 <span aria-hidden>↗</span>
          </a>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center text-[12px] font-semibold text-slate-400">
            자세한 안내는 학원에서
          </p>
        )}
      </div>
    </article>
  );
}

function NewsCard({ n }: { n: NewsItem }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-white bg-white p-4 shadow-soft" data-testid={`news-${n.id}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        {n.tag ? <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">{n.tag}</span> : null}
        <span className="text-[11px] font-semibold text-slate-400">
          {n.source ?? '뉴스'} · {n.published_at?.replace(/-/g, '.') ?? ''}
        </span>
      </div>
      <h3 className="mt-1.5 text-[15px] font-extrabold leading-snug text-slate-900">{n.title}</h3>
      {n.summary ? <p className="mt-1.5 whitespace-pre-line text-[12px] leading-relaxed text-slate-600">{n.summary}</p> : null}
      <div className="mt-auto pt-3">
        {n.url ? (
          <a
            href={n.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-bold text-brand-700 hover:underline"
          >
            기사 읽기 <span aria-hidden>↗</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
