import {
  AlertTriangle,
  LogOut,
  ShieldX,
} from 'lucide-react';

import {
  useAuth,
  type AccessStatus,
} from '../auth/AuthProvider';
import { ThemeToggle } from '../components/theme/ThemeToggle';

interface AccessDeniedPageProps {
  status: Extract<
    AccessStatus,
    'unauthorized' | 'error'
  >;
}

export function AccessDeniedPage({
  status,
}: AccessDeniedPageProps) {
  const { user, signOut } = useAuth();

  const hasConnectionError = status === 'error';

  return (
    <main className="theme-auth-background relative grid min-h-screen place-items-center bg-gradient-to-br from-lotus-50 via-white to-pink-50 px-5 py-10">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-md rounded-3xl border border-white bg-white p-8 text-center shadow-2xl shadow-lotus-200/50">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-lotus-100 text-lotus-700">
          {hasConnectionError ? (
            <AlertTriangle aria-hidden="true" size={32} />
          ) : (
            <ShieldX aria-hidden="true" size={32} />
          )}
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          {hasConnectionError
            ? 'Không thể kiểm tra quyền truy cập'
            : 'Tài khoản chưa được cấp quyền'}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {hasConnectionError
            ? 'Không thể kết nối với dữ liệu lớp học. Vui lòng kiểm tra lại cấu hình Firebase.'
            : 'Tài khoản này chưa có trong danh sách thành viên của lớp 5.15.'}
        </p>

        {user?.email && (
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            {user.email}
          </p>
        )}

        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-lotus-200 bg-white px-5 py-3 font-semibold text-lotus-700 transition hover:bg-lotus-50"
        >
          <LogOut aria-hidden="true" size={19} />
          Đăng xuất
        </button>
      </section>
    </main>
  );
}
