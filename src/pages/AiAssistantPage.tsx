import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  AlertTriangle,
  BookOpenCheck,
  Bot,
  ClipboardCheck,
  LoaderCircle,
  Megaphone,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react'

import { useAuth } from '../auth/AuthProvider'
import { AiMessageContent } from '../components/ai/AiMessageContent'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import {
  AiAssistantError,
  isAiAssistantConfigured,
  streamAiResponse,
  type AiConversationMessage,
} from '../features/ai-assistant/client'

type UiMessage = AiConversationMessage & {
  id: string
}

const MAX_MESSAGE_LENGTH = 4_000
const MAX_CONTEXT_MESSAGES = 12

const suggestions = [
  {
    title: 'Tạo bài Toán lớp 5',
    description: 'Tạo bài phù hợp chủ đề và kèm lời giải từng bước.',
    prompt:
      'Hãy tạo 5 bài tập Toán lớp 5 về phép tính với số thập phân, từ dễ đến khó, kèm lời giải chi tiết dành cho giáo viên.',
    icon: BookOpenCheck,
  },
  {
    title: 'Soạn nhận xét',
    description: 'Viết nhận xét tích cực, rõ ràng và có hướng hỗ trợ.',
    prompt:
      'Hãy giúp tôi soạn một mẫu nhận xét học sinh lớp 5 theo hướng tích cực, gồm điểm mạnh, nội dung cần cố gắng và một đề xuất hỗ trợ.',
    icon: ClipboardCheck,
  },
  {
    title: 'Thông báo phụ huynh',
    description: 'Soạn thông báo lịch sự, ngắn gọn và dễ hiểu.',
    prompt:
      'Hãy soạn một mẫu thông báo gửi phụ huynh lớp 5 về việc nhắc học sinh chuẩn bị đầy đủ sách vở và đồ dùng học tập.',
    icon: Megaphone,
  },
]

function createMessage(
  role: UiMessage['role'],
  content: string,
): UiMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function friendlyErrorMessage(error: unknown) {
  if (error instanceof AiAssistantError) return error.message

  return 'Không thể nhận câu trả lời từ Trợ lý AI. Vui lòng thử lại.'
}

export function AiAssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageFormRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isConfigured = isAiAssistantConfigured()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: messages.length > 1 ? 'smooth' : 'auto',
      block: 'end',
    })
  }, [messages])

  useEffect(
    () => () => {
      abortControllerRef.current?.abort()
    },
    [],
  )

  function applySuggestion(prompt: string) {
    setDraft(prompt)
    setErrorMessage('')
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function stopGenerating() {
    abortControllerRef.current?.abort()
  }

  function clearConversation() {
    setMessages([])
    setDraft('')
    setErrorMessage('')
    setIsClearDialogOpen(false)
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedDraft = draft.trim()

    if (
      !user ||
      !normalizedDraft ||
      isGenerating ||
      !isConfigured
    ) {
      return
    }

    const userMessage = createMessage('user', normalizedDraft)
    const assistantMessage = createMessage('assistant', '')
    const conversationForRequest = [...messages, userMessage]
      .filter((message) => message.content.trim())
      .slice(-MAX_CONTEXT_MESSAGES)
      .map(({ role, content }) => ({ role, content }))
    const abortController = new AbortController()

    abortControllerRef.current = abortController
    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantMessage,
    ])
    setDraft('')
    setErrorMessage('')
    setIsGenerating(true)

    try {
      await streamAiResponse({
        user,
        messages: conversationForRequest,
        signal: abortController.signal,
        onDelta: (delta) => {
          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              message.id === assistantMessage.id
                ? { ...message, content: message.content + delta }
                : message,
            ),
          )
        },
      })
    } catch (error) {
      if (isAbortError(error)) {
        setMessages((currentMessages) =>
          currentMessages.filter(
            (message) =>
              message.id !== assistantMessage.id ||
              message.content.trim(),
          ),
        )
      } else {
        setMessages((currentMessages) =>
          currentMessages.filter(
            (message) => message.id !== assistantMessage.id,
          ),
        )
        setErrorMessage(friendlyErrorMessage(error))
      }
    } finally {
      abortControllerRef.current = null
      setIsGenerating(false)
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
      <section className="flex h-[calc(100dvh-7rem)] min-h-[34rem] flex-col overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm md:h-[calc(100dvh-9rem)]">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lotus-600 text-white shadow-lg shadow-lotus-200/50">
              <Bot aria-hidden="true" size={23} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-bold text-slate-900">
                  Trợ lý AI
                </h2>
                <span className="hidden rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700 sm:inline">
                  OpenAI
                </span>
              </div>
              <p className="truncate text-xs text-slate-500 md:text-sm">
                Toán lớp 5 · Nhận xét · Thông báo phụ huynh
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={messages.length === 0 || isGenerating}
            onClick={() => setIsClearDialogOpen(true)}
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-pink-200 hover:bg-lotus-50 hover:text-lotus-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 aria-hidden="true" size={17} />
            <span className="hidden sm:inline">Cuộc trò chuyện mới</span>
          </button>
        </header>

        {!isConfigured ? (
          <div
            role="status"
            className="m-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 md:mx-6"
          >
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={19}
            />
            <div>
              <p className="font-bold">Chưa kết nối máy chủ AI</p>
              <p className="mt-1 leading-6">
                Giao diện đã sẵn sàng. Quản trị viên cần triển khai máy chủ bảo mật và thêm địa chỉ kết nối vào GitHub trước khi sử dụng.
              </p>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div
            role="alert"
            className="m-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 md:mx-6"
          >
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={19}
            />
            {errorMessage}
          </div>
        ) : null}

        <div
          className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-4 py-5 md:px-6"
          aria-live="polite"
          aria-label="Nội dung trò chuyện với Trợ lý AI"
        >
          {messages.length === 0 ? (
            <div className="mx-auto flex min-h-full max-w-4xl flex-col items-center justify-center py-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-3xl bg-lotus-50 text-lotus-700">
                <Sparkles aria-hidden="true" size={31} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Tôi có thể giúp gì cho lớp 5.15?
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Chọn một gợi ý hoặc tự nhập yêu cầu. Trợ lý chỉ biết nội dung bạn chủ động gửi trong cuộc trò chuyện này.
              </p>

              <div className="mt-6 grid w-full gap-3 md:grid-cols-3">
                {suggestions.map(
                  ({ title, description, prompt, icon: Icon }) => (
                    <button
                      key={title}
                      type="button"
                      disabled={!isConfigured}
                      onClick={() => applySuggestion(prompt)}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="flex size-10 items-center justify-center rounded-xl bg-lotus-50 text-lotus-700">
                        <Icon aria-hidden="true" size={20} />
                      </span>
                      <span className="mt-3 block font-bold text-slate-900">
                        {title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {description}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col gap-5">
              {messages.map((message) => {
                const isUserMessage = message.role === 'user'

                return (
                  <article
                    key={message.id}
                    className={`flex ${
                      isUserMessage ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex max-w-[92%] items-start gap-3 md:max-w-[82%] ${
                        isUserMessage ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                          isUserMessage
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-lotus-600 text-white'
                        }`}
                      >
                        {isUserMessage ? 'B' : <Bot size={18} />}
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${
                          isUserMessage
                            ? 'rounded-tr-md bg-lotus-600 text-white'
                            : 'rounded-tl-md border border-slate-200 bg-white text-slate-800'
                        }`}
                      >
                        {message.content ? (
                          isUserMessage ? (
                            <p className="whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          ) : (
                            <AiMessageContent content={message.content} />
                          )
                        ) : (
                          <span className="flex items-center gap-2 text-slate-500">
                            <LoaderCircle
                              aria-hidden="true"
                              className="animate-spin text-lotus-600"
                              size={17}
                            />
                            Đang suy nghĩ...
                          </span>
                        )}
                      </div>
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
          <div className="mx-auto flex max-w-4xl items-end gap-2 md:gap-3">
            <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 transition focus-within:border-lotus-400 focus-within:ring-4 focus-within:ring-pink-100">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleDraftKeyDown}
                disabled={!isConfigured || isGenerating}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={1}
                placeholder={
                  isConfigured
                    ? 'Nhập yêu cầu dành cho Trợ lý AI...'
                    : 'Chưa kết nối máy chủ AI'
                }
                aria-label="Yêu cầu dành cho Trợ lý AI"
                className="max-h-32 min-h-8 w-full resize-none bg-transparent text-sm leading-7 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-[11px] text-slate-400">
                  Không nhập số điện thoại, địa chỉ hoặc thông tin riêng tư của học sinh
                </p>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {draft.length}/{MAX_MESSAGE_LENGTH}
                </span>
              </div>
            </div>

            {isGenerating ? (
              <button
                type="button"
                onClick={stopGenerating}
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-600 shadow-sm transition hover:bg-red-50"
                aria-label="Dừng tạo câu trả lời"
              >
                <Square aria-hidden="true" size={18} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!draft.trim() || !isConfigured}
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-lotus-600 text-white shadow-lg shadow-lotus-200/50 transition hover:bg-lotus-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Gửi yêu cầu cho Trợ lý AI"
              >
                <Send aria-hidden="true" size={20} />
              </button>
            )}
          </div>

          <div className="mx-auto mt-2 flex max-w-4xl items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-slate-400">
            <ShieldCheck aria-hidden="true" className="shrink-0" size={13} />
            AI có thể mắc lỗi. Hãy kiểm tra lại nội dung trước khi sử dụng trong công việc.
          </div>
        </form>
      </section>

      <ConfirmDialog
        isOpen={isClearDialogOpen}
        title="Bắt đầu cuộc trò chuyện mới?"
        description="Toàn bộ nội dung đang hiển thị trong cuộc trò chuyện này sẽ được xóa khỏi màn hình."
        confirmLabel="Xóa cuộc trò chuyện"
        onClose={() => setIsClearDialogOpen(false)}
        onConfirm={clearConversation}
      />
    </main>
  )
}
