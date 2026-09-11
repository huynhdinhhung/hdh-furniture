# Yêu cầu phiên bản đầu

## Người dùng
Khách: xem/lọc/tìm sản phẩm, giỏ hàng tạm. CUSTOMER: đặt hàng, xem đơn của mình. ADMIN: quản lý catalog và đơn.

## Catalog
Danh mục phân cấp; tìm tên; lọc danh mục, giá, màu, chất liệu; phân trang, sắp xếp giá và mới nhất.
Trang chi tiết có ảnh, mô tả, kích thước (mm), màu, chất liệu, biến thể SKU, giá và tồn kho.
Ẩn sản phẩm ngừng bán nhưng giữ lịch sử đơn. Filter phản ánh trên URL.

## Tài khoản và giỏ hàng
Email duy nhất, mật khẩu hash, logout hủy session; không cho khách truy cập admin.
Giỏ có variant và số lượng nguyên dương. Đồng bộ giỏ khi đăng nhập theo quy tắc gộp cùng SKU, kiểm tra tồn kho lại.
Giỏ không giữ chỗ tồn kho. Server tính lại giá khi checkout.

## Đặt hàng
Yêu cầu đăng nhập, họ tên, điện thoại, địa chỉ giao hàng. COD hoặc chuyển khoản xác nhận thủ công.
Phí giao MVP: cấu hình cố định, hiển thị trước khi xác nhận; không ngầm tính miễn phí.
Tạo đơn, chi tiết, trừ tồn kho và ghi nhận coupon trong transaction. Hai khách mua món cuối: chỉ một đơn thành công.
Idempotency key duy nhất theo user; cùng key và payload trả lại đơn cũ; payload khác trả conflict.
Coupon gồm thời hạn, giá trị đơn tối thiểu, giới hạn lượt, % hoặc số tiền; cap giảm không vượt tiền hàng.
Trạng thái đơn PENDING → CONFIRMED → SHIPPING → COMPLETED; PENDING/CONFIRMED có thể CANCELLED; không hủy đơn đã giao theo luồng MVP.
Hoàn tồn khi hủy đúng một lần trong transaction. Payment status riêng: UNPAID/PAID/REFUNDED; không suy ra đã trả tiền từ trạng thái đơn.
Không xác nhận chuyển khoản chỉ dựa trên hành động của khách.

## Quản trị
CRUD danh mục, sản phẩm, biến thể, ảnh, banner, bộ sưu tập, coupon; xem đơn và cập nhật trạng thái hợp lệ.
Audit actor/time cho thay đổi giá, tồn kho và đơn. Upload kiểm tra MIME/kích thước; lưu URL/key ảnh, không lưu binary trong bảng.

## Nghiệm thu
Giao diện tiếng Việt, responsive 360/768/1440 px; loading/empty/error rõ ràng.
Unit test tính tổng/giảm giá/validation/chuyển trạng thái; integration test quyền truy cập và transaction tồn kho.
E2E: xem sản phẩm → chọn biến thể → giỏ → đăng nhập → đặt hàng → lịch sử đơn.
Chưa làm: marketplace nhiều người bán, vận chuyển realtime, online payment, wishlist/review, hệ thống nhiều kho.
