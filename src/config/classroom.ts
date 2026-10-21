import type { AttendancePeriod } from '../domain';

export const CLASSROOM_ID = 'an-binh-5-15-2026-2027' as const;

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
