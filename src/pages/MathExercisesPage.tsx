import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  EyeOff,
  History,
  LoaderCircle,
  Printer,
  Sparkles,
} from 'lucide-react'

import { useAuth } from '../auth/AuthProvider'
import type {
  MathDifficulty,
  MathExerciseTopicId,
  MathSemester,
} from '../domain'
import {
  generateMathExerciseSet,
  MATH_DIFFICULTY_LABELS,
  MATH_SEMESTER_LABELS,
  topicsForSemester,
} from '../features/math-exercises/generator'
import {
  createMathExerciseSet,
  subscribeToMathExerciseSets,
  type MathExerciseSetListItem,
} from '../infrastructure/firestore'

type PrintMode = 'questions' | 'solutions' | null

function formatCreatedTime(exerciseSet: MathExerciseSetListItem) {
  if (!exerciseSet.createdAt?.seconds) return 'Vừa tạo'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(exerciseSet.createdAt.seconds * 1_000))
}

export function MathExercisesPage() {
  const { user } = useAuth()
  const [exerciseSets, setExerciseSets] = useState<
    MathExerciseSetListItem[]
  >([])
  const [semester, setSemester] =
    useState<MathSemester>('semester_1')
  const [topicId, setTopicId] =
    useState<MathExerciseTopicId>('mixed')
  const [difficulty, setDifficulty] =
    useState<MathDifficulty>('basic')
  const [questionCount, setQuestionCount] = useState(5)
  const [selectedSetId, setSelectedSetId] = useState('')
  const [revealedSolutions, setRevealedSolutions] = useState<
    Set<string>
  >(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [printMode, setPrintMode] = useState<PrintMode>(null)

  useEffect(() => {
    const unsubscribe = subscribeToMathExerciseSets(
      (nextExerciseSets) => {
        setExerciseSets(nextExerciseSets)
        setSelectedSetId((currentId) =>
          currentId || nextExerciseSets[0]?.id || '',
        )
        setIsLoading(false)
      },
      () => {
        setError(
          'Không thể tải kho đề Toán. Vui lòng kiểm tra kết nối và tải lại trang.',
        )
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    const clearPrintMode = () => setPrintMode(null)

    window.addEventListener('afterprint', clearPrintMode)

    return () => window.removeEventListener('afterprint', clearPrintMode)
  }, [])

  const topicOptions = useMemo(
    () => topicsForSemester(semester),
    [semester],
  )
  const selectedSet = useMemo(
    () =>
      exerciseSets.find(
        (exerciseSet) => exerciseSet.id === selectedSetId,
      ) ?? exerciseSets[0],
    [exerciseSets, selectedSetId],
  )
  const allSolutionsRevealed = Boolean(
    selectedSet &&
      selectedSet.questions.length > 0 &&
      selectedSet.questions.every((question) =>
        revealedSolutions.has(question.id),
      ),
  )

  function changeSemester(nextSemester: MathSemester) {
    setSemester(nextSemester)
    setTopicId('mixed')
  }

  function selectExerciseSet(exerciseSetId: string) {
    setSelectedSetId(exerciseSetId)
    setRevealedSolutions(new Set())
    setError('')
    setMessage('')
  }

  function toggleSolution(questionId: string) {
    setRevealedSolutions((currentSolutions) => {
      const nextSolutions = new Set(currentSolutions)

      if (nextSolutions.has(questionId)) {
        nextSolutions.delete(questionId)
      } else {
        nextSolutions.add(questionId)
      }

      return nextSolutions
    })
  }

  function toggleAllSolutions() {
    if (!selectedSet) return

    setRevealedSolutions(
      allSolutionsRevealed
        ? new Set()
        : new Set(
            selectedSet.questions.map((question) => question.id),
          ),
    )
  }

  async function generateAndSaveExerciseSet() {
    if (!user || isGenerating) return

    setIsGenerating(true)
    setError('')
    setMessage('')

    try {
      const usedQuestionSignatures = exerciseSets.flatMap(
        (exerciseSet) =>
          exerciseSet.questions.map((question) => question.signature),
      )
      const exerciseSet = generateMathExerciseSet({
        semester,
        topicId,
        difficulty,
        questionCount,
        usedQuestionSignatures,
      })
      const exerciseSetId = await createMathExerciseSet(
        exerciseSet,
        user.uid,
      )

      setSelectedSetId(exerciseSetId)
      setRevealedSolutions(new Set())
      setMessage(
        'Đã tạo và lưu đề mới. Thành viên còn lại có thể xem ngay.',
      )
    } catch (generationError) {
      setError(
        generationError instanceof Error &&
          generationError.message === 'NOT_ENOUGH_UNIQUE_QUESTIONS'
          ? 'Kho số liệu cho dạng bài này đã được dùng nhiều lần. Hãy đổi dạng bài hoặc mức độ.'
          : 'Không thể tạo và lưu đề Toán. Vui lòng thử lại.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  function printExerciseSet(mode: Exclude<PrintMode, null>) {
    if (!selectedSet) return

    setPrintMode(mode)
    window.setTimeout(() => window.print(), 0)
  }

  return (
    <main className="p-4 md:p-8">
      <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-lotus-600">
          BÀI TẬP TOÁN LỚP 5
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Tạo đề và lời giải
        </h2>
        <p className="mt-2 max-w-3xl leading-7 text-slate-600">
          Chọn học kỳ và dạng bài để tạo đề mới. Mỗi đề được lưu vào kho
          chung và tránh lặp lại các câu đã dùng gần đây.
        </p>
      </section>

      {error ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertTriangle className="mt-0.5 shrink-0" size={19} />
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="shrink-0" size={19} />
          {message}
        </div>
      ) : null}

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-700">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Tạo đề mới</h3>
                <p className="text-sm text-slate-500">
                  Thiết lập nội dung phù hợp với tiết học.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Học kỳ
                <select
                  value={semester}
                  onChange={(event) =>
                    changeSemester(event.target.value as MathSemester)
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-lotus-400"
                >
                  <option value="semester_1">Học kỳ 1</option>
                  <option value="semester_2">Học kỳ 2</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Dạng bài
                <select
                  value={topicId}
                  onChange={(event) =>
                    setTopicId(
                      event.target.value as MathExerciseTopicId,
                    )
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-lotus-400"
                >
                  {topicOptions.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Mức độ
                <select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(
                      event.target.value as MathDifficulty,
                    )
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-lotus-400"
                >
                  <option value="basic">Cơ bản</option>
                  <option value="applied">Vận dụng</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Số câu
                <select
                  value={questionCount}
                  onChange={(event) =>
                    setQuestionCount(Number(event.target.value))
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-lotus-400"
                >
                  <option value={5}>5 câu</option>
                  <option value={10}>10 câu</option>
                  <option value={15}>15 câu</option>
                </select>
              </label>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              {topicOptions.find((topic) => topic.id === topicId)
                ?.description ?? ''}
            </div>

            <button
              type="button"
              disabled={isGenerating || isLoading}
              onClick={() => void generateAndSaveExerciseSet()}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lotus-600 px-5 font-semibold text-white shadow-lg shadow-lotus-200/50 transition hover:bg-lotus-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? (
                <LoaderCircle className="animate-spin" size={20} />
              ) : (
                <Sparkles size={20} />
              )}
              {isGenerating ? 'Đang tạo và lưu...' : 'Tạo và lưu đề mới'}
            </button>
          </section>

          {selectedSet ? (
            <section
              className={`math-print-area rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7 ${
                printMode === 'solutions' ? 'math-print-solutions' : ''
              }`}
            >
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-lotus-600">
                    TRƯỜNG TIỂU HỌC AN BÌNH · LỚP 5.15
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900 md:text-2xl">
                    {selectedSet.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-lotus-50 px-3 py-1 text-lotus-700">
                      {MATH_SEMESTER_LABELS[selectedSet.semester]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      {MATH_DIFFICULTY_LABELS[selectedSet.difficulty]}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                      {selectedSet.questionCount} câu
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Tạo bởi {selectedSet.createdByName} ·{' '}
                    {formatCreatedTime(selectedSet)}
                  </p>
                </div>

                <div className="math-screen-only flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleAllSolutions}
                    className="flex h-10 items-center gap-2 rounded-xl border border-pink-200 bg-white px-3 text-sm font-semibold text-lotus-700 transition hover:bg-lotus-50"
                  >
                    {allSolutionsRevealed ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                    {allSolutionsRevealed
                      ? 'Ẩn lời giải'
                      : 'Hiện lời giải'}
                  </button>
                  <button
                    type="button"
                    onClick={() => printExerciseSet('questions')}
                    className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Printer size={17} />
                    In đề
                  </button>
                  <button
                    type="button"
                    onClick={() => printExerciseSet('solutions')}
                    className="flex h-10 items-center gap-2 rounded-xl bg-lotus-600 px-3 text-sm font-semibold text-white transition hover:bg-lotus-700"
                  >
                    <BookOpenCheck size={17} />
                    In lời giải
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {selectedSet.questions.map((question, index) => {
                  const solutionIsRevealed = revealedSolutions.has(
                    question.id,
                  )

                  return (
                    <article
                      key={question.id}
                      className="math-question rounded-2xl border border-slate-200 p-4 md:p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-lotus-50 text-sm font-bold text-lotus-700">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-7 text-slate-900 md:text-base">
                            {question.prompt}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {question.topicLabel}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSolution(question.id)}
                        className="math-screen-only mt-4 flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        aria-expanded={solutionIsRevealed}
                      >
                        <span>
                          {solutionIsRevealed
                            ? 'Ẩn lời giải chi tiết'
                            : 'Xem lời giải chi tiết'}
                        </span>
                        {solutionIsRevealed ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>

                      <div
                        className={`math-solution mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 ${
                          solutionIsRevealed ? '' : 'hidden'
                        }`}
                      >
                        <p className="font-bold text-emerald-700">
                          Lời giải
                        </p>
                        <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                          {question.solutionSteps.map((step, stepIndex) => (
                            <li key={`${question.id}-${stepIndex}`}>
                              <span className="font-semibold">
                                Bước {stepIndex + 1}:
                              </span>{' '}
                              {step}
                            </li>
                          ))}
                        </ol>
                        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-900">
                          Đáp án: {question.answer}
                        </p>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ) : isLoading ? (
            <section className="grid min-h-72 place-items-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center gap-3 text-lotus-600">
                <LoaderCircle className="animate-spin" size={32} />
                <p className="text-sm font-semibold">Đang tải kho đề...</p>
              </div>
            </section>
          ) : (
            <section className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-pink-300 bg-lotus-50/50 p-6 text-center">
              <div>
                <BookOpenCheck
                  className="mx-auto text-lotus-600"
                  size={42}
                />
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Chưa có đề Toán nào
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Chọn nội dung ở trên và tạo đề đầu tiên.
                </p>
              </div>
            </section>
          )}
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-lotus-50 text-lotus-700">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Kho đề đã lưu</h3>
              <p className="text-sm text-slate-500">
                {exerciseSets.length} đề gần đây
              </p>
            </div>
          </div>

          <div className="mt-5 max-h-[42rem] space-y-3 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="flex justify-center py-10 text-lotus-600">
                <LoaderCircle className="animate-spin" size={26} />
              </div>
            ) : exerciseSets.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                Đề mới tạo sẽ xuất hiện tại đây.
              </div>
            ) : (
              exerciseSets.map((exerciseSet) => (
                <button
                  key={exerciseSet.id}
                  type="button"
                  onClick={() => selectExerciseSet(exerciseSet.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedSet?.id === exerciseSet.id
                      ? 'border-lotus-300 bg-lotus-50 ring-2 ring-pink-100'
                      : 'border-slate-200 bg-white hover:border-pink-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">
                      {exerciseSet.topicLabel}
                    </p>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                      {exerciseSet.questionCount} câu
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {MATH_SEMESTER_LABELS[exerciseSet.semester]} ·{' '}
                    {MATH_DIFFICULTY_LABELS[exerciseSet.difficulty]}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock3 size={13} />
                    {formatCreatedTime(exerciseSet)}
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-400">
                    {exerciseSet.createdByName}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}
