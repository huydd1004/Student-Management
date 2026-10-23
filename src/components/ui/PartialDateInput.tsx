import { CalendarDays } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import {
  formatPartialDateForDisplay,
  parsePartialDisplayDate,
} from '../../utils/date'

type PartialDateInputProps = {
  id?: string
  name: string
  defaultValue?: string
  disabled?: boolean
}

const invalidDateMessage =
  'Nhập năm, tháng/năm hoặc ngày/tháng/năm.'

export function PartialDateInput({
  id,
  name,
  defaultValue = '',
  disabled = false,
}: PartialDateInputProps) {
  const generatedId = useId()
  const inputId = id ?? `partial-date-input-${generatedId}`
  const errorId = `${inputId}-error`
  const visibleInputRef = useRef<HTMLInputElement>(null)
  const nativePickerRef = useRef<HTMLInputElement>(null)
  const [storedValue, setStoredValue] = useState(defaultValue)
  const [displayValue, setDisplayValue] = useState(() =>
    formatPartialDateForDisplay(defaultValue),
  )
  const [errorMessage, setErrorMessage] = useState('')

  function setValidationError(message: string) {
    setErrorMessage(message)
    visibleInputRef.current?.setCustomValidity(message)
  }

  function updateFromDisplay(nextDisplayValue: string) {
    const sanitizedValue = nextDisplayValue
      .replace(/[^\d/]/g, '')
      .slice(0, 10)

    setDisplayValue(sanitizedValue)

    if (!sanitizedValue) {
      setStoredValue('')
      setValidationError('')
      return
    }

    const parsedValue = parsePartialDisplayDate(sanitizedValue)

    if (!parsedValue) {
      setStoredValue('')
      setValidationError(invalidDateMessage)
      return
    }

    setStoredValue(parsedValue)
    setValidationError('')
  }

  function openNativePicker() {
    const picker = nativePickerRef.current

    if (!picker || disabled) return

    if ('showPicker' in picker) {
      try {
        picker.showPicker()
        return
      } catch {
        // Trình duyệt iOS cũ sẽ dùng thao tác click dự phòng.
      }
    }

    picker.click()
  }

  return (
    <div className="mt-2 min-w-0 max-w-full">
      <div className="relative min-w-0 max-w-full">
        <input
          ref={visibleInputRef}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="2015, 09/2015 hoặc 12/09/2015"
          maxLength={10}
          disabled={disabled}
          value={displayValue}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? errorId : `${inputId}-hint`}
          onChange={(event) => updateFromDisplay(event.target.value)}
          onBlur={() => {
            if (displayValue && !parsePartialDisplayDate(displayValue)) {
              setValidationError(invalidDateMessage)
            }
          }}
          className={`block h-12 w-full min-w-0 max-w-full rounded-xl border bg-white pl-4 pr-12 text-sm font-medium tabular-nums text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
            errorMessage
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-200 focus:border-lotus-400 focus:ring-pink-100'
          }`}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={openNativePicker}
          aria-label="Mở lịch chọn ngày sinh đầy đủ"
          className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-lotus-600 transition hover:bg-lotus-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarDays aria-hidden="true" size={19} />
        </button>

        <input
          ref={nativePickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={/^\d{4}-\d{2}-\d{2}$/.test(storedValue) ? storedValue : ''}
          disabled={disabled}
          onChange={(event) => {
            const nextValue = event.target.value
            setStoredValue(nextValue)
            setDisplayValue(formatPartialDateForDisplay(nextValue))
            setValidationError('')
          }}
          className="pointer-events-none absolute bottom-0 right-0 size-px opacity-0"
        />

        <input type="hidden" name={name} value={storedValue} />
      </div>

      {errorMessage ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-red-600">
          {errorMessage}
        </p>
      ) : (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-500">
          Có thể chỉ nhập năm hoặc tháng/năm.
        </p>
      )}
    </div>
  )
}
