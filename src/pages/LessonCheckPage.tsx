import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  Dices,
  History,
  LoaderCircle,
  RotateCcw,
  Save,
  Users,
} from 'lucide-react'
import { Link } from 'react-router'

import { useAuth } from '../auth/AuthProvider'
import { DEFAULT_SUBJECTS } from '../data/default-subjects'
import type { LessonCheckOutcome } from '../domain'
import {
  createLessonCheckCall,
  subscribeToLessonCheckCalls,
  subscribeToStudents,
  updateLessonCheckCall,
  type LessonCheckCallListItem,
  type StudentListItem,
} from '../infrastructure/firestore'

const outcomeOptions: Array<{
  value: Exclude<LessonCheckOutcome, 'not_recorded'>
  label: string
  className: string
}> = [
  {
    value: 'completed',
    label: 'Hoàn thành',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400',
  },
  {
    value: 'needs_support',
    label: 'Cần hỗ trợ',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400',
  },
  {
    value: 'skipped',
    label: 'Bỏ qua',
    className:
      'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400',
  },
]

const outcomeLabels: Record<LessonCheckOutcome, string> = {
  not_recorded: 'Chưa đánh giá',
  completed: 'Hoàn thành',
  needs_support: 'Cần hỗ trợ',
  skipped: 'Bỏ qua',
}

const outcomeStyles: Record<LessonCheckOutcome, string> = {
  not_recorded: 'bg-slate-100 text-slate-600',
  completed: 'bg-emerald-50 text-emerald-700',
  needs_support: 'bg-amber-50 text-amber-700',
  skipped: 'bg-slate-100 text-slate-600',
}

function formatCallTime(call: LessonCheckCallListItem) {
  if (!call.calledAt?.seconds) return 'Vừa gọi'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(call.calledAt.seconds * 1000))
}

function normalizeGroupName(value?: string) {
  return (value ?? '')
    .trim()
    .replace(/^(tổ|to)\s*/i, '')
    .trim()
}

function formatGroupName(value?: string) {
  const normalizedGroup = normalizeGroupName(value)

  return normalizedGroup ? `Tổ ${normalizedGroup}` : ''
}

export function LessonCheckPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [calls, setCalls] = useState<LessonCheckCallListItem[]>([])
  const [subjectId, setSubjectId] = useState('toan')
  const [group, setGroup] = useState('all')
  const [currentStudent, setCurrentStudent] =
    useState<StudentListItem | null>(null)
  const [currentCallId, setCurrentCallId] = useState('')
  const [outcome, setOutcome] =
    useState<LessonCheckOutcome>('not_recorded')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCalling, setIsCalling] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let loadedStudents = false
    let loadedCalls = false

    const finishLoading = () => {
      if (loadedStudents && loadedCalls) setIsLoading(false)
    }
    const reportError = () => {
      setError(
        'Không thể tải dữ liệu gọi bài. Vui lòng kiểm tra kết nối và tải lại trang.',
      )
      setIsLoading(false)
    }
    const unsubscribeStudents = subscribeToStudents(
      (nextStudents) => {
        setStudents(nextStudents)
        loadedStudents = true
        finishLoading()
      },
      reportError,
    )
    const unsubscribeCalls = subscribeToLessonCheckCalls(
      (nextCalls) => {
        setCalls(nextCalls)
        loadedCalls = true
        finishLoading()
      },
      reportError,
    )

    return () => {
      unsubscribeStudents()
      unsubscribeCalls()
    }
  }, [])

  const activeStudents = useMemo(
    () => students.filter((student) => student.status === 'active'),
    [students],
  )
  const groups = useMemo(
    () =>
      Array.from(
        new Set(
          activeStudents
            .map((student) => normalizeGroupName(student.group))
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((first, second) => first.localeCompare(second, 'vi')),
    [activeStudents],
  )
  const eligibleStudents = useMemo(
    () =>
      activeStudents.filter(
        (student) =>
          group === 'all' ||
          normalizeGroupName(student.group) === group,
      ),
    [activeStudents, group],
  )
  const selectedSubject =
    DEFAULT_SUBJECTS.find((subject) => subject.id === subjectId) ??
    DEFAULT_SUBJECTS[0]

  async function callRandomStudent() {
    if (!user || eligibleStudents.length === 0) return

    setIsCalling(true)
    setError('')
    setMessage('')

    try {
      const pool =
        eligibleStudents.length > 1 && currentStudent
          ? eligibleStudents.filter(
              (student) => student.id !== currentStudent.id,
            )
          : eligibleStudents
      const selectedStudent =
        pool[Math.floor(Math.random() * pool.length)]
      const callId = await createLessonCheckCall({
        studentId: selectedStudent.id,
        studentCode: selectedStudent.studentCode,
        studentName: selectedStudent.fullName,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        actorId: user.uid,
      })

      setCurrentStudent(selectedStudent)
      setCurrentCallId(callId)
      setOutcome('not_recorded')
      setNotes('')
      setMessage(`Đã chọn ${selectedStudent.fullName}.`)
    } catch {
      setError('Không thể lưu lượt gọi bài. Vui lòng thử lại.')
    } finally {
      setIsCalling(false)
    }
  }

  async function saveResult(nextOutcome = outcome) {
    if (!user || !currentCallId || nextOutcome === 'not_recorded') {
      setError('Hãy chọn kết quả đánh giá trước khi lưu.')
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      await updateLessonCheckCall(
        currentCallId,
        nextOutcome,
        notes,
        user.uid,
      )
      setOutcome(nextOutcome)
      setMessage('Đã lưu kết quả gọi bài.')
    } catch {
      setError('Không thể lưu kết quả. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="p-5 md:p-8">
      <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-lotus-600">GỌI BÀI</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Gọi kiểm tra bài cũ
        </h2>
        <p className="mt-2 max-w-3xl leading-7 text-slate-600">
          Chọn môn học và tổ, sau đó hệ thống sẽ gọi ngẫu nhiên một học sinh.
          Mỗi lượt gọi và kết quả đều được lưu vào lịch sử.
        </p>
      </section>

      {error ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertTriangle className="mt-0.5 shrink-0" size={19} />
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="shrink-0" size={19} />
          {message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Môn học
              <select
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-lotus-400"
              >
                {DEFAULT_SUBJECTS.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Phạm vi gọi
              <select
                value={group}
                onChange={(event) => setGroup(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-lotus-400"
              >
                <option value="all">Cả lớp ({activeStudents.length})</option>
                {groups.map((groupName) => (
                  <option key={groupName} value={groupName}>
                    {formatGroupName(groupName)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-pink-300 bg-lotus-50/50 p-6 text-center">
            {isLoading ? (
              <LoaderCircle className="animate-spin text-lotus-600" size={36} />
            ) : currentStudent ? (
              <>
                <div className="flex size-16 items-center justify-center rounded-2xl bg-lotus-600 text-2xl font-bold text-white shadow-lg shadow-lotus-200/50">
                  {currentStudent.fullName.trim().charAt(0).toUpperCase()}
                </div>
                <p className="mt-4 text-sm font-semibold text-lotus-600">
                  {selectedSubject.name}
                </p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">
                  {currentStudent.fullName}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {currentStudent.studentCode}
                  {currentStudent.group
                    ? ` · ${formatGroupName(currentStudent.group)}`
                    : ''}
                </p>
              </>
            ) : eligibleStudents.length > 0 ? (
              <>
                <Dices className="text-lotus-600" size={46} />
                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  Sẵn sàng gọi bài
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Có {eligibleStudents.length} học sinh trong phạm vi đã chọn.
                </p>
              </>
            ) : (
              <>
                <Users className="text-slate-400" size={44} />
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Chưa có học sinh phù hợp
                </h3>
                <Link
                  to="/students"
                  className="mt-3 text-sm font-semibold text-lotus-700 hover:underline"
                >
                  Mở danh sách học sinh
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={isLoading || isCalling || eligibleStudents.length === 0}
            onClick={() => void callRandomStudent()}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lotus-600 px-5 font-semibold text-white transition hover:bg-lotus-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCalling ? (
              <LoaderCircle className="animate-spin" size={20} />
            ) : currentStudent ? (
              <RotateCcw size={20} />
            ) : (
              <Dices size={20} />
            )}
            {isCalling
              ? 'Đang chọn...'
              : currentStudent
                ? 'Gọi học sinh khác'
                : 'Gọi ngẫu nhiên'}
          </button>

          {currentStudent ? (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <h3 className="font-bold text-slate-900">Kết quả kiểm tra</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {outcomeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                      setOutcome(option.value)
                      void saveResult(option.value)
                    }}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${option.className} ${
                      outcome === option.value
                        ? 'ring-2 ring-lotus-400 ring-offset-2'
                        : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Ghi chú (không bắt buộc)
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Cần ôn lại phép tính phân số..."
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-lotus-400"
                />
              </label>

              <button
                type="button"
                disabled={isSaving || outcome === 'not_recorded'}
                onClick={() => void saveResult()}
                className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-5 text-sm font-semibold text-lotus-700 transition hover:bg-lotus-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                Lưu ghi chú
              </button>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-lotus-50 text-lotus-700">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Lịch sử gần đây</h3>
              <p className="text-sm text-slate-500">20 lượt gọi mới nhất</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {calls.length === 0 && !isLoading ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                Chưa có lượt gọi bài nào.
              </div>
            ) : (
              calls.map((call) => (
                <article
                  key={call.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {call.studentName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {call.subjectName} · {formatCallTime(call)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${outcomeStyles[call.outcome]}`}
                    >
                      {outcomeLabels[call.outcome]}
                    </span>
                  </div>
                  {call.notes ? (
                    <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {call.notes}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-lotus-50 p-4 text-sm text-lotus-700">
            <BookOpenCheck className="mt-0.5 shrink-0" size={19} />
            <p>
              Lịch sử giúp các thành viên tránh gọi lặp lại và theo dõi học
              sinh đang cần hỗ trợ.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
