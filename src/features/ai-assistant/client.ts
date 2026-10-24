import type { User } from 'firebase/auth'

export type AiConversationRole = 'user' | 'assistant'

export type AiConversationMessage = {
  role: AiConversationRole
  content: string
}

type StreamAiResponseOptions = {
  user: User
  messages: AiConversationMessage[]
  signal: AbortSignal
  onDelta: (delta: string) => void
}

type OpenAiStreamEvent = {
  type?: string
  delta?: string
  error?: {
    message?: string
  }
  response?: {
    error?: {
      message?: string
    }
  }
}

const AI_API_URL = import.meta.env.VITE_AI_API_URL?.trim() ?? ''

export class AiAssistantError extends Error {
  readonly status: number

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'AiAssistantError'
    this.status = status
  }
}

export function isAiAssistantConfigured() {
  return AI_API_URL.length > 0
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: string
      message?: string
    }

    return payload.error || payload.message || ''
  } catch {
    return ''
  }
}

function defaultErrorMessage(status: number) {
  if (status === 401 || status === 403) {
    return 'Phiên đăng nhập không còn hợp lệ hoặc tài khoản chưa được phép sử dụng AI.'
  }

  if (status === 429) {
    return 'Bạn đang gửi yêu cầu quá nhanh. Vui lòng chờ một chút rồi thử lại.'
  }

  if (status >= 500) {
    return 'Máy chủ AI đang bận hoặc chưa được cấu hình đầy đủ. Vui lòng thử lại sau.'
  }

  return 'Không thể kết nối với Trợ lý AI. Vui lòng kiểm tra kết nối và thử lại.'
}

function eventErrorMessage(event: OpenAiStreamEvent) {
  return (
    event.error?.message ||
    event.response?.error?.message ||
    'OpenAI không thể hoàn thành câu trả lời này.'
  )
}

function parseEventBlock(
  block: string,
  onDelta: (delta: string) => void,
) {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')

  if (!data || data === '[DONE]') return

  let event: OpenAiStreamEvent

  try {
    event = JSON.parse(data) as OpenAiStreamEvent
  } catch {
    return
  }

  if (
    event.type === 'response.output_text.delta' &&
    typeof event.delta === 'string'
  ) {
    onDelta(event.delta)
    return
  }

  if (event.type === 'error' || event.type === 'response.failed') {
    throw new AiAssistantError(eventErrorMessage(event), 502)
  }
}

export async function streamAiResponse({
  user,
  messages,
  signal,
  onDelta,
}: StreamAiResponseOptions) {
  if (!AI_API_URL) {
    throw new AiAssistantError(
      'Website chưa được kết nối với máy chủ AI.',
      503,
    )
  }

  const idToken = await user.getIdToken()
  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
    signal,
  })

  if (!response.ok) {
    const serverMessage = await readErrorMessage(response)
    throw new AiAssistantError(
      serverMessage || defaultErrorMessage(response.status),
      response.status,
    )
  }

  if (!response.body) {
    throw new AiAssistantError(
      'Máy chủ AI không trả về nội dung.',
      502,
    )
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() ?? ''

    for (const block of blocks) {
      parseEventBlock(block, onDelta)
    }
  }

  buffer += decoder.decode()

  if (buffer.trim()) {
    parseEventBlock(buffer, onDelta)
  }
}
