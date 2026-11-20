import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession, useVocaStore } from '../app-context';
import StudentNav from '../components/StudentNav';
import { Badge, Button, Card, Modal, SectionTitle, useToast } from '../components/ui';
import { cn, formatKoTimestamp } from '../lib/util';
import type { RedemptionRequest, ShopItem } from '../types';

const STATUS_LABEL: Record<RedemptionRequest['status'], { text: string; tone: 'sun' | 'mint' | 'slate' }> = {
  pending: { text: '신청 대기', tone: 'sun' },
  sent: { text: '발송 완료', tone: 'mint' },
  canceled: { text: '취소·환불', tone: 'slate' },
};

export default function ShopPage() {
  const store = useVocaStore();
  const navigate = useNavigate();
  const { student } = useSession();
  const toast = useToast();
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);

  const items = store.listShopItems();
  const requests = student ? store.listRedemptions(student.id) : [];
  const balance = student ? store.cashBalance(student.id) : 0;
  const earnedToday = student ? store.todayCashEarned(student.id) : 0;
  const limit = store.cashDailyLimit();
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const affordable = useMemo(() => items.filter((i) => i.price <= balance).length, [items, balance]);

  if (!student) return null;

  const submit = () => {
    if (!confirmItem) return;
    try {
      store.requestRedemption(student.id, confirmItem.id);
      toast(`${confirmItem.name} 교환을 신청했어요. 선생님이 확인한 뒤 발송 완료로 바뀝니다`);
      setConfirmItem(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : '신청에 실패했어요', 'err');
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 md:max-w-5xl md:px-6 lg:max-w-6xl">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-600 text-base text-white shadow-soft">🎁</span>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">기프티콘 상점</p>
              <p className="text-sm font-bold leading-tight text-slate-900">{student.name}의 캐시</p>
            </div>
          </div>
          {pendingCount > 0 ? <Badge tone="sun">신청 대기 {pendingCount}건</Badge> : <Badge tone="mint">신청 가능</Badge>}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 md:max-w-5xl md:px-6 md:pb-10 lg:max-w-6xl">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-indigo-700 p-5 text-white shadow-card lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:items-center lg:gap-8">
          <div>
          <p className="text-xs font-semibold text-white/70">내 캐시</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums" data-testid="shop-balance">
            {balance.toLocaleString()}
            <span className="ml-1 text-lg font-bold text-white/80">원</span>
          </p>
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-white/80">
              <span>오늘 적립</span>
              <span data-testid="shop-daily-earned">
                {earnedToday} / {limit}원
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-sunny transition-all"
                style={{ width: `${limit > 0 ? Math.min(100, (earnedToday / limit) * 100) : 100}%` }}
              />
            </div>
          </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:mt-0 lg:flex-col">
            <Button data-testid="shop-go-game" variant="sun" className="flex-1" onClick={() => navigate('/game')}>
              🎮 게임으로 더 모으기
            </Button>
            <p className="self-center text-[11px] text-white/70 lg:text-center">
              {limit - earnedToday > 0
                ? `오늘 ${limit - earnedToday}원 더 모을 수 있어요`
                : '오늘 상한을 다 채웠어요 · 연습으로 계속 플레이할 수 있어요'}
            </p>
          </div>
        </section>

        <div className="mt-4 flex items-end justify-between gap-2">
          <SectionTitle sub={`지금 교환 가능 ${affordable}개 · 캐시가 충분하면 신청 버튼이 켜져요`}>기프티콘 상품</SectionTitle>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const enough = balance >= item.price;
            const missing = Math.max(0, item.price - balance);
            return (
              <Card key={item.id} className="flex flex-col gap-3 p-4" data-testid={`shop-item-${item.id}`}>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-50 text-2xl">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.price.toLocaleString()}원</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <Button
                    data-testid={`shop-redeem-${item.id}`}
                    variant={enough ? 'primary' : 'ghost'}
                    className="w-full"
                    disabled={!enough}
                    onClick={() => setConfirmItem(item)}
                  >
                    {enough ? '교환 신청' : `${missing.toLocaleString()}원 더 필요해요`}
                  </Button>
                </div>
              </Card>
            );
          })}
          {items.length === 0 ? (
            <Card>
              <p className="py-8 text-center text-sm text-slate-400">아직 등록된 상품이 없어요. 선생님께 문의해 주세요.</p>
            </Card>
          ) : null}
        </div>

        <div className="mt-6">
          <SectionTitle sub="신청하면 캐시가 바로 차감되고, 발송 완료 또는 취소·환불로 바뀝니다">내 신청 내역</SectionTitle>
          <div className="mt-3 space-y-2" data-testid="shop-request-list">
            {requests.length === 0 ? (
              <Card>
                <p className="py-6 text-center text-sm text-slate-500">아직 신청한 기프티콘이 없어요. 게임으로 캐시를 모아 보세요! 🃏</p>
              </Card>
            ) : (
              requests.map((r) => {
                const meta = STATUS_LABEL[r.status];
                return (
                  <div
                    key={r.id}
                    data-testid={`shop-request-${r.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-white bg-white p-3 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{r.item_name}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatKoTimestamp(r.requested_at)} 신청 · {r.price.toLocaleString()}원
                      </p>
                    </div>
                    <Badge tone={meta.tone}>{meta.text}</Badge>
                  </div>
                );
              })
            )}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            신청한 기프티콘은 학원에서 확인 후 전달돼요. 취소되면 캐시가 그대로 돌아옵니다.
          </p>
        </div>
      </main>

      <Modal
        open={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        title="기프티콘 교환 신청"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmItem(null)}>
              취소
            </Button>
            <Button data-testid="shop-confirm" onClick={submit}>
              교환 신청
            </Button>
          </>
        }
      >
        {confirmItem ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl">{confirmItem.emoji}</span>
              <div>
                <p className="text-sm font-bold text-slate-900">{confirmItem.name}</p>
                <p className="text-xs font-semibold text-slate-500">{confirmItem.price.toLocaleString()}원</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-3 text-xs text-slate-600 ring-1 ring-slate-100">
              <div className="flex justify-between">
                <span>보유 캐시</span>
                <span className="font-bold">{balance.toLocaleString()}원</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>신청 후 잔액</span>
                <span className={cn('font-bold', balance - confirmItem.price < 0 ? 'text-rose-500' : 'text-brand-700')}>
                  {(balance - confirmItem.price).toLocaleString()}원
                </span>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              신청하면 캐시가 바로 차감되고 ’신청 대기’로 기록돼요. 선생님이 발송 완료로 바꾸면 받을 수 있어요.
            </p>
          </div>
        ) : null}
      </Modal>

      <StudentNav active="shop" />
    </div>
  );
}
