import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  AlertTriangle,
  LoaderCircle,
  MessageCircle,
  Send,
  ShieldCheck,
} from 'lucide-react'

import { useAuth } from '../auth/AuthProvider'
import { CLASS_MEMBER_TITLES } from '../config/classroom'
import {
  sendChatMessage,
  subscribeToChatMessages,
  type ChatMessageListItem,
} from '../infrastructure/firestore'

const MAX_MESSAGE_LENGTH = 2_000

function formatMessageTime(message: ChatMessageListItem) {
  if (!message.createdAt?.seconds) return 'Đang gửi...'

  const date = new Date(message.createdAt.seconds * 1_000)
  const today = new Date()
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  return new Intl.DateTimeFormat('vi-VN', {
    ...(isToday
      ? { hour: '2-digit', minute: '2-digit' }
      : {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
  }).format(date)
}

export function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessageListItem[]>([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [sendError, setSendError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(
      (nextMessages) => {
        setMessages(nextMessages)
        setIsLoading(false)
      },
      () => {
        setLoadError(
          'Không thể tải cuộc trò chuyện. Vui lòng kiểm tra kết nối và tải lại trang.',
        )
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: isLoading ? 'auto' : 'smooth',
      block: 'end',
    })
  }, [isLoading, messages])

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedDraft = draft.trim()

    if (!user || !normalizedDraft || isSending) return

    setIsSending(true)
    setSendError('')

    try {
      await sendChatMessage(
        normalizedDraft,
        user.uid,
      )
      setDraft('')
    } catch {
      setSendError('Không thể gửi tin nhắn. Vui lòng thử lại.')
    } finally {
      setIsSending(false)
    }
  }

  function handleDraftKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      messageFormRef.current?.requestSubmit()
    }
  }

  return (
    <main className="p-4 md:p-8">
      <section className="flex h-[calc(100dvh-7rem)] min-h-[30rem] flex-col overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm md:h-[calc(100dvh-9rem)]">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lotus-600 text-white shadow-lg shadow-lotus-200/50">
              <MessageCircle aria-hidden="true" size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900">
                Trao đổi nội bộ
              </h2>
              <p className="truncate text-xs text-slate-500 md:text-sm">
                Quản trị viên hệ thống và giáo viên chủ nhiệm
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">Đồng bộ trực tiếp</span>
            <span className="sm:hidden">Trực tiếp</span>
          </div>
        </header>

        {loadError ? (
          <div
            role="alert"
            className="m-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            <AlertTriangle className="mt-0.5 shrink-0" size={19} />
            {loadError}
          </div>
        ) : null}

        <div
          className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-4 py-5 md:px-6"
          aria-live="polite"
          aria-label="Nội dung trò chuyện"
        >
          {isLoading ? (
            <div className="grid h-full place-items-center">
              <div className="flex flex-col items-center gap-3 text-lotus-600">
                <LoaderCircle className="animate-spin" size={30} />
                <p className="text-sm font-semibold">Đang tải tin nhắn...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="grid h-full place-items-center">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
                  <MessageCircle size={28} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Bắt đầu cuộc trò chuyện
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Tin nhắn đầu tiên sẽ xuất hiện ở đây và được đồng bộ cho cả hai thành viên.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col gap-4">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === user?.uid
                const senderTitle =
                  CLASS_MEMBER_TITLES[message.senderId] ??
                  'Thành viên quản lý'

                return (
                  <article
                    key={message.id}
                    className={`flex ${
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] md:max-w-[72%] ${
                        isOwnMessage ? 'items-end' : 'items-start'
                      } flex flex-col`}
                    >
                      <div className="mb-1 flex items-center gap-2 px-1 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {isOwnMessage ? 'Bạn' : message.senderName}
                        </span>
                        <span>·</span>
                        <span>{senderTitle}</span>
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                          isOwnMessage
                            ? 'rounded-br-md bg-lotus-600 text-white'
                            : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.text}
                        </p>
                      </div>
                      <time className="mt-1 px-1 text-[11px] text-slate-400">
                        {formatMessageTime(message)}
                      </time>
                    </div>
                  </article>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form
          ref={messageFormRef}
          onSubmit={(event) => void submitMessage(event)}
          className="border-t border-slate-200 bg-white p-3 md:p-4"
        >
          {sendError ? (
            <p
              role="alert"
              className="mb-2 text-sm font-medium text-red-700"
            >
              {sendError}
            </p>
          ) : null}

          <div className="mx-auto flex max-w-4xl items-end gap-2 md:gap-3">
            <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 transition focus-within:border-lotus-400 focus-within:ring-4 focus-within:ring-pink-100">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleDraftKeyDown}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={1}
                placeholder="Nhập tin nhắn..."
                aria-label="Nội dung tin nhắn"
                className="max-h-28 min-h-7 w-full resize-none bg-transparent text-sm leading-7 text-slate-900 outline-none placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-400">
                  Enter để gửi · Shift + Enter để xuống dòng
                </p>
                <span className="text-[11px] text-slate-400">
                  {draft.length}/{MAX_MESSAGE_LENGTH}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-lotus-600 text-white shadow-lg shadow-lotus-200/50 transition hover:bg-lotus-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Gửi tin nhắn"
            >
              {isSending ? (
                <LoaderCircle className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>

          <div className="mx-auto mt-2 flex max-w-4xl items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck size={13} />
            Chỉ hai thành viên đã được phê duyệt có thể đọc và gửi tin nhắn.
          </div>
        </form>
      </section>
    </main>
  )
}
