import type { EntityId, TimestampValue } from './common';

export type ActivityAction =
  | 'student_created'
  | 'student_updated'
  | 'attendance_started'
  | 'attendance_updated'
  | 'attendance_completed'
  | 'lesson_check_called'
  | 'lesson_check_updated'
  | 'settings_updated';

export interface ActivityLogDocument {
  action: ActivityAction;
  actorId: EntityId;
  targetId?: EntityId;
  targetType?: 'student' | 'attendance_session' | 'lesson_check' | 'classroom';
  summary: string;
  occurredAt: TimestampValue;
}
