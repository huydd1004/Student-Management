import { useEffect, useRef } from 'react'
import { AlertTriangle, LoaderCircle, Trash2, X } from 'lucide-react'

type ConfirmDialogProps = {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  isConfirming?: boolean
  errorMessage?: string
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Xác nhận',
  isConfirming = false,
  errorMessage = '',
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    confirmButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isConfirming) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isConfirming, isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng hộp xác nhận"
        disabled={isConfirming}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
      />

      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-red-200 bg-white shadow-2xl"
      >
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle aria-hidden="true" size={24} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-600">
                Cần xác nhận
              </p>
              <h2
                id="confirm-dialog-title"
                className="mt-1 text-xl font-bold text-slate-900"
              >
                {title}
              </h2>
              <p
                id="confirm-dialog-description"
                className="mt-3 text-sm leading-6 text-slate-600"
              >
                {description}
              </p>
            </div>

            <button
              type="button"
              aria-label="Đóng hộp xác nhận"
              disabled={isConfirming}
              onClick={onClose}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            >
              <X aria-hidden="true" size={19} />
            </button>
          </div>

          {errorMessage ? (
            <p
              role="alert"
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isConfirming}
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            disabled={isConfirming}
            onClick={() => void onConfirm()}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConfirming ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={18}
              />
            ) : (
              <Trash2 aria-hidden="true" size={18} />
            )}
            {isConfirming ? 'Đang xóa...' : confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  )
}
