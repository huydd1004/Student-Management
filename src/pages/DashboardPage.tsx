import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ClipboardCheck,
  Clock3,
  UserMinus,
  Users,
} from 'lucide-react'

import { QuickActions } from '../components/dashboard/QuickActions'
import { StatCard } from '../components/dashboard/StatCard'
import {
  subscribeToAttendanceIncidents,
  subscribeToAttendanceSessionsForDate,
  subscribeToStudents,
  type AttendanceIncidentListItem,
  type AttendanceSessionListItem,
  type StudentListItem,
} from '../infrastructure/firestore'

function getTodayValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function DashboardPage() {
  const today = useMemo(getTodayValue, [])
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [sessions, setSessions] =
    useState<AttendanceSessionListItem[]>([])
  const [incidents, setIncidents] =
    useState<AttendanceIncidentListItem[]>([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const reportLoadError = () => {
      setLoadError(
        'Không thể cập nhật thống kê. Vui lòng kiểm tra kết nối và tải lại trang.',
      )
    }

    const unsubscribeStudents = subscribeToStudents(
      setStudents,
      reportLoadError,
    )
    const unsubscribeSessions =
      subscribeToAttendanceSessionsForDate(
        today,
        setSessions,
        reportLoadError,
      )
    const unsubscribeIncidents =
      subscribeToAttendanceIncidents(
        setIncidents,
        reportLoadError,
      )

    return () => {
      unsubscribeStudents()
      unsubscribeSessions()
      unsubscribeIncidents()
    }
  }, [today])

  const activeStudentCount = students.filter(
    (student) => student.status === 'active',
  ).length
  const completedPeriodCount = new Set(
    sessions
      .filter((session) => session.status === 'completed')
      .map((session) => session.period),
  ).size
  const todayAbsenceCount = incidents.filter(
    (incident) => incident.attendanceDate === today,
  ).length
  const remainingPeriodCount = Math.max(
    2 - completedPeriodCount,
    0,
  )

  return (
    <main className="p-5 md:p-8">
      <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-lotus-600">
          BẢNG ĐIỀU KHIỂN
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Chào mừng bạn trở lại
        </h2>

        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          Số liệu bên dưới được cập nhật trực tiếp từ danh sách học
          sinh và kết quả điểm danh của lớp.
        </p>
      </section>

      {loadError ? (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={19}
          />
          {loadError}
        </div>
      ) : null}

      <section
        className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Thống kê lớp học"
      >
        <StatCard
          title="Sĩ số"
          value={activeStudentCount}
          description="Học sinh đang học"
          icon={Users}
          tone="pink"
        />

        <StatCard
          title="Đã điểm danh"
          value={completedPeriodCount}
          description="Buổi học đã lưu hôm nay"
          icon={ClipboardCheck}
          tone="green"
        />

        <StatCard
          title="Lượt vắng"
          value={todayAbsenceCount}
          description="Tổng lượt vắng hôm nay"
          icon={UserMinus}
          tone="red"
        />

        <StatCard
          title="Chưa điểm danh"
          value={remainingPeriodCount}
          description="Buổi học còn cần hoàn thành"
          icon={Clock3}
          tone="amber"
        />
      </section>

      <QuickActions />
    </main>
  )
}
