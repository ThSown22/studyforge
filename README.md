# StudyForge

StudyForge là ứng dụng web học từ vựng tiếng Anh cá nhân hóa. Người dùng có thể tra từ, lưu mỗi từ vào một bộ sưu tập, theo dõi mức độ ghi nhớ và ôn tập bằng flashcard theo đúng chủ đề mình lựa chọn.

Project được xây dựng theo hướng **Docker-first modular monolith**, phù hợp để học full-stack, thực hành DevOps và phát triển tiếp thành hệ thống triển khai qua GitLab CI/CD, container registry và Kubernetes.

> Phạm vi hiện tại tập trung vào trải nghiệm web desktop. Project không chứa dữ liệu mẫu và không tự động seed tài khoản hoặc từ vựng.

## Tính năng chính

- Đăng ký, đăng nhập và session bằng HttpOnly cookie.
- Tra từ Anh–Anh qua Merriam-Webster Learner's Dictionary API.
- Dịch định nghĩa Anh–Việt theo yêu cầu qua DeepL API.
- Phiên âm IPA, phát âm, nghĩa, ví dụ và Word Family.
- Quản lý bộ sưu tập từ vựng cá nhân.
- Mỗi từ chỉ thuộc một bộ sưu tập.
- Ba trạng thái ghi nhớ: Chưa học, Đang học và Đã nhớ.
- Flashcard theo từng bộ sưu tập với ba mức tự đánh giá.
- Cây kiến thức phát triển theo số từ đã lưu, từ đã nhớ và lượt ôn.

## Kiến trúc

```text
Browser
   │
   ▼
Frontend container
Vite build + Node HTTP server + /api reverse proxy
   │
   ▼
Backend container
Node.js modular monolith
   │
   ├── Merriam-Webster API
   ├── DeepL API
   │
   ▼
PostgreSQL container
```

Backend được tổ chức theo module nghiệp vụ:

- `auth`: tài khoản và phiên đăng nhập.
- `collections`: quản lý bộ sưu tập.
- `vocabulary`: lưu từ và trạng thái ghi nhớ.
- `dictionary`: từ điển, parser và dịch nghĩa.
- `review`: hàng đợi flashcard và lịch sử tự đánh giá.

Migration chạy trong một one-shot container trước khi backend khởi động. Frontend chỉ được khởi động sau khi backend healthy.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | TypeScript, Vite, HTML, CSS |
| Backend | Node.js, TypeScript, esbuild |
| Database | PostgreSQL 17 |
| Shared contracts | npm workspace `@studyforge/contracts` |
| Container | Docker, Docker Compose |
| Quality | TypeScript strict mode, Node test runner, smoke test |

## Cấu trúc repository

```text
StudyForge/
├── frontend/               # Frontend source, Vite build và HTTP/proxy server
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── backend/                # Modular monolith API
│   ├── src/
│   │   ├── modules/
│   │   ├── http/
│   │   ├── config/
│   │   ├── infrastructure/
│   │   └── shared/
│   ├── package.json
│   └── tsconfig.json
├── database/
│   └── migrations/postgres/
├── packages/
│   └── contracts/          # Types trao đổi giữa frontend và backend
├── infra/
│   └── docker/             # Dockerfile riêng cho frontend và backend
├── tests/
│   ├── unit/
│   └── smoke/
├── scripts/                # Quality check và PostgreSQL migration
├── compose.yaml
├── package.json            # Điều phối npm workspaces
├── package-lock.json       # Lockfile duy nhất của monorepo
└── .env.example
```

## Yêu cầu môi trường

Để chạy ứng dụng bằng Docker:

- Docker Desktop với Linux containers.
- Docker Compose v2.

Không cần cài PostgreSQL Server hoặc package npm global trên Windows.

Nếu muốn chạy quality check trực tiếp trên máy:

- Node.js `22.23.4` trở lên.
- npm tương thích với lockfile v3.

## Khởi chạy nhanh

### 1. Tạo cấu hình môi trường

Trong PowerShell tại thư mục project:

```powershell
Copy-Item .env.example .env
```

Mở `.env` và thay `STUDYFORGE_DB_PASSWORD` bằng mật khẩu dài, ngẫu nhiên.

### 2. Build và chạy toàn bộ stack

```powershell
docker compose up --build -d
docker compose ps
```

Sau khi các container healthy:

- Website: <http://127.0.0.1:3000>
- Health endpoint: <http://127.0.0.1:3000/api/health>

### 3. Xem log

```powershell
docker compose logs -f frontend backend migrate
```

### 4. Dừng stack

```powershell
docker compose down
```

Lệnh trên giữ nguyên named volume PostgreSQL. Không chạy `docker compose down -v` nếu muốn bảo toàn tài khoản, bộ sưu tập và tiến độ học.

## Cấu hình môi trường

Project chỉ sử dụng một file `.env` tại root. File thật được Git ignore; chỉ `.env.example` được commit.

| Biến | Bắt buộc | Mục đích |
| --- | --- | --- |
| `STUDYFORGE_DB_PASSWORD` | Có | Mật khẩu PostgreSQL local |
| `STUDYFORGE_HOST_FE_PORT` | Không | Port frontend expose ra host, mặc định `3000` |
| `STUDYFORGE_ALLOWED_ORIGINS` | Không | Danh sách origin được backend chấp nhận |
| `STUDYFORGE_SESSION_TTL_SECONDS` | Không | Thời hạn session, mặc định 7 ngày |
| `STUDYFORGE_MERRIAM_WEBSTER_API_KEY` | Không | API key từ điển, chỉ tồn tại ở backend |
| `STUDYFORGE_DEEPL_API_KEY` | Không | API key dịch EN→VI, chỉ tồn tại ở backend |

Nếu không cấu hình DeepL, tra nghĩa tiếng Anh vẫn hoạt động. Frontend không nhận database password hoặc API key của nhà cung cấp.

## npm workspaces

Monorepo gồm ba workspace:

```text
@studyforge/frontend
@studyforge/backend
@studyforge/contracts
```

Mỗi workspace sở hữu dependency, build script và typecheck riêng. Root `package.json` chỉ điều phối các tác vụ toàn project. Toàn bộ dependency được khóa bằng một `package-lock.json`.

Để cài dependency local trong project:

```powershell
npm ci
```

Không sử dụng `npm install -g`.

## Lệnh phát triển và kiểm thử

| Lệnh | Chức năng |
| --- | --- |
| `npm run build` | Build frontend bằng Vite và backend bằng esbuild |
| `npm run typecheck` | Typecheck contracts, frontend, backend và tests |
| `npm run lint` | Kiểm tra cú pháp, import và định dạng cơ bản |
| `npm test` | Chạy unit tests |
| `npm run check` | Chạy lint, typecheck, unit tests và production build |
| `npm run compose:up` | Build và chạy Compose stack |
| `npm run compose:down` | Dừng stack nhưng giữ database volume |
| `npm run db:migrate` | Chạy migration one-shot container |
| `npm run quality:docker` | Chạy quality gate trong container |
| `npm run smoke` | Kiểm tra frontend proxy, backend và PostgreSQL qua Compose |
| `npm run qa` | Chạy quality container rồi smoke test |

Quality gate đầy đủ:

```powershell
npm run qa
```

## Database và migrations

PostgreSQL sử dụng named volume `studyforge-postgres`. Migration nằm trong `database/migrations/postgres` và được thực thi theo thứ tự tên file.

Quy tắc migration:

- Migration đã áp dụng không được chỉnh sửa nội dung.
- Thay đổi schema mới phải tạo migration mới.
- Migration được ghi checksum trong bảng `schema_migrations`.
- Project không tự seed dữ liệu demo.

## Bảo mật cấu hình

- Không commit `.env` hoặc API key.
- API key Merriam-Webster và DeepL chỉ được đọc ở backend.
- Frontend chỉ nhận các biến được cho phép thông qua `/config.js`.
- Session được lưu bằng HttpOnly cookie.
- Database không expose port trực tiếp ra host trong Compose mặc định.
- Production images chạy bằng non-root user.

## Trạng thái kiểm thử

Lần xác minh gần nhất: **15/11/2026**.

- npm audit: không phát hiện vulnerability.
- TypeScript strict check: pass.
- Unit tests: `25/25` pass.
- Frontend Vite production build: pass.
- Backend esbuild production build: pass.
- Docker quality container: pass.
- Docker Compose smoke test: pass.
- PostgreSQL, backend và frontend healthcheck: healthy.
- Dữ liệu PostgreSQL được giữ nguyên qua rebuild container.
