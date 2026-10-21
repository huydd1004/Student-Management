import type { AuditFields } from './common';

export interface SubjectDocument extends AuditFields {
  code: string;
  name: string;
  shortName: string;
  displayOrder: number;
  isActive: boolean;
  isDefault: boolean;
}

export type SubjectSeed = Omit<SubjectDocument, keyof AuditFields> & {
  id: string;
};
