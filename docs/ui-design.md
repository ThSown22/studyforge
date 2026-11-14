# UI design V2

Nguồn chuẩn nghiệp vụ là `StudyForge_V2_Full_Codex_Handoff.md`; `StudyForge_V2_UI_Handoff.md` định hình UI. MagicPath là mẫu cũ để tham khảo ngôn ngữ thị giác, không phải đặc tả cuối.

Design tokens hiện tại: nền kem `#F7F5F0`, chữ/primary dark teal `#194B4A`, mint `#50BEAF`, border `#D7E5E4`; Segoe UI Variable/Segoe UI để không phụ thuộc font bên ngoài. Header chỉ Trang chủ · Kho từ · Tra từ; footer dark teal dạng một hàng gọn gồm thương hiệu, ba liên kết và copyright. Trang chủ có hero card, cây kiến thức năm giai đoạn dựa trên điểm `tổng từ + 2 × từ đã nhớ + lượt ôn`, hai thẻ chức năng. Kho từ mở từng bộ sang trang chi tiết riêng; nút ôn nằm trong trang đó thay vì ôn toàn bộ kho. Phiên ôn dùng flashcard chủ động nhớ trước khi lật, nghĩa EN/VI, phát âm, ba mức tự đánh giá, tiến độ và tổng kết. Tra từ tách search hero, card kết quả và aside. POS tabs chỉ ghi tên, nghĩa và ví dụ không bị cắt theo số lượng cố định; Word Family là khối riêng. Sản phẩm hiện chỉ nhắm tới web desktop; các breakpoint chỉ bảo vệ layout khi cửa sổ bị thu hẹp, không phải một ứng dụng mobile riêng.

Visual QA chính được thực hiện trên Docker local cho desktop browser. Giao diện ưu tiên nhịp spacing đồng nhất, form gọn, empty state có hướng dẫn và footer tối giản theo phản hồi mới nhất; MagicPath vẫn chỉ là tài liệu phong cách cũ.
