# Kiến trúc V2

StudyForge vẫn là modular monolith: frontend TypeScript chạy trong container riêng, backend Node.js/TypeScript chạy trong container riêng, PostgreSQL là service dữ liệu. Frontend gửi `/api/*` qua reverse proxy nhỏ trong `scripts/frontend-server.mjs` đến backend. Backend chia module auth, collections, vocabulary, dictionary và review; controller nhận HTTP, service giữ quy tắc nghiệp vụ, repository truy vấn PostgreSQL. `packages/contracts` chứa kiểu dữ liệu trao đổi. `database/migrations/postgres` được job `migrate` áp dụng có checksum trước khi backend khởi động.

```text
Browser → frontend container → backend container → PostgreSQL volume
                                   └→ Merriam-Webster API (khi có key)
```

Dictionary adapter chỉ trả kết quả live; không ghi định nghĩa/ví dụ của provider vào DB khi chưa xác nhận giấy phép. `lexemes` và `saved_words` lưu từ người dùng đã chọn, bộ sưu tập và trạng thái. Review events ghi nhận lượt tự đánh giá, không tự sửa trạng thái ghi nhớ. V1 SQLite vẫn nằm trong source nhưng không được Compose V2 gọi. Chưa có migration dữ liệu V1 sang V2 tự động.
