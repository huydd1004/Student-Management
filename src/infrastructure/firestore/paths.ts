import { COLLECTIONS } from './collections';

export const firestorePaths = {
  classroom: (classId: string) => `${COLLECTIONS.classes}/${classId}`,
  members: (classId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.members}`,
  member: (classId: string, userId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.members}/${userId}`,
  subjects: (classId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.subjects}`,
  subject: (classId: string, subjectId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.subjects}/${subjectId}`,
  students: (classId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.students}`,
  student: (classId: string, studentId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.students}/${studentId}`,
  attendanceSessions: (classId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.attendanceSessions}`,
  attendanceSession: (classId: string, sessionId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.attendanceSessions}/${sessionId}`,
  attendanceRecords: (classId: string, sessionId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.attendanceSessions}/${sessionId}/${COLLECTIONS.attendanceRecords}`,
  attendanceRecord: (classId: string, sessionId: string, studentId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.attendanceSessions}/${sessionId}/${COLLECTIONS.attendanceRecords}/${studentId}`,
  attendanceIncidents: (classId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.attendanceIncidents}`,
  attendanceIncident: (classId: string, incidentId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.attendanceIncidents}/${incidentId}`,
  lessonCheckCalls: (classId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.lessonCheckCalls}`,
  chatMessages: (classId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.chatMessages}`,
  mathExerciseSets: (classId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.mathExerciseSets}`,
  parentRepresentatives: (classId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.parentRepresentatives}`,
  parentRepresentative: (
    classId: string,
    representativeId: string,
  ) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.parentRepresentatives}/${representativeId}`,
  activityLogs: (classId: string) =>
    `${COLLECTIONS.classes}/${classId}/${COLLECTIONS.activityLogs}`,
} as const;

export function createAttendanceSessionId(
  attendanceDate: string,
  period: 'morning' | 'afternoon',
): string {
  return `${attendanceDate}_${period}`;
}
