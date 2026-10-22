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
import type { ChatMessageDocument, WithId } from '../../domain'
import { db } from '../firebase'
import { firestorePaths } from './paths'

const CHAT_HISTORY_LIMIT = 100

export type ChatMessageListItem = WithId<ChatMessageDocument>

export async function sendChatMessage(
  text: string,
  senderId: string,
) {
  const normalizedText = text.trim()

  if (!normalizedText || normalizedText.length > 2_000) {
    throw new Error('INVALID_MESSAGE')
  }

  const memberSnapshot = await getDoc(
    doc(
      db,
      firestorePaths.member(CLASSROOM_ID, senderId),
    ),
  )
  const senderName = memberSnapshot.data()?.displayName

  if (!memberSnapshot.exists() || typeof senderName !== 'string') {
    throw new Error('MEMBER_NOT_FOUND')
  }

  const messageReference = doc(
    collection(
      db,
      firestorePaths.chatMessages(CLASSROOM_ID),
    ),
  )

  await setDoc(messageReference, {
    text: normalizedText,
    senderId,
    senderName,
    createdAt: serverTimestamp(),
  })
}

export function subscribeToChatMessages(
  onMessagesChange: (messages: ChatMessageListItem[]) => void,
  onError: (error: Error) => void,
) {
  const messagesQuery = query(
    collection(
      db,
      firestorePaths.chatMessages(CLASSROOM_ID),
    ),
    orderBy('createdAt', 'desc'),
    limit(CHAT_HISTORY_LIMIT),
  )

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs
        .map((messageSnapshot) => ({
          ...(
            messageSnapshot.data({
              serverTimestamps: 'estimate',
            }) as ChatMessageDocument
          ),
          id: messageSnapshot.id,
        }))
        .reverse()

      onMessagesChange(messages)
    },
    onError,
  )
}
