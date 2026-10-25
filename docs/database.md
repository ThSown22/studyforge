# Database V2

PostgreSQL 17 chạy trong Docker Compose, volume `studyforge-postgres`. Migration `001_core.sql` tạo `users`, `user_settings`, `auth_sessions`, `collections`, `lexemes`, `saved_words`, `review_events`. Unique `(user_id, lexeme_id)` giữ mỗi từ một bản lưu/người dùng; foreign key kép giữ bộ sưu tập thuộc cùng user. `learning_status` chỉ có `new`, `learning`, `known`. Không có seed.

`002_dictionary.sql` mô tả nguồn và nội dung từ điển có thể lưu **chỉ khi** giấy phép cho phép (`licensed_persist`). Nguồn `live_only` bị trigger ngăn ghi nội dung lâu dài. Adapter Merriam-Webster hiện chỉ truy vấn trực tiếp và trả dữ liệu chuẩn hóa cho client, không ghi vào các bảng dictionary. Bản dịch VI theo từng sense chưa có provider, nên `definitionVi` hiện null. Không suy ra license từ khả năng gọi API.

`scripts/migrate-postgres.mjs` dùng `schema_migrations` (version + SHA256) và advisory lock. Một migration đã áp dụng không được sửa nội dung; thay đổi schema tiếp theo cần file mới. V1 SQLite và bản backup nằm ngoài volume PostgreSQL; không có quy trình import người dùng tự động. Lệnh dừng an toàn là `docker compose down`, không dùng `down -v` khi muốn giữ dữ liệu.
