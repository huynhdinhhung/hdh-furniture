# GitHub và Docker delivery

Repository: [huynhdinhhung/hdh-furniture](https://github.com/huynhdinhhung/hdh-furniture) (Public). Docker Hub: `hung16`.

## Release đã xác minh — 11/09/2026

[Run #3](https://github.com/huynhdinhhung/hdh-furniture/actions/runs/34609212671) trên `main` đã đạt branch-policy, quality, containers, ci-required và publish. Quality gồm lint/typecheck, 24 unit test, 20 integration test, build và E2E. Hai image đã xuất bản với tag `main`, `latest` và `sha-658cd566180b58f9b592b64ad4c484c89944cadc`.

Cặp digest từ summary/artifact của run được lưu ở [releases/2026-09-11.env](releases/2026-09-11.env); đây là định danh image công khai, không chứa thông tin đăng nhập. Dùng file này làm `release.env` theo hướng dẫn bên dưới. `DOCKERHUB_TOKEN` được lưu trong GitHub Actions Secrets; `DOCKERHUB_USERNAME=hung16` và `ENABLE_DOCKER_PUBLISH=true` đã cấu hình trên repository. Environment `production` chỉ cho nhánh `main`.

Đã pull chính cặp digest này và chạy Compose release trên stack thử riêng `hdh-release-check`, cổng loopback 33110, database/volumes mới. Migration hoàn tất, PostgreSQL/API/web healthy; seed catalog thành công. Smoke test thực đạt: trang chủ/catalog, health/products/settings trả 200, catalog có dữ liệu; khách bị chặn admin (401), CUSTOMER bị chặn admin (403), đăng ký tạo session HttpOnly/Secure, session trả đúng tài khoản và logout vô hiệu hóa session. Chỉ seed dữ liệu giả trong stack thử; không thay dữ liệu người dùng. Đây là kiểm thử local qua HTTP; production vẫn cần reverse proxy HTTPS.

Bảo vệ nhánh chưa lưu được: đã chuẩn bị ruleset Active `Protect main and develop`, không có bypass, yêu cầu PR/check `ci-required` từ GitHub Actions, nhánh cập nhật, giải quyết hội thoại, cấm force push/xóa; approvals = 0. GitHub yêu cầu xác minh lại tài khoản ở hộp `Confirm access` khi bấm Create. Cho đến khi người dùng xác minh và lưu thành công, không coi main/develop đã được bảo vệ. Payload classic tương đương có ở `.github/branch-protection.json`.

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

Mẫu dành cho dự án cá nhân: số approval bằng 0 nhưng vẫn giữ PR và CI bắt buộc. Khi có cộng tác viên, tăng lên 1 để yêu cầu người khác duyệt; tác giả không tự approve PR của mình. Chỉ chọn required check sau khi workflow đã chạy và check xuất hiện.

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
