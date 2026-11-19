import { useMemo, useState } from 'react';
import type { Student } from '../../types';
import { monthKey, monthLabel, shiftMonth, useClassStore } from '../../lib/classStore';
import { buildMonthlyReport } from '../../lib/monthlyReport';
import { copyText } from '../../lib/report';
import { TRACK_META } from '../../lib/curriculum';
import { Button, Card, useToast } from '../ui';

export default function ReportPanel({ student, onGoMemo }: { student: Student; onGoMemo: () => void }) {
  const cls = useClassStore();
  const toast = useToast();
  const [baseMonth, setBaseMonth] = useState(monthKey());
  const report = useMemo(
    () => buildMonthlyReport(student, baseMonth),
    // cls.version 이 바뀌면(메모·작품·진도 변경) 리포트를 다시 만듭니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [student, baseMonth, cls.version]
  );

  const empty = report.memos.length === 0 && report.works.length === 0;

  const copy = async () => {
    const ok = await copyText(report.kakaoText);
    toast(ok ? '카톡에 붙여넣을 수 있게 복사했어요 💬' : '복사가 막혔어요. 미리보기를 길게 눌러 복사해 주세요', ok ? 'ok' : 'err');
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setBaseMonth((m) => shiftMonth(m, -1))}
            className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100"
            aria-label="이전 달"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-[11px] font-bold text-slate-400">월말 학부모 리포트</p>
            <p className="text-lg font-extrabold text-slate-900">{monthLabel(baseMonth)}</p>
            <p className="mt-0.5 text-[10.5px] font-semibold text-slate-400">메모·작품이 바뀌면 자동으로 다시 만들어져요</p>
          </div>
          <button
            onClick={() => setBaseMonth((m) => shiftMonth(m, 1))}
            className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100"
            aria-label="다음 달"
          >
            ›
          </button>
        </div>

        {empty ? (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center">
            <p className="text-[13px] font-bold text-amber-700">이 달 기록이 아직 없어요</p>
            <p className="mt-0.5 text-[12px] text-amber-700/80">수업 메모를 남기면 리포트가 바로 채워져요.</p>
            <button onClick={onGoMemo} className="mt-2 rounded-xl bg-amber-400 px-3 py-1.5 text-[12px] font-extrabold text-slate-900">
              수업 메모 쓰러 가기
            </button>
          </div>
        ) : (
          <p className="text-center text-[12px] text-slate-400">
            수업 메모 {report.memos.length}개 · 작품 {report.works.length}개 · {report.doneCount}주 완료
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={copy} data-testid="report-copy" disabled={empty}>
            💬 카톡 전송용 복사
          </Button>
          <Button variant="ghost" onClick={() => window.print()} data-testid="report-print" disabled={empty}>
            🖨️ 인쇄 / PDF
          </Button>
        </div>
      </Card>

      {/* ------------------------------- 리포트 본문 ------------------------------- */}
      <div id="report-print" className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft sm:p-7">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-sm text-white">🎓</span>
            <div>
              <p className="text-[10px] font-bold tracking-wide text-slate-400">RAFINE CLASS · MONTHLY REPORT</p>
              <p className="text-[13px] font-extrabold text-slate-800">라피네 클래스</p>
            </div>
          </div>
          <h2 className="mt-3 text-[22px] font-extrabold leading-snug text-slate-900">
            {report.monthLabel} 월말 리포트
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-slate-500">
            {report.studentName} · {report.gradeLabel} · {TRACK_META[report.track].emoji} {report.trackLabel}
            {report.code ? ` · ${report.code}` : ''}
          </p>
        </div>

        <Section title="이번 달 만든 작품">
          {report.works.length ? (
            <ul className="space-y-2">
              {report.works.map((w) => (
                <li key={w.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[14px] font-extrabold text-slate-800">{w.title}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                    {w.date.replace(/-/g, '.')} · {w.tool}
                  </p>
                  {w.comment ? <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{w.comment}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-relaxed text-slate-600">{report.worksLine}</p>
          )}
        </Section>

        <Section title="진행 과정">
          <div className="rounded-2xl bg-brand-50/70 px-4 py-3">
            <div className="flex items-center justify-between text-[12px] font-bold text-brand-700">
              <span>24주 커리큘럼</span>
              <span>
                {report.doneCount}/24주 · {report.donePct}%
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${report.donePct}%` }} />
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{report.processLine}</p>
          </div>
          {report.memos.length ? (
            <ul className="mt-2 space-y-1.5">
              {report.memos.slice(0, 4).map((m) => (
                <li key={m.id} className="text-[13px] leading-relaxed text-slate-600">
                  <span className="mr-1.5 text-[11px] font-bold text-slate-400">{m.date.slice(5).replace('-', '/')}</span>
                  {m.made || m.good || m.todo}
                </li>
              ))}
            </ul>
          ) : null}
        </Section>

        {report.temperamentLine ? (
          <Section title="기질 맞춤 코멘트">
            <p className="text-[13px] leading-relaxed text-slate-600">{report.temperamentLine}</p>
          </Section>
        ) : null}

        <Section title="아이의 강점">
          <Bullets items={report.strengths} tone="emerald" />
        </Section>

        <Section title="보완할 점">
          <Bullets items={report.improvements} tone="amber" />
        </Section>

        <Section title="원장 종합 소견">
          <div className="space-y-2">
            {report.counselor.map((p, i) => (
              <p key={i} className="text-[13.5px] leading-[1.85] text-slate-700">
                {p}
              </p>
            ))}
          </div>
          <p className="mt-4 text-right text-[12px] font-bold text-slate-600">
            라피네코딩컴퓨터학원 두정점
            <br />
            <span className="text-[13px] font-extrabold text-slate-800">박종혁 원장</span>
            <span className="ml-1 font-semibold text-slate-400">(미술심리상담사)</span>
          </p>
        </Section>

        {report.nextWeeks.length ? (
          <Section title="다음 달 계획">
            <ul className="space-y-1">
              {report.nextWeeks.map((w) => (
                <li key={w} className="flex gap-2 text-[13px] text-slate-600">
                  <span className="text-brand-400">·</span>
                  {w}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <p className="mt-5 border-t border-slate-100 pt-3 text-[10.5px] leading-relaxed text-slate-400">
          라피네코딩컴퓨터학원 두정점 · 천안시 서북구 부성1길 19, 3층 · 041-564-1101 · 카톡 상담 pf.kakao.com/_NPJhG
        </p>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-slate-400">
        ‘카톡 전송용 복사’를 누르면 카카오톡에 그대로 붙여넣을 수 있는 글이 복사돼요.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-extrabold text-brand-700">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Bullets({ items, tone }: { items: string[]; tone: 'emerald' | 'amber' }) {
  return (
    <ul className="space-y-1.5">
      {items.map((s, i) => (
        <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-slate-700">
          <span className={tone === 'emerald' ? 'text-emerald-500' : 'text-amber-500'}>•</span>
          <span>{s}</span>
        </li>
      ))}
    </ul>
  );
}
