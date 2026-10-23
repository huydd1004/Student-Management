import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Handshake,
  LoaderCircle,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UsersRound,
} from 'lucide-react'

import { useAuth } from '../auth/AuthProvider'
import { ParentRepresentativeFormModal } from '../components/parent-representatives/ParentRepresentativeFormModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import {
  createParentRepresentative,
  deleteParentRepresentative,
  subscribeToParentRepresentatives,
  updateParentRepresentative,
  type ParentRepresentativeInput,
  type ParentRepresentativeListItem,
} from '../infrastructure/firestore'

export function ParentRepresentativesPage() {
  const { user } = useAuth()
  const [representatives, setRepresentatives] = useState<
    ParentRepresentativeListItem[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRepresentative, setSelectedRepresentative] =
    useState<ParentRepresentativeListItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [representativePendingDeletion, setRepresentativePendingDeletion] =
    useState<ParentRepresentativeListItem | null>(null)
  const [deletingRepresentativeId, setDeletingRepresentativeId] =
    useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToParentRepresentatives(
      (nextRepresentatives) => {
        setRepresentatives(nextRepresentatives)
        setIsLoading(false)
      },
      () => {
        setLoadError(
          'Không thể tải danh sách ban đại diện phụ huynh. Vui lòng tải lại trang.',
        )
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  function openCreateForm() {
    setSelectedRepresentative(null)
    setSaveError('')
    setIsFormOpen(true)
  }

  function openEditForm(
    representative: ParentRepresentativeListItem,
  ) {
    setSelectedRepresentative(representative)
    setSaveError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) return

    setIsFormOpen(false)
    setSelectedRepresentative(null)
    setSaveError('')
  }

  async function saveRepresentative(
    values: ParentRepresentativeInput,
  ) {
    if (!user) {
      setSaveError(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      )
      return
    }

    setIsSaving(true)
    setSaveError('')

    try {
      if (selectedRepresentative) {
        await updateParentRepresentative(
          selectedRepresentative.id,
          values,
          user.uid,
        )
      } else {
        await createParentRepresentative(values, user.uid)
      }

      setIsFormOpen(false)
      setSelectedRepresentative(null)
    } catch {
      setSaveError(
        selectedRepresentative
          ? 'Không thể cập nhật thành viên. Vui lòng thử lại.'
          : 'Không thể thêm thành viên. Vui lòng thử lại.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function requestDeletion(
    representative: ParentRepresentativeListItem,
  ) {
    setDeleteError('')
    setRepresentativePendingDeletion(representative)
  }

  function closeDeleteDialog() {
    if (deletingRepresentativeId) return

    setDeleteError('')
    setRepresentativePendingDeletion(null)
  }

  async function confirmDeletion() {
    const representative = representativePendingDeletion

    if (!representative) return

    setDeletingRepresentativeId(representative.id)
    setDeleteError('')

    try {
      await deleteParentRepresentative(representative.id)
      setRepresentativePendingDeletion(null)
    } catch {
      setDeleteError(
        'Không thể xóa thành viên. Vui lòng kiểm tra kết nối và thử lại.',
      )
    } finally {
      setDeletingRepresentativeId(null)
    }
  }

  return (
    <main className="p-5 md:p-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-lotus-600">
            Kết nối gia đình và nhà trường
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            Ban đại diện phụ huynh học sinh
          </h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            Quản lý thông tin liên hệ và chức vụ của ban đại diện phụ
            huynh lớp 5.15.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-lotus-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-lotus-700"
        >
          <Plus aria-hidden="true" size={19} />
          Thêm thành viên
        </button>
      </section>

      {loadError ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={18}
          />
          {loadError}
        </p>
      ) : null}

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
              <Handshake aria-hidden="true" size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Danh sách thành viên</h3>
              <p className="text-sm text-slate-500">
                {representatives.length} thành viên
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="w-20 px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  STT
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Họ và tên
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Chức vụ
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Điện thoại
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Địa chỉ
                </th>
                <th className="w-28 px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16">
                    <div className="flex items-center justify-center gap-3 text-sm font-semibold text-lotus-700">
                      <LoaderCircle
                        aria-hidden="true"
                        className="animate-spin"
                        size={22}
                      />
                      Đang tải danh sách...
                    </div>
                  </td>
                </tr>
              ) : representatives.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16">
                    <div className="mx-auto max-w-md text-center">
                      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
                        <UsersRound aria-hidden="true" size={30} />
                      </div>
                      <h3 className="mt-5 text-lg font-bold text-slate-900">
                        Chưa có thành viên
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Thêm người đầu tiên vào ban đại diện phụ huynh của lớp.
                      </p>
                      <button
                        type="button"
                        onClick={openCreateForm}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-semibold text-lotus-700 transition hover:bg-lotus-50"
                      >
                        <Plus aria-hidden="true" size={18} />
                        Thêm thành viên đầu tiên
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                representatives.map((representative, index) => (
                  <tr
                    key={representative.id}
                    className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {representative.fullName}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-lotus-50 px-3 py-1 text-xs font-bold text-lotus-700">
                        {representative.position}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={`tel:${representative.phoneNumber}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-lotus-700"
                      >
                        <Phone aria-hidden="true" size={16} />
                        {representative.phoneNumber}
                      </a>
                    </td>
                    <td className="max-w-sm px-5 py-4 text-sm leading-6 text-slate-600">
                      <span className="inline-flex items-start gap-2">
                        <MapPin
                          aria-hidden="true"
                          className="mt-1 shrink-0 text-slate-400"
                          size={15}
                        />
                        {representative.address || 'Chưa cập nhật'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(representative)}
                          className="inline-flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-lotus-50 hover:text-lotus-700"
                          aria-label={`Chỉnh sửa ${representative.fullName}`}
                          title="Chỉnh sửa"
                        >
                          <Pencil aria-hidden="true" size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDeletion(representative)}
                          className="inline-flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Xóa ${representative.fullName}`}
                          title="Xóa thành viên"
                        >
                          <Trash2 aria-hidden="true" size={18} />
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

      <ParentRepresentativeFormModal
        key={selectedRepresentative?.id ?? 'new-representative'}
        isOpen={isFormOpen}
        mode={selectedRepresentative ? 'edit' : 'create'}
        initialValues={selectedRepresentative ?? {}}
        isSubmitting={isSaving}
        errorMessage={saveError}
        onClose={closeForm}
        onSubmit={saveRepresentative}
      />

      <ConfirmDialog
        isOpen={Boolean(representativePendingDeletion)}
        title="Xóa thành viên ban đại diện?"
        description={
          representativePendingDeletion
            ? `Bạn sắp xóa “${representativePendingDeletion.fullName}” khỏi danh sách ban đại diện phụ huynh.`
            : ''
        }
        confirmLabel="Xóa thành viên"
        isConfirming={Boolean(deletingRepresentativeId)}
        errorMessage={deleteError}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeletion}
      />
    </main>
  )
}
