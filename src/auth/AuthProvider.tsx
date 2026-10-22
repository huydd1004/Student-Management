import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
} from 'firebase/firestore';

import { CLASSROOM_ID } from '../config/classroom';
import {
  auth,
  db,
  googleProvider,
} from '../infrastructure/firebase';
import { firestorePaths } from '../infrastructure/firestore';

export type AccessStatus =
  | 'checking'
  | 'signed-out'
  | 'authorized'
  | 'unauthorized'
  | 'error';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  accessStatus: AccessStatus;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [accessStatus, setAccessStatus] =
    useState<AccessStatus>('checking');

  const isLoading = accessStatus === 'checking';

  useEffect(() => {
    let isCancelled = false;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (isCancelled) {
          return;
        }

        setUser(currentUser);

        if (!currentUser) {
          setAccessStatus('signed-out');
          return;
        }

        setAccessStatus('checking');

        try {
          const memberPath = firestorePaths.member(
            CLASSROOM_ID,
            currentUser.uid,
          );

          const memberSnapshot = await getDoc(
            doc(db, memberPath),
          );

          if (isCancelled) {
            return;
          }

          if (!memberSnapshot.exists()) {
            setAccessStatus('unauthorized');
            return;
          }

          const member = memberSnapshot.data();

          const isActiveAdmin =
            member.role === 'admin' &&
            member.status === 'active';

          setAccessStatus(
            isActiveAdmin
              ? 'authorized'
              : 'unauthorized',
          );
        } catch {
          if (!isCancelled) {
            setAccessStatus('error');
          }
        }
      },
    );

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        accessStatus,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth phải được sử dụng bên trong AuthProvider.',
    );
  }

  return context;
}