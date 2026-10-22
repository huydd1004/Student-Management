import type { EntityId, TimestampValue } from './common'

/** Tin nhắn nội bộ là bản ghi bất biến: không sửa hoặc xóa sau khi gửi. */
export interface ChatMessageDocument {
  text: string
  senderId: EntityId
  senderName: string
  createdAt: TimestampValue
}
