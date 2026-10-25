# DevOps readiness V2

Hiện có Dockerfile riêng frontend/backend và Compose gồm PostgreSQL 17, migration job, backend, frontend. Backend `npm ci` từ lockfile riêng; Node 22 dùng native TypeScript stripping để build. Image runtime chứa code build và dependency runtime, không chứa `.env`. PostgreSQL dùng named volume; `depends_on` chờ DB healthy và migration thành công. Health endpoint truy vấn DB. Cấu hình DB, port, origin và dictionary key được inject lúc chạy; không build key vào image.

**Đã kiểm tra:** `docker compose --env-file .env.example config --quiet`, Node syntax/import checks và unit tests V2. **Chưa kiểm tra:** image build, container startup, migration thật, persistence qua restart, end-to-end FE/BE/DB và screenshot. Docker daemon từ phiên Codex trả `Access is denied` đối với pipe `dockerDesktopLinuxEngine`; đây là giới hạn quyền của phiên, không chứng minh Docker Desktop không chạy.

Trước khi triển khai GitLab Runner/Harbor/Kubernetes/Helm cần: build Docker thành công; test migration trên DB trống và DB có dữ liệu; smoke tests API + browser; quy trình backup/restore volume; HTTPS và `SECURE_COOKIES=true` ở production; secret injection từ nền tảng triển khai; pin image bằng digest/CI tag; tài nguyên/observability; license cho dữ liệu từ điển. Những phần CI/CD/Kubernetes chưa triển khai trong phase này.
