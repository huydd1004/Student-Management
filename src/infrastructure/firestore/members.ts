import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

import { CLASSROOM_ID } from '../../config/classroom'
import type {
  ClassMemberDocument,
  TimestampValue,
  WithId,
} from '../../domain'
import { db } from '../firebase'
import { firestorePaths } from './paths'

export type ClassMemberListItem = WithId<ClassMemberDocument>

export function subscribeToMembers(
  onMembersChange: (members: ClassMemberListItem[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, firestorePaths.members(CLASSROOM_ID)),
    (snapshot) => {
      const members = snapshot.docs
        .map((memberSnapshot) => ({
          ...(memberSnapshot.data() as ClassMemberDocument),
          id: memberSnapshot.id,
        }))
        .sort((first, second) =>
          first.displayName.localeCompare(
            second.displayName,
            'vi',
          ),
        )

      onMembersChange(members)
    },
    onError,
  )
}

export function subscribeToMemberChatReadAt(
  memberId: string,
  onReadAtChange: (readAt: TimestampValue | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, firestorePaths.member(CLASSROOM_ID, memberId)),
    (snapshot) => {
      const member = snapshot.data({
        serverTimestamps: 'estimate',
      }) as ClassMemberDocument | undefined

      onReadAtChange(member?.chatLastReadAt ?? null)
    },
    onError,
  )
}

export async function markChatMessagesAsRead(memberId: string) {
  await updateDoc(
    doc(db, firestorePaths.member(CLASSROOM_ID, memberId)),
    {
      chatLastReadAt: serverTimestamp(),
    },
  )
}
