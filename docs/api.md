> **Tài liệu V1 (tham khảo):** Chức năng/schema dưới đây chưa phải thiết kế StudyForge V2. Bộ seed đã bỏ và PostgreSQL chưa triển khai. Xem [README](../README.md) để biết trạng thái hiện tại.

# API StudyForge

Base URL khi phát triển: `http://127.0.0.1:3001/api`. Browser frontend thường gọi `/api` qua proxy cùng origin. Request/response JSON UTF-8. Browser gửi cookie session bằng `credentials: include`; các API ghi kiểm tra origin được cho phép.

Types chi tiết ở `packages/contracts/src/index.ts`. Endpoint lỗi trả cùng cấu trúc:

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Đăng nhập để lưu tiến độ và mở đầy đủ nội dung học."
  }
}
```

Các mã HTTP thường gặp: `400` validation/JSON sai; `401` chưa đăng nhập hoặc credentials sai; `403` bài bị khóa/origin không được phép; `404` không có tài nguyên; `409` email/idempotency conflict; `429` rate limit; `500` lỗi nội bộ không lộ stack/SQL.

## Authentication và hồ sơ

| Method | Endpoint | Input | Response / quyền |
| --- | --- | --- | --- |
| GET | `/health` | — | Trạng thái API |
| GET | `/auth/me` | Cookie tùy chọn | `{user: User \| null}` |
| POST | `/auth/register` | `{name,email,password}` | `{user}`, tạo cookie session |
| POST | `/auth/login` | `{email,password}` | `{user}`, tạo cookie session |
| POST | `/auth/logout` | — | Thu hồi session và xóa cookie |
| GET | `/profile` | Cookie | `Profile`: user, thống kê và lịch sử attempts |
| PATCH | `/profile` | `{name}` | `{user}`; chỉ sửa hồ sơ của session hiện tại |

Email được chuẩn hóa; tên 2–80 ký tự; mật khẩu 8–128 ký tự. Cookie `studyforge_session` dùng HttpOnly, SameSite=Lax, TTL phía server và Secure khi cấu hình HTTPS. Không có OAuth giả, password-reset email giả hoặc endpoint trả password/token session cho frontend.

## Catalog và học tập

| Method | Endpoint | Input | Response / quyền |
| --- | --- | --- | --- |
| GET | `/catalog` | Cookie tùy chọn | `Catalog`: units, lessons, tổng số bài/từ, khóa theo user |
| GET | `/units/:id` | Cookie tùy chọn | `{unit,lessons}` của một chặng/chủ đề |
| GET | `/dashboard` | Cookie tùy chọn | `Dashboard`: tiến độ, XP, giai đoạn cây, bài tiếp theo |
| GET | `/lessons/:id` | Cookie tùy chọn | `LessonDetail`: kiến thức hoặc flashcards; kiểm tra khóa phía server |
| POST | `/lessons/:id/learn` | — | `{saved}`; guest không lưu progress |
| GET | `/lessons/:id/quiz` | Cookie tùy chọn | `Quiz` không có answer key |
| POST | `/lessons/:id/attempts` | `{answers,idempotencyKey}` | `AttemptResult`: điểm, pass/fail, XP và giải thích |
| GET | `/units/:id/challenge` | Cookie | `Quiz` vượt cấp của chặng ngữ pháp đã mở |
| POST | `/units/:id/attempts` | `{answers,idempotencyKey}` | `AttemptResult` vượt cấp |

Guest có thể học bài đầu tiên của chặng/chủ đề công khai được backend cho phép; kết quả thử không lưu thành lịch sử tài khoản. Mở bài tiếp theo và các chặng ngữ pháp phụ thuộc progress hoặc unlock. Không thể vượt khóa chỉ bằng sửa disabled button hay nhập URL trực tiếp.

Ví dụ submit bài học:

```json
{
  "answers": [
    { "questionId": "id-do-quiz-tra-ve", "answer": "is" }
  ],
  "idempotencyKey": "mot-uuid-moi-cho-lan-nop-nay"
}
```

Gửi đầy đủ câu hỏi do Quiz trả về; không dựa vào question ID minh họa ở trên. Giữ nguyên idempotency key khi retry cùng payload; lần nộp mới dùng key mới. Response gồm score, `passed`, số đúng/tổng số, `xpEarned`, `saved`, từng câu đúng/sai và explanation. Đạt ngưỡng 80% để qua bài/challenge; XP không cộng lặp khi làm lại bài đã hoàn thành.

## Ôn tập và góp ý

| Method | Endpoint | Input | Response / quyền |
| --- | --- | --- | --- |
| GET | `/review` | Cookie | `{items: ReviewItem[]}` thuộc user hiện tại |
| POST | `/review/:id/resolve` | `{answer}` | `{correct,correctAnswer,explanation}`; chỉ gỡ câu ôn khi trả lời đúng |
| POST | `/support` | `{category,message,email?}` | `{id}` góp ý đã lưu vào SQLite |

Góp ý được lưu nội bộ để chủ dự án xem trong DB; không tuyên bố đã gửi Zalo hoặc email. Thông tin public từ API không bao gồm password hash, token hash hoặc cấu hình bí mật.

## Kiểm tra nhanh

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/health
Invoke-RestMethod http://127.0.0.1:3001/api/catalog
```

Integration tests trong `tests/` kiểm tra quy tắc qua HTTP với database tạm. Tài liệu này mô tả API StudyForge tự xây dựng; không phải API nội bộ của website tham khảo.

## Nhập dữ liệu từ vựng

Không có public endpoint import có thể ghi tùy ý vào giáo trình. Chủ dự án dùng CLI local `npm run import:vocabulary -- --file ...`, mặc định dry-run, chỉ ghi khi thêm `--apply`. JSON/CSV phải kèm metadata nguồn và quyền sử dụng theo [vocabulary-data.md](vocabulary-data.md). Import bổ sung dữ liệu được cấp phép; không tự tải hoặc nhập nội dung bảo vệ của website tham khảo.
