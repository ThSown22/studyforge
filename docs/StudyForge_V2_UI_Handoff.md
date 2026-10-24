# STUDYFORGE V2 — UI/UX VISUAL HANDOFF CHO CODEX

> **Bổ trợ bắt buộc** cho `StudyForge_V2_Spec_for_Codex.md`. Tài liệu chính là nguồn chuẩn về nghiệp vụ; file này mô tả bố cục trực quan và các hành vi phải có để Codex dựng UI V2 từ V1.
>
> **Nguồn UI duy nhất:** https://www.magicpath.ai/files/464457287898120192
>
> **Phạm vi:** Trang chủ `/`, Kho từ `/vocabulary`, Tra từ `/dictionary` và minh họa/luồng Chrome Extension `/extension` (đường dẫn chỉ là gợi ý; kiểm tra router thực tế trước).
>
> **Trạng thái tham chiếu:** Các thông số dưới đây được tái dựng từ ghi chú mockup cũ và yêu cầu đã thống nhất. Hiện không xác nhận được trực tiếp toàn bộ màn hình MagicPath qua URL; không giả vờ đã truy cập hoặc export được source MagicPath.

## 1. Hướng dẫn dùng thiết kế cũ để ra thiết kế mới

1. **Dùng MagicPath làm nền visual**: bộ màu, tỷ lệ layout, card, typography, spacing và cấu trúc section. Không bê nguyên hành vi cũ nếu trái yêu cầu V2.
2. **Đặc tả sản phẩm quyết định logic mới**: không giáo trình từ vựng cố định, không ngữ pháp cố định, không lưu nguồn URL, 1 từ chỉ thuộc 1 bộ, EN mặc định / VI tùy chọn, tất cả nghĩa + ví dụ, Word Family riêng, ba nhãn Chưa học / Đang học / Đã nhớ.
3. **Không cắt nghĩa vì UI chật**. Thiết kế vùng cuộn, accordion hoặc panel chiều cao phù hợp; người dùng phải xem được mọi nghĩa mà backend cung cấp.
4. **Không xóa UI hữu ích của V1 mà chưa audit**: tái sử dụng component thích hợp, auth, router, trạng thái tương tác và flashcard nếu đúng nghiệp vụ.
5. **Không tự tạo project Lovable/MagicPath mới**: triển khai vào repo StudyForge hiện có, dùng stack của repo sau khi audit.

## 2. Design system chính xác

| Thành phần | Yêu cầu |
|---|---|
| Background | `#F7F5F0` kem nhạt |
| Primary / text | `#194B4A` hoặc `#194C4B` xanh teal đậm |
| Accent | `#50BEAF`, `#52BCAC`, `#5BC4B6` |
| Logo | **StudyForge** extra-bold 26–27px, dấu chấm hồng `#FA777B` |
| Logo tagline | `RÈN TRÍ THỨC · VỮNG TƯƠNG LAI`, 9px uppercase tracking-widest |
| Borders | `#D7E5E4`, `#DFEAE8`, dày 1px |
| Card lớn | Nền trắng, radius 22–26px, spacing rộng, shadow rất nhẹ |
| Header | Trắng, cao 80–82px, giới hạn chiều rộng 1240–1280px |
| Navigation | Chỉ `Trang chủ · Kho từ · Tra từ`, dạng text, mục active có UNDERLINE mint 3px; **không dùng pill tab nav** |
| Avatar | Pill viền nhỏ `● Minh ⌄`, không phải avatar vòng tròn đứng riêng |
| Buttons | Primary teal, chữ trắng, bo góc ~11–12px; không mặc định pill |
| Footer | Nền `#194B4A` ba cột, dòng thương hiệu `Từ bạn gặp. Kiến thức bạn giữ lại.` |
| Typography | Inter; heading extra-bold, overline nhỏ uppercase xanh mint, mô tả xám |

## 3. Trang chủ (`/`) — bắt buộc đúng thứ tự

**A. Hero là một CARD TRẮNG BO 26px, không phải generic centered full-width hero.** Grid desktop `lg:grid-cols-[1.38fr_0.94fr]`, `min-h-[416px]`, padding ~48–56px. Trái: eyebrow `BẮT ĐẦU TỪ NHỮNG TỪ BẠN THẬT SỰ GẶP`, title 40–50px có line break **“Gặp từ mới hôm nay, / nhớ thật lâu mai sau.”**, câu thứ hai màu #2D877E; mô tả về tra và lưu từ; hai CTA `Tra từ mới`, `Khám phá Extension`. Phải: thẻ minh họa nền xanh đậm `#194D4A`: `● VỪA LƯU TỪ TRÌNH DUYỆT`, **figure out**, câu ví dụ màu nền xanh nhạt hơn, badge lưu thành công. Không hiển thị xuất xứ website/YouTube.

**B. Vườn từ vựng** là một card trắng lớn riêng, H2 ~39px; grid `lg:grid-cols-[1.18fr_0.82fr]`. Trái panel xanh mint nhạt `#F2FAF7`, progress bar thực theo số từ demo, các mốc `Hạt giống / Nảy mầm / Ra lá / Phát triển / Tươi tốt / Thành thạo`. Phải hình minh họa SVG trồng cây có nền halo kem, đất ellipse mint và **mầm nhỏ màu nâu, lá xanh nhỏ**. Tránh emoji/cây xanh khổng lồ.

**C. Hai feature card** sau tiêu đề `Học từ những gì bạn chọn`: trái phần minh họa nền `#E0F4ED` cao ~190px với ba mini white cards `resilient / figure out / reliable`, tiêu đề `Thư viện từ vựng cá nhân`; phải minh họa nền cát `#F5EADB` chứa flashcard `ÔN TẬP HÔM NAY` và `resilient`, tiêu đề `Ôn tập thông minh`. Hai card ngang nhau, có footer nhỏ và nút mũi tên. CTA ôn đi đến khu vực ôn của Kho từ, không tạo mục nav mới.

**D. Banner CTA ngang** trắng bo viền: overline `BÔI ĐEN · TRA NGHĨA · LƯU LẠI`, heading `Từ gặp hôm nay có thể là từ bạn nhớ mãi.`, nút dark-teal `Khám phá Chrome Extension`. Sau đó footer ba cột dark-teal.

## 4. Kho từ (`/vocabulary`)

- Phần đầu: overline `THƯ VIỆN CỦA RIÊNG BẠN`, H1 `Kho từ vựng của tôi` (40–50px), subtitle, bên phải nút dark-teal `＋ Thêm từ mới`.
- Tiếp là **bốn white stats cards 1 hàng desktop**, radius 16px: `Tổng từ đã lưu`, `Chưa học`, `Từ đã ghi nhớ`, `Chuỗi học tập`. Không bịa số 248, 86, 12, 7 ngày khi store không có dữ liệu đó. `Cần ôn` **không** phải trạng thái thứ tư.
- Một card trắng lớn bo 25px: bên trái `Thư viện của bạn` + subtitle, bên phải **nút cấp danh sách** `Ôn tập từ hôm nay →` (được phép).
- Dưới header card: horizontal **underline tabs** `Tất cả`, `Bộ sưu tập`, `Chưa học`, `Đang học`, `Đã nhớ`. Dưới đó input `Tìm từ hoặc nghĩa...` và select bộ sưu tập. Khi chọn tab Bộ sưu tập, hiện các tile nhóm từ.
- Grid desktop `lg:grid-cols-[1fr_350px] gap-5`: bên trái **danh sách từ dạng từng HÀNG NGANG một cột**, không phải grid card 2–3 cột; hàng ngắn có chữ từ lớn, nghĩa VN ngắn + collection, badge trạng thái phải; hàng được chọn có nền `#EBF9F4`, border mint. Bên phải panel chi tiết pale mint `#F1FAF6` border `#D5E8E2`, eyebrow `CHI TIẾT TỪ VỰNG`.
- Panel chi tiết: headword, IPA, audio, chỉ 1 trạng thái badge ở header; POS tabs/pills **chỉ tên** `verb`, `noun`, `adjective`, không ghi số nghĩa. Chuyển POS để hiện **mọi định nghĩa** và **mọi ví dụ** của POS đó, EN mặc định, VI hỗ trợ. Có thể thu gọn `Ngữ cảnh cá nhân` chỉ câu, không nguồn. Dưới cùng hàng `Bộ sưu tập` + badge, có chỉnh sửa/chuyển bộ bằng icon nhỏ. **Không** có nút to `Ôn tập từ này`, **không** có nút to `Chỉnh sửa`, **không** lặp lại hàng trạng thái.
- Ôn tập là hành động cấp Kho từ, có flashcard flip và người dùng tự đánh dấu 3 trạng thái; không tự đánh dấu đã nhớ khi hoàn tất một bài.

## 5. Tra từ (`/dictionary`)

- Main là grid desktop `lg:grid-cols-[1fr_318px]` gồm cột trái và aside phải, không phải search header strip tràn màn hình.
- Trái CARD 1: hero tra cứu nền trắng bo 25px p-10. Overline `TRA CỨU VÀ GHI NHỚ TỪ VỰNG`, heading hai dòng **“Mỗi từ mới là một / khám phá nhỏ.”**, chữ `khám phá nhỏ.` xanh hơn, paragraph xám, search input lớn và nút dark teal `⌕ Tra từ`.
- Trái CARD 2: card trắng riêng `KẾT QUẢ TRA CỨU`, headword lớn, IPA, phát âm icon tròn, segmented **EN | VI**. EN mặc định: tất cả định nghĩa tiếng Anh; VI: dịch các định nghĩa tương ứng, các câu ví dụ vẫn tiếng Anh. POS tabs không đếm nghĩa, hiện **tất cả** các nghĩa và ví dụ theo loại từ, không giới hạn 2–3 và không dựa riêng vào `shortdef`. `Họ từ` tách riêng: `migrate` có `migration` (noun) và `migrational` (adjective); không được nhầm chúng là POS của `migrate`; các từ liên quan click tra được.
- Dưới kết quả: khu vực `Lưu vào kho từ của tôi`; 1 dropdown chọn bộ sưu tập, không có ô `Nguồn từ vựng`, không có URL nguồn. Nếu từ đã lưu, hiển thị bộ đang chứa và lời nhắc nhẹ theo trạng thái, chỉ cho phép **chuyển** sang bộ khác, không tạo bản trùng.
- Aside phải xếp đúng 3 khối: đầu card DARK TEAL `MẸO HỌC TỪ`, heading `Lưu cả câu, không chỉ một từ.`, ví dụ `Bôi đen → Tra nghĩa → Lưu vào StudyForge.`; giữa card trắng `Tra cứu gần đây`, list từ click được; cuối card mint `✦ Chrome Extension` có link.

## 6. Chrome Extension (`/extension`)

- Outer demo stage nền `#EFF2F1`, popup **390px** (max-width viewport), nền trắng, bo 20px, shadow lớn, border `#DCEAE6`. Có thể thêm mini-webpage minh họa cạnh popup desktop nhưng không thay đổi thiết kế popup.
- Header trong popup nền `#194C4B` p-5: logo StudyForge dấu chấm hồng, chữ nhỏ Extension, gear, overline mint `TRA TỪ NGAY TRÊN TRÌNH DUYỆT`.
- Tabs popup dưới header: `Tra từ` / `Từ vừa lưu`, underline mint active.
- Nội dung p-6: search field + nút search nền mint; overline `TỪ VỪA CHỌN`, headword ~34px, IPA + icon âm thanh tròn mint; segmented EN/VI, POS tabs chỉ tên, **mọi nghĩa/ví dụ** trong vùng cuộn popup (không cắt), `Họ từ` có thể thu gọn và click tra tiếp; optional textarea ngữ cảnh chỉ lưu câu, không nguồn; chọn đúng 1 bộ; full-width teal `＋ Lưu vào kho từ`, thông báo đã lưu/đổi bộ nếu trùng; bottom `● Đã kết nối · Minh` và `Mở website ↗`.
- `Từ vừa lưu` dùng chính shared demo store và các từ click được. Luồng 1: chọn chữ trên mini webpage; luồng 2: gõ từ trực tiếp trong popup. EN là mặc định cả hai luồng.

## 7. Nguyên tắc nghiệp vụ phải giữ khi sao lại UI cũ

- Một từ/người dùng: một record, một collection, một trạng thái trong đúng 3 nhãn Chưa học/Đang học/Đã nhớ.
- Word Family không phải POS của headword và không tự lưu vào Kho từ.
- Khi tra: tất cả POS, tất cả senses/example hiện có của dữ liệu mẫu; EN mặc định; VI chỉ là lớp hỗ trợ nghĩa, không dịch thay câu ví dụ mặc định.
- Cấm thêm nguồn website, domain, URL YouTube, capture method vào UI hoặc dữ liệu từ đã lưu.
- Mọi route thật và shared state hoạt động, không chỉ màn hình tĩnh. Không có API key, Supabase, DB thật hoặc API bên ngoài trong UI prototype.


## 9. Responsive, empty states, accessibility và thứ tự ưu tiên

- **Desktop:** Header 3 mục; Trang chủ hero 2 cột; Kho từ danh sách trái + panel phải; Tra từ nội dung trái + aside phải.
- **Tablet/mobile:** Tất cả khối nhiều cột xếp dọc. Danh sách Kho từ giữ hàng ngắn; panel chi tiết mở dạng sheet / trang con hoặc nằm dưới danh sách. Không ép panel rộng 350px gây tràn màn hình.
- **Popup Extension:** Giới hạn theo bề ngang viewport (~390px tham chiếu), vùng định nghĩa cuộn riêng, action lưu luôn dễ tiếp cận; không dùng hover-only.
- **Keyboard/accessibility:** Tabs POS, EN/VI, tìm kiếm và modal dùng được bằng bàn phím, focus rõ, label cho biểu tượng audio, tương phản phù hợp, heading hợp lý.
- **States:** loading (skeleton hợp lý), không tìm thấy từ, nghĩa VI chưa sẵn, chưa có collection, Kho từ trống, đã lưu từ, provider timeout, API rate limit. Đừng đặt dữ liệu fake cố định trong production.
- **Interaction:** Các nút tra từ, nhấn họ từ, chọn POS, đổi EN/VI, lưu, chuyển bộ, tự đổi trạng thái phải có xử lý thực, không phải chỉ click đẹp.
- **Đánh giá visual:** Đối chiếu ảnh chụp trước/sau ở 1440px desktop và ~390px mobile; kiểm tra đúng cấu trúc/nhịp điệu thị giác hơn là khớp từng pixel.
- **Ưu tiên triển khai:** Dựng shell/design system → trang Kho từ → Tra từ → Trang chủ → Extension; có thể điều chỉnh thứ tự theo audit.

## 10. Ranh giới rõ ràng với Backend và quyền nội dung

- UI phải nhận cùng một normalized dictionary response từ Backend cho website và extension; client không parse trực tiếp JSON phức tạp của Merriam-Webster.
- Không đưa API key vào client, ảnh chụp hay source public; key đã từng xuất hiện trong chat phải xoay key trước khi đưa vào môi trường chạy.
- Thiết kế hỗ trợ lưu các định nghĩa/ví dụ theo schema mục tiêu, nhưng triển khai lưu bản sao nội dung Merriam-Webster lâu dài phải tuân thủ giấy phép; không lấy việc provider không nhìn thấy database làm điều kiện triển khai.
- UI không hiển thị nguồn URL nơi user gặp từ; phần thông tin attribution của **nguồn từ điển** nếu giấy phép yêu cầu là khái niệm khác.

## 11. Checklist nghiệm thu trực quan cho Codex

1. Header/Nav chỉ `Trang chủ · Kho từ · Tra từ`, teal + kem + mint như reference.
2. Trang chủ: hero card trắng 2 cột, vườn cây nhỏ, 2 thẻ chức năng, banner Extension, footer.
3. Kho từ: 4 stats card, tabs dưới gạch, list **một cột hàng ngang**, chi tiết bên phải có tab POS chỉ tên.
4. Panel từ: một badge trạng thái ở header, tất cả nghĩa/ví dụ, không nút ôn từng từ, không CTA chỉnh sửa lớn, một badge bộ sưu tập.
5. Tra từ: search hero, result card, aside; EN mặc định/VI, đầy đủ senses/examples; họ từ không nhập vào POS chính.
6. Extension: popup tra thủ công + selection lookup, EN/VI, tra họ từ, chọn đúng một bộ, duplicate UX.
7. Không còn ngữ pháp/curriculum cũ, không 4 trạng thái, không nguồn URL từ người dùng.
8. Mockup cũ nếu mâu thuẫn nghiệp vụ thì **đặc tả V2 thắng**.
9. Nếu Codex không xem được MagicPath, phải nói rõ và dựa vào file này, không tự nhận đã xem.
