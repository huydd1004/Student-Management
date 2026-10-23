import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

import { CLASSROOM_ID } from '../../config/classroom'
import type {
  ParentRepresentativeDocument,
  WithId,
} from '../../domain'
import { db } from '../firebase'
import { compareVietnameseNames } from '../../utils/vietnameseName'
import { firestorePaths } from './paths'

export interface ParentRepresentativeInput {
  fullName: string
  address: string
  phoneNumber: string
  position: string
}

export type ParentRepresentativeListItem = WithId<
  ParentRepresentativeDocument
>

function normalizeRepresentativeInput(
  input: ParentRepresentativeInput,
) {
  return {
    fullName: input.fullName.trim(),
    address: input.address.trim(),
    phoneNumber: input.phoneNumber.trim(),
    position: input.position.trim(),
  }
}

export async function createParentRepresentative(
  input: ParentRepresentativeInput,
  actorId: string,
) {
  const representativeReference = doc(
    collection(
      db,
      firestorePaths.parentRepresentatives(CLASSROOM_ID),
    ),
  )

  await setDoc(representativeReference, {
    ...normalizeRepresentativeInput(input),
    createdAt: serverTimestamp(),
    createdBy: actorId,
    updatedAt: serverTimestamp(),
    updatedBy: actorId,
  })

  return representativeReference.id
}

export async function updateParentRepresentative(
  representativeId: string,
  input: ParentRepresentativeInput,
  actorId: string,
) {
  await updateDoc(
    doc(
      db,
      firestorePaths.parentRepresentative(
        CLASSROOM_ID,
        representativeId,
      ),
    ),
    {
      ...normalizeRepresentativeInput(input),
      updatedAt: serverTimestamp(),
      updatedBy: actorId,
    },
  )
}

export async function deleteParentRepresentative(
  representativeId: string,
) {
  await deleteDoc(
    doc(
      db,
      firestorePaths.parentRepresentative(
        CLASSROOM_ID,
        representativeId,
      ),
    ),
  )
}

export function subscribeToParentRepresentatives(
  onRepresentativesChange: (
    representatives: ParentRepresentativeListItem[],
  ) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(
      db,
      firestorePaths.parentRepresentatives(CLASSROOM_ID),
    ),
    (snapshot) => {
      const representatives = snapshot.docs
        .map((representativeSnapshot) => ({
          ...(
            representativeSnapshot.data() as ParentRepresentativeDocument
          ),
          id: representativeSnapshot.id,
        }))
        .sort((first, second) =>
          compareVietnameseNames(first.fullName, second.fullName),
        )

      onRepresentativesChange(representatives)
    },
    onError,
  )
}
