import { useMemo, useState } from 'react';
import { useSession, useVocaStore } from '../app-context';
import { Badge, Button, Modal, PinPad } from '../components/ui';
import { CODING_LEVEL_META } from '../types';
import { SEED_DEMO_PINS } from '../data/seed';
import type { Student } from '../types';
import { cn } from '../lib/util';

const AVATAR_TONES = [
  'from-brand-400 to-brand-600',
  'from-sky-400 to-cyan-500',
  'from-amber-300 to-orange-400',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-fuchsia-500',
];

export default function LoginPage() {
  const store = useVocaStore();
  const { loginStudent, loginAdmin } = useSession();
  const students = store.listStudents();
  const [tab, setTab] = useState<'student' | 'admin'>('student');

  const [selected, setSelected] = useState<Student | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [cloudName, setCloudName] = useState('');
  const [cloudPin, setCloudPin] = useState('');
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);

  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isCloud = store.mode === 'supabase';
  const demoPins = useMemo(
    () => students.filter((s) => SEED_DEMO_PINS[s.id]).map((s) => `${s.name} ${SEED_DEMO_PINS[s.id]}`),
    [students]
  );

  const openStudent = (st: Student) => {
    setSelected(st);
    setPin('');
    setError(null);
  };

  const submitPin = (value: string) => {
    if (!selected) return;
    if (store.verifyStudentPin(selected.id, value)) {
      loginStudent(selected.id);
      return;
    }
    setError('PIN이 맞지 않아요. 다시 확인해 주세요.');
    setPin('');
  };

  const submitCloudLogin = async () => {
    setCloudError(null);
    if (!cloudName.trim() || cloudPin.length !== 4) {
      setCloudError('이름과 4자리 PIN을 입력해 주세요.');
      return;
    }
    setCloudBusy(true);
    try {
      const st = await store.loginStudentCloud(cloudName.trim(), cloudPin);
      if (!st) setCloudError('이름 또는 PIN이 맞지 않아요.');
      else loginStudent(st.id);
    } catch (err) {
      setCloudError('로그인에 실패했어요. 선생님께 알려 주세요.');
      console.warn(err);
    } finally {
      setCloudBusy(false);
    }
  };

  const submitAdminPin = (value: string) => {
    if (store.verifyAdminPin(value)) {
      loginAdmin();
      return;
    }
    setAdminError('관리자 PIN이 맞지 않아요.');
    setAdminPin('');
  };

  const submitAdminCloud = async () => {
    setAdminError(null);
    try {
      await store.adminSignIn(email, password);
      loginAdmin();
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : '로그인에 실패했어요.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-600 via-brand-600 to-indigo-800">
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-white/5" />
      {/* 폰은 한 줄, 태블릿·PC는 왼쪽 브랜드 · 오른쪽 로그인 카드로 넓게 씁니다 */}
      <div className="relative mx-auto w-full max-w-md px-5 pb-10 pt-10 text-white md:max-w-6xl md:px-6 lg:grid lg:grid-cols-[1.1fr_minmax(0,440px)] lg:items-center lg:gap-14 lg:py-16">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 text-base">🎓</span>
            라피네코딩컴퓨터학원 두정점
          </div>
          <h1 className="mt-4 text-[30px] font-extrabold leading-tight lg:mt-5 lg:text-[46px]">
            라피네 클래스
            <span className="ml-2 align-middle text-sm font-bold text-sunny lg:text-base">Rafine Class</span>
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/75 lg:mt-2 lg:text-[15px]">
            오늘 배운 코딩, 만든 작품, 그리고 다정한 월말 리포트까지 한 곳에.
          </p>
          <p className="mt-1 text-[11px] font-semibold text-white/55 lg:text-[12px]">박종혁 원장 · 미술심리상담사 자격 기반 맞춤 관리</p>
          <div className="mt-4 flex flex-wrap gap-1.5 lg:mt-5">
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold lg:px-3 lg:py-1.5 lg:text-[12px]">💻 24주 코딩 진도</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold lg:px-3 lg:py-1.5 lg:text-[12px]">🎮 코딩 게임 5종</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold lg:px-3 lg:py-1.5 lg:text-[12px]">🎨 내 작품 보관함</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold lg:px-3 lg:py-1.5 lg:text-[12px]">📄 월말 리포트</span>
          </div>
        </div>

        <div className="mt-8 lg:mt-0">
          <div className="rounded-3xl border border-white bg-white/95 p-4 text-slate-900 shadow-card backdrop-blur sm:p-5">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
            {(
              [
                ['student', '학생'],
                ['admin', '원장님'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'rounded-xl py-2.5 text-sm font-bold transition',
                  tab === key ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'student' ? (
            isCloud ? (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">이름</span>
                  <input
                    value={cloudName}
                    onChange={(e) => setCloudName(e.target.value)}
                    placeholder="예) 김서연"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-brand-400 focus:bg-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">PIN 4자리</span>
                  <input
                    value={cloudPin}
                    onChange={(e) => setCloudPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    inputMode="numeric"
                    placeholder="••••"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-brand-400 focus:bg-white"
                  />
                </label>
                {cloudError ? <p className="text-sm font-medium text-rose-500">{cloudError}</p> : null}
                <Button onClick={submitCloudLogin} disabled={cloudBusy} className="w-full" size="lg">
                  {cloudBusy ? '확인 중…' : '로그인'}
                </Button>
              </div>
            ) : (
              <div>
                <p className="mb-3 px-1 text-xs font-semibold text-slate-500">내 이름을 눌러 주세요 (선생님이 만들어 준 카드)</p>
                <div className="grid grid-cols-1 gap-2">
                  {students.map((st, i) => (
                    <button
                      key={st.id}
                      data-testid={`student-${st.id}`}
                      onClick={() => openStudent(st)}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left transition hover:border-brand-200 hover:bg-brand-50/40 active:scale-[0.99]"
                    >
                      <span
                        className={cn(
                          'grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-lg font-extrabold text-white',
                          AVATAR_TONES[i % AVATAR_TONES.length]
                        )}
                      >
                        {st.name.slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[15px] font-bold text-slate-900">{st.name}</span>
                          <Badge tone="brand" className="shrink-0">
                            {st.enabled_subjects.includes('coding')
                              ? `💻 ${CODING_LEVEL_META[st.coding_level].short}`
                              : '📚 TOSEL'}
                          </Badge>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {st.class_name} · {CODING_LEVEL_META[st.coding_level].desc.split(' · ')[0]}
                          {st.enabled_subjects.includes('english') ? ' · 📚 영어' : ''}
                        </span>
                      </span>
                      <span className="text-slate-300">›</span>
                    </button>
                  ))}
                  {students.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                      등록된 학생이 없어요. 원장님 탭에서 학생을 추가해 주세요.
                    </p>
                  ) : null}
                </div>
              </div>
            )
          ) : (
            <div>
              <div className="mb-3 rounded-2xl bg-brand-50 p-3">
                <p className="text-xs font-semibold text-brand-700">
                  {isCloud ? '원장님 계정으로 로그인' : '데모 관리자 PIN은 9999 입니다'}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-brand-600/80">
                  24주 진도 · 수업 메모 · 월말 리포트와 학생 계정·PIN · 단어장 · 상점 관리는 로그인 후 이용할 수 있어요.
                </p>
              </div>
              {isCloud ? (
                <div className="space-y-3">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="원장님 이메일"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-400 focus:bg-white"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-400 focus:bg-white"
                  />
                  {adminError ? <p className="text-sm font-medium text-rose-500">{adminError}</p> : null}
                  <Button className="w-full" size="lg" onClick={submitAdminCloud}>
                    관리자 로그인
                  </Button>
                </div>
              ) : (
                <PinPad value={adminPin} onChange={setAdminPin} onSubmit={submitAdminPin} error={adminError} />
              )}
            </div>
          )}

          <div className="mt-4 rounded-2xl bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-500">
              {isCloud ? 'Supabase 데이터베이스에 연결되어 있습니다.' : `데모 학생 PIN · ${demoPins.join(' / ')}`}
            </p>
            {!isCloud ? (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                샘플 학생 5명의 24주 진도·작품·메모와 코딩 문제, TOSEL 영어 단어 100개가 브라우저에 저장되어 있어요. .env에
                Supabase 주소를 넣으면 실제 DB로 전환됩니다.
              </p>
            ) : null}
          </div>
          </div>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-white/60">
            코딩 문제와 TOSEL 단어는 자체 제작했습니다. 뜻과 예문은 사전 문장을 복제하지 않았어요.
            <br />
            라피네코딩컴퓨터학원 두정점 · 24주 코딩 커리큘럼 + 작품 기록 도구
          </p>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.name} · PIN 입력` : ''}>
        {selected ? (
          <div>
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-brand-50 p-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-base font-bold text-white">
                {selected.name.slice(0, 1)}
              </span>
              <div>
                <p className="text-sm font-bold text-brand-800">
                  {selected.class_name} · {CODING_LEVEL_META[selected.coding_level].label}
                </p>
                <p className="text-xs text-brand-600/80">
                  {CODING_LEVEL_META[selected.coding_level].desc}
                  {selected.enabled_subjects.includes('english') ? ` · TOSEL ${selected.tosel_level} 대비` : ''}
                </p>
              </div>
            </div>
            <PinPad value={pin} onChange={setPin} onSubmit={submitPin} error={error} />
            <p className="mt-4 text-center text-[11px] text-slate-400">PIN을 잊었다면 선생님께 다시 발급받으세요.</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
