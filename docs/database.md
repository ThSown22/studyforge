# Trạng thái database

**Mục tiêu V2:** PostgreSQL chạy trong Docker, không nạp nội dung học mẫu. Thiết kế schema và container chưa được triển khai ở giai đoạn chỉ sắp xếp source.

Hiện trong `database/migrations/` còn hai migration của V1 dùng **cú pháp SQLite**. Adapter tại `backend/src/infrastructure/database/connection.ts` cũng dùng `node:sqlite`. Các file này là mã cũ để tham khảo, **không phải migration PostgreSQL** và không được áp dụng cho PostgreSQL.

Cơ chế nạp seed tự động đã gỡ khỏi `backend/src/app.ts`, lệnh `db:seed` đã gỡ khỏi `package.json`. Dữ liệu SQLite cũ cùng file seed được chuyển vào `.tmp/retired-v1/`, ngoài cây source/đường dẫn runtime và được `.gitignore` loại trừ. Sandbox không cho xóa, nên chúng vẫn còn trên ổ đĩa cho tới khi người dùng xóa thủ công.

Schema V2 sẽ được thiết kế theo nhu cầu lưu từ tra cứu vào bộ sưu tập và ôn tập; không chuyển nguyên bảng `units/lessons/questions/XP` từ V1 sang PostgreSQL. Cần chốt mô hình và migration trước khi viết repository mới hoặc khởi chạy database.
