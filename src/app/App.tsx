import {
  ClipboardCheck,
  Dices,
  Settings,
} from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '../components/layout/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { StudentsPage } from '../pages/StudentsPage'
import { useAuth } from '../auth/AuthProvider';
import { LoginPage } from '../pages/LoginPage';

export function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-lotus-50">
        <div
          role="status"
          className="flex flex-col items-center gap-3 text-lotus-700"
        >
          <div className="size-10 animate-spin rounded-full border-4 border-lotus-200 border-t-lotus-600" />

          <span className="text-sm font-medium">
            Đang kiểm tra phiên đăng nhập...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
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
          path="attendance"
          element={
            <PlaceholderPage
              title="Điểm danh"
              description="Thực hiện và xem lại kết quả điểm danh theo ngày, buổi sáng và buổi chiều."
              icon={ClipboardCheck}
            />
          }
        />

        <Route
          path="lesson-check"
          element={
            <PlaceholderPage
              title="Gọi kiểm tra bài cũ"
              description="Chọn ngẫu nhiên học sinh và lưu lại lịch sử kiểm tra bài cũ."
              icon={Dices}
            />
          }
        />

        <Route
          path="settings"
          element={
            <PlaceholderPage
              title="Cài đặt"
              description="Quản lý thông tin lớp học, năm học và các thiết lập chung."
              icon={Settings}
            />
          }
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Route>
    </Routes>
  )
}
