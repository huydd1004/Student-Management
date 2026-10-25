import type { AuditFields, EntityId, LocalDate } from './common';
import type { AttendancePeriod } from './classroom';

export type AttendanceSessionStatus = 'open' | 'completed';

export type AttendanceStatus =
  | 'present'
  | 'absent_excused'
  | 'absent_unexcused'
  | 'late';

export type AttendanceIncidentStatus =
  | 'absent_excused'
  | 'absent_unexcused';

export interface AttendanceSessionDocument extends AuditFields {
  attendanceDate: LocalDate;
  period: AttendancePeriod;
  status: AttendanceSessionStatus;
  completedAt?: AuditFields['updatedAt'];
  completedBy?: EntityId;
}

export interface AttendanceRecordDocument extends AuditFields {
  studentId: EntityId;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceIncidentDocument extends AuditFields {
  studentId: EntityId;
  studentName: string;
  attendanceDate: LocalDate;
  period: AttendancePeriod;
  status: AttendanceIncidentStatus;
  absenceReason?: string;
  expiresAt: AuditFields['updatedAt'];
}
