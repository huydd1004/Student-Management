import {
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
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
import { compareVietnameseNames } from '../../utils/vietnameseName';
import { firestorePaths } from './paths';

export interface CreateStudentInput {
  studentCode: string;
  fullName: string;
  dateOfBirth?: LocalDate;
  gender: StudentGender;
  ethnicity?: string;
  group?: string;
  academicPerformance?: StudentAcademicPerformance;
  classDuty?: string;
  permanentAddress?: string;
  difficultCircumstances?: string;
  guardian?: GuardianContact;
  secondaryGuardian?: GuardianContact;
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

    ...(input.ethnicity
      ? { ethnicity: input.ethnicity.trim() }
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

    ...(input.difficultCircumstances
      ? {
          difficultCircumstances:
            input.difficultCircumstances.trim(),
        }
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

    ...(input.secondaryGuardian
      ? {
          secondaryGuardian: {
            fullName: input.secondaryGuardian.fullName.trim(),
            relationship:
              input.secondaryGuardian.relationship.trim(),
            phoneNumber:
              input.secondaryGuardian.phoneNumber.trim(),
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
        ethnicity: input.ethnicity?.trim() || deleteField(),
        group: input.group?.trim() || deleteField(),
        classDuty: input.classDuty?.trim() || deleteField(),
        permanentAddress:
          input.permanentAddress?.trim() || deleteField(),
        difficultCircumstances:
          input.difficultCircumstances?.trim() || deleteField(),
        guardian: input.guardian? {
            fullName: input.guardian.fullName.trim(),
            relationship: input.guardian.relationship.trim(),
            phoneNumber: input.guardian.phoneNumber.trim(),
        } : deleteField(),
        secondaryGuardian: input.secondaryGuardian ? {
            fullName: input.secondaryGuardian.fullName.trim(),
            relationship:
              input.secondaryGuardian.relationship.trim(),
            phoneNumber:
              input.secondaryGuardian.phoneNumber.trim(),
        } : deleteField(),

        joinedOn: input.joinedOn || deleteField(),

        notes: input.notes?.trim() || deleteField(),

        updatedAt: serverTimestamp(),
        updatedBy: actorId,
    });
}

export async function deleteStudent(studentId: string) {
  await deleteDoc(
    doc(
      db,
      firestorePaths.student(CLASSROOM_ID, studentId),
    ),
  );

  // Dọn dữ liệu phụ theo cơ chế best-effort: lỗi ở lịch sử không được
  // phép làm thao tác xóa hồ sơ chính thất bại.
  try {
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
  } catch (cleanupError) {
    console.warn(
      'Không thể dọn toàn bộ lịch sử vắng học của học sinh đã xóa.',
      cleanupError,
    );
  }
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
      const secondaryGuardian = input.secondaryGuardian
        ? {
            fullName: input.secondaryGuardian.fullName.trim(),
            relationship:
              input.secondaryGuardian.relationship.trim(),
            phoneNumber:
              input.secondaryGuardian.phoneNumber.trim(),
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
          ethnicity: input.ethnicity?.trim() || deleteField(),
          group: input.group?.trim() || deleteField(),
          classDuty: input.classDuty?.trim() || deleteField(),
          permanentAddress:
            input.permanentAddress?.trim() || deleteField(),
          difficultCircumstances:
            input.difficultCircumstances?.trim() || deleteField(),
          guardian: guardian || deleteField(),
          secondaryGuardian:
            secondaryGuardian || deleteField(),
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
        ...(input.ethnicity
          ? { ethnicity: input.ethnicity.trim() }
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
        ...(input.difficultCircumstances
          ? {
              difficultCircumstances:
                input.difficultCircumstances.trim(),
            }
          : {}),
        ...(guardian ? { guardian } : {}),
        ...(secondaryGuardian ? { secondaryGuardian } : {}),
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

  return onSnapshot(
    collection(db, studentsPath),
    (snapshot) => {
      const students = snapshot.docs
        .map((studentSnapshot) => ({
          ...(
            studentSnapshot.data() as StudentDocument
          ),
          id: studentSnapshot.id,
        }))
        .sort((first, second) =>
          compareVietnameseNames(first.fullName, second.fullName),
        );

      onStudentsChange(students);
    },
    onError,
  );
}
