# Kiến trúc hiện tại và hướng V2

```text
Browser → frontend/pages + features → frontend/services → backend/http
                                                   → backend/modules
                                                   → infrastructure/database
```

Frontend tách trang, luồng tương tác, UI dùng lại và API client. Backend là **modular monolith**: một process API, module theo nghiệp vụ, mỗi module có controller/service/repository nếu cần. `backend/src/app.ts` là composition root; `backend/src/main.ts` khởi động server. `packages/contracts` giữ các kiểu dữ liệu trao đổi.

Giai đoạn 1 chỉ chuẩn hóa vị trí source. Controller được chia thành `curriculum`, `assessment` và `progress`; service của V1 vẫn phục vụ giáo trình, quiz và XP. Những phần này chưa phản ánh mô hình từ vựng cá nhân V2 và sẽ được xem lại sau khi thiết kế PostgreSQL.

Adapter database hiện tại dùng SQLite và migration cũ. Dữ liệu cũ/seed tự động đã tách khỏi cây source, nhưng **PostgreSQL chưa được kết nối**. Khi sang giai đoạn database V2 cần xác định thực thể người dùng, từ, nghĩa, bộ sưu tập, từ đã lưu, ngữ cảnh tra từ, lịch ôn tập và nguồn nội dung; sau đó mới tạo migration PostgreSQL, repository mới và cấu hình container. Chỉ riêng việc tách thư mục không bảo đảm luồng V2 chạy được.

Cấu hình bí mật chỉ thuộc backend. `frontend/.env` dành cho port và API URL public; `backend/.env` dành cho kết nối DB và chính sách cookie. `.env`, output build, dữ liệu runtime và dependency local không được commit.
