# HTTP API V2

Mọi endpoint dùng JSON; session lưu trong cookie HttpOnly `studyforge_session`. FE gọi `/api` cùng origin qua frontend proxy. Các route cần đăng nhập trả 401. Lỗi có dạng `{ "error": { "code": "...", "message": "..." } }`.

| Method | Path | Chức năng |
| --- | --- | --- |
| GET | `/api/health` | Kiểm tra backend và kết nối PostgreSQL |
| GET | `/api/auth/me` | Trả user của phiên hiện tại hoặc null |
| POST | `/api/auth/register` | Tạo tài khoản `{name,email,password}` |
| POST | `/api/auth/login` | Đăng nhập `{email,password}` |
| POST | `/api/auth/logout` | Thu hồi phiên hiện tại |
| GET | `/api/collections` | Liệt kê bộ sưu tập của user |
| POST | `/api/collections` | Tạo bộ `{name,description?}` |
| PATCH | `/api/collections/:id` | Sửa tên/mô tả bộ |
| DELETE | `/api/collections/:id` | Xóa bộ rỗng; bộ có từ trả 409 |
| GET | `/api/words` | Lọc từ bằng `collectionId`, `status`, `q`; tối đa 200 dòng |
| GET | `/api/words/stats` | Tổng số từ theo ba trạng thái và số lượt ôn |
| POST | `/api/words` | Lưu `{term,collectionId}`; nếu trùng trả record hiện có |
| PATCH | `/api/words/:id/collection` | Chuyển từ sang bộ khác của cùng user |
| PATCH | `/api/words/:id/status` | Tự đặt `new`, `learning` hoặc `known` |
| GET | `/api/dictionary/:term` | Tra trực tiếp qua backend adapter; không yêu cầu login |
| GET | `/api/review/queue` | Lấy tối đa 20 từ của user cho lượt ôn |
| POST | `/api/review/events` | Lưu `{savedWordId,correct,durationMs}`; không tự đổi trạng thái |

Dictionary trả tất cả entries/senses/examples mà parser hỗ trợ, phân biệt `entries` của mục từ và `wordFamily`. `savedWord` là trạng thái riêng của user hiện tại. Chưa có key thì trả 503; format provider chưa hỗ trợ trả 502. Chưa có bản dịch VI từng sense hay API extension-specific; extension tương lai dùng chung contract và API.

Đây là danh sách route theo source hiện tại, chưa phải xác nhận end-to-end trong Docker.
