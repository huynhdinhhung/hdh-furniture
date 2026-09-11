# Tiến độ HDH Furniture — 11/09/2026

## Đã triển khai

- Catalog: danh mục phân cấp, lọc/tìm/sắp xếp/phân trang, gallery/SKU, giá VND chính xác, banner và bộ sưu tập.
- Đăng ký CUSTOMER, đăng nhập/logout, mật khẩu scrypt, session cookie HttpOnly, kiểm tra CSRF/CORS và quyền ADMIN ở API.
- Giỏ khách/tài khoản; thêm/sửa/xóa, kiểm tra tồn kho, gộp giỏ khi đăng nhập, cập nhật số lượng trên biểu tượng giỏ.
- Checkout COD/chuyển khoản thủ công; phí giao cố định cấu hình; coupon theo thời gian, %/VND, tiền hàng tối thiểu, mức giảm tối đa và giới hạn lượt.
- Đơn hàng transaction, khóa tồn kho/coupon, idempotency, đối chiếu tổng tiền trước xác nhận, snapshot lịch sử, chỉ xem đơn của mình; hủy hoàn tồn/coupon đúng một lần. Trạng thái thanh toán độc lập với giao hàng.
- Admin CRUD danh mục/sản phẩm/SKU/ảnh/banner/bộ sưu tập/coupon; quản lý đơn và nhật ký; upload kiểm tra nội dung/MIME/dung lượng, chuyển WebP, lưu ngoài DB.
- Giữ bố cục HDH hiện tại; sửa lỗi mã hóa tiếng Việt, lớp liên kết che ảnh/trang, màn hình giới thiệu chặn bấm và tổng tiền dùng số thực.
- 3 migration đã áp dụng; seed upsert giữ dữ liệu có sẵn; Docker Compose có volume uploads và cấu hình ngân hàng/phí giao.

## Kết quả thực chạy

| Kiểm tra | Kết quả |
|---|---|
| Prisma generate/deploy/seed | Đạt trên preview và DB test |
| npm run lint | Đạt API/web |
| npm run typecheck | Đạt API/web |
| npm test | 24/24 đạt |
| npm run test:integration | 20/20 đạt PostgreSQL thật |
| npm run build | Đạt API/web production; Google Fonts cần truy cập mạng |
| Playwright 360/768/1440 | 15 kịch bản đã đạt: 13/15 ở lần tổng, 2/2 ca catalog chạy lại sau sửa đều đạt |
| docker compose config --quiet | Đạt, không in secret |

Integration bao gồm tranh mua món cuối/tranh lượt coupon cuối, rollback, idempotency, hủy đồng thời, quyền sở hữu đơn, session/logout, CSRF/RBAC, chuyển trạng thái, CRUD và upload giả mạo. Mua hàng và admin đã đạt trên cả ba kích thước. Không mock API để che lỗi. Ảnh/báo cáo trong test-results và playwright-report của bản NTFS.

## Bản chạy và dữ liệu

Bản chạy NTFS:
`C:\Users\Admin\.codex\visualizations\2026\09\10\01a08a76-0659-7d83-984d-7d351e81d1cc\hung-furniture`

Bản lưu nguồn: `E:\skill\furniture-starter\furniture-starter`. Ổ E là FAT32, npm workspaces gặp EISDIR; chạy npm trên bản NTFS. Không đồng bộ node_modules, build, uploads, DB hoặc .env riêng về bản nguồn.

Cluster preview/test ở `.local-postgres/data` trong bản NTFS, 127.0.0.1:55432, user fixture furniture_test_runner; DB furniture_preview / furniture_test_catalog. Do ổ E phát sinh lỗi I/O khiến PostgreSQL dừng, đã sao chép cluster từ E sang C và PostgreSQL phục hồi WAL thành công. Giữ nguyên dữ liệu gốc ở E, không reset/drop DB. Không tác động PostgreSQL người dùng cổng 5432.

Khởi động cluster từ PowerShell ở gốc NTFS, chỉ khi cổng 55432 chưa chạy:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\postgres.exe' -D "$PWD/.local-postgres/data" -h 127.0.0.1 -p 55432
```

Terminal khác ở cùng thư mục:

```powershell
$env:DATABASE_URL='postgresql://furniture_test_runner@127.0.0.1:55432/furniture_preview'
$env:PORT='4000'
$env:API_URL='http://localhost:4000'
npm run dev
```

Web http://localhost:3000; API http://localhost:4000/api/v1/health. Cụm trust chỉ dùng phát triển local.

## Cần cấu hình trước khi kinh doanh

- Đăng ký tài khoản riêng rồi cấp ADMIN theo docs/commerce.md, không có admin mật khẩu mặc định.
- Đặt BANK_NAME/BANK_ACCOUNT/BANK_HOLDER để bật chuyển khoản. SHIPPING_FEE_VND mặc định 50000. Chưa tích hợp cổng thu tiền online; PAID/REFUNDED ghi nhận việc nhận/hoàn tiền thực tế ngoài hệ thống.
- Khôi phục mật khẩu qua email chưa cấu hình; giao diện thông báo rõ. Widget tư vấn là mô phỏng, chưa gửi tin cho nhân viên.
- Thay catalog/ảnh minh họa, bổ sung thông tin cửa hàng, HTTPS, DB có mật khẩu và backup DB/uploads.
- Không đọc/in/ghi đè .env người dùng. Kiểm tra trước đó cho thấy sai thông tin đăng nhập DB chính; các test dùng DB riêng.
- GitHub đã có repository Public `huynhdinhhung/hdh-furniture` và ba nhánh main/develop/feature/ci-cd-pipeline. Run #3 trên main đã đạt toàn bộ CI và publish hai image lên Docker Hub; xem docs/ci-cd.md và docs/releases/2026-09-11.env. Chưa triển khai website lên internet.
- Đã kiểm thử chính hai image release trong stack Docker riêng `hdh-release-check`: migrate/seed thành công, DB/API/web healthy, HTTP catalog/settings và đăng ký/session/phân quyền/logout đạt. Bản thử tại http://localhost:33110; dữ liệu giả riêng, không tác động preview hoặc DB của người dùng.
- Ruleset bảo vệ main/develop đã điền nhưng GitHub chặn lưu bằng bước xác minh lại tài khoản (`Confirm access`). Chưa xác nhận bảo vệ nhánh đã được bật; cần hoàn tất xác minh trong trình duyệt.

