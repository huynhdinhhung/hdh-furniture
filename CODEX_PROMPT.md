Bạn là kỹ sư full-stack triển khai dự án trong thư mục hiện tại. Đọc AGENTS.md, README.md, docs/requirements.md và docs/implementation-plan.md; đọc database.md/design.md cho phần liên quan.

Mục tiêu: xây website bán nội thất Hưng Furniture tham khảo trải nghiệm nhaxinh.com, giao diện tiếng Việt, responsive. Stack đã chốt: TypeScript, Next.js App Router + Tailwind, Express, PostgreSQL + Prisma, npm workspaces. Vitest/Supertest/Playwright cho kiểm tra phù hợp.

Trong tác vụ này hoàn thành giai đoạn 1–2:
1. Kiểm tra file hiện có, Node/npm và cấu hình; không ghi đè công việc người dùng. Đưa kế hoạch ngắn rồi thực hiện.
2. Scaffold apps/web và apps/api; chọn phiên bản stable tương thích, pin dependency và commit-ready lockfile. Giữ công cụ db:check đang có.
3. Dùng .env ở gốc cho API; không đọc/in secret. Chạy npm run db:check. Nếu thiếu mật khẩu, yêu cầu tôi tự điền .env; tiếp tục phần độc lập khi có thể.
4. Tạo Prisma schema/migration catalog (categories/products/variants/images/collections/banners), ràng buộc giá/tồn kho và seed giả có thể chạy lại. Cấu hình shadow DB đúng version trước migrate dev; không reset database.
5. API /api/v1/categories, /api/v1/products, /api/v1/products/:slug; filter, sort, pagination có giới hạn, validate và lỗi tập trung. Health endpoint không lộ chi tiết hạ tầng.
6. Trang chủ, danh sách và chi tiết lấy dữ liệu API thật; gallery, biến thể, giá VND, stock, responsive, loading/empty/error. Dùng ảnh placeholder hoặc ảnh được phép sử dụng; không nhận là ảnh của thương hiệu tham khảo.
7. Tạo các scripts dev/build/lint/typecheck/test/db:generate/db:migrate/db:seed thật, README hướng dẫn chạy từng terminal Windows. Bổ sung test hành vi filter/validation và integration API với DB test riêng khi có môi trường.
8. Chạy các kiểm tra phù hợp, sửa lỗi trong phạm vi. Nếu không có PostgreSQL kết nối được, ghi rõ migration/integration chưa chạy, không tự dùng SQLite hoặc giả kết quả.
9. Thiết lập cấu hình Docker (tạo Dockerfile cho web, api và docker-compose.yml cho toàn bộ dự án bao gồm DB) và quy trình CI/CD hoàn chỉnh trên GitHub Actions (.github/workflows) để tự động chạy lint, typecheck, và kiểm thử (Unit, Integration) khi có thay đổi mã nguồn.

Quy tắc: giữ stack; không thêm chức năng ngoài giai đoạn; tìm trước khi đọc, không quét cả repo; chỉ nạp skill liên quan. Không tự deploy, push hay reset DB. Auth/giỏ/checkout/admin là giai đoạn sau: không đặt nút giả báo đã thành công. Trả lời tiếng Việt: thay đổi, cách chạy, kiểm tra đã thực hiện và phần còn thiếu. Tiếp tục đến khi giai đoạn hoàn thành hoặc có trở ngại thật cần tôi xử lý.
