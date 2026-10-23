import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '../components/layout/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { AttendancePage } from '../pages/AttendancePage'
import { StudentsPage } from '../pages/StudentsPage'
import { LessonCheckPage } from '../pages/LessonCheckPage'
import { SettingsPage } from '../pages/SettingsPage'
import { ChatPage } from '../pages/ChatPage'
import { MathExercisesPage } from '../pages/MathExercisesPage'
import { ParentRepresentativesPage } from '../pages/ParentRepresentativesPage'
import { useAuth } from '../auth/AuthProvider';
import { LoginPage } from '../pages/LoginPage';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';

export function App() {
const { user, isLoading, accessStatus } = useAuth();

if (isLoading) {
  return (
    <div className="grid min-h-screen place-items-center bg-lotus-50">
      <div
        role="status"
        className="flex flex-col items-center gap-3 text-lotus-700"
      >
        <div className="size-10 animate-spin rounded-full border-4 border-lotus-200 border-t-lotus-600" />
        <span className="text-sm font-medium">
          Chờ chồng một tí nhé hehe...
        </span>
      </div>
    </div>
  );
}

if (!user) {
  return <LoginPage />;
}

if (accessStatus === 'unauthorized' || accessStatus === 'error') {
  return <AccessDeniedPage status={accessStatus} />;
}

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={<Navigate to="/dashboard" replace />}
        />

        <Route path="dashboard" element={<DashboardPage />} />

        <Route
            path="students"
            element={<StudentsPage />}
          />

        <Route
          path="parent-representatives"
          element={<ParentRepresentativesPage />}
        />

        <Route
          path='attendance'
          element={<AttendancePage />}
        />

        <Route
          path="lesson-check"
          element={<LessonCheckPage />}
        />

        <Route path="chat" element={<ChatPage />} />

        <Route
          path="math-exercises"
          element={<MathExercisesPage />}
        />

        <Route
          path="settings"
          element={<SettingsPage />}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Route>
    </Routes>
  )
}
