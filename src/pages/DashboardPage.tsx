import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Sparkles,
  Sun,
  Sunset,
  UserCheck,
  UserMinus,
  Users,
} from 'lucide-react'
import { Link } from 'react-router'

import { useAuth } from '../auth/AuthProvider'
import { QuickActions } from '../components/dashboard/QuickActions'
import { StatCard } from '../components/dashboard/StatCard'
import type {
  AttendancePeriod,
  CalendarEventCategory,
  TimestampValue,
} from '../domain'
import {
  subscribeToAttendanceIncidents,
  subscribeToAttendanceSessionsForDate,
  subscribeToCalendarEvents,
  subscribeToStudents,
  type AttendanceIncidentListItem,
  type AttendanceSessionListItem,
  type CalendarEventListItem,
  type StudentListItem,
} from '../infrastructure/firestore'
import { formatLocalDateForDisplay } from '../utils/date'

function getTodayValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 11) return 'Chào buổi sáng'
  if (hour < 14) return 'Chào buổi trưa'
  if (hour < 18) return 'Chào buổi chiều'

  return 'Chào buổi tối'
}

function formatTodayHeading() {
  const formattedDate = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
}

function formatTimestampTime(value?: TimestampValue) {
  if (!value?.seconds) return ''

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value.seconds * 1_000))
}

function getEventSortValue(event: CalendarEventListItem) {
  const time = event.isAllDay
    ? '00:00'
    : event.startTime || '23:59'

  return [event.eventDate, time].join('-')
}

function getEventDateParts(eventDate: string) {
  const [, month = '', day = ''] = eventDate.split('-')

  return {
    day: day.replace(/^0/, '') || '--',
    month: month.replace(/^0/, '') || '--',
  }
}

function formatEventTime(event: CalendarEventListItem) {
  if (event.isAllDay) return 'Cả ngày'
  if (event.startTime && event.endTime) {
    return [event.startTime, event.endTime].join('–')
  }

  return event.startTime || 'Chưa đặt giờ'
}

const categoryLabels: Record<CalendarEventCategory, string> = {
  teaching: 'Giảng dạy',
  meeting: 'Cuộc họp',
  assessment: 'Kiểm tra',
  personal: 'Cá nhân',
  other: 'Khác',
}

const categoryStyles: Record<CalendarEventCategory, string> = {
  teaching: 'bg-sky-50 text-sky-700',
  meeting: 'bg-purple-50 text-purple-700',
  assessment: 'bg-amber-50 text-amber-700',
  personal: 'bg-rose-50 text-rose-700',
  other: 'bg-slate-100 text-slate-600',
}

const attendancePeriods: Array<{
  value: AttendancePeriod
  label: string
  icon: typeof Sun
}> = [
  { value: 'morning', label: 'Điểm danh buổi sáng', icon: Sun },
  {
    value: 'afternoon',
    label: 'Điểm danh buổi chiều',
    icon: Sunset,
  },
]

export function DashboardPage() {
  const { user } = useAuth()
  const today = useMemo(getTodayValue, [])
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [sessions, setSessions] =
    useState<AttendanceSessionListItem[]>([])
  const [incidents, setIncidents] =
    useState<AttendanceIncidentListItem[]>([])
  const [calendarEvents, setCalendarEvents] = useState<
    CalendarEventListItem[]
  >([])
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
    const unsubscribeCalendarEvents = subscribeToCalendarEvents(
      setCalendarEvents,
      reportLoadError,
    )

    return () => {
      unsubscribeStudents()
      unsubscribeSessions()
      unsubscribeIncidents()
      unsubscribeCalendarEvents()
    }
  }, [today])

  const activeStudentCount = students.filter(
    (student) => student.status === 'active',
  ).length
  const completedSessions = sessions.filter(
    (session) => session.status === 'completed',
  )
  const completedPeriodCount = new Set(
    completedSessions.map((session) => session.period),
  ).size
  const todayIncidents = incidents.filter(
    (incident) => incident.attendanceDate === today,
  )
  const latestCompletedPeriod = completedSessions.some(
    (session) => session.period === 'afternoon',
  )
    ? 'afternoon'
    : completedSessions.some(
          (session) => session.period === 'morning',
        )
      ? 'morning'
      : null
  const latestPeriodAbsenceCount = latestCompletedPeriod
    ? new Set(
        todayIncidents
          .filter(
            (incident) =>
              incident.period === latestCompletedPeriod,
          )
          .map((incident) => incident.studentId),
      ).size
    : 0
  const latestPresentCount = latestCompletedPeriod
    ? Math.max(activeStudentCount - latestPeriodAbsenceCount, 0)
    : null
  const upcomingEvents = [...calendarEvents]
    .filter((event) => event.eventDate >= today)
    .sort((first, second) =>
      getEventSortValue(first).localeCompare(
        getEventSortValue(second),
      ),
    )
    .slice(0, 3)
  const nearestEvent = upcomingEvents[0]
  const displayName = user?.displayName?.trim()

  return (
    <main className="p-5 md:p-8">
      <section className="dashboard-hero relative overflow-hidden rounded-[2rem] border border-pink-100 bg-[linear-gradient(135deg,#fff1f6_0%,#ffffff_72%)] p-6 shadow-sm md:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-14 -top-20 size-56 rounded-full bg-lotus-200/50 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 right-36 size-40 rounded-full bg-pink-100/70 blur-2xl"
        />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-lotus-600">
              Bảng tin lớp học
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {[getGreeting(), displayName]
                .filter(Boolean)
                .join(', ')}
              !
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Theo dõi tình hình lớp, công việc cần làm và những lịch
              hẹn sắp tới trong một màn hình.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
              <span className="size-2 rounded-full bg-emerald-500" />
              Dữ liệu được cập nhật trực tiếp
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
              <CalendarDays aria-hidden="true" size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Hôm nay
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {formatTodayHeading()}
              </p>
            </div>
          </div>
        </div>
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
        aria-label="Thống kê lớp học hôm nay"
      >
        <StatCard
          title="Sĩ số đang học"
          value={activeStudentCount}
          description="Học sinh đang theo học"
          icon={Users}
          tone="pink"
        />

        <StatCard
          title="Có mặt gần nhất"
          value={latestPresentCount ?? '—'}
          description={
            latestCompletedPeriod
              ? (latestCompletedPeriod === 'morning'
                  ? 'Buổi sáng'
                  : 'Buổi chiều') + ' đã lưu'
              : 'Chưa có buổi điểm danh'
          }
          icon={UserCheck}
          tone="green"
        />

        <StatCard
          title="Lượt vắng hôm nay"
          value={todayIncidents.length}
          description="Tính theo các buổi đã lưu"
          icon={UserMinus}
          tone="red"
        />

        <StatCard
          title="Tiến độ điểm danh"
          value={[completedPeriodCount, 2].join('/')}
          description={
            completedPeriodCount === 2
              ? 'Đã hoàn tất cả ngày'
              : 2 - completedPeriodCount + ' buổi còn lại'
          }
          icon={ClipboardCheck}
          tone="amber"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Việc của hôm nay
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Những việc quan trọng cần theo dõi trong ngày.
              </p>
            </div>
            <Link
              to="/calendar"
              className="shrink-0 text-sm font-semibold text-lotus-700 transition hover:text-lotus-800"
            >
              Mở lịch
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {attendancePeriods.map(({ value, label, icon: Icon }) => {
              const completedSession = completedSessions.find(
                (session) => session.period === value,
              )
              const completedTime = formatTimestampTime(
                completedSession?.completedAt,
              )

              return (
                <Link
                  key={value}
                  to="/attendance"
                  className="group flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 transition hover:bg-lotus-50"
                >
                  <span
                    className={[
                      'flex size-11 shrink-0 items-center justify-center rounded-2xl',
                      completedSession
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700',
                    ].join(' ')}
                  >
                    {completedSession ? (
                      <CheckCircle2 aria-hidden="true" size={21} />
                    ) : (
                      <Icon aria-hidden="true" size={21} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900">
                      {label}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {completedSession
                        ? completedTime
                          ? 'Đã hoàn tất lúc ' + completedTime
                          : 'Đã hoàn tất'
                        : 'Chưa thực hiện'}
                    </span>
                  </span>
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-xs font-bold',
                      completedSession
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700',
                    ].join(' ')}
                  >
                    {completedSession ? 'Đã xong' : 'Cần làm'}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-lotus-700"
                    size={19}
                  />
                </Link>
              )
            })}

            <Link
              to="/calendar"
              className="group flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 transition hover:bg-lotus-50"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
                {nearestEvent ? (
                  <CalendarDays aria-hidden="true" size={21} />
                ) : (
                  <Sparkles aria-hidden="true" size={21} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-slate-900">
                  {nearestEvent
                    ? nearestEvent.title
                    : 'Chưa có lịch hẹn sắp tới'}
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  {nearestEvent
                    ? [
                        nearestEvent.eventDate === today
                          ? 'Hôm nay'
                          : formatLocalDateForDisplay(
                              nearestEvent.eventDate,
                            ),
                        formatEventTime(nearestEvent),
                      ].join(' · ')
                    : 'Mở lịch để thêm ghi chú hoặc lời nhắc'}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-lotus-700"
                size={19}
              />
            </Link>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Lịch sắp tới
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Tối đa ba sự kiện gần nhất.
              </p>
            </div>
            <Link
              to="/calendar"
              className="shrink-0 text-sm font-semibold text-lotus-700 transition hover:text-lotus-800"
            >
              Xem tất cả
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="mt-5 divide-y divide-slate-100">
              {upcomingEvents.map((event) => {
                const dateParts = getEventDateParts(event.eventDate)

                return (
                  <Link
                    key={event.id}
                    to="/calendar"
                    className="group flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
                      <span className="text-base font-black leading-none">
                        {dateParts.day}
                      </span>
                      <span className="mt-1 text-[10px] font-bold uppercase">
                        Th {dateParts.month}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-900">
                        {event.title}
                      </span>
                      <span className="mt-1 block text-sm text-slate-500">
                        {formatEventTime(event)}
                      </span>
                    </span>
                    <span
                      className={[
                        'hidden rounded-full px-2.5 py-1 text-[10px] font-bold sm:inline-flex xl:hidden 2xl:inline-flex',
                        categoryStyles[event.category],
                      ].join(' ')}
                    >
                      {categoryLabels[event.category]}
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-2xl bg-slate-50 px-5 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
                <Clock3 aria-hidden="true" size={23} />
              </div>
              <p className="mt-4 font-semibold text-slate-900">
                Lịch đang trống
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Chưa có sự kiện nào từ hôm nay trở đi.
              </p>
            </div>
          )}
        </article>
      </section>

      <QuickActions />
    </main>
  )
}
