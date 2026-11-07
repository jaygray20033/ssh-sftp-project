# Phát triển / Development

## Yêu cầu

Node 22, pnpm 10 (`corepack enable`), Docker.

## Chạy cục bộ

```bash
# 1. PostgreSQL :5432 + sshd thử :2222 (dev/dev)
cd infra/docker
docker compose -f docker-compose.dev.yml up -d

# 2. Backend
cd ../../backend
cp .env.example .env          # giá trị dev hợp lệ sẵn có (khoá/secret chỉ dùng cho dev)
pnpm install
pnpm migration:run            # tạo bảng
pnpm dev                      # http://localhost:8080  (Swagger: /docs, health: /api/v1/health)

# 3. Frontend
cd ../frontend
cp .env.example .env
pnpm install
pnpm dev                      # http://localhost:3000  (proxy /api -> :8080)
```

Thử SSH server dev: `ssh -p 2222 dev@localhost` (mật khẩu `dev`). Chỉ dùng cho phát triển.

> Lần đầu `pnpm install` sẽ sinh `pnpm-lock.yaml` ở `backend/` và `frontend/`: hãy commit hai file này.

## Lệnh hay dùng

| Phần | Lệnh |
| --- | --- |
| Backend | `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build` |
| Migration | `pnpm migration:generate src/databases/migrations/<Tên>`, `pnpm migration:run`, `pnpm migration:revert` |
| Frontend | `pnpm lint`, `pnpm build` |
| Toàn hệ thống | xem [deploy.md](deploy.md) |

## Biến môi trường backend

Xem `backend/.env.example` và `backend/src/common/config/env.ts` (zod). Thêm biến mới ở **cả hai** nơi, và thêm vào `infra/docker/docker-compose.yml` + `infra/docker/.env.example` nếu cần khi chạy bằng Docker.

## Sinh secret

```bash
openssl rand -base64 32    # ENCRYPTION_KEY (đúng 32 byte)
openssl rand -base64 48    # JWT_SECRET, JWT_REFRESH_SECRET, REFRESH_TOKEN_HASH_SECRET, AUTH_TOKEN_HASH_SECRET
openssl rand -hex 24       # POSTGRES_PASSWORD
```
