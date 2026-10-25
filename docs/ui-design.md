# UI design V2

Nguồn chuẩn nghiệp vụ là `StudyForge_V2_Full_Codex_Handoff.md`; `StudyForge_V2_UI_Handoff.md` định hình UI. MagicPath là mẫu cũ để tham khảo ngôn ngữ thị giác, không phải đặc tả cuối.

Design tokens hiện tại: nền kem `#F7F5F0`, chữ/primary dark teal `#194B4A`, mint `#50BEAF`, border `#D7E5E4`; Inter nếu sẵn có, fallback Segoe UI/Arial. Header chỉ Trang chủ · Kho từ · Tra từ; footer ba cột dark teal. Trang chủ có hero card, vườn từ dựa trên stats thực, hai thẻ chức năng. Kho từ dùng một cột danh sách và panel chi tiết; Tra từ tách search hero, card kết quả và aside. POS tabs chỉ ghi tên, nghĩa và ví dụ không bị cắt theo số lượng cố định; Word Family là khối riêng. EN mặc định, VI chưa có provider thì báo rõ. Responsive breakpoint chính 1000/760/520px.

Visual QA và screenshot sau build Docker còn chờ quyền truy cập Docker daemon; chưa đánh giá tương đồng với MagicPath bằng ảnh trong phase này.
