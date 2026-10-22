import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  GraduationCap,
  Palette,
  School,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { useAuth } from '../auth/AuthProvider'
import { ThemeToggle } from '../components/theme/ThemeToggle'
import {
  CLASSROOM_CONFIG,
  CLASS_MEMBER_TITLES,
} from '../config/classroom'
import {
  subscribeToMembers,
  type ClassMemberListItem,
} from '../infrastructure/firestore'

export function SettingsPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState<ClassMemberListItem[]>([])
  const [membersError, setMembersError] = useState('')

  useEffect(
    () =>
      subscribeToMembers(
        setMembers,
        () =>
          setMembersError(
            'Không thể tải danh sách thành viên. Vui lòng thử lại.',
          ),
      ),
    [],
  )

  return (
    <main className="p-5 md:p-8">
      <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-lotus-600">CÀI ĐẶT</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Thiết lập lớp học
        </h2>
        <p className="mt-2 max-w-3xl leading-7 text-slate-600">
          Kiểm tra thông tin lớp, thành viên được cấp quyền và cách dữ liệu đang
          được lưu trữ.
        </p>
      </section>

      {membersError ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertTriangle className="mt-0.5 shrink-0" size={19} />
          {membersError}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
              <School size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Thông tin lớp</h3>
              <p className="text-sm text-slate-500">Thông tin đang sử dụng</p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Trường
              </dt>
              <dd className="mt-1 font-bold text-slate-900">
                {CLASSROOM_CONFIG.schoolName}
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Lớp
              </dt>
              <dd className="mt-1 font-bold text-slate-900">
                {CLASSROOM_CONFIG.className}
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Năm học
              </dt>
              <dd className="mt-1 font-bold text-slate-900">
                {CLASSROOM_CONFIG.schoolYear}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
              <Palette size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Giao diện</h3>
              <p className="text-sm text-slate-500">Sáng hoặc tối theo thiết bị này</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <ThemeToggle showLabel />
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Lựa chọn được ghi nhớ riêng trên trình duyệt, không ảnh hưởng đến
              người dùng còn lại.
            </p>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
            Giao diện tối đã được tối ưu độ tương phản cho bảng dữ liệu và nút thao tác.
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
              <Users size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Thành viên quản lý</h3>
              <p className="text-sm text-slate-500">
                {members.filter((member) => member.status === 'active').length} tài khoản đang hoạt động
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lotus-600 font-bold text-white">
                    {member.displayName.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {member.displayName}
                      {member.id === user?.uid ? ' (Bạn)' : ''}
                    </p>
                    <p className="text-xs text-slate-500">
                      {CLASS_MEMBER_TITLES[member.id] ?? 'Thành viên quản lý'}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    member.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {member.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-lotus-50 p-4 text-sm text-lotus-700">
            <ShieldCheck className="mt-0.5 shrink-0" size={19} />
            Bạn quản lý hệ thống và toàn bộ mã nguồn; Lê Bảo Anh là giáo viên
            chủ nhiệm. Hai tài khoản vẫn có quyền thao tác ngang nhau trong ứng dụng.
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
              <Database size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Dữ liệu và sao lưu</h3>
              <p className="text-sm text-slate-500">Firebase và tệp Excel</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <GraduationCap className="mt-0.5 shrink-0 text-lotus-600" size={20} />
              <div>
                <p className="font-semibold text-slate-900">Dữ liệu học sinh</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Được lưu trên Firebase và đồng bộ theo thời gian thực cho cả hai thành viên.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <FileSpreadsheet className="mt-0.5 shrink-0 text-lotus-600" size={20} />
              <div>
                <p className="font-semibold text-slate-900">Nhập và xuất Excel</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Dùng trang Học sinh để sao lưu danh sách hoặc nhập hàng loạt từ tệp .xlsx.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <Database className="mt-0.5 shrink-0 text-lotus-600" size={20} />
              <div>
                <p className="font-semibold text-slate-900">Lịch sử điểm danh</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Lượt vắng được giữ 30 ngày; số phút đi muộn không được lưu lên Firebase.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
