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
├── attendanceIncidents/{date_period_studentId}
├── lessonCheckCalls/{callId}
├── calendarEvents/{eventId}
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

- họ tên và tên đã chuẩn hóa để tìm kiếm;
- ngày sinh, giới tính;
- tổ và chức vụ trong lớp;
- đánh giá theo dõi của giáo viên chủ nhiệm: `weak` (Yếu), `average` (Trung bình), `good` (Khá) hoặc `excellent` (Giỏi);
- người liên hệ, quan hệ với học sinh và số điện thoại;
- ngày vào lớp, ngày rời lớp;
- trạng thái `active`, `transferred` hoặc `inactive`;
- ghi chú tùy chọn;
- thông tin người tạo/cập nhật và thời điểm cập nhật.

Thông thường nên đổi `status` khi học sinh chuyển trường hoặc nghỉ học. Khi người dùng chủ động chọn xóa và xác nhận, hồ sơ cùng lịch sử điểm danh liên quan cũng được xóa.

### `attendanceIncidents/{date_period_studentId}`

Chỉ lưu học sinh vắng hoặc đi muộn; học sinh có mặt không cần tạo tài liệu. Mã tài liệu có dạng:

```text
2026-10-21_morning_studentId
2026-10-21_afternoon_studentId
```

Chỉ hai trạng thái vắng được lưu:

- `absent_excused`: vắng có phép;
- `absent_unexcused`: vắng không phép;

Lý do vắng là ghi chú không bắt buộc. Trạng thái đi muộn và số phút đi muộn chỉ dùng trong lần điểm danh hiện tại, không được lưu vào Firestore. Mỗi tài liệu vắng học có `expiresAt` bằng cuối ngày điểm danh cộng 30 ngày; giao diện ẩn ngay dữ liệu hết hạn và dọn các tài liệu đó khi người quản trị mở trang điểm danh.

### `lessonCheckCalls/{callId}`

Mỗi lần gọi một học sinh tạo một tài liệu riêng, gồm học sinh, môn học, số vòng gọi, người gọi, thời điểm gọi và nhận xét tùy chọn.

Quy tắc chọn công bằng:

1. Chỉ lấy học sinh đang hoạt động và có mặt.
2. Tìm số lần được gọi thấp nhất trong môn học và vòng hiện tại.
3. Chọn ngẫu nhiên trong nhóm có số lần thấp nhất.
4. Khi tất cả học sinh hợp lệ đã được gọi, tăng `cycleNumber` và bắt đầu vòng mới.

### `calendarEvents/{eventId}`

Lưu lịch dùng chung của lớp, gồm tiêu đề, ngày, thời gian, loại công việc,
ghi chú và thời điểm nhắc. Cả hai thành viên đều có thể tạo, sửa và xóa sự kiện.
Thông báo đã xem được lưu riêng trên thiết bị của từng người để không ảnh hưởng
trạng thái thông báo của người còn lại.

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
- Quản trị viên được xóa học sinh và các bản ghi điểm danh liên quan sau khi xác nhận trên giao diện.
- Chỉ quản trị viên được tạo, sửa hoặc xóa bản ghi điểm danh; quy tắc kiểm tra buổi học, trạng thái, thời hạn lưu và số phút đi muộn.
- Người tạo nhật ký phải trùng với UID của tài khoản đang đăng nhập.
- Việc tạo lớp và hai membership đầu tiên là bước khởi tạo quản trị, thực hiện sau khi cấu hình Firebase.

## 6. Khả năng mở rộng

Cấu trúc này cho phép thêm điểm số, thời khóa biểu, học bạ, liên lạc phụ huynh hoặc nhiều lớp bằng cách bổ sung collection mới bên dưới từng `classId`; dữ liệu hiện tại không cần chuyển đổi lớn.
