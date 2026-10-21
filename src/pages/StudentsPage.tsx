import { useState } from 'react'

import {
  MoreHorizontal,
  Plus,
  Search,
  UserPlus,
  UsersRound,
} from 'lucide-react'

import { StudentFormModal } from '../components/students/StudentFormModal'
import type { StudentFormValues } from '../components/students/StudentFormModal'

type StudentListItem = StudentFormValues & {
  id: string
}

type StudentStatusFilter = | 'all' | StudentFormValues['status']

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

function createStudentId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function normalizeSearchText(value: string) {
  return value 
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
}

export function StudentsPage() {
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false)
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>('all')

  function openStudentForm() {
    setIsStudentFormOpen(true)
  }

  function closeStudentForm() {
    setIsStudentFormOpen(false)
  }

  function addStudent(values: StudentFormValues) {
    setStudents((currentStudents) => [
      ...currentStudents,
      {
        ...values,
        id: createStudentId(),
      },
    ])
    
    setSearchQuery('')
    setStatusFilter('all')
    closeStudentForm()
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

        <button
          type="button"
          onClick={openStudentForm}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-lotus-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-lotus-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lotus-600"
        >
          <Plus aria-hidden="true" size={19} />
          Thêm học sinh
        </button>
      </section>

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
          <table className="w-full min-w-[760px] border-collapse">
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
                  Trạng thái
                </th>

                <th className="w-28 px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16">
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
                        {students.length === 0 ? 'Thêm học sinh đầu tiên để bắt đầu quản lý danh sách, điểm danh vào gọi kiểm tra bài cũ.' : 'Không có học sinh phù hợp với từ quá hoặc trạng thái đã chọn.'}
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
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[student.status]}`}
                      >
                        {statusLabels[student.status]}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="inline-flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-lotus-50 hover:text-lotus-700"
                        aria-label={`Mở thao tác cho ${student.fullName}`}
                      >
                        <MoreHorizontal aria-hidden="true" size={19} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <StudentFormModal
        isOpen={isStudentFormOpen}
        onClose={closeStudentForm}
        onSubmit={addStudent}
      />
    </main>
  )
}

