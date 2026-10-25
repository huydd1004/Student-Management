import {
  Bell,
  BellRing,
  CalendarDays,
  CheckCheck,
  MessageCircle,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router'

import { useAuth } from '../../auth/AuthProvider'
import type { TimestampValue } from '../../domain'
import {
  subscribeToCalendarEvents,
  subscribeToChatMessages,
  subscribeToMemberChatReadAt,
  type CalendarEventListItem,
  type ChatMessageListItem,
} from '../../infrastructure/firestore'
import { formatLocalDateForDisplay } from '../../utils/date'

const CHAT_UNREAD_ROLLOUT_SECONDS = Math.floor(
  Date.parse('2026-10-23T01:50:00Z') / 1_000,
)

function getStorageSet(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]')
    return new Set<string>(Array.isArray(value) ? value : [])
  } catch {
    return new Set<string>()
  }
}

function saveStorageSet(key: string, values: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...values].slice(-250)))
  } catch {
    // Trình duyệt chặn bộ nhớ cục bộ: thông báo vẫn hoạt động trong phiên hiện tại.
  }
}

function getEventStartTime(event: CalendarEventListItem) {
  const time = event.isAllDay ? '08:00' : event.startTime || '08:00'
  return Date.parse(`${event.eventDate}T${time}:00+07:00`)
}

function getReminderKey(event: CalendarEventListItem) {
  return [
    event.id,
    event.eventDate,
    event.isAllDay ? 'all-day' : event.startTime || 'no-time',
    event.reminderMinutes ?? 'none',
  ].join(':')
}

function isReminderDue(event: CalendarEventListItem, now: number) {
  if (event.reminderMinutes === undefined) return false

  const eventStart = getEventStartTime(event)
  const reminderTime = eventStart - event.reminderMinutes * 60_000
  const endOfEventDate = Date.parse(`${event.eventDate}T23:59:59+07:00`)

  return reminderTime <= now && now <= endOfEventDate
}

async function showSystemNotification(
  title: string,
  options: NotificationOptions,
) {
  if (
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted'
  ) {
    return
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, options)
    return
  }

  new Notification(title, options)
}

export function NotificationCenter() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessageListItem[]>([])
  const [chatLastReadAt, setChatLastReadAt] =
    useState<TimestampValue | null>(null)
  const [hasLoadedReadAt, setHasLoadedReadAt] = useState(false)
  const [events, setEvents] = useState<CalendarEventListItem[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() =>
    typeof Notification === 'undefined'
      ? 'unsupported'
      : Notification.permission,
  )
  const [permissionMessage, setPermissionMessage] = useState('')
  const [seenReminderIds, setSeenReminderIds] = useState<Set<string>>(
    new Set(),
  )
  const knownMessageIdsRef = useRef<Set<string> | null>(null)

  const seenStorageKey = user
    ? `an-binh-515:seen-reminders:${user.uid}`
    : ''
  const notifiedStorageKey = user
    ? `an-binh-515:notified-reminders:${user.uid}`
    : ''

  useEffect(() => {
    if (!user) return

    setSeenReminderIds(getStorageSet(seenStorageKey))

    const unsubscribeMessages = subscribeToChatMessages(
      (nextMessages) => {
        const knownIds = knownMessageIdsRef.current

        if (knownIds) {
          const newMessages = nextMessages.filter(
            (message) =>
              !knownIds.has(message.id) &&
              message.senderId !== user.uid,
          )

          newMessages.forEach((message) => {
            if (window.location.hash.includes('/chat')) return

            void showSystemNotification(
              `Tin nhắn mới từ ${message.senderName}`,
              {
                body:
                  message.text.length > 120
                    ? `${message.text.slice(0, 117)}...`
                    : message.text,
                icon: `${import.meta.env.BASE_URL}pwa-192x192.png`,
                badge: `${import.meta.env.BASE_URL}pwa-64x64.png`,
                tag: `chat-${message.id}`,
                data: {
                  url: `${window.location.origin}${import.meta.env.BASE_URL}#/chat`,
                },
              },
            ).catch(() => undefined)
          })
        }

        knownMessageIdsRef.current = new Set(
          nextMessages.map((message) => message.id),
        )
        setMessages(nextMessages)
      },
      () => undefined,
    )
    const unsubscribeReadAt = subscribeToMemberChatReadAt(
      user.uid,
      (readAt) => {
        setChatLastReadAt(readAt)
        setHasLoadedReadAt(true)
      },
      () => setHasLoadedReadAt(true),
    )
    const unsubscribeEvents = subscribeToCalendarEvents(
      setEvents,
      () => undefined,
    )

    return () => {
      unsubscribeMessages()
      unsubscribeReadAt()
      unsubscribeEvents()
      knownMessageIdsRef.current = null
    }
  }, [seenStorageKey, user])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousBodyOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  const unreadMessages = useMemo(() => {
    if (!user || !hasLoadedReadAt || location.pathname === '/chat') {
      return []
    }

    const readAt = chatLastReadAt ?? {
      seconds: CHAT_UNREAD_ROLLOUT_SECONDS,
      nanoseconds: 0,
    }

    return messages.filter((message) => {
      if (message.senderId === user.uid || !message.createdAt) return false

      return (
        message.createdAt.seconds > readAt.seconds ||
        (message.createdAt.seconds === readAt.seconds &&
          message.createdAt.nanoseconds > readAt.nanoseconds)
      )
    })
  }, [chatLastReadAt, hasLoadedReadAt, location.pathname, messages, user])

  const dueReminders = useMemo(
    () =>
      events
        .filter((event) => isReminderDue(event, now))
        .sort(
          (first, second) =>
            getEventStartTime(first) - getEventStartTime(second),
        ),
    [events, now],
  )
  const unreadReminders = dueReminders.filter(
    (event) => !seenReminderIds.has(getReminderKey(event)),
  )
  const unreadCount = unreadMessages.length + unreadReminders.length

  useEffect(() => {
    if (
      !user ||
      notificationPermission !== 'granted' ||
      unreadReminders.length === 0
    ) {
      return
    }

    const notifiedIds = getStorageSet(notifiedStorageKey)

    unreadReminders.forEach((event) => {
      const reminderKey = getReminderKey(event)

      if (notifiedIds.has(reminderKey)) return

      notifiedIds.add(reminderKey)
      void showSystemNotification('Nhắc việc lớp 5.15', {
        body: `${event.title} – ${formatLocalDateForDisplay(event.eventDate)}${
          !event.isAllDay && event.startTime ? ` lúc ${event.startTime}` : ''
        }`,
        icon: `${import.meta.env.BASE_URL}pwa-192x192.png`,
        badge: `${import.meta.env.BASE_URL}pwa-64x64.png`,
        tag: `calendar-${event.id}`,
        data: {
          url: `${window.location.origin}${import.meta.env.BASE_URL}#/calendar?date=${event.eventDate}`,
        },
      }).catch(() => undefined)
    })

    saveStorageSet(notifiedStorageKey, notifiedIds)
  }, [notificationPermission, notifiedStorageKey, unreadReminders, user])

  function markReminderAsSeen(event: CalendarEventListItem) {
    setSeenReminderIds((currentIds) => {
      const nextIds = new Set(currentIds)
      nextIds.add(getReminderKey(event))
      saveStorageSet(seenStorageKey, nextIds)
      return nextIds
    })
  }

  function markAllRemindersAsSeen() {
    setSeenReminderIds((currentIds) => {
      const nextIds = new Set(currentIds)
      dueReminders.forEach((event) =>
        nextIds.add(getReminderKey(event)),
      )
      saveStorageSet(seenStorageKey, nextIds)
      return nextIds
    })
  }

  async function requestNotificationPermission() {
    setPermissionMessage('')

    if (typeof Notification === 'undefined') {
      setPermissionMessage('Trình duyệt này chưa hỗ trợ thông báo hệ thống.')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      setPermissionMessage(
        permission === 'granted'
          ? 'Đã bật thông báo hệ thống.'
          : 'Bạn chưa cho phép thông báo trong cài đặt của trình duyệt.',
      )
    } catch {
      setPermissionMessage(
        'Không thể bật thông báo. Trên iPhone, hãy thêm ứng dụng vào Màn hình chính rồi thử lại.',
      )
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="relative flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-lotus-50 hover:text-lotus-700"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} thông báo chưa đọc`
            : 'Mở trung tâm thông báo'
        }
        aria-expanded={isOpen}
      >
        <Bell aria-hidden="true" size={20} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-lotus-600 px-1 text-[10px] font-bold leading-5 text-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/20"
            onClick={() => setIsOpen(false)}
            aria-label="Đóng trung tâm thông báo"
          />

          <section
            role="dialog"
            aria-label="Trung tâm thông báo"
            className="fixed inset-x-3 top-[calc(5rem+env(safe-area-inset-top))] z-50 max-h-[calc(100dvh-6rem-env(safe-area-inset-top))] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:max-h-[36rem] sm:w-[25rem]"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-lotus-600">
                  Cập nhật mới
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Thông báo
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                aria-label="Đóng"
              >
                <X size={19} />
              </button>
            </header>

            {notificationPermission !== 'granted' ? (
              <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <BellRing className="mt-0.5 shrink-0 text-amber-700" size={20} />
                  <div>
                    <p className="text-sm font-bold text-amber-900">
                      Bật thông báo hệ thống
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      Nhận tin nhắn và lời nhắc khi ứng dụng đang hoạt động.
                    </p>
                    <button
                      type="button"
                      onClick={() => void requestNotificationPermission()}
                      className="mt-3 h-9 rounded-xl bg-amber-600 px-3 text-xs font-bold text-white transition hover:bg-amber-700"
                    >
                      Cho phép thông báo
                    </button>
                  </div>
                </div>
                {permissionMessage ? (
                  <p className="mt-2 text-xs font-medium text-amber-800">
                    {permissionMessage}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="divide-y divide-slate-100">
              {unreadMessages.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    navigate('/chat')
                  }}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-lotus-50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <MessageCircle size={19} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {unreadMessages.length} tin nhắn mới
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {unreadMessages.at(-1)?.senderName}:{' '}
                      {unreadMessages.at(-1)?.text}
                    </p>
                  </div>
                </button>
              ) : null}

              {unreadReminders.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    markReminderAsSeen(event)
                    setIsOpen(false)
                    navigate(`/calendar?date=${event.eventDate}`)
                  }}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-lotus-50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                    <CalendarDays size={19} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {event.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatLocalDateForDisplay(event.eventDate)}
                      {!event.isAllDay && event.startTime
                        ? ` · ${event.startTime}`
                        : ' · Cả ngày'}
                    </p>
                  </div>
                </button>
              ))}

              {unreadCount === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <CheckCheck size={22} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-800">
                    Bạn đã xem hết thông báo
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tin nhắn và lời nhắc mới sẽ xuất hiện tại đây.
                  </p>
                </div>
              ) : null}
            </div>

            {unreadReminders.length > 0 ? (
              <footer className="sticky bottom-0 border-t border-slate-200 bg-slate-50 p-3">
                <button
                  type="button"
                  onClick={markAllRemindersAsSeen}
                  className="h-10 w-full rounded-xl text-sm font-semibold text-lotus-700 transition hover:bg-lotus-50"
                >
                  Đánh dấu lời nhắc đã xem
                </button>
              </footer>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  )
}
