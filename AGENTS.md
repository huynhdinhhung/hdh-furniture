# Hướng dẫn Codex

## Mục tiêu và phạm vi
Xây website bán nội thất Hưng Furniture. Tham khảo nhaxinh.com về bố cục và trải nghiệm; sử dụng thương hiệu và nội dung riêng.
Đọc docs/requirements.md và docs/implementation-plan.md khi bắt đầu. Chỉ đọc tài liệu khác khi tác vụ liên quan.

## Stack và cấu trúc mục tiêu
- TypeScript; npm workspaces; apps/web: Next.js App Router + Tailwind; apps/api: Express.
- PostgreSQL + Prisma. apps/api/prisma chứa schema, migrations và seed.
- Vitest cho unit test; Supertest cho API; Playwright cho luồng web quan trọng.
- API chia modules: categories, products, auth, cart, orders, admin. Mỗi module có routes/controller/service/repository theo nhu cầu.
- Controller xử lý HTTP, service xử lý nghiệp vụ, repository truy cập dữ liệu. Không tạo lớp trừu tượng không cần thiết.
- API /api/v1; frontend không truy cập DB trực tiếp. Giá và tồn kho do server quyết định.
- API đọc .env ở gốc bằng đường dẫn rõ ràng; web đọc apps/web/.env.local. Giữ .env.example cập nhật.

## Chất lượng và dữ liệu
Validate đầu vào; xử lý lỗi tập trung; phân trang danh sách. Kiểm tra phiên bản thư viện trước khi dùng API.
Mật khẩu phải được hash, không lưu plaintext. Ưu tiên session cookie HttpOnly, SameSite; Secure ở production; xử lý CSRF và CORS đúng origin.
Không trả passwordHash, token, connection string trong API hoặc log. Không đọc/in .env; kiểm tra sự hiện diện biến mà không in giá trị.
User đăng ký luôn CUSTOMER; phân quyền ADMIN ở server. Không tin role/id/giá do client gửi.
Dùng integer VND lưu Decimal(18,0) trong DB; serialize giá thành chuỗi số. Không dùng float cho tiền.
Đơn hàng lưu snapshot tên, SKU, giá và địa chỉ. Tạo đơn/trừ tồn kho/cập nhật lượt coupon trong transaction có kiểm soát đồng thời.
Không giảm tồn kho xuống âm; yêu cầu idempotency cho tạo đơn; hủy đơn chỉ hoàn tồn một lần.
Không reset/drop database hoặc áp dụng destructive migration khi chưa được cho phép. Giữ nguyên file người dùng; đọc trước khi sửa.
Chỉ dùng fixtures giả; seed có thể chạy lại và không xóa dữ liệu. Không tạo admin mật khẩu cố định.

## Cách làm và tiết kiệm ngữ cảnh
Tìm bằng rg trước khi đọc. Không đọc node_modules, .next, dist, coverage, lockfile toàn bộ hoặc ảnh hàng loạt.
Nạp skill backend khi cần; testing khi cần; không bật nhiều skill trùng chức năng.
Thay đổi theo lát chức năng nhỏ. Không triển khai microservices, Redis, thanh toán online trong giai đoạn 1.
Không tự triển khai lên internet. Không thay stack hoặc thêm dependency nếu chưa có lý do cụ thể.
Unit test kiểm tra hành vi nghiệp vụ/biên/lỗi; mock DB ở unit test. Integration test dùng DB test riêng.
Sau thay đổi chạy kiểm tra phù hợp; báo chính xác lệnh đã chạy, kết quả và phần bị chặn. Không tuyên bố test pass nếu chưa chạy.
Nếu PostgreSQL local không truy cập được, tiếp tục phần độc lập và báo nguyên nhân; không tự thay bằng SQLite.

## Lệnh
Hiện có npm run db:check. Khi scaffold bổ sung dev, build, lint, typecheck, test, test:integration, test:e2e và db:generate/db:migrate/db:seed.
Ghi rõ cwd và biến môi trường cho từng lệnh trong README. Không ghi script giả trả exit 0.
