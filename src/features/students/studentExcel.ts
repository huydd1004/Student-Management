import writeXlsxFile, {
  type Cell,
  type Row,
  type SheetData,
} from 'write-excel-file/browser'

import { CLASSROOM_CONFIG } from '../../config/classroom'
import type {
  LocalDate,
  StudentAcademicPerformance,
  StudentGender,
  StudentStatus,
} from '../../domain'
import type {
  CreateStudentInput,
  StudentListItem,
} from '../../infrastructure/firestore'

const EXCEL_HEADERS = [
  'STT',
  'Mã học sinh',
  'Họ và tên',
  'Ngày sinh',
  'Giới tính',
  'Dân tộc',
  'Tổ',
  'Học lực theo dõi',
  'Chức vụ',
  'Ngày vào lớp',
  'Trạng thái',
  'Địa chỉ thường trú',
  'Hoàn cảnh khó khăn',
  'Họ tên người giám hộ 1',
  'Quan hệ 1',
  'SĐT người giám hộ 1',
  'Họ tên người giám hộ 2',
  'Quan hệ 2',
  'SĐT người giám hộ 2',
  'Ghi chú',
] as const

const genderLabels: Record<StudentGender, string> = {
  male: 'Nam',
  female: 'Nữ',
  other: 'Khác',
  unspecified: 'Chưa xác định',
}

const performanceLabels: Record<
  StudentAcademicPerformance,
  string
> = {
  weak: 'Yếu',
  average: 'Trung bình',
  good: 'Khá',
  excellent: 'Giỏi',
}

const statusLabels: Record<StudentStatus, string> = {
  active: 'Đang học',
  transferred: 'Đã chuyển trường',
  inactive: 'Ngừng học',
}

const excelColumns = [
  { width: 7 },
  { width: 16 },
  { width: 26 },
  { width: 14 },
  { width: 14 },
  { width: 14 },
  { width: 12 },
  { width: 20 },
  { width: 18 },
  { width: 14 },
  { width: 20 },
  { width: 36 },
  { width: 36 },
  { width: 24 },
  { width: 15 },
  { width: 18 },
  { width: 24 },
  { width: 15 },
  { width: 18 },
  { width: 32 },
]

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
}

function readCell(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return String(value ?? '').trim()
}

function parseDateValue(
  value: unknown,
  rowNumber: number,
  fieldName: string,
  errors: string[],
): LocalDate | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear()
    const month = String(value.getUTCMonth() + 1).padStart(2, '0')
    const day = String(value.getUTCDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const text = readCell(value)
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  const vietnameseMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(
    text,
  )

  const year = isoMatch?.[1] ?? vietnameseMatch?.[3]
  const month = isoMatch?.[2] ?? vietnameseMatch?.[2]
  const day = isoMatch?.[3] ?? vietnameseMatch?.[1]

  if (!year || !month || !day) {
    errors.push(
      `Dòng ${rowNumber}: ${fieldName} phải có dạng ngày hợp lệ.`,
    )
    return undefined
  }

  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  )

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day)
  ) {
    errors.push(`Dòng ${rowNumber}: ${fieldName} không hợp lệ.`)
    return undefined
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function toExcelDate(value?: LocalDate) {
  if (!value) return ''

  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function createTitleRow(value: string, fontSize: number): Row {
  return [
    {
      value,
      columnSpan: EXCEL_HEADERS.length,
      height: 26,
      align: 'center',
      alignVertical: 'center',
      fontSize,
      fontWeight: 'bold',
      textColor: '#9D174D',
    },
    ...Array<Cell>(EXCEL_HEADERS.length - 1).fill(null),
  ]
}

function createHeaderCell(value: string): Cell {
  return {
    value,
    height: 30,
    align: 'center',
    alignVertical: 'center',
    fontWeight: 'bold',
    textColor: '#FFFFFF',
    backgroundColor: '#BE185D',
    borderColor: '#9D174D',
    wrap: true,
  }
}

function createDataCell(
  value: string | number | Date,
  align: 'left' | 'center' | 'right' = 'left',
  format?: string,
): Cell {
  return {
    value,
    align,
    alignVertical: 'center',
    borderColor: '#E2E8F0',
    wrap: true,
    ...(format ? { format } : {}),
  }
}

export async function exportStudentsToExcel(
  students: StudentListItem[],
) {
  const sheetData: SheetData = [
    createTitleRow(
      `${CLASSROOM_CONFIG.schoolName.toUpperCase()} - LỚP ${CLASSROOM_CONFIG.className}`,
      15,
    ),
    createTitleRow(
      `Danh sách học sinh - Năm học ${CLASSROOM_CONFIG.schoolYear}`,
      11,
    ),
    Array<Cell>(EXCEL_HEADERS.length).fill(null),
    EXCEL_HEADERS.map(createHeaderCell),
    ...students.map((student, index): Row => [
      createDataCell(index + 1, 'center', '0'),
      createDataCell(student.studentCode, 'left', '@'),
      createDataCell(student.fullName),
      createDataCell(toExcelDate(student.dateOfBirth), 'center', 'dd/mm/yyyy'),
      createDataCell(genderLabels[student.gender], 'center'),
      createDataCell(student.ethnicity ?? '', 'center'),
      createDataCell(student.group ?? '', 'center'),
      createDataCell(
        student.academicPerformance
          ? performanceLabels[student.academicPerformance]
          : '',
        'center',
      ),
      createDataCell(student.classDuty ?? ''),
      createDataCell(toExcelDate(student.joinedOn), 'center', 'dd/mm/yyyy'),
      createDataCell(statusLabels[student.status], 'center'),
      createDataCell(student.permanentAddress ?? ''),
      createDataCell(student.difficultCircumstances ?? ''),
      createDataCell(student.guardian?.fullName ?? ''),
      createDataCell(student.guardian?.relationship ?? '', 'center'),
      createDataCell(
        student.guardian?.phoneNumber ?? '',
        'left',
        '@',
      ),
      createDataCell(student.secondaryGuardian?.fullName ?? ''),
      createDataCell(
        student.secondaryGuardian?.relationship ?? '',
        'center',
      ),
      createDataCell(
        student.secondaryGuardian?.phoneNumber ?? '',
        'left',
        '@',
      ),
      createDataCell(student.notes ?? ''),
    ]),
  ]

  const workbookBlob = await writeXlsxFile(
    sheetData,
    {
      sheet: 'Học sinh',
      columns: excelColumns,
      dateFormat: 'dd/mm/yyyy',
      stickyRowsCount: 4,
      stickyColumnsCount: 3,
      showGridLines: false,
      orientation: 'landscape',
      zoomScale: 0.9,
    },
    {
      fontFamily: 'Arial',
      fontSize: 10,
    },
  ).toBlob()
  const fileName = `danh-sach-hoc-sinh-lop-${CLASSROOM_CONFIG.className.replace('.', '-')}-${CLASSROOM_CONFIG.schoolYear}.xlsx`
  const downloadUrl = URL.createObjectURL(workbookBlob)
  const downloadLink = document.createElement('a')

  downloadLink.href = downloadUrl
  downloadLink.download = fileName
  downloadLink.style.display = 'none'
  document.body.append(downloadLink)
  downloadLink.click()
  downloadLink.remove()

  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 10_000)
}

function findColumnIndex(
  headers: unknown[],
  aliases: string[],
) {
  const normalizedAliases = aliases.map(normalizeText)

  return headers.findIndex((header) =>
    normalizedAliases.includes(normalizeText(header)),
  )
}

function parseMappedValue<T extends string>(
  value: unknown,
  mapping: Record<string, T>,
  rowNumber: number,
  fieldName: string,
  errors: string[],
  fallback: T,
) {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) return fallback

  const mappedValue = mapping[normalizedValue]

  if (!mappedValue) {
    errors.push(`Dòng ${rowNumber}: ${fieldName} không hợp lệ.`)
    return fallback
  }

  return mappedValue
}

export async function parseStudentsFromExcel(
  file: File,
): Promise<CreateStudentInput[]> {
  const { readSheet } = await import('read-excel-file/browser')
  const rows = await readSheet(file)

  const headerRowIndex = rows
    .slice(0, 15)
    .findIndex(
      (row) =>
        findColumnIndex(row, ['Mã học sinh', 'Mã HS']) >= 0 &&
        findColumnIndex(row, ['Họ và tên', 'Họ tên']) >= 0,
    )

  if (headerRowIndex < 0) {
    throw new Error(
      'Không tìm thấy hai cột bắt buộc “Mã học sinh” và “Họ và tên”.',
    )
  }

  const headers = rows[headerRowIndex]
  const column = {
    studentCode: findColumnIndex(headers, ['Mã học sinh', 'Mã HS']),
    fullName: findColumnIndex(headers, ['Họ và tên', 'Họ tên']),
    dateOfBirth: findColumnIndex(headers, ['Ngày sinh']),
    gender: findColumnIndex(headers, ['Giới tính']),
    ethnicity: findColumnIndex(headers, ['Dân tộc']),
    group: findColumnIndex(headers, ['Tổ']),
    academicPerformance: findColumnIndex(headers, [
      'Học lực theo dõi',
      'Học lực',
    ]),
    classDuty: findColumnIndex(headers, ['Chức vụ']),
    joinedOn: findColumnIndex(headers, ['Ngày vào lớp']),
    status: findColumnIndex(headers, ['Trạng thái']),
    permanentAddress: findColumnIndex(headers, [
      'Địa chỉ thường trú',
      'Địa chỉ',
    ]),
    difficultCircumstances: findColumnIndex(headers, [
      'Hoàn cảnh khó khăn',
      'Hoàn cảnh',
    ]),
    guardianName: findColumnIndex(headers, [
      'Họ tên người giám hộ 1',
      'Họ tên phụ huynh',
    ]),
    guardianRelationship: findColumnIndex(headers, [
      'Quan hệ 1',
      'Quan hệ',
    ]),
    guardianPhone: findColumnIndex(headers, [
      'SĐT người giám hộ 1',
      'Số điện thoại',
      'SĐT',
    ]),
    secondaryGuardianName: findColumnIndex(headers, [
      'Họ tên người giám hộ 2',
    ]),
    secondaryGuardianRelationship: findColumnIndex(headers, [
      'Quan hệ 2',
    ]),
    secondaryGuardianPhone: findColumnIndex(headers, [
      'SĐT người giám hộ 2',
    ]),
    notes: findColumnIndex(headers, ['Ghi chú']),
  }

  const errors: string[] = []
  const seenStudentCodes = new Set<string>()
  const students: CreateStudentInput[] = []

  for (let index = headerRowIndex + 1; index < rows.length; index += 1) {
    const row = rows[index]
    const rowNumber = index + 1
    const studentCode = readCell(row[column.studentCode])
    const fullName = readCell(row[column.fullName])

    if (!studentCode && !fullName) continue

    if (!studentCode || !fullName) {
      errors.push(
        `Dòng ${rowNumber}: phải có đủ Mã học sinh và Họ và tên.`,
      )
      continue
    }

    const normalizedStudentCode = normalizeText(studentCode)

    if (seenStudentCodes.has(normalizedStudentCode)) {
      errors.push(
        `Dòng ${rowNumber}: mã học sinh “${studentCode}” bị trùng trong tệp.`,
      )
      continue
    }

    seenStudentCodes.add(normalizedStudentCode)

    const gender = parseMappedValue<StudentGender>(
      row[column.gender],
      {
        nam: 'male',
        male: 'male',
        nu: 'female',
        female: 'female',
        khac: 'other',
        other: 'other',
        'chua xac dinh': 'unspecified',
        unspecified: 'unspecified',
      },
      rowNumber,
      'Giới tính',
      errors,
      'unspecified',
    )

    const academicPerformance = parseMappedValue<
      StudentAcademicPerformance | ''
    >(
      row[column.academicPerformance],
      {
        yeu: 'weak',
        weak: 'weak',
        'trung binh': 'average',
        average: 'average',
        kha: 'good',
        good: 'good',
        gioi: 'excellent',
        excellent: 'excellent',
      },
      rowNumber,
      'Học lực theo dõi',
      errors,
      '',
    )

    const status = parseMappedValue<StudentStatus>(
      row[column.status],
      {
        'dang hoc': 'active',
        active: 'active',
        'da chuyen truong': 'transferred',
        transferred: 'transferred',
        'ngung hoc': 'inactive',
        inactive: 'inactive',
      },
      rowNumber,
      'Trạng thái',
      errors,
      'active',
    )

    const dateOfBirth = parseDateValue(
      row[column.dateOfBirth],
      rowNumber,
      'Ngày sinh',
      errors,
    )
    const joinedOn = parseDateValue(
      row[column.joinedOn],
      rowNumber,
      'Ngày vào lớp',
      errors,
    )
    const guardianName = readCell(row[column.guardianName])
    const guardianRelationship = readCell(
      row[column.guardianRelationship],
    )
    const guardianPhone = readCell(row[column.guardianPhone])
    const hasGuardian = Boolean(
      guardianName || guardianRelationship || guardianPhone,
    )
    const secondaryGuardianName = readCell(
      row[column.secondaryGuardianName],
    )
    const secondaryGuardianRelationship = readCell(
      row[column.secondaryGuardianRelationship],
    )
    const secondaryGuardianPhone = readCell(
      row[column.secondaryGuardianPhone],
    )
    const hasSecondaryGuardian = Boolean(
      secondaryGuardianName ||
        secondaryGuardianRelationship ||
        secondaryGuardianPhone,
    )

    students.push({
      studentCode,
      fullName,
      gender,
      status,
      ...(dateOfBirth ? { dateOfBirth } : {}),
      ...(readCell(row[column.ethnicity])
        ? { ethnicity: readCell(row[column.ethnicity]) }
        : {}),
      ...(readCell(row[column.group])
        ? { group: readCell(row[column.group]) }
        : {}),
      ...(academicPerformance ? { academicPerformance } : {}),
      ...(readCell(row[column.classDuty])
        ? { classDuty: readCell(row[column.classDuty]) }
        : {}),
      ...(joinedOn ? { joinedOn } : {}),
      ...(readCell(row[column.permanentAddress])
        ? {
            permanentAddress: readCell(
              row[column.permanentAddress],
            ),
          }
        : {}),
      ...(readCell(row[column.difficultCircumstances])
        ? {
            difficultCircumstances: readCell(
              row[column.difficultCircumstances],
            ),
          }
        : {}),
      ...(hasGuardian
        ? {
            guardian: {
              fullName: guardianName,
              relationship: guardianRelationship,
              phoneNumber: guardianPhone,
            },
          }
        : {}),
      ...(hasSecondaryGuardian
        ? {
            secondaryGuardian: {
              fullName: secondaryGuardianName,
              relationship: secondaryGuardianRelationship,
              phoneNumber: secondaryGuardianPhone,
            },
          }
        : {}),
      ...(readCell(row[column.notes])
        ? { notes: readCell(row[column.notes]) }
        : {}),
    })
  }

  if (students.length > 500) {
    errors.push('Mỗi lần chỉ được nhập tối đa 500 học sinh.')
  }

  if (errors.length > 0) {
    const remainingCount = Math.max(errors.length - 5, 0)
    const summary = errors.slice(0, 5).join('\n')

    throw new Error(
      remainingCount > 0
        ? `${summary}\nVà ${remainingCount} lỗi khác.`
        : summary,
    )
  }

  if (students.length === 0) {
    throw new Error('Tệp Excel không có học sinh nào để nhập.')
  }

  return students
}
