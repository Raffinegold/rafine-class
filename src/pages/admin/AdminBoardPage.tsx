import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../app-context';
import AdminNav from '../../components/AdminNav';
import { Card, useToast } from '../../components/ui';
import { loadBoard, setTemperament, type AdminBoardRow } from '../../lib/adminApi';
import { TEMPERAMENTS, TEMPERAMENT_LIST, type TemperamentType } from '../../lib/temperament';
import { TRACK_META } from '../../lib/curriculum';
import { cn, PAGE_W_WIDE } from '../../lib/util';

export default function AdminBoardPage() {
  const { logout } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState<AdminBoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await loadBoard();
      setRows(data);
      setError(null);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '보드를 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 20_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return rows
      .filter((r) => (onlyActive ? r.active : true))
      .filter((r) => !q || r.name.includes(q))
      .sort((a, b) => Number(b.done_today) - Number(a.done_today) || a.name.localeCompare(b.name, 'ko'));
  }, [rows, query, onlyActive]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.active);
    return {
      total: active.length,
      done: active.filter((r) => r.done_today).length,
      pending: rows.filter((r) => r.portfolio_status === 'pending').length,
      approved: rows.filter((r) => r.portfolio_status === 'approved').length,
    };
  }, [rows]);

  const changeTemper = async (row: AdminBoardRow, type: TemperamentType | null) => {
    setBusyId(row.id);
    try {
      await setTemperament(row.id, type);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, temperament_type: type } : r)));
      toast(type ? `${row.name} → ${TEMPERAMENTS[type].name}로 바꿨어요` : `${row.name} 기질을 비웠어요`);
    } catch (err) {
      toast(err instanceof Error ? err.message : '기질을 바꾸지 못했어요', 'err');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 backdrop-blur no-print">
        <div className={cn(PAGE_W_WIDE, 'py-2.5')}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-900 text-base text-white">📊</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold leading-tight text-slate-400">라피네코딩 두정점 · 원장 모드</p>
                <p className="truncate text-[15px] font-extrabold leading-tight text-slate-900">진도 · 완료 현황 보드</p>
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
            <AdminNav active="board" />
          </div>
        </div>
      </header>

      <main className={cn(PAGE_W_WIDE, 'pt-4')}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard label="재원생" value={stats.total} unit="명" tone="slate" />
          <StatCard label="오늘 완료" value={stats.done} unit={`/ ${stats.total}`} tone="emerald" />
          <StatCard label="오늘 미완료" value={Math.max(0, stats.total - stats.done)} unit="명" tone="amber" />
          <StatCard label="승인 대기" value={stats.pending} unit="건" tone="rose" />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름으로 찾기"
              className="w-36 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] outline-none focus:border-brand-400"
            />
            <button
              onClick={() => setOnlyActive((v) => !v)}
              className={cn(
                'rounded-full px-3 py-1.5 text-[11.5px] font-bold transition',
                onlyActive ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'
              )}
            >
              재원생만
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
            {updatedAt ? (
              <span data-testid="board-updated">
                {updatedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 갱신 · 20초마다 자동
              </span>
            ) : null}
            <button onClick={() => void refresh()} className="rounded-full bg-white px-3 py-1.5 font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
              새로고침
            </button>
          </div>
        </div>

        {error ? (
          <Card className="mt-3 bg-rose-50/70">
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <p className="mt-1 text-[12px] text-rose-600">원장 계정으로 로그인했는지 확인해 주세요.</p>
          </Card>
        ) : null}

        {loading ? (
          <p className="py-16 text-center text-sm font-semibold text-slate-400">학생 현황을 불러오는 중…</p>
        ) : (
          <>
            {/* PC: 표 */}
            <div className="mt-3 hidden overflow-hidden rounded-3xl border border-white bg-white shadow-soft lg:block">
              <div className="overflow-x-auto thin-scroll">
                <table className="w-full min-w-[980px] text-left text-[12.5px]">
                  <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">학생</th>
                      <th className="px-3 py-2.5">기질 (원클릭 변경)</th>
                      <th className="px-3 py-2.5">오늘 수업</th>
                      <th className="px-3 py-2.5">배정</th>
                      <th className="px-3 py-2.5">24주</th>
                      <th className="px-3 py-2.5">포트폴리오</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100 align-middle" data-testid={`board-row-${r.name}`}>
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-slate-900">
                            {r.name} <span className="text-[11px] font-semibold text-slate-400">{r.grade}학년</span>
                          </p>
                          <p className="text-[10.5px] text-slate-400">
                            {r.class_name ?? '-'} · {TRACK_META[r.track as keyof typeof TRACK_META]?.label ?? r.track}
                            {r.active ? '' : ' · 비활성'}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <TemperamentButtons
                            current={r.temperament_type}
                            busy={busyId === r.id}
                            onChange={(t) => void changeTemper(r, t)}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          {r.done_today ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                              ✓ 완료 {r.done_at ? new Date(r.done_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">미완료</span>
                          )}
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            최근 {r.last_done_date ? r.last_done_date.replace(/-/g, '.') : '기록 없음'}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-600">
                          {r.week}주 · {r.session}회차
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-brand-400" style={{ width: `${Math.round((r.done_weeks / 24) * 100)}%` }} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">{r.done_weeks}/24</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <PortfolioBadge status={r.portfolio_status} shareToken={r.share_token} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">조건에 맞는 학생이 없어요.</p> : null}
            </div>

            {/* 폰: 카드 */}
            <div className="mt-3 space-y-2 lg:hidden">
              {filtered.map((r) => (
                <article key={r.id} className="rounded-3xl border border-white bg-white p-3.5 shadow-soft" data-testid={`board-card-${r.name}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[15px] font-extrabold text-slate-900">
                        {r.name} <span className="text-[11px] font-semibold text-slate-400">{r.grade}학년</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {r.class_name ?? '-'} · {TRACK_META[r.track as keyof typeof TRACK_META]?.label ?? r.track} · {r.week}주 {r.session}회차
                      </p>
                    </div>
                    {r.done_today ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">✓ 오늘 완료</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500">미완료</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <TemperamentButtons current={r.temperament_type} busy={busyId === r.id} onChange={(t) => void changeTemper(r, t)} compact />
                    <span className="text-[10.5px] font-semibold text-slate-400">24주 {r.done_weeks}/24</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10.5px] text-slate-400">
                      최근 완료 {r.last_done_date ? r.last_done_date.replace(/-/g, '.') : '없음'}
                    </span>
                    <PortfolioBadge status={r.portfolio_status} shareToken={r.share_token} />
                  </div>
                </article>
              ))}
              {filtered.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">조건에 맞는 학생이 없어요.</p> : null}
            </div>
          </>
        )}

        <p className="mt-3 px-1 text-[10.5px] leading-relaxed text-slate-400">
          학생이 ‘오늘 수업 완료’를 누르면 20초 안에 이 보드에 반영됩니다. 기질은 검사 결과와 상관없이 원장님이 언제든 바꿀 수 있고, 바꾸면 학생 화면의 맞춤 문제도 바로 바뀝니다.
        </p>
      </main>
    </div>
  );
}

function StatCard({ label, value, unit, tone }: { label: string; value: number; unit: string; tone: 'slate' | 'emerald' | 'amber' | 'rose' }) {
  const tones = {
    slate: 'bg-white text-slate-900',
    emerald: 'bg-emerald-50 text-emerald-800',
    amber: 'bg-amber-50 text-amber-800',
    rose: 'bg-rose-50 text-rose-800',
  } as const;
  return (
    <div className={cn('rounded-2xl border border-white p-3 shadow-soft', tones[tone])}>
      <p className="text-[10.5px] font-bold opacity-60">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold tabular-nums">
        {value}
        <span className="ml-0.5 text-[11px] font-bold opacity-60">{unit}</span>
      </p>
    </div>
  );
}

function TemperamentButtons({
  current,
  busy,
  onChange,
  compact = false,
}: {
  current: TemperamentType | null;
  busy: boolean;
  onChange: (t: TemperamentType | null) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-1', busy && 'opacity-50')}>
      {TEMPERAMENT_LIST.map((t) => {
        const on = current === t.key;
        return (
          <button
            key={t.key}
            type="button"
            disabled={busy}
            onClick={() => onChange(on ? null : t.key)}
            title={`${t.name}${on ? ' (한 번 더 누르면 비움)' : ''}`}
            className={cn(
              'rounded-full font-bold transition',
              compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[10.5px]',
              on ? t.solid : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100'
            )}
          >
            {t.emoji} {compact ? t.short : t.short}
          </button>
        );
      })}
    </div>
  );
}

function PortfolioBadge({ status, shareToken }: { status: AdminBoardRow['portfolio_status']; shareToken: string | null }) {
  if (!status) return <span className="text-[10.5px] text-slate-300">없음</span>;
  if (status === 'pending')
    return (
      <Link
        to="/admin/portfolio"
        className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-700 hover:bg-amber-200"
      >
        승인 대기
      </Link>
    );
  if (status === 'approved')
    return (
      <span className="inline-flex items-center gap-1">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">승인</span>
        {shareToken ? (
          <a
            href={`https://raffinegold.github.io/rafine-class/p/${shareToken}`}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-bold text-brand-600 hover:underline"
          >
            링크
          </a>
        ) : null}
      </span>
    );
  return <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10.5px] font-bold text-rose-600">반려</span>;
}
