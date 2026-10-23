import { CalendarDays } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import {
  formatDateInput,
  formatLocalDateForDisplay,
  parseDisplayDate,
} from '../../utils/date'

type DateInputProps = {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  min?: string
  max?: string
  disabled?: boolean
  required?: boolean
  className?: string
  onChange?: (value: string) => void
  onValidityChange?: (isValid: boolean) => void
}

export function DateInput({
  id,
  name,
  value,
  defaultValue = '',
  min,
  max,
  disabled = false,
  required = false,
  className = '',
  onChange,
  onValidityChange,
}: DateInputProps) {
  const generatedId = useId()
  const inputId = id ?? `date-input-${generatedId}`
  const errorId = `${inputId}-error`
  const nativePickerRef = useRef<HTMLInputElement>(null)
  const visibleInputRef = useRef<HTMLInputElement>(null)
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const committedValue = isControlled ? value : internalValue
  const [displayValue, setDisplayValue] = useState(() =>
    formatLocalDateForDisplay(value ?? defaultValue),
  )
  const [errorMessage, setErrorMessage] = useState('')

  function setValidationError(message: string) {
    setErrorMessage(message)
    visibleInputRef.current?.setCustomValidity(message)
    onValidityChange?.(!message)
  }

  useEffect(() => {
    if (!isControlled) return

    setDisplayValue(formatLocalDateForDisplay(value))

    if (!value) {
      setValidationError(required ? 'Vui lòng nhập ngày.' : '')
    } else if (min && value < min) {
      setValidationError(
        `Ngày sớm nhất là ${formatLocalDateForDisplay(min)}.`,
      )
    } else if (max && value > max) {
      setValidationError(
        `Ngày muộn nhất là ${formatLocalDateForDisplay(max)}.`,
      )
    } else {
      setValidationError('')
    }
  }, [isControlled, max, min, required, value])

  function commitValue(nextValue: string) {
    if (!isControlled) setInternalValue(nextValue)
    onChange?.(nextValue)
  }

  function validateAndCommit(nextDisplayValue: string) {
    if (!nextDisplayValue) {
      setValidationError(required ? 'Vui lòng nhập ngày.' : '')
      commitValue('')
      return
    }

    const parsedValue = parseDisplayDate(nextDisplayValue)

    if (!parsedValue) {
      if (!isControlled) setInternalValue('')
      setValidationError(
        nextDisplayValue.length === 10
          ? 'Ngày không hợp lệ.'
          : 'Vui lòng nhập đủ ngày theo dd/mm/yyyy.',
      )
      return
    }

    if (min && parsedValue < min) {
      if (!isControlled) setInternalValue('')
      setValidationError(
        `Ngày sớm nhất là ${formatLocalDateForDisplay(min)}.`,
      )
      return
    }

    if (max && parsedValue > max) {
      if (!isControlled) setInternalValue('')
      setValidationError(
        `Ngày muộn nhất là ${formatLocalDateForDisplay(max)}.`,
      )
      return
    }

    setValidationError('')
    commitValue(parsedValue)
  }

  function openNativePicker() {
    const picker = nativePickerRef.current

    if (!picker || disabled) return

    if ('showPicker' in picker) {
      try {
        picker.showPicker()
        return
      } catch {
        // Trình duyệt iOS cũ sẽ dùng thao tác click dự phòng bên dưới.
      }
    }

    picker.click()
  }

  return (
    <div className={`mt-2 min-w-0 max-w-full ${className}`}>
      <div className="relative min-w-0 max-w-full">
        <input
          ref={visibleInputRef}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/yyyy"
          maxLength={10}
          required={required}
          disabled={disabled}
          value={displayValue}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? errorId : undefined}
          onChange={(event) => {
            const nextDisplayValue = formatDateInput(event.target.value)
            setDisplayValue(nextDisplayValue)
            validateAndCommit(nextDisplayValue)
          }}
          onBlur={() => {
            if (displayValue && !parseDisplayDate(displayValue)) {
              setValidationError(
                'Vui lòng nhập đủ ngày theo dd/mm/yyyy.',
              )
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
          aria-label="Mở lịch chọn ngày"
          className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-lotus-600 transition hover:bg-lotus-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarDays aria-hidden="true" size={19} />
        </button>

        <input
          ref={nativePickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={committedValue}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(event) => {
            const nextValue = event.target.value
            setDisplayValue(formatLocalDateForDisplay(nextValue))
            setValidationError('')
            commitValue(nextValue)
          }}
          className="pointer-events-none absolute bottom-0 right-0 size-px opacity-0"
        />

        {name ? <input type="hidden" name={name} value={committedValue} /> : null}
      </div>

      {errorMessage ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-red-600">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
