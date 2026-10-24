const DEFAULT_MODEL = 'gpt-6-luna'
const MAX_MESSAGES = 12
const MAX_MESSAGE_LENGTH = 4_000
const MAX_TOTAL_LENGTH = 16_000
const DEFAULT_REQUESTS_PER_MINUTE = 12

const SYSTEM_INSTRUCTIONS = `Bạn là Trợ lý AI nội bộ của Trường Tiểu học An Bình, lớp 5.15, năm học 2026-2027.

Phạm vi hỗ trợ ban đầu:
- Tạo và giải thích bài tập Toán lớp 5 theo chương trình giáo dục Việt Nam.
- Soạn nhận xét học sinh theo hướng tích cực, cụ thể, tôn trọng và có đề xuất hỗ trợ.
- Soạn thông báo ngắn gọn, lịch sự dành cho phụ huynh.
- Gợi ý hoạt động học tập, trò chơi và cách tổ chức lớp học phù hợp học sinh tiểu học.

Nguyên tắc trả lời:
- Luôn trả lời bằng tiếng Việt rõ ràng, có cấu trúc và dễ áp dụng.
- Với bài Toán, trình bày từng bước, kiểm tra lại phép tính và tách rõ đề bài với lời giải dành cho giáo viên.
- Không khẳng định rằng bạn đã đọc Firebase, hồ sơ lớp hoặc dữ liệu học sinh. Bạn chỉ biết nội dung người dùng gửi trong cuộc trò chuyện.
- Không yêu cầu số điện thoại, địa chỉ, email, hoàn cảnh gia đình hoặc thông tin nhận dạng không cần thiết của học sinh.
- Nếu người dùng vô tình gửi dữ liệu riêng tư, không lặp lại dữ liệu đó khi không cần thiết và nhắc họ ẩn thông tin nhận dạng ở lần sau.
- Không chẩn đoán y tế, tâm lý hoặc gán nhãn học sinh. Khi nội dung cần đánh giá chuyên môn, nêu rõ giới hạn và khuyến nghị trao đổi với người có chuyên môn.
- Không tự bịa dữ kiện về học sinh, nhà trường hoặc chương trình học. Nếu thiếu thông tin quan trọng, hãy hỏi lại ngắn gọn.
- Câu trả lời nên vừa đủ chi tiết; ưu tiên mẫu có thể sao chép và sử dụng ngay.`

const rateLimitBuckets = new Map()

function splitCsv(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin')

  if (!origin) return {}

  const allowedOrigins = splitCsv(env.ALLOWED_ORIGINS)

  if (!allowedOrigins.includes(origin)) return null

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function jsonResponse(request, env, payload, status = 200) {
  const cors = corsHeaders(request, env) ?? {}

  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...cors,
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function getBearerToken(request) {
  const authorization = request.headers.get('Authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? ''
}

async function verifyFirebaseUser(idToken, env) {
  if (!env.FIREBASE_WEB_API_KEY) {
    throw new Error('FIREBASE_WEB_API_KEY is not configured')
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_WEB_API_KEY)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    },
  )

  if (!response.ok) return null

  const payload = await response.json()
  const firebaseUser = payload.users?.[0]

  if (!firebaseUser?.localId) return null

  return {
    uid: firebaseUser.localId,
    emailVerified: firebaseUser.emailVerified === true,
  }
}

function isAllowedUser(uid, env) {
  return splitCsv(env.ALLOWED_FIREBASE_UIDS).includes(uid)
}

function validateMessages(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return { error: 'Cuộc trò chuyện không có nội dung.' }
  }

  if (value.length > MAX_MESSAGES) {
    return {
      error: `Chỉ gửi tối đa ${MAX_MESSAGES} tin nhắn gần nhất trong mỗi yêu cầu.`,
    }
  }

  const messages = []
  let totalLength = 0

  for (const item of value) {
    const role = item?.role
    const content = typeof item?.content === 'string'
      ? item.content.trim()
      : ''

    if (
      (role !== 'user' && role !== 'assistant') ||
      !content ||
      content.length > MAX_MESSAGE_LENGTH
    ) {
      return { error: 'Nội dung cuộc trò chuyện không hợp lệ.' }
    }

    totalLength += content.length
    messages.push({ role, content })
  }

  if (totalLength > MAX_TOTAL_LENGTH) {
    return { error: 'Cuộc trò chuyện quá dài. Hãy bắt đầu cuộc trò chuyện mới.' }
  }

  if (messages.at(-1)?.role !== 'user') {
    return { error: 'Tin nhắn cuối cùng phải là yêu cầu của người dùng.' }
  }

  return { messages }
}

function isRateLimited(uid, env) {
  const now = Date.now()
  const windowMs = 60_000
  const configuredLimit = Number(env.MAX_REQUESTS_PER_MINUTE)
  const limit = Number.isFinite(configuredLimit) && configuredLimit > 0
    ? Math.floor(configuredLimit)
    : DEFAULT_REQUESTS_PER_MINUTE
  const previous = rateLimitBuckets.get(uid)

  if (!previous || now - previous.startedAt >= windowMs) {
    rateLimitBuckets.set(uid, { startedAt: now, count: 1 })
    return false
  }

  previous.count += 1
  return previous.count > limit
}

async function safetyIdentifier(uid) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(uid),
  )
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')

  return `class515-${hex.slice(0, 32)}`
}

async function callOpenAi(messages, uid, env) {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  return fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || DEFAULT_MODEL,
      instructions: SYSTEM_INSTRUCTIONS,
      input: messages,
      reasoning: { effort: 'low' },
      max_output_tokens: 1_200,
      safety_identifier: await safetyIdentifier(uid),
      store: false,
      stream: true,
    }),
  })
}

async function handleChat(request, env) {
  const token = getBearerToken(request)

  if (!token) {
    return jsonResponse(
      request,
      env,
      { error: 'Bạn cần đăng nhập để sử dụng Trợ lý AI.' },
      401,
    )
  }

  let firebaseUser

  try {
    firebaseUser = await verifyFirebaseUser(token, env)
  } catch (error) {
    console.error('Firebase verification configuration error', error)
    return jsonResponse(
      request,
      env,
      { error: 'Máy chủ xác thực chưa được cấu hình đầy đủ.' },
      503,
    )
  }

  if (!firebaseUser || !firebaseUser.emailVerified) {
    return jsonResponse(
      request,
      env,
      { error: 'Phiên đăng nhập không hợp lệ.' },
      401,
    )
  }

  if (!isAllowedUser(firebaseUser.uid, env)) {
    return jsonResponse(
      request,
      env,
      { error: 'Tài khoản này chưa được phép sử dụng Trợ lý AI.' },
      403,
    )
  }

  if (isRateLimited(firebaseUser.uid, env)) {
    return jsonResponse(
      request,
      env,
      { error: 'Bạn đang gửi yêu cầu quá nhanh. Vui lòng thử lại sau một phút.' },
      429,
    )
  }

  let body

  try {
    body = await request.json()
  } catch {
    return jsonResponse(
      request,
      env,
      { error: 'Dữ liệu gửi lên không hợp lệ.' },
      400,
    )
  }

  const validation = validateMessages(body?.messages)

  if (validation.error) {
    return jsonResponse(
      request,
      env,
      { error: validation.error },
      400,
    )
  }

  let openAiResponse

  try {
    openAiResponse = await callOpenAi(
      validation.messages,
      firebaseUser.uid,
      env,
    )
  } catch (error) {
    console.error('OpenAI request configuration error', error)
    return jsonResponse(
      request,
      env,
      { error: 'Máy chủ OpenAI chưa được cấu hình đầy đủ.' },
      503,
    )
  }

  if (!openAiResponse.ok || !openAiResponse.body) {
    const diagnostic = await openAiResponse.text()
    console.error('OpenAI request failed', openAiResponse.status, diagnostic)

    const status = openAiResponse.status === 429 ? 429 : 502
    const error = status === 429
      ? 'Đã đạt giới hạn sử dụng OpenAI. Vui lòng thử lại sau.'
      : 'OpenAI chưa thể trả lời lúc này. Vui lòng thử lại.'

    return jsonResponse(request, env, { error }, status)
  }

  const cors = corsHeaders(request, env) ?? {}

  return new Response(openAiResponse.body, {
    status: 200,
    headers: {
      ...cors,
      'Cache-Control': 'no-store',
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env)

    if (cors === null) {
      return jsonResponse(
        request,
        env,
        { error: 'Nguồn truy cập không được phép.' },
        403,
      )
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: cors,
      })
    }

    const url = new URL(request.url)

    if (request.method !== 'POST' || url.pathname !== '/api/ai/chat') {
      return jsonResponse(
        request,
        env,
        { error: 'Không tìm thấy đường dẫn yêu cầu.' },
        404,
      )
    }

    return handleChat(request, env)
  },
}
