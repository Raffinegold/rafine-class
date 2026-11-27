import { useEffect, useState } from 'react';
import { loadPublicPortfolio, type PublicPortfolio } from '../lib/onetouch';
import { TRACK_META } from '../lib/curriculum';
import { cn } from '../lib/util';

/** 학부모 공유용 포트폴리오 — 로그인·PIN 없이 열리는 공개 페이지 */
export default function PublicPortfolioPage({ token }: { token?: string }) {
  const [data, setData] = useState<PublicPortfolio | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!token) {
      setState('error');
      setError('링크 주소가 올바르지 않아요.');
      return () => undefined;
    }
    loadPublicPortfolio(token)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setState('ok');
      })
      .catch((err: Error) => {
        if (!alive) return;
        setError(err.message);
        setState('error');
      });
    return () => {
      alive = false;
    };
  }, [token]);

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <p className="text-sm font-semibold text-slate-400">포트폴리오를 불러오는 중…</p>
      </div>
    );
  }

  if (state === 'error' || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-card">
          <p className="text-3xl">🔒</p>
          <p className="mt-3 text-base font-bold text-slate-900">링크를 확인해 주세요</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {error ?? '링크가 만료됐거나 아직 공개되지 않았어요.'}
            <br />
            선생님이 보내 드린 링크를 다시 눌러 주세요.
          </p>
          <a href="https://raffinegold.github.io/rafine-class/" className="mt-4 inline-block rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
            라피네 클래스 홈
          </a>
        </div>
      </div>
    );
  }

  const works = data.items.filter((i) => i.kind === 'work');
  const awards = data.items.filter((i) => i.kind === 'award');
  const track = TRACK_META[data.track] ?? TRACK_META.python;
  const approved = data.approved_at ? new Date(data.approved_at).toLocaleDateString('ko-KR') : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-14">
      <div className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-5 sm:py-6" data-testid="public-portfolio">
        <div className="overflow-hidden rounded-3xl border border-white bg-white shadow-card">
          {/* 헤더 */}
          <header className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-5 py-6 text-white sm:px-8 sm:py-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-white/70">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/15 text-sm">🎓</span>
              라피네코딩컴퓨터학원 두정점
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-white/50">Student Portfolio</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
              {data.student_name}
              {data.grade ? <span className="ml-1 text-base font-bold text-white/70">{data.grade}학년</span> : null}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-white/75">
              <span className="rounded-full bg-white/15 px-2.5 py-1 font-bold">
                {track.emoji} {track.label} 트랙
              </span>
              {approved ? <span className="rounded-full bg-white/10 px-2.5 py-1">선생님 승인 {approved}</span> : null}
              <span className="rounded-full bg-white/10 px-2.5 py-1">
                작품 {works.length} · 상장 {awards.length}
              </span>
            </p>
            {data.title ? <p className="mt-4 text-[15px] font-bold text-white/90">{data.title}</p> : null}
          </header>

          <div className="px-4 py-5 sm:px-8 sm:py-7">
            {data.teacher_note ? (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3.5" data-testid="public-teacher-note">
                <p className="text-[11px] font-extrabold tracking-wide text-brand-700">선생님이 남긴 한 줄</p>
                <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-slate-700">{data.teacher_note}</p>
                <p className="mt-1.5 text-[10.5px] font-bold text-brand-700/70">박종혁 원장</p>
              </div>
            ) : null}

            {data.intro ? (
              <p className="mt-4 whitespace-pre-line rounded-2xl bg-slate-50 px-4 py-3 text-[13.5px] leading-relaxed text-slate-700">
                {data.intro}
              </p>
            ) : null}

            {/* 작품 */}
            {works.length ? (
              <section className="mt-6">
                <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-slate-900">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-[12px] text-brand-700">1</span>
                  만든 작품
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {works.map((w, i) => (
                    <article key={`w-${i}`} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                      {w.image_url ? (
                        <img src={w.image_url} alt={`${w.title} 작품 사진`} className="h-44 w-full bg-slate-100 object-cover sm:h-52" loading="lazy" />
                      ) : (
                        <div className="grid h-28 place-items-center bg-gradient-to-br from-slate-50 to-brand-50 text-3xl">🧩</div>
                      )}
                      <div className="p-3.5">
                        <p className="text-[15px] font-extrabold leading-snug text-slate-900">{w.title}</p>
                        {w.description ? (
                          <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-slate-600">{w.description}</p>
                        ) : null}
                        {w.url ? (
                          <a
                            href={w.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-[11.5px] font-bold text-brand-700 hover:bg-brand-100"
                          >
                            실행해 보기 ↗
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 상장 */}
            {awards.length ? (
              <section className="mt-6">
                <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-slate-900">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-100 text-[12px] text-amber-700">2</span>
                  수상 · 자격
                </h2>
                <div className="mt-3 space-y-2">
                  {awards.map((a, i) => (
                    <article key={`a-${i}`} className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/40 p-3">
                      {a.image_url ? (
                        <img src={a.image_url} alt={`${a.title} 상장`} className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
                      ) : (
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-amber-100 text-2xl">🏅</span>
                      )}
                      <div className="min-w-0">
                        <p className="text-[14.5px] font-extrabold leading-snug text-slate-900">{a.title}</p>
                        <p className="mt-0.5 text-[12px] text-slate-600">
                          {[a.awarded_by, a.awarded_on?.replace(/-/g, '.')].filter(Boolean).join(' · ')}
                        </p>
                        {a.description ? <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{a.description}</p> : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {!works.length && !awards.length ? (
              <p className="py-10 text-center text-sm text-slate-500">아직 공개된 작품이 없어요.</p>
            ) : null}

            <div className="mt-7 rounded-2xl bg-slate-50 px-4 py-3.5">
              <p className="text-[11.5px] font-bold text-slate-700">라피네코딩컴퓨터학원 두정점 · 박종혁 원장</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                천안시 서북구 부성1길 19, 3층 · 041-564-1101 · 24주 코딩 커리큘럼과 작품 기록
              </p>
            </div>

            {/* 다음 행동 — 상담으로 이어지게 */}
            <section className="mt-3 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white px-4 py-4">
              <p className="text-[13.5px] font-extrabold leading-snug text-slate-900">
                {data.student_name}의 다음 작품, 같이 만들어 볼까요?
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">
                수업 기록이 궁금하거나 진로·트랙 상담이 필요하면 카톡으로 편하게 물어보세요. 원장이 직접 답합니다.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <a
                  href="https://pf.kakao.com/_NPJhG"
                  target="_blank"
                  rel="noreferrer"
                  data-testid="public-kakao-cta"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#FEE500] px-4 py-2.5 text-[13px] font-extrabold text-[#3C1E1E] shadow-sm active:scale-[0.98]"
                >
                  💬 카톡 채널로 상담하기
                </a>
                <a
                  href="tel:0415641101"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-[13px] font-extrabold text-slate-700 ring-1 ring-slate-200 active:scale-[0.98]"
                >
                  📞 041-564-1101
                </a>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 no-print">
          <a
            href="https://pf.kakao.com/_NPJhG"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#FEE500] px-4 py-2 text-[12px] font-extrabold text-[#3C1E1E] shadow-sm active:scale-[0.98]"
          >
            💬 카톡 상담
          </a>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-white px-4 py-2 text-[12px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            🖨️ 인쇄 / PDF 저장
          </button>
          <a
            href="https://raffinegold.github.io/rafine-class/"
            className={cn('rounded-full bg-white px-4 py-2 text-[12px] font-bold text-brand-700 shadow-sm ring-1 ring-brand-100 hover:bg-brand-50')}
          >
            라피네 클래스
          </a>
        </div>
      </div>
    </div>
  );
}
