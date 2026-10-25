# StudyForge V2

StudyForge là ứng dụng học từ vựng tiếng Anh cá nhân: tra từ, lưu mỗi từ vào đúng một bộ sưu tập, tự đánh dấu Chưa học/Đang học/Đã nhớ và ôn bằng thẻ. Dự án đang chuyển từ V1 sang V2 trên codebase hiện có. Giao diện V1 và adapter SQLite còn trong source để tham khảo, nhưng Compose V2 dùng PostgreSQL và không nạp dữ liệu mẫu.

## Trạng thái hiện tại

Mã V2 đã có API auth, collections, saved words, dictionary adapter và review events; giao diện web có Trang chủ, Kho từ, Tra từ, nhập từ thủ công và lượt ôn tự đánh giá. Ngày 25/10/2026, người dùng đã chạy thành công `docker compose --profile qa run --build --rm smoke`; luồng qua frontend proxy → backend → PostgreSQL đã xác nhận auth/session, tạo bộ sưu tập, lưu từ không trùng, đổi trạng thái, hàng đợi ôn, review event và thống kê. Từ điển cần Merriam-Webster Learner's API key. Khi không có key, tra từ và phần lật thẻ cần định nghĩa trả lỗi rõ ràng; ứng dụng không giả lập nghĩa. Bản dịch từng sense tiếng Việt và Chrome Extension chưa hoàn thành.

## Chạy local bằng Docker Compose

Cần Docker Desktop chạy với Linux containers và Docker Compose. Không cần cài PostgreSQL Server hoặc chạy backend trên Windows.

1. Sao chép `.env.example` thành `.env` ở thư mục gốc, đổi `STUDYFORGE_DB_PASSWORD` thành mật khẩu dài, ngẫu nhiên. File `.env` được Git ignore. Điền `STUDYFORGE_MERRIAM_WEBSTER_API_KEY` nếu có quyền sử dụng API; không đặt key trong frontend.
2. Tại thư mục gốc chạy `docker compose up --build -d`.
3. Xem `docker compose ps` và `docker compose logs --tail=100 db migrate backend frontend`.
4. Mở `http://localhost:3000`. Health API qua frontend proxy: `http://localhost:3000/api/health`.
5. Chạy smoke test container bằng `docker compose --profile qa run --rm smoke`. Test tạo tài khoản/từ ngẫu nhiên rồi xóa dữ liệu test khi kết thúc. Không cần dictionary key cho smoke test này.
6. Dừng bằng `docker compose down`. **Không thêm `-v`** nếu muốn giữ dữ liệu PostgreSQL.

Compose khởi động `db` trước, chờ healthcheck, chạy `migrate` một lần rồi mới mở `backend`, sau đó `frontend`. Migration có ledger/checksum; chạy lại bằng `docker compose run --rm migrate`. Volume `studyforge-postgres` giữ dữ liệu qua lần dừng và build lại. Không có seed tự động.

Cổng web đổi bằng `STUDYFORGE_HOST_FE_PORT` trong `.env`. Root `.env` là file cấu hình duy nhất Docker Compose tự đọc và file này được Git ignore. Compose inject cấu hình backend/frontend lúc chạy; image không chứa mật khẩu. `backend/.env.example` và `frontend/.env.example` chỉ dành cho trường hợp chạy từng tiến trình trực tiếp ngoài Compose; các file `backend/.env` và `frontend/.env` không được Compose sử dụng. Không copy secrets vào frontend.

## Dependencies và kiểm tra

`backend/package.json` cùng `backend/package-lock.json` khóa `pg` và `@types/pg` cho backend. Root `package.json`/`package-lock.json` quản lý TypeScript dùng cho tooling. Dockerfile backend dùng `npm ci` từ backend lockfile và build bằng Node 22; không cần `npm install -g`. Kiểm tra cú pháp Compose: `docker compose --env-file .env.example config --quiet`. Unit tests V2: `npm run test:v2` nếu dependencies môi trường đã sẵn. Smoke test Compose đã được người dùng xác nhận chạy thành công ngày 25/10/2026; persistence qua restart, browser QA và tích hợp Dictionary API thật vẫn cần kiểm tra riêng. Các lệnh `dev`, `start`, `db:migrate`, `test` cũ hiện phục vụ V1 và chưa phải quy trình chạy V2.

## Tài liệu

- [Kiến trúc](docs/architecture.md)
- [Cấu trúc source](docs/project-structure.md)
- [Database](docs/database.md)
- [API](docs/api.md)
- [Tính năng và trạng thái](docs/features.md)
- [Sẵn sàng DevOps](docs/devops-readiness.md)
- [Đặc tả sản phẩm V2](docs/StudyForge_V2_Full_Codex_Handoff.md)

Git hiện chỉ ở local. Baseline V1 nằm trong commit đầu tiên; chưa có remote hay GitHub repository.
