# Tài khoản, đặt hàng và quản trị

## Dùng thử

1. Mở `/tai-khoan`, đăng ký email/mật khẩu riêng. Tài khoản mới luôn CUSTOMER.
2. Xem sản phẩm, chọn biến thể và thêm giỏ. Khách chưa đăng nhập có giỏ riêng bằng cookie HttpOnly. Đăng nhập/đăng ký sẽ gộp SKU, giới hạn số lượng theo tồn kho và tối đa 99.
3. Mở `/gio-hang`, điều chỉnh số lượng rồi `/thanh-toan`. Nhập tên, điện thoại, địa chỉ và mã giảm giá nếu có. Bấm **Áp dụng & Kiểm tra** để nhận tổng tiền từ server, sau đó xác nhận.
4. Xem `/don-hang`. Chỉ chủ đơn được xem/hủy đơn của mình. PENDING/CONFIRMED có thể hủy, SHIPPING/COMPLETED không thể hủy trong MVP.

## Cấp quyền quản trị

Sau khi tài khoản đã đăng ký, người quản lý chạy từ gốc dự án với DATABASE_URL đúng DB ứng dụng:

```powershell
npm run admin:promote -- email-da-dang-ky@example.com
```

Thay email mẫu bằng email thực tế đã đăng ký. Lệnh không tạo mật khẩu mặc định, ghi audit và hủy các phiên cũ. Đăng nhập lại rồi mở `/admin`. API kiểm tra ADMIN cho mọi thao tác quản lý, kể cả upload, không chỉ ẩn menu.

Admin quản lý danh mục, sản phẩm, SKU/tồn kho, ảnh, banner, bộ sưu tập, coupon, đơn hàng và nhật ký. Sản phẩm/SKU/banner/coupon được ngừng hoạt động để giữ lịch sử. Danh mục đang được tham chiếu không thể xóa. Ảnh có thể dùng HTTPS hoặc upload JPEG/PNG/WebP tối đa 5 MB; server kiểm tra nội dung, loại metadata, chuyển WebP và lưu ngoài database.

## Khuyến mãi theo dịp

Trong admin → Mã giảm giá → Thêm mới, đặt mã, kiểu %/VND, giá trị, mức đơn tối thiểu, giảm tối đa tùy chọn, thời gian bắt đầu/kết thúc, số lượt tùy chọn và trạng thái hoạt động. Biểu mẫu dùng giờ địa phương của trình duyệt, gửi ISO có múi giờ; DB lưu timestamptz. Mã có hiệu lực từ startsAt đến trước expiresAt, được kiểm tra lại khi tạo đơn. Mã quá hạn/chưa đến hạn/hết lượt không dùng được. Phần trăm làm tròn xuống VND, giảm không vượt tiền hàng. Hủy đơn hoàn lại đúng một lượt.

## Phí giao và thanh toán

- `SHIPPING_FEE_VND`: phí giao cố định, mặc định 50000 VND, hiển thị trước khi xác nhận.
- COD: đặt đơn UNPAID. Admin xác nhận PAID sau khi thực tế đã nhận tiền.
- Chuyển khoản: chỉ bật khi đủ `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER`. Dùng mã đơn làm nội dung; admin xác nhận sau khi đối soát. Không có webhook, thu tiền tự động hay tích hợp VNPay/MoMo/thẻ.
- REFUNDED chỉ ghi nhận sau khi đơn PAID đã hủy và cửa hàng thực tế hoàn tiền. Thay đổi trạng thái trong phần mềm không tự chuyển tiền.
- Web cần `WEB_ORIGIN` đúng origin trình duyệt (mặc định http://localhost:3000), API cùng giá trị. Production dùng HTTPS để cookie Secure hoạt động.

## Tính nhất quán và an toàn

Session/token chỉ lưu SHA-256, mật khẩu scrypt. Cookie HttpOnly/SameSite Lax/Secure ở production; mutations kiểm tra Origin và custom header, có hạn chế số lần đăng nhập. User không được gửi role hoặc tự đặt giá/total. BFF `/api/*` chỉ chuyển tới API nội bộ đã cấu hình.

Checkout dùng transaction và khóa theo thứ tự sản phẩm/SKU/coupon; lấy giá từ DB và lưu snapshot tên, SKU, giá, lựa chọn, địa chỉ. `Idempotency-Key` duy nhất theo user, cùng nội dung và tổng tiền xác nhận trả đơn cũ; khác nội dung trả 409. `X-Expected-Total` buộc người mua kiểm tra lại khi giá/phí/giảm thay đổi. Trừ tồn kho, coupon, tạo đơn, dọn giỏ và audit cùng transaction. Hủy đơn khóa bản ghi, chỉ hoàn tồn một lần. Đơn và trạng thái thanh toán tách biệt.

## Giới hạn phiên bản

Catalog/ảnh là minh họa; thông tin tài khoản ngân hàng thực tế chưa được cung cấp. Khôi phục mật khẩu qua email chưa cấu hình. Widget tư vấn hiện là bản mô phỏng, không gửi tin cho nhân viên. Chưa có vận chuyển realtime, đa kho, review/wishlist, thanh toán online hoặc phát hành internet. Cần HTTPS, DB có mật khẩu và backup DB/uploads trước khi dùng với dữ liệu kinh doanh. Không dùng cụm DB trust local để phục vụ internet.
