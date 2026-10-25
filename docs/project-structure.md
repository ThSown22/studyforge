# Cấu trúc project

- `frontend/src/pages`: các trang V2 và trang V1 còn giữ để tham khảo. Entry đang dùng là `frontend/src/v2-main.ts`.
- `frontend/src/components`, `layouts`, `services`, `core`, `styles`: UI dùng chung, shell, HTTP client và design tokens. Frontend không giữ database credentials hay key dictionary.
- `backend/src/modules`: auth, collections, vocabulary, dictionary, review theo nghiệp vụ. Mỗi module tách controller/service/repository khi có truy cập dữ liệu.
- `backend/src/http`, `config`, `infrastructure/database`, `shared`: routing, cấu hình, PostgreSQL pool, validation và lỗi. Entry V2 là `backend/src/v2-main.ts`; V1 `main.ts`/`app.ts` còn giữ làm mốc chuyển đổi.
- `backend/package.json` và `backend/package-lock.json`: dependencies riêng của backend.
- `database/migrations/postgres`: schema V2 có version; `database/migrations/*.sql` là SQLite V1.
- `packages/contracts`: TypeScript types FE ↔ BE; hiện có cả V1/V2 để chuyển đổi từng bước.
- `infra/docker`: Dockerfiles riêng FE/BE. `compose.yaml`: PostgreSQL, migration job, backend, frontend.
- `scripts`: build, migration và công cụ kiểm tra. `tests`: unit V2 cùng test V1 cần phân loại lại.
- `.tmp`, `dist`, `node_modules`, `.env`: file sinh/runtime được ignore, không phải source.

Chưa xóa code V1 hàng loạt; sau khi nghiệm thu V2 bằng Docker sẽ loại bỏ theo phase có local commit để rollback.
