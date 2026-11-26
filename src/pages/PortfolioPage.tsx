import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../app-context';
import { useClassStore, type Work } from '../lib/classStore';
import { fileToCompressedPhoto, photoSizeKb } from '../lib/photo';
import { loadMyPortfolio, saveMyPortfolio, type MyPortfolio, type PortfolioItem } from '../lib/onetouch';
import { appBaseUrl } from '../lib/report';
import { TRACK_META } from '../lib/curriculum';
import { cn, PAGE_W, todayStr } from '../lib/util';
import { Button, Card, Modal, useToast } from '../components/ui';
import StudentHeader from '../components/StudentHeader';
import StudentNav from '../components/StudentNav';
import { store as vocaStore } from '../lib/store';

interface AwardRow {
  key: string;
  title: string;
  awarded_by: string;
  awarded_on: string;
  image_url: string;
}

/** 포트폴리오에 담을 사진은 저장 용량을 아끼려 640px·품질 0.66으로 줄입니다 (전체 요청 1MB 이하 유지) */
const PORTFOLIO_PHOTO = { maxWidth: 640, quality: 0.66 } as const;

export default function PortfolioPage() {
  const { student, logout } = useSession();
  const store = useStoreToken();
  const cls = useClassStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [server, setServer] = useState<MyPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [awards, setAwards] = useState<AwardRow[]>([]);
  const [awardOpen, setAwardOpen] = useState(false);
  const [awardForm, setAwardForm] = useState({ title: '', awarded_by: '', awarded_on: todayStr() });
  const [awardPhoto, setAwardPhoto] = useState<{ dataUrl: string; kb: number } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const works = student ? cls.worksFor(student.id) : [];
  const profile = student ? cls.profile(student.id, student.coding_level) : null;

  useEffect(() => {
    let alive = true;
    if (!student || !store) return () => undefined;
    (async () => {
      // 다른 기기에서 등록한 작품도 불러온 뒤 포트폴리오를 엽니다
      await cls.pullStudentCloud(store, student.id);
      const mp = await loadMyPortfolio(store);
      if (!alive) return;
      setServer(mp);
      const myWorks = cls.worksFor(student.id);
      if (mp.portfolio) {
        setTitle(mp.portfolio.title ?? `${student.name}의 코딩 포트폴리오`);
        setIntro(mp.portfolio.intro ?? '');
        const workTitles = new Set(mp.items.filter((i) => i.kind === 'work').map((i) => i.title));
        setSelected(myWorks.filter((w) => workTitles.has(w.title)).map((w) => w.id));
        setAwards(
          mp.items
            .filter((i) => i.kind === 'award')
            .map((i, idx) => ({
              key: `saved-${idx}`,
              title: i.title,
              awarded_by: i.awarded_by ?? '',
              awarded_on: i.awarded_on ?? '',
              image_url: i.image_url ?? '',
            }))
        );
      } else {
        setTitle(`${student.name}의 코딩 포트폴리오`);
        setSelected(myWorks.slice(0, 4).map((w) => w.id));
      }
    })()
      .catch((err: Error) => alive && setLoadError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, store]);

  const selectedWorks = useMemo(() => works.filter((w) => selected.includes(w.id)), [works, selected]);
  const itemCount = selectedWorks.length + awards.length;
  const payloadItems: PortfolioItem[] = useMemo(
    () => [
      ...selectedWorks.map((w) => workToItem(w)),
      ...awards.map((a) => ({
        kind: 'award' as const,
        title: a.title,
        description: '',
        image_url: a.image_url,
        awarded_by: a.awarded_by,
        awarded_on: a.awarded_on,
      })),
    ],
    [selectedWorks, awards]
  );

  if (!student) return null;

  const status = server?.portfolio?.status ?? null;
  const shareToken = server?.portfolio?.share_token ?? null;
  const shareUrl = shareToken ? `${appBaseUrl()}/p/${shareToken}` : '';

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const pickAwardPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await fileToCompressedPhoto(file, PORTFOLIO_PHOTO.maxWidth, PORTFOLIO_PHOTO.quality);
      setAwardPhoto({ dataUrl, kb: photoSizeKb(dataUrl) });
    } catch (err) {
      toast(err instanceof Error ? err.message : '사진을 불러오지 못했어요', 'err');
    } finally {
      setPhotoBusy(false);
    }
  };

  const addAward = () => {
    if (!awardForm.title.trim()) {
      toast('수상명을 적어 주세요', 'err');
      return;
    }
    setAwards((prev) => [
      ...prev,
      {
        key: `local-${Date.now()}`,
        title: awardForm.title.trim(),
        awarded_by: awardForm.awarded_by.trim(),
        awarded_on: awardForm.awarded_on,
        image_url: awardPhoto?.dataUrl ?? '',
      },
    ]);
    setAwardForm({ title: '', awarded_by: '', awarded_on: todayStr() });
    setAwardPhoto(null);
    setAwardOpen(false);
    toast('상장을 담았어요 🏅');
  };

  const copyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast('학부모 공유 링크를 복사했어요');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('복사가 안 되면 링크를 길게 눌러 복사해 주세요', 'err');
    }
  };

  const submit = async () => {
    if (!store) {
      toast('서버 연결이 없어 저장할 수 없어요', 'err');
      return;
    }
    if (!itemCount) {
      toast('작품이나 상장을 1개 이상 담아 주세요', 'err');
      return;
    }
    const payloadSize = JSON.stringify(payloadItems).length;
    if (payloadSize > 900_000) {
      toast('사진이 너무 많아요. 사진이 있는 항목을 줄여 주세요', 'err');
      return;
    }
    setSaving(true);
    try {
      await saveMyPortfolio(store, { title: title.trim() || `${student.name}의 코딩 포트폴리오`, intro: intro.trim(), items: payloadItems });
      const mp = await loadMyPortfolio(store);
      setServer(mp);
      toast('포트폴리오 승인 요청을 보냈어요. 선생님이 확인하면 공유 링크가 열려요');
    } catch (err) {
      toast(err instanceof Error ? err.message : '저장하지 못했어요', 'err');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      <StudentHeader
        icon="🏅"
        brand="라피네 클래스"
        title="작품·상장 포트폴리오"
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

      <main className={cn(PAGE_W, 'pb-32 pt-4')} data-testid="portfolio-page">
        {/* 상태 카드 */}
        <StatusCard
          status={status}
          loading={loading}
          loadError={loadError}
          shareUrl={shareUrl}
          copied={copied}
          onCopy={copyShare}
          reviewNote={server?.portfolio?.review_note ?? null}
        />

        {/* 1. 작품 고르기 */}
        <section className="mt-4">
          <div className="mb-2 flex items-end justify-between gap-2 px-1">
            <div>
              <h2 className="text-[15px] font-extrabold text-slate-900">① 담을 작품 고르기</h2>
              <p className="mt-0.5 text-[11.5px] text-slate-500">내 작품 보관함에서 골라 담아요. {selectedWorks.length}개 선택</p>
            </div>
            <Link to="/works" className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
              + 작품 등록
            </Link>
          </div>

          {works.length === 0 ? (
            <Card className="py-8 text-center">
              <p className="text-3xl">🖼️</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">아직 담을 작품이 없어요</p>
              <p className="mt-1 text-xs text-slate-400">‘내 작품’에서 오늘 만든 것을 먼저 등록해 주세요.</p>
              <Button className="mt-3" size="sm" onClick={() => navigate('/works')}>
                내 작품 등록하러 가기
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {works.map((w) => {
                const on = selected.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggle(w.id)}
                    aria-pressed={on}
                    data-testid={`portfolio-work-${w.id}`}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border p-2.5 text-left transition',
                      on ? 'border-brand-300 bg-brand-50/70 ring-1 ring-brand-200' : 'border-slate-100 bg-white hover:border-slate-200'
                    )}
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-bold"
                      style={on ? { background: '#4f46e5', borderColor: '#4f46e5', color: '#fff' } : { borderColor: '#cbd5e1', color: 'transparent' }}
                    >
                      ✓
                    </span>
                    {w.photo ? (
                      <img src={w.photo} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" loading="lazy" />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg">🧩</span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-slate-900">{w.title}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                        {w.tool} · {w.date.replace(/-/g, '.')}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. 상장 */}
        <section className="mt-5">
          <div className="mb-2 flex items-end justify-between gap-2 px-1">
            <div>
              <h2 className="text-[15px] font-extrabold text-slate-900">② 상장 담기 (선택)</h2>
              <p className="mt-0.5 text-[11.5px] text-slate-500">수상명·기관·사진을 남겨 두면 포트폴리오에 함께 나와요.</p>
            </div>
            <button
              onClick={() => setAwardOpen(true)}
              data-testid="award-add"
              className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100"
            >
              + 상장 추가
            </button>
          </div>

          {awards.length === 0 ? (
            <Card className="py-6 text-center">
              <p className="text-sm font-semibold text-slate-500">아직 담긴 상장이 없어요</p>
              <p className="mt-1 text-[11.5px] text-slate-400">대회·자격시험 상장이 있으면 사진으로 남겨 두세요.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {awards.map((a) => (
                <div key={a.key} className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/40 p-2.5">
                  {a.image_url ? (
                    <img src={a.image_url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-lg">🏅</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-slate-900">{a.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {[a.awarded_by, a.awarded_on?.replace(/-/g, '.')].filter(Boolean).join(' · ') || '기관 미입력'}
                    </p>
                  </div>
                  <button
                    onClick={() => setAwards((prev) => prev.filter((x) => x.key !== a.key))}
                    className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-400 hover:bg-white hover:text-rose-500"
                  >
                    빼기
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. 소개 */}
        <section className="mt-5">
          <h2 className="mb-2 px-1 text-[15px] font-extrabold text-slate-900">③ 포트폴리오 소개</h2>
          <Card className="space-y-3">
            <label className="block">
              <span className="text-[11.5px] font-bold text-slate-500">제목</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="portfolio-title"
                placeholder="예) 김서연의 코딩 포트폴리오"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-[15px] outline-none focus:border-brand-400"
              />
            </label>
            <label className="block">
              <span className="text-[11.5px] font-bold text-slate-500">소개글 (학부모님이 처음 보는 글)</span>
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                data-testid="portfolio-intro"
                rows={4}
                placeholder="예) 4주 동안 변수부터 추천기까지 만들었습니다. 스스로 오류를 찾아 고치는 힘이 가장 많이 늘었어요."
                className="mt-1 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-[14px] leading-relaxed outline-none focus:border-brand-400"
              />
            </label>
            <p className="text-[10.5px] leading-relaxed text-slate-400">
              {profile ? `${TRACK_META[profile.track].emoji} ${TRACK_META[profile.track].label} 트랙 · ` : ''}
              담은 항목 {itemCount}개 · 승인되면 학부모님은 링크만으로 볼 수 있어요(PIN 불필요).
            </p>
          </Card>
        </section>

        <div className="mt-4">
          <Button
            onClick={submit}
            disabled={saving || loading || !itemCount}
            size="lg"
            className="w-full"
            data-testid="portfolio-submit"
          >
            {saving ? '보내는 중…' : status === 'approved' ? '수정해서 다시 승인 요청' : '포트폴리오 만들기 (승인 요청)'}
          </Button>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400">
            선생님이 확인하고 승인하면 학부모 공유 링크가 만들어집니다.
          </p>
        </div>
      </main>

      {/* 상장 추가 모달 */}
      <Modal
        open={awardOpen}
        onClose={() => setAwardOpen(false)}
        title="상장 추가"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAwardOpen(false)}>
              취소
            </Button>
            <Button onClick={addAward} data-testid="award-save">
              담기
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <label className="block">
            <span className="text-xs font-bold text-slate-500">수상명</span>
            <input
              value={awardForm.title}
              onChange={(e) => setAwardForm({ ...awardForm, title: e.target.value })}
              data-testid="award-title"
              placeholder="예) 교내 코딩대회 우수상"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-[15px] outline-none focus:border-brand-400"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-slate-500">기관</span>
              <input
                value={awardForm.awarded_by}
                onChange={(e) => setAwardForm({ ...awardForm, awarded_by: e.target.value })}
                placeholder="예) 라피네코딩 두정점"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">수상일</span>
              <input
                type="date"
                value={awardForm.awarded_on}
                onChange={(e) => setAwardForm({ ...awardForm, awarded_on: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-brand-400"
              />
            </label>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500">상장 사진 (선택)</span>
            {awardPhoto ? (
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 p-2">
                <img src={awardPhoto.dataUrl} alt="상장 사진" className="h-16 w-16 rounded-xl object-cover" />
                <span className="min-w-0 flex-1 text-[11px] font-semibold text-slate-500">{awardPhoto.kb}KB로 저장</span>
                <button onClick={() => setAwardPhoto(null)} className="rounded-lg px-2 py-1 text-[11px] font-bold text-rose-500 hover:bg-rose-50">
                  빼기
                </button>
              </div>
            ) : (
              <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-3 py-4 text-[12px] font-semibold text-slate-500 hover:bg-slate-50">
                <span className="text-lg">📷</span>
                {photoBusy ? '사진을 줄이는 중…' : '상장 사진 올리기'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={photoBusy}
                  onChange={(e) => {
                    void pickAwardPhoto(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </Modal>

      <StudentNav active="works" />
    </div>
  );
}

/* ----------------------------- 상태 카드 ----------------------------- */

function StatusCard({
  status,
  loading,
  loadError,
  shareUrl,
  copied,
  onCopy,
  reviewNote,
}: {
  status: 'pending' | 'approved' | 'rejected' | null;
  loading: boolean;
  loadError: string | null;
  shareUrl: string;
  copied: boolean;
  onCopy: () => void;
  reviewNote: string | null;
}) {
  if (loading) {
    return <Card className="py-6 text-center text-sm font-semibold text-slate-400">포트폴리오를 불러오는 중…</Card>;
  }
  if (loadError) {
    return (
      <Card className="bg-rose-50/60">
        <p className="text-sm font-bold text-rose-700">불러오지 못했어요</p>
        <p className="mt-1 text-[12px] text-rose-600">{loadError}</p>
      </Card>
    );
  }
  if (status === 'approved') {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-white" data-testid="portfolio-status-approved">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold text-emerald-800">선생님 승인 완료 — 학부모님께 보낼 수 있어요</p>
            <p className="mt-1 text-[12px] leading-relaxed text-emerald-700/80">
              아래 링크는 PIN 없이 열립니다. 카톡으로 보내면 학부모님이 작품과 상장을 바로 보실 수 있어요.
            </p>
            <div className="mt-2 flex flex-col gap-1.5 sm:flex-row">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[11.5px] font-semibold text-slate-600"
                data-testid="portfolio-share-url"
              />
              <div className="flex gap-1.5">
                <Button size="sm" onClick={onCopy} data-testid="portfolio-copy">
                  {copied ? '복사됨 ✓' : '링크 복사'}
                </Button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  미리보기
                </a>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  if (status === 'pending') {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-white" data-testid="portfolio-status-pending">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="text-[15px] font-extrabold text-amber-800">선생님 확인을 기다리는 중이에요</p>
            <p className="mt-1 text-[12px] leading-relaxed text-amber-700/80">
              보통 수업 중에 바로 확인합니다. 승인되면 이 화면에 학부모 공유 링크가 생겨요. 그전에 고치고 싶으면 아래에서 수정한 뒤 다시 요청하면 됩니다.
            </p>
          </div>
        </div>
      </Card>
    );
  }
  if (status === 'rejected') {
    return (
      <Card className="bg-gradient-to-br from-rose-50 to-white" data-testid="portfolio-status-rejected">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✍️</span>
          <div>
            <p className="text-[15px] font-extrabold text-rose-800">한 번 더 다듬어 볼까요?</p>
            <p className="mt-1 text-[12px] leading-relaxed text-rose-700/80">
              {reviewNote || '선생님이 남긴 메모가 없어요. 작품 설명이나 사진을 보완해서 다시 요청해 주세요.'}
            </p>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card className="bg-gradient-to-br from-brand-50 to-white" data-testid="portfolio-status-none">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🏅</span>
        <div>
          <p className="text-[15px] font-extrabold text-brand-800">내 작품·상장으로 포트폴리오를 만들어요</p>
          <p className="mt-1 text-[12px] leading-relaxed text-brand-700/80">
            담을 작품을 고르고 상장을 더한 뒤, 아래 버튼을 누르면 선생님께 승인 요청이 갑니다. 승인되면 학부모님께 보낼 수 있는 전용 링크가 만들어져요.
          </p>
        </div>
      </div>
    </Card>
  );
}

function workToItem(w: Work): PortfolioItem {
  return {
    kind: 'work',
    title: w.title,
    description: w.comment || '',
    url: w.link || '',
    image_url: w.photo ?? '',
  };
}

/* 로그인 토큰 — student_sessions 토큰을 store 에서 꺼내 옵니다 */
function useStoreToken(): string | null {
  return vocaStore.studentToken;
}
