import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

import { CLASSROOM_ID } from '../../config/classroom'
import type {
  MathExerciseSetDocument,
  WithId,
} from '../../domain'
import type { MathExerciseSetDraft } from '../../features/math-exercises/generator'
import { db } from '../firebase'
import { firestorePaths } from './paths'

const MATH_EXERCISE_HISTORY_LIMIT = 50

export type MathExerciseSetListItem =
  WithId<MathExerciseSetDocument>

export async function createMathExerciseSet(
  exerciseSet: MathExerciseSetDraft,
  actorId: string,
) {
  const memberSnapshot = await getDoc(
    doc(db, firestorePaths.member(CLASSROOM_ID, actorId)),
  )
  const createdByName = memberSnapshot.data()?.displayName

  if (!memberSnapshot.exists() || typeof createdByName !== 'string') {
    throw new Error('MEMBER_NOT_FOUND')
  }

  const exerciseSetReference = doc(
    collection(
      db,
      firestorePaths.mathExerciseSets(CLASSROOM_ID),
    ),
  )

  await setDoc(exerciseSetReference, {
    ...exerciseSet,
    createdAt: serverTimestamp(),
    createdBy: actorId,
    createdByName,
  })

  return exerciseSetReference.id
}

export function subscribeToMathExerciseSets(
  onExerciseSetsChange: (
    exerciseSets: MathExerciseSetListItem[],
  ) => void,
  onError: (error: Error) => void,
) {
  const exerciseSetsQuery = query(
    collection(
      db,
      firestorePaths.mathExerciseSets(CLASSROOM_ID),
    ),
    orderBy('createdAt', 'desc'),
    limit(MATH_EXERCISE_HISTORY_LIMIT),
  )

  return onSnapshot(
    exerciseSetsQuery,
    (snapshot) => {
      onExerciseSetsChange(
        snapshot.docs.map((exerciseSetSnapshot) => ({
          ...(
            exerciseSetSnapshot.data({
              serverTimestamps: 'estimate',
            }) as MathExerciseSetDocument
          ),
          id: exerciseSetSnapshot.id,
        })),
      )
    },
    onError,
  )
}
