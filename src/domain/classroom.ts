import type { AuditFields, LocalDate } from './common';

export type ClassroomStatus = 'active' | 'archived';
export type AttendancePeriod = 'morning' | 'afternoon';

export interface ClassroomDocument extends AuditFields {
  schoolName: string;
  className: string;
  grade: 5;
  schoolYear: string;
  timezone: 'Asia/Ho_Chi_Minh';
  locale: 'vi-VN';
  attendancePeriods: AttendancePeriod[];
  status: ClassroomStatus;
  startedOn?: LocalDate;
  endedOn?: LocalDate;
}
