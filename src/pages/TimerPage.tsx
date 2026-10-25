import {
  Clock3,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  TimerReset,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const TIMER_PRESETS = [5, 10, 15, 20, 30, 45]
const MAX_MINUTES = 180

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => value.toString().padStart(2, '0'))
      .join(':')
  }

  return [minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':')
}

export function TimerPage() {
  const [minutes, setMinutes] = useState(15)
  const [seconds, setSeconds] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const endTimeRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const nativeFullscreenRef = useRef(false)

  const configuredSeconds = minutes * 60 + seconds
  const hasStarted =
    remainingSeconds > 0 && remainingSeconds !== configuredSeconds
  const isFinished =
    configuredSeconds > 0 && remainingSeconds === 0
  const progress = configuredSeconds
    ? clamp((remainingSeconds / configuredSeconds) * 100, 0, 100)
    : 0

  const timerTone = useMemo(() => {
    if (configuredSeconds === 0) {
      return {
        label: 'Chưa đặt thời gian',
        text: 'text-slate-600',
        bar: 'bg-slate-400',
        surface: 'border-slate-200 bg-slate-50',
      }
    }

    if (isFinished) {
      return {
        label: 'Hết giờ',
        text: 'text-red-600',
        bar: 'bg-red-500',
        surface: 'border-red-200 bg-red-50',
      }
    }

    if (remainingSeconds <= 60) {
      return {
        label: 'Sắp hết giờ',
        text: 'text-amber-700',
        bar: 'bg-amber-500',
        surface: 'border-amber-200 bg-amber-50',
      }
    }

    return {
      label: isRunning
        ? 'Đang làm bài'
        : hasStarted
          ? 'Đang tạm dừng'
          : 'Sẵn sàng',
      text: 'text-lotus-700',
      bar: 'bg-lotus-600',
      surface: 'border-pink-200 bg-lotus-50',
    }
  }, [
    configuredSeconds,
    hasStarted,
    isFinished,
    isRunning,
    remainingSeconds,
  ])

  function ensureAudioContext() {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    void audioContextRef.current.resume()
  }

  function playFinishSound() {
    const context = audioContextRef.current

    if (!soundEnabled || !context) return

    const startAt = context.currentTime

    ;[0, 0.32, 0.64].forEach((delay) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, startAt + delay)
      gain.gain.setValueAtTime(0.0001, startAt + delay)
      gain.gain.exponentialRampToValueAtTime(
        0.22,
        startAt + delay + 0.025,
      )
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startAt + delay + 0.23,
      )
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(startAt + delay)
      oscillator.stop(startAt + delay + 0.25)
    })
  }

  useEffect(() => {
    if (!isRunning || endTimeRef.current === null) return

    const updateTimer = () => {
      if (endTimeRef.current === null) return

      const nextRemaining = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000),
      )

      setRemainingSeconds(nextRemaining)

      if (nextRemaining === 0) {
        endTimeRef.current = null
        setIsRunning(false)
        playFinishSound()
      }
    }

    updateTimer()
    const intervalId = window.setInterval(updateTimer, 250)

    return () => window.clearInterval(intervalId)
  }, [isRunning, soundEnabled])

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (nativeFullscreenRef.current && !document.fullscreenElement) {
        nativeFullscreenRef.current = false
        setIsPresentationMode(false)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange,
      )
      void audioContextRef.current?.close()
    }
  }, [])

  useEffect(() => {
    if (!isPresentationMode) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isPresentationMode])

  function setDuration(nextMinutes: number, nextSeconds: number) {
    const safeMinutes = clamp(nextMinutes, 0, MAX_MINUTES)
    const safeSeconds = clamp(nextSeconds, 0, 59)
    const safeTotalSeconds = Math.min(
      safeMinutes * 60 + safeSeconds,
      MAX_MINUTES * 60,
    )

    setMinutes(Math.floor(safeTotalSeconds / 60))
    setSeconds(safeTotalSeconds % 60)
    setRemainingSeconds(safeTotalSeconds)
    endTimeRef.current = null
    setIsRunning(false)
  }

  function selectPreset(presetMinutes: number) {
    setDuration(presetMinutes, 0)
  }

  function startTimer() {
    if (remainingSeconds <= 0) return

    if (soundEnabled) ensureAudioContext()

    endTimeRef.current = Date.now() + remainingSeconds * 1000
    setIsRunning(true)
  }

  function pauseTimer() {
    if (endTimeRef.current !== null) {
      setRemainingSeconds(
        Math.max(
          0,
          Math.ceil((endTimeRef.current - Date.now()) / 1000),
        ),
      )
    }

    endTimeRef.current = null
    setIsRunning(false)
  }

  function resetTimer() {
    endTimeRef.current = null
    setIsRunning(false)
    setRemainingSeconds(configuredSeconds)
  }

  function addOneMinute() {
    const nextConfiguredSeconds = Math.min(
      configuredSeconds + 60,
      MAX_MINUTES * 60,
    )
    const addedSeconds = nextConfiguredSeconds - configuredSeconds

    setMinutes(Math.floor(nextConfiguredSeconds / 60))
    setSeconds(nextConfiguredSeconds % 60)
    setRemainingSeconds((current) => current + addedSeconds)

    if (endTimeRef.current !== null) {
      endTimeRef.current += addedSeconds * 1000
    }
  }

  async function enterPresentationMode() {
    setIsPresentationMode(true)

    if (!document.documentElement.requestFullscreen) return

    try {
      await document.documentElement.requestFullscreen()
      nativeFullscreenRef.current = true
    } catch {
      nativeFullscreenRef.current = false
    }
  }

  async function exitPresentationMode() {
    setIsPresentationMode(false)
    nativeFullscreenRef.current = false

    if (!document.fullscreenElement) return

    try {
      await document.exitFullscreen()
    } catch {
      // Chế độ phủ toàn màn hình của ứng dụng vẫn được tắt ở phía trên.
    }
  }

  const timerDisplay = (
    <section
      className={`flex min-h-[26rem] flex-col items-center justify-center rounded-[2rem] border p-5 text-center shadow-sm sm:p-8 ${timerTone.surface} ${
        isPresentationMode
          ? 'min-h-full rounded-none border-0 bg-white shadow-none'
          : ''
      }`}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm ${timerTone.text}`}
        >
          <Clock3 aria-hidden="true" size={18} />
          {timerTone.label}
        </span>

        <button
          type="button"
          onClick={() =>
            void (isPresentationMode
              ? exitPresentationMode()
              : enterPresentationMode())
          }
          className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-lotus-700"
          aria-label={
            isPresentationMode
              ? 'Thoát chế độ trình chiếu'
              : 'Mở chế độ trình chiếu'
          }
          title={
            isPresentationMode
              ? 'Thoát trình chiếu'
              : 'Trình chiếu toàn màn hình'
          }
        >
          {isPresentationMode ? (
            <Minimize2 aria-hidden="true" size={21} />
          ) : (
            <Maximize2 aria-hidden="true" size={21} />
          )}
        </button>
      </div>

      <p
        role="timer"
        aria-live={isFinished ? 'assertive' : 'off'}
        aria-label={
          isFinished
            ? 'Đã hết giờ làm bài'
            : `Còn ${formatTime(remainingSeconds)}`
        }
        className={`my-auto py-10 font-black leading-none tracking-[-0.055em] tabular-nums ${timerTone.text} ${
          isPresentationMode
            ? 'text-[clamp(5.5rem,24vw,18rem)]'
            : 'text-[clamp(4.5rem,16vw,10rem)]'
        }`}
      >
        {formatTime(remainingSeconds)}
      </p>

      <div className="w-full max-w-5xl">
        <div
          className="h-3 overflow-hidden rounded-full bg-white shadow-inner"
          aria-hidden="true"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${timerTone.bar}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {isRunning ? (
            <button
              type="button"
              onClick={pauseTimer}
              className="inline-flex h-13 min-w-36 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-base font-bold text-white shadow-lg transition hover:bg-slate-800"
            >
              <Pause aria-hidden="true" size={22} />
              Tạm dừng
            </button>
          ) : (
            <button
              type="button"
              disabled={remainingSeconds <= 0}
              onClick={startTimer}
              className="inline-flex h-13 min-w-36 items-center justify-center gap-2 rounded-2xl bg-lotus-600 px-6 text-base font-bold text-white shadow-lg transition hover:bg-lotus-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play aria-hidden="true" size={22} />
              {hasStarted ? 'Tiếp tục' : 'Bắt đầu'}
            </button>
          )}

          <button
            type="button"
            onClick={addOneMinute}
            disabled={configuredSeconds >= MAX_MINUTES * 60}
            className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-lotus-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus aria-hidden="true" size={20} />
            Thêm 1 phút
          </button>

          <button
            type="button"
            onClick={resetTimer}
            className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-lotus-700"
          >
            <RotateCcw aria-hidden="true" size={19} />
            Đặt lại
          </button>
        </div>
      </div>
    </section>
  )

  return (
    <main
      className={
        isPresentationMode
          ? 'timer-presentation-safe-area fixed inset-0 z-[100] overflow-y-auto bg-white'
          : 'p-5 md:p-8'
      }
    >
      {!isPresentationMode ? (
        <>
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-lotus-600">
              Công cụ lớp học
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              Đồng hồ làm bài
            </h2>
            <p className="mt-2 max-w-2xl leading-7 text-slate-600">
              Đếm ngược thời gian làm bài với màn hình lớn, rõ ràng
              để cả lớp dễ theo dõi.
            </p>
          </section>

          <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
            {timerDisplay}

            <aside className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
                    <TimerReset aria-hidden="true" size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Đặt thời gian
                    </h3>
                    <p className="text-sm text-slate-500">
                      Tối đa {MAX_MINUTES} phút
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Phút
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max={MAX_MINUTES}
                      value={minutes}
                      disabled={isRunning}
                      onChange={(event) =>
                        setDuration(
                          Number(event.target.value) || 0,
                          seconds,
                        )
                      }
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-center text-lg font-bold text-slate-900 outline-none transition focus:border-lotus-400 focus:bg-white focus:ring-4 focus:ring-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-700">
                    Giây
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="59"
                      value={seconds}
                      disabled={isRunning}
                      onChange={(event) =>
                        setDuration(
                          minutes,
                          Number(event.target.value) || 0,
                        )
                      }
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-center text-lg font-bold text-slate-900 outline-none transition focus:border-lotus-400 focus:bg-white focus:ring-4 focus:ring-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Chọn nhanh
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {TIMER_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isRunning}
                      onClick={() => selectPreset(preset)}
                      className={`h-10 rounded-xl border text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        configuredSeconds === preset * 60
                          ? 'border-lotus-600 bg-lotus-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-pink-200 hover:bg-lotus-50 hover:text-lotus-700'
                      }`}
                    >
                      {preset} phút
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    const nextSoundEnabled = !soundEnabled
                    setSoundEnabled(nextSoundEnabled)

                    if (nextSoundEnabled) ensureAudioContext()
                  }}
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-pressed={soundEnabled}
                >
                  <span>
                    <span className="block font-bold text-slate-900">
                      Âm báo hết giờ
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      Phát ba tiếng chuông ngắn
                    </span>
                  </span>
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                      soundEnabled
                        ? 'bg-lotus-50 text-lotus-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {soundEnabled ? (
                      <Volume2 aria-hidden="true" size={21} />
                    ) : (
                      <VolumeX aria-hidden="true" size={21} />
                    )}
                  </span>
                </button>
              </div>
            </aside>
          </section>
        </>
      ) : (
        timerDisplay
      )}
    </main>
  )
}
