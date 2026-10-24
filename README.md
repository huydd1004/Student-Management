# Quản lý lớp 5.15

Ứng dụng nội bộ dành cho **Trường Tiểu học An Bình – lớp 5.15 – năm học 2026–2027**.

Phiên bản đầu tiên tập trung vào:

- quản lý hồ sơ học sinh;
- điểm danh theo buổi Sáng/Chiều;
- gọi kiểm tra bài cũ công bằng theo môn học;
- lưu lịch sử thao tác của hai người quản lý lớp.

Ứng dụng còn có **Trợ lý AI dùng OpenAI** để hỗ trợ tạo bài Toán lớp 5,
soạn nhận xét học sinh và thông báo phụ huynh. Khóa OpenAI không nằm trong
website GitHub Pages mà được bảo vệ bởi Cloudflare Worker.

## Nguyên tắc dữ liệu

- Dữ liệu học sinh thật không được lưu trong kho GitHub.
- GitHub Pages chỉ chứa giao diện; dữ liệu được lưu trong Cloud Firestore.
- Hai tài khoản Google được duyệt trước cùng có vai trò `admin` và quyền ngang nhau.
- Không xóa cứng học sinh hoặc lịch sử chuyên cần; sử dụng trường `status` để bảo toàn lịch sử.

## Cấu trúc hiện tại

```text
docs/
  data-model.md                  Mô tả mô hình dữ liệu và quy tắc nghiệp vụ
src/
  config/classroom.ts            Cấu hình lớp 5.15
  data/default-subjects.ts       Danh mục môn học mặc định
  domain/                        Kiểu dữ liệu dùng trong ứng dụng
  infrastructure/firestore/      Tên collection và hàm tạo đường dẫn
worker/
  ai-chat/                        Máy chủ trung gian bảo mật cho OpenAI
firestore.rules                  Quyền truy cập Firestore
firestore.indexes.json           Khai báo chỉ mục Firestore
firebase.json                    Cấu hình triển khai rules/indexes
```

Xem chi tiết tại [docs/data-model.md](docs/data-model.md).

Hướng dẫn triển khai phần AI nằm tại
[worker/ai-chat/README.md](worker/ai-chat/README.md).
