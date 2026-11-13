# DevOps readiness V2

Hiện có Dockerfile riêng frontend/backend và Compose gồm PostgreSQL 17, migration job, backend, frontend. `compose.yaml` phục vụ development và integration test local; production sau này sẽ inject HTTPS, secrets và resource policy bằng Kubernetes thay vì dùng nguyên cấu hình local. Backend `npm ci` từ lockfile riêng; Node 22 dùng native TypeScript stripping để build. Image runtime chứa code build và dependency runtime, không chứa `.env`. PostgreSQL dùng named volume; `depends_on` chờ DB healthy và migration thành công. Health endpoint truy vấn DB. Cấu hình DB, port, origin và dictionary key được inject lúc chạy; không build key vào image.

Profile `qa` có hai one-shot service. `quality` chạy lint, strict typecheck, unit tests và production build bằng dependency cục bộ của image. `smoke` đi qua frontend proxy và kiểm tra auth lifecycle, collection CRUD, lọc/chuyển/chống trùng/cập nhật trạng thái từ và review, rồi dọn dữ liệu test.

**Đã kiểm tra ngày 13/11/2026:** Compose config; QA container với lint, strict typecheck FE/BE, 15/15 unit tests và production build; Compose smoke test mở rộng; migration idempotent; dữ liệu không đổi qua restart PostgreSQL và toàn stack. Backend xử lý lỗi idle connection và retry khi DB khởi động chậm mà không còn crash. **Chưa kiểm tra:** backup/restore volume, browser QA responsive/screenshot, Dictionary API thật và dịch VI.

Trước khi triển khai GitLab Runner/Harbor/Kubernetes/Helm cần: browser smoke/responsive QA; quy trình backup/restore volume; Dictionary API thật và dịch VI; HTTPS và `SECURE_COOKIES=true` ở production; secret injection từ nền tảng triển khai; pin image bằng digest/CI tag; tài nguyên/observability; license cho dữ liệu từ điển. Những phần CI/CD/Kubernetes chưa triển khai trong phase này.
