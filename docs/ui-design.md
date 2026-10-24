# Giao diện và đối chiếu thị giác

## Nguồn quan sát và giới hạn

Ngày 23/10/2026, REA `capture_browser_scenario` ghi lại trang chủ ở 1440 × 1000
và 390 × 844, lộ trình, màn học ngữ pháp/từ vựng và dialog công khai. Các ảnh,
DOM và sự kiện được lưu trong [reference-session.json](evidence/reference-session.json);
ID màn hình nằm ở [research.md](research.md). Lần kiểm tra hiện tại dùng lại
bằng chứng REA đó: phiên REA mới bị treo và máy không có Chrome CDP đang mở.
Vì thế số đo của website tham khảo dưới đây là **đo từ ảnh chụp**, có sai số
khoảng vài pixel; font family/weight/computed CSS thật của website gốc chưa
được xác minh. Không sao chép font, logo hoặc asset riêng của website gốc.

StudyForge được kiểm tra bằng Chromium headless trên build local với database
kiểm thử riêng. [Ảnh trước](evidence/studyforge-before-desktop.png) là ảnh REA
local 1440 × 1000 trước vòng chỉnh UI; [ảnh sau desktop](evidence/studyforge-after-desktop.png)
và [ảnh sau mobile](evidence/studyforge-after-mobile.png) là ảnh trình duyệt của
build mới. Ảnh tham khảo gốc nằm trong evidence bundle, không đưa vào UI.

| Mốc | Tham khảo từ ảnh | StudyForge sau sửa | Nhận xét |
| --- | --- | --- | --- |
| Desktop header | cao ~80 px | 80 px (computed) | Cùng nhịp, logo riêng |
| Desktop hero | x=72, y=120, rộng ~1296, cao ~424 px | x=72, y=120, rộng 1296, cao 427 px | Tỷ lệ sát ảnh |
| Nội dung desktop | max ~1296 px | token 1296 px | Cùng mép với hero/footer |
| Mobile header | cao ~72 px | 72 px | Điều hướng thu gọn |
| Mobile hero | x~15, y~88, rộng ~360 px | x=14, y=88, rộng 362 px | Cột đơn |
| Thẻ học từ vựng | x~180, y~366, rộng ~1080, cao ~390 px | rộng 1080, cao 390 px; y~371 | Thanh thời gian/stepper tương tự |
| Màu nền chính | mẫu pixel `#F7F5EF` | `#F7F5EF` | Đo trên vùng nền phẳng |
| Màu xanh đậm | mẫu pixel `#004646` | `#004646` | Hero card, từ vựng, footer |
| Xanh ngọc nhấn | mẫu pixel gần `#27C4B5` | `#27C4B5` | Nút trạng thái/progress |
| Viền panel | mẫu pixel gần `#D7E1DF` | `#D7E1DF` | Viền mỏng, độ tương phản thấp |

Trước vòng sửa, H1 desktop của StudyForge xuống ba dòng trong ảnh 1440 px;
ảnh sau xuống hai dòng. Phần học từ vựng trước đó hẹp khoảng 720 px, thiếu
toolbar trắng và thẻ nằm thấp; sau sửa dùng thanh điều hướng hai bước và thẻ
1080 px. Đây là so sánh kích thước/bố cục, không là phép đo độ tương đồng
pixel toàn trang vì nội dung, font và đồ họa do StudyForge tự tạo.

## Tokens và typography StudyForge

Các token ở `frontend/src/styles/tokens.css`. Base rules nằm ở `base.css`;
`styles.css` nhập CSS theo thứ tự token → base → layout → components → home →
footer → roadmap → responsive. Module học có entry `learning.css` và CSS
riêng theo tính năng. Trang không tải font từ website tham khảo.

| Token/rule | Giá trị | Áp dụng |
| --- | --- | --- |
| `--font-body` | `"Segoe UI", Arial, sans-serif` | Font hệ thống, không phụ thuộc CDN |
| Body | 16 px, line-height 1.6 | Dễ đọc ở desktop/mobile |
| H1/H2/H3 | weight 800, tracking âm, line-height 1.07/1.12 | Phân cấp rõ |
| Hero H1 desktop | ~67 px, weight 800, line-height ~68 px | Nhấn mạnh hành động học |
| Hero H1 mobile | 32 px, line-height ~33 px | Hai dòng trong viewport 390 px |
| Body hero | 15 px, line-height 24 px ở desktop | Giữ nhịp nội dung |
| Button chính desktop | 13 px, weight 800, cao ~50 px | Diện tích bấm rõ ràng |
| `--content-width` | 1296 px | Các panel chính/footer |
| `--radius-panel` | 26 px | Card lớn |
| `--radius-control` | 11 px | Input và nút |
| `--space-section` | 28 px | Khoảng giữa các panel |
| `--ink`, `--teal`, `--cream`, `--border` | `#004646`, `#27C4B5`, `#F7F5EF`, `#D7E1DF` | Màu chủ đạo |

Font của reference có vẻ hình học và khác Segoe UI ở độ rộng từng ký tự; tên
font và license chưa kiểm được từ REA. StudyForge giữ font hệ thống và điều
chỉnh cỡ/tracking theo ảnh. Đây là chênh lệch thị giác còn lại.

## Thành phần và trạng thái

- Header 80 px desktop/72 px mobile, logo StudyForge, Trang chủ, Lộ trình và
  tài khoản. Focus hiện bằng viền 3 px. Sidebar roadmap giữ mục đã chọn và
  trạng thái khóa theo dữ liệu API.
- Card và button dùng màu/viền/góc bo thống nhất; hover, active, disabled và
  focus có style riêng. Dialog đăng nhập/hỗ trợ dùng controls có nhãn, lỗi
  validation và thông báo kết quả. Nút gửi có trạng thái đang xử lý.
- Màn học có toolbar hai bước; ngữ pháp tách phần giải thích và công thức thành
  hai panel, ví dụ nằm trong dải xanh ngang. Flashcard có mặt tối, mặt đã lật,
  nút nghe, tiến độ, trạng thái cần ôn/đã nhớ và phím tắt.
- Footer mới dùng nền xanh đậm, ba vùng trên desktop và một cột trên mobile;
  các link đi tới route thật, nút hỗ trợ mở form thật. Không dùng link trang trí.
- Ở 768 px, các grid học và roadmap chuyển cột theo không gian; ở 390 px, card,
  nút và footer xếp một cột. Các luồng home, roadmap, grammar, quiz và vocab
  được kiểm tra không tràn ngang tại 768 và 390 px.

## Những khác biệt chưa xử lý bằng sao chép

Ảnh tham khảo không cho phép xác minh đầy đủ computed style, hover trên mọi
control, font chính xác hoặc các màn sau đăng nhập. Quiz, hồ sơ, XP và footer
của StudyForge là thiết kế độc lập theo luồng công khai cùng yêu cầu sản phẩm.
Dữ liệu mẫu, số bài và từ, ví dụ học, icon/đồ họa không trùng dữ liệu độc quyền
của website gốc. Việc so sánh trực tiếp lại bằng REA cần một phiên REA ổn định
hoặc Chrome được mở với CDP; chưa làm thay đổi cấu hình Chrome trên máy.
