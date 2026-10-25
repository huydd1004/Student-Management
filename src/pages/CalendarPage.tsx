import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  AlarmClock,
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useSearchParams } from 'react-router'

import { useAuth } from '../auth/AuthProvider'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DateInput } from '../components/ui/DateInput'
import type { CalendarEventCategory } from '../domain'
import {
  createCalendarEvent,
  deleteCalendarEvent,
  subscribeToCalendarEvents,
  updateCalendarEvent,
  type CalendarEventInput,
  type CalendarEventListItem,
} from '../infrastructure/firestore'
import { formatLocalDateForDisplay } from '../utils/date'

const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const categoryLabels: Record<CalendarEventCategory, string> = {
  teaching: 'Giảng dạy',
  meeting: 'Họp và công việc',
  assessment: 'Kiểm tra – đánh giá',
  personal: 'Cá nhân',
  other: 'Khác',
}

const categoryStyles: Record<CalendarEventCategory, string> = {
  teaching: 'border-sky-200 bg-sky-50 text-sky-700',
  meeting: 'border-violet-200 bg-violet-50 text-violet-700',
  assessment: 'border-amber-200 bg-amber-50 text-amber-700',
  personal: 'border-pink-200 bg-pink-50 text-pink-700',
  other: 'border-slate-200 bg-slate-100 text-slate-700',
}

const reminderLabels: Record<number, string> = {
  0: 'Đúng giờ',
  5: 'Trước 5 phút',
  15: 'Trước 15 phút',
  30: 'Trước 30 phút',
  60: 'Trước 1 giờ',
  1440: 'Trước 1 ngày',
  10080: 'Trước 1 tuần',
}

function toLocalDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function fromLocalDateValue(value: string) {
  return new Date(`${value}T12:00:00`)
}

function isLocalDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
}

function formatMonthTitle(date: Date) {
  const title = new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
  }).format(date)

  return title.charAt(0).toUpperCase() + title.slice(1)
}

function formatSelectedDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fromLocalDateValue(value))
}

function createMonthGrid(monthDate: Date) {
  const firstDay = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1,
    12,
  )
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const firstGridDay = new Date(firstDay)
  firstGridDay.setDate(firstGridDay.getDate() - mondayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstGridDay)
    day.setDate(firstGridDay.getDate() + index)
    return day
  })
}

function sortEvents(events: CalendarEventListItem[]) {
  return [...events].sort((first, second) => {
    if (first.isAllDay !== second.isAllDay) {
      return first.isAllDay ? -1 : 1
    }

    return (first.startTime ?? '').localeCompare(second.startTime ?? '') ||
      first.title.localeCompare(second.title, 'vi')
  })
}

function EventFormModal({
  isOpen,
  initialDate,
  event,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  initialDate: string
  event: CalendarEventListItem | null
  isSubmitting: boolean
  errorMessage: string
  onClose: () => void
  onSubmit: (input: CalendarEventInput) => void | Promise<void>
}) {
  const [eventDate, setEventDate] = useState(
    event?.eventDate ?? initialDate,
  )
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay ?? true)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  function submitForm(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()
    const formData = new FormData(submitEvent.currentTarget)
    const title = String(formData.get('title') ?? '').trim()
    const startTime = String(formData.get('startTime') ?? '')
    const endTime = String(formData.get('endTime') ?? '')
    const notes = String(formData.get('notes') ?? '').trim()
    const reminder = String(formData.get('reminderMinutes') ?? '')

    if (!eventDate) {
      setValidationError('Vui lòng nhập ngày diễn ra.')
      return
    }

    if (!isAllDay && startTime && endTime && endTime <= startTime) {
      setValidationError('Giờ kết thúc phải sau giờ bắt đầu.')
      return
    }

    setValidationError('')
    void onSubmit({
      title,
      eventDate,
      isAllDay,
      category: String(
        formData.get('category') ?? 'other',
      ) as CalendarEventCategory,
      ...(!isAllDay && startTime ? { startTime } : {}),
      ...(!isAllDay && endTime ? { endTime } : {}),
      ...(notes ? { notes } : {}),
      ...(reminder ? { reminderMinutes: Number(reminder) } : {}),
    })
  }

  const inputClassName =
    'mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-lotus-400 focus:ring-4 focus:ring-pink-100'

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Đóng biểu mẫu lịch"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-form-title"
        className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-lotus-600">
              Lịch lớp 5.15
            </p>
            <h2
              id="calendar-event-form-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              {event ? 'Chỉnh sửa lịch' : 'Thêm lịch mới'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Đóng biểu mẫu"
          >
            <X aria-hidden="true" size={21} />
          </button>
        </header>

        <form onSubmit={submitForm} className="p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Tiêu đề <span className="text-red-500">*</span>
              <input
                name="title"
                required
                maxLength={200}
                defaultValue={event?.title ?? ''}
                placeholder="Ví dụ: Họp phụ huynh cuối học kỳ"
                className={inputClassName}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Ngày diễn ra <span className="text-red-500">*</span>
              <DateInput
                value={eventDate}
                required
                onChange={setEventDate}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Loại công việc
              <select
                name="category"
                defaultValue={event?.category ?? 'teaching'}
                className={inputClassName}
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(changeEvent) =>
                  setIsAllDay(changeEvent.target.checked)
                }
                className="size-4 accent-pink-600"
              />
              Sự kiện diễn ra cả ngày
            </label>

            {!isAllDay ? (
              <>
                <label className="text-sm font-medium text-slate-700">
                  Giờ bắt đầu
                  <input
                    name="startTime"
                    type="time"
                    defaultValue={event?.startTime ?? ''}
                    className={inputClassName}
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Giờ kết thúc
                  <input
                    name="endTime"
                    type="time"
                    defaultValue={event?.endTime ?? ''}
                    className={inputClassName}
                  />
                </label>
              </>
            ) : null}

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Nhắc trước
              <select
                name="reminderMinutes"
                defaultValue={
                  event?.reminderMinutes === undefined
                    ? ''
                    : String(event.reminderMinutes)
                }
                className={inputClassName}
              >
                <option value="">Không nhắc</option>
                {Object.entries(reminderLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">
                Với lịch cả ngày, hệ thống dùng mốc 08:00 để tính thời gian nhắc.
              </span>
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Ghi chú
              <textarea
                name="notes"
                maxLength={3000}
                rows={5}
                defaultValue={event?.notes ?? ''}
                placeholder="Nội dung cần chuẩn bị, người tham gia hoặc thông tin cần lưu ý..."
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
              />
            </label>
          </div>

          {validationError || errorMessage ? (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {validationError || errorMessage}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-lotus-600 px-5 text-sm font-semibold text-white transition hover:bg-lotus-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" size={18} />
              ) : null}
              {isSubmitting
                ? 'Đang lưu...'
                : event
                  ? 'Lưu thay đổi'
                  : 'Thêm vào lịch'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export function CalendarPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const today = toLocalDateValue(new Date())
  const requestedDate = searchParams.get('date')
  const initialDate = isLocalDate(requestedDate) ? requestedDate : today
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [displayedMonth, setDisplayedMonth] = useState(() =>
    fromLocalDateValue(initialDate),
  )
  const [events, setEvents] = useState<CalendarEventListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] =
    useState<CalendarEventListItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [eventPendingDeletion, setEventPendingDeletion] =
    useState<CalendarEventListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToCalendarEvents(
      (nextEvents) => {
        setEvents(nextEvents)
        setIsLoading(false)
      },
      () => {
        setLoadError('Không thể tải lịch. Vui lòng kiểm tra kết nối và thử lại.')
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!isLocalDate(requestedDate) || requestedDate === selectedDate) return

    setSelectedDate(requestedDate)
    setDisplayedMonth(fromLocalDateValue(requestedDate))
  }, [requestedDate])

  const eventsByDate = useMemo(() => {
    const groupedEvents = new Map<string, CalendarEventListItem[]>()

    events.forEach((event) => {
      groupedEvents.set(event.eventDate, [
        ...(groupedEvents.get(event.eventDate) ?? []),
        event,
      ])
    })

    groupedEvents.forEach((dateEvents, date) => {
      groupedEvents.set(date, sortEvents(dateEvents))
    })

    return groupedEvents
  }, [events])

  const monthGrid = useMemo(
    () => createMonthGrid(displayedMonth),
    [displayedMonth],
  )
  const selectedEvents = eventsByDate.get(selectedDate) ?? []
  const displayedMonthPrefix = `${displayedMonth.getFullYear()}-${String(
    displayedMonth.getMonth() + 1,
  ).padStart(2, '0')}`
  const monthEventCount = events.filter((event) =>
    event.eventDate.startsWith(displayedMonthPrefix),
  ).length
  const upcomingReminderCount = events.filter(
    (event) =>
      event.reminderMinutes !== undefined &&
      event.eventDate >= today,
  ).length

  function selectDate(date: string) {
    setSelectedDate(date)
    setSearchParams({ date }, { replace: true })
  }

  function changeMonth(offset: number) {
    setDisplayedMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + offset,
          1,
          12,
        ),
    )
  }

  function goToToday() {
    setDisplayedMonth(fromLocalDateValue(today))
    selectDate(today)
  }

  function openCreateForm(date = selectedDate) {
    setEditingEvent(null)
    selectDate(date)
    setSaveError('')
    setIsFormOpen(true)
  }

  function openEditForm(event: CalendarEventListItem) {
    setEditingEvent(event)
    setSaveError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) return
    setIsFormOpen(false)
    setEditingEvent(null)
    setSaveError('')
  }

  async function saveEvent(input: CalendarEventInput) {
    if (!user) return

    setIsSaving(true)
    setSaveError('')

    try {
      if (editingEvent) {
        await updateCalendarEvent(editingEvent.id, input, user.uid)
      } else {
        await createCalendarEvent(input, user.uid)
      }

      setSelectedDate(input.eventDate)
      setDisplayedMonth(fromLocalDateValue(input.eventDate))
      setSearchParams({ date: input.eventDate }, { replace: true })
      setIsFormOpen(false)
      setEditingEvent(null)
    } catch {
      setSaveError('Không thể lưu lịch. Vui lòng kiểm tra kết nối và thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  async function confirmDeleteEvent() {
    if (!eventPendingDeletion) return

    setIsDeleting(true)
    setDeleteError('')

    try {
      await deleteCalendarEvent(eventPendingDeletion.id)
      setEventPendingDeletion(null)
    } catch {
      setDeleteError('Không thể xóa lịch. Vui lòng kiểm tra kết nối và thử lại.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="p-4 md:p-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-lotus-600">
            Kế hoạch lớp học
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            Lịch và nhắc việc
          </h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            Theo dõi công việc, lịch dạy, cuộc họp và những ghi chú cần nhớ.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateForm()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-lotus-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-lotus-700"
        >
          <Plus aria-hidden="true" size={19} />
          Thêm lịch mới
        </button>
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
              <CalendarDays size={21} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hôm nay
              </p>
              <p className="mt-1 font-bold text-slate-900">
                {formatLocalDateForDisplay(today)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <NotebookPen size={21} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Trong tháng
              </p>
              <p className="mt-1 font-bold text-slate-900">
                {monthEventCount} lịch đã ghi
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <BellRing size={21} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sắp tới
              </p>
              <p className="mt-1 font-bold text-slate-900">
                {upcomingReminderCount} lịch có nhắc
              </p>
            </div>
          </div>
        </div>
      </section>

      {loadError ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError}
        </p>
      ) : null}

      <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-lotus-50 hover:text-lotus-700"
                aria-label="Tháng trước"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="min-w-40 text-center text-lg font-bold text-slate-900">
                {formatMonthTitle(displayedMonth)}
              </h3>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-lotus-50 hover:text-lotus-700"
                aria-label="Tháng sau"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <button
              type="button"
              onClick={goToToday}
              className="h-10 rounded-xl border border-pink-200 bg-white px-4 text-sm font-semibold text-lotus-700 transition hover:bg-lotus-50"
            >
              Về hôm nay
            </button>
          </header>

          {isLoading ? (
            <div className="flex min-h-96 items-center justify-center gap-3 text-sm font-semibold text-lotus-700">
              <LoaderCircle className="animate-spin" size={22} />
              Đang tải lịch...
            </div>
          ) : (
            <div className="p-2 sm:p-4">
              <div className="grid grid-cols-7">
                {weekdayLabels.map((weekday) => (
                  <div
                    key={weekday}
                    className="px-1 py-2 text-center text-[11px] font-bold uppercase text-slate-500 sm:text-xs"
                  >
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
                {monthGrid.map((day) => {
                  const dateValue = toLocalDateValue(day)
                  const dayEvents = eventsByDate.get(dateValue) ?? []
                  const isCurrentMonth =
                    day.getMonth() === displayedMonth.getMonth()
                  const isToday = dateValue === today
                  const isSelected = dateValue === selectedDate

                  return (
                    <button
                      key={dateValue}
                      type="button"
                      onClick={() => selectDate(dateValue)}
                      onDoubleClick={() => openCreateForm(dateValue)}
                      className={`group min-h-16 p-1 text-left transition sm:min-h-28 sm:p-2 ${
                        isSelected
                          ? 'relative z-[1] ring-2 ring-inset ring-lotus-500'
                          : 'hover:bg-lotus-50'
                      } ${
                        isCurrentMonth
                          ? 'bg-white'
                          : 'bg-slate-50'
                      }`}
                      aria-label={`${formatLocalDateForDisplay(dateValue)}, ${dayEvents.length} lịch`}
                    >
                      <span
                        className={`flex size-7 items-center justify-center rounded-full text-xs font-bold sm:size-8 sm:text-sm ${
                          isToday
                            ? 'bg-lotus-600 text-white'
                            : isCurrentMonth
                              ? 'text-slate-700 group-hover:text-lotus-700'
                              : 'text-slate-400 group-hover:text-slate-500'
                        }`}
                      >
                        {day.getDate()}
                      </span>

                      <div
                        className={`mt-1 flex flex-wrap gap-1 sm:hidden ${
                          isCurrentMonth ? '' : 'opacity-60'
                        }`}
                      >
                        {dayEvents.slice(0, 3).map((event) => (
                          <span
                            key={event.id}
                            className={`size-1.5 rounded-full border ${categoryStyles[event.category]}`}
                          />
                        ))}
                      </div>

                      <div
                        className={`mt-1 hidden space-y-1 sm:block ${
                          isCurrentMonth ? '' : 'opacity-60'
                        }`}
                      >
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`truncate rounded-md border px-1.5 py-1 text-[10px] font-semibold ${categoryStyles[event.category]}`}
                          >
                            {!event.isAllDay && event.startTime
                              ? `${event.startTime} `
                              : ''}
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 ? (
                          <p className="px-1 text-[10px] font-semibold text-slate-500">
                            +{dayEvents.length - 2} lịch khác
                          </p>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>

              <p className="mt-3 hidden text-xs text-slate-400 sm:block">
                Mẹo: nhấp đúp vào một ngày để thêm lịch nhanh.
              </p>
            </div>
          )}
        </div>

        <aside className="self-start overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-28">
          <header className="border-b border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-lotus-600">
              Chi tiết trong ngày
            </p>
            <h3 className="mt-2 text-lg font-bold capitalize text-slate-900">
              {formatSelectedDate(selectedDate)}
            </h3>
            <button
              type="button"
              onClick={() => openCreateForm(selectedDate)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-pink-200 bg-lotus-50 px-4 text-sm font-semibold text-lotus-700 transition hover:bg-pink-100"
            >
              <Plus size={17} />
              Thêm lịch ngày này
            </button>
          </header>

          <div className="max-h-[34rem] space-y-3 overflow-y-auto p-4">
            {selectedEvents.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <NotebookPen size={23} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Ngày này chưa có lịch
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Thêm công việc hoặc ghi chú để cả hai người cùng theo dõi.
                </p>
              </div>
            ) : (
              selectedEvents.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${categoryStyles[event.category]}`}
                      >
                        {categoryLabels[event.category]}
                      </span>
                      <h4 className="mt-2 font-bold leading-6 text-slate-900">
                        {event.title}
                      </h4>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(event)}
                        className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-lotus-50 hover:text-lotus-700"
                        aria-label={`Chỉnh sửa ${event.title}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError('')
                          setEventPendingDeletion(event)
                        }}
                        className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Xóa ${event.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Clock3 size={15} className="text-slate-400" />
                      {event.isAllDay
                        ? 'Cả ngày'
                        : event.startTime
                          ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ''}`
                          : 'Chưa đặt giờ'}
                    </p>
                    {event.reminderMinutes !== undefined ? (
                      <p className="flex items-center gap-2">
                        <AlarmClock size={15} className="text-amber-600" />
                        {reminderLabels[event.reminderMinutes] ??
                          `Trước ${event.reminderMinutes} phút`}
                      </p>
                    ) : null}
                  </div>

                  {event.notes ? (
                    <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-600">
                      {event.notes}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </aside>
      </section>

      <EventFormModal
        key={editingEvent?.id ?? `new-${selectedDate}-${isFormOpen}`}
        isOpen={isFormOpen}
        initialDate={selectedDate}
        event={editingEvent}
        isSubmitting={isSaving}
        errorMessage={saveError}
        onClose={closeForm}
        onSubmit={saveEvent}
      />

      <ConfirmDialog
        isOpen={Boolean(eventPendingDeletion)}
        title="Xóa lịch này?"
        description={
          eventPendingDeletion
            ? `Bạn sắp xóa “${eventPendingDeletion.title}”. Cả hai người dùng sẽ không còn nhìn thấy lịch này.`
            : ''
        }
        confirmLabel="Xóa lịch"
        isConfirming={isDeleting}
        errorMessage={deleteError}
        onClose={() => {
          if (!isDeleting) setEventPendingDeletion(null)
        }}
        onConfirm={confirmDeleteEvent}
      />
    </main>
  )
}
