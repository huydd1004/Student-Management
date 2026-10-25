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
  PartialLocalDate,
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
  fullName: string;
  dateOfBirth?: PartialLocalDate;
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

type StudentIdentitySource = Pick<
  CreateStudentInput,
  'fullName' | 'dateOfBirth' | 'guardian'
>;

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

function normalizePhoneNumber(value?: string) {
  return value?.replace(/\D/g, '') ?? '';
}

function createImportIdentity(student: StudentIdentitySource) {
  return [
    normalizeSearchText(student.fullName),
    student.dateOfBirth ?? '',
    normalizePhoneNumber(student.guardian?.phoneNumber),
  ].join('|');
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
  const currentStudentEntries = currentStudents.docs.map(
    (studentSnapshot) => ({
      data: studentSnapshot.data() as StudentDocument,
      reference: studentSnapshot.ref,
    }),
  );
  const entriesByIdentity = new Map<
    string,
    typeof currentStudentEntries
  >();
  const entriesByName = new Map<
    string,
    typeof currentStudentEntries
  >();

  currentStudentEntries.forEach((entry) => {
    const identity = createImportIdentity(entry.data);
    const normalizedName = normalizeSearchText(entry.data.fullName);

    entriesByIdentity.set(identity, [
      ...(entriesByIdentity.get(identity) ?? []),
      entry,
    ]);
    entriesByName.set(normalizedName, [
      ...(entriesByName.get(normalizedName) ?? []),
      entry,
    ]);
  });

  const importedNameCounts = new Map<string, number>();

  inputs.forEach((input) => {
    const normalizedName = normalizeSearchText(input.fullName);
    importedNameCounts.set(
      normalizedName,
      (importedNameCounts.get(normalizedName) ?? 0) + 1,
    );
  });

  const importPlan = inputs.map((input) => {
    const normalizedName = normalizeSearchText(input.fullName);
    const identityMatches =
      entriesByIdentity.get(createImportIdentity(input)) ?? [];
    const nameMatches = entriesByName.get(normalizedName) ?? [];

    if (identityMatches.length === 1) {
      return {
        input,
        existingReference: identityMatches[0].reference,
      };
    }

    if (identityMatches.length > 1) {
      throw new Error(
        `Không thể xác định hồ sơ “${input.fullName}” vì có nhiều học sinh trùng tên, ngày sinh và số điện thoại. Vui lòng chỉnh sửa trực tiếp trên website.`,
      );
    }

    if (
      importedNameCounts.get(normalizedName) === 1 &&
      nameMatches.length === 1
    ) {
      return {
        input,
        existingReference: nameMatches[0].reference,
      };
    }

    if (nameMatches.length > 0) {
      throw new Error(
        `Không thể xác định hồ sơ “${input.fullName}” vì có nhiều học sinh trùng tên. Hãy bổ sung ngày sinh hoặc số điện thoại người giám hộ để phân biệt.`,
      );
    }

    return { input, existingReference: null };
  });

  let created = 0;
  let updated = 0;

  for (let start = 0; start < importPlan.length; start += 450) {
    const batch = writeBatch(db);
    const chunk = importPlan.slice(start, start + 450);

    chunk.forEach(({ input, existingReference }) => {
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

      created += 1;
    });

    await batch.commit();
  }

  return { created, updated };
}

async function removeLegacyStudentCodeField(
  collectionPath: string,
) {
  const snapshot = await getDocs(collection(db, collectionPath));
  const references = snapshot.docs
    .filter((documentSnapshot) =>
      Object.prototype.hasOwnProperty.call(
        documentSnapshot.data(),
        'studentCode',
      ),
    )
    .map((documentSnapshot) => documentSnapshot.ref);

  for (let start = 0; start < references.length; start += 450) {
    const batch = writeBatch(db);

    references.slice(start, start + 450).forEach((reference) => {
      batch.update(reference, { studentCode: deleteField() });
    });

    await batch.commit();
  }
}

export async function removeLegacyStudentCodes() {
  await removeLegacyStudentCodeField(
    firestorePaths.students(CLASSROOM_ID),
  );
  await removeLegacyStudentCodeField(
    firestorePaths.attendanceIncidents(CLASSROOM_ID),
  );
  await removeLegacyStudentCodeField(
    firestorePaths.lessonCheckCalls(CLASSROOM_ID),
  );
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
