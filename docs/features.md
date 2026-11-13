# Tính năng và trạng thái V2

| Tính năng | Trạng thái |
| --- | --- |
| Auth email/mật khẩu và cookie session | Đã qua Compose smoke test |
| Bộ sưu tập | Tạo đã qua smoke; sửa/xóa cần browser QA |
| Lưu từ không trùng, một bộ, ba trạng thái | Đã qua unit và Compose smoke test |
| Tra từ EN, POS, nghĩa, ví dụ | Adapter/parser/UI có sẵn; cần key để thử API thật |
| Audio và Word Family | Đã triển khai adapter/UI; chưa xác minh response thật |
| Hàng đợi ôn và review events | Đã qua Compose smoke test |
| Dịch VI theo từng sense | Chưa có provider |
| Chrome Extension | Chưa triển khai |
| Import JSON/CSV có kiểm tra license | Chưa triển khai cho V2 |
| PostgreSQL migration | Đã chạy thành công trong Compose |

Runtime không có dữ liệu mẫu, SQLite hoặc module giáo trình V1. Việc còn lại: browser QA, persistence qua restart, migration trên database có dữ liệu, Dictionary API thật, dịch VI, import và Chrome Extension.
