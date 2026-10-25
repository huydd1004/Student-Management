import type { AuditFields, EntityId, LocalDate } from './common'

export type CalendarEventCategory =
  | 'teaching'
  | 'meeting'
  | 'assessment'
  | 'personal'
  | 'other'

export interface CalendarEventDocument extends AuditFields {
  title: string
  eventDate: LocalDate
  isAllDay: boolean
  startTime?: string
  endTime?: string
  category: CalendarEventCategory
  notes?: string
  reminderMinutes?: number
  createdBy: EntityId
  updatedBy: EntityId
}
