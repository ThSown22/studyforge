# Tính năng và trạng thái V2

| Tính năng | Trạng thái |
| --- | --- |
| Auth bằng email/mật khẩu, cookie phiên | Đã viết cho PostgreSQL; chưa thử end-to-end trong container |
| Tạo, đổi tên, xóa bộ sưu tập rỗng | Đã viết FE/BE/DB; chưa thử end-to-end |
| Lưu từ qua Tra từ hoặc nhập thủ công, không trùng, một bộ sưu tập, ba trạng thái | Đã viết FE/BE/DB; unit test quy tắc đã qua; chưa thử end-to-end |
| Tra từ EN, đầy đủ POS/định nghĩa/ví dụ từ provider | Adapter/parser và giao diện đã viết; cần key và thử với API thật |
| Audio và Word Family | Giao diện/adapter đã viết; chưa thử với phản hồi thực tế |
| Ôn tự đánh giá, review event | Đã viết FE/BE/DB; cần thử trong container và key dictionary để lật thẻ |
| Dịch VI theo từng sense | Chưa triển khai provider; UI báo chưa có bản dịch |
| Chrome Extension | Chưa triển khai |
| Import JSON/CSV từ nguồn có license | Chưa chuyển luồng V1 sang V2 |
| PostgreSQL + Compose migration | Cấu hình/schema đã viết, Compose config qua; Docker runtime chưa truy cập được |

Không có dữ liệu mẫu được nạp tự động. Code V1 cũ còn trong repo cho rollback/đối chiếu, không còn là điều hướng chính của V2. Cần build, migration, integration test và browser QA trong Docker trước khi coi P0 hoàn thành.
