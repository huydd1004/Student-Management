import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  AlertTriangle,
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  UserPlus,
  UsersRound,
} from 'lucide-react'

import { useAuth } from '../auth/AuthProvider'
import { StudentFormModal } from '../components/students/StudentFormModal'
import type { StudentFormValues } from '../components/students/StudentFormModal'
import {
  exportStudentsToExcel,
  parseStudentsFromExcel,
} from '../features/students/studentExcel'
import {
  createStudent,
  deleteStudent,
  importStudents,
  subscribeToStudents,
  updateStudent,
  type CreateStudentInput,
  type StudentListItem,
} from '../infrastructure/firestore'

type StudentStatusFilter = 'all' | StudentFormValues['status']

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

function toCreateStudentInput(
  values: StudentFormValues,
): CreateStudentInput {
  const hasGuardianInformation = Boolean(
    values.guardianName ||
      values.guardianRelationship ||
      values.guardianPhone,
  )

  return {
    studentCode: values.studentCode,
    fullName: values.fullName,
    gender: values.gender,
    status: values.status,

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
  }
}

function toStudentFormValues(
  student: StudentListItem,
): StudentFormValues {
  return {
    studentCode: student.studentCode,
    fullName: student.fullName,
    dateOfBirth: student.dateOfBirth ?? '',
    gender: student.gender,
    group: student.group ?? '',
    academicPerformance:
      student.academicPerformance ?? '',
    classDuty: student.classDuty ?? '',
    joinedOn: student.joinedOn ?? '',
    status: student.status,
    guardianName: student.guardian?.fullName ?? '',
    guardianRelationship: student.guardian?.relationship ?? '',
    guardianPhone: student.guardian?.phoneNumber ?? '',
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
  const [isStudentsLoading, setIsStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState('')
  const [isSavingStudent, setIsSavingStudent] = useState(false)
  const [saveStudentError, setSaveStudentError] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null)
  const [deletingStudentId, setDeletingStudentId] =
    useState<string | null>(null)
  const [deleteStudentError, setDeleteStudentError] =
    useState('')
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

  async function saveStudent(values:StudentFormValues,

  ) {
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

      setSearchQuery('')
      setStatusFilter('all')
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

  const filteredStudents = students.filter((student) => {
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter

    const searchableText = normalizeSearchText(`${student.fullName} ${student.studentCode}`,)

    const matchesSearch = searchableText.includes(normalizedQuery)

    return matchesStatus && matchesSearch
  })

  const isFiltering = normalizedQuery !== '' || statusFilter !== 'all'

  function resetFilters() {
    setSearchQuery('')
    setStatusFilter('all')
  }

  async function removeStudent(student: StudentListItem) {
    if (!user) {
      setDeleteStudentError(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      )
      return
    }

    const isConfirmed = window.confirm(
      `Bạn có chắc muốn xóa học sinh “${student.fullName}”? Dữ liệu học sinh và lịch sử điểm danh liên quan sẽ bị xóa.`,
    )

    if (!isConfirmed) return

    setDeletingStudentId(student.id)
    setDeleteStudentError('')

    try {
      await deleteStudent(student.id)
    } catch {
      setDeleteStudentError(
        'Không thể xóa học sinh. Vui lòng kiểm tra kết nối và thử lại.',
      )
    } finally {
      setDeletingStudentId(null)
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
        `Tệp có ${importedStudents.length} học sinh. Mã học sinh đã tồn tại sẽ được cập nhật, mã mới sẽ được thêm. Bạn có muốn tiếp tục?`,
      )

      if (!isConfirmed) return

      const result = await importStudents(
        importedStudents,
        user.uid,
      )

      setSearchQuery('')
      setStatusFilter('all')
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

      {deleteStudentError && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {deleteStudentError}
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
              placeholder="Tìm theo tên hoặc mã học sinh..."
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

            <span className="rounded-full bg-lotus-50 px-3 py-2 text-center text-xs font-semibold text-lotus-700">
              {isFiltering ? `${filteredStudents.length}/${students.length} học sinh` : `${students.length} học sinh`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="w-20 px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  STT
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Họ và tên
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Mã học sinh
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tổ
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Học lực
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
                    className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lotus-50 text-sm font-bold text-lotus-700">
                          {student.fullName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {student.fullName}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {student.dateOfBirth || 'Chưa có ngày sinh'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-700">
                      {student.studentCode}
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
                          onClick={() => removeStudent(student)}
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
    </main>
  )
}

