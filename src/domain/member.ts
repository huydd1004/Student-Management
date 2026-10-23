import type { AuditFields, TimestampValue } from './common';

/**
 * Đây là quyền truy cập ứng dụng, không phải chức danh công việc.
 * Hai thành viên đều có quyền thao tác ngang nhau.
 */
export type ClassMemberRole = 'admin';
export type ClassMemberStatus = 'active' | 'disabled';

export interface ClassMemberDocument extends AuditFields {
  displayName: string;
  email: string;
  role: ClassMemberRole;
  status: ClassMemberStatus;
  /** Mốc đọc tin nhắn mới nhất, dùng để đồng bộ huy hiệu chưa đọc. */
  chatLastReadAt?: TimestampValue;
}
