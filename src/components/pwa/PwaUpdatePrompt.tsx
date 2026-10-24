import { CheckCircle2, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaUpdatePrompt() {
  const [isUpdating, setIsUpdating] = useState(false)

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('Không thể đăng ký cập nhật ứng dụng:', error)
    },
  })

  if (!offlineReady && !needRefresh) {
    return null
  }

  const closePrompt = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  const installUpdate = async () => {
    setIsUpdating(true)

    try {
      await updateServiceWorker(true)
    } catch (error) {
      console.error('Không thể cập nhật ứng dụng:', error)
      setIsUpdating(false)
    }
  }

  const title = needRefresh
    ? 'Có phiên bản mới'
    : 'Ứng dụng đã sẵn sàng'

  const description = needRefresh
    ? 'Hãy cập nhật để sử dụng những thay đổi mới nhất. Trang sẽ được tải lại sau khi cập nhật.'
    : 'Giao diện ứng dụng đã được lưu để lần mở tiếp theo nhanh hơn. Dữ liệu trực tuyến vẫn cần kết nối Internet.'

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label={title}
      className="fixed inset-x-4 z-[100] mx-auto max-w-md rounded-3xl border border-pink-200 bg-white p-4 shadow-2xl shadow-slate-900/20"
      style={{
        bottom: 'calc(1rem + env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
          {needRefresh ? (
            <RefreshCw aria-hidden="true" size={22} />
          ) : (
            <CheckCircle2 aria-hidden="true" size={22} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={closePrompt}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Đóng thông báo"
        >
          <X aria-hidden="true" size={19} />
        </button>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={closePrompt}
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {needRefresh ? 'Để sau' : 'Đã hiểu'}
        </button>

        {needRefresh ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => void installUpdate()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-lotus-600 px-4 text-sm font-semibold text-white transition hover:bg-lotus-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              size={17}
              className={isUpdating ? 'animate-spin' : ''}
            />

            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật ngay'}
          </button>
        ) : null}
      </div>
    </aside>
  )
}