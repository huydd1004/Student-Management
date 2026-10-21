# Mô hình dữ liệu lớp 5.15

## 1. Thông tin cố định ban đầu

| Thuộc tính | Giá trị |
| --- | --- |
| Trường | Trường Tiểu học An Bình |
| Lớp | 5.15 |
| Khối | 5 |
| Năm học | 2026–2027 |
| Múi giờ | Asia/Ho_Chi_Minh |
| Ngôn ngữ | vi-VN |
| Buổi học | Sáng, Chiều |
| Người sử dụng | 2 tài khoản Google |
| Quyền | Hai người cùng vai trò `admin` |

Mã lớp ổn định trong cơ sở dữ liệu là `an-binh-5-15-2026-2027`.

## 2. Cây dữ liệu Firestore

```text
classes/{classId}
├── members/{userId}
├── subjects/{subjectId}
├── students/{studentId}
├── attendanceSessions/{sessionId}
│   └── records/{studentId}
├── lessonCheckCalls/{callId}
└── activityLogs/{logId}
```

Mọi dữ liệu đều nằm bên dưới `classes/{classId}` để sau này có thể thêm năm học hoặc lớp khác mà không phải thay đổi toàn bộ cấu trúc.

## 3. Chi tiết collection

### `classes/{classId}`

Lưu thông tin chung và thiết lập của lớp.

```ts
{
  schoolName: "Trường Tiểu học An Bình",
  className: "5.15",
  grade: 5,
  schoolYear: "2026-2027",
  timezone: "Asia/Ho_Chi_Minh",
  locale: "vi-VN",
  attendancePeriods: ["morning", "afternoon"],
  status: "active"
}
```

### `members/{userId}`

Mỗi tài liệu tương ứng với một tài khoản Firebase Authentication. Hai người dùng ban đầu đều có `role: "admin"`, vì vậy quyền ngang nhau.

```ts
{
  displayName: "Tên người dùng",
  email: "email@example.com",
  role: "admin",
  status: "active"
}
```

Tài khoản đăng nhập thành công nhưng không có tài liệu thành viên đang hoạt động sẽ không thể đọc hoặc ghi dữ liệu lớp.

### `subjects/{subjectId}`

Danh mục môn học có thể bật, tắt hoặc bổ sung sau này. `subjectId` dùng mã không dấu ổn định, ví dụ `tieng-viet`, `toan`, `khoa-hoc`.

### `students/{studentId}`

Hồ sơ học sinh gồm:

- mã học sinh;
- họ tên và tên đã chuẩn hóa để tìm kiếm;
- ngày sinh, giới tính;
- tổ và chức vụ trong lớp;
- người liên hệ, quan hệ với học sinh và số điện thoại;
- ngày vào lớp, ngày rời lớp;
- trạng thái `active`, `transferred` hoặc `inactive`;
- ghi chú tùy chọn;
- thông tin người tạo/cập nhật và thời điểm cập nhật.

Không xóa tài liệu học sinh khi chuyển trường hoặc nghỉ học. Thay vào đó, đổi `status` để dữ liệu điểm danh và gọi bài trước đây vẫn còn nguyên.

### `attendanceSessions/{sessionId}`

Mỗi ngày có tối đa hai phiên điểm danh. Mã phiên có dạng:

```text
2026-10-21_morning
2026-10-21_afternoon
```

Tài liệu phiên chứa ngày, buổi, trạng thái đang mở/đã hoàn thành và ghi chú chung.

### `attendanceSessions/{sessionId}/records/{studentId}`

Mỗi học sinh có một bản ghi trong phiên điểm danh:

- `present`: có mặt;
- `absent_excused`: vắng có phép;
- `absent_unexcused`: vắng không phép;
- `late`: đi muộn.

Tách từng học sinh thành một tài liệu giúp hai người có thể cập nhật đồng thời mà ít xảy ra ghi đè dữ liệu.

### `lessonCheckCalls/{callId}`

Mỗi lần gọi một học sinh tạo một tài liệu riêng, gồm học sinh, môn học, số vòng gọi, người gọi, thời điểm gọi và nhận xét tùy chọn.

Quy tắc chọn công bằng:

1. Chỉ lấy học sinh đang hoạt động và có mặt.
2. Tìm số lần được gọi thấp nhất trong môn học và vòng hiện tại.
3. Chọn ngẫu nhiên trong nhóm có số lần thấp nhất.
4. Khi tất cả học sinh hợp lệ đã được gọi, tăng `cycleNumber` và bắt đầu vòng mới.

### `activityLogs/{logId}`

Lưu các thao tác quan trọng như thêm/sửa học sinh, hoàn thành điểm danh hoặc ghi nhận một lần gọi bài. Nhật ký không được sửa hoặc xóa từ ứng dụng.

## 4. Quy ước thời gian

- Ngày nghiệp vụ dùng chuỗi `YYYY-MM-DD` theo múi giờ Việt Nam.
- Thời điểm tạo/cập nhật dùng Firestore server timestamp.
- Giao diện hiển thị theo `Asia/Ho_Chi_Minh` và định dạng `vi-VN`.

## 5. Quy tắc bảo mật

- Mặc định từ chối mọi truy cập không được khai báo.
- Chỉ tài khoản đã đăng nhập và có membership `active/admin` mới truy cập được lớp.
- Hai quản trị viên có quyền ngang nhau.
- Không cho xóa cứng học sinh, điểm danh, lịch sử gọi bài hoặc nhật ký.
- Người tạo nhật ký phải trùng với UID của tài khoản đang đăng nhập.
- Việc tạo lớp và hai membership đầu tiên là bước khởi tạo quản trị, thực hiện sau khi cấu hình Firebase.

## 6. Khả năng mở rộng

Cấu trúc này cho phép thêm điểm số, thời khóa biểu, học bạ, liên lạc phụ huynh hoặc nhiều lớp bằng cách bổ sung collection mới bên dưới từng `classId`; dữ liệu hiện tại không cần chuyển đổi lớn.
