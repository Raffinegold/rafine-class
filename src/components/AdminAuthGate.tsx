import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession, useVocaStore } from '../app-context';
import { Button, Card } from './ui';
import { cn, PAGE_W_WIDE } from '../lib/util';

/**
 * 원장 세션이 끊겼을 때(만료 포함) 보여 주는 화면.
 * — 예전에는 목록이 비면 ‘활성 학생이 없어요 → 새 학생 등록’으로 안내해서,
 *   권한 문제를 모른 채 학생을 중복 등록할 수 있었습니다.
 * — 지금은 ‘세션 만료 = 다시 로그인’으로 분명히 안내합니다.
 */
export function AdminSessionExpired() {
  const store = useVocaStore();
  const { logout } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const relogin = () => {
    logout();
    navigate('/', { replace: true });
  };

  const retry = async () => {
    setBusy(true);
    const res = await store.retryCloud();
    setBusy(false);
    if (!res.ok) setRetryError(res.error ?? '다시 불러오지 못했어요');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      <main className={cn(PAGE_W_WIDE, 'pt-10')}>
        <Card className="mx-auto max-w-xl text-center" data-testid="admin-session-expired">
          <p className="text-3xl">🔒</p>
          <h1 className="mt-3 text-lg font-extrabold text-slate-900">원장 로그인이 만료됐어요</h1>
          <p className="mt-2 break-keep text-[13px] leading-relaxed text-slate-600">
            이 기기에 원장 화면만 남아 있고, 서버 로그인은 끊긴 상태예요.
            <br />
            학생·진도 데이터를 불러오지 못한 것이라 <b>학생이 없는 것이 아닙니다.</b>
            <br />
            다시 로그인하면 그대로 이어서 쓸 수 있어요.
          </p>
          <p className="mt-2 break-keep rounded-xl bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
            이 상태에서 ‘+ 새 학생’으로 등록하면 같은 학생이 중복으로 만들어질 수 있어요.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={relogin} data-testid="admin-relogin">
              다시 로그인
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => void retry()} disabled={busy} data-testid="admin-retry">
              {busy ? '확인 중…' : '세션 다시 확인'}
            </Button>
          </div>
          {retryError ? <p className="mt-2 text-[11.5px] font-semibold text-rose-600">{retryError}</p> : null}
          {store.lastCloudError ? (
            <details className="mt-3 text-left">
              <summary className="cursor-pointer text-[10.5px] font-semibold text-slate-400">오류 내용 보기</summary>
              <p className="mt-1 break-all rounded-xl bg-slate-50 px-3 py-2 text-[10.5px] leading-relaxed text-slate-500">
                {store.lastCloudError}
              </p>
            </details>
          ) : null}
        </Card>
      </main>
    </div>
  );
}

/**
 * 세션은 살아 있는데 데이터를 못 읽었을 때(권한·네트워크) 목록 위에 띄우는 안내.
 * 비어 있는 목록을 ‘학생 없음’으로 오해하지 않게 하는 것이 목적입니다.
 */
export function AdminCloudErrorBanner({ className }: { className?: string }) {
  const store = useVocaStore();
  const { logout } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (!store.lastCloudError || hidden) return null;

  const retry = async () => {
    setBusy(true);
    const res = await store.retryCloud();
    setBusy(false);
    if (res.ok) setHidden(true);
  };

  return (
    <div
      className={cn('rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-[12px] leading-relaxed text-amber-900', className)}
      data-testid="admin-cloud-error"
    >
      <p className="font-bold">
        서버에서 학생 데이터를 불러오지 못했어요. <span className="font-semibold">(학생이 없는 상태가 아닙니다)</span>
      </p>
      <p className="mt-0.5 text-[11.5px] text-amber-800">{store.lastCloudError}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          onClick={() => void retry()}
          disabled={busy}
          className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100 disabled:opacity-50"
        >
          {busy ? '다시 읽는 중…' : '다시 시도'}
        </button>
        <button
          onClick={() => {
            logout();
            navigate('/', { replace: true });
          }}
          className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          다시 로그인
        </button>
        <button
          onClick={() => setHidden(true)}
          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-amber-700/70 hover:bg-amber-100"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
