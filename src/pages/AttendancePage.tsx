import { useEffect, useMemo, useRef, useState } from 'react'

import {
  AlertTriangle,
  CalendarDays,
  History,
  LoaderCircle,
  Save,
  Sun,
  Sunset,
  UsersRound,
} from 'lucide-react'

import { useAuth } from '../auth/AuthProvider'
import type {
  AttendancePeriod,
  AttendanceStatus,
} from '../domain'
import {
  cleanupExpiredAttendanceIncidents,
  saveAttendance,
  subscribeToAttendanceIncidents,
  subscribeToStudents,
  type AttendanceIncidentListItem,
  type SaveAttendanceInput,
  type StudentListItem,
} from '../infrastructure/firestore'

type AttendanceDraft = {
  status: AttendanceStatus
  absenceReason: string
  lateMinutes: string
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getTodayValue() {
  return formatDateValue(new Date())
}

function getEarliestAttendanceDate() {
  const earliestDate = new Date()
  earliestDate.setDate(earliestDate.getDate() - 30)

  return formatDateValue(earliestDate)
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  return new Intl.DateTimeFormat('vi-VN').format(
    new Date(year, month - 1, day),
  )
}

const periodOptions = [
  {
    value: 'morning' as const,
    label: 'Buổi sáng',
    icon: Sun,
  },
  {
    value: 'afternoon' as const,
    label: 'Buổi chiều',
    icon: Sunset,
  },
]

const periodLabels: Record<AttendancePeriod, string> = {
  morning: 'Buổi sáng',
  afternoon: 'Buổi chiều',
}

const attendanceStatusOptions: {
  value: AttendanceStatus
  label: string
  selectedClassName: string
  summaryClassName: string
}[] = [
  {
    value: 'present',
    label: 'Có mặt',
    selectedClassName:
      'border-emerald-600 bg-emerald-600 text-white',
    summaryClassName:
      'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  {
    value: 'absent_excused',
    label: 'Vắng có phép',
    selectedClassName:
      'border-amber-500 bg-amber-500 text-white',
    summaryClassName:
      'border-amber-200 bg-amber-50 text-amber-700',
  },
  {
    value: 'absent_unexcused',
    label: 'Vắng không phép',
    selectedClassName:
      'border-red-500 bg-red-500 text-white',
    summaryClassName:
      'border-red-200 bg-red-50 text-red-700',
  },
  {
    value: 'late',
    label: 'Đi muộn',
    selectedClassName:
      'border-sky-500 bg-sky-500 text-white',
    summaryClassName:
      'border-sky-200 bg-sky-50 text-sky-700',
  },
]

const statusLabels = Object.fromEntries(
  attendanceStatusOptions.map(({ value, label }) => [
    value,
    label,
  ]),
) as Record<AttendanceStatus, string>

export function AttendancePage() {
  const { user } = useAuth()
  const [attendanceDate, setAttendanceDate] =
    useState(getTodayValue)
  const [period, setPeriod] =
    useState<AttendancePeriod>('morning')
  const [students, setStudents] =
    useState<StudentListItem[]>([])
  const [incidents, setIncidents] =
    useState<AttendanceIncidentListItem[]>([])
  const [attendanceByStudent, setAttendanceByStudent] =
    useState<Record<string, AttendanceDraft>>({})
  const [isStudentsLoading, setIsStudentsLoading] =
    useState(true)
  const [isHistoryLoading, setIsHistoryLoading] =
    useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const hydratedSelectionKey = useRef('')

  useEffect(() => {
    setIsStudentsLoading(true)

    const unsubscribe = subscribeToStudents(
      (nextStudents) => {
        setStudents(nextStudents)
        setIsStudentsLoading(false)
      },
      () => {
        setLoadError(
          'Không thể tải danh sách học sinh. Vui lòng tải lại trang.',
        )
        setIsStudentsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    setIsHistoryLoading(true)

    void cleanupExpiredAttendanceIncidents().catch(() => {
      // Bản ghi hết hạn vẫn được ẩn khỏi giao diện nếu việc dọn dẹp tạm thời thất bại.
    })

    const unsubscribe = subscribeToAttendanceIncidents(
      (nextIncidents) => {
        setIncidents(nextIncidents)
        setIsHistoryLoading(false)
      },
      () => {
        setLoadError(
          'Không thể tải lịch sử điểm danh. Vui lòng kiểm tra kết nối và tải lại trang.',
        )
        setIsHistoryLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const activeStudents = useMemo(
    () =>
      students.filter(
        (student) => student.status === 'active',
      ),
    [students],
  )

  useEffect(() => {
    if (isStudentsLoading || isHistoryLoading) return

    const selectionKey = `${attendanceDate}:${period}:${activeStudents
      .map((student) => student.id)
      .join(',')}`

    if (hydratedSelectionKey.current === selectionKey) return

    const incidentsByStudent = new Map(
      incidents
        .filter(
          (incident) =>
            incident.attendanceDate === attendanceDate &&
            incident.period === period,
        )
        .map((incident) => [incident.studentId, incident]),
    )

    const nextAttendance: Record<string, AttendanceDraft> = {}

    activeStudents.forEach((student) => {
      const incident = incidentsByStudent.get(student.id)

      nextAttendance[student.id] = {
        status: incident?.status ?? 'present',
        absenceReason: incident?.absenceReason ?? '',
        lateMinutes: '',
      }
    })

    setAttendanceByStudent(nextAttendance)
    hydratedSelectionKey.current = selectionKey
    setSaveError('')
    setSaveMessage('')
  }, [
    activeStudents,
    attendanceDate,
    incidents,
    isHistoryLoading,
    isStudentsLoading,
    period,
  ])

  function updateAttendanceStatus(
    studentId: string,
    status: AttendanceStatus,
  ) {
    setAttendanceByStudent((currentAttendance) => {
      const current = currentAttendance[studentId] ?? {
        status: 'present',
        absenceReason: '',
        lateMinutes: '',
      }

      return {
        ...currentAttendance,
        [studentId]: {
          status,
          absenceReason:
            status === 'absent_excused' ||
            status === 'absent_unexcused'
              ? current.absenceReason
              : '',
          lateMinutes:
            status === 'late' ? current.lateMinutes : '',
        },
      }
    })

    setSaveError('')
    setSaveMessage('')
  }

  function updateAbsenceReason(
    studentId: string,
    absenceReason: string,
  ) {
    setAttendanceByStudent((currentAttendance) => {
      const current: AttendanceDraft =
        currentAttendance[studentId] ?? {
          status: 'absent_excused',
          absenceReason: '',
          lateMinutes: '',
        }

      return {
        ...currentAttendance,
        [studentId]: {
          ...current,
          absenceReason,
        },
      }
    })
  }

  function updateLateMinutes(
    studentId: string,
    lateMinutes: string,
  ) {
    setAttendanceByStudent((currentAttendance) => {
      const current: AttendanceDraft =
        currentAttendance[studentId] ?? {
          status: 'late',
          absenceReason: '',
          lateMinutes: '',
        }

      return {
        ...currentAttendance,
        [studentId]: {
          ...current,
          lateMinutes,
        },
      }
    })
  }

  function markAllPresent() {
    setAttendanceByStudent(
      Object.fromEntries(
        activeStudents.map((student) => [
          student.id,
          {
            status: 'present',
            absenceReason: '',
            lateMinutes: '',
          } satisfies AttendanceDraft,
        ]),
      ),
    )
    setSaveError('')
    setSaveMessage('')
  }

  async function handleSaveAttendance() {
    if (!user) {
      setSaveError(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      )
      return
    }

    const records: SaveAttendanceInput['records'] =
      activeStudents.map((student) => {
        const draft = attendanceByStudent[student.id] ?? {
          status: 'present',
          absenceReason: '',
          lateMinutes: '',
        }

        if (
          draft.status === 'present' ||
          draft.status === 'late'
        ) {
          return {
            studentId: student.id,
            status: draft.status,
          }
        }

        return {
          studentId: student.id,
          studentCode: student.studentCode,
          studentName: student.fullName,
          status: draft.status,
          ...(draft.absenceReason.trim()
            ? { absenceReason: draft.absenceReason.trim() }
            : {}),
        }
      })

    setIsSaving(true)
    setSaveError('')
    setSaveMessage('')

    try {
      await saveAttendance({
        attendanceDate,
        period,
        actorId: user.uid,
        records,
      })

      setSaveMessage('Đã lưu điểm danh thành công.')
    } catch {
      setSaveError(
        'Không thể lưu điểm danh. Vui lòng kiểm tra kết nối và quyền Firestore rồi thử lại.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const statusCounts: Record<AttendanceStatus, number> = {
    present: 0,
    absent_excused: 0,
    absent_unexcused: 0,
    late: 0,
  }

  activeStudents.forEach((student) => {
    const status =
      attendanceByStudent[student.id]?.status ?? 'present'
    statusCounts[status] += 1
  })

  return (
    <main className="p-5 md:p-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-lotus-600">
          Quản lý lớp học
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
          Điểm danh
        </h2>

        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          Chọn ngày và buổi học, ghi nhận học sinh vắng hoặc
          đi muộn. Chỉ lịch sử vắng học được giữ trong 30 ngày.
        </p>
      </section>

      <section className="mt-8 grid gap-5 rounded-3xl border border-pink-100 bg-white p-5 shadow-sm md:grid-cols-2 md:p-6">
        <div>
          <label
            htmlFor="attendance-date"
            className="text-sm font-semibold text-slate-700"
          >
            Ngày điểm danh
          </label>

          <div className="relative mt-2">
            <CalendarDays
              aria-hidden="true"
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lotus-600"
            />

            <input
              id="attendance-date"
              type="date"
              min={getEarliestAttendanceDate()}
              max={getTodayValue()}
              value={attendanceDate}
              onChange={(event) =>
                setAttendanceDate(event.target.value)
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
            />
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">
            Buổi học
          </legend>

          <div className="mt-2 grid grid-cols-2 gap-3">
            {periodOptions.map(
              ({ value, label, icon: Icon }) => {
                const isSelected = period === value

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPeriod(value)}
                    aria-pressed={isSelected}
                    className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                      isSelected
                        ? 'border-lotus-600 bg-lotus-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-pink-300 hover:bg-lotus-50'
                    }`}
                  >
                    <Icon aria-hidden="true" size={19} />
                    {label}
                  </button>
                )
              },
            )}
          </div>
        </fieldset>
      </section>

      <section
        aria-label="Tổng hợp điểm danh"
        className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {attendanceStatusOptions.map((option) => (
          <article
            key={option.value}
            className={`rounded-2xl border p-4 ${option.summaryClassName}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide">
              {option.label}
            </p>

            <p className="mt-2 text-2xl font-bold">
              {statusCounts[option.value]}
            </p>
          </article>
        ))}
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

      {saveError ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {saveError}
        </div>
      ) : null}

      {saveMessage ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          {saveMessage}
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-bold text-slate-900">
              Danh sách học sinh
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Mặc định tất cả học sinh đều có mặt.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={markAllPresent}
              disabled={
                isStudentsLoading || activeStudents.length === 0
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 text-sm font-semibold text-lotus-700 transition hover:bg-lotus-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UsersRound aria-hidden="true" size={18} />
              Tất cả có mặt
            </button>

            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={
                isSaving ||
                isStudentsLoading ||
                isHistoryLoading ||
                activeStudents.length === 0
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-lotus-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-lotus-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={18}
                />
              ) : (
                <Save aria-hidden="true" size={18} />
              )}
              {isSaving ? 'Đang lưu...' : 'Lưu điểm danh'}
            </button>
          </div>
        </header>

        {isStudentsLoading || isHistoryLoading ? (
          <div
            role="status"
            className="flex items-center justify-center gap-3 px-5 py-16 text-sm font-medium text-lotus-700"
          >
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin"
              size={21}
            />
            Đang tải dữ liệu điểm danh...
          </div>
        ) : activeStudents.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
              <UsersRound aria-hidden="true" size={27} />
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Chưa có học sinh đang học
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Hãy thêm học sinh hoặc kiểm tra trạng thái trong
              trang Học sinh.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeStudents.map((student, index) => {
              const currentAttendance =
                attendanceByStudent[student.id] ?? {
                  status: 'present' as const,
                  absenceReason: '',
                  lateMinutes: '',
                }

              const showsAbsenceReason =
                currentAttendance.status === 'absent_excused' ||
                currentAttendance.status === 'absent_unexcused'

              return (
                <article
                  key={student.id}
                  className="px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 items-center gap-4 lg:flex-1">
                      <span className="w-7 shrink-0 text-center text-sm text-slate-400">
                        {index + 1}
                      </span>

                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lotus-50 text-sm font-bold text-lotus-700">
                        {student.fullName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {student.fullName}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {student.studentCode}
                          {student.group
                            ? ` · ${student.group}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {attendanceStatusOptions.map((option) => {
                        const isSelected =
                          currentAttendance.status === option.value

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              updateAttendanceStatus(
                                student.id,
                                option.value,
                              )
                            }
                            aria-pressed={isSelected}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                              isSelected
                                ? option.selectedClassName
                                : 'border-slate-200 bg-white text-slate-600 hover:border-pink-300 hover:bg-lotus-50'
                            }`}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {showsAbsenceReason ? (
                    <div className="mt-3 lg:ml-[5.75rem]">
                      <label
                        htmlFor={`absence-reason-${student.id}`}
                        className="text-xs font-semibold text-slate-600"
                      >
                        Ghi chú lý do vắng (không bắt buộc)
                      </label>

                      <input
                        id={`absence-reason-${student.id}`}
                        type="text"
                        maxLength={300}
                        value={currentAttendance.absenceReason}
                        onChange={(event) =>
                          updateAbsenceReason(
                            student.id,
                            event.target.value,
                          )
                        }
                        placeholder="Ví dụ: Bị sốt, gia đình xin phép..."
                        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
                      />
                    </div>
                  ) : null}

                  {currentAttendance.status === 'late' ? (
                    <div className="mt-3 lg:ml-[5.75rem]">
                      <label
                        htmlFor={`late-minutes-${student.id}`}
                        className="text-xs font-semibold text-slate-600"
                      >
                        Số phút đi muộn (không bắt buộc)
                      </label>

                      <div className="mt-1.5 flex max-w-xs items-center gap-2">
                        <input
                          id={`late-minutes-${student.id}`}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={300}
                          step={1}
                          value={currentAttendance.lateMinutes}
                          onChange={(event) =>
                            updateLateMinutes(
                              student.id,
                              event.target.value,
                            )
                          }
                          placeholder="Ví dụ: 10"
                          className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
                        />
                        <span className="text-sm font-medium text-slate-500">
                          phút
                        </span>
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-start gap-3 border-b border-slate-200 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lotus-50 text-lotus-700">
            <History aria-hidden="true" size={20} />
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              Lịch sử vắng học
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Chỉ lưu các trường hợp bất thường trong 30 ngày gần
              nhất.
            </p>
          </div>
        </header>

        {isHistoryLoading ? (
          <div className="flex items-center justify-center gap-3 px-5 py-12 text-sm font-medium text-lotus-700">
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin"
              size={20}
            />
            Đang tải lịch sử...
          </div>
        ) : incidents.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            Chưa có học sinh vắng hoặc đi muộn trong 30 ngày gần
            nhất.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {incidents.map((incident) => (
              <article
                key={incident.id}
                className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {incident.studentName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {incident.studentCode} ·{' '}
                    {formatDisplayDate(incident.attendanceDate)} ·{' '}
                    {periodLabels[incident.period]}
                  </p>

                  {incident.absenceReason ? (
                    <p className="mt-2 text-sm text-slate-600">
                      Lý do: {incident.absenceReason}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                      incident.status === 'absent_excused'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {statusLabels[incident.status]}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
