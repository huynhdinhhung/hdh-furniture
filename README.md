# HDH Furniture

Website nội thất tiếng Việt: catalog, tài khoản CUSTOMER/ADMIN, giỏ hàng khách và tài khoản, checkout COD/chuyển khoản thủ công, coupon theo thời gian, lịch sử đơn và quản trị. Dữ liệu/ảnh hiện là mẫu. Thương hiệu giao diện hiện tại: HDH Furniture; tên workspace kỹ thuật vẫn là @hung/api và @hung/web.

## Công nghệ

npm workspaces; Next.js 16 + React 19 + Tailwind 4; Express 5; Prisma 7.10 + adapter PostgreSQL; TypeScript. Mọi dependency trực tiếp được pin, dùng package-lock.json với npm ci. Node 24 LTS được dùng trong Docker/CI; yêu cầu tối thiểu Node 22.12.

## Chạy trên Windows

**Dùng ổ NTFS khi chạy npm workspaces.** Ổ E: của máy hiện tại là FAT32, không hỗ trợ junction/symlink cần thiết; `npm install` tại đó thất bại với EISDIR. Không format ổ hay thay stack: sao chép mã nguồn (bỏ node_modules) sang ổ NTFS trước khi cài.

Bản đã cài và kiểm thử trên máy này nằm tại `C:\Users\Admin\.codex\visualizations\2026\09\10\01a08a76-0659-7d83-984d-7d351e81d1cc\hung-furniture`. Mã nguồn và lockfile cũng được đồng bộ về `E:\skill\furniture-starter\furniture-starter` để lưu trữ. `.env` riêng của bạn không được đồng bộ/ghi đè.

Các lệnh bên dưới đều có cwd là thư mục gốc dự án **trên ổ NTFS**; có thể sao chép sang thư mục NTFS ngắn hơn nếu muốn.

1. Chạy `npm ci` rồi `npm run db:generate`.
2. Nếu chưa có `.env`, sao chép `.env.example` thành `.env`. Tự nhập thông tin PostgreSQL; không chia sẻ mật khẩu/log chứa URL. Nếu đã có `.env`, giữ file và bổ sung các khóa còn thiếu theo mẫu.
3. Trong pgAdmin tạo database ứng dụng `furniture_db` và cấp quyền cho `furniture_app` theo `docs/database-setup.md`. Đặt `PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD` và `DATABASE_URL` cho cùng database/tài khoản. Password trong URL phải URL-encode.
4. Chạy `npm run db:check`. Script này kiểm tra các biến PG*. Prisma/API dùng DATABASE_URL; cần cấu hình cả hai nhất quán.
5. Chạy `npm run db:deploy` để áp dụng migration đã kiểm tra, sau đó `npm run db:seed`. Seed thêm fixture còn thiếu, không xóa hoặc ghi đè bản ghi hiện có.
6. Sao chép `apps/web/.env.local.example` thành `apps/web/.env.local` nếu chưa có. Đặt `API_URL=http://localhost:4000`.

Terminal 1: `npm run dev -w @hung/api` → API http://localhost:4000.

Terminal 2: `npm run dev -w @hung/web` → web http://localhost:3000.

Hoặc chạy đồng thời bằng `npm run dev`. `Ctrl+C` dừng các tiến trình do lệnh này mở.

API nạp `.env` gốc theo đường dẫn tuyệt đối tính từ module, không phụ thuộc cwd. Biến môi trường đã đặt ở process được ưu tiên. Web chỉ đọc `.env.local` trong apps/web; API_URL là biến server, không đưa connection string DB ra trình duyệt. Trang dùng API thật; lỗi DB/API hiển thị trạng thái lỗi, không thay bằng catalog giả trong frontend.

## Schema và migration

Catalog gồm Category (cây), Product, ProductVariant, ProductImage, Collection, CollectionProduct, Banner. UUID, timestamptz, Decimal(18,0); API serialize giá thành chuỗi, UI dùng BigInt/Intl. Giá/stock không âm; kích thước dương. FK kép bảo đảm ảnh/variant cùng product. Trigger chống chu trình danh mục.

- `npm run db:generate`: sinh Prisma client.
- `npm run db:deploy`: áp dụng migration có sẵn, không yêu cầu shadow DB.
- Khi thay schema: tạo database rỗng riêng `furniture_shadow`, cấp quyền sở hữu và đặt SHADOW_DATABASE_URL; chạy `npm run db:migrate -- --name ten_thay_doi`.
- Wrapper từ chối shadow trùng database chính. Prisma có thể xóa/tạo lại nội dung shadow trong migrate dev; chỉ dùng DB dành riêng cho shadow. Nếu Prisma đề nghị reset vì drift, dừng và xử lý migration, không chấp nhận reset DB chứa dữ liệu.
- `npm run db:seed`: chạy fixture minh họa, không tạo admin và không có mật khẩu mặc định.

Prisma 7 dùng datasource URL/shadowDatabaseUrl trong `apps/api/prisma.config.ts` và `PrismaPg` ở runtime. Không dùng cấu hình datasource URL của Prisma 6.

## API

- `GET /api/v1/health`: liveness, chỉ trả status; không xác nhận DB readiness.
- `GET /api/v1/categories?page=1&limit=48`: danh mục phân trang (tối đa 100).
- `GET /api/v1/products`: `q`, `category` (slug, gồm danh mục con), `collection`, `color`, `material`, `minPrice`, `maxPrice`, `sort=newest|price_asc|price_desc`, `page`, `limit` (mặc định 12, tối đa 48).
- `GET /api/v1/products/:slug`: sản phẩm đang bán và các biến thể active.
- `GET /api/v1/home`: tối đa 3 banner active và 6 bộ sưu tập cho trang chủ.

Các điều kiện màu/chất liệu/giá áp dụng trên cùng biến thể active. Sắp xếp theo giá thấp nhất của các biến thể khớp, rồi ID để ổn định phân trang. `matchingPrice` là giá từ của kết quả lọc; trang chi tiết hiển thị giá của lựa chọn hiện tại. Dùng truy vấn có tham số và transaction RepeatableRead cho dữ liệu + tổng số. 400 cho input sai, 404 cho không tồn tại/ngừng bán, 503 khi lỗi dữ liệu; không trả lỗi SQL hoặc secret.

## Kiểm tra

- `npm run lint`
- `npm run typecheck`
- `npm test`: Vitest/Supertest với mock DB, không cần PostgreSQL.
- `npm run build`: biên dịch API và build production web; không cần DB khi build.
- `npm run test:integration`: cần TEST_DATABASE_URL trỏ DB riêng có tên `furniture_test` hoặc `furniture_test_*`, khác DB ứng dụng. Wrapper chạy migrate deploy rồi test API với PostgreSQL thật. Test chỉ xóa các fixture theo ID đã tạo trong lần chạy.
- `npm run test:e2e`: DATABASE_URL phải trỏ tới DB riêng tên furniture_test_* đã migrate/seed. Cài browser bằng `npx playwright install chromium`. Playwright kiểm tra catalog, giỏ → đăng ký → coupon → COD → lịch sử → hủy đơn, và admin sửa tồn kho/coupon/audit ở 360/768/1440 px. Chạy server riêng qua E2E_BASE_URL=http://localhost:3001 và E2E_API_URL=http://localhost:4001 để không dùng nhầm server preview. Không trỏ test vào DB kinh doanh.

Xem `docs/progress.md` để biết chính xác các lệnh đã chạy và giới hạn môi trường.

## Docker

Docker Desktop phải chạy Linux containers. Tự đặt DOCKER_DB_PASSWORD và DOCKER_DATABASE_URL trong .env; URL dùng host `db`, port 5432, user `furniture_app`, DB `furniture_db` và đúng mật khẩu đã URL-encode. Không dùng DATABASE_URL localhost của máy host bên trong container.

- `docker compose up --build -d`: DB → migration một lần → API → web.
- `docker compose run --rm api npm run db:seed`: thêm catalog mẫu.
- Mở http://localhost:3000. PostgreSQL container chỉ bind 127.0.0.1:5433 để tránh đụng DB local 5432.
- `docker compose down`: dừng container, giữ volume. Không dùng `down -v` với dữ liệu cần giữ.

Dockerfile dùng build nhiều giai đoạn, tiến trình chạy user node. API image giữ Prisma CLI/tsx để phục vụ migration/seed; chưa tối giản toàn bộ dev dependencies. Đây là lựa chọn có chủ đích cho bản đầu.

## CI và chuẩn bị phát hành

GitHub Actions chạy lint/typecheck/unit/integration PostgreSQL 18/build/E2E, sau đó build hai container trên push main/dev/feature và PR. Upload báo cáo Playwright khi lỗi. Bật branch protection yêu cầu job quality + containers trong GitHub trước merge; cấu hình repo này cần chủ repo thực hiện. Workflow không tự push, publish image hay deploy do phạm vi yêu cầu chỉ chuẩn bị local. Chưa có đích hosting/registry và credentials cho bước phát hành CD.

## Tài liệu

- `AGENTS.md`, `CODEX_PROMPT.md`: phạm vi/quy tắc.
- `docs/requirements.md`, `docs/implementation-plan.md`: đặc tả toàn dự án.
- `docs/database.md`, `docs/database-setup.md`: thiết kế/kết nối.
- `docs/design.md`, `docs/asset-sources.md`: giao diện/nguồn ảnh.
- `docs/progress.md`: nghiệm thu và phần còn thiếu.
- `docs/commerce.md`: dùng giỏ/checkout, cấp quyền ADMIN, coupon theo dịp, cấu hình phí giao và ngân hàng.

Tham khảo API framework: https://nextjs.org/docs/app/getting-started/installation và https://www.prisma.io/docs/orm/reference/prisma-config-reference. Ảnh Pexels: xem trang `/nguon-anh`.
