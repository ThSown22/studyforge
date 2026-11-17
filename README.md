# StudyForge

StudyForge là ứng dụng web học từ vựng tiếng Anh dành cho trải nghiệm desktop. Người dùng có thể tra từ, lưu từ theo bộ sưu tập, theo dõi mức độ ghi nhớ và ôn tập bằng flashcard.

- **Live demo:** [studyforge.thsown.me](https://studyforge.thsown.me)
- **Deployment repository:** [studyforge-gitops](http://gitlab.thsown.com/thsown_group/studyforge-gitops)

Source code được tổ chức theo mô hình modular monolith, chạy local bằng Docker Compose và được phân phối qua GitLab CI, Harbor và Argo CD. Repository này chịu trách nhiệm cho application source, container images và CI quality gates; Kubernetes manifests và runbook vận hành nằm trong `studyforge-gitops`.

## Tính năng

- Đăng ký, đăng nhập và duy trì phiên bằng HttpOnly cookie.
- Tra từ Anh–Anh qua Merriam-Webster Learner's Dictionary API.
- Dịch định nghĩa Anh–Việt theo yêu cầu qua DeepL API.
- Hiển thị IPA, phát âm, nghĩa, ví dụ và Word Family.
- Tổ chức từ vựng theo bộ sưu tập cá nhân.
- Theo dõi ba trạng thái ghi nhớ: Chưa học, Đang học và Đã nhớ.
- Ôn tập flashcard theo từng bộ sưu tập với ba mức tự đánh giá.
- Cây kiến thức phát triển theo số từ đã lưu, số từ đã nhớ và lượt ôn.

> Phạm vi hiện tại tập trung vào web desktop. Project không tự động seed tài khoản hoặc dữ liệu demo.

## Kiến trúc ứng dụng

```text
Browser
   │
   ▼
Frontend
Vite build + Node HTTP server + /api reverse proxy
   │
   ▼
Backend
Node.js modular monolith
   │
   ├── Merriam-Webster API
   ├── DeepL API
   │
   ▼
PostgreSQL
```

Backend được chia theo module nghiệp vụ nhưng vẫn được build và triển khai như một ứng dụng thống nhất:

- `auth`: tài khoản và phiên đăng nhập.
- `collections`: quản lý bộ sưu tập.
- `vocabulary`: từ đã lưu và trạng thái ghi nhớ.
- `dictionary`: tích hợp từ điển, parser và dịch nghĩa.
- `review`: flashcard và lịch sử tự đánh giá.

Frontend và backend dùng chung TypeScript contracts qua npm workspace `@studyforge/contracts`.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | TypeScript, Vite, HTML, CSS |
| Backend | Node.js, TypeScript, esbuild |
| Database | PostgreSQL 17 |
| Shared contracts | npm workspaces |
| Local runtime | Docker, Docker Compose |
| CI | GitLab CI, Docker Runner |
| Registry | Harbor |
| CD | Argo CD và GitOps |

## Khởi chạy local

### Yêu cầu

- Docker Desktop chạy Linux containers.
- Docker Compose v2.

Node.js chỉ cần thiết khi chạy các lệnh development trực tiếp trên host. Phiên bản tối thiểu được khai báo trong `package.json`.

### 1. Tạo cấu hình

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

Đặt một giá trị ngẫu nhiên, đủ mạnh cho `STUDYFORGE_DB_PASSWORD`. Hai API key từ điển là tùy chọn; nếu không có DeepL, chức năng tra nghĩa tiếng Anh vẫn hoạt động.

### 2. Chạy stack

```bash
docker compose up --build -d
docker compose ps
```

Khi các service đã healthy:

- Website: <http://127.0.0.1:3000>
- Health endpoint: <http://127.0.0.1:3000/api/health>

Xem log:

```bash
docker compose logs -f frontend backend migrate
```

Dừng stack nhưng giữ dữ liệu PostgreSQL:

```bash
docker compose down
```

`docker compose down -v` sẽ xóa named volume và toàn bộ dữ liệu local.

## Cấu hình local

Docker Compose đọc một file `.env` tại repository root. File mẫu mô tả các biến được hỗ trợ:

| Biến | Bắt buộc | Mục đích |
| --- | --- | --- |
| `STUDYFORGE_DB_PASSWORD` | Có | Mật khẩu PostgreSQL local |
| `STUDYFORGE_HOST_FE_PORT` | Không | Port frontend trên host, mặc định `3000` |
| `STUDYFORGE_ALLOWED_ORIGINS` | Không | Danh sách origin được backend chấp nhận |
| `STUDYFORGE_SESSION_TTL_SECONDS` | Không | Thời hạn session, mặc định 7 ngày |
| `STUDYFORGE_MERRIAM_WEBSTER_API_KEY` | Không | API key từ điển phía backend |
| `STUDYFORGE_DEEPL_API_KEY` | Không | API key dịch EN→VI phía backend |

Không đưa database password hoặc API key vào frontend configuration.

## Development và quality gates

```bash
npm ci
npm run check
```

Các lệnh chính:

| Lệnh | Chức năng |
| --- | --- |
| `npm run build` | Build frontend và backend |
| `npm run lint` | Kiểm tra source và cấu trúc import |
| `npm run typecheck` | Typecheck contracts, frontend, backend và tests |
| `npm test` | Chạy unit tests |
| `npm run check` | Chạy lint, typecheck, unit tests và production build |
| `npm run db:migrate` | Chạy PostgreSQL migration bằng one-shot container |
| `npm run quality:docker` | Chạy quality gate trong container |
| `npm run smoke` | Smoke test frontend → backend → PostgreSQL |
| `npm run qa` | Chạy quality container và smoke test |

Quality gate đầy đủ trên Docker:

```bash
npm run qa
```

## GitLab CI/CD

Pipeline sử dụng GitLab Runner có tag `docker`:

```text
validate → publish → verify → update-gitops
```

| Stage | Trách nhiệm |
| --- | --- |
| `validate` | Chạy lint, typecheck, unit tests và production build |
| `publish` | Build và push frontend/backend image lên Harbor với full commit SHA |
| `verify` | Pull lại image, kiểm tra numeric non-root user, chạy migration, healthcheck và smoke test |
| `update-gitops` | Ghi image repository và full commit-SHA tag vào `studyforge-gitops/k8s/values.yaml` |

Merge Request và branch thông thường luôn chạy source validation. Image chỉ được publish từ default branch hoặc Git tag; GitOps chỉ được cập nhật từ default branch. Pipeline không gọi Kubernetes trực tiếp—Argo CD triển khai desired state từ GitOps repository.

CI/CD variables cần cấu hình trong GitLab:

| Variable | Mục đích |
| --- | --- |
| `HARBOR_USER` | Harbor robot account có quyền pull/push project `studyforge-app` |
| `HARBOR_PASS` | Secret của Harbor robot account |
| `GITOPS_REPO` | Clone URL của `studyforge-gitops` |
| `GITOPS_TOKEN` | Token có quyền ghi vào GitOps repository |

Credentials phải được cấu hình bằng GitLab CI/CD Variables, không lưu trong source repository.

## Database migrations

Migration nằm trong `database/migrations/postgres` và được chạy theo thứ tự tên file. Lịch sử cùng checksum được lưu trong bảng `schema_migrations`.

Khi thay đổi schema:

1. Tạo migration mới với số thứ tự tiếp theo.
2. Không sửa migration đã được áp dụng.
3. Chạy `npm run db:migrate` hoặc khởi động Compose stack.
4. Chạy `npm run qa` trước khi push.

Trong Kubernetes, migration chạy bằng một Kubernetes Job được đánh dấu là Argo CD `PreSync` hook trong Helm template. Argo CD chỉ rollout frontend và backend sau khi Job hoàn tất thành công.

## Cấu trúc repository

```text
studyforge-app/
├── frontend/                   # Frontend source và Node HTTP/proxy server
├── backend/                    # Modular monolith API
├── packages/contracts/         # Shared TypeScript contracts
├── database/migrations/        # PostgreSQL migrations
├── infra/docker/               # Multi-stage Dockerfiles
├── scripts/                    # Quality và migration tooling
├── tests/                      # Unit và smoke tests
├── compose.yaml                # Local stack và QA profiles
├── .gitlab-ci.yml              # CI và GitOps handoff
├── package.json
└── .env.example
```

## Security design

- Session được lưu bằng HttpOnly cookie; production bật secure cookie.
- API key và database credentials chỉ được truyền vào backend tại runtime.
- Production images chạy bằng numeric non-root user và có healthcheck.
- PostgreSQL không publish port ra host trong Compose mặc định.
- Kubernetes secrets, TLS, ingress và public routing được quản lý ngoài application source.

Chi tiết Kubernetes, CloudNativePG, Longhorn, cert-manager, NGINX Ingress và Cloudflare Tunnel được mô tả trong [studyforge-gitops](http://gitlab.thsown.com/thsown_group/studyforge-gitops).
