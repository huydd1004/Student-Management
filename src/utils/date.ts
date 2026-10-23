const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const LOCAL_MONTH_PATTERN = /^(\d{4})-(\d{2})$/
const LOCAL_YEAR_PATTERN = /^(\d{4})$/
const DISPLAY_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/
const DISPLAY_MONTH_PATTERN = /^(\d{1,2})\/(\d{4})$/
const FLEXIBLE_DISPLAY_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

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

/** Hiển thị ngày sinh có thể chỉ gồm năm, tháng/năm hoặc đủ ngày/tháng/năm. */
export function formatPartialDateForDisplay(value?: string) {
  if (!value) return ''

  const fullDateMatch = LOCAL_DATE_PATTERN.exec(value)

  if (fullDateMatch) {
    const [, year, month, day] = fullDateMatch
    return `${day}/${month}/${year}`
  }

  const monthMatch = LOCAL_MONTH_PATTERN.exec(value)

  if (monthMatch) {
    const [, year, month] = monthMatch
    return `${month}/${year}`
  }

  return value
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

/**
 * Chuẩn hóa ngày sinh linh hoạt để lưu dưới dạng YYYY, YYYY-MM hoặc YYYY-MM-DD.
 */
export function parsePartialDisplayDate(value: string) {
  const trimmedValue = value.trim()

  if (LOCAL_YEAR_PATTERN.test(trimmedValue)) {
    return trimmedValue
  }

  const monthMatch = DISPLAY_MONTH_PATTERN.exec(trimmedValue)

  if (monthMatch) {
    const [, monthText, yearText] = monthMatch
    const month = Number(monthText)

    if (month < 1 || month > 12) return null

    return `${yearText}-${String(month).padStart(2, '0')}`
  }

  const fullDateMatch = FLEXIBLE_DISPLAY_DATE_PATTERN.exec(trimmedValue)

  if (!fullDateMatch) return null

  const [, dayText, monthText, yearText] = fullDateMatch
  const day = Number(dayText)
  const month = Number(monthText)
  const year = Number(yearText)

  if (!isValidDateParts(year, month, day)) return null

  return `${yearText}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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
