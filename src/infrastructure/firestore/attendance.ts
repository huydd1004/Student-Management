import {
  Timestamp,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import { CLASSROOM_ID } from '../../config/classroom';
import type {
  AttendanceIncidentDocument,
  AttendanceIncidentStatus,
  AttendancePeriod,
  AttendanceSessionDocument,
  LocalDate,
  WithId,
} from '../../domain';
import { db } from '../firebase';
import {
  createAttendanceSessionId,
  firestorePaths,
} from './paths';

const ATTENDANCE_RETENTION_DAYS = 30;

export interface AttendanceIncidentInput {
  studentId: string;
  studentCode: string;
  studentName: string;
  status: AttendanceIncidentStatus;
  absenceReason?: string;
}

export interface SaveAttendanceInput {
  attendanceDate: LocalDate;
  period: AttendancePeriod;
  actorId: string;
  records: Array<
    | AttendanceIncidentInput
    | {
        studentId: string;
        status: 'present' | 'late';
      }
  >;
}

export type AttendanceIncidentListItem =
  WithId<AttendanceIncidentDocument>;

export type AttendanceSessionListItem =
  WithId<AttendanceSessionDocument>;

function createIncidentId(
  attendanceDate: LocalDate,
  period: AttendancePeriod,
  studentId: string,
) {
  return `${attendanceDate}_${period}_${studentId}`;
}

function createExpirationTimestamp(attendanceDate: LocalDate) {
  const attendanceTime = new Date(
    `${attendanceDate}T23:59:59+07:00`,
  ).getTime();

  return Timestamp.fromMillis(
    attendanceTime +
      ATTENDANCE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
}

export async function saveAttendance(
  input: SaveAttendanceInput,
) {
  const batch = writeBatch(db);
  const sessionId = createAttendanceSessionId(
    input.attendanceDate,
    input.period,
  );
  const sessionReference = doc(
    db,
    firestorePaths.attendanceSession(
      CLASSROOM_ID,
      sessionId,
    ),
  );

  batch.set(sessionReference, {
    attendanceDate: input.attendanceDate,
    period: input.period,
    status: 'completed',
    completedAt: serverTimestamp(),
    completedBy: input.actorId,
    createdAt: serverTimestamp(),
    createdBy: input.actorId,
    updatedAt: serverTimestamp(),
    updatedBy: input.actorId,
  });

  input.records.forEach((record) => {
    const incidentId = createIncidentId(
      input.attendanceDate,
      input.period,
      record.studentId,
    );

    const incidentReference = doc(
      db,
      firestorePaths.attendanceIncident(
        CLASSROOM_ID,
        incidentId,
      ),
    );

    if (
      record.status === 'present' ||
      record.status === 'late'
    ) {
      batch.delete(incidentReference);
      return;
    }

    const incidentRecord = record as AttendanceIncidentInput;

    batch.set(incidentReference, {
      studentId: incidentRecord.studentId,
      studentCode: incidentRecord.studentCode,
      studentName: incidentRecord.studentName,
      attendanceDate: input.attendanceDate,
      period: input.period,
      status: incidentRecord.status,

      ...(incidentRecord.absenceReason?.trim()
        ? {
            absenceReason:
              incidentRecord.absenceReason.trim(),
          }
        : {}),

      expiresAt: createExpirationTimestamp(
        input.attendanceDate,
      ),
      createdAt: serverTimestamp(),
      createdBy: input.actorId,
      updatedAt: serverTimestamp(),
      updatedBy: input.actorId,
    });
  });

  await batch.commit();
}

export function subscribeToAttendanceSessionsForDate(
  attendanceDate: LocalDate,
  onSessionsChange: (
    sessions: AttendanceSessionListItem[],
  ) => void,
  onError: (error: Error) => void,
) {
  const sessionsQuery = query(
    collection(
      db,
      firestorePaths.attendanceSessions(CLASSROOM_ID),
    ),
    where('attendanceDate', '==', attendanceDate),
  );

  return onSnapshot(
    sessionsQuery,
    (snapshot) => {
      onSessionsChange(
        snapshot.docs.map((sessionSnapshot) => ({
          ...(sessionSnapshot.data() as AttendanceSessionDocument),
          id: sessionSnapshot.id,
        })),
      );
    },
    onError,
  );
}

export function subscribeToAttendanceIncidents(
  onIncidentsChange: (
    incidents: AttendanceIncidentListItem[],
  ) => void,
  onError: (error: Error) => void,
) {
  const incidentsQuery = query(
    collection(
      db,
      firestorePaths.attendanceIncidents(CLASSROOM_ID),
    ),
    where('expiresAt', '>', Timestamp.now()),
    orderBy('expiresAt', 'asc'),
  );

  return onSnapshot(
    incidentsQuery,
    (snapshot) => {
      const incidents = snapshot.docs
        .flatMap((incidentSnapshot) => {
          const incidentData = incidentSnapshot.data();

          if (
            incidentData.status !== 'absent_excused' &&
            incidentData.status !== 'absent_unexcused'
          ) {
            return [];
          }

          return [
            {
              ...(incidentData as AttendanceIncidentDocument),
              id: incidentSnapshot.id,
            },
          ];
        })
        .sort((first, second) =>
          second.attendanceDate.localeCompare(
            first.attendanceDate,
          ),
        );

      onIncidentsChange(incidents);
    },
    onError,
  );
}

export async function cleanupExpiredAttendanceIncidents() {
  const expiredQuery = query(
    collection(
      db,
      firestorePaths.attendanceIncidents(CLASSROOM_ID),
    ),
    where('expiresAt', '<=', Timestamp.now()),
  );

  const snapshot = await getDocs(expiredQuery);

  for (let start = 0; start < snapshot.docs.length; start += 450) {
    const batch = writeBatch(db);
    const chunk = snapshot.docs.slice(start, start + 450);

    chunk.forEach((incidentSnapshot) => {
      batch.delete(incidentSnapshot.ref);
    });

    await batch.commit();
  }

  const storedLateQuery = query(
    collection(
      db,
      firestorePaths.attendanceIncidents(CLASSROOM_ID),
    ),
    where('status', '==', 'late'),
  );

  const storedLateSnapshot = await getDocs(storedLateQuery);

  for (
    let start = 0;
    start < storedLateSnapshot.docs.length;
    start += 450
  ) {
    const batch = writeBatch(db);
    const chunk = storedLateSnapshot.docs.slice(
      start,
      start + 450,
    );

    chunk.forEach((incidentSnapshot) => {
      batch.delete(incidentSnapshot.ref);
    });

    await batch.commit();
  }
}
