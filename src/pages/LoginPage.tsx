import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  GraduationCap,
  LoaderCircle,
  LogIn,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../auth/AuthProvider';
import { CLASSROOM_CONFIG } from '../config/classroom';

export function LoginPage() {
  const { signInWithGoogle } = useAuth();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSignIn() {
    setErrorMessage('');
    setIsSigningIn(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        error.code === 'auth/popup-closed-by-user'
      ) {
        return;
      }

      setErrorMessage(
        'Không thể đăng nhập. Vui lòng kiểm tra kết nối và thử lại.',
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-lotus-50 via-white to-pink-50 px-5 py-10">
      <div
        aria-hidden="true"
        className="absolute -left-20 -top-20 size-72 rounded-full bg-lotus-200/50 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-24 -right-20 size-80 rounded-full bg-lotus-100/70 blur-3xl"
      />

      <section className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-7 shadow-2xl shadow-lotus-200/50 backdrop-blur sm:p-9">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-lotus-600 text-white shadow-lg shadow-lotus-200">
          <GraduationCap aria-hidden="true" size={34} />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lotus-600">
            {CLASSROOM_CONFIG.schoolName}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Quản lý lớp {CLASSROOM_CONFIG.className}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Năm học {CLASSROOM_CONFIG.schoolYear}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-lotus-100 bg-lotus-50/70 p-4">
          <div className="flex gap-3">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-lotus-600"
              size={21}
            />

            <p className="text-sm leading-6 text-slate-600">
              Dữ liệu lớp học được bảo vệ. Chỉ những thành viên
              được phê duyệt mới có quyền truy cập.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isSigningIn}
          onClick={handleSignIn}
          className="mt-7 flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-lotus-600 px-5 py-3 font-semibold text-white shadow-lg shadow-lotus-200 transition hover:bg-lotus-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lotus-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSigningIn ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={20}
              />
              Đang đăng nhập...
            </>
          ) : (
            <>
              <LogIn aria-hidden="true" size={20} />
              Tiếp tục với Google
            </>
          )}
        </button>

        {errorMessage && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700"
          >
            {errorMessage}
          </p>
        )}

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Hệ thống nội bộ dành cho giáo viên quản lý lớp học.
        </p>
      </section>
    </main>
  );
}