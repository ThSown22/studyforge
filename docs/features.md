> **Tài liệu V1 (tham khảo):** Chức năng/schema dưới đây chưa phải thiết kế StudyForge V2. Bộ seed đã bỏ và PostgreSQL chưa triển khai. Xem [README](../README.md) để biết trạng thái hiện tại.

# Tính năng và phạm vi

## Các phần được triển khai

| Phần | Hành vi trong StudyForge | Nguồn yêu cầu |
| --- | --- | --- |
| Trang chủ | Hero, bài tiếp theo, cây XP, hai nhóm nội dung; số liệu từ API | Bố cục công khai đã quan sát |
| Ngữ pháp | Sáu chặng CEFR, sidebar, lộ trình, bài mở/khóa và dialog thông tin | Luồng công khai đã quan sát |
| Từ vựng | Chọn chủ đề, lộ trình bài, dialog và flashcards | Luồng công khai đã quan sát |
| Phần học | Các phần kiến thức, công thức, ví dụ, tiến/lùi và hoàn thành học | Phần học thử công khai |
| Flashcards | Lật nghĩa, nhớ/cần ôn, phát âm SpeechSynthesis, thao tác bàn phím | Phần học thử công khai; giọng phụ thuộc trình duyệt |
| Quiz | Choice/text, tiến độ, điều hướng câu hỏi, submit và server grading | Luồng học/kiểm tra; nội dung câu hỏi riêng |
| Kết quả | Điểm, đúng/sai, giải thích, pass 80%, XP và bài tiếp theo | Hành vi học tập; persistence tự thiết kế |
| Đăng ký/đăng nhập | Email/password thật, server session, đăng xuất | Website gốc dùng Google; giải pháp local tự xây |
| Tiến độ và khóa bài | Progress theo tài khoản, giữ sau restart; kiểm tra quyền API | Luồng khóa quan sát được; quy tắc local được ghi rõ |
| Vượt cấp | Kiểm tra ngữ pháp, mở chặng dựa trên kết quả | Nút và ngưỡng công khai; thuật toán local tự xây |
| Ôn câu sai | Hàng đợi theo user, kiểm tra đáp án trước khi đánh dấu giải quyết | Mục tiêu ôn câu sai công khai; UI/private flow tự xây |
| Hồ sơ | Đổi tên, XP, thống kê và lịch sử attempts | Thiết kế riêng cho trạng thái đăng nhập |
| Hỗ trợ | Form validation và lưu góp ý thật trong DB | Website gốc liên kết Zalo; thay bằng chức năng nội bộ |
| Responsive | Layout desktop/tablet/mobile, sidebar và card thích ứng | Đối chiếu viewport công khai; kiểm tra local riêng |
| Chất lượng | Loading/empty/error, semantic types, API validation và integration tests | Yêu cầu dự án |
| Nhập từ vựng | CLI JSON/CSV có preview, validation, metadata nguồn và explicit apply | Thiết kế riêng cho dữ liệu được cấp phép |

Các màn hình sau đăng nhập của website gốc không được truy cập bằng cách vượt bảo vệ. Việc đánh dấu “triển khai” ở đây nói về chức năng StudyForge có mã và persistence thật; không khẳng định tương đương toàn bộ nghiệp vụ riêng của website gốc.

## Nội dung mẫu

Nội dung do dự án tự biên soạn, không nhập bộ 5.000 mục từ/101 bài ngữ pháp của website gốc. Số lượng thực tế hiển thị từ API `/catalog`. Việc thay bộ seed bằng giáo trình được cấp phép có thể thực hiện tại `database/seed/`, không cần hardcode lại component.

## Giới hạn rõ ràng

- Chưa tích hợp Google OAuth, Zalo OA, email transactional hoặc hệ thống quản trị nội dung; không hiển thị chúng như dịch vụ đã kết nối.
- SpeechSynthesis cần browser/OS có voice phù hợp; fallback giữ nguyên văn bản và IPA.
- Không cam kết khớp pixel tuyệt đối: nhận diện StudyForge, nội dung mẫu và asset tự tạo khác website gốc; dùng font hệ thống khi chưa có font riêng được cài.
- SQLite phù hợp local/một instance; chưa triển khai backend nhiều replica/database cluster.
- Dockerfile/Compose là cấu hình bàn giao; container lane cần Docker daemon và chỉ được coi là kiểm chứng khi đã chạy thành công thực tế.
- TypeScript semantic check là lệnh riêng; build native-strip thành công không tự chứng minh type safety hoặc correctness.

## Luồng kiểm tra thủ công

1. Mở trang chủ → chọn ngữ pháp → mở thông tin bài đầu → học hết → quiz → xem kết quả.
2. Đăng ký tài khoản → lặp lại bài học → xác nhận XP/progress → restart app → đăng nhập lại và kiểm tra persistence.
3. Làm sai một câu → mở ôn tập → nhập sai rồi nhập đúng → xác nhận câu chỉ được gỡ khi đúng.
4. Chọn từ vựng → lật thẻ → phát âm → đánh dấu nhớ/cần ôn → hoàn thành → quiz.
5. Làm bài vượt cấp → kiểm tra chặng kế tiếp; gọi trực tiếp API bài khóa phải bị từ chối khi chưa đủ điều kiện.
6. Chỉnh tên trong hồ sơ, gửi góp ý, kiểm tra validation và lỗi session.
7. Thu nhỏ viewport 390px và 768px; kiểm tra navigation, dialog, flashcard, quiz và không tràn ngang.

Kết quả quan sát website, Evidence ID và ranh giới suy luận nằm trong [research.md](research.md). Các bước kiểm tra ở trên là hướng dẫn tái kiểm thử, không thay thế log kết quả chạy thực tế.
