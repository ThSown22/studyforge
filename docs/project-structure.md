# Cấu trúc project

```text
StudyForge/
├── frontend/
│   ├── src/
│   │   ├── pages/          # Trang và điều hướng
│   │   ├── features/       # Luồng tương tác
│   │   ├── components/     # UI tái sử dụng
│   │   ├── layouts/        # Header, footer, khung trang
│   │   ├── services/       # API client
│   │   ├── core/           # DOM/navigation helpers
│   │   └── styles/         # Tokens và CSS theo khu vực
│   ├── public/
│   ├── .env.example
│   └── tsconfig.json
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── curriculum/
│   │   │   ├── assessment/
│   │   │   ├── progress/
│   │   │   ├── vocabulary/import/
│   │   │   ├── profile/
│   │   │   └── support/
│   │   ├── http/
│   │   ├── config/
│   │   ├── infrastructure/database/
│   │   ├── shared/
│   │   ├── app.ts
│   │   └── main.ts
│   ├── .env.example
│   └── tsconfig.json
├── database/migrations/  # Migration V1/SQLite, chưa phải PostgreSQL
├── packages/contracts/
├── infra/docker/          # Dockerfile V1, chưa triển khai PostgreSQL
├── tests/
├── scripts/
├── docs/
├── compose.yaml           # Compose V1/SQLite, chưa triển khai PostgreSQL
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── .dockerignore
└── README.md
```

Đây là **modular monolith + layered architecture**: một backend triển khai chung, chia theo nghiệp vụ; controller gắn route, service xử lý nghiệp vụ, repository truy vấn dữ liệu. `app.ts` ghép các module. Không cần tạo microservice hoặc package npm riêng cho mỗi thư mục ở giai đoạn này.

Các file V1 được **di chuyển theo trách nhiệm**, chưa viết lại nghiệp vụ: `learning` thành `curriculum`; route quiz và nộp bài chuyển vào controller `assessment`; route dashboard/review vào controller `progress`; bộ import đặt trong `vocabulary/import`. Một số service V1 còn phụ thuộc chéo vì logic cũ gắn với giáo trình/XP; sẽ thiết kế lại sau khi chốt V2. Không tạo các module rỗng chỉ để đủ sơ đồ.

Dữ liệu học mẫu không còn được nạp lúc khởi động. Dữ liệu SQLite runtime cũ và seed nằm trong `.tmp/retired-v1/` (được ignore), chờ xóa thủ công do công cụ xóa bị sandbox từ chối. Không coi đây là database hay seed của V2.

Một `package.json` và `package-lock.json` ở gốc quản lý TypeScript cục bộ. `frontend/tsconfig.json` và `backend/tsconfig.json` tách phạm vi kiểm tra kiểu; script build vẫn giữ đường dẫn từ gốc để các import dùng chung hoạt động.
