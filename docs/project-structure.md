# Cấu trúc project

```text
StudyForge/
├── frontend/
│   └── src/
│       ├── components/     # UI tái sử dụng
│       ├── core/           # DOM/navigation helpers
│       ├── features/       # Luồng nghiệp vụ phía client
│       ├── layouts/        # Header và footer
│       ├── pages/          # Trang V2
│       ├── services/       # API client
│       └── styles/         # Design tokens và CSS
├── backend/
│   └── src/
│       ├── modules/        # Auth, collections, dictionary, review, vocabulary
│       ├── http/           # Router, middleware, static/proxy handler
│       ├── config/         # Validation environment
│       ├── infrastructure/ # PostgreSQL pool
│       └── shared/         # Error và validation dùng chung
├── database/migrations/postgres/
├── packages/contracts/    # Kiểu dữ liệu FE ↔ BE
├── infra/docker/          # Dockerfile frontend/backend
├── scripts/               # Build, config, migration, smoke
├── tests/                 # Unit tests V2
├── docs/
└── compose.yaml
```

Entry points là `frontend/src/main.ts` và `backend/src/main.ts`. PostgreSQL là database duy nhất của V2. `dist/`, `.tmp/`, `tmp/`, `node_modules/` và `.env` là artefact/runtime cục bộ, không phải source và được Git ignore.
