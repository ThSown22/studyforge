# Tính năng và trạng thái V2

| Tính năng | Trạng thái |
| --- | --- |
| Auth bằng email/mật khẩu, cookie phiên | Đăng ký và cookie phiên đã qua Compose smoke test |
| Tạo, đổi tên, xóa bộ sưu tập rỗng | Tạo bộ sưu tập đã qua Compose smoke test; đổi tên/xóa chưa được browser QA |
| Lưu từ qua Tra từ hoặc nhập thủ công, không trùng, một bộ sưu tập, ba trạng thái | Lưu không trùng và đổi trạng thái đã qua unit test cùng Compose smoke test |
| Tra từ EN, đầy đủ POS/định nghĩa/ví dụ từ provider | Adapter/parser và giao diện đã viết; cần key và thử với API thật |
| Audio và Word Family | Giao diện/adapter đã viết; chưa thử với phản hồi thực tế |
| Ôn tự đánh giá, review event | Hàng đợi ôn, ghi review event và thống kê đã qua Compose smoke test; lật thẻ bằng Dictionary API thật chưa kiểm tra |
| Dịch VI theo từng sense | Chưa triển khai provider; UI báo chưa có bản dịch |
| Chrome Extension | Chưa triển khai |
| Import JSON/CSV từ nguồn có license | Chưa chuyển luồng V1 sang V2 |
| PostgreSQL + Compose migration | Build, khởi động dependency, migration và API qua PostgreSQL đã được xác nhận bởi Compose smoke test ngày 25/10/2026 |

Không có dữ liệu mẫu được nạp tự động. Code V1 cũ còn trong repo cho rollback/đối chiếu, không còn là điều hướng chính của V2. Smoke test cốt lõi đã qua; các phần còn lại gồm browser QA, persistence qua restart, migration trên DB đã có dữ liệu, Dictionary API thật, dịch VI, import và Chrome Extension.
