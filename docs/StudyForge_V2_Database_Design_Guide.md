# StudyForge V2 — Database Design Specification

**Trạng thái:** Kiến trúc database đề xuất, chưa phải migration SQL được chạy vào dự án hiện tại.  
**Nền tảng:** PostgreSQL (dự kiến PostgreSQL 18), Node.js/TypeScript Backend, dbdiagram.io/DBML.  
**File ERD:** `StudyForge_V2_PostgreSQL.dbml` — dán trực tiếp vào trình soạn thảo tại https://dbdiagram.io/.

## 1. Mục tiêu và những yêu cầu đã chốt

- **Tra từ:** Anh–Anh mặc định; nút EN/VI; nhiều loại từ; mọi nghĩa/ví dụ API thực sự trả về; IPA và phát âm khi có. Trang web và Chrome Extension dùng chung Dictionary API nội bộ.
- **Họ từ:** từ dẫn xuất như `migration` (noun), `migrational` (adjective) được hiển thị riêng, *không* được tính là loại từ của `migrate`.
- **Kho từ:** một người dùng chỉ có **một** bản ghi cho cùng một từ/cụm từ; bản ghi nằm trong **một** bộ sưu tập duy nhất và có thể **chuyển bộ**.
- **Trạng thái học:** đúng ba nhãn `new / learning / known` (Chưa học / Đang học / Đã nhớ). Chỉ người dùng xác nhận tình trạng nhớ; lịch đến hạn ôn là dữ liệu khác.
- **Ôn tập:** thuộc Kho từ; có thể phát triển nhiều chế độ (`flashcard`, `typing`, `multiple_choice`...) mà không tạo nút Ôn tập trong mỗi card.
- **Không thu thập nguồn gặp từ:** không cần URL của website, video YouTube hoặc nhãn nói người dùng lưu bằng Extension hay web. `personal_contexts` là bảng *tùy chọn* chứa **câu** người dùng muốn giữ, không có metadata nguồn.
- **Dịch:** dịch *theo từng nghĩa* (`sense`), không chỉ dịch từ đơn lẻ; giúp `run` trong computing không bị hiểu thành “chạy bộ”.
- **Quyền sử dụng:** quyền gọi Merriam-Webster API **không đồng nghĩa** với quyền lưu vô thời hạn mọi định nghĩa/ví dụ vào DB. Schema *hỗ trợ* lưu nội dung từ điển, nhưng chỉ nên nạp nội dung khi có quyền lưu và dịch phù hợp; nếu chưa có, tra Merriam-Webster theo thời điểm yêu cầu hoặc dùng nguồn được phép lưu. Không nên xây dựa trên giả định “họ không biết”.

## 2. Nghiên cứu/đối chiếu nguồn

| Tham khảo | Điều rút ra áp dụng vào StudyForge |
|---|---|
| [dbdiagram — DBML core docs](https://dbml.dbdiagram.io/docs/) | Định nghĩa `Table`, `Enum`, `indexes`, `checks`, composite foreign key. |
| [PostgreSQL 18 — Constraints](https://www.postgresql.org/docs/18/ddl-constraints.html) | FK và unique constraint được DB enforce, đặc biệt không cho dùng collection thuộc tài khoản khác. |
| [PostgreSQL 18 — Multicolumn Indexes](https://www.postgresql.org/docs/18/indexes-multicolumn.html) | Tối ưu index theo truy vấn thật, không lập index tùy tiện. |
| [Merriam-Webster — Terms](https://dictionaryapi.com/info/terms-of-service) & [Copyright](https://dictionaryapi.com/info/copyright) | Không suy diễn quyền lưu vĩnh viễn bản sao nội dung từ quyền sử dụng API. |
| [VocabSieve](https://github.com/FreeLanguageTools/vocabsieve) | Tra và lưu từ/câu ngữ cảnh ít thao tác, tách hành động tra và lưu. Không sao chép nguyên schema. |
| [LinguaCafe](https://github.com/simjanos-dev/LinguaCafe/wiki/3.-Usage-and-features) | Theo dõi từ vựng, trạng thái và lượt ôn; ôn độc lập với màn hình tra. |
| [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | Lịch ôn dựa vào review history; thuật toán có internal states riêng, không nên trộn với ba nhãn học thủ công. |

*Lưu ý:* các repo được dùng để tham khảo **nguyên tắc nghiệp vụ/kiến trúc**, không tuyên bố StudyForge dùng cùng schema hoặc đã copy code của họ.

## 3. Vì sao chia thành 16 bảng?

### Nhóm tài khoản (3 bảng)

| Bảng | Vai trò |
|---|---|
| `users` | Danh tính người dùng, email normalized, password hash (nếu xác thực bằng mật khẩu). |
| `user_settings` | Ngôn ngữ tra mặc định, mục tiêu ôn/ngày, múi giờ; đúng 1:1 với user. |
| `auth_sessions` | Phiên/token băm ở DB; **tùy chọn** nếu cơ chế xác thực hiện tại cần. |

### Nhóm dữ liệu từ vựng cá nhân (3 bảng)

| Bảng | Vai trò |
|---|---|
| `collections` | Mỗi user có nhiều bộ, tên bộ duy nhất theo user. |
| `saved_words` | Một từ đã lưu thuộc một user và **một** collection; `status` là nhãn thủ công. |
| `personal_contexts` | Các câu ví dụ do user muốn giữ; **tùy chọn**, không lưu URL/YouTube/source. |

### Nhóm từ điển dùng chung (8 bảng)

| Bảng | Vai trò |
|---|---|
| `lexemes` | Danh tính từ/cụm từ chuẩn hóa (`run`, `migrate`, `figure out`); dùng chung giữa các user. |
| `dictionary_sources` | Metadata nguồn **cung cấp định nghĩa** (giấy phép, chính sách lưu), *không phải nguồn user gặp từ*. |
| `dictionary_entries` | Mỗi entry cho một mục từ và loại từ; có thể nhiều entry cùng loại từ do homograph. |
| `dictionary_pronunciations` | IPA và audio token, gắn với entry; có thể nhiều biến thể. |
| `dictionary_senses` | Từng định nghĩa tiếng Anh và nhãn ngữ cảnh, có thứ tự. |
| `sense_examples` | Nhiều câu ví dụ cho một nghĩa. |
| `sense_translations` | Các bản dịch EN→VI của **từng nghĩa**, có nhãn nguồn dịch và thời điểm rà soát. |
| `related_terms` | Họ từ, từ dẫn xuất, dạng biến đổi; không tự động lưu vào Kho từ. |

### Nhóm ôn tập (2 bảng)

| Bảng | Vai trò |
|---|---|
| `review_events` | Nhật ký các lượt học theo chế độ; có thể tính streak, số lượt ôn. |
| `review_schedules` | **Tùy chọn**: lịch ôn/FSRS tách biệt trạng thái ba nhãn; 1:1 với saved word. |

## 4. Các quan hệ cần hiểu chính xác

1. `users 1—N collections` — mỗi user sở hữu nhiều bộ sưu tập.
2. `users 1—N saved_words`, `collections 1—N saved_words` — user lưu nhiều từ, nhưng mỗi **từ đã lưu** có đúng một `collection_id`.
3. `lexemes 1—N saved_words` — một term chuẩn (`migrate`) có thể được nhiều người lưu, không nhân bản nội dung dùng chung.
4. `lexemes 1—N dictionary_entries`, `dictionary_entries 1—N dictionary_senses`, `dictionary_senses 1—N sense_examples`.
5. `dictionary_senses 1—N sense_translations` — bản dịch gắn nghĩa cụ thể, unique `(sense_id, language_code)`.
6. `lexemes 1—N related_terms` — `migration` là từ gợi ý, không làm cho `migrate` biến thành noun.
7. `saved_words 1—N review_events`; `saved_words 1—0/1 review_schedules`.

### Ràng buộc quan trọng: ngăn sai tài khoản ở mức DB

`collections` có unique `(user_id, id)`; `saved_words` dùng FK kết hợp:

```sql
FOREIGN KEY (user_id, collection_id)
REFERENCES collections (user_id, id)
```

Nghĩa là kể cả khi Backend bug hoặc client sửa request, PostgreSQL từ chối gán từ của user A vào collection của user B.

### Ràng buộc chống trùng

- `lexemes`: `UNIQUE(language_code, normalized_term)` — cùng spelling chuẩn trong cùng ngôn ngữ có một lexeme chung.
- `saved_words`: `UNIQUE(user_id, lexeme_id)` — một user không lưu trùng cùng từ trong nhiều collection.
- `collections`: `UNIQUE(user_id, normalized_name)` — tránh `IT & DevOps` và `it & devops` trùng.
- `dictionary_senses`: `UNIQUE(entry_id, display_order)` — từng nghĩa có thứ tự ổn định.
- `sense_examples`: `UNIQUE(sense_id, display_order)`.

`normalized_term` phải do Backend chuẩn hóa nhất quán trước khi insert/upsert, ví dụ `trim` + `lowercase` + gộp khoảng trắng. **Không tự động biến `migrating` thành `migrate`** chỉ vì hai từ có cùng họ; đó là một quyết định lemmatization riêng, cần kiểm thử sau.

## 5. Luồng nghiệp vụ cần chạy bằng transaction

### Khi user lưu từ

1. Frontend/Extension tra cứu Merriam-Webster thông qua Backend; UI hiển thị *toàn bộ* nghĩa được nhà cung cấp trả về (không chỉ `shortdef`).
2. Backend chuẩn hóa headword và `UPSERT` vào `lexemes`.
3. Backend xác thực `collection_id` thuộc user; FK kết hợp bảo vệ lần nữa.
4. Thêm `saved_words` `(user_id, lexeme_id, collection_id, status='new')` bằng `INSERT ... ON CONFLICT (user_id, lexeme_id) DO NOTHING` rồi truy vấn bản ghi hiện có. **Không** tự ý chuyển collection hoặc reset tiến độ học khi lưu lại.
5. Nếu có quyền lưu nội dung định nghĩa, đồng bộ lexical content vào nhóm `dictionary_*` bằng logic nhập chuẩn hóa; nếu không, không ghi nội dung được cấp phép hạn chế vào nhóm này.
6. Commit transaction; lỗi bất kỳ thì rollback. Nếu gọi API ngoài, gọi **trước transaction** để không giữ lock PostgreSQL trong lúc chờ mạng.

### Khi đổi bộ sưu tập

```sql
UPDATE saved_words
SET collection_id = :new_collection_id,
    updated_at = now()
WHERE id = :saved_word_id AND user_id = :current_user_id;
```

Composite FK sẽ chặn việc gán collection của người dùng khác. Khi xóa collection còn chứa từ, dùng `ON DELETE RESTRICT` để buộc người dùng **chuyển hoặc xóa các từ trước**, không xóa mất từ một cách bất ngờ.

### Khi user tự đánh dấu Đã nhớ

```sql
UPDATE saved_words
SET status = 'known', status_changed_at = now(), updated_at = now()
WHERE id = :saved_word_id AND user_id = :current_user_id;
```

Trạng thái này **không được suy ra tự động** từ `review_schedules.due_at` hay điểm quiz. Nếu sau đó user quên từ, có thể chuyển về `learning`.

### Khi ôn tập

Ghi thêm một `review_events` (append-only) cho mỗi lượt học thực tế. Nếu bật SRS, cập nhật `review_schedules` **trong cùng một transaction và cùng PostgreSQL client connection**. Với Node `pg`, không được dùng `pool.query` lẻ trong transaction đã bắt đầu trên client khác.

## 6. Merriam-Webster JSON được ánh xạ ra sao?

Dựa trên payload `migrate` thực tế do người dùng thử nghiệm:

| JSON | Schema/ứng dụng |
|---|---|
| `meta.id` | `dictionary_entries.provider_entry_key` |
| `fl` | `dictionary_entries.part_of_speech` |
| `hwi.prs[].ipa`, `sound.audio` | `dictionary_pronunciations.ipa`, `.audio_token` |
| `def[].sseq` | Bộ parser để duyệt toàn bộ sense (bao gồm phân nhánh nếu có) |
| `sense.dt` có `text` | `dictionary_senses.definition_en` (khi được phép persist) |
| `sense.dt` có `vis` | `sense_examples.example_en` |
| `sense.sls` | `dictionary_senses.usage_labels` |
| `uros[].ure`, `uros[].fl` | `related_terms.related_term`, `.part_of_speech` |
| `shortdef` | Chỉ bản tóm tắt, **không** dùng thay mọi nghĩa |

Merriam-Webster dùng markup `{bc}`, `{it}`, `{dx}` và có cấu trúc `sseq` phức tạp; parser không được ghép thẳng raw strings vào HTML. Với `uros`, `migration` (noun) là *từ khác* với `migrate` (verb), không phải tab noun của cùng headword.

**Quan trọng:** Các bảng `dictionary_entries`/`dictionary_senses` là mô hình lưu **khi được phép**. Nếu dùng Merriam-Webster theo quyền truy cập API hiện tại mà chưa được cấp quyền lưu dài hạn, service có thể đọc và chuẩn hóa response *trong bộ nhớ* để hiển thị, còn PostgreSQL vẫn lưu `lexemes` + `saved_words` + dữ liệu người dùng. Thay bằng nguồn có quyền lưu, hoặc xin thỏa thuận cấp phép, để có tính năng offline/persistent definitions đúng pháp lý.

## 7. Index và hiệu năng

Chỉ tạo index theo các truy vấn chính:

- Kho từ theo bộ: `(user_id, collection_id, saved_at)`.
- Kho từ theo trạng thái: `(user_id, status)`.
- Tìm từ đã lưu: `UNIQUE(user_id, lexeme_id)`.
- Tra đầu mục: `UNIQUE(language_code, normalized_term)`.
- Lấy nghĩa theo entry: `(entry_id, display_order)`.
- Lịch sử theo từ: `(saved_word_id, reviewed_at)`.
- Tìm từ đến hạn theo user: hiện cần join `review_schedules` với `saved_words`; nếu dữ liệu lớn, sẽ xem `EXPLAIN ANALYZE` rồi tối ưu.

Các unique constraints sinh index của PostgreSQL; không tạo index trùng vô ích. Nếu sau này tìm kiếm prefix/full-text mạnh, xem xét thêm `pg_trgm`/GIN sau khi có benchmark thực tế.

## 8. Bảo mật, vận hành và chuyển đổi

- Không đưa API key Merriam-Webster vào DBML, SQL migration, client hoặc repository. Key đã bị chia sẻ trước đây cần xoay vòng nếu được.
- `users.password_hash`: dùng thuật toán mật khẩu phù hợp (Argon2id/bcrypt qua auth service), không dùng plaintext.
- `auth_sessions.token_hash`: hash token trước khi lưu DB; `expires_at`/`revoked_at` cho phép vô hiệu hóa.
- `updated_at` có `DEFAULT now()` chỉ áp dụng lúc **INSERT**. Khi UPDATE, Backend hoặc trigger riêng phải cập nhật; DBML không tự cung cấp trigger.
- Dùng `timestamptz` và thời gian UTC ở DB; hiển thị ngày theo `user_settings.timezone`.
- Dùng PostgreSQL 18 official image và mount persistent volume vào đường dẫn dữ liệu đúng với image/version thực tế; tách one-shot migration container khỏi backend startup.
- Trước khi thay SQLite hiện tại: backup, rà soát schema/users/progress thật, map từng bảng và import trong migration kiểm soát; **không tự reset hay auto-seed dữ liệu**.
- PostgreSQL migration SQL thực tế phải kiểm thử ít nhất: insert duplicate, cross-user collection FK, deletion restrict, rollback lưu từ, cascading user delete (cần cân nhắc chính sách xóa tài khoản).
- DBML chỉ là tài liệu thiết kế; xuất SQL từ dbdiagram xong vẫn phải **review, chạy trên PostgreSQL test và kiểm tra migration** trước khi áp dụng production.

## 9. Phạm vi bản đầu tiên

**Core bắt buộc để làm sản phẩm:** `users`, `user_settings`, `collections`, `lexemes`, `saved_words`, `review_events`, phần Dictionary Adapter/API nội bộ.  
**Lưu lexical content khi được phép:** `dictionary_sources`, `dictionary_entries`, `dictionary_pronunciations`, `dictionary_senses`, `sense_examples`, `sense_translations`, `related_terms`.  
**Tùy chọn / triển khai khi có nhu cầu:** `auth_sessions` (tùy cơ chế auth), `personal_contexts`, `review_schedules` (tùy chiến lược SRS).

Tổng cộng **16 bảng** trong sơ đồ để thể hiện kiến trúc mục tiêu, không có nghĩa bắt buộc tạo đủ 16 bảng trong migration đầu tiên. Tách triển khai thành migrations nhỏ theo từng module là hợp lý.

## 10. Cách sử dụng tại dbdiagram.io

1. Truy cập https://dbdiagram.io/ và tạo diagram mới với PostgreSQL.
2. Mở file `StudyForge_V2_PostgreSQL.dbml` rồi copy **toàn bộ nội dung** vào trình soạn thảo DBML.
3. Xem sơ đồ FK, bảng và chú thích; các khối chia bằng comment thay cho TableGroup để không phụ thuộc tính năng Pro.
4. Lưu diagram trong tài khoản của cậu; dùng Export SQL/PNG/PDF nếu tài khoản cho phép, rồi review bản SQL trước khi dùng.

