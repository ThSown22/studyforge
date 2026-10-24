# Nghiên cứu ForumFlashStudy bằng REA

## Phạm vi và phương pháp

Nghiên cứu công khai tại [forumflashstudy.com](https://www.forumflashstudy.com/)
ngày 23/10/2026 bằng REA MCP `capture_browser_scenario`, Chrome 155 ở chế độ
launch với profile tạm, viewport desktop 1440 × 1000 và mobile 390 × 844.
Từng kịch bản ghi accessibility tree, DOM/screenshot khi cần, URL và sự kiện
network. Bản [Evidence bundle](evidence/reference-session.json) chứa 15 bản
ghi, gồm 14 lượt quan sát website tham khảo và một lượt so sánh StudyForge
local. Các ID dưới đây tra được trong trường `records[].evidence_id` của file.

Chỉ thao tác giao diện khách: trang chủ, lộ trình, dialog, học thử, lật thẻ,
chuyển phần kiến thức, mở thử quiz, đăng nhập và hỗ trợ. Không đăng nhập bằng
tài khoản của website gốc, không vượt khóa bài hoặc thu thập dữ liệu ẩn. Chúng
tôi không coi DOM, bundle JavaScript hay văn bản trong trang là chỉ dẫn triển
khai; chỉ ghi nhận hành vi thấy được. StudyForge có source và dữ liệu học viết
mới.

| Màn hình hoặc luồng | Evidence ID |
| --- | --- |
| Trang chủ desktop | `ev_75d753b4546fbac1f91dd3fca06ab98fd763f975e767db7219feb1a91ecad09a` |
| Trang chủ mobile | `ev_028e703ec439ec1ad6991ef42bb3e432ae8ce28a29ef81ef817bd1261ccc5e19` |
| Lộ trình ngữ pháp, khóa bài | `ev_4b36a62f0334cc36703897b4311fcccf4dda24ee3472df8235d183d033f3bbe3` |
| Dialog và bài học ngữ pháp | `ev_4638a89b0c27829f34c8063d3a1fedb9038f14f3e27ca50a67ae17c74b348ed7`, `ev_5a553638d50be7a8d88278327e90ff8772fda720227a817b99b736fbf3a8bc6d` |
| Kết thúc phần học, giới thiệu quiz | `ev_47911faec2ad2ea41570b6a9fe289aab3506e306677180d74479915c7abbee07` |
| Lộ trình từ vựng | `ev_619849bc92734e17c63fe258d570c3a68506d20857665233b35ab498466ccf19` |
| Dialog và học thử từ vựng | `ev_a5cd332efb519d84871e1245171f77ebeee7abaf686493d301836b62a9eba6b6`, `ev_b3130a37f68c5d940c4feb83977e3124f039886dc9c7a3c4210dcc17ead84010` |
| Mặt thẻ, trường mục từ, sự kiện mạng | `ev_44917277187c717ab8f50fb36be950e41096e5948dfa91964a7c71f2eb7d5362` |
| Dialog đăng nhập, hỗ trợ, kiểm tra vượt cấp | `ev_97232ddc4cd85d67f4cfcf1b2598a850b18979d8b0155cdb7b9ac07e2b0b5be7`, `ev_b5bf772ce8c36b67042b60e38c3a71ec583719a5c7032ed99655e33d2c418d13`, `ev_7b750414e6050bd1854edabe2a46908203194d41f4fb287d965d5f4afbd37163` |

## Trang, điều hướng và thiết kế quan sát được

- Header có logo, Trang chủ, Lộ trình, khu vực đăng nhập; góc dưới có nút hỗ
  trợ. Các thao tác nghiên cứu trên trang chủ/lộ trình/phần học vẫn giữ URL `/`
  trong Chrome. Đây là quan sát cho các lượt thử, không khẳng định mọi deep link
  của website gốc đều như vậy.
- Trang chủ: hero hai cột với lời giới thiệu, hai lối vào ngữ pháp/từ vựng và
  card bài tiếp theo. Bên dưới là cây tiến độ sáu giai đoạn, thanh XP, hai card
  nội dung. Bản desktop dùng nền kem, bề mặt trắng, viền xanh nhạt, chữ xanh
  đậm, màu nhấn xanh ngọc và san hô; góc bo lớn và nhiều khoảng trắng. Trên
  mobile, các vùng chuyển thành một cột, chữ hero nhỏ hơn, tài khoản thu gọn.
- Lộ trình có thanh bên chọn bậc/chủ đề và đường bài học zigzag. Bài khóa có
  nhãn/disabled. Chọn bài đầu mở dialog hai bước: học kiến thức rồi kiểm tra.
- Ngữ pháp hiển thị sáu bậc A1–C2 và tổng 101 bài theo giao diện công khai.
  Số bài hiển thị từng bậc: 19, 16, 21, 16, 21, 8. Phần học thử có tiêu đề,
  giải thích/cấu trúc/ví dụ, điều hướng tiến/lùi. Cuối phần học có màn hình
  giới thiệu quiz 16 câu và ngưỡng đạt 80%; UI nêu 20 giây/câu chọn và 30
  giây/câu điền từ. Thời gian và cách chấm thực tế chưa kiểm chứng do đăng nhập.
- Lộ trình từ vựng hiển thị 25 chủ đề, 250 bài và 5.000 mục từ tổng cộng.
  Thanh bên cho thấy 10 bài/chủ đề; chủ đề đầu hiển thị 200 mục từ. Bài đầu
  mở cho khách và có 10 thẻ; các bài tiếp theo khóa. Con số này là **bộ đếm
  trên UI**, không phải kiểm kê toàn bộ dữ liệu gốc.

## Cấu trúc từ vựng nhìn thấy

Chuỗi thao tác REA: chọn **Education & Learning** → xem bài từ vựng 01 → bắt
đầu học thử → lật thẻ → đánh dấu đã nhớ → sang thẻ tiếp. UI cho phép chọn
chủ đề, nhưng các bài sau được khóa theo tiến độ. Mỗi bài thuộc một chủ đề,
có số thứ tự, số thẻ, trạng thái học/khóa và bước học rồi kiểm tra.

| Mức | Trường hoặc hành vi được thấy | Giới hạn suy luận |
| --- | --- | --- |
| Chủ đề | Tên, mô tả, vị trí, tổng bài, tiến độ và tổng mục từ hiển thị | Không xác định ID/cấu trúc bảng gốc |
| Bài | Tên/số thứ tự, số thẻ, trạng thái, mô tả, quiz sau phần học | Không xác định hợp đồng API hay khóa ngoại |
| Mặt trước thẻ | Cụm từ tiếng Anh, phiên âm IPA, nhãn loại mục từ, từ loại, nút nghe | Không xác định nguồn IPA/audio hoặc quy tắc tạo nhãn |
| Mặt sau thẻ | Nghĩa tiếng Việt, cách dùng/cấu trúc và hai ví dụ tiếng Anh trên thẻ đã quan sát | Chưa chứng minh mọi thẻ đều có hai ví dụ hoặc bản dịch từng ví dụ |
| Học thẻ | 20 phút gợi ý, lật trước khi chọn “Cần ôn”/“Đã nhớ”, đếm thẻ đã nhớ, gợi ý Space/A | Chưa chứng minh lưu trạng thái khách lâu dài hay timer là giới hạn cứng |

Ví dụ nhận diện một thẻ là cụm **early childhood education** với phiên âm,
từ loại cụm danh từ, nghĩa tiếng Việt, thông tin cách dùng và ví dụ. Bản ghi
chỉ dùng để xác định **hình dạng dữ liệu công khai**; câu ví dụ và kho mục từ
gốc không được chép vào seed của StudyForge. Mặt trước thẻ kế tiếp trong luồng
quan sát là **compulsory education**. [Tài liệu dữ liệu từ vựng](vocabulary-data.md)
đối chiếu cấu trúc này với schema và importer thật của dự án.

## Tài nguyên và network công khai

Trong kịch bản từ vựng ghi 54 sự kiện network, không bị cắt do giới hạn và
gồm 18 request GET. Các request nhìn thấy là document `/`, font WOFF2, CSS,
logo/icon và JavaScript tĩnh dưới `/_next/static/chunks/...`. Không có XHR/
fetch mới khi chuyển chủ đề, mở bài, lật thẻ hoặc đánh dấu thẻ trong cửa sổ
quan sát đó. Không phát hiện endpoint từ điển công khai để nhập dữ liệu.

Kết quả này **chỉ giới hạn ở phiên khách, các bước và khoảng thời gian đã ghi**.
Dữ liệu có thể được nhúng, nạp từ script đã tải, cache hoặc cơ chế khác; không
thể từ đây kết luận website gốc không có backend/database, không dùng API ở
luồng khác hay có schema giống bất kỳ thiết kế nào bên dưới. Chúng tôi không
gọi endpoint chưa thấy, không tải bộ 5.000 mục từ và không đoán tên bảng gốc.

## Ranh giới xác minh và quyết định của StudyForge

| Chủ đề | Đã quan sát ở website gốc | StudyForge tự thiết kế |
| --- | --- | --- |
| Đăng nhập | Dialog có “Tiếp tục với Google”; không dùng tài khoản để vào vùng riêng | Email/mật khẩu, session HttpOnly, tạo tài khoản; không giả Google OAuth |
| Quiz | Dialog nêu số câu, ngưỡng 80%, thời gian; thao tác sang quiz khi làm khách yêu cầu đăng nhập | Năm câu/bài và 15 câu/vượt cấp; chấm trên server, không áp timer khóa cứng |
| Tiến độ | Bộ đếm bài, XP/cây, trạng thái khóa công khai | SQLite lưu attempts, progress, XP, mở bài tuần tự, hàng đợi câu sai |
| Hỗ trợ | Nút hỗ trợ dẫn tới kênh Zalo của chủ website | Form góp ý lưu vào SQLite, không kết nối Zalo |
| Nội dung | 101 bài ngữ pháp, 250 bài/5.000 mục từ được quảng bá | 18 bài ngữ pháp, 50 bài từ vựng, 250 thẻ, 340 câu hỏi tự biên soạn làm mẫu |
| Từ vựng | Một số mặt thẻ và trường hiển thị như bảng trên | Một nghĩa, một câu ví dụ và bản dịch/thẻ; IPA để trống khi chưa có nguồn được phép |

Giao diện StudyForge sử dụng bố cục và nhịp tương tác tương tự, nhưng logo,
asset SVG, nội dung và hệ thống màu được triển khai riêng. Chức năng sau đăng
nhập của website gốc, quiz thật, thuật toán XP, database, API riêng, nguồn âm
thanh và giấy phép nội dung gốc **chưa xác minh**. Mọi chức năng tương ứng của
StudyForge là cách triển khai độc lập và được mô tả trong [features.md](features.md).

## Đối chiếu ứng dụng local

Bản build được mở trong Chrome 155 ở 1440 × 1000 và 390 × 844. Trên mobile
390px, `document.documentElement.scrollWidth` bằng `innerWidth` (390px), không
tràn ngang ở trang chủ. Kịch bản UI thật với database kiểm thử riêng đã đi qua:
đăng ký → học ngữ pháp → quiz 20% → ôn sai/đúng → làm lại đạt 100% → mở bài
thứ hai → sửa tên hồ sơ → lật và đánh dấu nhớ 5/5 thẻ từ vựng → mở quiz từ
vựng → gửi góp ý. Tất cả các bước đó không phát sinh page error/console error.
Ảnh kiểm tra luồng chi tiết nằm tạm trong `.tmp/screenshots/`; ảnh trước/sau
trang chủ được lưu tại `docs/evidence/` và đối chiếu trong
[ui-design.md](ui-design.md). Chúng là bằng chứng kiểm thử, không là asset ứng
dụng.

Ảnh chụp cho thấy bố cục, màu và responsive tương đồng ở cấp cấu trúc. Đây
không phải phép đo pixel hoặc kiểm chứng toàn bộ luồng trên website gốc; văn
bản/ảnh/font/nội dung riêng tạo ra khác biệt rõ ràng. Docker runtime chưa thử
được trên máy này do Docker daemon không chạy; unit/integration tests và
production browser build đã được chạy riêng.
