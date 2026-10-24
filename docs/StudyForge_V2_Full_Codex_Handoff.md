# StudyForge V2 — Bộ đặc tả hoàn chỉnh để giao Codex

> Bao gồm **Đặc tả sản phẩm V2** và **UI/UX Visual Handoff** trong cùng một tệp Markdown UTF-8.  
> MagicPath UI reference: https://www.magicpath.ai/files/464457287898120192  
> **Cách dùng:** Đặt file này vào thư mục `docs/` của repository và yêu cầu Codex đọc toàn bộ trước khi audit, lập kế hoạch và sửa code. Nếu có file `.dbml` riêng, cung cấp kèm để đối chiếu schema.

## Mục lục

- [Phần I — Đặc tả sản phẩm, nghiệp vụ và kế hoạch chuyển đổi V1 → V2](#phần-i--đặc-tả-sản-phẩm-và-chuyển-đổi-v1--v2)
- [Phần II — UI/UX Visual Handoff](#phần-ii--uiux-visual-handoff)

---

## Phần I — Đặc tả sản phẩm và chuyển đổi V1 → V2

# STUDYFORGE V2 — ĐẶC TẢ CHUYỂN ĐỔI SẢN PHẨM & KẾ HOẠCH REFACTOR DỰ ÁN HIỆN TẠI

> **Tài liệu bàn giao cho Codex** · Product Requirements Document (PRD) + Engineering Handoff  
> **Ngày chốt yêu cầu:** 24/10/2026  
> **Bản rà soát:** v1.1 — bổ sung hợp đồng hiển thị đầy đủ nghĩa/POS, Word Family, EN/VI và kiểm thử đối chiếu yêu cầu  
> **Trạng thái:** Đặc tả mục tiêu V2, **không** phải mô tả rằng các chức năng này đã tồn tại trong mã nguồn.  
> **Mục đích:** Giúp Codex hiểu **chính xác hướng thay đổi của chủ dự án** trước khi đọc, đánh giá và refactor repository hiện có.

---

## 0. HƯỚNG DẪN QUAN TRỌNG DÀNH CHO CODEX — ĐỌC TRƯỚC KHI LẬP KẾ HOẠCH

**Đây là một dự án ĐANG TỒN TẠI, không phải yêu cầu tạo ứng dụng mới.** Bản hiện tại (gọi là **V1 / REA prototype**) được dựng bằng cách dùng Reverse Engineer Anything (REA) và Codex để tham khảo cách vận hành của một website học tập. Giao diện và một số chức năng đã có thể chạy được, nhưng các chức năng đó **chưa phản ánh tầm nhìn sản phẩm V2**.

Codex phải:

1. **Khảo sát repository thật**: framework, dependency, route, component, model, schema SQLite, luồng auth, API, seed, test, Docker hiện có. Không được tin rằng tên file, module hay bảng dưới đây chắc chắn đã tồn tại.
2. **Lập bảng đối chiếu V1 → V2**: chức năng nào xóa khỏi trải nghiệm, chức năng nào sửa, phần nào tái sử dụng, phần nào phải xây mới. Phân biệt *gỡ bỏ chức năng nghiệp vụ* với *xóa file code không an toàn*.
3. **Ưu tiên refactor tiến hóa, không viết lại toàn bộ từ đầu** trừ khi audit chứng minh việc giữ nền tảng cũ không hợp lý. Giữ được auth, component, API và hạ tầng hữu ích thì giữ.
4. **Không bắt đầu bằng cách tự ý xóa bảng/dữ liệu**. Backup, kiểm tra dữ liệu thật, đề xuất mapping/migrations và bảo đảm rollback trước.
5. **Không giữ các bài học/ngữ pháp/từ vựng seed giả làm nội dung trung tâm** của sản phẩm mới.
6. **Không tự sáng tạo requirement trái tài liệu** (ví dụ một từ thuộc nhiều collection; tự đánh dấu `Đã nhớ`; đặt nút `Ôn tập từ này` trên card; lưu nguồn URL khi người dùng không muốn).
7. **Không hardcode API key** hay commit `.env`, không gửi key từ trình duyệt/Chrome Extension trực tiếp đến Merriam-Webster.
8. **Phân biệt tính năng mong muốn với khả năng được cấp phép**: schema phải hỗ trợ nội dung từ điển, nhưng việc persist định nghĩa/ví dụ Merriam-Webster vào PostgreSQL cần quyền sử dụng phù hợp; xem mục 10.
9. Trước khi sửa hàng loạt, tạo **audit + kiến trúc mục tiêu + plan theo milestone + danh sách file dự kiến sửa**, chỉ ra các rủi ro và bất kỳ khác biệt nào giữa yêu cầu với code thật. Khi triển khai, làm theo milestone nhỏ, chạy test và báo cáo kết quả.

**Tài liệu này là nguồn tham chiếu về yêu cầu nghiệp vụ của V2. Repository thực tế là nguồn tham chiếu về hiện trạng kỹ thuật.** Nếu hai thứ mâu thuẫn, báo rõ và đề xuất cách chuyển đổi, không tự suy đoán.

---

## 1. STUDYFORGE LÀ SẢN PHẨM GÌ?

### 1.1. Tầm nhìn V2

**StudyForge** là ứng dụng học từ vựng tiếng Anh cá nhân, phục vụ việc **học tiếng Anh ngay trong quá trình đọc web, học công nghệ, xem video và tra cứu hàng ngày**.

**Ý tưởng cốt lõi:**

> **Gặp từ lạ → Tra bằng tiếng Anh → Xem giải nghĩa tiếng Việt nếu cần → Lưu từ vào đúng một bộ sưu tập → Quay lại Kho từ để ôn và tự đánh giá đã nhớ hay chưa.**

Sản phẩm không đi theo mô hình bắt người dùng học một giáo trình cứng gồm bài 1, bài 2, bài 3 hoặc danh sách từ vựng giả lập. **Người dùng tạo nội dung học tập của chính mình từ những từ họ thật sự gặp.**

Đây vừa là sản phẩm có ích thật cho chủ dự án, vừa là project full-stack/DevOps để triển khai Docker, PostgreSQL, CI/CD, private registry, Kubernetes, Helm và GitOps ở những giai đoạn sau.

### 1.2. Đối tượng sử dụng

- Người học tiếng Anh từ cơ bản đến khá, muốn đọc giải thích **Anh–Anh**, nhưng có **EN → VI** hỗ trợ khi chưa đủ vốn từ.
- Người đọc tài liệu IT/DevOps và nhiều loại nội dung tiếng Anh khác, muốn ghi nhớ từ theo nhu cầu bản thân.
- Người cần một Kho từ gọn gàng, có bộ sưu tập rõ ràng và ôn tập bằng nhiều hình thức.

### 1.3. Triết lý UX

- **Simple, clean, useful**: ít nút thừa, tập trung vào tra/lưu/học từ.
- Trải nghiệm tra từ phải giàu thông tin như một **learner's dictionary**, nhưng cấu trúc riêng của StudyForge.
- **Mặc định ưu tiên tiếng Anh** cho định nghĩa; tiếng Việt là công cụ hỗ trợ, không thay hoàn toàn việc học bằng tiếng Anh.
- Không yêu cầu người dùng điền nhiều trường để lưu một từ; danh sách từ của họ được quản lý nhất quán.
- Website và Chrome Extension phải giống nhau về khái niệm dữ liệu và quy tắc nghiệp vụ.

---

## 2. V1 HIỆN NAY & HAI CHỨC NĂNG CẦN LOẠI BỎ KHỎI SẢN PHẨM

### 2.1. Bối cảnh của V1

Dự án được dựng từ quá trình tham khảo/reverse-engineer trải nghiệm của một trang học tập bằng REA. Trước khi chỉnh sửa, Codex cần rà soát **thực trạng code**: những màn hình và luồng đang có, API nào đã hoạt động, dữ liệu SQLite, hệ thống đăng nhập, bài kiểm tra, XP/progress, UI components, automation/test. Các thành phần được nhắc tới ở đây là thông tin định hướng từ quá trình phát triển, **không phải xác nhận chính xác cấu trúc code hiện tại**.

### 2.2. Hai trụ cột cũ cần bỏ khỏi luồng V2

| Chức năng cũ | Vấn đề | Hướng xử lý trong V2 |
|---|---|---|
| **(1) Học từ vựng theo giáo trình/bài học cố định** — danh sách bài, từ vựng seed sẵn, lesson unlock/course progression | Nội dung không phản ánh những từ người dùng thật sự cần; các từ/bài giả lập không tạo giá trị | **Loại khỏi sản phẩm V2 và navigation.** Thay bằng **Kho từ cá nhân**: mỗi người tự lưu từ, phân bộ, xem nghĩa và ôn tập |
| **(2) Học ngữ pháp theo giáo trình/bài học cố định** — grammar lessons/grammar curriculum | Không phải nhu cầu trọng tâm; kéo sản phẩm về hướng LMS giáo trình | **Loại khỏi luồng V2 và navigation.** Thay trọng tâm bằng **Tra từ Anh–Anh / Anh–Việt**, Word Family và **Chrome Extension** để học qua nội dung thực tế |

**Không có nghĩa là xóa sạch mọi code dùng chung:** Nếu logic flashcard/quiz, session, user, XP, UI card, progress, auth hay validation có thể tái sử dụng cho V2 thì Codex cần đề xuất cách tái sử dụng. Nhưng tuyệt đối **không tiếp tục hiển thị giáo trình từ vựng và ngữ pháp cố định** như sản phẩm chính.

**Không được xóa lịch sử/tài khoản người dùng vô điều kiện.** Dữ liệu seed/demo cần phân biệt với dữ liệu có thật. Có thể archive hoặc cung cấp migration có kiểm soát.

### 2.3. Sự thay đổi định vị

| | V1 (theo định hướng prototype) | V2 (mục tiêu) |
|---|---|---|
| Cách học | Bài học và nội dung được chuẩn bị sẵn | **Tự xây dựng Kho từ của mình** |
| Nguồn từ cần học | Curriculum/seed | Từ do người dùng tra và chọn lưu |
| Phần nội dung chính | Lesson, grammar, course | **Trang chủ, Kho từ, Tra từ** |
| Nội dung từ điển | Có thể là dữ liệu mẫu hoặc nội bộ | **Merriam-Webster Learner's Dictionary API** ưu tiên |
| Cách xem nghĩa | Nhiều giao diện riêng | Một cấu trúc dictionary thống nhất cho web + extension |
| Tổ chức từ | Theo bài học | **Mỗi từ thuộc một bộ sưu tập duy nhất** |
| Dữ liệu | SQLite prototype | **PostgreSQL** |
| Phần vận hành | Chạy prototype trên local | Modular Monolith + Docker Compose, sau đó DevOps/GitOps |

---

## 3. SITEMAP & PHẠM VI SẢN PHẨM V2

### 3.1. Navigation đã thống nhất

**Header/nav chính chỉ gồm:**

```text
StudyForge          Trang chủ   |   Kho từ   |   Tra từ         [Tài khoản]
```

- `Trang chủ`: giới thiệu lợi ích, hành trình học, tiến độ/vườn từ mang tính động lực, CTA cho Kho từ/Tra từ/Extension.
- `Kho từ`: **toàn bộ không gian học từ cá nhân**, quản lý bộ sưu tập và **ôn tập bên trong Kho từ**.
- `Tra từ`: từ điển đầy đủ, tra từ và lưu vào Kho từ.
- Auth/profile/settings có thể là menu tài khoản, **không cần thêm mục lớn vào top navigation**.

**Không tạo nav riêng tên `Ôn tập`** và không tái xuất hiện `Ngữ pháp` hay `Lộ trình bài học cố định`.

### 3.2. Functional scope

| Module | V2 cần làm gì? | Ưu tiên |
|---|---|---|
| Auth & Profile | Đăng nhập/đăng ký nếu code hiện tại có; bảo toàn tài khoản; cá nhân hóa dữ liệu | P0 |
| Dictionary | Tra từ đủ các loại từ, nghĩa, ví dụ, IPA, audio; EN/VI | P0 |
| Collections | Tạo/sửa/xóa bộ, một từ thuộc một bộ, chuyển bộ | P0 |
| Personal Vocabulary | Lưu/tránh trùng/xem nghĩa/đổi trạng thái | P0 |
| Review | Luyện nhiều cách trong Kho từ; lịch sử học, nhãn do người dùng quyết định | P0/P1 |
| Word Family | Hiển thị từ dẫn xuất và tra tiếp | P1 |
| Chrome Extension | Tra từ bôi đen hoặc tra thủ công; popup EN/VI; lưu vào cùng backend | P1 |
| Homepage visual | Giao diện sạch, tiến độ học/vườn từ, CTA | P1 |
| SRS scheduler nâng cao | Lịch ôn thông minh; không ghi đè nhãn học tự chọn | P2 |
| Gamification | Chỉ tái sử dụng nếu có giá trị thực và nhất quán với Review | P2 |

`P0/P1/P2` là **thứ tự triển khai đề xuất**, không có nghĩa được bỏ qua các yêu cầu sản phẩm V2 đã chốt.

---

## 4. UX CHI TIẾT — TRANG CHỦ

### 4.1. Định hướng giao diện

Dùng ngôn ngữ thiết kế lấy cảm hứng từ các mockup MagicPath đã thống nhất:

- Nền trắng/kem nhẹ, dark teal làm màu chính (**tham chiếu** `#194B4A`), mint làm màu phụ.
- Typography rõ ràng, card bo tròn, nhiều khoảng trắng, thân thiện nhưng không trẻ con hóa.
- Hero giới thiệu giá trị: xây Kho từ của riêng mình; tra/lưu ngay trong lúc học và lướt web.
- Hai khối chức năng chính điều hướng tới **Kho từ** và **Tra từ**.
- Khu vực giới thiệu **Chrome Extension** có CTA khi extension sẵn sàng.
- Khu vực **vườn từ/tiến độ học** có thể dùng mầm cây nhỏ màu nâu theo mockup, nhưng các con số học tập phải lấy từ dữ liệu thật, không hardcode demo trong production.
- Footer đồng bộ dark teal.

**Nguồn tham khảo UI đã có (để tham khảo, không bắt buộc sao chép từng pixel):**

- https://www.magicpath.ai/files/464457287898120192

MagicPath từng có các mockup riêng: Homepage, Kho từ, Tra từ, Chrome Extension. Codex chỉ được coi đây là **reference về trải nghiệm và thẩm mỹ**, không giả định đã được export code sang repo. Nếu không truy cập được thiết kế, dựa trên đặc tả văn bản này, không chặn toàn bộ dự án.

### 4.2. Những điều không nên làm

- Không dùng nội dung marketing dài hoặc quá nhiều biểu đồ vô ích.
- Không biến homepage thành dashboard quản trị DevOps.
- Không ưu tiên XP giả hoặc danh sách bài học giả lập từ REA.
- Không thêm quá nhiều mục trong navigation.

---

## 5. UX CHI TIẾT — TRANG TRA TỪ (DICTIONARY)

### 5.1. Hành vi tra cứu

1. Người dùng nhập từ hoặc cụm từ tiếng Anh (ví dụ `run`, `migrate`, `resilient`, `figure out`).
2. Website gửi request tới **Backend Dictionary Module**, backend gọi Merriam-Webster Learner's API qua adapter.
3. Trả về kết quả đã chuẩn hóa, sắp đúng nhóm **part of speech** và từng nghĩa.
4. Mặc định **EN = English definitions**. Có nút chuyển **VI** để xem bản dịch tiếng Việt của **từng định nghĩa**, không dịch mơ hồ từ đơn lẻ.
5. Mỗi nghĩa có thể có nhiều ví dụ tiếng Anh, nhãn ngữ pháp/ngữ cảnh và liên kết tra từ liên quan nếu nguồn cung cấp.
6. Cho phát âm khi có IPA/audio từ provider; phân biệt UK/US nếu **dữ liệu thực có**; không bịa UK/US cho một nguồn chỉ có audio US.
7. Người dùng chọn lưu từ vào **đúng một bộ sưu tập** nếu chưa lưu.

### 5.2. Bố cục nội dung

```text
Tra từ:  [ migrate                     ] [Tra]

migrate                            [EN | VI]
/ˈmaɪˌgreɪt/   🔊

[verb]                             <-- nhãn loại từ, KHÔNG đếm số nghĩa

  1. English definition ...
     English example 1 ...
     English example 2 ...

  2. English definition ...
     English example ...

WORD FAMILY / HỌ TỪ
  migration     noun        [Tra từ]
  migrational   adjective   [Tra từ]

[Bộ sưu tập: IT & DevOps ▼] [Lưu từ]
```

**Khi một từ có nhiều loại từ thật sự** (ví dụ `run` có `verb` và `noun`), hiển thị nhãn/tab `verb`, `noun` để chuyển nghĩa **theo từng loại từ**. Nhãn chỉ ghi **tên loại từ**, không có `verb · 2 nghĩa` hoặc `noun · 1 nghĩa`.

**Dữ liệu đầy đủ:** hiển thị **tất cả các nghĩa và ví dụ mà provider hợp lệ trả về**; đã hủy yêu cầu cũ “chỉ lấy 2–3 nghĩa phổ biến”. `shortdef` của Merriam-Webster chỉ là mô tả rút gọn, **không** được dùng làm toàn bộ dữ liệu dictionary.

### 5.2.1. QUY ĐỊNH BẮT BUỘC — TỪ ĐIỂN ĐẦY ĐỦ THEO POS, KHÔNG CẮT NGHĨA

Đây là yêu cầu trọng yếu nhất của trang **Tra từ**. Codex **không** được triển khai theo kiểu tra một từ chỉ hiện một nghĩa, ba nghĩa phổ biến hoặc một đoạn tóm tắt rồi coi như hoàn thành.

**Thứ tự tổ chức nội dung trên màn hình:**

1. **Headword** (`run`), phần phát âm (IPA và nút audio nếu provider có), và công tắc `EN | VI` dễ nhìn thấy.
2. **Các nhãn/tab loại từ của chính headword**, ví dụ `[verb] [noun]`. Nhãn **chỉ có tên loại từ**, không đếm số nghĩa, không thêm badge `2 meanings`.
3. Người dùng chọn tab nào thì hiện **toàn bộ senses thật sự thuộc loại từ đó**, theo thứ tự trả về của provider: số thứ tự/nhóm nghĩa (nếu có), định nghĩa, nhãn ngữ pháp hoặc ngữ cảnh và **tất cả ví dụ được gắn với từng sense**.
4. Nếu cùng một POS có nhiều entry/homograph khác nhau, UI có thể nhóm trong cùng tab POS **nhưng phải giữ phân tách nội bộ** (headword variants, homograph, grammar labels, thứ tự). **Không** merge hai senses khác nhau chỉ vì text hoặc POS giống nhau, không làm mất bất kỳ entry hợp lệ nào.
5. Nếu nội dung rất dài, dùng **scroll, nhóm mục, accordion, `Xem thêm/Tất cả nghĩa`** có trạng thái rõ ràng. Có thể mặc định thu gọn về mặt trình bày, **nhưng mọi nghĩa phải truy cập được** — không cắt dữ liệu trong API/DTO chỉ để UI trông gọn.
6. Một **sense** có thể chứa nhiều ví dụ, nhãn sử dụng (`of a bird or animal`), cấu trúc ngữ pháp, hoặc các thành phần con. Giữ đúng quan hệ **entry → sense → examples**. Ví dụ của nghĩa A không được chuyển sang nghĩa B.
7. Không gán từ dẫn xuất, biến thể chia động từ hoặc gợi ý đánh vần vào tab POS của headword. POS tabs chỉ là **các mục từ thực sự có nghĩa của headword đang tra**.
8. Nếu provider không có dữ liệu nghĩa, ví dụ, IPA hoặc accent nhất định, hiển thị trung thực phần có sẵn; **không tự bịa một nghĩa hoặc gán cho Merriam-Webster**.

**Phân biệt các nhóm nội dung:**

| Loại dữ liệu | Vị trí hiển thị | Điều không được làm |
|---|---|---|
| `dictionary entry` có `fl` (`verb`, `noun`, ...) | Tab/nhãn POS của từ đang tra | Dùng POS từ `uros` để tạo tab |
| `def[].sseq` với `sense`/phần nghĩa con | Danh sách nghĩa trong POS tương ứng | Chỉ dùng `shortdef`, bỏ hết nghĩa còn lại |
| `dt` / `vis` | Ví dụ của **đúng** nghĩa chứa nó | Gom mọi ví dụ thành một danh sách chung không rõ nghĩa |
| `sls`, `gram` và nhãn ngữ pháp có sẵn | Nhãn phụ nhỏ cạnh nghĩa/entry nếu hữu ích | Biến các nhãn này thành POS khác |
| `uros` (`migration`, `migrational`...) | **Word Family** riêng | Gán `migration` là danh từ của **chính** `migrate` |
| `ins`, `meta.stems` | Dạng biến đổi/từ dùng để tra cứu khi cần | Mặc định coi mọi biến thể chia từ là một nghĩa hoặc một Word Family item |
| Kết quả spelling suggestion (response dạng mảng chuỗi) | Danh sách gợi ý từ gần đúng | Hiển thị chuỗi gợi ý như một định nghĩa |

### 5.2.2. Ví dụ kiểm chứng trực quan mà Codex phải hiểu

**Ví dụ A — `migrate` (dựa trên JSON thực tế người dùng đã test):**

```text
migrate                  /ˈmaɪˌgreɪt/   🔊     [EN | VI]
[verb]
  1. To move from one country or place to live or work in another.
     • He migrates from New York to Florida each winter.
     • Thousands of workers migrate to this area each summer.
  2. To move from one area to another at different times of the year.
     Usage: of a bird or animal
     • The whales migrate between their feeding ground ...
     • They followed the migrating herds ...
     • migrating birds

Họ từ
  migration (noun)               [Tra]
  migrational (adjective)        [Tra]
```

- `migrate` **chỉ có tab `verb`** trong kết quả test này; `noun` và `adjective` là loại từ của **từ khác** trong Word Family.
- Bản test này không có nghĩa kỹ thuật “di chuyển database”; không tự thêm vào và quảng cáo là nghĩa do Merriam-Webster trả về.
- Nội dung trong ví dụ chỉ nhằm khẳng định cấu trúc/thứ tự và số ví dụ theo payload người dùng đã cung cấp, **không làm data seed mặc định**.

**Ví dụ B — `run` (kịch bản UX giả định, cần xác minh payload thật):**

```text
run              /rʌn/           🔊       [EN | VI]
[verb] [noun]

Chọn [verb] -> hiển thị toàn bộ nghĩa + ví dụ của verb
Chọn [noun] -> hiển thị toàn bộ nghĩa + ví dụ của noun
```

Không hiển thị kiểu `[verb · 2 nghĩa]` / `[noun · 1 nghĩa]`. Nếu API trả về 8 nghĩa cho verb và 4 nghĩa cho noun thì phải đọc được **cả 8 và cả 4**. Không áp trần dữ liệu từ UX cũ.

### 5.2.3. Phân biệt phạm vi của Tra từ và Kho từ

- **Trang Tra từ**: tra cứu toàn bộ dữ liệu từ điển có sẵn, dù từ đó **chưa** được lưu.
- **Kho từ**: chỉ chứa những mục từ người dùng chủ động lưu. **Mục tiêu V2 là xem được toàn bộ nghĩa đã tra** (không giới hạn 2–3), phân loại POS giống Trang Tra từ. Quyền lưu/caching nội dung được xử lý riêng ở mục 9.5, không phải lý do để âm thầm lược bớt nghĩa trong giao diện.
- Nút **Lưu** lưu một **mục từ** thuộc đúng một collection; không tạo một saved-word cho mỗi sense hoặc mỗi POS. Các nghĩa và ví dụ là thuộc tính từ điển của mục từ, không tạo nhãn ghi nhớ riêng cho từng nghĩa.
- Chỉ mở Trang Tra từ **không** tự lưu; khi user nhấn lưu, **không** đưa popup yêu cầu chọn 2–3 nghĩa (quyết định cũ đã bị hủy).

### 5.3. EN/VI chính xác là gì?

- **EN (default):** Giữ định nghĩa Anh–Anh và ví dụ Anh.
- **VI:** Đổi phần **định nghĩa của từng sense** sang tiếng Việt tương ứng; ví dụ Anh vẫn được giữ (có thể thêm tính năng mở bản dịch của ví dụ về sau).
- VI là chế độ hỗ trợ, không làm mất thông tin POS, IPA, examples hoặc Word Family.
- `EN | VI` **chỉ thay đổi ngôn ngữ hiển thị định nghĩa**, không dịch toàn bộ nhãn giao diện, không làm đổi từ gốc, không xóa ví dụ tiếng Anh. Việc chuyển tab POS khi đang ở VI **vẫn phải giữ VI**; đổi từ để tra mới thì mặc định EN hay giữ lựa chọn trước đó theo setting người dùng, nhưng nhất quán giữa web/extension.
- Nếu một sense chưa có bản dịch VI, giữ nguyên đúng nghĩa EN tại vị trí đó, báo nhẹ rằng bản dịch chưa có; không dùng một bản dịch chung của headword để thay cho mọi nghĩa.
- Dịch nguyên **sense definition** có ngữ cảnh, không lấy một bản dịch phổ quát của từ. Ví dụ `run` trong công nghệ khác `run` (chạy bộ).
- Nếu không lấy được bản dịch: hiển thị fallback EN và thông báo nhẹ, **không bịa nội dung**.
- Thực hiện translation qua một service/adapter tách biệt; **chưa chốt nhà cung cấp dịch**. Không cứng vào Google Translate hay AI nào khi chưa được quyết định.

### 5.4. Word Family / Họ từ

Trong JSON thử nghiệm Merriam-Webster Learner's của `migrate` có `uros` chứa:

- `migration` — noun;
- `migrational` — adjective.

**Đây là các từ dẫn xuất**, **không có nghĩa `migrate` là noun/adjective**. Phải hiển thị riêng dưới mục `Họ từ`, mỗi mục có nút/khả năng nhấn để tra **mục từ mới**. Không tự lưu họ từ khi người dùng lưu từ gốc.

`uros` không nhất thiết bao phủ toàn bộ họ từ, vì vậy chỉ hiển thị điều nguồn dữ liệu có, không tự suy diễn tất cả biến thể.

- Với mỗi item Word Family, hiển thị **tên từ** và **loại từ riêng của item** (nếu có), ví dụ `migration — noun`; click sẽ tra theo luồng dictionary thông thường (và có nút lưu riêng nếu user muốn). Không tự bổ sung tất cả Word Family items vào bộ sưu tập của từ gốc.
- Với Trang Tra từ hiển thị Word Family dưới nghĩa; với Extension đặt trong accordion/khối thu gọn để popup nhỏ không bị rối. Không yêu cầu hiển thị Word Family thành một danh sách lớn ở mọi card Kho từ.

### 5.5. Hành vi khi từ đã lưu

Nếu người dùng tra lại `migrate`, hệ thống kiểm tra saved word của user:

- Nếu đã lưu: hiện **đúng bộ sưu tập đang chứa từ** và **trạng thái hiện tại**; không thêm trùng.
- Có thể cho **chuyển sang bộ sưu tập khác** bằng một thao tác rõ ràng. Chuyển bộ = cập nhật bản ghi, **không** tạo bản ghi từ mới.
- Hiển thị một lời nhắc ngắn, đáng yêu, tùy tình huống: “Ơ kìa, từ này cậu lưu rồi đó 🌱”; nếu `Chưa học/Đang học` có thể nhắc nhẹ; nếu `Đã nhớ` thì ghi nhận tích cực. Không hiện lặp đến mức gây phiền.
- Tuyệt đối không còn giao diện cho tick nhiều bộ sưu tập cùng lúc.

### 5.6. Khi từ không có kết quả

- Cho gợi ý chính tả/các từ gần nhất khi API cung cấp; không coi các chuỗi gợi ý là entry định nghĩa.
- Thể hiện trạng thái `loading`, `not found`, `rate limited`, `API down`, `translation unavailable` rõ ràng.
- Không tự insert kết quả thất bại thành mục từ học giả.

---

## 6. UX CHI TIẾT — KHO TỪ (PERSONAL VOCABULARY)

### 6.1. Cấu trúc chính

Kho từ là trung tâm học tập của V2, gồm:

- Danh sách các **bộ sưu tập** do người dùng tạo.
- Danh sách từ trong mỗi bộ với search/filter/sort đơn giản.
- Chi tiết một từ khi nhấn card.
- Các chế độ **ôn tập bên trong Kho từ**, không trong top-level navigation và không cần nút ôn ở card chi tiết.

### 6.2. Danh sách từ — đã chốt tối giản

Một card/hàng trong Kho từ hiển thị đúng thông tin quan trọng:

```text
resilient                         [Đang học]
Có khả năng phục hồi, kiên cường
[IT & DevOps]                            >
```

Card danh sách ưu tiên đúng bố cục người dùng đã duyệt: **tên từ + một dòng nghĩa tóm tắt dễ hiểu (ưu tiên VI khi có dữ liệu phù hợp) + trạng thái + bộ sưu tập**. Quy tắc **EN mặc định** áp dụng bắt buộc ở **màn hình Tra từ và popup Extension**, không đồng nghĩa card Kho từ phải luôn hiện toàn bộ định nghĩa EN. Nếu chưa có tóm tắt/bản dịch được phép sử dụng thì fallback nội dung hợp lệ, không tự bịa. Không cố nhét mọi nghĩa, mọi ví dụ, IPA, lịch sử ôn, ngày lưu và metadata vào card danh sách.

Có thể hiển thị badge của bộ khi đang xem tất cả từ; nếu đã lọc trong một bộ thì tránh lặp không cần thiết.

### 6.3. Panel/trang chi tiết — đã chốt tối giản

```text
run                                 [Đang học]
/rʌn/ 🔊

LOẠI TỪ
[ verb ]   [ noun ]                     <-- tab chỉ ghi loại từ

Khi chọn verb:
  1. To move quickly on foot.
     (VI nếu đang chọn VI: Chạy, chạy bộ.)
     Example: She runs every morning.

  2. To operate or manage something.
     Example: We run the application in a container.

[Ngữ cảnh cá nhân (nếu có)]            <-- thu gọn tùy chọn

Bộ sưu tập                         [IT & DevOps]
```

**Không đặt nút `Ôn tập từ này`.** Không đặt nút `Chỉnh sửa` thật lớn ở cuối card. Nếu cần chỉnh sửa, chỉ dùng icon bút chì/menu kín đáo. Không lặp trạng thái ghi nhớ ở đầu và cuối cùng một panel. Không bắt buộc hiển thị `Đã lưu ngày nào`, `Từ Chrome Extension`, URL nguồn hay các con số không có ích.

**Quy tắc nghĩa:** một từ có thể có nhiều entry/part-of-speech, mỗi entry có nhiều senses và mỗi sense có ví dụ. Người dùng có thể duyệt bằng tab. Dữ liệu nghĩa đầy đủ theo provider, không giới hạn 2–3.
**Tương tác panel bắt buộc:**

- Chỉ những **POS thật của mục từ** được hiện thành nhãn; nhấn nhãn để đổi nhóm nghĩa + ví dụ; **không** ghi tổng số nghĩa lên nhãn.
- Trong tab được chọn, hiển thị mọi định nghĩa thuộc tab đó; nghĩa dài thì cho scroll/thu gọn hợp lý chứ không âm thầm bỏ bớt. Một nghĩa có nhiều ví dụ thì tất cả phải truy cập được.
- **Trạng thái xuất hiện đúng một lần** tại đầu card; **bộ sưu tập hiện đúng một lần** ở phần cuối. Không dựng lại phần ngày lưu, nguồn website/YouTube hoặc hai nút CTA ở chân card.
- Chỉ dùng icon chỉnh sửa nhỏ hoặc menu phụ nếu người dùng thực sự cần chỉnh `personal_note`/ngữ cảnh/trạng thái/chuyển collection. Không hiển thị nút lớn `Ôn tập từ này`, không ép tính năng ôn từng từ trên card.
- Ví dụ do nhà cung cấp từ điển trả về và **câu ngữ cảnh riêng** (nếu user tự lưu) là **hai loại dữ liệu khác nhau**, không nhập nhằng như cùng một nghĩa hay cùng một nguồn.

### 6.4. Bộ sưu tập — ràng buộc nghiệp vụ BẮT BUỘC

**Một saved word của một user thuộc ĐÚNG MỘT collection tại một thời điểm.**

- Một user có thể có nhiều collections: `IT & DevOps`, `Everyday English`, `Academic English`...
- Ví dụ `migrate` đã ở `IT & DevOps` thì nó **không thể đồng thời ở** `Everyday English`.
- Nếu user muốn thay đổi, hệ thống cung cấp **Move to collection**, cập nhật `collection_id`.
- Nếu user cố thêm lại một từ đã lưu, hiển thị bản ghi cũ, không insert trùng.
- Tạo mới collection khi cần; khi lưu từ yêu cầu user chọn **một** collection hợp lệ. Nếu chưa có collection, hướng dẫn tạo một bộ trước; **không tự đặt tên bộ theo suy đoán**.
- Khi xóa collection có từ, không được làm mất từ âm thầm. Cần có luồng chuyển từ sang bộ khác hoặc xác nhận rõ tác động theo UX/DB policy.

### 6.5. Ba trạng thái ghi nhớ duy nhất

| Value kỹ thuật | Nhãn UI | Ngữ nghĩa |
|---|---|---|
| `new` | **Chưa học** | Từ vừa lưu hoặc chưa bắt đầu học |
| `learning` | **Đang học** | Đang luyện, chưa tự tin nhớ |
| `known` | **Đã nhớ** | Người dùng chủ động xác nhận đã nhớ |

- Mới lưu: `new`.
- Sau khi tham gia một bài ôn, có thể chuyển `new` → `learning` theo UX đã thiết kế; **không** tự chuyển sang `known`.
- Có một thao tác rõ ràng để người dùng **tự xác nhận** `Đã nhớ` sau khi học/ôn; cũng có thể chuyển ngược về `Đang học` nếu quên.
- **Trạng thái thuộc saved word của user**, không thuộc sense hay collection.
- Lịch đến hạn ôn SRS (`due_at`) là dữ liệu KHÁC; **không tạo nhãn thứ tư “Đến hạn ôn”** thay ba nhãn chính.

### 6.6. Ôn tập nằm trong Kho từ

- Có thể tái sử dụng các cơ chế quiz/flashcard từ V1, nhưng nội dung câu hỏi phải xây từ **từ đã lưu của người dùng**, không từ giáo trình seed.
- Cho phép nhiều kiểu ôn (gợi ý: flashcard, tự gõ nghĩa/điền từ, trắc nghiệm, nghe-phát âm) và phát triển tăng dần. Những mode chưa được chốt chi tiết thì xem như **đề xuất**, không giả định V1 đã có hoặc phải hoàn thiện cùng lúc.
- User chọn học toàn bộ Kho từ hoặc một collection; vẫn chỉ có một saved word bản gốc.
- Lịch sử ôn có thể ghi `word_id`, `mode`, thời điểm và kết quả khi có, phục vụ tiến độ học/vườn từ.
- Nếu áp dụng FSRS/SRS: thuật toán phục vụ thứ tự/lịch ôn; nhãn `known` vẫn do người học tự quyết định.
- Không gắn một nút Ôn vào mọi card chi tiết; dùng một trang/tabs/khối ôn tập ở **cấp Kho từ**.

### 6.7. Ngữ cảnh cá nhân (phụ, không phải tracking nguồn)

- Nếu người dùng bôi đen từ trong câu khi đọc web, **có thể** giữ lại **chính câu đó** như ghi chú/ngữ cảnh để nhớ từ.
- Người dùng đã nói **không cần quan tâm lấy từ ở đâu**: không lưu website URL, video URL, YouTube ID, source title, source type, tab URL, `saved_via_extension` hay tracking tương tự vào saved-word record.
- Không tự động lưu trọn trang hoặc toàn bộ transcript; ngữ cảnh chỉ là câu ngắn mà người dùng có ý định giữ và extension được phép truy cập.
- Nếu tính năng lưu câu ngữ cảnh làm phức tạp milestone đầu, có thể trì hoãn bảng/UX đó nhưng phải ghi rõ đây là khả năng mở rộng đã được bàn.

---

## 7. UX & KỸ THUẬT — CHROME EXTENSION

### 7.1. Hai cách dùng đã được chủ dự án đồng ý

**Luồng A: Bôi đen từ ngay trên website / video**

1. User chọn từ/cụm từ (ví dụ `resilient`) trên trang đang đọc.
2. Extension cung cấp hành động `Tra với StudyForge` qua context menu/selection action phù hợp.
3. Mở popup/panel nhỏ hiển thị kết quả từ Backend Dictionary, mặc định **Anh–Anh**.
4. Cho nút **EN / VI** chuyển định nghĩa.
5. User chọn đúng **một bộ sưu tập** và lưu.
6. Nếu từ đã lưu, hiển thị bộ sưu tập hiện tại, trạng thái và note dễ thương; có thể chuyển bộ.

**Luồng B: Bấm biểu tượng Extension để tra thủ công**

1. User bấm biểu tượng StudyForge trên thanh trình duyệt.
2. Nhập từ cần tra; không phụ thuộc vào văn bản đang chọn.
3. Kết quả, EN/VI, Word Family và chức năng lưu hoạt động giống Luồng A.

### 7.2. Bố cục popup

- Header dark teal `StudyForge.`
- Ô tra hoặc từ đã được chọn; tiêu đề từ lớn vừa phải, POS, IPA, audio khi có.
- **EN / VI switch luôn dễ thấy**. Đây là yêu cầu cực kỳ quan trọng đã bị bỏ sót ở mockup cũ.
- **Nhóm POS dạng tab/chip chỉ ghi `verb`, `noun`, `adjective`...**, nhấn POS để xem đúng nghĩa + ví dụ của nó; không đếm nghĩa trên nhãn.
- **Cùng dữ liệu đầy đủ với trang Tra từ**, không mặc định chỉ lấy nghĩa số 1 hoặc `shortdef` làm toàn bộ kết quả. Với popup nhỏ, có thể cuộn/thu gọn và mở rộng `Xem tất cả nghĩa` hoặc điều hướng rõ ràng tới cùng kết quả trên website; không âm thầm lược mất nghĩa.
- Chuyển EN/VI tác động lên **từng sense** trên mọi tab POS; ví dụ tiếng Anh giữ nguyên.
- Ví dụ Anh ngắn và rõ; Word Family là mục có thể mở rộng, click họ từ thì tra từ đó trong popup.
- Selector chỉ được chọn **một** collection, lưu một từ một lần.
- Nếu từ đã lưu, thay lời nhắc và trạng thái thao tác tương ứng; không hiển thị nhiều collection đã chọn.
- Không mặc định hiển thị `Source: Kubernetes Documentation`, URL video, lịch sử capture vì **không lưu nguồn**.
- Những chức năng dài/phức tạp (quản lý bộ, review) điều hướng tới website, không nhồi vào popup.

### 7.3. Tính nhất quán giữa web/extension

- Chỉ **một Backend REST API** dùng chung cho Website và Extension; không duplicate business rules ở hai client.
- Extension không dùng API key Merriam-Webster ở client, chỉ gọi StudyForge Backend đã xác thực.
- Nếu lấy câu ngữ cảnh từ selection, chỉ xin permissions tối thiểu và xử lý khi user kích hoạt; không tự scan toàn bộ browsing history.
- Trang đặc biệt của Chrome và nhiều video không cho lấy câu tự động; cần fallback chỉ dùng từ được chọn, **không hứa lấy được mọi phụ đề YouTube**.
- Chưa cần đưa Extension lên Chrome Web Store cho milestone đầu; ưu tiên load unpacked và test trên Chrome local.

---

## 8. MERRIAM-WEBSTER LEARNER'S DICTIONARY — CONTRACT & PARSER

### 8.1. Provider ưu tiên

**Merriam-Webster Learner's Dictionary API**, endpoint minh họa (**KHÔNG CHÈN KEY THẬT**):

```http
GET https://www.dictionaryapi.com/api/v3/references/learners/json/migrate?key=YOUR_API_KEY
```

API key **chỉ lưu trên Backend** trong env/secret manager, không nằm trong response công khai, Git, browser localStorage hoặc Chrome Extension package. Một key cũ từng được đưa vào tin nhắn và nên được rotate trước triển khai public.

### 8.2. Dữ liệu JSON đã được người dùng thử nghiệm thật với `migrate`

Trong kết quả thực tế đã thấy:

- `meta.id` — định danh entry: `migrate`.
- `fl` — loại từ chính: `verb`.
- `hwi.hw`, `hwi.prs[].ipa` — headword, IPA.
- `hwi.prs[].sound.audio` — token cho đường dẫn audio, ví dụ `migrat02`.
- `def[].sseq` — cấu trúc nhiều nghĩa, phân cấp.
- `dt` bao gồm `text` (định nghĩa), `vis` (ví dụ), có thể có cross references hoặc markup đặc biệt.
- `sls` — nhãn ngữ cảnh của nghĩa như `of a bird or animal`.
- `uros` — từ dẫn xuất như `migration` (noun), `migrational` (adjective).
- `shortdef` — danh sách nghĩa ngắn, **không** phải toàn bộ nghĩa.
- `gram: "no obj"`, `ins` và `meta.stems` — ngữ pháp, biến thể/chia từ; **không** phải thêm nghĩa hoặc POS của từ.
- `meta.app-shortdef`/`shortdef` có thể hữu ích cho preview nhưng **không được dùng làm nguồn duy nhất** cho Tra từ hay panel Kho từ.

**Đặc biệt với dữ liệu thực `migrate` của người dùng:** top-level `fl = verb` và `def[].sseq` có **2 senses**; `uros` có `migration` noun và `migrational` adjective. Điều này là test fixture quan trọng để chống lỗi nhóm POS và Word Family. Không cần gọi API với key thật trong unit test; dùng fixture đã redacted từ JSON cậu cung cấp.

### 8.3. Quy tắc parser bắt buộc

1. Có **Dictionary Adapter** ở Backend để chuyển response provider → object chuẩn của StudyForge; frontend không parse raw `sseq`.
2. Chấp nhận **nhiều entry cho cùng headword**, POS/homographs; không gộp bừa entry trùng `fl` làm mất thông tin.
3. Phân tích `def.sseq`, `sense`, `dt`, `vis`, `sls`, thứ tự và ký hiệu nhà cung cấp; không dùng regex xóa markup rồi làm hỏng ví dụ hoặc bỏ sót nhánh nghĩa.
4. Giữ **tất cả senses API cung cấp** ở mức view/contract, không cắt ở 3 hoặc dùng `shortdef` thay phần đầy đủ.
   - Cần xử lý/không làm mất các cấu trúc nghĩa lồng nhau mà provider thực sự hỗ trợ; flatten để render chỉ khi vẫn giữ đúng thứ tự, nhãn và ngữ nghĩa. Nếu parser chưa hỗ trợ một nhánh quan trọng, báo lỗi/coverage rõ thay vì trả response thành công nhưng mất nghĩa trong im lặng.
   - Các markup như `{bc}`, `{it}...{/it}`, liên kết tham chiếu `{dx}`/`{dxt}` cần parser theo tài liệu và renderer an toàn, không bỏ nguyên chuỗi control vào UI, không dùng raw HTML không được lọc.
5. Từ dẫn xuất trong `uros` nằm ở **Word Family**, không được xem là POS của từ tra. Click từ liên quan = tra request mới; không auto-save.
6. Normalize sang plain text / presentation model an toàn; không inject HTML chưa kiểm soát.
7. Tên file audio phải được resolve theo **quy tắc media URL chính thức**, không hardcode mọi từ vào cùng một thư mục; handle trường hợp thiếu IPA/audio.
8. Nếu provider trả về danh sách gợi ý chính tả thay vì entry object thì hiện suggestion, không crash.
9. Không khẳng định API phủ hết nghĩa chuyên ngành IT. Trong test `migrate`, kết quả Learner's chỉ có hai nghĩa chính liên quan đến di cư/động vật, **không có nghĩa chuyển database**. Không được tự tạo nghĩa computing rồi gán là Merriam-Webster.
10. Log lỗi với redaction; không ghi API Key vào log, analytics, URL hiển thị cho client.

### 8.4. Contracts mẫu (minh họa riêng, KHÔNG là JSON gốc Merriam-Webster)

```json
{
  "term": "migrate",
  "language": "en",
  "pronunciations": [{"ipa": "ˈmaɪˌgreɪt", "audioUrl": null}],
  "entries": [
    {
      "partOfSpeech": "verb",
      "senses": [
        {
          "order": 1,
          "definitionEn": "To move to another place to live or work.",
          "definitionVi": null,
          "examplesEn": ["Some people migrate for work."]
        },
        {
          "order": 2,
          "definitionEn": "For animals, to move between areas at different times of the year.",
          "definitionVi": null,
          "examplesEn": ["Some birds migrate before winter."]
        }
      ]
    }
  ],
  "wordFamily": [
    {"term": "migration", "partOfSpeech": "noun"},
    {"term": "migrational", "partOfSpeech": "adjective"}
  ],
  "savedWord": null
}
```

Mẫu chỉ mô tả **shape** cho `packages/contracts`, không được dùng làm dữ liệu test kỳ vọng nguyên văn từ Merriam-Webster và không tự nhận là trích dẫn của provider.

### 8.5. Translation Adapter

- Mục tiêu EN → VI **theo từng sense**, gắn với đúng entry/POS.
- Dịch vụ dịch chưa chốt, cần interface thay được provider.
- Không hiển thị bản dịch từ không có dữ liệu như thể nó có từ điển chính thức.
- Cần chiến lược lỗi/timeout/rate limit, attribution và quyền lưu bản dịch.

---

## 9. POSTGRESQL V2 — MÔ HÌNH DỮ LIỆU MỤC TIÊU

**Đã tồn tại một bản đề xuất DBML/ERD riêng:** `StudyForge_V2_PostgreSQL.dbml` (16 bảng) cùng tài liệu giải thích `StudyForge_V2_Database_Design_Guide.md`. Nếu file được đặt vào repo/handoff thì đọc và đối chiếu. **Không giả định repo hiện tại đã có những bảng này, không coi DBML là migration SQL đã kiểm thử.**

### 9.1. Nguyên tắc thiết kế

- **Phân biệt dictionary data dùng chung** với **saved words mang tính cá nhân**. Nhiều user cùng học `migrate` không cần nhân bản identity của từ.
- Người dùng có thể lưu cùng từ, nhưng **mỗi user chỉ được có một saved word duy nhất cho cùng mục từ**, dùng unique key.
- `saved_words` có `collection_id` **NOT NULL**, một saved word thuộc đúng một collection.
- Foreign key cần bảo đảm collection thuộc **chính user sở hữu** saved word (composite FK hoặc một cơ chế DB enforce tương đương).
- Mỗi từ có thể có nhiều `dictionary_entries` (POS), nhiều senses và nhiều examples; Word Family riêng.
- `learning_status` là thuộc tính của `saved_words`, value `new | learning | known`.
- `review_events` log học; `review_schedules` tùy chọn cho SRS, không can thiệp quyền đánh giá của user.
- `user_settings` giữ tùy chọn EN/VI và một số tùy chọn học cần thiết.
- **Không lưu source URL, YouTube video ID, tên trang hoặc capture method** khi lưu từ. Nếu cần sentence riêng thì `personal_contexts` không gắn URL.
- `dictionary_sources` dùng để quản lý **nhà cung cấp nội dung từ điển/giấy phép**, khác hoàn toàn với **website/video người dùng gặp từ**. Không xóa loại metadata kỹ thuật này chỉ vì người dùng không muốn lưu nguồn duyệt web.
- Từ điển `lexemes`/`dictionary_entries`/`dictionary_senses` là dữ liệu dùng chung giữa người dùng, `saved_words` là dữ liệu sở hữu riêng. Các hình thức từ `run`, `runs`, `running` cần được normalize/lookup cẩn thận, **không** tự giả định tất cả biến thể là một từ nếu dictionary adapter chưa xác định được lemma hợp lệ.
- Cột/tables cho dictionary provider metadata (license/attribution) chỉ phục vụ quản trị **nguồn định nghĩa**, **không phải nguồn nơi user gặp từ**.

### 9.2. Những bảng đề xuất đã bàn

| Nhóm | Bảng | Vai trò |
|---|---|---|
| Auth | `users`, `user_settings`, `auth_sessions` | Người dùng, cấu hình, session nếu cơ chế auth cần |
| Cá nhân | `collections`, `saved_words`, `personal_contexts` | Kho từ và ngữ cảnh tự lưu; `personal_contexts` có thể trì hoãn |
| Từ điển | `lexemes`, `dictionary_sources`, `dictionary_entries`, `dictionary_pronunciations`, `dictionary_senses`, `sense_examples`, `sense_translations`, `related_terms` | Identity, loại từ, nghĩa, ví dụ, dịch, họ từ |
| Review | `review_events`, `review_schedules` | Lịch sử học và SRS tùy chọn |

**Chú ý:** Đây là **mô hình đề xuất, không phải lệnh phải tạo đủ 16 bảng ngay sprint đầu**. Codex cần kiểm tra hiện trạng và chia migration theo milestone.

### 9.3. Quan hệ/constraints trọng điểm

```text
users (1) ──< collections (N)
users (1) ──< saved_words (N) >── (1) lexemes
collections (1) ──< saved_words (N)
lexemes (1) ──< dictionary_entries (N)
dictionary_entries (1) ──< dictionary_senses (N)
dictionary_senses (1) ──< sense_examples (N)
dictionary_senses (1) ──< sense_translations (N)
lexemes (1) ──< related_terms (N)
saved_words (1) ──< review_events (N)
saved_words (1) ── (0/1) review_schedules
```

Ràng buộc cần được kiểm chứng bằng test:

- `UNIQUE(users.email_normalized)` hoặc chuẩn hóa email tương đương.
- `UNIQUE(lexemes.language_code, lexemes.normalized_term)`.
- `UNIQUE(saved_words.user_id, saved_words.lexeme_id)`.
- `UNIQUE(collections.user_id, collections.normalized_name)`.
- `FK (saved_words.user_id, saved_words.collection_id) -> (collections.user_id, collections.id)` hoặc DB-level enforcement tương đương.
- Trạng thái chỉ `new`, `learning`, `known`.
- Unique thứ tự nghĩa/ví dụ theo parent khi cần.
- `created_at`, `updated_at`, timestamps **TIMESTAMPTZ** cho thời điểm; dùng UUID làm identifier khi phù hợp.
- Khi xóa collection, áp dụng chính sách tường minh để không mất dữ liệu ngoài ý muốn.

### 9.4. Những gì V2 KHÔNG cần ở Database

- Không cần cấu trúc curriculum cố định làm trọng tâm (`grammar_lessons`, seeded vocabulary lessons, course progress cứng).
- Không dùng bảng N–N `collection_items` nếu requirement vẫn là **mỗi từ một collection**.
- Không thêm `captured_source_url`, `youtube_url`, `source_type`, `extension_capture_history` để theo dõi nguồn gặp từ.
- Không lưu `learning_status` cho từng nghĩa riêng.
- Không đặt `due_at` đồng nghĩa với trạng thái `known`.

### 9.5. Cần phân biệt “thiết kế được” và “được phép persist”

**Mục tiêu sản phẩm** là người dùng nhấn Lưu, sau đó xem lại toàn bộ nghĩa/ví dụ trong Kho từ mà không phụ thuộc việc tra lại. PostgreSQL V2 được **thiết kế để hỗ trợ** kịch bản đó.

Tuy nhiên **quyền dùng Merriam-Webster API không tự cấp phép lưu vĩnh viễn toàn bộ nội dung từ điển hoặc tạo/lưu bản dịch**. Khi chưa có quyền được xác nhận, triển khai được ngay phần **persist dữ liệu cá nhân** (`saved_words`, collections, review) và hiển thị định nghĩa theo API lúc xem; chỉ persist nguyên nội dung dictionary khi giấy phép cho phép hoặc chuyển sang nguồn đã cấp phép lưu. **Không dùng luận điểm “provider không thấy DB” làm lý do bỏ qua điều khoản.**

Đây là **ràng buộc triển khai**, không thay đổi mục tiêu UX/Kho từ đã chốt.

---

## 10. KIẾN TRÚC CODE & DEPLOYMENT MỤC TIÊU

### 10.1. Monorepo & Backend Modular Monolith

**Mục tiêu kỹ thuật:** Monorepo, frontend/backend tách độc lập ở mức deployment, Backend **Modular Monolith**, không chia thành nhiều microservices khi chưa cần.

Cấu trúc mục tiêu mang tính gợi ý, chỉ áp dụng sau khi audit repo:

```text
studyforge/
├── frontend/                   # Web app hiện tại được refactor
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/
│       │   ├── dictionary/      # API provider adapter + parser
│       │   ├── vocabulary/      # saved words
│       │   ├── collections/
│       │   ├── review/
│       │   └── profile/
│       ├── shared/
│       └── app.*
├── extension/                  # Chrome Extension MV3 (giai đoạn P1)
├── packages/
│   └── contracts/              # Shared DTO/types/validation, nếu phù hợp
├── database/
│   └── migrations/             # SQL versioned migrations
├── infra/
│   └── docker/
├── tests/
├── docs/
├── scripts/
├── compose.yaml
├── .env.example
└── package.json                # workspaces root nếu dùng npm workspaces
```

**Không ép rename/move file nếu repo hiện tại có cấu trúc tương đương tốt.**

Backend nên theo hướng `route/controller → service/use-case → repository → PostgreSQL`, domain logic tách khỏi framework và Merriam-Webster adapter. Có thể dùng `pg` (node-postgres) + SQL migrations có version để dễ học SQL thật; transaction nhiều thao tác phải dùng **cùng PostgreSQL client**.

### 10.2. Docker Compose mục tiêu

Đã định hướng **4 services**:

1. `frontend`: build static SPA rồi serve qua Nginx, là service duy nhất công bố port host; proxy `/api` sang backend trong Compose.
2. `backend`: Node.js/TypeScript API, chỉ expose nội bộ Compose, giữ secrets server-side.
3. `db`: **PostgreSQL 18**, healthcheck, named volume persistent; với official `postgres:18`, mount parent directory **`/var/lib/postgresql`** phù hợp image layout phiên bản 18.
4. `migrate`: **one-shot** job chạy SQL versioned migrations, có thể reuse backend image; chờ `db` healthy, backend chờ migration hoàn tất thành công (nếu Compose version hỗ trợ).

Lưu ý: `localhost` từ browser khác DNS `backend` trong Docker; Nginx proxy `/api` xử lý chuyện này. Không publish DB port ra Internet. `docker compose down` bình thường không xóa named volume; `down -v` thì có thể xóa dữ liệu, cần backup/restore. Không auto-seed các bài học giả trên startup.

### 10.3. Từ SQLite cũ sang PostgreSQL

- **Audit schema hiện tại** trước; không tạo PostgreSQL trống rồi mặc định bỏ dữ liệu user cũ.
- Phân loại dữ liệu: real users, auth, progress/review hữu ích vs seeded curriculum/demo content.
- Lập mapping từng bảng V1 → V2; ghi rõ bảng nào drop/deprecate, bảng nào migrate, bảng nào transform, bảng nào archive.
- Backup database SQLite và scripts trước khi migration.
- Chuyển dữ liệu dùng script có idempotency/test, kiểm tra row counts/FK/unique, rollback.
- Không tự động đưa 50 lesson/250 từ seed (nếu repo thực tế có) vào bộ sưu tập người dùng như từ họ tự lưu.
- Auth/password migration cần giữ được đăng nhập an toàn, không tự reset mật khẩu vô điều kiện.

### 10.4. API nội bộ gợi ý — KHÔNG áp đặt URL cứng

```text
GET    /api/dictionary/search?q=run&lang=en
GET    /api/dictionary/:term
GET    /api/dictionary/:term/translations?lang=vi

GET    /api/collections
POST   /api/collections
PATCH  /api/collections/:id
DELETE /api/collections/:id

GET    /api/words?collectionId=...&status=...
POST   /api/words             # save term -> exactly 1 collection
GET    /api/words/:id
PATCH  /api/words/:id          # move collection, status, personal note
DELETE /api/words/:id

POST   /api/reviews/events
GET    /api/reviews/summary
```

Đây là route naming minh họa. Codex cần kiểm tra conventions hiện có, REST, validation, auth và idempotency, sau đó đề xuất API thực tế. Không expose provider key. Server phải kiểm tra user sở hữu word/collection.

### 10.5. Bảo mật & quyền riêng tư

- Secrets trong env/secret manager; `.env.example` chứa placeholders, `.env` gitignored.
- Rate limit và timeout các API gọi bên ngoài, không retry vô hạn.
- Backend enforce ownership cho mọi hành động CRUD; DB có constraints bổ sung.
- Không log câu ngữ cảnh cá nhân nếu không cần; không gửi browsing history/URL vì requirement không lưu nguồn.
- Không sao chép logo/content của website tham khảo REA khi không có quyền; chỉ lấy cảm hứng UX.
- Xem xét CORS giữa extension và backend theo allowlist cần thiết, CSRF/cookie hoặc bearer token tùy auth đã chốt sau audit.

---

## 11. LUỒNG NGHIỆP VỤ CHUẨN — CÁC TRƯỜNG HỢP CODEX PHẢI TEST

### Flow 1 — Tra một từ chưa lưu

**Given** user đã đăng nhập, nhập `migrate` trên Trang Tra từ  
**When** Backend gọi dictionary provider thành công  
**Then** hiển thị headword, IPA/audio nếu có, POS, **toàn bộ senses được trả về**, example và Word Family nếu có. Chế độ EN mặc định; chọn VI dịch từng sense. Không tự thêm vào Kho từ khi chỉ tra.

### Flow 2 — Lưu một từ vào đúng một bộ

**Given** `migrate` chưa có trong Kho từ và có bộ `IT & DevOps`  
**When** chọn bộ này rồi nhấn Lưu  
**Then** tạo đúng một `saved_word` của user, status `new`, collection là `IT & DevOps`; danh sách Kho từ xuất hiện từ này.

### Flow 3 — Tra lại từ đã lưu

**Given** user đã lưu `migrate` trong `IT & DevOps`  
**When** tra lại `migrate` hoặc tìm qua Extension  
**Then** hiển thị “đã lưu”, collection đang chứa từ và trạng thái hiện tại; không insert duplicate; có note nhắc nhẹ phù hợp trạng thái.

### Flow 4 — Chuyển collection

**Given** `migrate` ở `IT & DevOps`  
**When** chuyển sang `Academic English`  
**Then** update **cùng bản ghi saved word**, không tạo bản sao, lịch sử ôn và trạng thái không bị reset ngoài ý muốn.

### Flow 5 — Một từ nhiều POS

**Given** kết quả tra `run` có entries `verb` và `noun`  
**When** người dùng nhấn tab `noun`  
**Then** chỉ xem nghĩa/ví dụ của `noun`; tab chỉ ghi `noun`, không ghi số nghĩa; không lẫn `verb`.

### Flow 6 — Họ từ không bị gộp nhầm

**Given** response `migrate` có `uros`: `migration` noun, `migrational` adjective  
**When** hiển thị Word Family  
**Then** các từ này nằm trong section riêng; `migrate` vẫn là `verb`; click `migration` tra một mục từ khác, **không** tự lưu `migration`.

### Flow 7 — Ba trạng thái thủ công

**Given** `resilient` status `learning`  
**When** user chủ động chọn `Đã nhớ` sau khi học  
**Then** status = `known`. Nếu chỉ hoàn thành một lượt quiz nhưng không chọn, app không tự coi từ đã nhớ. `due_at` có thể tồn tại nhưng không tạo nhãn chính thứ tư.

### Flow 8 — Không lưu nguồn/URL

**Given** user bôi đen `resilient` trong một website  
**When** extension gửi save request  
**Then** lưu từ và bộ sưu tập (và câu ngữ cảnh nếu tính năng được bật), nhưng **không persist URL, source title, browser tab hay kiểu capture**.

### Flow 9 — Tài khoản cách ly

**Given** User A có collection A, User B có collection B  
**When** A thử save/move word với `collection_id` của B  
**Then** API từ chối và PostgreSQL cũng không chấp nhận cross-user FK. Không lộ từ của B.

### Flow 10 — Dictionary provider lỗi

**When** Merriam-Webster timeout/không có từ/vượt giới hạn  
**Then** app thông báo trạng thái phù hợp; không save định nghĩa rỗng như có thật, không leak API key, vẫn mở được Kho từ cá nhân trong phạm vi dữ liệu có sẵn.

### Flow 11 — Regression V1 → V2

- Các trang/ngữ cảnh học grammar curriculum hoặc vocabulary lessons cũ không còn xuất hiện trong nav và luồng chính.
- Auth và account data không hỏng sau migrate.
- Card Kho từ không có nút `Ôn tập từ này`, edit button lớn, nhãn `Đến hạn ôn` thay nhãn chính.
- Extension popup có nút EN/VI và collection selector **single-select**.

---

## 12. KẾ HOẠCH CHUYỂN ĐỔI THEO MILESTONE — CẦN CÓ AUDIT TRƯỚC

### M0 — Audit & technical design, KHÔNG XÓA CODE

**Đầu ra:**

- Cây thư mục thực tế và tech stack đã được kiểm chứng.
- Danh mục trang, component, API, database tables và chức năng V1.
- Hai module curriculum/grammar cụ thể nằm ở đâu, ảnh hưởng đến auth/progress/quiz thế nào.
- Danh sách source code có thể tái sử dụng.
- SQLite → PostgreSQL migration/rollback plan.
- Gap matrix `Current | Target V2 | File/module | Action | Risk | Priority`.
- Các quyết định còn chưa chốt (provider dịch, quyền lưu dictionary content, review modes chi tiết) được ghi rõ, **không tự giải quyết bằng giả định**.

### M1 — Refactor architecture & database foundation

- Tổ chức lại repo vừa đủ, dựng Modular Monolith.
- PostgreSQL 18 + `pg` + versioned migrations + Compose `frontend/backend/db/migrate`.
- Di chuyển auth và dữ liệu user cần giữ; xác minh backup/rollback.
- Định nghĩa contracts cho dictionary, vocabulary, collections; bỏ dependency runtime vào seeded curriculum.
- Database constraints chống trùng và cross-user.

### M2 — Web V2 core

- Thay nav bằng Trang chủ / Kho từ / Tra từ.
- Kho từ + collections + single collection per word + 3 learning states.
- Dictionary Backend Merriam-Webster parser; UI tra từ EN default / VI toggle; POS tabs và ví dụ.
- Hiện saved state khi tra từ đã lưu; move collection; Word Family.
- Chuyển UI theo dự án MagicPath đã thống nhất ở mức phù hợp.
- Quyền persist nội dung định nghĩa được kiểm soát theo policy, không suy đoán.

### M3 — Review flows & progress

- Tận dụng/cải tiến flashcard/quiz nếu có.
- Nội dung lấy từ **từ người dùng lưu**, không lesson seed.
- Các mode ôn tập được thống nhất và phát triển tuần tự.
- Lưu `review_events`; cập nhật progress và garden hiển thị số liệu thật.
- Nếu triển khai scheduler, tách thuật toán khỏi manual status.

### M4 — Chrome Extension

- Chrome MV3, chọn từ/context-menu + popup tra thủ công.
- EN/VI, từ loại/định nghĩa, IPA/audio và Word Family ở popup.
- Kết nối cùng Backend auth, save vào một collection, chống trùng.
- Test load-unpacked trên website bình thường; fallback trang không cho chọn văn bản.

### M5 — Quality & DevOps portfolio

- Unit tests dictionary parser, service, repository; integration tests với PostgreSQL.
- E2E luồng tra/lưu/chuyển bộ/ôn.
- Docker image riêng frontend/backend; healthchecks, logs, env, migrations, DB backup.
- Sau khi app ổn định mới mở rộng GitLab CI/CD → Harbor → Kubernetes/Helm/GitOps theo lab, **không bắt đầu bằng microservices**.

**Thứ tự có thể điều chỉnh theo code thật, nhưng không được skip M0.**

---

## 13. ĐIỀU KIỆN NGHIỆM THU V2 (DEFINITION OF DONE)

Một bản V2 tối thiểu được coi là đạt nếu:

- [ ] Navigation đúng **Trang chủ / Kho từ / Tra từ**; không còn curriculum cố định/grammar lesson là tính năng chính.
- [ ] Người dùng đăng nhập và chỉ thấy bộ sưu tập/từ của mình.
- [ ] Tra `migrate` qua Backend Merriam-Webster (không lộ key); hiện `verb`, hai nghĩa trong JSON mẫu test, ví dụ, IPA/audio khi có.
- [ ] `run` có các POS riêng nếu response thực tế có; tab chỉ ghi tên POS, không đếm nghĩa.
- [ ] Trang Tra từ render **100% số lượng entries, senses và examples có trong fixture hợp lệ**, đúng thứ tự và quan hệ: kiểm tra số lượng đầu ra đối chiếu input; không được truncate ở 3 hay `shortdef`.
- [ ] Cùng một POS có nhiều entries/homographs thì vẫn xem được đầy đủ, không deduplicate gây mất nghĩa; nhãn `sls`/grammar label đúng vị trí khi có.
- [ ] Với JSON `migrate`: chỉ có tab `verb`; `migration — noun` và `migrational — adjective` chỉ ở Word Family, không phải tab `noun`/`adjective` của `migrate`.
- [ ] Chuyển EN ↔ VI hoạt động theo từng nghĩa, xử lý được khi dịch vụ VI lỗi.
- [ ] Có Word Family đúng từ dẫn xuất; nhấn vào tra tiếp, không tự save.
- [ ] Người dùng lưu từ đúng **một** collection; tra/lưu lại không tạo trùng; có thao tác chuyển collection.
- [ ] Từ đã lưu có đúng ba trạng thái `new/learning/known` và user tự đánh dấu nhớ.
- [ ] Panel từ tối giản: không có nút `Ôn tập từ này`, không có CTA edit lớn, không hiển thị URL/source.
- [ ] Ôn tập nằm **bên trong Kho từ**, dùng từ cá nhân thay vì dữ liệu seed.
- [ ] Extension có hai luồng tra (selection và nhập tay), nút EN/VI, lưu single collection, trạng thái saved.
- [ ] Popup Extension có POS tabs và cho đọc **toàn bộ nghĩa/ví dụ** bằng scroll/expand hoặc đường dẫn rõ tới full dictionary; EN/VI áp dụng cho từng nghĩa và không bị mất lựa chọn khi đổi POS.
- [ ] Danh sách Kho từ gọn như mock đã duyệt; panel chi tiết không có số nghĩa trên tab, không có CTA `Ôn tập từ này` hoặc nút `Chỉnh sửa` to ở cuối.
- [ ] PostgreSQL có constraints quan trọng, migrations chạy nhất quán, dữ liệu không mất sau Compose restart.
- [ ] Có tài liệu vận hành/test và báo cáo migration từ V1.
- [ ] Không hardcode secrets, không commit API key, không persist nội dung dictionary khi chưa có quyền phù hợp.

---

## 14. NHỮNG QUYẾT ĐỊNH KHÔNG CẦN HỎI LẠI

**ĐÃ CHỐT — không yêu cầu chủ dự án xác nhận lại:**

1. Bỏ hai hướng học cố định: **vocabulary curriculum** và **grammar curriculum**.
2. V2 lấy **Kho từ cá nhân + Tra từ + Chrome Extension** làm sản phẩm cốt lõi.
3. Navbar **Trang chủ / Kho từ / Tra từ**; Review nằm trong Kho từ.
4. EN mặc định, VI hỗ trợ theo từng định nghĩa; cùng quy tắc cho web/extension.
5. **Trang Tra từ, panel Kho từ và Extension đều cho đọc toàn bộ nghĩa/ví dụ mà nguồn hợp lệ trả về**, theo tab POS (không cắt ba nghĩa, không chỉ dùng `shortdef`).
6. Word/POS tabs chỉ ghi loại từ, nghĩa+ví dụ thay theo tab.
7. Word Family gồm từ dẫn xuất riêng, không trộn với loại từ của headword.
8. Mỗi saved word của user thuộc **đúng một collection**, có thể chuyển bộ.
9. Chống lưu trùng một từ đối với mỗi user.
10. Ba nhãn ghi nhớ **Chưa học / Đang học / Đã nhớ**, người dùng kiểm soát.
11. Không có nút `Ôn tập từ này` ở panel chi tiết.
12. Không cần lưu nguồn web/URL/YouTube nơi user gặp từ.
13. Merriam-Webster **Learner's Dictionary API** là provider Anh–Anh được ưu tiên.
14. PostgreSQL là DB mục tiêu; backend Node.js/TypeScript Modular Monolith; Docker Compose riêng frontend/backend/db/migrate; sau này DevOps triển khai K8s.

**CHƯA CHỐT / PHẢI NGHIÊN CỨU TRONG TRIỂN KHAI:**

- Chính xác provider dịch EN→VI, ngân sách/latency và quyền lưu bản dịch.
- Quyền lưu lâu dài nội dung định nghĩa/ví dụ Merriam-Webster; nếu chưa có quyền, cần phương án hợp lệ duy trì UX đã chốt.
- Bộ mode ôn tập cụ thể, lịch SRS/FSRS và các chi tiết nâng cao.
- Có giữ ngữ cảnh câu cá nhân hay không ở milestone đầu; **nếu giữ cũng không thêm URL/source**.
- Chính sách xóa collection còn chứa từ và việc chuyển từ trước khi xóa.
- Dữ liệu/mô hình/auth/UI thật trong repo V1 (chỉ biết sau khi Codex audit).

---

## 15. YÊU CẦU TRẢ LỜI ĐẦU TIÊN CỦA CODEX SAU KHI ĐỌC FILE NÀY

**Đề nghị Codex KHÔNG lập tức viết lại web. Hãy:**

1. Tóm tắt lại mục tiêu **V1 → StudyForge V2** bằng lời của Codex trong 1–2 đoạn.
2. Audit repo và chỉ ra **hai chức năng cũ cụ thể đang nằm ở đâu** (màn hình, route, service, SQLite tables/seed).
3. Báo cáo những phần đang hoạt động cần giữ (auth, quiz reusable, profile, progress, frontend components, scripts, tests).
4. So sánh với yêu cầu V2 bằng gap matrix; khoanh vùng dữ liệu cần migrate, nội dung demo có thể deprecate.
5. Đề xuất cấu trúc module/DB/migration + kế hoạch milestone cụ thể với thứ tự file sửa.
6. Liệt kê rủi ro bảo mật/API/giấy phép/dữ liệu và cách xử lý có kiểm soát.
7. Chỉ sau khi có phương án rõ ràng, triển khai tuần tự và test theo từng phần; ghi lại những mục hoàn thành/chưa làm.

**Một câu để Codex nhớ:**

> **Đừng tiếp tục mở rộng bản clone REA như một website giáo trình. Hãy biến codebase hiện tại thành StudyForge V2: công cụ cá nhân để tra từ Anh–Anh (có VI), lưu từ vào một bộ duy nhất, quản lý và ôn từ mình thực sự muốn học, đồng thời có Chrome Extension dùng chung Backend và PostgreSQL.**


---

## 16. PHỤ LỤC KIỂM SOÁT CHẤT LƯỢNG — NHỮNG CHỖ CODEX DỄ LÀM SAI

### 16.1. Ma trận ba bề mặt hiển thị (website và extension)

| Yêu cầu | Trang **Tra từ** | **Kho từ** chi tiết | **Chrome Extension** |
|---|---|---|---|
| Mục đích | Tra mọi từ/cụm từ | Xem từ **đã lưu** | Tra nhanh trên web hoặc nhập tay |
| Định nghĩa | **Toàn bộ senses** API trả về | **Toàn bộ senses** tương ứng khi được phép sử dụng | **Toàn bộ senses**, dùng scroll/expand hoặc link mở bản đầy đủ |
| POS | Tab `verb`, `noun`, `adj`... **không số nghĩa** | Tab POS **không số nghĩa** | Chip/tab POS **không số nghĩa** |
| Ví dụ | Tất cả ví dụ đúng từng sense | Tất cả ví dụ đúng từng sense | Có thể cuộn/thu gọn nhưng truy cập được tất cả |
| EN / VI | **Mặc định EN**; VI dịch từng nghĩa | Định nghĩa EN, VI hỗ trợ nếu sẵn có; giữ bố cục gọn | **Mặc định EN**; VI dịch từng nghĩa |
| Word Family | Mục riêng, các từ click tra tiếp | Không bắt buộc xuất hiện trên panel tối giản | Mục thu gọn, click tra tiếp |
| Bộ sưu tập | Chọn **một** để lưu / hiện bộ đã lưu | Hiển thị **một** bộ | Chọn **một** để lưu / hiện bộ đã lưu |
| Trạng thái | Hiện khi đã lưu, không tự đánh dấu `known` | Hiện **một** nhãn chính | Hiện khi đã lưu |
| Nút ôn ở bản ghi | Không bắt buộc / không thêm CTA rườm rà | **KHÔNG có** `Ôn tập từ này` | **KHÔNG nhồi** chức năng ôn vào popup |
| URL nguồn gặp từ | Không cần lưu | Không hiển thị | Không lưu/capture history |

**Một nguyên tắc UI:** “Gọn” có nghĩa **thông tin được trình bày thông minh**, không có nghĩa tự cắt mất nội dung từ điển. Sự khác nhau giữa ba màn hình nằm ở bố cục, không phải ở số lượng nghĩa thực tế mà hệ thống cho phép đọc.

### 16.2. Acceptance scenarios bổ sung phải tự động hóa

1. **All senses, not first three:** fixture từ có nhiều hơn 3 nghĩa; assert mọi sense đều tồn tại trong response chuẩn hóa và có thể xem trong UI tương ứng.
2. **All examples attached to correct sense:** fixture một nghĩa có nhiều ví dụ; assert không mất ví dụ, không nhầm sense khác và vẫn theo thứ tự.
3. **Multi-POS + multi-entry:** fixture một headword có hai POS và hai entry cùng POS; tab hiển thị đúng nhóm và mọi nghĩa được giữ.
4. **Derivative vs part-of-speech:** fixture `migrate` có `fl=verb` và hai `uros` khác POS; assert đúng một tab `verb`, có Word Family riêng, click dẫn tới tra từ khác.
5. **EN/VI by sense:** hai nghĩa của `run` dịch khác nhau; VI toggle không biến tất cả thành một bản dịch `run` chung; giữ nguyên ví dụ EN.
6. **Tiny popup vs full content:** khi popup quá nhỏ, có scroll/expand hoặc đường dẫn trang đầy đủ, không cố tình giảm response API còn 1–3 nghĩa.
7. **Idempotent save & one collection:** lưu lại cùng từ nhiều lần không sinh duplicate; chuyển collection không reset review history hoặc status.
8. **Manual memory status:** hoàn thành quiz không tự gán `known`, user đánh dấu được cả khi nhớ và khi quên lại.
9. **Sensitive data:** Không URL/tracking nguồn gặp từ, không API key trong frontend/extension/log, không lộ dữ liệu user khác.
10. **Real API limitations:** Khi Learner's thiếu nghĩa kỹ thuật, báo đúng nội dung nguồn cung cấp; không bịa nghĩa để làm test pass.

### 16.3. Hợp đồng dữ liệu và trách nhiệm từng tầng

```text
Merriam-Webster JSON (complex provider-specific format)
             │
             ▼
Backend Dictionary Adapter + MW parser + tests using fixtures
             │
             ▼
Canonical Dictionary DTO (headword + pronunciations
+ entries/POS + ALL senses/examples + usage labels + Word Family)
             │
             ├── Web Dictionary page (all meanings, EN/VI)
             ├── Chrome Extension (same data, compact UI)
             └── Saved-word detail (same dictionary contract + user-owned state)

User-owned data: user + EXACTLY ONE collection + status + review history
Dictionary content: shared by users; persistence controlled by license
```

- Parser trả **structured data**, không phải HTML của Merriam-Webster đưa nguyên tới client.
- Frontend/Extension **không tự parse** `sseq`, `uros`, special markup và không gọi Merriam-Webster bằng key riêng.
- Lookup và save là **hai hành động độc lập**; save không diễn ra chỉ vì user bấm Tra.
- **Không dùng `shortdef` làm nguồn duy nhất** cho dữ liệu được lưu hoặc hiển thị toàn bộ; `shortdef` chỉ có thể dùng làm preview tóm tắt.
- UI không được coi “dịch nghĩa tiếng Việt của một từ” là tương đương “dịch từng định nghĩa của từng sense”.
- **Kho từ không đồng nghĩa dictionary corpus**: một từ có thể đã có trong shared `lexemes` nhưng chưa có `saved_words` của user; không hiển thị là “đã lưu”.

### 16.4. Ranh giới sản phẩm và phạm vi chưa chốt

Những điều đã chốt trong tài liệu này là **yêu cầu sản phẩm**. Chưa chốt provider dịch VI, chi tiết thuật toán SRS, cũng chưa có xác nhận quyền persist nội dung Merriam-Webster. Codex phải **nêu rõ trade-off trước khi triển khai** nhưng không được tự thay yêu cầu **full definitions/POS/Word Family** bằng sản phẩm chỉ có preview 1 nghĩa.

**Tài liệu tham khảo UI duy nhất:** https://www.magicpath.ai/files/464457287898120192

## 17. TÀI LIỆU UI HANDOFF BỔ TRỢ BẮT BUỘC CHO CODEX

- Đọc tiếp file **`StudyForge_V2_UI_Visual_Handoff_for_Codex.md`** để triển khai chính xác màu sắc, bố cục, spacing, typography, header/footer và chi tiết từng màn hình.
- File **này** vẫn ưu tiên cao nhất đối với nghiệp vụ; UI handoff là nguồn chuẩn hóa phần **visual/layout**; MagicPath là tham chiếu mẫu cũ, không tự động đại diện cho tất cả thay đổi V2.
- Nếu không truy cập được link MagicPath, Codex vẫn phải dùng mô tả text trong hai file, tránh tự tưởng tượng bố cục khác.
- Trước khi sửa code, lập bảng đối chiếu screen/component V1 → V2 và chụp ảnh so sánh UI sau triển khai.


---

## Phần II — UI/UX Visual Handoff

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
