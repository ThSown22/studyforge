# HTTP API V2

API dùng JSON và cookie HttpOnly `studyforge_session`. Frontend gọi `/api` cùng origin qua proxy. Route cần đăng nhập trả 401. Lỗi có dạng `{ "error": { "code": "...", "message": "..." } }`.

| Method | Path | Chức năng |
| --- | --- | --- |
| GET | `/api/health` | Backend và PostgreSQL health |
| GET | `/api/auth/me` | User hiện tại hoặc null |
| POST | `/api/auth/register` | Tạo tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/logout` | Thu hồi session |
| GET/POST | `/api/collections` | Liệt kê/tạo bộ sưu tập |
| PATCH/DELETE | `/api/collections/:id` | Sửa/xóa bộ rỗng |
| GET/POST | `/api/words` | Lọc/lưu từ |
| GET | `/api/words/stats` | Thống kê trạng thái và review |
| PATCH | `/api/words/:id/collection` | Chuyển bộ sưu tập |
| PATCH | `/api/words/:id/status` | Đặt trạng thái học |
| GET | `/api/dictionary/:term` | Tra từ qua adapter server-side |
| GET | `/api/review/queue` | Lấy hàng đợi ôn |
| POST | `/api/review/events` | Ghi kết quả tự đánh giá |

Smoke test Compose đã xác nhận proxy, auth/session, collections, chống lưu từ trùng, đổi trạng thái và review với PostgreSQL. Dictionary API thật vẫn cần key hợp lệ để kiểm tra end-to-end.
