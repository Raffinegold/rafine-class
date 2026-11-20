import { useState } from 'react';
import type { Material, MaterialStudentContent } from '../types';
import { materialStore } from '../lib/materialStore';
import { cn } from '../lib/util';

/**
 * 학생 화면에 그대로 나가는 자료 본문 (2026-11-20)
 *  · 학생 `/materials` 와 원장 `📂 수업자료 → 수업 중 보기` 가 **같은 컴포넌트**를 씁니다.
 *    (그래서 미리보기와 실제 학생 화면이 어긋나지 않습니다)
 *  · 교사용 수업안(teacher_guide)·정답 코드(answer_code)은 여기서 절대 그리지 않습니다.
 */

function CodeBlock({ code, lang, tone = 'dark' }: { code: string; lang?: string | null; tone?: 'dark' | 'light' }) {
  const [copied, setCopied] = useState(false);
  const dark = tone === 'dark';
  return (
    <div className={cn('relative mt-2 overflow-hidden rounded-2xl', dark ? 'bg-slate-900' : 'border border-slate-200 bg-slate-50')}>
      <div className="flex items-center justify-between px-3 pt-2">
        <span className={cn('text-[10px] font-bold uppercase tracking-wide', dark ? 'text-slate-500' : 'text-slate-400')}>{lang || 'python'}</span>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            } catch {
              setCopied(false);
            }
          }}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-bold active:scale-95',
            dark ? 'bg-white/10 text-slate-200' : 'bg-white text-slate-500 border border-slate-200'
          )}
        >
          {copied ? '복사됨 ✓' : '복사'}
        </button>
      </div>
      <pre className={cn('overflow-x-auto px-3 pb-3 pt-1 text-[12.5px] leading-relaxed', dark ? 'text-slate-100' : 'text-slate-700')}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function HintSteps({ hints }: { hints: string[] }) {
  const [open, setOpen] = useState(0);
  if (!hints.length) return null;
  return (
    <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
      <p className="text-[12px] font-extrabold text-amber-800">💡 힌트는 한 단계씩</p>
      <div className="mt-2 space-y-1.5">
        {hints.map((h, i) => {
          const shown = i < open;
          return (
            <div key={i} className="rounded-xl bg-white/80 px-3 py-2">
              {shown ? (
                <p className="text-[12.5px] leading-relaxed text-slate-700">
                  <b className="text-amber-700">{i + 1}단계.</b> {h}
                </p>
              ) : (
                <button
                  onClick={() => setOpen(i + 1)}
                  className="text-[12.5px] font-bold text-amber-700"
                  disabled={i > open}
                >
                  {i === open ? `힌트 ${i + 1} 보기` : `힌트 ${i + 1} (먼저 위를 열어 보세요)`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 예상 출력 — 먼저 스스로 적은 뒤에 열어 보게 접어 둡니다 */
function ExpectToggle({ text, label = '예상 출력 보기', defaultOpen = false }: { text: string; label?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-slate-500"
      >
        {open ? `${label} 접기` : label}
      </button>
      {open ? (
        <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 px-3 py-2 text-[12px] leading-relaxed text-emerald-200">
          <code>{text}</code>
        </pre>
      ) : null}
    </div>
  );
}

const DEBUG_TONE: Record<string, string> = {
  문법: 'bg-rose-100 text-rose-700',
  실행: 'bg-amber-100 text-amber-700',
  논리: 'bg-violet-100 text-violet-700',
};

export function MaterialContentView({
  material,
  token,
  studentId,
  revealAll = false,
  showDone = true,
}: {
  material: Material;
  token: string | null;
  studentId: string;
  /** 원장 미리보기 — 예상 출력을 모두 펼쳐서 봅니다 */
  revealAll?: boolean;
  /** 원장 미리보기에서는 '다 봤어요' 버튼을 숨깁니다 */
  showDone?: boolean;
}) {
  const c: MaterialStudentContent = material.student_content ?? {};
  const [showAnswer, setShowAnswer] = useState(false);
  const done = Boolean(material.done_at);

  return (
    <div className="space-y-3">
      {c.goal ? (
        <div className="rounded-2xl bg-brand-50 px-3.5 py-3">
          <p className="text-[11px] font-extrabold text-brand-700">오늘의 목표</p>
          <p className="mt-0.5 text-[13.5px] font-bold leading-relaxed text-brand-900">{c.goal}</p>
        </div>
      ) : null}

      {c.words?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {c.words.map((w) => (
            <span key={w} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-600">
              {w}
            </span>
          ))}
        </div>
      ) : null}

      {c.preview ? (
        <div>
          <p className="text-[11.5px] font-extrabold text-slate-500">완성 화면 미리 보기</p>
          <CodeBlock code={c.preview} lang="출력 결과" />
        </div>
      ) : null}

      {c.conceptTitle || c.concept?.length ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          {c.conceptTitle ? <p className="text-[13px] font-extrabold text-slate-800">{c.conceptTitle}</p> : null}
          <div className="mt-2 divide-y divide-slate-100">
            {(c.concept ?? []).map((row, i) => (
              <div key={i} className="grid grid-cols-[1.1fr_1fr] gap-2 py-1.5">
                <code className="break-all text-[12px] font-bold text-brand-700">{row.code}</code>
                <span className="text-[12px] leading-relaxed text-slate-600">{row.mean}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {c.predict ? (
        <div>
          <p className="text-[11.5px] font-extrabold text-slate-500">실행 전에 결과를 먼저 적어 보세요</p>
          <CodeBlock code={c.predict.code} lang="예측해 보기" />
          <button
            onClick={() => setShowAnswer((v) => !v)}
            className="mt-2 rounded-full border border-slate-200 px-3 py-1.5 text-[11.5px] font-bold text-slate-500"
          >
            {showAnswer ? '정답 접기' : '내 예상과 비교하기'}
          </button>
          {showAnswer ? <p className="mt-2 text-[12.5px] font-bold text-emerald-700">→ {c.predict.answer}</p> : null}
        </div>
      ) : null}

      {c.steps?.length ? (
        <div className="space-y-2">
          <p className="text-[12px] font-extrabold text-slate-500">따라 만들기 ① — 단계별</p>
          {c.steps.map((s, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-3">
              <p className="text-[12.5px] font-extrabold text-slate-800">{s.title || `${i + 1}단계`}</p>
              {s.note ? <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">{s.note}</p> : null}
              {s.code ? <CodeBlock code={s.code} lang={material.code_lang} /> : null}
            </div>
          ))}
        </div>
      ) : null}

      {c.builds?.length ? (
        <div className="space-y-2">
          {c.builds.map((b, i) => {
            return (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-3">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10.5px] font-extrabold text-white">{b.label}</span>
                  <p className="text-[12.5px] font-extrabold text-slate-800">{b.title}</p>
                </div>
                {b.intro ? <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{b.intro}</p> : null}
                <div className="mt-2 space-y-2">
                  {b.steps.map((s, j) => (
                    <div key={j} className="rounded-xl bg-slate-50/70 p-2">
                      <p className="text-[11.5px] font-bold text-slate-700">{s.title}</p>
                      {s.note ? <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{s.note}</p> : null}
                      {s.code ? <CodeBlock code={s.code} lang={material.code_lang} /> : null}
                    </div>
                  ))}
                </div>
                {b.out ? (
                  <div>
                    <p className="mt-2 text-[11px] font-extrabold text-emerald-700">이렇게 나오면 성공</p>
                    <ExpectToggle text={b.out} label="예상 출력 보기" defaultOpen={revealAll} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {c.practice?.length ? (
        <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
          <p className="text-[12.5px] font-extrabold text-emerald-800">✏️ 혼자 풀어 보는 미니 실습 {c.practice.length}문제</p>
          <p className="text-[11.5px] text-emerald-700/80">예상 출력은 먼저 종이에 적고 열어 보세요. 막히면 힌트 → 선생님 순서로.</p>
          {c.practice.map((p, i) => (
            <div key={i} className="rounded-xl bg-white p-3">
              <p className="text-[12.5px] font-extrabold text-slate-800">
                {i + 1}. {p.title}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">{p.prompt}</p>
              {p.starter ? <CodeBlock code={p.starter} lang="시작 코드" /> : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ExpectToggle text={p.expect} label="예상 출력 보기" defaultOpen={revealAll} />
                {p.hint ? <span className="text-[11.5px] text-slate-500">힌트: {p.hint}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {c.debug?.length ? (
        <div className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/40 p-3">
          <p className="text-[12.5px] font-extrabold text-rose-700">🔧 망가뜨린 코드 고치기 {c.debug.length}문제</p>
          <p className="text-[11.5px] text-rose-600/80">문법 → 실행 → 논리 순서. 논리는 빨간 글씨가 안 뜹니다.</p>
          {c.debug.map((d, i) => (
            <div key={i} className="rounded-xl bg-white p-3">
              <div className="flex items-center gap-1.5">
                <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-extrabold', DEBUG_TONE[d.kind] ?? 'bg-slate-100 text-slate-600')}>{d.kind}</span>
                <p className="text-[12.5px] font-extrabold text-slate-800">{d.title}</p>
              </div>
              <CodeBlock code={d.code} lang="망가진 코드" />
              <p className="mt-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11.5px] leading-relaxed text-rose-700">
                <b>실행하면:</b> {d.symptom}
              </p>
              <p className="mt-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11.5px] leading-relaxed text-emerald-800">
                <b>고치면 확인:</b> {d.check}
              </p>
              {d.hint ? <p className="mt-1 text-[11.5px] text-slate-500">힌트: {d.hint}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {c.mistakes?.length ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3">
          <p className="text-[12px] font-extrabold text-rose-700">자주 나는 실수</p>
          <div className="mt-2 space-y-1.5">
            {c.mistakes.map((m, i) => (
              <div key={i} className="rounded-xl bg-white/80 px-3 py-2">
                <p className="text-[12px] font-bold text-slate-800">{m.symptom}</p>
                <p className="text-[11.5px] text-slate-500">→ {m.cause}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {c.hints?.length ? <HintSteps hints={c.hints} /> : null}

      {c.missions ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[12.5px] font-extrabold text-slate-800">업그레이드 미션 — 1개 이상 고르기</p>
          <div className="mt-2 space-y-1.5">
            {(
              [
                ['기본', c.missions.basic, 'bg-slate-50 text-slate-700', c.missionsOut?.basic],
                ['도전', c.missions.challenge, 'bg-sky-50 text-sky-800', c.missionsOut?.challenge],
                ['심화', c.missions.deep, 'bg-violet-50 text-violet-800', c.missionsOut?.deep],
              ] as [string, string, string, string | undefined][]
            ).map(([label, text, tone, out]) => (
              <div key={label} className={cn('rounded-xl px-3 py-2', tone)}>
                <p className="text-[11px] font-extrabold">{label}</p>
                <p className="text-[12.5px] leading-relaxed">{text}</p>
                {out ? (
                  <div className="mt-1">
                    <p className="text-[10.5px] font-bold opacity-70">이렇게 나오면 성공</p>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-lg bg-white/70 px-2 py-1.5 text-[11.5px] leading-relaxed text-slate-700">
                      {out}
                    </pre>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {c.selfcheck?.length ? (
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[12px] font-extrabold text-slate-600">셀프 체크</p>
          <ul className="mt-1.5 space-y-1">
            {c.selfcheck.map((s) => (
              <li key={s} className="flex gap-1.5 text-[12.5px] text-slate-600">
                <span className="text-emerald-500">✔</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {c.note ? (
        <p className="rounded-2xl bg-amber-50 px-3.5 py-2.5 text-[12px] font-bold leading-relaxed text-amber-800">⚠️ {c.note}</p>
      ) : null}

      {material.ai_tip ? (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3">
          <p className="text-[11px] font-extrabold text-indigo-700">🤖 AI 틈틈이</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-indigo-900">{material.ai_tip}</p>
        </div>
      ) : null}

      {material.link_url ? (
        <a
          href={material.link_url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl border border-slate-200 bg-white p-3 text-[12.5px] font-bold text-brand-700"
        >
          🔗 {material.link_url}
        </a>
      ) : null}

      {showDone ? (
        <button
          onClick={() => materialStore.mark(material.id, !done, token, studentId)}
          className={cn(
            'mt-1 w-full rounded-2xl px-4 py-3 text-[13px] font-extrabold transition active:scale-[0.99]',
            done ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'
          )}
        >
          {done ? '✓ 다 봤어요 · 선생님께 표시됨' : '다 봤어요 (완료 표시)'}
        </button>
      ) : null}
    </div>
  );
}

export default MaterialContentView;
