# StudyForge

StudyForge đang ở **giai đoạn 1: chuẩn hóa cấu trúc source**. Định hướng V2 là ứng dụng lưu từ vựng cá nhân thành bộ sưu tập, tra từ trên web và qua Chrome Extension, rồi ôn tập theo nhiều cách. Frontend, backend và hợp đồng API đã được tách thành các khu vực rõ ràng. Mã V1 (ngữ pháp, quiz, XP) còn trong source để làm cơ sở tham khảo; chưa phải chức năng V2 đã hoàn thành.

**Trạng thái database:** dữ liệu SQLite cũ và bộ seed đã được đưa ra khỏi cây source đang dùng. Backend hiện vẫn chứa adapter và migration SQLite của V1. PostgreSQL trong Docker là mục tiêu của bước triển khai database tiếp theo; **chưa có schema PostgreSQL, container PostgreSQL hay migration chuyển đổi**. Không dùng Compose hiện tại để coi như đã triển khai V2.

## Bố cục

- `frontend/src/pages`: trang; `features`: tương tác theo nghiệp vụ; `components`: UI dùng lại; `layouts`: khung trang; `services`: API client; `core` và `styles`: tiện ích và CSS.
- `backend/src/modules`: nhóm nghiệp vụ. Mỗi module đặt controller, service và repository khi cần. `http` xử lý HTTP chung; `config` đọc môi trường; `infrastructure/database` chứa adapter DB; `shared` chứa mã dùng chung.
- `database/migrations`: migration hiện tại của V1, dùng cú pháp SQLite. Sẽ được thay bằng migration PostgreSQL sau khi chốt schema V2.
- `packages/contracts`: kiểu dữ liệu trao đổi frontend/backend.
- `infra/docker`, `compose.yaml`: cấu hình V1 còn lưu để tham chiếu; chưa chuyển sang PostgreSQL.
- `scripts`, `tests`, `docs`: công cụ phát triển, kiểm thử và tài liệu.

Xem [cấu trúc chi tiết](docs/project-structure.md), [kiến trúc](docs/architecture.md), [trạng thái database](docs/database.md) và [mức độ sẵn sàng DevOps](docs/devops-readiness.md).

## Môi trường phát triển

Node.js >= 22.23.4; dependency TypeScript nằm trong `node_modules` của project, khóa phiên bản bằng `package-lock.json`. Không dùng npm global. `frontend/.env.example` chỉ chứa cấu hình public/dev proxy; `backend/.env.example` là cấu hình V1, vẫn dùng SQLite cho tới khi triển khai PostgreSQL. File `.env` thật được ignore và không đưa vào frontend build.

```powershell
npm ci
npm run lint
npm run typecheck
npm run build
```

`npm test` còn chứa test V1 dựa vào bộ dữ liệu mẫu đã bỏ; bộ test này cần cập nhật theo schema và luồng V2. Trong môi trường Codex hiện tại, các test dùng HTTP loopback còn gặp lỗi `fetch failed`; không diễn giải đó là bằng chứng ứng dụng chạy được hay không chạy được trên máy ngoài sandbox.

**Chưa có quy trình chạy full-stack V2.** Hướng dẫn `npm run dev`, `npm start` và `compose.yaml` hiện vẫn phục vụ mã V1/SQLite, không phải PostgreSQL. Khi thiết kế DB V2 được chốt, sẽ bổ sung migration, biến môi trường, Compose và hướng dẫn chạy thống nhất.
