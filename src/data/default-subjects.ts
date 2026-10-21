import type { SubjectSeed } from '../domain';

export const DEFAULT_SUBJECTS: SubjectSeed[] = [
  { id: 'tieng-viet', code: 'TV', name: 'Tiếng Việt', shortName: 'Tiếng Việt', displayOrder: 10, isActive: true, isDefault: true },
  { id: 'toan', code: 'TOAN', name: 'Toán', shortName: 'Toán', displayOrder: 20, isActive: true, isDefault: true },
  { id: 'ngoai-ngu-1', code: 'NN1', name: 'Ngoại ngữ 1', shortName: 'Ngoại ngữ', displayOrder: 30, isActive: true, isDefault: true },
  { id: 'dao-duc', code: 'DD', name: 'Đạo đức', shortName: 'Đạo đức', displayOrder: 40, isActive: true, isDefault: true },
  { id: 'lich-su-dia-li', code: 'LSDL', name: 'Lịch sử và Địa lí', shortName: 'LS & ĐL', displayOrder: 50, isActive: true, isDefault: true },
  { id: 'khoa-hoc', code: 'KH', name: 'Khoa học', shortName: 'Khoa học', displayOrder: 60, isActive: true, isDefault: true },
  { id: 'tin-hoc-cong-nghe', code: 'THCN', name: 'Tin học và Công nghệ', shortName: 'Tin & Công nghệ', displayOrder: 70, isActive: true, isDefault: true },
  { id: 'giao-duc-the-chat', code: 'GDTC', name: 'Giáo dục thể chất', shortName: 'Thể chất', displayOrder: 80, isActive: true, isDefault: true },
  { id: 'am-nhac', code: 'AN', name: 'Âm nhạc', shortName: 'Âm nhạc', displayOrder: 90, isActive: true, isDefault: true },
  { id: 'mi-thuat', code: 'MT', name: 'Mĩ thuật', shortName: 'Mĩ thuật', displayOrder: 100, isActive: true, isDefault: true },
  { id: 'hoat-dong-trai-nghiem', code: 'HDTN', name: 'Hoạt động trải nghiệm', shortName: 'Trải nghiệm', displayOrder: 110, isActive: true, isDefault: true },
  { id: 'giao-duc-dia-phuong', code: 'GDDP', name: 'Nội dung giáo dục địa phương', shortName: 'Địa phương', displayOrder: 120, isActive: true, isDefault: true },
];
