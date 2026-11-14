# Triển khai / Deployment

## Docker compose (khuyến nghị)

Toàn bộ cấu hình triển khai nằm trong `infra/`:

```text
infra/docker/   docker-compose.yml, docker-compose.dev.yml, api.Dockerfile, web.Dockerfile, .env.example
infra/nginx/    web.conf (nginx trong container web), host.conf (vhost mẫu cho nginx cài trên VPS)
```

```bash
cd infra/docker
cp .env.example .env     # điền secret (xem comment trong file); CLIENT_ORIGINS = địa chỉ người dùng truy cập
docker compose up -d --build
docker compose logs -f api
```

- `db`: PostgreSQL 17, dữ liệu trong volume `shelldeck-db`.
- `api`: không publish cổng (chỉ `web` truy cập được); tự chạy migration khi khởi động (`AUTO_MIGRATE=true`).
  Toàn bộ `.env` cũng được nạp vào container (`env_file`), nên biến cấu hình riêng của plugin không cần sửa compose.
- `web`: nginx, publish cổng `${WEB_PORT:-80}`; phục vụ SPA và proxy `/api` (kể cả WebSocket).
- Plugin: `plugins/` ở gốc repo được mount read-only vào `/app/plugins` (`PLUGINS_DIR`) — xem [plugin-guide.md](plugin-guide.md).

Mở <http://localhost>. Health: <http://localhost/api/v1/health>.

Dùng Podman: `podman compose` (hoặc `podman-compose`) chạy cùng file; nếu bản cũ không hỗ trợ `condition: service_healthy`, hãy khởi động `db` trước rồi `api`, `web`.

## Chạy sau nginx cài sẵn trên VPS

Khi cổng 80/443 đã có nginx trên host: đặt `WEB_PORT=8081` và `TRUST_PROXY=2` trong `infra/docker/.env`, rồi dùng `infra/nginx/host.conf` làm vhost (đổi `server_name`), `nginx -t && nginx -s reload`. Cấp chứng chỉ bằng certbot.

## HTTPS / WSS

Container `web` chỉ nói HTTP. Trên Internet **bắt buộc** đặt TLS phía trước, đồng thời:

- `COOKIE_SECURE=true`, `CLIENT_URL` và `CLIENT_ORIGINS` là `https://domain`;
- reverse proxy bật WebSocket và timeout đọc dài (đã có trong `host.conf`).

> TODO(I02): kiểm thử terminal ≥ 10 phút qua `wss://` trên VPS thật.

## Kết nối tới máy trong mạng nội bộ

Khi tính năng SSRF guard (B04) được thêm, mặc định ShellDeck từ chối host nội bộ/loopback; self-host trong LAN cần đặt `ALLOW_PRIVATE_HOSTS=true`.

## Sao lưu

Sao lưu **cả** volume PostgreSQL **và** `ENCRYPTION_KEY`. Mất khoá = không giải mã được credential đã lưu.

## Nâng cấp

```bash
git pull && docker compose up -d --build
```
