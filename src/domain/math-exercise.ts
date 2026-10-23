import type { EntityId, TimestampValue } from './common'

export type MathSemester = 'semester_1' | 'semester_2'

export type MathDifficulty = 'basic' | 'applied'

export type MathExerciseTopicId =
  | 'mixed'
  | 'fractions'
  | 'decimal_add_subtract'
  | 'decimal_multiply_divide'
  | 'unit_conversion'
  | 'percentage'
  | 'triangle_trapezoid'
  | 'circle'
  | 'solid_geometry'
  | 'motion'
  | 'statistics'

export interface MathExerciseQuestion {
  id: string
  topicId: MathExerciseTopicId
  topicLabel: string
  prompt: string
  answer: string
  solutionSteps: string[]
  signature: string
}

/** Một đề đã lưu là bản ghi bất biến để hai thành viên luôn xem cùng nội dung. */
export interface MathExerciseSetDocument {
  title: string
  semester: MathSemester
  topicId: MathExerciseTopicId
  topicLabel: string
  difficulty: MathDifficulty
  questionCount: number
  questions: MathExerciseQuestion[]
  signature: string
  createdAt: TimestampValue
  createdBy: EntityId
  createdByName: string
}
