# Kiến trúc V2

StudyForge dùng **Modular Monolith + Layered Architecture**. Frontend, backend và PostgreSQL chạy trong các container riêng nhưng backend vẫn là một deployable unit, phù hợp quy mô hiện tại và có ranh giới module rõ để tách service sau này nếu thật sự cần.

```text
Browser → frontend container → backend container → PostgreSQL volume
                                   └→ Merriam-Webster API (khi có key)
```

Frontend gửi `/api/*` cùng origin qua proxy trong `scripts/frontend-server.mjs`. Trong backend, controller xử lý HTTP, service giữ quy tắc nghiệp vụ và repository truy vấn PostgreSQL. `packages/contracts` chứa contract FE ↔ BE. One-shot service `migrate` áp dụng migration có checksum trước khi backend khởi động.

Dictionary adapter trả dữ liệu live và không lưu nội dung provider khi chưa xác nhận giấy phép. `lexemes`, `saved_words` và `review_events` chỉ lưu dữ liệu học tập của người dùng. Không có SQLite hay seed V1 trong runtime V2.
