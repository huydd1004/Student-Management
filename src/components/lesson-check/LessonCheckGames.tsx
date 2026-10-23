import { useMemo, useState } from 'react'
import {
  DoorOpen,
  Flag,
  Flower2,
  Gift,
  HandHeart,
  Map,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  UsersRound,
} from 'lucide-react'

import type { StudentListItem } from '../../infrastructure/firestore'

export type LessonGameId =
  | 'lotus-wheel'
  | 'mystery-doors'
  | 'lucky-gifts'
  | 'knowledge-race'
  | 'team-challenge'
  | 'treasure-hunt'

type LessonCheckGamesProps = {
  activeGame: LessonGameId
  eligibleStudents: StudentListItem[]
  currentStudent: StudentListItem | null
  selectionMeta: string
  isCalling: boolean
  remainingCount: number
  raceProgress: number
  treasureProgress: number
  onGameChange: (game: LessonGameId) => void
  onDrawStudents: (
    count: number,
    delayMs?: number,
  ) => Promise<StudentListItem[]>
  onResetCycle: () => void
}

const gameOptions = [
  {
    id: 'lotus-wheel',
    name: 'Vòng quay Hoa Sen',
    shortName: 'Vòng quay',
    description: 'Quay để chọn ngẫu nhiên một học sinh.',
    icon: Flower2,
    accent: 'from-pink-500 to-lotus-700',
  },
  {
    id: 'mystery-doors',
    name: 'Ô cửa bí mật',
    shortName: 'Ô cửa',
    description: 'Mỗi ô mở ra một hình thức trả bài.',
    icon: DoorOpen,
    accent: 'from-violet-500 to-purple-700',
  },
  {
    id: 'lucky-gifts',
    name: 'Hộp quà may mắn',
    shortName: 'Hộp quà',
    description: 'Nhận một quyền trợ giúp bất ngờ.',
    icon: Gift,
    accent: 'from-amber-400 to-orange-600',
  },
  {
    id: 'knowledge-race',
    name: 'Đường đua kiến thức',
    shortName: 'Đường đua',
    description: 'Cả lớp cùng hoàn thành tám chặng.',
    icon: Trophy,
    accent: 'from-sky-500 to-blue-700',
  },
  {
    id: 'team-challenge',
    name: 'Thử thách đồng đội',
    shortName: 'Đồng đội',
    description: 'Một học sinh trả lời cùng một bạn hỗ trợ.',
    icon: UsersRound,
    accent: 'from-emerald-500 to-teal-700',
  },
  {
    id: 'treasure-hunt',
    name: 'Truy tìm kho báu',
    shortName: 'Kho báu',
    description: 'Mỗi câu đúng mở thêm một điểm trên bản đồ.',
    icon: Map,
    accent: 'from-rose-500 to-red-700',
  },
] as const satisfies ReadonlyArray<{
  id: LessonGameId
  name: string
  shortName: string
  description: string
  icon: typeof Flower2
  accent: string
}>

const doorChallenges = [
  'Trả lời một câu hỏi miệng.',
  'Giải nhanh một bài trên bảng.',
  'Chọn đáp án đúng và giải thích.',
  'Nhận một gợi ý từ giáo viên.',
  'Được đổi sang câu hỏi khác.',
  'Mời một bạn bổ sung câu trả lời.',
  'Cả tổ cùng suy nghĩ trong 30 giây.',
  'Nêu một ví dụ liên quan đến bài học.',
  'Ô may mắn: chọn hình thức em tự tin nhất.',
]

const giftRewards = [
  'Quyền xem một gợi ý.',
  'Quyền đổi một câu hỏi.',
  'Mời một bạn đồng hành.',
  'Nhận 30 giây chuẩn bị.',
  'Được chọn câu dễ trước.',
  'Cả tổ được hỗ trợ một lần.',
]

const treasureLabels = [
  'Khởi hành',
  'Rừng xanh',
  'Cầu mây',
  'Hang đá',
  'Dòng suối',
  'Đồi gió',
  'Cổng vàng',
  'Kho báu',
]

function studentFirstName(fullName: string) {
  return fullName.trim().split(/\s+/).at(-1) ?? fullName
}

export function LessonCheckGames({
  activeGame,
  eligibleStudents,
  currentStudent,
  selectionMeta,
  isCalling,
  remainingCount,
  raceProgress,
  treasureProgress,
  onGameChange,
  onDrawStudents,
  onResetCycle,
}: LessonCheckGamesProps) {
  const [wheelRotation, setWheelRotation] = useState(0)
  const [revealedDoors, setRevealedDoors] = useState<Set<number>>(
    new Set(),
  )
  const [revealedGifts, setRevealedGifts] = useState<Set<number>>(
    new Set(),
  )
  const [activeChallenge, setActiveChallenge] = useState('')
  const [activeReward, setActiveReward] = useState('')
  const [teamStudents, setTeamStudents] = useState<StudentListItem[]>([])

  const wheelBackground = useMemo(
    () =>
      `conic-gradient(
        #c2185b 0deg 45deg,
        #f472a3 45deg 90deg,
        #8f164d 90deg 135deg,
        #f9a8d4 135deg 180deg,
        #be185d 180deg 225deg,
        #fbcfe8 225deg 270deg,
        #9d174d 270deg 315deg,
        #f472b6 315deg 360deg
      )`,
    [],
  )

  async function spinWheel() {
    const nextRotation =
      wheelRotation + 1440 + Math.floor(Math.random() * 360)
    setWheelRotation(nextRotation)
    await onDrawStudents(1, 2200)
  }

  async function openDoor(index: number) {
    if (revealedDoors.has(index)) return

    const selectedStudents = await onDrawStudents(1, 450)
    if (selectedStudents.length === 0) return

    setRevealedDoors((current) => new Set(current).add(index))
    setActiveChallenge(doorChallenges[index])
  }

  async function openGift(index: number) {
    if (revealedGifts.has(index)) return

    const selectedStudents = await onDrawStudents(1, 450)
    if (selectedStudents.length === 0) return

    setRevealedGifts((current) => new Set(current).add(index))
    setActiveReward(giftRewards[index])
  }

  async function startTeamChallenge() {
    const selectedStudents = await onDrawStudents(2, 700)
    setTeamStudents(selectedStudents)
  }

  function resetDoors() {
    setRevealedDoors(new Set())
    setActiveChallenge('')
  }

  function resetGifts() {
    setRevealedGifts(new Set())
    setActiveReward('')
  }

  const canPlay = eligibleStudents.length > 0 && !isCalling

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Chọn trò chơi
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Còn {remainingCount}/{eligibleStudents.length} học sinh chưa được gọi trong vòng này.
          </p>
        </div>

        <button
          type="button"
          disabled={isCalling}
          onClick={onResetCycle}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-pink-200 hover:bg-lotus-50 hover:text-lotus-700 disabled:opacity-50"
        >
          <RotateCcw aria-hidden="true" size={15} />
          Bắt đầu vòng mới
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {gameOptions.map((game) => {
          const Icon = game.icon
          const isActive = activeGame === game.id

          return (
            <button
              key={game.id}
              type="button"
              disabled={isCalling}
              onClick={() => onGameChange(game.id)}
              className={`group rounded-2xl border p-3 text-left transition sm:p-4 ${
                isActive
                  ? 'border-lotus-300 bg-lotus-50 shadow-sm ring-2 ring-pink-100'
                  : 'border-slate-200 bg-white hover:border-pink-200 hover:bg-slate-50'
              }`}
            >
              <div
                className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${game.accent}`}
              >
                <Icon aria-hidden="true" size={20} />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">
                {game.shortName}
              </p>
              <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">
                {game.description}
              </p>
            </button>
          )
        })}
      </div>

      <div className="lesson-game-stage mt-5 overflow-hidden rounded-3xl border border-pink-200 p-5 sm:p-6">
        {activeGame === 'lotus-wheel' ? (
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute left-1/2 top-[-12px] z-10 -translate-x-1/2 border-x-[12px] border-t-[20px] border-x-transparent border-t-lotus-800" />
              <div
                className="relative flex size-48 items-center justify-center rounded-full border-[10px] border-white shadow-xl sm:size-64"
                style={{
                  background: wheelBackground,
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isCalling
                    ? 'transform 2.2s cubic-bezier(0.16, 0.84, 0.28, 1)'
                    : 'none',
                }}
              >
                {Array.from({ length: 8 }, (_, index) => (
                  <Star
                    key={index}
                    aria-hidden="true"
                    size={19}
                    className="absolute text-white/90"
                    style={{
                      transform: `rotate(${index * 45}deg) translateY(-78px)`,
                    }}
                  />
                ))}
                <div className="flex size-20 items-center justify-center rounded-full border-4 border-white bg-lotus-600 text-white shadow-lg">
                  <Flower2 aria-hidden="true" size={34} />
                </div>
              </div>
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-900">
              Vòng quay Hoa Sen
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Vòng quay chọn công bằng trong {eligibleStudents.length} học sinh phù hợp.
            </p>
            <button
              type="button"
              disabled={!canPlay}
              onClick={() => void spinWheel()}
              className="mt-5 inline-flex h-12 min-w-48 items-center justify-center gap-2 rounded-xl bg-lotus-600 px-6 font-semibold text-white transition hover:bg-lotus-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles aria-hidden="true" size={20} />
              {isCalling ? 'Đang quay...' : 'Quay chọn học sinh'}
            </button>
          </div>
        ) : null}

        {activeGame === 'mystery-doors' ? (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Ô cửa bí mật
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Chọn một ô để gọi học sinh và mở thử thách.
                </p>
              </div>
              <button
                type="button"
                disabled={isCalling}
                onClick={resetDoors}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-lotus-50 hover:text-lotus-700"
                aria-label="Đóng lại tất cả ô cửa"
              >
                <RotateCcw aria-hidden="true" size={18} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {doorChallenges.map((challenge, index) => {
                const isRevealed = revealedDoors.has(index)
                return (
                  <button
                    key={challenge}
                    type="button"
                    disabled={!canPlay || isRevealed}
                    onClick={() => void openDoor(index)}
                    className={`aspect-square rounded-2xl border p-2 text-center transition sm:aspect-auto sm:min-h-28 ${
                      isRevealed
                        ? 'border-purple-200 bg-purple-50 text-purple-700'
                        : 'border-violet-300 bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {isRevealed ? (
                      <span className="text-xs font-semibold leading-5 sm:text-sm">
                        Đã mở
                      </span>
                    ) : (
                      <span className="flex flex-col items-center gap-1">
                        <DoorOpen aria-hidden="true" size={24} />
                        <span className="text-sm font-bold">Ô {index + 1}</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {activeChallenge ? (
              <div className="mt-5 rounded-2xl border border-purple-200 bg-purple-50 p-4 text-center text-sm font-semibold text-purple-800">
                {activeChallenge}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeGame === 'lucky-gifts' ? (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Hộp quà may mắn
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Mỗi hộp gọi một học sinh và trao một quyền trợ giúp.
                </p>
              </div>
              <button
                type="button"
                disabled={isCalling}
                onClick={resetGifts}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-lotus-50 hover:text-lotus-700"
                aria-label="Đóng lại tất cả hộp quà"
              >
                <RotateCcw aria-hidden="true" size={18} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {giftRewards.map((reward, index) => {
                const isRevealed = revealedGifts.has(index)
                return (
                  <button
                    key={reward}
                    type="button"
                    disabled={!canPlay || isRevealed}
                    onClick={() => void openGift(index)}
                    className={`min-h-28 rounded-2xl border p-3 text-center transition ${
                      isRevealed
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-orange-300 bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {isRevealed ? (
                      <span className="text-xs font-semibold leading-5">
                        Đã mở
                      </span>
                    ) : (
                      <span className="flex flex-col items-center gap-2">
                        <Gift aria-hidden="true" size={28} />
                        <span className="text-sm font-bold">Hộp {index + 1}</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {activeReward ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-semibold text-amber-800">
                {activeReward}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeGame === 'knowledge-race' ? (
          <div>
            <div className="text-center">
              <Trophy className="mx-auto text-sky-600" size={42} />
              <h3 className="mt-3 text-xl font-bold text-slate-900">
                Đường đua kiến thức
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Mỗi lượt hoàn thành giúp cả lớp tiến thêm một chặng.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                {Array.from({ length: 8 }, (_, index) => {
                  const isCompleted = index < raceProgress
                  return (
                    <div
                      key={index}
                      className={`relative z-10 mx-auto flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold sm:size-10 ${
                        isCompleted
                          ? 'border-sky-600 bg-sky-600 text-white'
                          : 'border-sky-300 bg-white text-sky-600'
                      }`}
                    >
                      {index === 7 ? <Flag size={16} /> : index + 1}
                    </div>
                  )
                })}
              </div>
              <p className="mt-4 text-center text-sm font-semibold text-sky-800">
                Đã hoàn thành {raceProgress}/8 chặng
              </p>
            </div>

            <button
              type="button"
              disabled={!canPlay}
              onClick={() => void onDrawStudents(1, 500)}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Flag aria-hidden="true" size={20} />
              {raceProgress >= 8 ? 'Chơi thêm một lượt' : 'Tiếp tục đường đua'}
            </button>
          </div>
        ) : null}

        {activeGame === 'team-challenge' ? (
          <div className="text-center">
            <UsersRound className="mx-auto text-emerald-600" size={44} />
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              Thử thách đồng đội
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Hệ thống chọn một học sinh trả lời và một bạn hỗ trợ.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[0, 1].map((index) => {
                const student = teamStudents[index]
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                  >
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                      {student
                        ? studentFirstName(student.fullName).charAt(0).toUpperCase()
                        : index + 1}
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      {index === 0 ? 'Người trả lời' : 'Bạn hỗ trợ'}
                    </p>
                    <p className="mt-1 font-bold text-slate-900">
                      {student?.fullName ?? 'Chưa chọn'}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-4 text-left text-sm text-slate-600">
              <HandHeart className="mt-0.5 shrink-0 text-emerald-600" size={20} />
              Hai em có 30–60 giây trao đổi. Chỉ học sinh thứ nhất được lưu vào lượt đánh giá.
            </div>

            <button
              type="button"
              disabled={!canPlay || eligibleStudents.length < 2}
              onClick={() => void startTeamChallenge()}
              className="mt-5 inline-flex h-12 min-w-52 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UsersRound aria-hidden="true" size={20} />
              Chọn cặp đồng đội
            </button>
          </div>
        ) : null}

        {activeGame === 'treasure-hunt' ? (
          <div>
            <div className="text-center">
              <Map className="mx-auto text-rose-600" size={44} />
              <h3 className="mt-3 text-xl font-bold text-slate-900">
                Truy tìm kho báu
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Hoàn thành câu trả lời để mở từng điểm trên bản đồ.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {treasureLabels.map((label, index) => {
                const isCompleted = index < treasureProgress
                const isCurrent = index === treasureProgress && treasureProgress < 8

                return (
                  <div
                    key={label}
                    className={`rounded-2xl border p-3 text-center ${
                      isCompleted
                        ? 'border-rose-300 bg-rose-600 text-white'
                        : isCurrent
                          ? 'border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-100'
                          : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    <div className="mx-auto flex size-9 items-center justify-center rounded-full bg-white/20">
                      {index === 7 ? (
                        <Gift aria-hidden="true" size={18} />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-semibold">{label}</p>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              disabled={!canPlay}
              onClick={() => void onDrawStudents(1, 600)}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Map aria-hidden="true" size={20} />
              {treasureProgress >= 8 ? 'Khám phá lại bản đồ' : 'Mở chặng tiếp theo'}
            </button>
          </div>
        ) : null}
      </div>

      {currentStudent ? (
        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-pink-200 bg-white p-4 shadow-sm">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-lotus-600 text-lg font-bold text-white">
            {studentFirstName(currentStudent.fullName).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-lotus-600">
              Học sinh được chọn
            </p>
            <p className="truncate text-lg font-bold text-slate-900">
              {currentStudent.fullName}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {selectionMeta}
            </p>
          </div>
          <Sparkles className="ml-auto shrink-0 text-lotus-500" size={24} />
        </div>
      ) : null}
    </div>
  )
}
