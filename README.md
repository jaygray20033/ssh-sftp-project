# ShellDeck

[![CI](https://github.com/OWNER/shelldeck/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/shelldeck/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Tiếng Việt** · [English](#english)

ShellDeck là ứng dụng web mã nguồn mở để dùng **SSH và SFTP ngay trong trình duyệt**, thay thế cho bộ đôi PuTTY + WinSCP. Bạn tự triển khai (self-host) bằng Docker, lưu danh sách máy chủ của mình, mở nhiều terminal và quản lý file trên cùng một giao diện.

> **Trạng thái:** khung dự án đã có tài khoản (đăng ký, đăng nhập, 2FA, Google tuỳ chọn), quản lý hosts với credential mã hoá, Docker + Nginx, CI. Terminal và SFTP là các tính năng tiếp theo.

## ShellDeck là gì / không là gì

| Là | Không là |
| --- | --- |
| Công cụ SSH/SFTP trên web, tự triển khai, mã nguồn mở (MIT) | Dịch vụ đám mây do chúng tôi vận hành |
| Lưu thông tin đăng nhập máy chủ đã **mã hóa** (AES-256-GCM) | Nơi lưu mật khẩu/khóa của bạn dưới dạng văn bản thường |
| Có nhật ký phiên (ai, máy nào, khi nào) | Công cụ ghi lại nội dung bạn gõ (mặc định không ghi) |

## Tính năng

- [x] Tài khoản: đăng ký, đăng nhập, xác minh email, quên mật khẩu, 2FA, Google OAuth (tuỳ chọn)
- [x] Quản lý máy chủ (hosts): mật khẩu hoặc khóa riêng, mã hóa khi lưu, không bao giờ trả secret qua API
- [ ] Terminal SSH nhiều tab (xterm.js + WebSocket), xác minh host key
- [ ] SFTP: duyệt, tải lên, tải xuống, đổi tên, xóa
- [ ] Nhật ký phiên SSH

## Bắt đầu nhanh (Docker)

Yêu cầu: Docker và Docker Compose v2 (hoặc Podman).

```bash
git clone https://github.com/OWNER/shelldeck.git
cd shelldeck/infra/docker
cp .env.example .env
# Điền các secret trong .env (lệnh sinh nằm trong comment của file)
docker compose up -d --build
```

Mở <http://localhost>. API health: <http://localhost/api/v1/health>. Migration chạy tự động khi `api` khởi động.

## Phát triển

```bash
(cd infra/docker && docker compose -f docker-compose.dev.yml up -d)   # PostgreSQL + SSH server thử (2222, dev/dev)
cd backend  && cp .env.example .env && pnpm install && pnpm migration:run && pnpm dev   # :8080, Swagger /docs
cd frontend && cp .env.example .env && pnpm install && pnpm dev                          # :3000
```

Chi tiết: [docs/development.md](docs/development.md). Đóng góp: [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md).

## Cấu trúc

```text
backend/   Node 22 · Express 5 · TypeORM · PostgreSQL
frontend/  React 19 · Vite · Tailwind 4 · Zustand · TanStack Query
infra/     docker/ (compose, Dockerfile, .env.example) · nginx/ (web.conf, host.conf)
docs/      kiến trúc, triển khai, bảo mật, quyền riêng tư, giấy phép bên thứ ba
.github/   CI, release, issue/PR template, CONTRIBUTING, SECURITY
```

Xem [docs/architecture.md](docs/architecture.md), [docs/deploy.md](docs/deploy.md), [docs/security.md](docs/security.md), [docs/privacy.md](docs/privacy.md).

## Giấy phép

[MIT](LICENSE). Thư viện bên thứ ba: [docs/THIRD_PARTY_LICENSES.md](docs/THIRD_PARTY_LICENSES.md).

---

## English

ShellDeck is an open-source web app for **SSH and SFTP in your browser**, a self-hosted alternative to PuTTY + WinSCP. Save your servers, open several terminals and manage files from one interface.

> **Status:** the skeleton ships accounts (register, login, 2FA, optional Google), host management with encrypted credentials, Docker + Nginx and CI. Terminal and SFTP come next.

### What it is / is not

| Is | Is not |
| --- | --- |
| A self-hosted, open-source (MIT) web SSH/SFTP tool | A cloud service run by us |
| Stores host credentials **encrypted** (AES-256-GCM) | A place that keeps your passwords/keys in plain text |
| Keeps a session log (who, which host, when) | A keystroke recorder (nothing typed is logged by default) |

### Quick start (Docker)

```bash
git clone https://github.com/OWNER/shelldeck.git
cd shelldeck/infra/docker
cp .env.example .env      # fill in the secrets (generation commands are in the file)
docker compose up -d --build
```

Open <http://localhost>. API health: <http://localhost/api/v1/health>.

### Development

See [docs/development.md](docs/development.md) and [CONTRIBUTING](.github/CONTRIBUTING.md).

### License

[MIT](LICENSE). Third-party notices: [docs/THIRD_PARTY_LICENSES.md](docs/THIRD_PARTY_LICENSES.md).
