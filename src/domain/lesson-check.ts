import type { AuditFields, EntityId, TimestampValue } from './common';

export type LessonCheckOutcome =
  | 'not_recorded'
  | 'completed'
  | 'needs_support'
  | 'skipped';

export interface LessonCheckCallDocument extends AuditFields {
  studentId: EntityId;
  studentName: string;
  subjectId: EntityId;
  subjectName: string;
  attendanceSessionId?: EntityId;
  cycleNumber: number;
  calledAt: TimestampValue;
  calledBy: EntityId;
  outcome: LessonCheckOutcome;
  notes?: string;
}
