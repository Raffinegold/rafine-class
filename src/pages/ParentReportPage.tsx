import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useVocaStore } from '../app-context';
import ParentReportCard from '../components/ParentReportCard';
import { computeWeekStats } from '../lib/stats';

export default function ParentReportPage() {
  const { token } = useParams<{ token: string }>();
  const store = useVocaStore();
  const student = token ? store.studentByToken(token) : undefined;

  useEffect(() => {
    if (token) store.markReportOpened(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-card">
          <p className="text-3xl">🔒</p>
          <p className="mt-3 text-base font-bold text-slate-900">링크를 확인해 주세요</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            링크가 만료됐거나 잘못됐어요. 선생님이 보내 드린 카톡의 링크를 다시 눌러 주세요.
          </p>
          <Link to="/" className="mt-4 inline-block rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
            라피네 영단어 홈
          </Link>
        </div>
      </div>
    );
  }

  const stats = computeWeekStats(student);

  return (
    <div className="min-h-screen pb-safe">
      <div className="mx-auto w-full max-w-md px-4 py-6 md:max-w-3xl md:px-6">
        <ParentReportCard student={student} stats={stats} />
        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
          문의는 학원으로 연락 주세요. 이 페이지는 로그인 없이 열람되는 읽기 전용 링크예요.
          <br />
          토큰은 학기마다 새로 발급되고, 다른 사람에게 링크가 돌아도 다른 아이 정보는 보이지 않아요.
        </p>
      </div>
    </div>
  );
}
