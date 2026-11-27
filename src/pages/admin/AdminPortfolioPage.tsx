import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../app-context';
import AdminNav from '../../components/AdminNav';
import { Button, Card, Modal, useToast } from '../../components/ui';
import { loadPortfolios, reviewPortfolio, savePortfolioNote, type AdminPortfolioRow } from '../../lib/adminApi';
import { appBaseUrl } from '../../lib/report';
import { cn, PAGE_W_WIDE } from '../../lib/util';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: '승인 대기' },
  { key: 'approved', label: '공개 중' },
  { key: 'rejected', label: '반려' },
  { key: 'all', label: '전체' },
];

const STATUS_BADGE: Record<AdminPortfolioRow['status'], string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-600',
};
const STATUS_LABEL: Record<AdminPortfolioRow['status'], string> = {
  pending: '승인 대기',
  approved: '공개 중',
  rejected: '반려',
};

export default function AdminPortfolioPage() {
  const { logout } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState<AdminPortfolioRow[]>([]);
  const [filter, setFilter] = useState<Filter>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminPortfolioRow | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [noteBusyId, setNoteBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await loadPortfolios();
      setRows(data);
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

  const counts = useMemo(
    () => ({
      pending: rows.filter((r) => r.status === 'pending').length,
      approved: rows.filter((r) => r.status === 'approved').length,
      rejected: rows.filter((r) => r.status === 'rejected').length,
      all: rows.length,
    }),
    [rows]
  );
  const list = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  const approve = async (row: AdminPortfolioRow) => {
    setBusyId(row.id);
    try {
      const res = await reviewPortfolio(row.id, 'approve');
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, status: 'approved', share_token: res.share_token, reviewed_at: new Date().toISOString() } : r
        )
      );
      toast(`${row.student_name} 포트폴리오를 공개했어요${res.share_token ? ' · 공유 링크 생성' : ''}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : '승인하지 못했어요', 'err');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async () => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await reviewPortfolio(rejectTarget.id, 'reject', rejectNote.trim());
      setRows((prev) =>
        prev.map((r) => (r.id === rejectTarget.id ? { ...r, status: 'rejected', review_note: rejectNote.trim() } : r))
      );
      toast('반려했어요. 학생 화면에 사유가 보입니다.');
      setRejectTarget(null);
      setRejectNote('');
    } catch (err) {
      toast(err instanceof Error ? err.message : '반려하지 못했어요', 'err');
    } finally {
      setBusyId(null);
    }
  };

  const saveNote = async (row: AdminPortfolioRow) => {
    const text = noteDraft[row.id] ?? row.teacher_note ?? '';
    setNoteBusyId(row.id);
    try {
      await savePortfolioNote(row.id, text);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, teacher_note: text.trim() || null } : r)));
      toast(text.trim() ? '학부모 링크에 한 줄 코멘트를 넣었어요' : '코멘트를 비웠어요');
    } catch (err) {
      toast(err instanceof Error ? err.message : '코멘트를 저장하지 못했어요', 'err');
    } finally {
      setNoteBusyId(null);
    }
  };

  const copyLink = async (token: string) => {
    const url = `${appBaseUrl()}/p/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('공유 링크를 복사했어요');
    } catch {
      toast('복사가 안 되면 링크를 길게 눌러 복사해 주세요', 'err');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 backdrop-blur no-print">
        <div className={cn(PAGE_W_WIDE, 'py-2.5')}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-amber-500 text-base text-white">🖼️</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold leading-tight text-slate-400">라피네코딩 두정점 · 원장 모드</p>
                <p className="truncate text-[15px] font-extrabold leading-tight text-slate-900">포트폴리오 승인함</p>
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
            <AdminNav active="portfolio" />
          </div>
        </div>
      </header>

      <main className={cn(PAGE_W_WIDE, 'pt-4')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                data-testid={`portfolio-filter-${f.key}`}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[11.5px] font-bold transition',
                  filter === f.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
                )}
              >
                {f.label} <span className={cn('ml-0.5 tabular-nums', filter === f.key ? 'text-white/70' : 'text-slate-400')}>{counts[f.key]}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => void refresh()}
            className="rounded-full bg-white px-3 py-1.5 text-[11.5px] font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            새로고침
          </button>
        </div>

        {error ? (
          <Card className="mt-3 bg-rose-50/70">
            <p className="text-sm font-bold text-rose-700">{error}</p>
          </Card>
        ) : null}

        {loading ? (
          <p className="py-16 text-center text-sm font-semibold text-slate-400">승인함을 불러오는 중…</p>
        ) : list.length === 0 ? (
          <Card className="mt-4 py-14 text-center">
            <p className="text-3xl">📭</p>
            <p className="mt-2 text-sm font-bold text-slate-600">
              {filter === 'pending' ? '지금 승인을 기다리는 포트폴리오가 없어요' : '해당하는 포트폴리오가 없어요'}
            </p>
            <p className="mt-1 text-[11.5px] text-slate-400">학생이 작품·상장을 올리면 이곳에 나타납니다.</p>
          </Card>
        ) : (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {list.map((row) => {
              const works = row.items.filter((i) => i.kind === 'work');
              const awards = row.items.filter((i) => i.kind === 'award');
              const shareUrl = row.share_token ? `${appBaseUrl()}/p/${row.share_token}` : '';
              return (
                <Card key={row.id} className="flex flex-col gap-2.5 p-4" data-testid={`portfolio-card-${row.student_name}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[15px] font-extrabold text-slate-900">
                        {row.student_name}
                        {row.grade ? <span className="text-[11px] font-semibold text-slate-400">{row.grade}학년</span> : null}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        작품 {works.length} · 상장 {awards.length} · {new Date(row.updated_at).toLocaleDateString('ko-KR')} 요청
                      </p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold', STATUS_BADGE[row.status])}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </div>

                  {row.title ? <p className="text-[13px] font-bold text-slate-800">{row.title}</p> : null}
                  {row.intro ? <p className="line-clamp-2 text-[12px] leading-relaxed text-slate-500">{row.intro}</p> : null}

                  <div className="flex flex-wrap gap-1.5">
                    {row.items.slice(0, 6).map((item, i) =>
                      item.image_url ? (
                        <img key={i} src={item.image_url} alt={item.title} className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-100" loading="lazy" />
                      ) : (
                        <span
                          key={i}
                          className="grid h-14 w-14 place-items-center rounded-xl bg-slate-50 text-lg ring-1 ring-slate-100"
                          title={item.title}
                        >
                          {item.kind === 'award' ? '🏅' : '🧩'}
                        </span>
                      )
                    )}
                  </div>

                  {row.review_note ? (
                    <p className="rounded-xl bg-rose-50 px-3 py-2 text-[11.5px] text-rose-700">반려 사유: {row.review_note}</p>
                  ) : null}

                  {row.status === 'approved' ? (
                    <div className="rounded-xl bg-brand-50/60 px-2.5 py-2 ring-1 ring-brand-100" data-testid={`portfolio-note-${row.student_name}`}>
                      <p className="text-[10.5px] font-extrabold text-brand-700">학부모 링크의 ‘원장 한 줄’</p>
                      <div className="mt-1 flex gap-1.5">
                        <input
                          value={noteDraft[row.id] ?? row.teacher_note ?? ''}
                          onChange={(e) => setNoteDraft((prev) => ({ ...prev, [row.id]: e.target.value }))}
                          maxLength={80}
                          placeholder="예) 이번 달 디버깅을 혼자 끝냈어요."
                          className="min-w-0 flex-1 rounded-lg border border-brand-100 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 outline-none focus:border-brand-400"
                        />
                        <button
                          onClick={() => void saveNote(row)}
                          disabled={noteBusyId === row.id}
                          className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1 text-[10.5px] font-bold text-white hover:bg-brand-700 disabled:opacity-40"
                        >
                          {noteBusyId === row.id ? '저장 중…' : '저장'}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {row.status === 'approved' && shareUrl ? (
                    <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-2">
                      <input
                        readOnly
                        value={shareUrl}
                        onFocus={(e) => e.currentTarget.select()}
                        className="min-w-0 flex-1 bg-transparent text-[10.5px] font-semibold text-emerald-800 outline-none"
                      />
                      <button onClick={() => void copyLink(row.share_token!)} className="shrink-0 rounded-lg bg-white px-2 py-1 text-[10.5px] font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100">
                        복사
                      </button>
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-lg bg-white px-2 py-1 text-[10.5px] font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                      >
                        열기
                      </a>
                    </div>
                  ) : null}

                  <div className="mt-auto flex gap-1.5 pt-1">
                    {row.status !== 'approved' ? (
                      <Button size="sm" className="flex-1" onClick={() => void approve(row)} disabled={busyId === row.id} data-testid={`portfolio-approve-${row.student_name}`}>
                        {busyId === row.id ? '처리 중…' : '✓ 승인하고 공개'}
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="flex-1" onClick={() => void approve(row)} disabled={busyId === row.id}>
                        다시 공개 (변경 반영)
                      </Button>
                    )}
                    {row.status !== 'rejected' ? (
                      <Button
                        size="sm"
                        variant="danger"
                        className="flex-1"
                        onClick={() => {
                          setRejectTarget(row);
                          setRejectNote(row.review_note ?? '');
                        }}
                        disabled={busyId === row.id}
                        data-testid={`portfolio-reject-${row.student_name}`}
                      >
                        반려
                      </Button>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <p className="mt-4 px-1 text-[10.5px] leading-relaxed text-slate-400">
          승인하면 학부모 공유 링크가 만들어집니다. 학생이 내용을 고쳐 다시 요청하면 자동으로 ‘승인 대기’로 돌아가니, 수정본은 다시 한 번 확인해 주세요.
        </p>
      </main>

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title={rejectTarget ? `${rejectTarget.student_name} 포트폴리오 반려` : '반려'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              취소
            </Button>
            <Button variant="danger" onClick={() => void reject()} disabled={busyId === rejectTarget?.id} data-testid="portfolio-reject-confirm">
              반려하고 사유 보내기
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-[12.5px] leading-relaxed text-slate-600">
            사유는 학생 화면에 그대로 보입니다. 다음에 무엇을 고치면 되는지 한두 문장으로 적어 주세요.
          </p>
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={4}
            placeholder="예) 작품 설명을 한 줄씩 더 넣고, 상장 사진을 밝게 다시 찍어 주세요."
            className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-[14px] leading-relaxed outline-none focus:border-brand-400"
          />
        </div>
      </Modal>
    </div>
  );
}
