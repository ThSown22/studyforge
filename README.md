# StudyForge V2

StudyForge là ứng dụng học từ vựng tiếng Anh cá nhân: tra từ, lưu mỗi từ vào đúng một bộ sưu tập, quản lý ba trạng thái ghi nhớ và ôn bằng thẻ. Codebase hiện chỉ giữ kiến trúc V2; giáo trình, ngữ pháp, quiz, SQLite và dữ liệu mẫu của V1 đã được loại bỏ.

## Kiến trúc

- Frontend TypeScript chạy trong container riêng và chuyển tiếp `/api/*` đến backend.
- Backend Node.js/TypeScript là modular monolith, chia theo auth, collections, vocabulary, dictionary và review.
- PostgreSQL chạy bằng Docker Compose; migration chạy bằng one-shot container trước backend.
- Root `.env` là file cấu hình local duy nhất. Backend và frontend nhận cấu hình runtime từ Compose.

## Cấu trúc repository

```text
frontend/            # Web app, Vite build và HTTP/proxy server
backend/             # Modular monolith API, esbuild production bundle
database/migrations/ # PostgreSQL migrations có version
packages/contracts/  # Types dùng chung qua @studyforge/contracts
infra/docker/        # Dockerfile riêng cho frontend và backend
tests/unit/          # Unit tests
tests/smoke/         # Kiểm tra end-to-end của Compose stack
scripts/             # Quality check và PostgreSQL migration dùng chung
```

Root `package.json` khai báo npm workspaces. Frontend, backend và contracts tự sở hữu dependency, lệnh build và typecheck; root chỉ điều phối toàn bộ monorepo.

## Chạy bằng Docker Compose

Yêu cầu Docker Desktop với Linux containers. Không cần cài PostgreSQL hoặc package npm global trên Windows.

1. Sao chép `.env.example` thành `.env` ở thư mục gốc.
2. Đổi `STUDYFORGE_DB_PASSWORD` thành mật khẩu dài, ngẫu nhiên.
3. Nếu có quyền sử dụng Merriam-Webster Learner's API, điền `STUDYFORGE_MERRIAM_WEBSTER_API_KEY`.
4. Để bật nghĩa tiếng Việt cho bản demo, đăng ký DeepL Developer miễn phí rồi điền `STUDYFORGE_DEEPL_API_KEY`. Không đặt key trong frontend.
5. Chạy:

```powershell
docker compose up --build -d
docker compose ps
```

6. Mở `http://localhost:3000`. Health endpoint qua frontend proxy: `http://localhost:3000/api/health`.
7. Dừng bằng `docker compose down`. Không dùng `down -v` nếu muốn giữ dữ liệu PostgreSQL.

Compose chờ PostgreSQL healthy, chạy migration rồi mới khởi động backend và frontend. Named volume `studyforge-postgres` giữ dữ liệu qua các lần rebuild. Dự án không tự seed dữ liệu mẫu.

## Lệnh chính

| Lệnh | Mục đích |
| --- | --- |
| `npm test` | Unit tests V2 |
| `npm run lint` | Kiểm tra source và cấu trúc |
| `npm run typecheck` | TypeScript strict check |
| `npm run build` | Build frontend và backend vào `frontend/dist` và `backend/dist` |
| `npm run db:migrate` | Chạy migration container |
| `npm run compose:up` | Build và chạy stack |
| `npm run compose:down` | Dừng stack, giữ volume |
| `npm run quality:docker` | Chạy lint, typecheck, unit tests và production build trong QA container |
| `npm run smoke` | Build và chạy smoke test qua Compose |
| `npm run qa` | Chạy quality gate rồi chạy Compose smoke test |

Root `package-lock.json` khóa toàn bộ npm workspaces gồm frontend, backend và contracts. Mỗi workspace sở hữu lệnh build/typecheck của mình; Dockerfiles chỉ gọi các lệnh workspace bằng `npm ci` và `npm run`. Không cài package global và quality container không ghi `node_modules` ra máy Windows. Ngày 15/11/2026, QA Docker đã xác nhận lint, typecheck frontend/backend/contracts/tests, 25 unit tests, production build Vite/esbuild, proxy, PostgreSQL, vòng đời auth, collection CRUD, lọc/chuyển/chống lưu trùng/cập nhật trạng thái từ, hàng đợi ôn theo bộ và ba mức tự đánh giá. Merriam-Webster API thật, DeepL EN→VI thật, trang chi tiết bộ sưu tập, phiên flashcard và năm giai đoạn cây kiến thức cũng đã được kiểm tra trong trình duyệt desktop. Restart PostgreSQL và toàn stack giữ nguyên dữ liệu; backend retry kết nối mà không crash.

## Cấu hình

Chỉ commit `.env.example`; không commit `.env`. Các biến chính:

- `STUDYFORGE_DB_PASSWORD`: mật khẩu PostgreSQL local.
- `STUDYFORGE_HOST_FE_PORT`: cổng frontend expose ra host.
- `STUDYFORGE_ALLOWED_ORIGINS`: danh sách origin được backend chấp nhận.
- `STUDYFORGE_SESSION_TTL_SECONDS`: thời hạn session.
- `STUDYFORGE_MERRIAM_WEBSTER_API_KEY`: key tùy chọn, server-side.
- `STUDYFORGE_DEEPL_API_KEY`: key DeepL server-side dùng để dịch định nghĩa EN sang VI khi người dùng yêu cầu.

DeepL chỉ được gọi khi người dùng bấm `VI`. Nếu biến để trống, tra nghĩa EN vẫn hoạt động bình thường và nút `VI` báo rõ tính năng chưa được cấu hình. StudyForge không đưa key vào bundle frontend hoặc response API.

Git hiện chỉ ở local; chưa cấu hình remote hoặc push GitHub.
