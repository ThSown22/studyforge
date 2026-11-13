# Database V2

PostgreSQL chạy trong Docker Compose và lưu bền trong named volume `studyforge-postgres`. Migration `001_core.sql` tạo `users`, `user_settings`, `auth_sessions`, `collections`, `lexemes`, `saved_words`, `review_events`. Unique `(user_id, lexeme_id)` ngăn lưu trùng một từ cho cùng người dùng; foreign key kép bảo đảm bộ sưu tập thuộc đúng user. Trạng thái chỉ có `new`, `learning`, `known`.

`002_dictionary.sql` mô hình hóa nguồn và nội dung từ điển chỉ khi giấy phép cho phép lưu. Trigger ngăn ghi lâu dài đối với nguồn `live_only`. Adapter Merriam-Webster hiện truy vấn trực tiếp, không ghi nội dung provider vào database.

`scripts/migrate-postgres.mjs` dùng `schema_migrations`, SHA-256 checksum và PostgreSQL advisory lock. Không sửa migration đã áp dụng; mọi thay đổi schema cần migration mới. Dự án không seed dữ liệu mẫu. Dùng `docker compose down` để dừng; tránh `down -v` nếu muốn giữ dữ liệu.
