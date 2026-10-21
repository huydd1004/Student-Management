import type { AuditFields, EntityId, LocalDate } from './common';
import type { AttendancePeriod } from './classroom';

export type AttendanceSessionStatus = 'open' | 'completed';

export type AttendanceStatus =
  | 'present'
  | 'absent_excused'
  | 'absent_unexcused'
  | 'late';

export interface AttendanceSessionDocument extends AuditFields {
  attendanceDate: LocalDate;
  period: AttendancePeriod;
  status: AttendanceSessionStatus;
  notes?: string;
  completedAt?: AuditFields['updatedAt'];
  completedBy?: EntityId;
}

export interface AttendanceRecordDocument extends AuditFields {
  studentId: EntityId;
  status: AttendanceStatus;
  notes?: string;
}
