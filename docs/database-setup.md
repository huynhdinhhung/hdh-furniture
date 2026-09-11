# Kết nối PostgreSQL trên Windows

## Hiểu màn hình hiện tại
Ảnh cho thấy pgAdmin đang mở server PostgreSQL 18 và database mặc định postgres. pgAdmin là công cụ quản lý; ứng dụng Node kết nối PostgreSQL server, không kết nối mục AI của pgAdmin. Để AI Provider None/Disabled là được.

## 1. Xác nhận địa chỉ server
Đóng tab Preferences. Chuột phải PostgreSQL 18 → Properties → Connection, xem Host và Port; thường localhost/5432. Dùng thông số thật nếu khác.
Các bước sau giả định PostgreSQL cùng máy Windows. Nếu đó là server khác, 127.0.0.1 không đúng.

## 2. Tạo user riêng
Chuột phải Login/Group Roles → Create → Login/Group Role.
General: Name furniture_app.
Definition: nhập mật khẩu mạnh và lưu riêng trên máy.
Privileges: Can login = Yes; Superuser = No; Create databases = No. Save.
Không cần đưa mật khẩu vào chat. Tài khoản quản trị hiện tại cần có quyền tạo role/database.

## 3. Tạo database
Chuột phải Databases → Create → Database.
Database furniture_db; Owner furniture_app; Encoding UTF8; Save.
Chưa tạo bảng thủ công. Codex sẽ tạo schema bằng migration.
Để kiểm tra trong Query Tool của furniture_db chạy:
```sql
SELECT current_database(), current_user, version();
```
Lưu ý current_user ở đây là user kết nối của pgAdmin, không nhất thiết furniture_app.

## 4. Mở bộ file và nhập cấu hình
Giải nén vào ví dụ C:\Projects\furniture-starter, mở thư mục bằng VS Code.
Mở PowerShell tại đúng thư mục có package.json:
```powershell
node -v
npm -v
Copy-Item .env.example .env
npm install
```
Chỉ chạy Copy-Item nếu chưa có .env để không đè cấu hình cũ. Node cần >=22.12.
Nếu PowerShell chặn npm.ps1, dùng npm.cmd install và npm.cmd run db:check.
Mở .env bằng editor, chỉnh PGHOST/PGPORT theo pgAdmin, PGDATABASE=furniture_db, PGUSER=furniture_app, PGPASSWORD= mật khẩu vừa tạo.
Nếu mật khẩu có # hoặc khoảng trắng, đặt giá trị PGPASSWORD trong dấu ngoặc kép. DATABASE_URL cần percent-encode ký tự dành riêng trong mật khẩu, ví dụ @ thành %40, # thành %23, : thành %3A, / thành %2F, % thành %25. Không encode toàn bộ URL. Không dùng website bên ngoài để xử lý mật khẩu.
Hai chỗ mật khẩu phải cùng tài khoản: PGPASSWORD dùng bản gốc; DATABASE_URL dùng bản URL-encoded.

## 5. Kiểm tra từ Node
```powershell
npm run db:check
```
Script dùng PG* trong .env, chỉ SELECT, không tạo/xóa dữ liệu. Thành công phải hiện database furniture_db và user furniture_app.
Sau đó dán CODEX_PROMPT.md vào Codex chạy local. Codex sẽ cấu hình Prisma dùng DATABASE_URL và tạo migration.

## 6. Prisma shadow database
migrate dev cần shadow database. Không cấp superuser cho ứng dụng.
Cách khuyến nghị: admin tạo database furniture_shadow (owner furniture_app) qua pgAdmin; Codex thêm SHADOW_DATABASE_URL và cấu hình theo phiên bản Prisma.
Shadow database phải KHÁC furniture_db và chỉ chứa dữ liệu bỏ được vì Prisma reset shadow trong quy trình migration.
Production dùng migrate deploy và quyền phù hợp; không dùng migrate dev/reset trên dữ liệu thật.

## 7. Những lỗi thường gặp
| Lỗi | Cách kiểm tra |
|---|---|
| ECONNREFUSED | Xem PostgreSQL service đang chạy, host/port đúng; services.msc trên Windows |
| 28P01 | Sai username/password; sửa .env, kiểm tra Can login của role |
| 3D000 | Database chưa tạo hoặc sai tên |
| 42501 | Quyền chưa đúng; xem owner database/schema; không giải quyết bằng cấp superuser |
| pg module missing | Chạy npm install tại thư mục package.json |
| .env missing | Tạo .env từ mẫu, kiểm tra không thành .env.txt |
| db:check pass nhưng Prisma lỗi | Kiểm tra DATABASE_URL có cùng credentials, encode password, Prisma config/shadow DB |

## Codex và localhost
Nếu Codex chạy trên cùng Windows, Node script có thể truy cập PostgreSQL local. Nếu Codex chạy trong cloud/container/WSL, localhost là môi trường đó, không tự trỏ tới Windows của bạn. Dùng Codex local cho hướng dẫn này; không mở port PostgreSQL ra internet chỉ để giải quyết kết nối.

## Nguồn
https://www.pgadmin.org/docs/pgadmin4/latest/database_dialog.html
https://node-postgres.com/features/connecting
https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database
