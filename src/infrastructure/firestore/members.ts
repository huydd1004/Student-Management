import {
  collection,
  onSnapshot,
} from 'firebase/firestore'

import { CLASSROOM_ID } from '../../config/classroom'
import type { ClassMemberDocument, WithId } from '../../domain'
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
