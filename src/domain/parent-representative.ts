import type { AuditFields } from './common'

/** Thành viên ban đại diện cha mẹ học sinh của lớp. */
export interface ParentRepresentativeDocument extends AuditFields {
  fullName: string
  address: string
  phoneNumber: string
  position: string
}
