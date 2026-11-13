# Tính năng và trạng thái V2

| Tính năng | Trạng thái |
| --- | --- |
| Auth email/mật khẩu và cookie session | Đăng ký, đăng xuất, đăng nhập lại, sai mật khẩu và route cần auth đã qua Compose smoke |
| Bộ sưu tập | Tạo, sửa, chặn xóa bộ còn từ và xóa bộ rỗng đã qua Compose smoke |
| Lưu từ không trùng, một bộ, ba trạng thái | Lưu, lọc, chuyển bộ, chống trùng và đổi ba trạng thái đã qua unit/Compose smoke |
| Tra từ EN, POS, nghĩa, ví dụ | Adapter/parser/UI có sẵn; cần key để thử API thật |
| Audio và Word Family | Đã triển khai adapter/UI; chưa xác minh response thật |
| Hàng đợi ôn và review events | Đã qua Compose smoke test |
| Dịch VI theo từng sense | Chưa có provider |
| Chrome Extension | Chưa triển khai |
| Import JSON/CSV có kiểm tra license | Chưa triển khai cho V2 |
| PostgreSQL migration và phục hồi kết nối | Migration idempotent; restart DB/toàn stack giữ dữ liệu và backend tự retry |

Runtime không có dữ liệu mẫu, SQLite hoặc module giáo trình V1. Việc còn lại: browser QA, backup/restore, Dictionary API thật, dịch VI, import và Chrome Extension.
