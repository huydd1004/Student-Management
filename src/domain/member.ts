import type { AuditFields } from './common';

/** Hai người dùng ban đầu đều là admin và có quyền ngang nhau. */
export type ClassMemberRole = 'admin';
export type ClassMemberStatus = 'active' | 'disabled';

export interface ClassMemberDocument extends AuditFields {
  displayName: string;
  email: string;
  role: ClassMemberRole;
  status: ClassMemberStatus;
}
