# Tính năng và trạng thái V2

| Tính năng | Trạng thái |
| --- | --- |
| Auth email/mật khẩu và cookie session | Đăng ký, đăng xuất, đăng nhập lại, sai mật khẩu và route cần auth đã qua Compose smoke |
| Bộ sưu tập | Tạo, sửa, chặn xóa bộ còn từ và xóa bộ rỗng đã qua Compose smoke |
| Lưu từ không trùng, một bộ, ba trạng thái | Lưu, lọc, chuyển bộ, chống trùng và đổi ba trạng thái đã qua unit/Compose smoke |
| Tra từ EN, POS, nghĩa, ví dụ | Đã xác minh với Merriam-Webster API thật; parser giữ POS, nghĩa, ví dụ, grammar/usage notes và tách cụm từ liên quan khỏi entry chính |
| Audio và Word Family | URL phát âm và Word Family đã được xác minh trong response thật; nút phát âm có trạng thái enabled/disabled theo dữ liệu |
| Hàng đợi ôn và review events | Đã qua Compose smoke test |
| Dịch VI theo từng sense | Đã có adapter DeepL ưu tiên và Google fallback, chỉ gọi khi bấm VI; unit test dùng response giả lập, runtime thật cần một key hợp lệ |
| Chrome Extension | Chưa triển khai |
| Import JSON/CSV có kiểm tra license | Chưa triển khai cho V2 |
| PostgreSQL migration và phục hồi kết nối | Migration idempotent; restart DB/toàn stack giữ dữ liệu và backend tự retry |

Runtime không có dữ liệu mẫu, SQLite hoặc module giáo trình V1. Browser QA đã kiểm tra đăng ký/đăng nhập, tạo bộ sưu tập, tra và lưu từ, đổi trạng thái, hoàn thành lượt ôn và đăng nhập lại để xác nhận dữ liệu còn nguyên. Giao diện được tập trung cho desktop. Việc còn lại ngoài phần lõi hiện tại: xác minh dịch VI với key thật và import dữ liệu; Chrome Extension đang nằm ngoài phạm vi triển khai hiện tại.
