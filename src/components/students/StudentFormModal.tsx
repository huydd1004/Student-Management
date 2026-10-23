import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { DateInput } from '../ui/DateInput'

export type StudentFormValues = {
  studentCode: string
  fullName: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other' | 'unspecified'
  ethnicity: string
  group: string
  academicPerformance: '' | 'weak' | 'average' | 'good' | 'excellent'
  classDuty: string
  permanentAddress: string
  difficultCircumstances: string
  joinedOn: string
  status: 'active' | 'transferred' | 'inactive'
  guardianName: string
  guardianRelationship: string
  guardianPhone: string
  secondaryGuardianName: string
  secondaryGuardianRelationship: string
  secondaryGuardianPhone: string
  notes: string
}

type StudentFormModalProps = {
  isOpen: boolean
  mode?: 'create' | 'edit'
  initialValues?: Partial<StudentFormValues>
  isSubmitting?: boolean
  errorMessage?: string
  onClose: () => void
  onSubmit: (
    values: StudentFormValues,
  ) => void | Promise<void>
}

const inputClassName =
  'mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lotus-400 focus:ring-4 focus:ring-pink-100'

export function StudentFormModal({
  isOpen,
  mode = 'create',
  initialValues = {},
  isSubmitting = false,
  errorMessage = '',
  onClose,
  onSubmit,
}: StudentFormModalProps) {
  const isEditing = mode === 'edit'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    function readValue(name: string) {
      return String(formData.get(name) ?? '').trim()
    }

    onSubmit({
      studentCode: readValue('studentCode'),
      fullName: readValue('fullName'),
      dateOfBirth: readValue('dateOfBirth'),
      gender: readValue('gender') as StudentFormValues['gender'],
      ethnicity: readValue('ethnicity'),
      group: readValue('group'),
      academicPerformance: readValue(
        'academicPerformance',
      ) as StudentFormValues['academicPerformance'],
      classDuty: readValue('classDuty'),
      permanentAddress: readValue('permanentAddress'),
      difficultCircumstances: readValue('difficultCircumstances'),
      joinedOn: readValue('joinedOn'),
      status: readValue('status') as StudentFormValues['status'],
      guardianName: readValue('guardianName'),
      guardianRelationship: readValue('guardianRelationship'),
      guardianPhone: readValue('guardianPhone'),
      secondaryGuardianName: readValue('secondaryGuardianName'),
      secondaryGuardianRelationship: readValue(
        'secondaryGuardianRelationship',
      ),
      secondaryGuardianPhone: readValue('secondaryGuardianPhone'),
      notes: readValue('notes'),
    })
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        aria-label="Đóng biểu mẫu"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-form-title"
        className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-lotus-600">
              Hồ sơ học sinh
            </p>

            <h2
              id="student-form-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              {isEditing ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}
            </h2>
          </div>

          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Đóng biểu mẫu"
            onClick={onClose}
          >
            <X aria-hidden="true" size={21} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="p-5 sm:p-6"
        >
          <section>
            <h3 className="text-base font-bold text-slate-900">
              Thông tin cơ bản
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Những trường có dấu * là bắt buộc.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Mã học sinh <span className="text-red-500">*</span>

                <input
                  name="studentCode"
                  type="text"
                  required
                  defaultValue={initialValues.studentCode ?? ''}
                  placeholder="Ví dụ: HS001"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Họ và tên <span className="text-red-500">*</span>

                <input
                  name="fullName"
                  type="text"
                  required
                  defaultValue={initialValues.fullName ?? ''}
                  placeholder="Nhập đầy đủ họ và tên"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Ngày sinh

                <DateInput
                  id="student-date-of-birth"
                  name="dateOfBirth"
                  defaultValue={initialValues.dateOfBirth ?? ''}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Giới tính

                <select
                  name="gender"
                  defaultValue={initialValues.gender ?? 'unspecified'}
                  className={inputClassName}
                >
                  <option value="unspecified">Chưa xác định</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Dân tộc

                <input
                  name="ethnicity"
                  type="text"
                  defaultValue={initialValues.ethnicity ?? ''}
                  placeholder="Ví dụ: Kinh"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Tổ

                <input
                  name="group"
                  type="text"
                  defaultValue={initialValues.group ?? ''}
                  placeholder="Ví dụ: 1"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Học lực theo dõi

                <select
                  name="academicPerformance"
                  defaultValue={
                    initialValues.academicPerformance ?? ''
                  }
                  className={inputClassName}
                >
                  <option value="">Chưa đánh giá</option>
                  <option value="weak">Yếu</option>
                  <option value="average">Trung bình</option>
                  <option value="good">Khá</option>
                  <option value="excellent">Giỏi</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Chức vụ trong lớp

                <input
                  name="classDuty"
                  type="text"
                  defaultValue={initialValues.classDuty ?? ''}
                  placeholder="Ví dụ: Lớp trưởng"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Ngày vào lớp

                <DateInput
                  id="student-joined-on"
                  name="joinedOn"
                  defaultValue={initialValues.joinedOn ?? ''}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Trạng thái

                <select
                  name="status"
                  defaultValue={initialValues.status ?? 'active'}
                  className={inputClassName}
                >
                  <option value="active">Đang học</option>
                  <option value="transferred">
                    Đã chuyển trường
                  </option>
                  <option value="inactive">Ngừng học</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Địa chỉ thường trú

                <textarea
                  name="permanentAddress"
                  rows={3}
                  defaultValue={initialValues.permanentAddress ?? ''}
                  placeholder="Nhập địa chỉ thường trú của học sinh"
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Hoàn cảnh khó khăn

                <textarea
                  name="difficultCircumstances"
                  rows={3}
                  defaultValue={
                    initialValues.difficultCircumstances ?? ''
                  }
                  placeholder="Để trống nếu học sinh không có hoàn cảnh cần lưu ý"
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
                />
              </label>
            </div>
          </section>

          <section className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-base font-bold text-slate-900">
              Thông tin người giám hộ
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Người giám hộ thứ nhất được dùng làm liên hệ chính trong danh sách.
            </p>

            <h4 className="mt-5 text-sm font-bold text-lotus-700">
              Người giám hộ 1 · Liên hệ chính
            </h4>

            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Họ và tên

                <input
                  name="guardianName"
                  type="text"
                  defaultValue={initialValues.guardianName ?? ''}
                  placeholder="Nhập họ tên người giám hộ"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Quan hệ với học sinh

                <input
                  name="guardianRelationship"
                  type="text"
                  defaultValue={initialValues.guardianRelationship ?? ''}
                  placeholder="Ví dụ: Mẹ"
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Số điện thoại

                <input
                  name="guardianPhone"
                  type="tel"
                  inputMode="tel"
                  defaultValue={initialValues.guardianPhone ?? ''}
                  placeholder="Nhập số điện thoại liên hệ"
                  className={inputClassName}
                />
              </label>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h4 className="text-sm font-bold text-slate-700">
                Người giám hộ 2 · Liên hệ dự phòng
              </h4>

              <div className="mt-3 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Họ và tên

                  <input
                    name="secondaryGuardianName"
                    type="text"
                    defaultValue={
                      initialValues.secondaryGuardianName ?? ''
                    }
                    placeholder="Nhập họ tên người giám hộ"
                    className={inputClassName}
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Quan hệ với học sinh

                  <input
                    name="secondaryGuardianRelationship"
                    type="text"
                    defaultValue={
                      initialValues.secondaryGuardianRelationship ?? ''
                    }
                    placeholder="Ví dụ: Bố"
                    className={inputClassName}
                  />
                </label>

                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Số điện thoại dự phòng

                  <input
                    name="secondaryGuardianPhone"
                    type="tel"
                    inputMode="tel"
                    defaultValue={
                      initialValues.secondaryGuardianPhone ?? ''
                    }
                    placeholder="Nhập số điện thoại dự phòng"
                    className={inputClassName}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="mt-8 border-t border-slate-200 pt-6">
            <label className="text-sm font-medium text-slate-700">
              Ghi chú

              <textarea
                name="notes"
                rows={4}
                defaultValue={initialValues.notes ?? ''}
                placeholder="Nhập ghi chú nếu cần..."
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
              />
            </label>
          </section>

          {errorMessage && (
            <p
              role='alert'
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
          )}

          <footer className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Dữ liệu sẽ được lưu an toàn trên hệ thống.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onClose}
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-lotus-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-lotus-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lotus-600 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                {isSubmitting
                  ? isEditing
                    ? 'Đang cập nhật...'
                    : 'Đang lưu...'
                  : isEditing
                    ? 'Cập nhật học sinh'
                    : 'Lưu học sinh'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
