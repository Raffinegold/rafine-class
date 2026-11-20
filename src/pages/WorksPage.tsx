import { useMemo, useState } from 'react';
import { useSession } from '../app-context';
import { useClassStore } from '../lib/classStore';
import { TRACK_META, TRACK_LIST } from '../lib/curriculum';
import { fileToCompressedPhoto, photoSizeKb } from '../lib/photo';
import { cn, PAGE_W, todayStr } from '../lib/util';
import { Button, Card, Modal, useToast } from '../components/ui';
import StudentHeader from '../components/StudentHeader';
import StudentNav from '../components/StudentNav';

const TOOLS_BY_TRACK: Record<string, string[]> = {
  scratch: ['스크래치', '스크래치 + 종이 스케치'],
  python: ['파이썬', '파이썬 + 터틀'],
  roblox: ['로블록스 스튜디오', '로블록스 + 스크래치'],
  unity: ['유니티', '유니티 + C#'],
  tosel: ['라피네 클래스 앱', '종이 단어 노트'],
};

export default function WorksPage() {
  const cls = useClassStore();
  const { student, logout } = useSession();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', date: todayStr(), tool: '', comment: '', link: '' });
  const [photo, setPhoto] = useState<{ dataUrl: string; kb: number; name: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const profile = student ? cls.profile(student.id, student.coding_level) : null;
  const works = student ? cls.worksFor(student.id) : [];
  const tools = useMemo(() => {
    if (!profile) return ['스크래치', '파이썬', '로블록스 스튜디오', '유니티'];
    return Array.from(new Set([...TOOLS_BY_TRACK[profile.track], ...TRACK_LIST.map((t) => t.label)]));
  }, [profile?.track]);

  if (!student || !profile) return null;

  const openForm = () => {
    setForm({
      title: '',
      date: todayStr(),
      tool: TOOLS_BY_TRACK[profile.track][0],
      comment: '',
      link: '',
    });
    setPhoto(null);
    setOpen(true);
  };

  /** 사진 1장: 브라우저 캔버스로 가로 800px JPEG로 줄여 data URL 로 담아 둡니다 */
  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await fileToCompressedPhoto(file);
      setPhoto({ dataUrl, kb: photoSizeKb(dataUrl), name: file.name });
    } catch (err) {
      toast(err instanceof Error ? err.message : '사진을 불러오지 못했어요', 'err');
    } finally {
      setPhotoBusy(false);
    }
  };

  const save = () => {
    if (!form.title.trim()) {
      toast('작품 제목을 적어 주세요', 'err');
      return;
    }
    cls.addWork({
      student_id: student.id,
      title: form.title,
      date: form.date || todayStr(),
      tool: form.tool || TRACK_META[profile.track].label,
      comment: form.comment,
      link: form.link,
      photo: photo?.dataUrl,
    });
    setOpen(false);
    toast(photo ? '사진과 함께 작품을 담았어요 🎨' : '작품을 보관함에 담았어요 🎨');
  };

  return (
    <div className="min-h-screen pb-safe">
      <StudentHeader
        icon="🎨"
        brand="라피네 클래스"
        title="내 작품 보관함"
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

      <main className={cn(PAGE_W, 'pb-32 pt-5')}>
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-700 px-5 py-5 text-white shadow-card">
          <p className="text-xs font-semibold text-white/70">{TRACK_META[profile.track].emoji} {TRACK_META[profile.track].label} 트랙</p>
          <h1 className="mt-1 text-2xl font-extrabold">{student.name}의 작품 {works.length}개</h1>
          <p className="mt-1 text-[13px] text-white/80">만든 것을 여기에 남겨 두면, 월말 학부모 리포트에 그대로 들어가요.</p>
          <Button variant="sun" size="lg" className="mt-4 w-full lg:w-auto lg:min-w-[220px]" onClick={openForm} data-testid="work-add">
            + 새 작품 등록
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {works.length === 0 ? (
            <Card className="py-10 text-center sm:col-span-2">
              <p className="text-4xl">🖼️</p>
              <p className="mt-3 text-sm font-semibold text-slate-600">아직 담긴 작품이 없어요</p>
              <p className="mt-1 text-xs text-slate-400">오늘 만든 것부터 하나씩 남겨 보세요.</p>
            </Card>
          ) : (
            works.map((w) => (
              <Card key={w.id} className="space-y-2 overflow-hidden" data-testid={`work-${w.id}`}>
                {w.photo ? (
                  <div className="-mx-5 -mt-5 mb-1 overflow-hidden rounded-t-3xl bg-slate-100">
                    <img
                      src={w.photo}
                      alt={`${w.title} 작품 사진`}
                      data-testid={`work-photo-${w.id}`}
                      className="h-48 w-full object-cover sm:h-56"
                      loading="lazy"
                    />
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[17px] font-extrabold leading-snug text-slate-900">{w.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{w.tool}</span>
                      <span>{w.date.replace(/-/g, '.')}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!window.confirm(`‘${w.title}’ 작품을 삭제할까요?`)) return;
                      cls.deleteWork(w.id);
                      toast('작품을 삭제했어요');
                    }}
                    className="shrink-0 rounded-xl px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                    aria-label="작품 삭제"
                  >
                    삭제
                  </button>
                </div>
                {w.comment ? <p className="text-sm leading-relaxed text-slate-600">{w.comment}</p> : null}
                {w.link ? (
                  <a
                    href={w.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-[12px] font-bold text-brand-700 hover:bg-brand-100"
                  >
                    ▶ 실행 · 공유 링크 열기
                  </a>
                ) : null}
              </Card>
            ))
          )}
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
          작품은 이 기기에 저장돼요. 사진은 가로 800px JPEG로 줄여서 보관해요. 선생님 화면의 작품 보관함과 월말 리포트에 함께 보입니다.
        </p>
      </main>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="새 작품 등록"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={save} data-testid="work-save">
              보관함에 담기
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-500">작품 사진 1장 (선택)</span>
            {photo ? (
              <div className="mt-1.5 overflow-hidden rounded-2xl border border-slate-200" data-testid="work-photo-preview">
                <img src={photo.dataUrl} alt="작품 사진 미리보기" className="aspect-[4/3] w-full object-cover" />
                <div className="flex items-center justify-between gap-2 bg-white px-3 py-2">
                  <span className="min-w-0 truncate text-[11px] font-semibold text-slate-500">
                    {photo.name} · {photo.kb}KB로 줄여 저장해요
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    data-testid="work-photo-remove"
                    className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-rose-500 hover:bg-rose-50"
                  >
                    사진 빼기
                  </button>
                </div>
              </div>
            ) : (
              <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-3 py-4 text-[12px] font-semibold text-slate-500 hover:bg-slate-50">
                <span className="text-lg">📷</span>
                {photoBusy ? '사진을 줄이는 중…' : '사진 올리기 (휴대폰 앨범 · PC 파일)'}
                <input
                  type="file"
                  accept="image/*"
                  data-testid="work-photo-input"
                  className="hidden"
                  disabled={photoBusy}
                  onChange={(e) => {
                    void pickPhoto(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
            <p className="mt-1 text-[10.5px] leading-relaxed text-slate-400">
              가로 800px JPEG로 자동으로 줄여서 저장해요. 작품 보관함 카드와 월말 리포트 ‘이번 달 만든 작품’에 함께 나옵니다.
            </p>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-slate-500">작품 제목</span>
            <input
              data-testid="work-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="예) 고양이 피하기 게임"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-[15px] outline-none focus:border-brand-400"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-slate-500">날짜</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">사용한 도구</span>
              <select
                value={form.tool}
                onChange={(e) => setForm({ ...form, tool: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-brand-400"
              >
                {tools.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-slate-500">한 줄 소감</span>
            <input
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="예) 점수 기능을 스스로 만들었어요"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-[15px] outline-none focus:border-brand-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-500">실행 · 공유 링크 (선택)</span>
            <input
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-[15px] outline-none focus:border-brand-400"
            />
          </label>
        </div>
      </Modal>

      <StudentNav active="works" />
    </div>
  );
}
