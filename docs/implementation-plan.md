# Kế hoạch

1. Scaffold npm workspaces, Next.js và Express TypeScript; health API; kết nối PostgreSQL; lệnh lint/typecheck/build/test.
2. Prisma schema catalog + migration + seed lặp an toàn; API danh mục/sản phẩm/filter/pagination; giao diện trang chủ/catalog/detail dùng API thật.
3. Auth session + phân quyền + giỏ; kiểm tra quyền sở hữu tài nguyên.
4. Checkout transaction, idempotency, tồn kho, coupon, lịch sử đơn; test cạnh tranh mua hàng.
5. Admin, banner, collection, upload, audit log.
6. E2E, responsive, lỗi/empty, hướng dẫn chạy và chuẩn bị triển khai.

Prompt khởi đầu yêu cầu giai đoạn 1–2. Người dùng sau đó đã yêu cầu tiếp tục giai đoạn 3–6 trong cùng tác vụ, gồm phân quyền, giỏ hàng, thanh toán, mã giảm giá và quản trị.
Sau mỗi giai đoạn cập nhật tiến độ với việc hoàn thành, lệnh thực chạy và việc còn thiếu.
