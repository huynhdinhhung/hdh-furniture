# Thiết kế PostgreSQL mục tiêu

Đây là schema thiết kế, Codex phải chuyển thành Prisma schema và migration được kiểm tra; chưa có bảng ứng dụng trong gói này.
PK UUID; thời gian timestamptz UTC; giá VND Decimal(18,0); quantity integer; tên và nội dung tiếng Việt UTF-8.

| Bảng | Trường chính và quan hệ |
|---|---|
| users | id, email unique, password_hash, full_name, role CUSTOMER/ADMIN, created_at |
| sessions | id, token_hash unique, user_id FK, expires_at; chỉ lưu hash token |
| categories | id, parent_id FK nullable, name, slug unique |
| products | id, category_id FK, name, slug unique, description, is_active |
| product_variants | id, product_id FK, sku unique, color, material, width_mm, depth_mm, height_mm, price, stock, is_active |
| product_images | id, product_id FK, variant_id FK nullable, url, alt, sort_order |
| collections | id, name, slug unique, description, image_url |
| collection_products | collection_id + product_id composite PK |
| banners | id, title, image_url, target_url, sort_order, is_active |
| carts | id, user_id FK unique |
| cart_items | id, cart_id FK, variant_id FK, quantity; unique(cart_id, variant_id) |
| coupons | id, code unique, kind PERCENT/FIXED, value, max_discount nullable, min_subtotal, starts_at, expires_at, usage_limit nullable, used_count |
| orders | id, order_number unique, user_id FK, status, payment_method, payment_status, subtotal, discount, shipping_fee, total, coupon_id nullable, shipping_snapshot JSONB, idempotency_key, request_hash, created_at; unique(user_id,idempotency_key) |
| order_items | id, order_id FK, variant_id FK, product_name_snapshot, sku_snapshot, options_snapshot JSONB, unit_price, quantity, line_total |
| inventory_movements | id, variant_id FK, order_id nullable, delta, reason, actor_id nullable, created_at; chống ghi hoàn tồn lặp |
| audit_logs | id, actor_id FK nullable, entity_type, entity_id, action, safe_metadata JSONB, created_at |

## Ràng buộc
CHECK quantity > 0; stock >= 0; price >= 0; money >= 0; coupon percent trong (0,100].
Quan hệ ảnh/variant phải thuộc đúng product. Category parent không được tạo chu trình.
Không cascade xóa lịch sử đơn khi xóa product/user. Ưu tiên ngừng bán/ẩn thay vì xóa product có đơn.
Index FK và orders(user_id,created_at), orders(status,created_at), products(category_id,is_active).

## Transaction checkout
Đọc biến thể hợp lệ, lấy giá DB; tính coupon và phí giao; cập nhật tồn bằng điều kiện stock >= quantity hoặc khóa dòng.
Cập nhật SKU theo thứ tự cố định để giảm deadlock; nếu một món thất bại rollback toàn bộ.
Atomic coupon usage; lưu order và snapshots cùng transaction; unique key bảo vệ retry.
Hủy đơn dùng conditional state transition và cùng transaction hoàn tồn, hoàn lượt coupon theo chính sách MVP.
Test với PostgreSQL thật ở DB test riêng, không chỉ mock transaction.

## Prisma
Chọn phiên bản Prisma tương thích Node đang dùng, pin CLI/client/adapter tương ứng và commit lockfile.
Đọc tài liệu theo version; cấu hình prisma.config.ts, generator, adapter nếu phiên bản yêu cầu.
Không sao chép cấu hình Prisma cũ vào phiên bản mới. migrate dev cần quyền tạo shadow DB hoặc shadow DB riêng được cấu hình.
