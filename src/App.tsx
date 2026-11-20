import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SessionProvider, useSession, useVocaStore } from './app-context';
import { SubjectProvider } from './subject-context';
import { ToastProvider } from './components/ui';
import LoginPage from './pages/LoginPage';
import StudentHome from './pages/StudentHome';
import StudyPage from './pages/StudyPage';
import GamePage from './pages/GamePage';
import ShopPage from './pages/ShopPage';
import AdminClassPage from './pages/admin/AdminClassPage';
import AdminPage from './pages/AdminPage';
import WorksPage from './pages/WorksPage';
import ReviewHintsPage from './pages/ReviewHintsPage';
import MaterialsPage from './pages/MaterialsPage';
import ParentReportPage from './pages/ParentReportPage';
import { store } from './lib/store';

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-brand-600 to-brand-800 text-white">
      <div className="animate-floaty text-5xl">🎓</div>
      <p className="text-lg font-bold">라피네 클래스</p>
      <p className="text-sm text-white/70">학습 · 작품 · 리포트를 불러오는 중…</p>
    </div>
  );
}

/** 과목(📚 영어 / 💻 코딩) 전환 상태를 화면 전체에 내려 줍니다 */
function SubjectShell({ children }: { children: JSX.Element }) {
  const { student } = useSession();
  return <SubjectProvider student={student}>{children}</SubjectProvider>;
}

function StudentRoute({ children }: { children: JSX.Element }) {
  const { session, student } = useSession();
  if (session?.role !== 'student') return <Navigate to="/" replace />;
  if (!student) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { session } = useSession();
  if (session?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function HomeSwitch() {
  const { session } = useSession();
  if (session?.role === 'student') return <StudentHome />;
  if (session?.role === 'admin') return <Navigate to="/admin" replace />;
  return <LoginPage />;
}

/** GitHub Pages 처럼 하위 경로에 배포될 때 라우터 기준 경로 (dev/루트 배포는 '/') */
const ROUTER_BASENAME = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    store.ready.then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) return <Splash />;

  return (
    <ToastProvider>
      <SessionProvider>
        <SubjectShell>
          <BrowserRouter basename={ROUTER_BASENAME}>
          <Routes>
            <Route path="/" element={<HomeSwitch />} />
            <Route
              path="/study"
              element={
                <StudentRoute>
                  <StudyPage />
                </StudentRoute>
              }
            />
            <Route
              path="/game"
              element={
                <StudentRoute>
                  <GamePage />
                </StudentRoute>
              }
            />
            <Route
              path="/shop"
              element={
                <StudentRoute>
                  <ShopPage />
                </StudentRoute>
              }
            />
            <Route
              path="/materials"
              element={
                <StudentRoute>
                  <MaterialsPage />
                </StudentRoute>
              }
            />
            <Route
              path="/works"
              element={
                <StudentRoute>
                  <WorksPage />
                </StudentRoute>
              }
            />
            <Route
              path="/hints"
              element={
                <StudentRoute>
                  <ReviewHintsPage />
                </StudentRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminClassPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/tools"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
            <Route path="/r/:token" element={<ParentReportPage />} />
            <Route path="/report/:token" element={<ParentReportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </SubjectShell>
      </SessionProvider>
    </ToastProvider>
  );
}
