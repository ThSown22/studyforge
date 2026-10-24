# Mức độ sẵn sàng DevOps

Giai đoạn 1 đã tách `frontend/`, `backend/`, `database/`, contracts và Dockerfiles theo image. Dependency TypeScript cài cục bộ bằng lockfile; cấu hình `.env` và output được ignore.

**Chưa sẵn sàng triển khai V2:** `compose.yaml`, hai Dockerfile và adapter backend là bản V1/SQLite. Chưa có PostgreSQL service, volume, healthcheck, biến kết nối, migration PostgreSQL hay kiểm chứng container. Không chạy Compose này để đánh giá kiến trúc PostgreSQL. Việc cấu hình image/Compose được dành cho bước Docker tiếp theo đúng yêu cầu.

Để tiến tới GitLab Runner → Harbor → Kubernetes: thiết kế schema V2, tạo backend PostgreSQL adapter/migration, cấu hình Compose local, xác minh hai image build và healthcheck, rồi mới thêm CI/CD và manifests/Helm. Chưa triển khai Kubernetes, GitLab CI/CD hoặc Harbor.
