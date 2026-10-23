export type EntityId = string;

/** Chuỗi ngày theo định dạng YYYY-MM-DD trong múi giờ của lớp. */
export type LocalDate = string;

/** Ngày có thể chỉ gồm năm, tháng/năm hoặc đầy đủ ngày/tháng/năm. */
export type PartialLocalDate = string;

/**
 * Cấu trúc tối thiểu tương thích với Firebase Firestore Timestamp.
 * Domain không phụ thuộc trực tiếp Firebase SDK nên vẫn dễ kiểm thử.
 */
export interface TimestampValue {
  seconds: number;
  nanoseconds: number;
}

export interface AuditFields {
  createdAt: TimestampValue;
  createdBy: EntityId;
  updatedAt: TimestampValue;
  updatedBy: EntityId;
}

export type WithId<T> = T & { id: EntityId };
