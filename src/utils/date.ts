const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const DISPLAY_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/

function isValidDateParts(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/** Chuyển YYYY-MM-DD trong dữ liệu thành DD/MM/YYYY trên giao diện. */
export function formatLocalDateForDisplay(value?: string) {
  if (!value) return ''

  const match = LOCAL_DATE_PATTERN.exec(value)

  if (!match) return value

  const [, year, month, day] = match

  return `${day}/${month}/${year}`
}

/** Chuyển DD/MM/YYYY trên giao diện thành YYYY-MM-DD để lưu trữ. */
export function parseDisplayDate(value: string) {
  const match = DISPLAY_DATE_PATTERN.exec(value.trim())

  if (!match) return null

  const [, dayText, monthText, yearText] = match
  const day = Number(dayText)
  const month = Number(monthText)
  const year = Number(yearText)

  if (!isValidDateParts(year, month, day)) return null

  return `${yearText}-${monthText}-${dayText}`
}

/** Tự chèn dấu / khi người dùng nhập ngày bằng bàn phím số. */
export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 4),
    digits.slice(4, 8),
  ].filter(Boolean)

  return parts.join('/')
}
