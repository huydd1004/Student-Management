import {
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { CLASSROOM_ID } from '../../config/classroom';
import type {
  GuardianContact,
  LocalDate,
  StudentDocument,
  StudentAcademicPerformance,
  StudentGender,
  StudentStatus,
  WithId,
} from '../../domain';
import { db } from '../firebase';
import { firestorePaths } from './paths';

export interface CreateStudentInput {
  studentCode: string;
  fullName: string;
  dateOfBirth?: LocalDate;
  gender: StudentGender;
  group?: string;
  academicPerformance?: StudentAcademicPerformance;
  classDuty?: string;
  permanentAddress?: string;
  guardian?: GuardianContact;
  joinedOn?: LocalDate;
  status: StudentStatus;
  notes?: string;
}

export type StudentListItem = WithId<StudentDocument>;

export interface ImportStudentsResult {
  created: number;
  updated: number;
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

export async function createStudent(
  input: CreateStudentInput,
  actorId: string,
) {
  const studentsPath =
    firestorePaths.students(CLASSROOM_ID);

  const studentReference = doc(
    collection(db, studentsPath),
  );

  const studentData = {
    studentCode: input.studentCode.trim(),
    fullName: input.fullName.trim(),
    normalizedName: normalizeSearchText(input.fullName),
    gender: input.gender,
    status: input.status,

    ...(input.academicPerformance
      ? { academicPerformance: input.academicPerformance }
      : {}),

    ...(input.dateOfBirth
      ? { dateOfBirth: input.dateOfBirth }
      : {}),

    ...(input.group
      ? { group: input.group.trim() }
      : {}),

    ...(input.classDuty
      ? { classDuty: input.classDuty.trim() }
      : {}),

    ...(input.permanentAddress
      ? { permanentAddress: input.permanentAddress.trim() }
      : {}),

    ...(input.guardian
      ? {
          guardian: {
            fullName: input.guardian.fullName.trim(),
            relationship:
              input.guardian.relationship.trim(),
            phoneNumber:
              input.guardian.phoneNumber.trim(),
          },
        }
      : {}),

    ...(input.joinedOn
      ? { joinedOn: input.joinedOn }
      : {}),

    ...(input.notes
      ? { notes: input.notes.trim() }
      : {}),

    createdAt: serverTimestamp(),
    createdBy: actorId,
    updatedAt: serverTimestamp(),
    updatedBy: actorId,
  };

  await setDoc(studentReference, studentData);

  return studentReference.id;
}

export async function updateStudent(
    studentId: string,
    input: CreateStudentInput,
    actorId: string,
) {
    const studentReference = doc(
        db,
        firestorePaths.student(CLASSROOM_ID, studentId),
    );

    await updateDoc(studentReference, {
        studentCode: input.studentCode.trim(),
        fullName: input.fullName.trim(),
        normalizedName: normalizeSearchText(input.fullName),
        gender: input.gender,
        status: input.status,
        academicPerformance:
          input.academicPerformance || deleteField(),

        dateOfBirth: input.dateOfBirth || deleteField(),
        group: input.group?.trim() || deleteField(),
        classDuty: input.classDuty?.trim() || deleteField(),
        permanentAddress:
          input.permanentAddress?.trim() || deleteField(),
        guardian: input.guardian? {
            fullName: input.guardian.fullName.trim(),
            relationship: input.guardian.relationship.trim(),
            phoneNumber: input.guardian.phoneNumber.trim(),
        } : deleteField(),

        joinedOn: input.joinedOn || deleteField(),

        notes: input.notes?.trim() || deleteField(),

        updatedAt: serverTimestamp(),
        updatedBy: actorId,
    });
}

export async function deleteStudent(studentId: string) {
  const incidentsQuery = query(
    collection(
      db,
      firestorePaths.attendanceIncidents(CLASSROOM_ID),
    ),
    where('studentId', '==', studentId),
  );

  const incidentsSnapshot = await getDocs(incidentsQuery);

  for (
    let start = 0;
    start < incidentsSnapshot.docs.length;
    start += 450
  ) {
    const batch = writeBatch(db);
    const chunk = incidentsSnapshot.docs.slice(
      start,
      start + 450,
    );

    chunk.forEach((incidentSnapshot) => {
      batch.delete(incidentSnapshot.ref);
    });

    await batch.commit();
  }

  await deleteDoc(
    doc(
      db,
      firestorePaths.student(CLASSROOM_ID, studentId),
    ),
  );
}

export async function importStudents(
  inputs: CreateStudentInput[],
  actorId: string,
): Promise<ImportStudentsResult> {
  const studentsCollection = collection(
    db,
    firestorePaths.students(CLASSROOM_ID),
  );
  const currentStudents = await getDocs(studentsCollection);
  const studentReferencesByCode = new Map(
    currentStudents.docs.map((studentSnapshot) => [
      normalizeSearchText(
        String(studentSnapshot.data().studentCode ?? ''),
      ),
      studentSnapshot.ref,
    ]),
  );

  let created = 0;
  let updated = 0;

  for (let start = 0; start < inputs.length; start += 450) {
    const batch = writeBatch(db);
    const chunk = inputs.slice(start, start + 450);

    chunk.forEach((input) => {
      const normalizedCode = normalizeSearchText(
        input.studentCode,
      );
      const existingReference =
        studentReferencesByCode.get(normalizedCode);
      const guardian = input.guardian
        ? {
            fullName: input.guardian.fullName.trim(),
            relationship: input.guardian.relationship.trim(),
            phoneNumber: input.guardian.phoneNumber.trim(),
          }
        : undefined;

      if (existingReference) {
        batch.update(existingReference, {
          studentCode: input.studentCode.trim(),
          fullName: input.fullName.trim(),
          normalizedName: normalizeSearchText(input.fullName),
          gender: input.gender,
          status: input.status,
          academicPerformance:
            input.academicPerformance || deleteField(),
          dateOfBirth: input.dateOfBirth || deleteField(),
          group: input.group?.trim() || deleteField(),
          classDuty: input.classDuty?.trim() || deleteField(),
          permanentAddress:
            input.permanentAddress?.trim() || deleteField(),
          guardian: guardian || deleteField(),
          joinedOn: input.joinedOn || deleteField(),
          notes: input.notes?.trim() || deleteField(),
          updatedAt: serverTimestamp(),
          updatedBy: actorId,
        });
        updated += 1;
        return;
      }

      const newReference = doc(studentsCollection);

      batch.set(newReference, {
        studentCode: input.studentCode.trim(),
        fullName: input.fullName.trim(),
        normalizedName: normalizeSearchText(input.fullName),
        gender: input.gender,
        status: input.status,
        ...(input.academicPerformance
          ? { academicPerformance: input.academicPerformance }
          : {}),
        ...(input.dateOfBirth
          ? { dateOfBirth: input.dateOfBirth }
          : {}),
        ...(input.group
          ? { group: input.group.trim() }
          : {}),
        ...(input.classDuty
          ? { classDuty: input.classDuty.trim() }
          : {}),
        ...(input.permanentAddress
          ? { permanentAddress: input.permanentAddress.trim() }
          : {}),
        ...(guardian ? { guardian } : {}),
        ...(input.joinedOn ? { joinedOn: input.joinedOn } : {}),
        ...(input.notes
          ? { notes: input.notes.trim() }
          : {}),
        createdAt: serverTimestamp(),
        createdBy: actorId,
        updatedAt: serverTimestamp(),
        updatedBy: actorId,
      });

      studentReferencesByCode.set(normalizedCode, newReference);
      created += 1;
    });

    await batch.commit();
  }

  return { created, updated };
}

export function subscribeToStudents(
  onStudentsChange: (
    students: StudentListItem[],
  ) => void,
  onError: (error: Error) => void,
) {
  const studentsPath =
    firestorePaths.students(CLASSROOM_ID);

  const studentsQuery = query(
    collection(db, studentsPath),
    orderBy('fullName'),
  );

  return onSnapshot(
    studentsQuery,
    (snapshot) => {
      const students = snapshot.docs.map(
        (studentSnapshot) => ({
          ...(
            studentSnapshot.data() as StudentDocument
          ),
          id: studentSnapshot.id,
        }),
      );

      onStudentsChange(students);
    },
    onError,
  );
}
