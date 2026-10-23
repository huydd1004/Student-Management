import type { AuditFields, LocalDate } from './common';

export type StudentGender = 'male' | 'female' | 'other' | 'unspecified';
export type StudentStatus = 'active' | 'transferred' | 'inactive';
export type StudentAcademicPerformance =
  | 'weak'
  | 'average'
  | 'good'
  | 'excellent';

export interface GuardianContact {
  fullName: string;
  relationship: string;
  phoneNumber: string;
}

export interface StudentDocument extends AuditFields {
  studentCode: string;
  fullName: string;
  /** Họ tên viết thường, bỏ dấu; chỉ dùng để tìm kiếm. */
  normalizedName: string;
  dateOfBirth?: LocalDate;
  gender: StudentGender;
  group?: string;
  /** Đánh giá nội bộ của giáo viên chủ nhiệm để theo dõi quá trình học. */
  academicPerformance?: StudentAcademicPerformance;
  classDuty?: string;
  permanentAddress?: string;
  guardian?: GuardianContact;
  joinedOn?: LocalDate;
  leftOn?: LocalDate;
  status: StudentStatus;
  notes?: string;
}
