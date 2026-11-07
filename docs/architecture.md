# Kiến trúc / Architecture

## Tổng quan

```text
 Trình duyệt (React, xterm.js)
        │  HTTPS / WSS
        ▼
 Nginx (container `web`)  ── phục vụ SPA, proxy /api và WebSocket
        │  HTTP (mạng nội bộ compose)
        ▼
 API (container `api`, Node + Express)
   ├── PostgreSQL (container `db`): người dùng, host (đã mã hóa), nhật ký phiên
   └── SSH/SFTP (ssh2) ───────────▶ Máy chủ đích của người dùng
```

- Chỉ `web` mở cổng ra ngoài; `api` và `db` nằm trong mạng nội bộ của compose.
- Backend được tổ chức theo module (`route → controller → service → repository`), xem `backend/src/modules/` (hiện có: `auth`, `user`, `hosts`, `health`).
- Frontend theo trang (`index.tsx`, `store.ts` cho state UI, `hooks.ts` cho TanStack Query).

## Luồng terminal (kế hoạch, task B05–B06, F04)

1. Client gọi `POST /terminal/tickets {hostId}` (Bearer) → nhận ticket một lần, TTL 30 giây.
2. Client mở `wss://.../api/v1/terminal/ws?ticket=...` (JWT không bao giờ đặt lên URL).
3. API kiểm tra ticket, `Origin`, quyền sở hữu host; giải mã credential trong bộ nhớ; xác minh host key; mở `ssh2` shell.
4. Dữ liệu hai chiều theo giao thức JSON (`input`, `resize`, `data`, `closed`...).

## English summary

Browser → Nginx (SPA + reverse proxy, WebSocket aware) → API → PostgreSQL and target SSH servers. Only `web` is published; `api` and `db` stay on the internal compose network. Terminal sessions are authenticated with a short-lived, single-use WebSocket ticket; credentials are decrypted in memory right before connecting.
