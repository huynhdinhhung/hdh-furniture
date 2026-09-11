# GitHub và Docker delivery

Repository dự kiến: `huynhdinhhung/hdh-furniture` (Public). Docker Hub: `hung16`.

## Nhánh

- `main`: bản phát hành ổn định, nhận PR từ `develop` hoặc `hotfix/*` cùng repository.
- `develop`: tích hợp tính năng, nhận PR từ `feature/*`, `hotfix/*` hoặc đồng bộ từ `main`.
- `feature/ten-tinh-nang`: tạo từ `develop`; tên chữ thường, số và dấu gạch ngang.
- `hotfix/ten-loi`: sửa khẩn cấp; sau khi vào `main`, đồng bộ về `develop`.

Ví dụ: `git switch develop`, `git pull --ff-only`, `git switch -c feature/cart-improvements`. Commit, push nhánh feature rồi mở PR vào develop. Khi kiểm tra đạt, merge develop; mở PR develop vào main để phát hành.

## Kiểm tra và phát hành

Workflow `HDH CI-CD` kiểm tra luồng nhánh, lint, TypeScript, unit/integration/E2E trên PostgreSQL riêng, build ứng dụng và hai Docker image. Job `ci-required` chỉ đạt khi mọi kiểm tra bắt buộc thành công. Feature và PR không dùng Docker token và không publish image.

Sau khi CI đạt trên main/develop, publish chạy khi repository variable `ENABLE_DOCKER_PUBLISH=true`. Thiết lập:

| Loại | Tên | Giá trị |
| --- | --- | --- |
| Actions variable | DOCKERHUB_USERNAME | hung16 |
| Actions variable | ENABLE_DOCKER_PUBLISH | true sau khi thêm token |
| Actions secret | DOCKERHUB_TOKEN | Docker Hub access token có quyền ghi hai image |

Nhập token trực tiếp trong GitHub Settings → Secrets and variables → Actions. Không đưa token vào mã nguồn, ảnh chụp hoặc chat. Tạo GitHub environments `staging` (nhánh develop) và `production` (nhánh main), giới hạn deployment branches tương ứng.

Image `hung16/hdh-furniture-api` và `hung16/hdh-furniture-web` có tag main/develop và sha đầy đủ; main còn có latest. Artifact `release-<commit>` chứa `release.env` với **cặp digest** sau khi cả hai image publish thành công. Dùng cặp digest này để triển khai; không lấy một tag đang thay đổi giữa lần publish.

## Bảo vệ nhánh trên GitHub

Áp dụng cho cả main và develop: bắt buộc PR, check `ci-required`, nhánh cập nhật trước khi merge, xử lý hết hội thoại, cấm force push/xóa nhánh và áp dụng cả administrator. Payload mẫu ở `.github/branch-protection.json`; file trong repo không tự bật cấu hình GitHub.

Mẫu yêu cầu một người khác approve PR. Nếu chỉ làm một mình, cấu hình số approval bằng 0 nhưng vẫn giữ PR và CI bắt buộc; tác giả không tự approve PR của mình. Chỉ chọn required check sau khi workflow đã chạy và check xuất hiện.

## Chạy bản release trên máy chủ

Chưa cấu hình máy chủ hoặc tự động deploy lên internet. Pipeline hiện cung cấp image; cần host, HTTPS và thông tin truy cập để bổ sung bước deploy.

Tại thư mục dự án trên host, lưu riêng `.env` chứa DOCKER_DB_PASSWORD, DOCKER_DATABASE_URL (user furniture_app, host db, port 5432, database furniture_db), WEB_ORIGIN (HTTPS), WEB_PORT và cấu hình ngân hàng nếu dùng chuyển khoản. Đặt release.env tải từ một run thành công bên cạnh file Compose. Không commit `.env`.

```sh
docker compose --env-file .env --env-file release.env -p hdh-furniture -f compose.release.yml config --quiet
docker compose --env-file .env --env-file release.env -p hdh-furniture -f compose.release.yml pull
docker compose --env-file .env --env-file release.env -p hdh-furniture -f compose.release.yml up -d --wait
docker compose --env-file .env --env-file release.env -p hdh-furniture -f compose.release.yml ps
```

Compose chờ DB khỏe, chạy migration thành công rồi mới khởi động API và web. PostgreSQL/API không mở port ra host; web bind loopback để reverse proxy HTTPS. Giữ tên project ổn định để dùng đúng volumes. Sao lưu DB và uploads trước migration; không chạy `down -v`. Seed demo và cấp admin là thao tác riêng, không tự chạy mỗi lần phát hành.

Rollback: chọn artifact cũ, kiểm tra schema còn tương thích rồi chạy lại pull/up với cặp digest cũ. Rollback image không tự hoàn tác migration; nếu schema không tương thích phải có kế hoạch khôi phục dữ liệu hoặc bản sửa tiếp theo.

Tham khảo: [Docker GitHub Actions](https://docs.docker.com/build/ci/github-actions/manage-tags-labels/), [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
