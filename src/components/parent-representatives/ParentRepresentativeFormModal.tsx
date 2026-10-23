import type { FormEvent } from 'react'
import { X } from 'lucide-react'

import type { ParentRepresentativeInput } from '../../infrastructure/firestore'

type ParentRepresentativeFormModalProps = {
  isOpen: boolean
  mode?: 'create' | 'edit'
  initialValues?: Partial<ParentRepresentativeInput>
  isSubmitting?: boolean
  errorMessage?: string
  onClose: () => void
  onSubmit: (
    values: ParentRepresentativeInput,
  ) => void | Promise<void>
}

const inputClassName =
  'mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lotus-400 focus:ring-4 focus:ring-pink-100'

export function ParentRepresentativeFormModal({
  isOpen,
  mode = 'create',
  initialValues = {},
  isSubmitting = false,
  errorMessage = '',
  onClose,
  onSubmit,
}: ParentRepresentativeFormModalProps) {
  const isEditing = mode === 'edit'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const readValue = (name: string) =>
      String(formData.get(name) ?? '').trim()

    void onSubmit({
      fullName: readValue('fullName'),
      position: readValue('position'),
      phoneNumber: readValue('phoneNumber'),
      address: readValue('address'),
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng biểu mẫu"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="parent-representative-form-title"
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-lotus-600">
              Ban đại diện phụ huynh
            </p>
            <h2
              id="parent-representative-form-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              {isEditing ? 'Chỉnh sửa thành viên' : 'Thêm thành viên'}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Đóng biểu mẫu"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X aria-hidden="true" size={21} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="p-5 sm:p-6"
        >
          <p className="text-sm leading-6 text-slate-500">
            Những trường có dấu * là bắt buộc.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Họ và tên <span className="text-red-500">*</span>
              <input
                name="fullName"
                type="text"
                required
                defaultValue={initialValues.fullName ?? ''}
                placeholder="Nhập họ và tên"
                className={inputClassName}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Chức vụ <span className="text-red-500">*</span>
              <input
                name="position"
                type="text"
                required
                defaultValue={initialValues.position ?? ''}
                placeholder="Ví dụ: Trưởng ban"
                className={inputClassName}
              />
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Số điện thoại <span className="text-red-500">*</span>
              <input
                name="phoneNumber"
                type="tel"
                inputMode="tel"
                required
                defaultValue={initialValues.phoneNumber ?? ''}
                placeholder="Nhập số điện thoại liên hệ"
                className={inputClassName}
              />
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Địa chỉ <span className="text-red-500">*</span>
              <textarea
                name="address"
                rows={3}
                required
                defaultValue={initialValues.address ?? ''}
                placeholder="Nhập địa chỉ"
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
              />
            </label>
          </div>

          {errorMessage ? (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          ) : null}

          <footer className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-lotus-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-lotus-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lotus-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Đang lưu...'
                : isEditing
                  ? 'Cập nhật thành viên'
                  : 'Thêm thành viên'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
