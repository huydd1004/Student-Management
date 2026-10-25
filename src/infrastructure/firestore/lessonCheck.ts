import {
  collection,
  deleteField,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

import { CLASSROOM_ID } from '../../config/classroom'
import type {
  LessonCheckCallDocument,
  LessonCheckOutcome,
  WithId,
} from '../../domain'
import { db } from '../firebase'
import { firestorePaths } from './paths'

export interface CreateLessonCheckCallInput {
  studentId: string
  studentName: string
  subjectId: string
  subjectName: string
  actorId: string
}

export type LessonCheckCallListItem =
  WithId<LessonCheckCallDocument>

export async function createLessonCheckCall(
  input: CreateLessonCheckCallInput,
) {
  const callReference = doc(
    collection(
      db,
      firestorePaths.lessonCheckCalls(CLASSROOM_ID),
    ),
  )

  await setDoc(callReference, {
    studentId: input.studentId,
    studentName: input.studentName,
    subjectId: input.subjectId,
    subjectName: input.subjectName,
    cycleNumber: 1,
    calledAt: serverTimestamp(),
    calledBy: input.actorId,
    outcome: 'not_recorded',
    createdAt: serverTimestamp(),
    createdBy: input.actorId,
    updatedAt: serverTimestamp(),
    updatedBy: input.actorId,
  })

  return callReference.id
}

export async function updateLessonCheckCall(
  callId: string,
  outcome: LessonCheckOutcome,
  notes: string,
  actorId: string,
) {
  await updateDoc(
    doc(
      db,
      `${firestorePaths.lessonCheckCalls(CLASSROOM_ID)}/${callId}`,
    ),
    {
      outcome,
      notes: notes.trim() || deleteField(),
      updatedAt: serverTimestamp(),
      updatedBy: actorId,
    },
  )
}

export function subscribeToLessonCheckCalls(
  onCallsChange: (calls: LessonCheckCallListItem[]) => void,
  onError: (error: Error) => void,
) {
  const callsQuery = query(
    collection(
      db,
      firestorePaths.lessonCheckCalls(CLASSROOM_ID),
    ),
    orderBy('calledAt', 'desc'),
    limit(20),
  )

  return onSnapshot(
    callsQuery,
    (snapshot) => {
      onCallsChange(
        snapshot.docs.map((callSnapshot) => ({
          ...(callSnapshot.data() as LessonCheckCallDocument),
          id: callSnapshot.id,
        })),
      )
    },
    onError,
  )
}
