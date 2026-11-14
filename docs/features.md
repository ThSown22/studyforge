# Tính năng và trạng thái V2

| Tính năng | Trạng thái |
| --- | --- |
| Auth email/mật khẩu và cookie session | Đăng ký, đăng xuất, đăng nhập lại, sai mật khẩu và route cần auth đã qua Compose smoke |
| Bộ sưu tập | Tạo, sửa, chặn xóa bộ còn từ và xóa bộ rỗng đã qua Compose smoke |
| Lưu từ không trùng, một bộ, ba trạng thái | Lưu, lọc, chuyển bộ, chống trùng và đổi ba trạng thái đã qua unit/Compose smoke |
| Tra từ EN, POS, nghĩa, ví dụ | Đã xác minh với Merriam-Webster API thật; parser giữ POS, nghĩa, ví dụ, grammar/usage notes và tách cụm từ liên quan khỏi entry chính |
| Audio và Word Family | URL phát âm và Word Family đã được xác minh trong response thật; nút phát âm có trạng thái enabled/disabled theo dữ liệu |
| Chi tiết bộ sưu tập | Trang riêng có thống kê, danh sách từ, thêm từ và CTA ôn đúng bộ |
| Flashcard ôn theo bộ | Lật thẻ, phát âm, EN/VI, ba mức tự đánh giá, tiến độ và tổng kết phiên; Compose smoke khóa bộ lọc theo collection |
| Cây kiến thức | Năm giai đoạn từ hạt giống đến tươi tốt dựa trên số từ, từ đã nhớ và lượt ôn; có unit test cho mọi mốc |
| Dịch VI theo từng sense | Adapter DeepL server-side chỉ gọi khi bấm VI; unit test và runtime thật qua Docker Compose đều đã xác minh |
| Chrome Extension | Chưa triển khai |
| Import JSON/CSV có kiểm tra license | Chưa triển khai cho V2 |
| PostgreSQL migration và phục hồi kết nối | Migration idempotent; restart DB/toàn stack giữ dữ liệu và backend tự retry |

Runtime không có dữ liệu mẫu, SQLite hoặc module giáo trình V1. Browser QA đã kiểm tra đăng ký/đăng nhập, tạo bộ sưu tập, tra và lưu từ, đổi trạng thái, hoàn thành lượt ôn và đăng nhập lại để xác nhận dữ liệu còn nguyên. Giao diện được tập trung cho desktop. Dịch VI với DeepL key thật đã được xác minh qua stack Docker. Việc còn lại ngoài phần lõi hiện tại là import dữ liệu; Chrome Extension đang nằm ngoài phạm vi triển khai hiện tại.
