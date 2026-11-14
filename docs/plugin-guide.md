# Hệ thống plugin / Plugin guide

## Tiếng Việt

Plugin ShellDeck là một thư mục JavaScript thường (CommonJS) đặt trong `PLUGINS_DIR`, được API nạp lúc khởi động.
Plugin chạy **trong cùng tiến trình với server**, vì vậy nó có toàn quyền như server: chỉ cài plugin bạn tin tưởng,
và chỉ plugin do chính bạn viết khi tự host.

### Bật plugin

| Cách chạy | Cấu hình |
| --- | --- |
| Backend cục bộ (`pnpm dev`) | `PLUGINS_DIR=../plugins` trong `backend/.env` (mẫu đã để sẵn trong `backend/.env.example`) |
| Docker | compose trong `infra/docker/` mount thư mục `plugins/` của repo vào `/app/plugins` (read-only) và đặt `PLUGINS_DIR=/app/plugins` |

Không có thư mục plugin, hoặc thư mục rỗng: server chỉ ghi log và chạy tiếp như thường.

### Cấu trúc một plugin

```text
plugins/
└── example-webhook/
    ├── shelldeck-plugin.json
    └── index.js
```

`shelldeck-plugin.json`:

| Trường | Ý nghĩa |
| --- | --- |
| `name` | Tên định danh, chữ thường (`^[a-z0-9][a-z0-9._-]{0,63}$`), dùng làm đường dẫn route |
| `version` | Chuỗi tự do, chỉ để hiển thị trong log |
| `main` | Đường dẫn tương đối tới file `.js` **bên trong** thư mục plugin (không được đi ra ngoài bằng `..`) |
| `hooks` | Mảng tên hook plugin này cung cấp; hook không khai báo sẽ không được gọi |

### Hook

| Hook | Khi nào | `ctx` |
| --- | --- | --- |
| `onSessionStart(ctx)` | Một phiên terminal mở thành công (đã có bản ghi audit) | `userId`, `sessionId`, `hostLabel`, `startedAt` (ISO) |
| `onSessionEnd(ctx)` | Phiên kết thúc — client ngắt, idle timeout, lỗi SSH, server tắt | `userId`, `sessionId`, `hostLabel`, `endedAt` (ISO), `reason` |
| `registerRoutes(router)` | Lúc khởi động, trước khi server lắng nghe cổng | Express `Router` riêng của plugin |

`ctx` chỉ gồm đúng các trường ở bảng trên. Server lọc theo danh sách cho phép rồi `Object.freeze` object, nên plugin
**không bao giờ** nhận được mật khẩu, private key, passphrase, cookie, token hay nội dung gõ trong terminal, và không
sửa được dữ liệu mà plugin khác nhìn thấy.

Route của plugin được mount tại `/api/v1/plugins/<name>/...` và **đòi hỏi đã đăng nhập** (JWT + cookie như các API khác).
Muốn route công khai thì plugin phải tự bố trí qua reverse proxy — chủ đích không làm vậy để tránh lộ dữ liệu.

### Plugin lỗi thì sao?

Mọi bước đều bọc `try/catch` và ghi log `pino`, không bao giờ làm sập server:

| Lỗi | Kết quả |
| --- | --- |
| Thiếu `shelldeck-plugin.json` | Bỏ qua thư mục |
| Manifest sai / `main` trỏ ra ngoài thư mục | `Plugin failed to load`, bỏ qua plugin |
| File `main` throw khi nạp | `Plugin failed to load`, bỏ qua plugin |
| Hook khai báo trong manifest nhưng không export | `Hook declared in manifest but not exported`, bỏ hook |
| Hook throw / trả về promise reject | `Plugin hook failed`, các plugin khác vẫn chạy |
| `registerRoutes` throw | `Plugin route registration failed`, route plugin đó không được mount |

Hook chạy ở chế độ "gửi và không chờ": một plugin treo cũng không chặn được việc mở/đóng terminal.
Vì hook không được `await`, plugin nên tự đặt timeout cho thao tác mạng (xem `AbortSignal.timeout` trong plugin mẫu).

### Plugin mẫu

`plugins/example-webhook` gửi POST tới `EXAMPLE_WEBHOOK_URL` mỗi khi phiên bắt đầu/kết thúc và lưu 50 sự kiện gần nhất,
xem qua `GET /api/v1/plugins/example-webhook/events` (kèm `webhookConfigured`).

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/plugins/example-webhook/events
```

Để nhận POST mà không cần server thật, dùng một webhook catcher bất kỳ (webhook.site, RequestBin) hoặc chạy
một HTTP server tối giản:

```bash
node -e "require('http').createServer((q,s)=>{let b='';q.on('data',d=>b+=d);q.on('end',()=>{console.log(b);s.end('ok')})}).listen(9999)"
```
Rồi đặt `EXAMPLE_WEBHOOK_URL=http://127.0.0.1:9999`.

### Viết plugin của riêng bạn

1. Tạo `plugins/<tên>/shelldeck-plugin.json` (copy của plugin mẫu rồi đổi `name`).
2. `index.js` xuất các hook bằng `module.exports`. Chỉ dùng module dựng sẵn của Node (`node:fs`, `fetch`);
   `require('some-package')` chỉ hoạt động nếu package đó có trong `node_modules` của API.
3. Khởi động lại API. Log `Plugins loaded` liệt kê plugin đã nhận.
4. Plugin đọc cấu hình từ `process.env` (biến đặt trong `.env` của API), không có cơ chế cấu hình riêng.

Giới hạn hiện tại (B12, P2): chỉ CommonJS, chỉ nạp lúc khởi động (không hot-reload), chưa có UI quản lý plugin,
chưa có hạn mức thời lượng bộ nhớ cho plugin, và chưa có API nào khác cho plugin ngoại trừ ba hook trên.

---

## English

A ShellDeck plugin is a plain CommonJS JavaScript folder inside `PLUGINS_DIR`, loaded by the API at start-up. Plugins run
**in the same process as the server** and therefore have the server's full privileges — install only code you trust.

### Enabling

Run locally (`pnpm dev`): set `PLUGINS_DIR=../plugins` in `backend/.env`. Docker: the `api` service mounts
`./plugins:/app/plugins:ro` and sets `PLUGINS_DIR=/app/plugins`. A missing or empty folder is logged and otherwise ignored.

### Layout and manifest

A plugin folder holds `shelldeck-plugin.json` (`name`, `version`, `main`, `hooks`) plus its `.js` files. `name` is
lower-case and becomes the route prefix; `main` must stay inside the plugin folder; only hooks listed in `hooks` run.

### Hooks

- `onSessionStart(ctx)` — a terminal session opened successfully.
- `onSessionEnd(ctx)` — the session ended (disconnect, idle timeout, SSH error, server shutdown).
- `registerRoutes(router)` — at start-up, before the server listens.

`ctx` for start is `{ userId, sessionId, hostLabel, startedAt }`; for end it is `{ userId, sessionId, hostLabel, endedAt, reason }`.
Times are ISO-8601 strings. The server whitelists these fields and freezes the object, so credentials, keys, cookies,
tokens and terminal content never reach a plugin, and one plugin cannot alter what another plugin sees. Plugin routes are
mounted under `/api/v1/plugins/<name>` behind the normal authentication middleware.

### Failure isolation

Bad manifests, unloadable entry files, throwing hooks and throwing route registration are each caught and logged
(`Plugin failed to load`, `Plugin hook failed`, `Plugin route registration failed`); other plugins and the terminal itself
keep working. Hooks are fire-and-forget, so a slow plugin cannot stall session open or close — give your own network calls
a timeout, as `plugins/example-webhook` does with `AbortSignal.timeout(5000)`.

### Sample plugin

`plugins/example-webhook` POSTs a JSON event to `EXAMPLE_WEBHOOK_URL` on session start and end and keeps the last 50
events in memory, readable through `GET /api/v1/plugins/example-webhook/events`.

Current limits (B12, P2): CommonJS only, load only at start-up (no hot reload), no management UI, no resource limits, and
no plugin-facing API beyond the three hooks above.
