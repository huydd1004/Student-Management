import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

import { CLASSROOM_ID } from '../../config/classroom'
import type {
  CalendarEventCategory,
  CalendarEventDocument,
  LocalDate,
  WithId,
} from '../../domain'
import { db } from '../firebase'
import { firestorePaths } from './paths'

export interface CalendarEventInput {
  title: string
  eventDate: LocalDate
  isAllDay: boolean
  startTime?: string
  endTime?: string
  category: CalendarEventCategory
  notes?: string
  reminderMinutes?: number
}

export type CalendarEventListItem = WithId<CalendarEventDocument>

function normalizeCalendarEvent(input: CalendarEventInput) {
  return {
    title: input.title.trim(),
    eventDate: input.eventDate,
    isAllDay: input.isAllDay,
    category: input.category,
    ...(input.isAllDay || !input.startTime
      ? {}
      : { startTime: input.startTime }),
    ...(input.isAllDay || !input.endTime
      ? {}
      : { endTime: input.endTime }),
    ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
    ...(input.reminderMinutes === undefined
      ? {}
      : { reminderMinutes: input.reminderMinutes }),
  }
}

export async function createCalendarEvent(
  input: CalendarEventInput,
  actorId: string,
) {
  const eventReference = doc(
    collection(db, firestorePaths.calendarEvents(CLASSROOM_ID)),
  )

  await setDoc(eventReference, {
    ...normalizeCalendarEvent(input),
    createdAt: serverTimestamp(),
    createdBy: actorId,
    updatedAt: serverTimestamp(),
    updatedBy: actorId,
  })

  return eventReference.id
}

export async function updateCalendarEvent(
  eventId: string,
  input: CalendarEventInput,
  actorId: string,
) {
  const normalizedEvent = normalizeCalendarEvent(input)

  await updateDoc(
    doc(db, firestorePaths.calendarEvent(CLASSROOM_ID, eventId)),
    {
      ...normalizedEvent,
      startTime:
        'startTime' in normalizedEvent
          ? normalizedEvent.startTime
          : deleteField(),
      endTime:
        'endTime' in normalizedEvent
          ? normalizedEvent.endTime
          : deleteField(),
      notes:
        'notes' in normalizedEvent
          ? normalizedEvent.notes
          : deleteField(),
      reminderMinutes:
        'reminderMinutes' in normalizedEvent
          ? normalizedEvent.reminderMinutes
          : deleteField(),
      updatedAt: serverTimestamp(),
      updatedBy: actorId,
    },
  )
}

export async function deleteCalendarEvent(eventId: string) {
  await deleteDoc(
    doc(db, firestorePaths.calendarEvent(CLASSROOM_ID, eventId)),
  )
}

export function subscribeToCalendarEvents(
  onEventsChange: (events: CalendarEventListItem[]) => void,
  onError: (error: Error) => void,
) {
  const eventsQuery = query(
    collection(db, firestorePaths.calendarEvents(CLASSROOM_ID)),
    orderBy('eventDate', 'asc'),
  )

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const events = snapshot.docs.map((eventSnapshot) => ({
        ...(eventSnapshot.data({
          serverTimestamps: 'estimate',
        }) as CalendarEventDocument),
        id: eventSnapshot.id,
      }))

      onEventsChange(events)
    },
    onError,
  )
}
