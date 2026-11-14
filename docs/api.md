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
| GET | `/api/dictionary/:term` | Tra nghĩa EN qua adapter Merriam-Webster server-side |
| GET | `/api/dictionary/:term?language=vi` | Tra từ rồi dịch theo từng nghĩa sang VI qua adapter DeepL server-side |
| GET | `/api/review/queue?collectionId=:id` | Lấy hàng đợi ôn thuộc đúng một bộ sưu tập |
| POST | `/api/review/events` | Ghi mức tự đánh giá `1` (chưa nhớ), `2` (hơi nhớ), `3` (đã nhớ) |

`language` chỉ nhận `en` hoặc `vi`. Backend dịch theo batch, không lưu bản dịch của nhà cung cấp vào PostgreSQL và không trả API key cho trình duyệt. Nếu thiếu key dịch, endpoint VI trả `TRANSLATION_NOT_CONFIGURED`; endpoint EN không bị ảnh hưởng.

Smoke test Compose xác nhận proxy, auth/session, collections, chống lưu từ trùng, đổi trạng thái, hàng đợi theo bộ sưu tập và ba mức tự đánh giá với PostgreSQL. Ngày 14/11/2026, endpoint VI đã được gọi qua frontend proxy và xác minh trả định nghĩa tiếng Việt từ DeepL thật.
