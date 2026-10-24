# Máy chủ Trợ lý AI

Cloudflare Worker này là lớp trung gian giữa website GitHub Pages và OpenAI.
Nó có bốn nhiệm vụ:

1. chỉ chấp nhận yêu cầu từ website chính thức hoặc máy phát triển cục bộ;
2. kiểm tra Firebase ID token của người đang đăng nhập;
3. chỉ cho phép hai UID đã duyệt sử dụng AI;
4. giữ `OPENAI_API_KEY` ở phía máy chủ và chuyển tiếp phản hồi dạng streaming.

## Biến cấu hình

Các giá trị công khai nằm trong `wrangler.toml`:

- `OPENAI_MODEL`: mô hình OpenAI, mặc định `gpt-6-luna`;
- `MAX_REQUESTS_PER_MINUTE`: giới hạn mềm cho mỗi người dùng;
- `ALLOWED_ORIGINS`: các website được phép gọi Worker.

Ba giá trị sau phải nhập bằng lệnh secret, không ghi vào file:

- `OPENAI_API_KEY`: khóa API tạo tại OpenAI Platform;
- `FIREBASE_WEB_API_KEY`: giá trị `VITE_FIREBASE_API_KEY` đang dùng cho website;
- `ALLOWED_FIREBASE_UIDS`: hai UID Firebase, phân cách bằng dấu phẩy.

## Triển khai lần đầu

Mở PowerShell tại thư mục `worker/ai-chat` và chạy lần lượt:

```powershell
npx wrangler@latest login
npx wrangler@latest secret put OPENAI_API_KEY
npx wrangler@latest secret put FIREBASE_WEB_API_KEY
npx wrangler@latest secret put ALLOWED_FIREBASE_UIDS
npx wrangler@latest deploy
```

Khi được hỏi giá trị `ALLOWED_FIREBASE_UIDS`, nhập hai UID trong
`src/config/classroom.ts`, nối với nhau bằng dấu phẩy và không có dấu ngoặc.

Sau khi triển khai, Cloudflare sẽ trả về địa chỉ có dạng:

```text
https://an-binh-class515-ai.<tai-khoan>.workers.dev
```

Đường dẫn dùng cho website là:

```text
https://an-binh-class515-ai.<tai-khoan>.workers.dev/api/ai/chat
```

Thêm đường dẫn đầy đủ này vào GitHub Actions secret có tên
`VITE_AI_API_URL`, sau đó chạy lại workflow triển khai website.

## Nguyên tắc an toàn

- Không đưa `OPENAI_API_KEY` vào `.env`, React, GitHub Actions của trang tĩnh
  hoặc bất kỳ biến nào bắt đầu bằng `VITE_`.
- Không gửi khóa API qua tin nhắn hoặc commit lên GitHub.
- Trợ lý không tự đọc Firestore. Chỉ nội dung người dùng nhập vào ô chat được
  gửi tới OpenAI.
- Nếu nghi ngờ khóa bị lộ, thu hồi khóa tại OpenAI Platform và tạo khóa mới.
