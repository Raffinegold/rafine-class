import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../app-context';
import AdminNav from '../../components/AdminNav';
import { Button, Card, Modal, useToast } from '../../components/ui';
import {
  deleteCompetition,
  deleteNews,
  loadFeedAdmin,
  saveCompetition,
  saveNews,
  toggleCompetition,
  toggleNews,
  type AdminCompetition,
  type AdminNews,
  type CompetitionInput,
  type NewsInput,
} from '../../lib/adminApi';
import { cn, PAGE_W_WIDE, todayStr } from '../../lib/util';

const TARGETS: { key: 'all' | 'elem' | 'middle' | 'high'; label: string }[] = [
  { key: 'all', label: '초·중·고 전체' },
  { key: 'elem', label: '초등' },
  { key: 'middle', label: '중등' },
  { key: 'high', label: '고등' },
];

const EMPTY_COMP: CompetitionInput = {
  title: '',
  host: '',
  target: 'all',
  start_date: '',
  end_date: '',
  event_date: '',
  url: '',
  summary: '',
  visible: true,
  sort_no: 0,
};

const EMPTY_NEWS: NewsInput = {
  title: '',
  source: '',
  url: '',
  summary: '',
  tag: '',
  published_at: todayStr(),
  visible: true,
  sort_no: 0,
};

export default function AdminFeedPage() {
  const { logout } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<'contest' | 'news'>('contest');
  const [competitions, setCompetitions] = useState<AdminCompetition[]>([]);
  const [news, setNews] = useState<AdminNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compForm, setCompForm] = useState<CompetitionInput | null>(null);
  const [newsForm, setNewsForm] = useState<NewsInput | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await loadFeedAdmin();
      setCompetitions(data.competitions);
      setNews(data.news);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitComp = async () => {
    if (!compForm) return;
    if (!compForm.title.trim()) {
      toast('대회 이름을 적어 주세요', 'err');
      return;
    }
    setBusy(true);
    try {
      await saveCompetition({
        ...compForm,
        title: compForm.title.trim(),
        start_date: compForm.start_date || null,
        end_date: compForm.end_date || null,
        event_date: compForm.event_date || null,
      });
      toast(compForm.id ? '대회를 수정했어요' : '대회를 추가했어요');
      setCompForm(null);
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : '저장하지 못했어요', 'err');
    } finally {
      setBusy(false);
    }
  };

  const submitNews = async () => {
    if (!newsForm) return;
    if (!newsForm.title.trim()) {
      toast('뉴스 제목을 적어 주세요', 'err');
      return;
    }
    setBusy(true);
    try {
      await saveNews({ ...newsForm, title: newsForm.title.trim(), published_at: newsForm.published_at || null });
      toast(newsForm.id ? '뉴스를 수정했어요' : '뉴스를 추가했어요');
      setNewsForm(null);
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : '저장하지 못했어요', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 backdrop-blur no-print">
        <div className={cn(PAGE_W_WIDE, 'py-2.5')}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-base text-white">🏆</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold leading-tight text-slate-400">라피네코딩 두정점 · 원장 모드</p>
                <p className="truncate text-[15px] font-extrabold leading-tight text-slate-900">대회 · IT뉴스 관리</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
            >
              나가기
            </button>
          </div>
          <div className="mt-2">
            <AdminNav active="feed" />
          </div>
        </div>
      </header>

      <main className={cn(PAGE_W_WIDE, 'pt-4')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => setTab('contest')}
              className={cn('rounded-xl px-3 py-2 text-[12.5px] font-bold transition', tab === 'contest' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500')}
            >
              🏆 대회 {competitions.length}
            </button>
            <button
              onClick={() => setTab('news')}
              className={cn('rounded-xl px-3 py-2 text-[12.5px] font-bold transition', tab === 'news' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500')}
            >
              📰 IT뉴스 {news.length}
            </button>
          </div>
          <Button size="sm" onClick={() => (tab === 'contest' ? setCompForm({ ...EMPTY_COMP, sort_no: (competitions.length + 1) * 10 }) : setNewsForm({ ...EMPTY_NEWS, sort_no: (news.length + 1) * 10 }))}>
            + {tab === 'contest' ? '새 대회' : '새 뉴스'}
          </Button>
        </div>

        {error ? (
          <Card className="mt-3 bg-rose-50/70">
            <p className="text-sm font-bold text-rose-700">{error}</p>
          </Card>
        ) : null}

        {loading ? (
          <p className="py-16 text-center text-sm font-semibold text-slate-400">불러오는 중…</p>
        ) : tab === 'contest' ? (
          <div className="mt-3 space-y-2">
            {competitions.length === 0 ? <Empty text="등록된 대회가 없어요." /> : null}
            {competitions.map((c) => (
              <Card key={c.id} className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', c.visible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400')}>
                      {c.visible ? '노출 ON' : '노출 OFF'}
                    </span>
                    <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {TARGETS.find((t) => t.key === c.target)?.label ?? c.target}
                    </span>
                    {c.end_date ? <span className="text-[10.5px] font-semibold text-slate-400">접수 ~ {c.end_date.replace(/-/g, '.')}</span> : null}
                  </div>
                  <p className="mt-1 truncate text-[14px] font-extrabold text-slate-900">{c.title}</p>
                  <p className="truncate text-[11px] text-slate-400">{c.host || '주최 미입력'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Toggle on={c.visible} onChange={(v) => {
                    void toggleCompetition(c.id, v).then(() => {
                      setCompetitions((prev) => prev.map((x) => (x.id === c.id ? { ...x, visible: v } : x)));
                    });
                  }} />
                  <button onClick={() => setCompForm(toCompInput(c))} className="rounded-xl bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100">
                    수정
                  </button>
                  <button
                    onClick={() => {
                      if (!window.confirm(`‘${c.title}’ 대회를 삭제할까요?`)) return;
                      void deleteCompetition(c.id).then(() => {
                        setCompetitions((prev) => prev.filter((x) => x.id !== c.id));
                        toast('삭제했어요');
                      });
                    }}
                    className="rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-rose-500 hover:bg-rose-50"
                  >
                    삭제
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {news.length === 0 ? <Empty text="등록된 뉴스가 없어요." /> : null}
            {news.map((n) => (
              <Card key={n.id} className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', n.visible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400')}>
                      {n.visible ? '노출 ON' : '노출 OFF'}
                    </span>
                    <span className="text-[10.5px] font-semibold text-slate-400">
                      {n.source || '출처 미입력'} · {n.published_at?.replace(/-/g, '.') ?? ''}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[14px] font-extrabold text-slate-900">{n.title}</p>
                  <p className="truncate text-[11px] text-slate-400">{n.summary}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Toggle on={n.visible} onChange={(v) => {
                    void toggleNews(n.id, v).then(() => {
                      setNews((prev) => prev.map((x) => (x.id === n.id ? { ...x, visible: v } : x)));
                    });
                  }} />
                  <button onClick={() => setNewsForm(toNewsInput(n))} className="rounded-xl bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100">
                    수정
                  </button>
                  <button
                    onClick={() => {
                      if (!window.confirm(`‘${n.title}’ 뉴스를 삭제할까요?`)) return;
                      void deleteNews(n.id).then(() => {
                        setNews((prev) => prev.filter((x) => x.id !== n.id));
                        toast('삭제했어요');
                      });
                    }}
                    className="rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-rose-500 hover:bg-rose-50"
                  >
                    삭제
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <p className="mt-4 px-1 text-[10.5px] leading-relaxed text-slate-400">
          노출을 끄면 학생 화면에서 바로 사라집니다(삭제 아님). 대회 일정은 주최 기관 공고를 확인한 뒤 넣어 주세요. 날짜를 비우면 학생 화면에 ‘일정 확인’으로 표시됩니다.
        </p>
      </main>

      {/* 대회 편집 */}
      <Modal
        open={!!compForm}
        onClose={() => setCompForm(null)}
        title={compForm?.id ? '대회 수정' : '새 대회'}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setCompForm(null)}>
              취소
            </Button>
            <Button onClick={() => void submitComp()} disabled={busy} data-testid="competition-save">
              {busy ? '저장 중…' : '저장'}
            </Button>
          </>
        }
      >
        {compForm ? (
          <div className="space-y-3">
            <Field label="대회 이름 *">
              <input value={compForm.title} onChange={(e) => setCompForm({ ...compForm, title: e.target.value })} className={input} data-testid="competition-title" />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="주최">
                <input value={compForm.host} onChange={(e) => setCompForm({ ...compForm, host: e.target.value })} className={input} />
              </Field>
              <Field label="대상">
                <select value={compForm.target} onChange={(e) => setCompForm({ ...compForm, target: e.target.value as CompetitionInput['target'] })} className={input}>
                  {TARGETS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="접수 시작">
                <input type="date" value={compForm.start_date ?? ''} onChange={(e) => setCompForm({ ...compForm, start_date: e.target.value })} className={input} />
              </Field>
              <Field label="접수 마감">
                <input type="date" value={compForm.end_date ?? ''} onChange={(e) => setCompForm({ ...compForm, end_date: e.target.value })} className={input} />
              </Field>
              <Field label="대회일">
                <input type="date" value={compForm.event_date ?? ''} onChange={(e) => setCompForm({ ...compForm, event_date: e.target.value })} className={input} />
              </Field>
            </div>
            <Field label="공식 링크">
              <input value={compForm.url} onChange={(e) => setCompForm({ ...compForm, url: e.target.value })} placeholder="https://" className={input} />
            </Field>
            <Field label="요약 (학생 화면에 보입니다)">
              <textarea rows={4} value={compForm.summary} onChange={(e) => setCompForm({ ...compForm, summary: e.target.value })} className={cn(input, 'resize-y leading-relaxed')} />
            </Field>
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-[12px] font-bold text-slate-600">
                <input type="checkbox" checked={compForm.visible} onChange={(e) => setCompForm({ ...compForm, visible: e.target.checked })} />
                학생 화면에 노출
              </label>
              <label className="flex items-center gap-2 text-[12px] font-bold text-slate-600">
                순서
                <input
                  type="number"
                  value={compForm.sort_no}
                  onChange={(e) => setCompForm({ ...compForm, sort_no: Number(e.target.value) })}
                  className="w-20 rounded-xl border border-slate-200 px-2 py-1.5 text-[12px]"
                />
              </label>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* 뉴스 편집 */}
      <Modal
        open={!!newsForm}
        onClose={() => setNewsForm(null)}
        title={newsForm?.id ? '뉴스 수정' : '새 IT뉴스'}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewsForm(null)}>
              취소
            </Button>
            <Button onClick={() => void submitNews()} disabled={busy} data-testid="news-save">
              {busy ? '저장 중…' : '저장'}
            </Button>
          </>
        }
      >
        {newsForm ? (
          <div className="space-y-3">
            <Field label="제목 *">
              <input value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} className={input} data-testid="news-title" />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="출처">
                <input value={newsForm.source} onChange={(e) => setNewsForm({ ...newsForm, source: e.target.value })} className={input} />
              </Field>
              <Field label="날짜">
                <input type="date" value={newsForm.published_at ?? ''} onChange={(e) => setNewsForm({ ...newsForm, published_at: e.target.value })} className={input} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="태그">
                <input value={newsForm.tag} onChange={(e) => setNewsForm({ ...newsForm, tag: e.target.value })} placeholder="예) AI교육" className={input} />
              </Field>
              <Field label="기사 링크">
                <input value={newsForm.url} onChange={(e) => setNewsForm({ ...newsForm, url: e.target.value })} placeholder="https://" className={input} />
              </Field>
            </div>
            <Field label="요약">
              <textarea rows={4} value={newsForm.summary} onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })} className={cn(input, 'resize-y leading-relaxed')} />
            </Field>
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-[12px] font-bold text-slate-600">
                <input type="checkbox" checked={newsForm.visible} onChange={(e) => setNewsForm({ ...newsForm, visible: e.target.checked })} />
                학생 화면에 노출
              </label>
              <label className="flex items-center gap-2 text-[12px] font-bold text-slate-600">
                순서
                <input
                  type="number"
                  value={newsForm.sort_no}
                  onChange={(e) => setNewsForm({ ...newsForm, sort_no: Number(e.target.value) })}
                  className="w-20 rounded-xl border border-slate-200 px-2 py-1.5 text-[12px]"
                />
              </label>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

const input = 'mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-brand-400';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11.5px] font-bold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      aria-label={on ? '노출 끄기' : '노출 켜기'}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-emerald-500' : 'bg-slate-200')}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card className="py-10 text-center">
      <p className="text-2xl">🗂️</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{text}</p>
    </Card>
  );
}

function toCompInput(c: AdminCompetition): CompetitionInput {
  return {
    id: c.id,
    title: c.title,
    host: c.host ?? '',
    target: c.target,
    start_date: c.start_date ?? '',
    end_date: c.end_date ?? '',
    event_date: c.event_date ?? '',
    url: c.url ?? '',
    summary: c.summary ?? '',
    visible: c.visible,
    sort_no: c.sort_no,
  };
}

function toNewsInput(n: AdminNews): NewsInput {
  return {
    id: n.id,
    title: n.title,
    source: n.source ?? '',
    url: n.url ?? '',
    summary: n.summary ?? '',
    tag: n.tag ?? '',
    published_at: n.published_at ?? '',
    visible: n.visible,
    sort_no: n.sort_no,
  };
}
