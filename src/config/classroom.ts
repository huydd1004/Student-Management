import type { AttendancePeriod } from '../domain';

export const CLASSROOM_ID = 'an-binh-5-15-2026-2027' as const;

/** Chức danh hiển thị; quyền thao tác trong ứng dụng vẫn ngang nhau. */
export const CLASS_MEMBER_TITLES: Record<string, string> = {
  PAJTfHKDssRv1poTCimpmui6Gy03: 'Quản trị viên hệ thống',
  NtG3J2EshoVl67fOYJiBUZ4QQXE2: 'Giáo viên chủ nhiệm',
};

export const CLASSROOM_CONFIG = {
  id: CLASSROOM_ID,
  schoolName: 'Trường Tiểu học An Bình',
  className: '5.15',
  grade: 5,
  schoolYear: '2026-2027',
  timezone: 'Asia/Ho_Chi_Minh',
  locale: 'vi-VN',
  attendancePeriods: ['morning', 'afternoon'] satisfies AttendancePeriod[],
} as const;
