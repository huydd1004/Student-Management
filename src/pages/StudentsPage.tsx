import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  AlertTriangle,
  Check,
  Download,
  Eye,
  EyeOff,
  SlidersHorizontal,
  LoaderCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react'

import { useAuth } from '../auth/AuthProvider'
import { StudentFormModal } from '../components/students/StudentFormModal'
import type { StudentFormValues } from '../components/students/StudentFormModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import {
  exportStudentsToExcel,
  parseStudentsFromExcel,
} from '../features/students/studentExcel'
import {
  createStudent,
  deleteStudent,
  importStudents,
  removeLegacyStudentCodes,
  subscribeToStudents,
  updateStudent,
  type CreateStudentInput,
  type StudentListItem,
} from '../infrastructure/firestore'
import { formatPartialDateForDisplay } from '../utils/date'

type StudentStatusFilter = 'all' | StudentFormValues['status']
type StudentGroupFilter = 'all' | string
type StudentPerformanceFilter =
  | 'all'
  | 'unrated'
  | Exclude<StudentFormValues['academicPerformance'], ''>
type StudentGenderFilter = 'all' | StudentFormValues['gender']
type StudentTrackingFilter =
  | 'all'
  | 'class-duty'
  | 'difficult-circumstances'
  | 'missing-guardian-phone'

const statusLabels: Record<StudentFormValues['status'], string> = {
  active: 'Đang học',
  transferred: 'Đã chuyển trường',
  inactive: 'Ngừng học',
}

const statusStyles: Record<StudentFormValues['status'], string> = {
  active: 'bg-emerald-50 text-emerald-700',
  transferred: 'bg-amber-50 text-amber-700',
  inactive: 'bg-slate-100 text-slate-600',
}

const academicPerformanceLabels = {
  weak: 'Yếu',
  average: 'Trung bình',
  good: 'Khá',
  excellent: 'Giỏi',
} as const

const academicPerformanceStyles = {
  weak: 'bg-red-50 text-red-700',
  average: 'bg-amber-50 text-amber-700',
  good: 'bg-sky-50 text-sky-700',
  excellent: 'bg-emerald-50 text-emerald-700',
} as const

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
}

function maskPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, '')

  if (digits.length <= 4) return digits || '—'

  return `${digits.slice(0, 2)}${'•'.repeat(
    Math.max(digits.length - 4, 4),
  )}${digits.slice(-2)}`
}

function normalizeGroup(value?: string) {
  return normalizeSearchText(value ?? '')
    .replace(/^to\s*/, '')
    .trim()
}

function formatGroupLabel(value: string) {
  const normalizedValue = value.replace(/^t(?:ổ|o)\s*/i, '').trim()

  return normalizedValue ? `Tổ ${normalizedValue}` : 'Chưa xếp tổ'
}

function toCreateStudentInput(
  values: StudentFormValues,
): CreateStudentInput {
  const hasGuardianInformation = Boolean(
    values.guardianName ||
      values.guardianRelationship ||
      values.guardianPhone,
  )
  const hasSecondaryGuardianInformation = Boolean(
    values.secondaryGuardianName ||
      values.secondaryGuardianRelationship ||
      values.secondaryGuardianPhone,
  )

  return {
    fullName: values.fullName,
    gender: values.gender,
    status: values.status,

    ...(values.ethnicity
      ? { ethnicity: values.ethnicity }
      : {}),

    ...(values.academicPerformance
      ? {
          academicPerformance:
            values.academicPerformance,
        }
      : {}),

    ...(values.dateOfBirth
      ? { dateOfBirth: values.dateOfBirth }
      : {}),

    ...(values.group ? { group: values.group } : {}),

    ...(values.classDuty
      ? { classDuty: values.classDuty }
      : {}),

    ...(values.permanentAddress
      ? { permanentAddress: values.permanentAddress }
      : {}),

    ...(values.difficultCircumstances
      ? {
          difficultCircumstances:
            values.difficultCircumstances,
        }
      : {}),

    ...(values.joinedOn
      ? { joinedOn: values.joinedOn }
      : {}),

    ...(values.notes ? { notes: values.notes } : {}),

    ...(hasGuardianInformation
      ? {
          guardian: {
            fullName: values.guardianName,
            relationship: values.guardianRelationship,
            phoneNumber: values.guardianPhone,
          },
        }
      : {}),

    ...(hasSecondaryGuardianInformation
      ? {
          secondaryGuardian: {
            fullName: values.secondaryGuardianName,
            relationship:
              values.secondaryGuardianRelationship,
            phoneNumber: values.secondaryGuardianPhone,
          },
        }
      : {}),
  }
}

function toStudentFormValues(
  student: StudentListItem,
): StudentFormValues {
  return {
    fullName: student.fullName,
    dateOfBirth: student.dateOfBirth ?? '',
    gender: student.gender,
    ethnicity: student.ethnicity ?? '',
    group: student.group ?? '',
    academicPerformance:
      student.academicPerformance ?? '',
    classDuty: student.classDuty ?? '',
    permanentAddress: student.permanentAddress ?? '',
    difficultCircumstances:
      student.difficultCircumstances ?? '',
    joinedOn: student.joinedOn ?? '',
    status: student.status,
    guardianName: student.guardian?.fullName ?? '',
    guardianRelationship: student.guardian?.relationship ?? '',
    guardianPhone: student.guardian?.phoneNumber ?? '',
    secondaryGuardianName:
      student.secondaryGuardian?.fullName ?? '',
    secondaryGuardianRelationship:
      student.secondaryGuardian?.relationship ?? '',
    secondaryGuardianPhone:
      student.secondaryGuardian?.phoneNumber ?? '',
    notes: student.notes ?? '',
  }
}

export function StudentsPage() {
  const { user } = useAuth()
  const excelFileInputRef = useRef<HTMLInputElement>(null)
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false)
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>('all')
  const [groupFilter, setGroupFilter] = useState<StudentGroupFilter>('all')
  const [performanceFilter, setPerformanceFilter] =
    useState<StudentPerformanceFilter>('all')
  const [genderFilter, setGenderFilter] =
    useState<StudentGenderFilter>('all')
  const [trackingFilter, setTrackingFilter] =
    useState<StudentTrackingFilter>('all')
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [isStudentsLoading, setIsStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState('')
  const [isSavingStudent, setIsSavingStudent] = useState(false)
  const [saveStudentError, setSaveStudentError] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null)
  const [deletingStudentId, setDeletingStudentId] =
    useState<string | null>(null)
  const [deleteStudentError, setDeleteStudentError] =
    useState('')
  const [studentPendingDeletion, setStudentPendingDeletion] =
    useState<StudentListItem | null>(null)
  const [visibleGuardianPhones, setVisibleGuardianPhones] =
    useState<Set<string>>(new Set())
  const [copiedPhoneStudentId, setCopiedPhoneStudentId] =
    useState<string | null>(null)
  const [isImportingExcel, setIsImportingExcel] =
    useState(false)
  const [isExportingExcel, setIsExportingExcel] =
    useState(false)
  const [excelError, setExcelError] = useState('')
  const [excelMessage, setExcelMessage] = useState('')

  useEffect(() => {
    setIsStudentsLoading(true)
    setStudentsError('')

    const unsubscribe = subscribeToStudents(
      (nextStudents) => {
        setStudents(nextStudents)
        setIsStudentsLoading(false)
      },
      () => {
        setStudentsError(
          'Không thể tải danh sách học sinh. Vui lòng tải lại trang.',
        )
        setIsStudentsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) return

    void removeLegacyStudentCodes().catch((error) => {
      console.warn('Không thể dọn dữ liệu mã học sinh cũ.', error)
    })
  }, [user])

  useEffect(() => {
    if (!isFilterPanelOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isFilterPanelOpen])

  function openStudentForm() {
    setSelectedStudent(null)
    setSaveStudentError('')
    setIsStudentFormOpen(true)
  }

  function openEditStudentForm(
    student: StudentListItem,
  ) {
    setSelectedStudent(student)
    setSaveStudentError('')
    setIsStudentFormOpen(true)
  }

  function closeStudentForm() {
    if (isSavingStudent) return

    setSaveStudentError('')
    setIsStudentFormOpen(false)
    setSelectedStudent(null)
  }

  async function saveStudent(values: StudentFormValues) {
    if (!user) {
      setSaveStudentError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      )
      return
    }

    setIsSavingStudent(true)
    setSaveStudentError('')

    try {
      const studentInput = toCreateStudentInput(values)

      if (selectedStudent) {
        await updateStudent(
          selectedStudent.id,
          studentInput,
          user.uid,
        )
      } else {
        await createStudent(studentInput, user.uid,)
      }

      resetFilters()
      setIsStudentFormOpen(false)
      setSelectedStudent(null)
    } catch {
      setSaveStudentError(
        selectedStudent ? 'Không thể cập nhật học sinh. Vui lòng kiểm tra kết nối và thử lại.'
        : 'Không thể lưu học sinh. Vui lòng kiểm tra kết nối và thử lại.',
      )
    } finally {
      setIsSavingStudent(false)
    }
  }

  const normalizedQuery = normalizeSearchText(searchQuery)

  const groupOptions = Array.from(
    students.reduce((groups, student) => {
      const groupKey = normalizeGroup(student.group)

      if (groupKey && !groups.has(groupKey)) {
        groups.set(groupKey, formatGroupLabel(student.group ?? groupKey))
      }

      return groups
    }, new Map<string, string>()),
  ).sort((first, second) =>
    first[1].localeCompare(second[1], 'vi', {
      numeric: true,
      sensitivity: 'base',
    }),
  )

  const filteredStudents = students.filter((student) => {
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter
    const matchesGroup =
      groupFilter === 'all' || normalizeGroup(student.group) === groupFilter
    const matchesPerformance =
      performanceFilter === 'all' ||
      (performanceFilter === 'unrated'
        ? !student.academicPerformance
        : student.academicPerformance === performanceFilter)
    const matchesGender =
      genderFilter === 'all' || student.gender === genderFilter
    const matchesTracking =
      trackingFilter === 'all' ||
      (trackingFilter === 'class-duty' && Boolean(student.classDuty)) ||
      (trackingFilter === 'difficult-circumstances' &&
        Boolean(student.difficultCircumstances)) ||
      (trackingFilter === 'missing-guardian-phone' &&
        !student.guardian?.phoneNumber)

    const searchableText = normalizeSearchText(
      [
        student.fullName,
        student.guardian?.fullName,
        student.guardian?.phoneNumber,
        student.secondaryGuardian?.fullName,
        student.secondaryGuardian?.phoneNumber,
      ]
        .filter(Boolean)
        .join(' '),
    )

    const matchesSearch = searchableText.includes(normalizedQuery)

    return (
      matchesStatus &&
      matchesGroup &&
      matchesPerformance &&
      matchesGender &&
      matchesTracking &&
      matchesSearch
    )
  })

  const additionalFilterCount = [
    groupFilter,
    performanceFilter,
    genderFilter,
    trackingFilter,
  ].filter((value) => value !== 'all').length
  const isFiltering =
    normalizedQuery !== '' ||
    statusFilter !== 'all' ||
    additionalFilterCount > 0

  function resetFilters() {
    setSearchQuery('')
    setStatusFilter('all')
    setGroupFilter('all')
    setPerformanceFilter('all')
    setGenderFilter('all')
    setTrackingFilter('all')
  }

  function requestStudentDeletion(student: StudentListItem) {
    setDeleteStudentError('')
    setStudentPendingDeletion(student)
  }

  function closeDeleteDialog() {
    if (deletingStudentId) return

    setDeleteStudentError('')
    setStudentPendingDeletion(null)
  }

  async function confirmStudentDeletion() {
    const student = studentPendingDeletion

    if (!student) return

    if (!user) {
      setDeleteStudentError(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      )
      return
    }

    setDeletingStudentId(student.id)
    setDeleteStudentError('')

    try {
      await deleteStudent(student.id)
      setVisibleGuardianPhones((currentIds) => {
        const nextIds = new Set(currentIds)
        nextIds.delete(student.id)
        return nextIds
      })
      setStudentPendingDeletion(null)
    } catch {
      setDeleteStudentError(
        'Không thể xóa học sinh. Vui lòng kiểm tra kết nối và thử lại.',
      )
    } finally {
      setDeletingStudentId(null)
    }
  }

  function toggleGuardianPhone(studentId: string) {
    setCopiedPhoneStudentId(null)
    setVisibleGuardianPhones((currentIds) => {
      const nextIds = new Set(currentIds)

      if (nextIds.has(studentId)) {
        nextIds.delete(studentId)
      } else {
        nextIds.add(studentId)
      }

      return nextIds
    })
  }

  async function copyGuardianPhone(
    studentId: string,
    phoneNumber: string,
  ) {
    try {
      await navigator.clipboard.writeText(phoneNumber)
      setCopiedPhoneStudentId(studentId)
      window.setTimeout(() => {
        setCopiedPhoneStudentId((currentId) =>
          currentId === studentId ? null : currentId,
        )
      }, 1_600)
    } catch {
      setCopiedPhoneStudentId(null)
    }
  }

  async function exportExcel() {
    setIsExportingExcel(true)
    setExcelError('')
    setExcelMessage('')

    try {
      await exportStudentsToExcel(students)
      setExcelMessage(
        `Đã xuất ${students.length} học sinh ra tệp Excel.`,
      )
    } catch {
      setExcelError(
        'Không thể xuất tệp Excel. Vui lòng thử lại.',
      )
    } finally {
      setIsExportingExcel(false)
    }
  }

  async function importExcel(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!user) {
      setExcelError(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      )
      return
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setExcelError('Vui lòng chọn tệp Excel định dạng .xlsx.')
      return
    }

    setIsImportingExcel(true)
    setExcelError('')
    setExcelMessage('')

    try {
      const importedStudents = await parseStudentsFromExcel(file)
      const isConfirmed = window.confirm(
        `Tệp có ${importedStudents.length} học sinh. Hồ sơ trùng khớp sẽ được cập nhật, học sinh mới sẽ được thêm. Bạn có muốn tiếp tục?`,
      )

      if (!isConfirmed) return

      const result = await importStudents(
        importedStudents,
        user.uid,
      )

      resetFilters()
      setExcelMessage(
        `Đã nhập Excel thành công: thêm ${result.created}, cập nhật ${result.updated} học sinh.`,
      )
    } catch (error) {
      setExcelError(
        error instanceof Error
          ? error.message
          : 'Không thể đọc tệp Excel. Vui lòng kiểm tra tệp và thử lại.',
      )
    } finally {
      setIsImportingExcel(false)
    }
  }

  return (
    <main className="p-5 md:p-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-lotus-600">
            Quản lý lớp học
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            Danh sách học sinh
          </h2>

          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            Quản lý thông tin và trạng thái học tập của học sinh
            lớp 5.15.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <input
            ref={excelFileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={importExcel}
            aria-label="Chọn tệp Excel danh sách học sinh"
          />

          <button
            type="button"
            disabled={isImportingExcel || isExportingExcel}
            onClick={() => excelFileInputRef.current?.click()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 text-sm font-semibold text-lotus-700 transition hover:bg-lotus-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isImportingExcel ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={18}
              />
            ) : (
              <Upload aria-hidden="true" size={18} />
            )}
            {isImportingExcel ? 'Đang nhập...' : 'Nhập Excel'}
          </button>

          <button
            type="button"
            disabled={isImportingExcel || isExportingExcel}
            onClick={exportExcel}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 text-sm font-semibold text-lotus-700 transition hover:bg-lotus-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExportingExcel ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={18}
              />
            ) : (
              <Download aria-hidden="true" size={18} />
            )}
            {isExportingExcel ? 'Đang xuất...' : 'Xuất Excel'}
          </button>

          <button
            type="button"
            onClick={openStudentForm}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-lotus-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-lotus-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lotus-600"
          >
            <Plus aria-hidden="true" size={19} />
            Thêm học sinh
          </button>
        </div>
      </section>

      {excelMessage && (
        <p
          role="status"
          className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {excelMessage}
        </p>
      )}

      {excelError && (
        <p
          role="alert"
          className="mt-6 whitespace-pre-line rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {excelError}
        </p>
      )}

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              aria-hidden="true"
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              placeholder="Tìm tên học sinh, người giám hộ hoặc số điện thoại..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lotus-400 focus:bg-white focus:ring-4 focus:ring-pink-100"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label='Tìm kiếm học sinh'
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label
              htmlFor="student-status-filter"
              className="text-sm font-medium text-slate-600"
            >
              Trạng thái
            </label>

            <select
              id="student-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StudentStatusFilter,)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang học</option>
              <option value="transferred">Đã chuyển trường</option>
              <option value="inactive">Ngừng học</option>
            </select>

            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(true)}
              className="relative inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-pink-200 hover:bg-lotus-50 hover:text-lotus-700"
              aria-expanded={isFilterPanelOpen}
              aria-controls="student-filter-panel"
            >
              <SlidersHorizontal aria-hidden="true" size={18} />
              Bộ lọc
              {additionalFilterCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-lotus-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {additionalFilterCount}
                </span>
              ) : null}
            </button>

            <span className="rounded-full bg-lotus-50 px-3 py-2 text-center text-xs font-semibold text-lotus-700">
              {isFiltering ? `${filteredStudents.length}/${students.length} học sinh` : `${students.length} học sinh`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="w-20 px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  STT
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Họ và tên
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tổ
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Học lực
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  SĐT người giám hộ
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Trạng thái
                </th>

                <th className="w-32 px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {isStudentsLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16">
                    <div
                      role="status"
                      className="flex items-center justify-center gap-3 text-sm font-medium text-lotus-700"
                    >
                      <LoaderCircle
                        aria-hidden="true"
                        className="animate-spin"
                        size={21}
                      />
                      Đang tải danh sách học sinh...
                    </div>
                  </td>
                </tr>
              ) : studentsError ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16">
                    <div
                      role="alert"
                      className="mx-auto flex max-w-md flex-col items-center text-center"
                    >
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <AlertTriangle
                          aria-hidden="true"
                          size={27}
                        />
                      </div>

                      <p className="mt-4 text-sm font-medium text-red-700">
                        {studentsError}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16">
                    <div className="mx-auto flex max-w-md flex-col items-center text-center">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
                        <UsersRound
                          aria-hidden="true"
                          size={30}
                          strokeWidth={1.7}
                        />
                      </div>

                      <h3 className='mt-5 text-lg font-bold text-slate-900'>
                        {students.length === 0 ? 'Chưa có học sinh' : 'Không tìm thấy học sinh'} 
                      </h3>

                      <p className='mt-2 text-sm leading-6 text-slate-500'>
                        {students.length === 0 ? 'Thêm học sinh đầu tiên để bắt đầu quản lý danh sách, điểm danh và gọi kiểm tra bài cũ.' : 'Không có học sinh phù hợp với từ khóa hoặc trạng thái đã chọn.'}
                      </p>

                      {students.length === 0 ? (
                        <button
                          type='button'
                          onClick={openStudentForm}
                          className='mt-5 flex items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-semibold text-lotus-700 transition hover:bg-lotus-50'>
                            <UserPlus aria-hidden="true" size={18} />
                              Thêm học sinh đầu tiên
                          </button>
                      ) : (
                        <button
                          type='button'
                          onClick={resetFilters}
                          className='mt-5 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-semibold text-lotus-700 transition hover:bg-lotus-50'>
                            Xóa tìm kiếm và bộ lọc
                          </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`border-b border-slate-100 transition last:border-b-0 ${
                      student.classDuty
                        ? 'bg-lotus-50/50 hover:bg-lotus-50/70'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lotus-50 text-sm font-bold text-lotus-700">
                          {student.fullName.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={`font-semibold ${
                                student.classDuty
                                  ? 'text-lotus-700'
                                  : 'text-slate-900'
                              }`}
                            >
                              {student.fullName}
                            </p>

                            {student.classDuty ? (
                              <span className="inline-flex rounded-full bg-lotus-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                                {student.classDuty}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {student.dateOfBirth
                              ? formatPartialDateForDisplay(
                                  student.dateOfBirth,
                                )
                              : 'Chưa có ngày sinh'}
                          </p>

                          {student.difficultCircumstances ? (
                            <span
                              className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700"
                              title={student.difficultCircumstances}
                            >
                              <AlertTriangle
                                aria-hidden="true"
                                size={12}
                              />
                              Hoàn cảnh khó khăn
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {student.group || '—'}
                    </td>

                    <td className="px-5 py-4">
                      {student.academicPerformance ? (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${academicPerformanceStyles[student.academicPerformance]}`}
                        >
                          {academicPerformanceLabels[
                            student.academicPerformance
                          ]}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Chưa đánh giá
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {student.guardian?.phoneNumber ? (
                        <div className="flex min-w-44 items-center gap-2">
                          <button
                            type="button"
                            disabled={!visibleGuardianPhones.has(student.id)}
                            onClick={() =>
                              void copyGuardianPhone(
                                student.id,
                                student.guardian?.phoneNumber ?? '',
                              )
                            }
                            className={`min-w-0 rounded-lg px-2 py-1 text-sm font-semibold transition ${
                              visibleGuardianPhones.has(student.id)
                                ? 'cursor-copy text-slate-700 hover:bg-lotus-50 hover:text-lotus-700'
                                : 'cursor-default text-slate-500'
                            }`}
                            title={
                              visibleGuardianPhones.has(student.id)
                                ? 'Nhấn để sao chép số điện thoại'
                                : undefined
                            }
                          >
                            {copiedPhoneStudentId === student.id ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                                <Check aria-hidden="true" size={15} />
                                Đã sao chép
                              </span>
                            ) : visibleGuardianPhones.has(student.id) ? (
                              student.guardian.phoneNumber
                            ) : (
                              maskPhoneNumber(student.guardian.phoneNumber)
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleGuardianPhone(student.id)}
                            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-lotus-50 hover:text-lotus-700"
                            aria-label={
                              visibleGuardianPhones.has(student.id)
                                ? `Ẩn số điện thoại người giám hộ của ${student.fullName}`
                                : `Hiện số điện thoại người giám hộ của ${student.fullName}`
                            }
                            title={
                              visibleGuardianPhones.has(student.id)
                                ? 'Ẩn số điện thoại'
                                : 'Hiện số điện thoại'
                            }
                          >
                            {visibleGuardianPhones.has(student.id) ? (
                              <EyeOff aria-hidden="true" size={18} />
                            ) : (
                              <Eye aria-hidden="true" size={18} />
                            )}
                          </button>

                          <a
                            href={`tel:${student.guardian.phoneNumber.replace(/[^\d+]/g, '')}`}
                            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                            aria-label={`Gọi cho người giám hộ của ${student.fullName}`}
                            title="Gọi người giám hộ"
                          >
                            <Phone aria-hidden="true" size={18} />
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[student.status]}`}
                      >
                        {statusLabels[student.status]}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditStudentForm(student)}
                          className="inline-flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-lotus-50 hover:text-lotus-700"
                          aria-label={`Chỉnh sửa ${student.fullName}`}
                          title="Chỉnh sửa học sinh"
                        >
                          <Pencil aria-hidden="true" size={18} />
                        </button>

                        <button
                          type="button"
                          disabled={deletingStudentId === student.id}
                          onClick={() => requestStudentDeletion(student)}
                          className="inline-flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={`Xóa ${student.fullName}`}
                          title="Xóa học sinh"
                        >
                          {deletingStudentId === student.id ? (
                            <LoaderCircle
                              aria-hidden="true"
                              className="animate-spin"
                              size={18}
                            />
                          ) : (
                            <Trash2 aria-hidden="true" size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isFilterPanelOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            aria-label="Đóng bộ lọc"
            onClick={() => setIsFilterPanelOpen(false)}
          />

          <section
            id="student-filter-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-filter-title"
            className="relative z-10 max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-lotus-600">
                  Danh sách học sinh
                </p>
                <h3
                  id="student-filter-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Bộ lọc nâng cao
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(false)}
                className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Đóng bộ lọc"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </header>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <label className="text-sm font-medium text-slate-700">
                Tổ
                <select
                  value={groupFilter}
                  onChange={(event) => setGroupFilter(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
                >
                  <option value="all">Tất cả các tổ</option>
                  {groupOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Học lực theo dõi
                <select
                  value={performanceFilter}
                  onChange={(event) =>
                    setPerformanceFilter(
                      event.target.value as StudentPerformanceFilter,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
                >
                  <option value="all">Tất cả mức học lực</option>
                  <option value="unrated">Chưa đánh giá</option>
                  <option value="weak">Yếu</option>
                  <option value="average">Trung bình</option>
                  <option value="good">Khá</option>
                  <option value="excellent">Giỏi</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Giới tính
                <select
                  value={genderFilter}
                  onChange={(event) =>
                    setGenderFilter(
                      event.target.value as StudentGenderFilter,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
                >
                  <option value="all">Tất cả giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                  <option value="unspecified">Chưa xác định</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Nhóm cần theo dõi
                <select
                  value={trackingFilter}
                  onChange={(event) =>
                    setTrackingFilter(
                      event.target.value as StudentTrackingFilter,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-lotus-400 focus:ring-4 focus:ring-pink-100"
                >
                  <option value="all">Tất cả học sinh</option>
                  <option value="class-duty">Có chức vụ trong lớp</option>
                  <option value="difficult-circumstances">
                    Có hoàn cảnh khó khăn
                  </option>
                  <option value="missing-guardian-phone">
                    Chưa có SĐT người giám hộ
                  </option>
                </select>
              </label>
            </div>

            <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <button
                type="button"
                onClick={resetFilters}
                disabled={!isFiltering}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Xóa tất cả bộ lọc
              </button>

              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(false)}
                className="h-11 rounded-xl bg-lotus-600 px-5 text-sm font-semibold text-white transition hover:bg-lotus-700"
              >
                Xem {filteredStudents.length} học sinh
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      <StudentFormModal
        key={selectedStudent?.id ?? 'new-student'}
        isOpen={isStudentFormOpen}
        mode={selectedStudent ? 'edit' : 'create'}
        initialValues={
          selectedStudent ? toStudentFormValues(selectedStudent) : {}
        }
        isSubmitting={isSavingStudent}
        errorMessage={saveStudentError}
        onClose={closeStudentForm}
        onSubmit={saveStudent} />

      <ConfirmDialog
        isOpen={Boolean(studentPendingDeletion)}
        title="Xóa học sinh?"
        description={
          studentPendingDeletion
            ? `Bạn sắp xóa “${studentPendingDeletion.fullName}” khỏi danh sách lớp. Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa học sinh"
        isConfirming={Boolean(deletingStudentId)}
        errorMessage={deleteStudentError}
        onClose={closeDeleteDialog}
        onConfirm={confirmStudentDeletion}
      />
    </main>
  )
}

