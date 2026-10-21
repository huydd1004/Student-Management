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

export function App() {
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