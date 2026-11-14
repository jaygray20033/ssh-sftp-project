# ShellDeck — TODO chi tiết

Cách dùng với Claude Code: đặt `CLAUDE.md` ở gốc repo và `TODO.md` trong `docs/`, rồi giao từng task:

> Đọc CLAUDE.md và docs/TODO.md. Làm task **B05** trong TODO.md, đúng phạm vi, chạy lint/type-check/test,
> tick các mục đã đạt và commit theo Conventional Commits.

Ký hiệu: **P0** = bắt buộc để nộp bài, **P1** = nên có, **P2** = nếu còn thời gian.
Mã task: `S` setup · `B` backend · `F` frontend · `I` hạ tầng/tài liệu/mã nguồn mở.

## Thứ tự và phụ thuộc

```
S01 → S02 → S03 → S04                      (khởi tạo, làm tuần tự)
S04 → B01 → B02 → B03 → B04 → B05 → B06 → B07   (backend MVP, làm tuần tự)
S04 → F01 → F02                            (khung frontend, làm song song với B01–B03)
B03 + F02 → F03     (Hosts UI)
B06 + F03 → F04     (Terminal UI)  → F05
B05 → B08 → F06                            (SFTP, sau khi terminal chạy)
S04 → I01 → I02 → I03                      (Docker, Nginx, hardening)
I04 làm sớm (ngay sau S04); I05–I08 làm cuối

MVP (tuần 1–2): S01–S04, B01–B07, F01–F05, I01–I02, I04.
Tuần 3: B08, F06, I03. Tuần 4: B09–B12, F07, I05–I08.
```

---

## S — Khởi tạo repo

### S01 (P0) Gộp hai repo thành monorepo `shelldeck`
- [x] Tạo thư mục `shelldeck/`, `git init`, nhánh `main`.
- [x] Chép `ts-backend` → `backend/`, `ts-frontend` → `frontend/` (bỏ `.git` cũ, `node_modules`, `dist`).
- [x] Giữ nguyên `.husky`, `commitlint`, `eslint`, `prettier` của mỗi phần; đảm bảo husky chạy được từ thư mục con
      (nếu không, chuyển `prepare` về gốc với `husky` trỏ `backend`/`frontend`).
- [x] Tạo `.gitignore` gốc (node_modules, dist, .env, *.log, uploads, coverage).
- [x] Quét secret trước commit đầu: `git ls-files | xargs grep -nE "(SECRET|PASSWORD|API_KEY|PRIVATE KEY)"`;
      xác nhận không có giá trị thật trong `.env.example`, `docker-compose*.yml`, `infra/`, `.github/`.
- **Nghiệm thu:** `cd backend && pnpm install && pnpm type-check` và `cd frontend && pnpm install && pnpm build` đều qua.

### S02 (P0) Đổi thương hiệu UptimeWatch → ShellDeck
- [x] Backend: `package.json` name `shelldeck-api`, description; `APP_NAME` mặc định `ShellDeck` trong `env.ts` và `.env.example`;
      tên image/container trong compose đổi từ `api-ecommerce` sang `shelldeck-api`; tiêu đề Swagger.
- [x] Frontend: `package.json` name `shelldeck-web`; `index.html` title/favicon; logo "U"/"UptimeWatch" trong
      `components/layout/AppLayout.tsx` và các `AuthLogo`/auth pages → "S"/"ShellDeck".
- [x] Email template (`src/assets/templates/emails`) đổi tên thương hiệu.
- [x] Thư mục `frontend/design-system/ts-uptime` đổi tên `shelldeck` (hoặc xóa nếu chỉ là tài liệu thiết kế cũ).
- **Nghiệm thu:** `grep -ri "uptimewatch\|api-ecommerce\|ts-uptime"` trong repo không còn kết quả (trừ lịch sử git).

### S03 (P0) LICENSE và README tối thiểu
- [x] Thêm `LICENSE` (MIT) ở gốc, năm 2026, tên tác giả: `<TODO: tên đầy đủ của tác giả>`.
- [x] Đổi `"license"` trong hai `package.json` thành `MIT`.
- [x] README tối thiểu: ShellDeck là gì, tính năng dự kiến, cách chạy dev, giấy phép.
- **Nghiệm thu:** GitHub nhận diện license MIT; README hiển thị đúng.

### S04 (P0) Dev environment
- [x] `docker-compose.dev.yml`: `postgres:17-alpine` (cổng 5432, volume, healthcheck) và một SSH server thử
      (`lscr.io/linuxserver/openssh-server`, cổng 2222, user `dev`, password `dev`, `PASSWORD_ACCESS=true`, `SUDO_ACCESS=false`).
- [x] `backend/.env.example` có sẵn giá trị dev hợp lệ (DATABASE_URL trỏ compose dev) và comment cách tạo secret:
      `openssl rand -base64 32`.
- [x] Gỡ các biến không dùng nếu có (kể cả `DOCKERHUB_USERNAME` nếu CD sẽ chuyển sang GHCR, xem I04).
- [x] Thêm vitest cho backend: `pnpm add -D vitest`, script `"test": "vitest run"`, cấu hình alias khớp tsconfig.
- **Nghiệm thu:** `docker compose -f docker-compose.dev.yml up -d`, `cd backend && pnpm migration:run && pnpm dev` chạy;
  đăng ký/đăng nhập thành công qua Swagger `/docs`; `ssh -p 2222 dev@localhost` thành công.

---

## B — Backend

### B01 (P0) Dịch vụ mã hóa credential
- [x] Biến môi trường `ENCRYPTION_KEY` (base64 của đúng 32 byte): khai báo trong `env.ts` (zod: giải mã base64, kiểm tra độ dài 32) và `.env.example`.
- [x] `src/common/services/crypto.service.ts`: `encrypt(plain: string): string` và `decrypt(payload: string): string`,
      AES-256-GCM, IV 12 byte ngẫu nhiên mỗi lần, định dạng lưu `v1:<iv_b64>:<tag_b64>:<cipher_b64>`; xuất ở `common/services/index.ts`.
- [x] `decrypt` ném lỗi rõ ràng khi sai khóa, sai định dạng, hoặc dữ liệu bị sửa (auth tag không khớp).
- [x] Unit test (`crypto.service.test.ts`): round-trip, hai lần mã hóa cùng input ra kết quả khác nhau, sửa 1 byte thì decrypt thất bại, sai khóa thất bại, chuỗi unicode/tiếng Việt.
- **Nghiệm thu:** test qua; không có log nào in ra plaintext hoặc khóa.

### B02 (P0) Entity `Host` và migration
- [x] `src/databases/entities/host.entity.ts` (kế thừa `BaseEntity`, bảng `hosts`):
      `name` varchar(100), `hostname` varchar(255), `port` int mặc định 22, `username` varchar(100),
      `authType` enum `password | private_key`, `encryptedSecret` text, `encryptedPassphrase` text nullable,
      `hostKeyFingerprint` varchar(100) nullable (dạng `SHA256:...`), `tags` simple-array nullable,
      `lastConnectedAt` timestamp nullable, `userId` uuid + quan hệ `ManyToOne(User, onDelete CASCADE)`.
- [x] Ràng buộc unique `(userId, name)`; index theo `userId`.
- [x] Hằng số `AuthType` trong `src/common/constants/host.constant.ts`, theo kiểu `monitor.constant.ts`.
- [x] Đăng ký entity trong data source; sinh migration `AddHostsTable` bằng `pnpm migration:generate`, kiểm tra tay file sinh ra.
- **Nghiệm thu:** `pnpm migration:run` tạo bảng; `pnpm migration:revert` hoàn tác sạch.

### B03 (P0) Module `hosts` (CRUD)
- [x] `src/modules/hosts/`: route, controller, service, repository, `dto/` (zod) theo mẫu `monitor`.
- [x] DTO tạo: `name` (1–100), `hostname` (hostname hoặc IP hợp lệ), `port` (1–65535), `username`, `authType`,
      `secret` (password hoặc nội dung private key PEM, tối đa 16KB), `passphrase` tùy chọn, `tags` (≤10 tag, mỗi tag ≤30 ký tự).
      DTO sửa: tất cả tùy chọn; không gửi `secret` thì giữ nguyên bản cũ.
- [x] Service mã hóa `secret`/`passphrase` bằng CryptoService trước khi lưu.
- [x] Response chỉ gồm: id, name, hostname, port, username, authType, tags, `hasSecret`, `hasPassphrase`,
      `hostKeyFingerprint`, `lastConnectedAt`, createdAt, updatedAt. **Tuyệt đối không có secret.**
- [x] Endpoints: `GET /hosts` (phân trang, `search`, `tag`), `GET /hosts/:id`, `POST /hosts`, `PATCH /hosts/:id`, `DELETE /hosts/:id`.
      Mọi truy vấn lọc theo `req.user!.id`; host của người khác trả 404.
- [x] Mount `/hosts` trong `modules/index.ts` (sau authenticate); đăng ký schema OpenAPI giống cách module monitor đã làm trong `src/docs`.
- [x] Test: tạo/sửa/xóa, user B không đọc/sửa/xóa được host của user A, response không chứa field secret.
- **Nghiệm thu:** thao tác được qua Swagger; kiểm tra DB thấy `encrypted_secret` bắt đầu bằng `v1:`.

### B04 (P0) Chặn kết nối nguy hiểm (SSRF guard) và validate đích
- [x] Biến `ALLOW_PRIVATE_HOSTS` (mặc định `false`) và `ALLOWED_HOSTS` (danh sách phân tách dấu phẩy, tùy chọn) trong `env.ts` + `.env.example`.
- [x] `src/common/utils/network-guard.ts`: `assertHostAllowed(hostname)` — resolve DNS (cả A/AAAA), từ chối loopback,
      private (10/8, 172.16/12, 192.168/16), link-local (169.254/16, đặc biệt 169.254.169.254), `fc00::/7`, `::1`, `0.0.0.0`
      khi `ALLOW_PRIVATE_HOSTS=false`; nếu `ALLOWED_HOSTS` có giá trị thì chỉ cho phép host trong danh sách.
- [x] Gọi guard khi tạo/sửa host và **ngay trước mỗi lần kết nối** (chống DNS rebinding: dùng IP đã resolve để kết nối).
- [x] Unit test các dải IP trên, IPv6, hostname phân giải ra IP nội bộ.
- [x] README/docs ghi rõ: self-host trong LAN thì đặt `ALLOW_PRIVATE_HOSTS=true`; `docker-compose.dev.yml` bật biến này.
- **Nghiệm thu:** tạo host `127.0.0.1` bị từ chối khi `false`, được phép khi `true`.

### B05 (P0) SSH service và kiểm tra kết nối
- [x] `pnpm add ssh2` và `pnpm add -D @types/ssh2`. `src/modules/hosts/ssh.service.ts` bọc `ssh2.Client`.
- [x] `connect(host)`: giải mã secret tại chỗ, `readyTimeout` 10 giây, `keepaliveInterval` 15 giây, hỗ trợ password và private key (+ passphrase).
- [x] `hostVerifier`: tính fingerprint `SHA256:<base64 không padding>` của host key.
      Nếu host đã lưu fingerprint → phải khớp, khác thì từ chối với mã lỗi `HOST_KEY_CHANGED`.
      Nếu chưa lưu → trả `HOST_KEY_UNVERIFIED` kèm fingerprint để client xác nhận (xem B06).
- [x] `POST /hosts/:id/test`: kết nối thử, chạy exec `echo ok`, trả `{ ok, fingerprint, latencyMs }` hoặc lỗi đã phân loại
      (`AUTH_FAILED`, `TIMEOUT`, `REFUSED`, `HOST_KEY_CHANGED`, `HOST_KEY_UNVERIFIED`); rate limit riêng (ví dụ 10/phút/user).
- [x] `POST /hosts/:id/trust-host-key` nhận `{ fingerprint }`, lưu vào `hostKeyFingerprint` (chỉ khi khớp fingerprint vừa thấy gần nhất; hoặc bắt buộc test trước).
- [x] Không log secret/passphrase; lỗi trả về không chứa nội dung nhạy cảm.
- **Nghiệm thu:** test được với sshd trong `docker-compose.dev.yml` (sai mật khẩu, đúng mật khẩu, đổi fingerprint → báo `HOST_KEY_CHANGED`).

### B06 (P0) Terminal gateway (WebSocket)
- [x] `pnpm add ws` và `pnpm add -D @types/ws`. Gắn `WebSocketServer({ noServer: true })` vào HTTP server trong `index.ts` qua sự kiện `upgrade`,
      chỉ chấp nhận path `/api/v1/terminal/ws`.
- [x] `POST /api/v1/terminal/tickets` (cần Bearer) nhận `{ hostId }`: kiểm tra host thuộc user, trả `{ ticket }`
      (32 byte ngẫu nhiên hex, lưu `node-cache` TTL 30 giây, dùng một lần, gắn userId + hostId; rate limit).
- [x] Khi upgrade: kiểm tra header `Origin` nằm trong `CLIENT_ORIGINS`, kiểm tra và **xóa** ticket; sai thì đóng 4401.
- [x] Giao thức JSON:
      - client → server: `{type:'input',data}`, `{type:'resize',cols,rows}`, `{type:'hostkey_accept'}`, `{type:'ping'}`
      - server → client: `{type:'hostkey',fingerprint,status:'new'|'changed'}`, `{type:'ready'}`, `{type:'data',data}`,
        `{type:'error',code,message}`, `{type:'closed',reason}`, `{type:'pong'}`
- [x] Luồng: mở SSH → nếu host key mới thì gửi `hostkey` và chờ `hostkey_accept` (timeout 60 giây; chấp nhận thì lưu fingerprint) →
      `client.shell({ term:'xterm-256color', cols, rows })` → pipe hai chiều; `resize` gọi `stream.setWindow`.
- [x] Dọn dẹp: đóng WS thì đóng SSH và ngược lại; không rò listener; xử lý lỗi không làm sập process.
- [x] Giới hạn: `MAX_SESSIONS_PER_USER` (mặc định 5), `SESSION_IDLE_TIMEOUT_MIN` (mặc định 30, đóng phiên không có input),
      kích thước message tối đa (ví dụ 64KB), ping từ server 30 giây để phát hiện kết nối chết.
- [x] Test (unit cho ticket service: hết hạn, dùng lại bị từ chối, sai user) và một test tích hợp nếu khả thi.
- **Nghiệm thu:** dùng `wscat`/script Node nối vào sshd thử, gõ `echo hi` nhận được `hi`; đóng WS thì phiên SSH biến mất (`ss`/log).
      Đã chạy thật với sshd dev (xem Ghi chú cuối file).

### B07 (P0) Nhật ký phiên (audit)
- [x] Entity `SessionLog` (`session_logs`): userId, hostId (nullable khi host bị xóa, `SET NULL`), `hostLabel` (tên host lúc kết nối),
      `startedAt`, `endedAt`, `clientIp`, `closeReason`; migration mới.
- [x] Ghi khi phiên mở và đóng (kể cả đóng do lỗi/timeout). **Không ghi nội dung gõ hay output.**
- [x] `GET /sessions` (phân trang, của chính user); xóa log cũ hơn `SESSION_LOG_RETENTION_DAYS` (mặc định 90) bằng job định kỳ.
- **Nghiệm thu:** mở/đóng 2 phiên thì `GET /sessions` thấy 2 bản ghi có thời lượng đúng.

### B08 (P0 → làm sau tuần 2) Module SFTP
- [x] `src/modules/sftp/`, mount dưới `/hosts/:id/sftp` (kiểm tra sở hữu host như B03; dùng `ssh.service` + `client.sftp()`).
- [x] Endpoints: `GET .../list?path=` (trả tên, loại, kích thước, mtime, quyền; thư mục trước, sắp xếp theo tên),
      `GET .../download?path=` (stream, `Content-Disposition`), `POST .../upload?path=` (multipart, giới hạn `SFTP_MAX_UPLOAD_MB` mặc định 100,
      ghi tạm rồi stream lên SFTP, luôn xóa file tạm), `PATCH .../rename` `{from,to}`, `DELETE .../?path=&recursive=`, `POST .../mkdir`.
- [x] Chuẩn hóa đường dẫn POSIX: từ chối chuỗi chứa byte NUL; dùng `path.posix.normalize`; đường dẫn tương đối tính từ home của user SSH.
- [x] Từ chối nếu host chưa có `hostKeyFingerprint` (báo `HOST_KEY_UNVERIFIED`, hướng dẫn kết nối terminal hoặc test trước).
- [x] Đóng kết nối SSH sau mỗi request, hoặc cache ngắn (≤60 giây) theo `(userId, hostId)` và đóng khi idle.
- [x] Lỗi map rõ: `ENOENT` → 404, `EACCES` → 403, còn lại 502; không lộ stack trace.
- [x] Test util chuẩn hóa đường dẫn; thử tay với sshd dev (upload/download file ≥ 20MB đúng checksum).
- **Nghiệm thu:** toàn bộ thao tác chạy được qua Swagger/curl; checksum file tải về khớp.

### B09 (P1) Sức khỏe host (tái sử dụng module monitor)
- [x] Thay vì giữ monitor kiểu HTTP/Ping, thêm chế độ "kiểm tra host" TCP cổng SSH cho từng `Host`
      (tái dụng `monitor` + `status-record` hoặc viết service nhẹ riêng; chọn cách ít thay đổi nhất).
      *Module `monitor` không còn trong repo → đã viết service nhẹ riêng (`host-health.service.ts` + store in-memory).*
- [x] `GET /hosts` kèm `status` (`up`/`down`/`unknown`) và `lastCheckedAt`.
- [x] Xóa các loại monitor không còn dùng và route/entity thừa (kèm migration), cập nhật OpenAPI.
      *Không có gì để xóa (monitor đã bị xóa trước đó); OpenAPI Host thêm `status`/`lastCheckedAt`/`recordSessions`.*
- **Nghiệm thu:** tắt sshd dev thì host chuyển `down` trong ≤ 1 chu kỳ kiểm tra.
      *Đạt: E2E thật với sshd container (cổng 2222), chu kỳ 2 giây — host `up` khi sshd chạy, sau `docker stop` sshd chuyển `down` trong ≤ 1 chu kỳ.*

### B10 (P1) Snippets
- [x] Entity `Snippet` (name, command, description, userId) + migration; CRUD `/snippets` theo mẫu `monitor`; giới hạn độ dài command 4KB.
      *Unique `(userId, name)`, hard delete, sort theo name, search trên name/command/description.*
- [x] Không tự chạy snippet ở backend: frontend gửi nội dung vào terminal như người dùng gõ.
      *Backend chỉ lưu/trả chuỗi; mô tả API ghi rõ điều này trong OpenAPI.*

### B11 (P1) Ghi và phát lại phiên (opt-in)
- [x] Cờ `recordSessions` ở từng host (mặc định `false`, cảnh báo rõ trên UI). Khi bật, ghi định dạng asciicast v2 vào `RECORDINGS_DIR`
      kèm giới hạn dung lượng và thời gian giữ. Ghi nội dung có thể chứa mật khẩu gõ vào: tài liệu hóa cảnh báo trong `docs/security.md`.
      *Migration `1780000003000-AddRecordSessionsToHosts`; cap `RECORDING_MAX_SIZE_MB` (default 20) + retention
      `RECORDING_RETENTION_DAYS` (default 7, job hourly gộp với job session_logs). Cảnh báo đã thêm vào `docs/security.md`
      (phần frontend/UI cảnh báo là việc của F-task).*
- [x] `GET /sessions/:id/recording` trả file; frontend phát lại bằng `asciinema-player` (giấy phép Apache-2.0).
      *Backend trả stream `text/x-asciicast` + `hasRecording` trong `GET /sessions`; player là việc frontend (F-task).*

### B12 (P2) Hệ thống plugin
- [x] Thư mục `PLUGINS_DIR`; mỗi plugin là một thư mục có `shelldeck-plugin.json` (`name`, `version`, `main`, `hooks`) và file JS.
- [x] Hook tối thiểu: `onSessionStart(ctx)`, `onSessionEnd(ctx)`, `registerRoutes(router)`; `ctx` chỉ gồm userId, hostLabel, thời gian,
      **không** có secret. Plugin lỗi không được làm sập server (try/catch + log).
- [x] Plugin mẫu `plugins/example-webhook` (gửi POST tới URL cấu hình khi phiên bắt đầu/kết thúc) và `docs/plugin-guide.md`.

---

## F — Frontend

### F01 (P0) Điều hướng và khung trang
- [x] `AppLayout` nav: Dashboard, **Hosts**, **Terminal**, **Files**, Cài đặt (bỏ Storage, Monitors tùy B09).
- [x] `App.tsx`: thêm route `/hosts`, `/terminal`, `/files/:hostId`, bọc `ProtectedRoute` + `AppLayout` như các trang hiện có; xóa `pages/storage` và
      `storage.service.ts` sau khi F06 tái dùng xong (hoặc xóa luôn nếu chưa cần, rồi dựng mới ở F06).
- [x] Trang `Dashboard`: số host, số phiên gần đây, nút "Kết nối nhanh" (dùng dữ liệu thật từ API, không dữ liệu giả).
- **Nghiệm thu:** `pnpm build` sạch; điều hướng giữa các trang không lỗi console.

### F02 (P0) Kiểu dữ liệu và service
- [x] lib/types: Host, CreateHostRequest, UpdateHostRequest, TestHostResult, SessionLog, SftpEntry.
- [x] lib/services/hosts.service.ts (list/get/create/update/delete/test/trustHostKey), terminal.service.ts (createTicket(hostId)), sessions.service.ts, sftp.service.ts (B08 đã xong, cập nhật F02); theo đúng mẫu monitors.service.ts.
- **Ghi chú:** types đồng bộ B09 (`HostStatus`, `Host.status/lastCheckedAt`) và B11 (`Host.recordSessions`, `SessionLog.hasRecording`); `sftp.service.ts` mới (list/download-blob/upload-multipart + onProgress/rename/mkdir/remove) theo route `/hosts/:id/sftp/*`; export thêm `sftpService` + `HostStatus` qua `lib/api.ts`.

### F03 (P0) Trang Hosts
- [x] `pages/hosts/` theo mẫu `pages/monitors/`: `store.ts`, `hooks.ts`, `index.tsx`, `components/HostCard`, `HostModal`, `DeleteDialog`.
- [x] `HostModal` (react-hook-form + zod): name, hostname, port, username, authType (radio), secret (input password hoặc textarea cho private key
      + nút chọn file `.pem`), passphrase (chỉ khi key), tags, checkbox `recordSessions` (B11, kèm cảnh báo ⚠ mật khẩu có thể bị ghi). Khi sửa: trường secret để trống nghĩa là giữ nguyên.
- [x] `HostCard`: tên, `user@host:port`, tags, trạng thái (dot up/down/unknown + `lastCheckedAt`), badge "Đang ghi phiên", nút **Kết nối**, **Files**, **Kiểm tra**, **Sửa**, **Xóa**.
- [x] Tìm kiếm và lọc theo tag (chips phái sinh từ hosts đã load); trạng thái trống/đang tải/lỗi rõ ràng; xác nhận trước khi xóa.
- [x] Nút **Kiểm tra** gọi `/hosts/:id/test`; hiển thị fingerprint mới và hộp thoại "Tin tưởng host này?" → gọi `trust-host-key` rồi tự retest.
- [x] **Nghiệm thu:** CRUD đầy đủ; secret không bao giờ xuất hiện lại trong UI hoặc tab Network response.
- **Ghi chú nghiệm thu (E2E qua UI thật):** tạo host e2e-web (recordSessions:true, tags test/web) + db-only; card hiện đúng status/badge; flow Kiểm tra → HOST_KEY_UNVERIFIED + fingerprint → "Tin tưởng và thử lại" → "Kết nối thành công (68ms)"; tag filter chip "test" ẩn db-only; edit modal pre-check `recordSessions` đúng từng host, secret placeholder "Để trống để giữ nguyên"; PATCH `recordSessions:false` → badge biến mất; GET /hosts có `recordSessions`, KHÔNG có field `secret`; nút Files điều hướng `/files/:hostId` (trang F06); DeleteDialog xóa db-only hoạt động.
- **Fix phát hiện khi nghiệm thu:** backend `toHostResponse` thiếu `recordSessions` (đã thêm); `HostService.testHost` đánh dấu host `down` khi fail HOST_KEY_UNVERIFIED/HOST_KEY_CHANGED dù TCP sống — đã sửa `reachable = ok || HOST_KEY_*` (import `SshErrorCode` thêm vào host.constant import).

### F04 (P0) Trang Terminal
- [x] `pnpm add @xterm/xterm @xterm/addon-fit @xterm/addon-web-links`; import CSS của xterm.
- [x] `pages/terminal/`: store Zustand giữ danh sách tab `{id, hostId, title, status}` và tab đang chọn;
      mở tab từ nút "Kết nối" ở Hosts (điều hướng sang `/terminal` kèm tab mới).
- [x] `components/TerminalTab`: tạo `Terminal` + `FitAddon`; luồng kết nối: `createTicket` → `new WebSocket(<ws base>/terminal/ws?ticket=...)`
      (ws base suy ra từ `VITE_API_URL`: `http→ws`, `https→wss`, hoặc theo `location` khi dùng đường dẫn tương đối).
- [x] Xử lý message theo giao thức B06: `hostkey` mở hộp thoại xác nhận fingerprint (Chấp nhận/Từ chối); `data` ghi vào terminal;
      `error`/`closed` hiện banner và nút **Kết nối lại** (xin ticket mới).
- [x] `term.onData` → gửi `input`; `ResizeObserver` + `FitAddon.fit()` → gửi `resize` (debounce ~100ms).
- [x] Phím tắt: `Ctrl+Shift+C/V` copy/paste; `Ctrl+C` vẫn gửi SIGINT khi không chọn văn bản.
- [x] Nhiều tab; đóng tab thì `ws.close()` và `term.dispose()`; chuyển tab không mất nội dung; rời trang cảnh báo nếu còn phiên mở.
- [x] Tùy chọn cỡ chữ và theme sáng/tối lưu `localStorage`.
- **Nghiệm thu:** vào `vim`, `htop`, `top` hiển thị đúng; đổi kích thước cửa sổ thì terminal co giãn đúng; đóng tab thì phiên SSH đóng.

### F05 (P0) Trang Settings bổ sung
- [x] Giữ nguyên 2FA/đổi mật khẩu; thêm mục "Phiên SSH gần đây" (từ `GET /sessions`) với bảng host, thời gian bắt đầu/kết thúc, IP.
- **Ghi chú:** tab mới "Phiên SSH" (`'profile' | 'security' | 'activity'`); `SessionsSection.tsx` bảng 10 phiên gần nhất (host, thời gian → kết thúc, IP, closeReason) qua `sessionsService.getSessions`, chỉ metadata — không lưu nội dung gõ.
- **Nghiệm thu:** tạo 2 phiên SSH thật (ticket + WS qua sshd 2222) → bảng hiển thị đúng cả 2 phiên với `hasRecording:true`, closeReason "SSH shell closed".

### F06 (P0 → sau tuần 2) Trang Files (SFTP)
- [x] `pages/files/` (route `/files/:hostId`): breadcrumb, bảng thư mục/file (thư mục trước), cột tên/kích thước/ngày sửa/quyền.
- [x] Upload: kéo thả + nút chọn file, thanh tiến độ (`onUploadProgress`), nhiều file; tải xuống bằng `responseType: 'blob'`
      (vì xác thực bằng header Bearer, không dùng thẻ `<a href>` trực tiếp); tạo thư mục, đổi tên, xóa (xác nhận) bằng dialog.
- [x] Xử lý lỗi `HOST_KEY_UNVERIFIED`: hướng dẫn "Kiểm tra host trước".
- [x] (P2) Xem/sửa file văn bản nhỏ (<1MB) bằng textarea và nút Lưu.
- **Nghiệm thu:** upload/download file ≥ 20MB đúng checksum; điều hướng thư mục bằng breadcrumb đúng.
- **Ghi chú:** `pages/files/components/` = FileBrowser (điều hướng + upload tuần tự từng file, kéo/thả), Breadcrumbs (nối prefix từng cấp),
      FileTable (thư mục trước, cột quyền/kích thước/ngày), PromptDialog (mkdir/rename), DeleteDialog (checkbox `recursive` chỉ hiện với thư mục),
      UploadPanel (thanh tiến độ), TextEditDialog (<1MB, lưu đè bằng upload cùng tên). `utils.ts` chứa `fullPath/parentDir/isHostKeyError/MAX_EDIT_SIZE`.
- **Fix phát hiện khi nghiệm thu (backend):** `sftp.controller.ts` dùng `this.getTrustedHost` trong static handler → mọi route SFTP trả 500
      `TypeError`; đã đổi 6 chỗ sang `SftpController.getTrustedHost`. `SftpService.mkdir` stat trước để trả 409 "Already exists"
      thay vì 502 (OpenSSH báo mkdir trùng tên bằng mã lỗi chung `SSH_FX_FAILURE`).

### F07 (P1) Snippets và phát lại phiên
- [x] Bảng snippets trong Terminal (bấm để gửi lệnh vào tab hiện tại, không tự nhấn Enter trừ khi bật tùy chọn).
- [x] Trang phát lại phiên bằng `asciinema-player` (sau B11).
- **Ghi chú:** `SnippetsPanel` (cột phải, chỉ hiện ở màn hình `xl`) gửi lệnh qua `connection.submitText()` — frame `input` thô, chỉ nối `\r`
      khi bật "Tự Enter"; `registry.ts` giữ kết nối sống theo tab id để panel tìm đúng tab đang active; lưu `snippetAutoEnter` trong prefs (localStorage).
- **Ghi chú phát lại:** `pages/replay/index.tsx` route `/sessions/:id/replay`, tải blob `/sessions/:id/recording` (Bearer) rồi đưa cho
      `asciinema-player` qua `{ data, parser: 'asciicast' }` (không dùng URL trực tiếp vì phải kèm header); theme theo terminal (monokai/tango),
      có nút tải `.cast`; link "Phát lại" thêm ở cột mới của bảng phiên trong Settings. Trang Sessions hiện thị "—" khi `hasRecording=false`, 404 → hướng dẫn bật ghi phiên.
- **Lưu ý:** thêm dependency `asciinema-player@3.18.0` (Apache-2.0); bundle JS tăng lên ~1.3MB (`build` cảnh báo chunk >500kB từ trước F07).

---

## I — Hạ tầng, tài liệu, mã nguồn mở

### I01 (P0) Docker hóa
- [x] Dockerfile web: build bằng Node 22 + pnpm, runtime `nginx:alpine`, copy `dist`, cấu hình SPA fallback
      (đặt tên `infra/docker/web.Dockerfile` thay vì `frontend/Dockerfile` — xem Ghi chú).
- [x] Kiểm tra `backend/Dockerfile` hiện có; thêm `HEALTHCHECK` gọi `/api/v1/health` (đã có: `infra/docker/api.Dockerfile`,
      `HEALTHCHECK` fetch `http://127.0.0.1:$PORT/api/v1/health`).
- [x] `docker-compose.yml` gốc: `db` (postgres:17-alpine, volume, healthcheck), `api` (build `./backend`, `env_file: .env`, chờ db healthy,
      không publish cổng ra ngoài), `web` (nginx, publish `80`/`443`, proxy `/api/` sang `api:8080`).
      File nằm ở `infra/docker/docker-compose.yml` (chủ repo yêu cầu không để ngoài root); `api` dùng build context gốc repo;
      `web` chỉ publish `${WEB_PORT:-80}` vì TLS kết thúc ở proxy phía trước (`docs/deploy.md`), cách bật 443 ghi comment trong file.
- [x] Chạy migration khi khởi động api (biến `AUTO_MIGRATE=true` gọi migration trong bootstrap, hoặc service `migrate` chạy một lần); kiểm tra `data-source.ts` trước.
- [x] `.env.example` gốc có đủ biến, comment cách sinh `JWT_*`, `ENCRYPTION_KEY` (đủ 36 biến compose cần, ở `infra/docker/.env.example`).
- **Nghiệm thu:** máy sạch: `cp .env.example .env`, điền secret, `docker compose up -d --build` là dùng được ở `http://localhost`.

### I02 (P0) Nginx và HTTPS/WSS
- [ ] `infra/nginx/shelldeck.conf`: proxy `/api/` với `proxy_http_version 1.1`, `Upgrade`/`Connection` cho WebSocket,
      `proxy_read_timeout 3600s`, `client_max_body_size` khớp `SFTP_MAX_UPLOAD_MB`, header bảo mật (HSTS khi có TLS).
- [ ] Hướng dẫn trong `docs/deploy.md`: đặt sau reverse proxy có TLS hoặc dùng certbot; nhắc đặt `CLIENT_ORIGINS`, `CLIENT_URL` đúng domain.
- **Nghiệm thu:** terminal chạy ổn định ≥ 10 phút không tự ngắt trên VPS thật qua `wss://`.

### I03 (P0) Hardening và kiểm tra bảo mật
- [ ] Rà `helmet`, CORS (chỉ `CLIENT_ORIGINS`), cookie `httpOnly`/`secure`/`sameSite` ở production.
- [ ] Rate limit: đăng nhập, tạo ticket, test host (kiểm tra thực tế các middleware đã có).
- [ ] Biến `REGISTRATION_ENABLED` (mặc định `true`); đặt `false` để chỉ admin/tài khoản có sẵn dùng (self-host an toàn).
- [ ] Kiểm tra: log không chứa secret (chạy một phiên rồi `grep` log); `pnpm audit --prod` không còn lỗi mức cao/nghiêm trọng chưa xử lý.
- [ ] `docs/security.md`: mô hình đe dọa ngắn gọn (ai tin ai), nơi lưu credential, rủi ro còn lại, khuyến nghị triển khai.

### I04 (P0) CI/CD
- [ ] `.github/workflows/ci.yml`: chạy trên push/PR: cài pnpm, cache, backend `lint + type-check + test + build`, frontend `lint + build`,
      build thử hai Docker image (không push).
- [ ] `release.yml`: khi push tag `v*.*.*`: build và push image lên **GHCR** (`ghcr.io/<owner>/shelldeck-api`, `shelldeck-web`) và tạo GitHub Release từ CHANGELOG.
      Xem lại `cd.yml` cũ (đang dùng Docker Hub/VPS) và xóa hoặc chuyển sang GHCR; không để secret VPS cũ lọt vào repo.
- [ ] Badge CI trong README.
- **Nghiệm thu:** PR thử có CI xanh; tag `v0.1.0` tạo release và image.

### I05 (P0) Kiểm tra giấy phép phụ thuộc
- [ ] Chạy `pnpm dlx license-checker --production --summary` ở backend và frontend; không chấp nhận GPL/AGPL/SSPL.
- [ ] Sinh `docs/THIRD_PARTY_LICENSES.md`: bảng thư viện chính (React, Vite, Tailwind, Zustand, TanStack Query, xterm.js, Express, TypeORM, ws, ssh2,
      pg, PostgreSQL, Nginx, Docker) gồm phiên bản, giấy phép, liên kết; kết luận tương thích với MIT.
- [ ] Thêm bước kiểm tra giấy phép vào CI (fail khi gặp giấy phép bị cấm).

### I06 (P0) Tài liệu và chuẩn cộng đồng
- [ ] `README.md` (Việt trước, Anh sau): giới thiệu, ảnh chụp màn hình/GIF, tính năng, bắt đầu nhanh bằng Docker, cấu hình biến môi trường (bảng),
      kiến trúc rút gọn, bảo mật, giấy phép, liên hệ.
- [ ] `docs/architecture.md` (sơ đồ: Trình duyệt → Nginx → API → PostgreSQL / SSH server đích), `docs/deploy.md`, `docs/security.md`, `docs/development.md`.
- [ ] `CONTRIBUTING.md` (cách chạy dev, quy ước commit, quy trình PR, cách thêm module/trang), `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1),
      `SECURITY.md` (cách báo lỗ hổng riêng tư), `CHANGELOG.md` (Keep a Changelog), `.github/ISSUE_TEMPLATE/{bug,feature}.yml`, `.github/pull_request_template.md`.
- [ ] `docs/comparison.md`: so sánh ShellDeck với Apache Guacamole, Wetty, ttyd, Termix (tự đọc tài liệu từng dự án, ghi nguồn, không bịa tính năng).

### I07 (P1) Cộng đồng
- [ ] Tạo 5–10 issue gắn nhãn `good first issue` / `help wanted` (mô tả rõ, kèm file liên quan).
- [ ] Bật GitHub Discussions, thêm topics cho repo (`ssh`, `sftp`, `web-terminal`, `xterm`, `self-hosted`, `open-source`).
- [ ] Phát hành `v0.1.0` (SemVer) với ghi chú phát hành.

### I08 (P0) Dàn ý báo cáo và slide môn học
- [ ] `docs/report-outline.md`: lý do chọn đề tài; khái niệm mã nguồn mở; lựa chọn giấy phép và lý do; bảng thành phần mở đã dùng + giấy phép;
      quy trình phát triển (issue, PR, CI, release); kiến trúc; bảo mật; so sánh dự án tương tự; kết quả và bài học; hướng phát triển.
- [ ] Liên hệ nội dung môn: slide 7.7 (Nginx), 7.3 (PostgreSQL), 7.8 (công cụ phát triển web), phần khai thác tính mở/plugin (B12).
- [ ] Kịch bản demo 5 phút: đăng nhập → thêm host → mở terminal → SFTP upload → xem log phiên → `docker compose up` từ máy sạch.

---

## Checklist trước khi nộp

- [ ] Máy sạch: clone, `docker compose up -d --build` là chạy được.
- [ ] Không còn secret/`.env` trong lịch sử git (`gitleaks detect` hoặc tương đương).
- [ ] CI xanh trên `main`; có release `v0.1.0`.
- [ ] LICENSE đúng tên tác giả; `THIRD_PARTY_LICENSES.md` đã cập nhật.
- [ ] README có ảnh/GIF và hướng dẫn chạy đã thử thật.
- [ ] Terminal ổn định ≥ 10 phút qua `wss://` trên VPS thật; SFTP upload/download đúng checksum.
- [ ] Bạn tự giải thích được: luồng ticket WebSocket, mã hóa AES-256-GCM, xác thực host key, vì sao chọn giấy phép.

## Ghi chú (Claude Code ghi vào đây khi gặp vấn đề ngoài phạm vi)

- B01/B02: mã hóa credential và entity `Host` + migration đã có sẵn trong zip; đã rà lại theo checklist và nghiệm thu thật:
  `pnpm test` 34/34 pass (5 test crypto), type-check + lint sạch, dựng postgres 17 tạm (cổng 5433) rồi
  `pnpm migration:run` tạo bảng `hosts` đúng cột/unique/index/FK CASCADE và `pnpm migration:revert` hoàn tác sạch
  (cả bảng lẫn type enum biến mất); chạy lại `migration:generate` trên DB đã revert cho ra SQL giống hệt
  `AddHostsTable` → entity khớp 1:1 migration. Postgres tạm đã xóa.
- B02: sửa lỗi `pnpm migration:run` báo `Cannot find module 'ts-node'` (ghi nhận ở note F04 dưới đây) bằng cách
  thêm `ts-node` vào devDependencies — các script migration giờ chạy được thật, không cần workaround AUTO_MIGRATE.

- LICENSE và README còn placeholder: `<TODO: full name of the author>` trong LICENSE, `OWNER` trong badge/URL clone của README. Cần điền thật.
- Compose, Dockerfile và `.env.example` nằm trong `infra/docker/` (theo yêu cầu của chủ repo, không để ngoài root).
- Nghiệm thu S04 (`migration:run` + đăng nhập Swagger + `ssh -p 2222`) cần Docker daemon chạy thật; chưa kiểm tra được trong môi trường tạo repo.
- Đã có sẵn trong zip (ngoài S01–S04): B01, B02 (migration AddHostsTable), B03, F03, I01/I02/I04/I06 một phần. Chưa tick, cần rà theo từng task.
- `project-mmm` (Express + MongoDB, JS) không dùng: khác stack so với CLAUDE.md.
- B06 đã nghiệm thu với sshd thật (`shelldeck-dev-sshd`, cổng 2222) bằng script Node: `echo hi` → `hi`,
  resize 120x40 → `stty size` trả `40 120`, đóng WS thì `sshd-session dev@pts/0` + `-bash` biến mất.
  Container sshd dev vẫn đang chạy, tắt bằng `cd infra/docker && docker compose -f docker-compose.dev.yml stop sshd`.
- Dùng `wscat` phải gửi kèm Origin, nếu không gateway đóng 4401:
  `wscat -H "Origin: http://localhost:3000" -c "ws://localhost:8080/api/v1/terminal/ws?ticket=<ticket>"`.
- Terminal chưa cập nhật `hosts.lastConnectedAt` khi mở phiên thật (hiện chỉ `/hosts/:id/test` cập nhật) — có thể gom vào B09.
- Cổng 5432 trên máy dev đang bị tiến trình khác chiếm nên chưa chạy được db dev để nghiệm thu B06 qua Swagger;
  phần HTTP đã kiểm tra bằng script riêng: không Bearer → 401, host của mình → 201 + ticket 64 hex,
  host người khác → 404, body sai → 422.
- F02: `monitors.service.ts` không còn trong frontend nên đã theo mẫu `hosts.service.ts`/`users.service.ts` đang có
  (named async function + object `xxxService`, `http` từ `lib/axios`, type trong `lib/types`, re-export qua `lib/api.ts`).
- F02: `sessions.service.ts` và type `SessionLog`/`SftpEntry` viết theo contract B07/B08 chưa implement
  (`GET /sessions` trả `{ sessions: { entries, limit, offset, total_count } }` giống `/hosts`);
  khi làm B07/B08 nhớ đối chiếu lại key envelope và field. `sftp.service.ts` chưa tạo, để sau B08.
- F02: frontend không có script `type-check`/`test`; đã chạy `pnpm lint` và `pnpm build` sạch
  (cảnh báo chunk > 500kB và comment của zod là có sẵn từ trước, không phải do F02).
- F01: Docker daemon không chạy và cổng 5432 bị tiến trình khác chiếm nên không có backend thật; đã chạy UI với
  mock API tạm (ngoài repo) theo đúng contract `/hosts`, `/hosts/:id/test`, `/hosts/:id/trust-host-key`,
  `/terminal/tickets`, `/sessions`. Nghiệm thu thật cần chạy lại với `docker compose up`.
- F01: `GET /sessions` chưa tồn tại (B07). Dashboard vẫn gọi thật với `retry: false` và hiển thị "Chưa khả dụng"
  thay vì số giả; với backend thật sẽ có một log 404 trong DevTools cho tới khi B07 xong.
- F01: thêm route `/files` (không có `hostId`) để mục Files trong nav có đích; `pages/files` hiện là khung chọn host
  + trang chi tiết host theo contract B08, F06 sẽ thay bằng bảng SFTP thật (cần `sftp.service.ts`).
- F01: nút "Kết nối" ở `HostCard` chuyển từ disabled sang `/terminal?host=<id>`; trang terminal nhận host từ query.
- F01: trình duyệt tích hợp không mở được viewport (trả `0x0`) nên không chụp màn hình được; đã kiểm tra bằng snapshot
  và DOM, chưa rà bằng mắt ở các breakpoint.
- F04: `pnpm migration:run` không chạy được (`Cannot find module 'ts-node'`); đã dùng `AUTO_MIGRATE=true` để API tự
  apply migration khi khởi động, không thêm dependency.
- F04: 5432/8080 đang bị project khác chiếm nên nghiệm thu bằng stack tạm — postgres `5433`, API `8090`, sshd `2222`
  (đã cài thêm vim/htop/top trong container), frontend dev ở `3001` với `VITE_API_URL=http://localhost:8090/api/v1`
  và `CLIENT_ORIGINS` phải có origin `3001` vì gateway kiểm tra header Origin trước khi nâng cấp WebSocket.
- F04: app dùng `BrowserRouter` nên `useBlocker`/`usePrompt` không khả dụng (chỉ hoạt động với data router); cảnh báo
  "rời trang" làm theo kiểu `beforeunload` + bắt click ở capture phase trên `<a>` (nút "Quản lý host" đổi thành `Link`
  để nằm trong luồng này). Điều hướng bằng `useNavigate()` từ code thì không chặn được, phiên sẽ đóng im lặng.
- F04: bug tìm ra khi nghiệm thu — frame `resize` đầu tiên gửi trước khi WebSocket mở nên bị rơi, pty ở lại 80x24;
  `syncSize` chỉ ghi nhận kích thước khi frame thực sự được gửi, do đó `ready` sẽ gửi lại lần đo đầu tiên.
- F04: proxy `/api` trong `vite.config.ts` thêm `ws: true` để dùng `VITE_API_URL=/api/v1` (đường dẫn tương đối) được ở dev.
- F04: giữa chừng viewport của trình duyệt tích hợp chuyển sang ẩn (`visibilityState=hidden`) nên xterm ngừng vẽ
  (`requestAnimationFrame` bị tạm) và không chụp màn hình được nữa; `vim`/`htop` đã chụp và đọc buffer trước đó,
  riêng `top` kiểm chứng bằng client WebSocket thẳng tới gateway (đúng chuỗi ANSI `Tasks:`/`%Cpu(s):`/`MiB Mem`,
  gửi `q` thì về prompt). `Ctrl+Shift+C/V` chưa bấm thử trên trình duyệt vì lúc đó đang có phiên thật (`vps-com`)
  mở ở tab — chỉ mới xác minh `Ctrl+C` gửi SIGINT (`sleep 30` bị ngắt, `ps` không còn process).
- Auth/SMTP: `backend/.env` đang dùng Gmail thật (`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465` → implicit TLS,
  `MAIL_FROM_NAME=ShellDeck Support`). Probe trực tiếp bằng nodemailer chiều 2026-11-10: `transport.verify()` →
  **AUTH OK** (app password hợp lệ), `sendMail()` → **550-5.4.5 Daily user sending limit exceeded** ở lệnh DATA.
  Chặn hoàn toàn phía tài khoản Google, không phải lỗi code: mọi lần gửi hiện chỉ log
  `ERROR: Verify e-mail could not be sent`, API vẫn 201/200. Chỉ có hai cách = chờ Google reset hạn mức hoặc đổi sang
  tài khoản SMTP khác (sửa 4 dòng env, không đụng code). Block mailpit (`127.0.0.1:1026`,
  inbox `http://localhost:8026`) để nguyên dưới dạng comment:
  `docker run -d --name shelldeck-mailpit -p 1026:1025 -p 8026:8025 axllent/mailpit`.
  App password Gmail đã lộ trong chat, cần thu hồi và tạo lại.
- Auth: thêm biến `MAIL_FROM_NAME` (rỗng thì fallback `APP_NAME`) để tên người gửi là "ShellDeck Support" thay vì
  lấy theo `APP_NAME` (biến này còn dùng cho template và issuer TOTP nên không đổi `APP_NAME`).
- Auth (fix): `register` và `forgotPassword` gọi `sendVerifyEmail`/`sendResetPasswordEmail` không bọc try/catch, nên
  khi SMTP lỗi API trả 500 trong lúc user + token đã commit (lần bấm sau bị "Email is already in use", và user
  không bao giờ nhận link verify). Nay lỗi mail chỉ `logger.error`, API vẫn 201/200.
- Auth (fix): hai request `POST /auth/login` của cùng một user trong cùng một giây trả **500** vì `generateTokens` ký
  refresh token JWT chỉ với `sub/email/iat` (đơn vị giây) nên hai token trùng nhau, va chạm unique
  `refresh_tokens.token`; interceptor `refresh-token` chạy song song hoặc double-click nút Đăng nhập là gặp ngay.
  Đã thêm `jwtid: randomUUID()` trong `JWTService.generateRefreshToken` — 3 login song song trả 200 với 3 cookie khác
  nhau, refresh/logout vẫn thu hồi đúng.
- Auth (fix): bấm Đăng ký trên `http://localhost:3000` báo network error vì `lib/axios/config.ts` có fallback cứng
  `http://localhost:8080/api/v1` (repo không có `frontend/.env`), mà 8080 trên máy này do container nginx của project
  khác (`woker-rent-gateway`) chiếm — preflight trả 204 không có `Access-Control-Allow-Origin` nên trình duyệt chặn.
  Fallback đổi thành `/api/v1` (đi qua proxy Vite, hết CORS), proxy đọc port backend từ `BACKEND_PORT` (mặc định 8080),
  và `frontend/.env.local` (đã gitignore) đặt `BACKEND_PORT=8090` theo `PORT` trong `backend/.env`.
- B03: code có sẵn trong zip, đã rà theo checklist và thêm test `host.service.test.ts` (14 test pass, mock repository +
  CryptoService thật): mã hóa secret/passphrase thành `v1:...` trước khi lưu, response không bao giờ chứa secret,
  user B đọc/sửa/xóa host của user A → 404, không gửi `secret` khi PATCH thì giữ nguyên bản cũ, đổi hostname/port thì
  xóa `hostKeyFingerprint` (đổi port cũng xóa vì server identity đổi — lưu ý nếu thấy kỳ thì chỉnh lại).
- B04: `src/common/utils/network-guard.ts` chặn loopback/private (10/8, 172.16/12, 192.168/16, CGNAT 100.64/10),
  link-local (169.254.169.254), multicast/broadcast, `fc00::/7`, `fe80::/10`, `::1`, `::`, IPv4-mapped IPv6
  (`::ffff:127.0.0.1` coi như IPv4 thường); `ALLOWED_HOSTS` set thì ưu tiên allowlist; `ALLOW_PRIVATE_HOSTS=true` bỏ qua.
  Chống DNS rebinding: `SshService.connect` resolve DNS trước rồi **connect tới IP** đã resolve. Guard chạy khi
  tạo/sửa host và trước mọi lần connect (terminal, test, SFTP). 18 test pass. Lưu ý: regex hextet IPv6 phải là
  `/^fe[89ab][0-9a-f]:/` (không phải `{2}`) — lỗi đã sửa.
- B07: entity + migration `1780000001000-AddSessionLogsTable` (verify run/revert trên postgres 17 tạm cổng 5433, đã xóa:
  run tạo bảng đúng cột, FK CASCADE/SET NULL, 2 index; revert sạch). `GET /sessions` trả envelope
  `{ sessions: { entries, limit, offset, total_count } }` khớp frontend `sessions.service.ts`. Job retention chạy hourly,
  đọc `SESSION_LOG_RETENTION_DAYS` (default 90). Terminal ghi log khi SSH ready (kể cả case đã closed trước khi log kịp mở)
  và đóng log với mọi close reason; `clientIp` lấy từ `req.socket.remoteAddress` ở gateway. 5 test service + 14 test gateway pass.
  Migration `migration:generate` chỉ khác tên FK constraint (TypeORM hash tên) so với bản viết tay, semantics y hệt — không phải drift.
- B08: module `sftp/` mount qua `router.use(SftpRoute)` trong `host.route.ts` (route định nghĩa full path `/:id/sftp/*`).
  Path util: relative-to-home, chặn NUL/`..` chui lên/absolute; 7 test pass. Connection pool per `(userId, hostId)`,
  idle 60s, sweeper 15s, đóng hết khi shutdown. Upload: multer 2.0.2 ghi temp rồi `fastPut`, **luôn** unlink temp file
  kể cả lỗi. Host chưa trust fingerprint → `BadRequestError('HOST_KEY_UNVERIFIED: ...')` (400) để client hướng dẫn test trước.
  Nghiệm thu bằng sshd thật (container `lscr.io/linuxserver/openssh-server`, cổng 2222, đã xóa): list/mkdir/upload 20MB
  (temp deleted, 286–514ms)/download checksum SHA-256 khớp/rename/recursive delete — tất cả OK.
  Lưu ý đã gặp: ssh2 SFTP errors dùng `code` **số** (2=NO_SUCH_FILE, 3=PERMISSION_DENIED) chứ không phải 'ENOENT' — mapper đã map cả hai.
- Env mới (đã thêm vào `backend/.env.example`, `infra/docker/.env.example`, `docker-compose.yml`):
  `ALLOW_PRIVATE_HOSTS`, `ALLOWED_HOSTS`, `SFTP_MAX_UPLOAD_MB`, `SESSION_LOG_RETENTION_DAYS`. `vitest.config.ts` đặt
  `ALLOW_PRIVATE_HOSTS: 'true'` vì test connect loopback.
- Tổng thể sau B03/B04/B07/B08: `pnpm lint` 0 lỗi 0 warning, `pnpm type-check` sạch, `pnpm test` 78/78 pass.
- Auth: trang `/verify-email` (6 ô nhập mã) không khớp contract. Email gửi link `?token=<token ký random>`; page đọc
  `token` rồi làm `token.slice(0, 6).replace(/\D/g, '')` (`pages/auth/verify-email/index.tsx:32`) — với token kiểu đó
  kết quả thường chỉ còn vài chữ số (link test ra `"0"`), và nút bị disable nên không xác thực được. Ngoài ra
  `pages/auth/register/store.ts:25` điều hướng `/verify-email` **không kèm** `token` nên sau khi đăng ký cũng trống.
  Backend `POST /auth/verify-email` chỉ nhận `token`, không có OTP 6 số. Cần chủ repo chốt: đổi page thành bấm link
  verify tự động, hay thêm OTP 6 số vào backend. Ngoài phạm vi task đang làm, chưa sửa.
- B09: module `monitor` không tồn tại trong repo nên chọn phương án "service nhẹ riêng" theo đúng task cho phép:
  `host-health.service.ts` (probe TCP + job) + `host-health.store.ts` (NodeCache thuần). Tách store ra riêng vì
  `host.mapper.ts` cần đọc status cho **mọi** response — nếu mapper import service (kéo `host.repository` → `data-source`
  → entities) thì test mapper bị lỗi `ColumnTypeUndefinedError` (TypeORM cần `reflect-metadata` trước entity).
  Status in-memory, restart về `unknown`, không cần cột DB; job qua env `HOST_HEALTH_CHECK_INTERVAL_SEC`
  (default 60s), chu kỳ đầu sau 5s. `HostService.testHost` và `deleteHost` cũng ghi/clear health.
  Nghiệm thu E2E thật: sshd container cổng 2222, `HOST_HEALTH_CHECK_INTERVAL_SEC=2` — host `up` khi sshd chạy,
  `docker stop sshd` → `down` trong ≤ 1 chu kỳ (log "Host status changed" up/down khớp từng lần tắt/bật).
  Lưu ý: khi DB chết, chu kỳ check log lỗi mỗi interval (chỉ log, không crash).
- B10: entity `Snippet` + migration `1780000002000-AddSnippetsTable` (unique `(user_id, name)`, FK CASCADE,
  verify run/revert trên postgres 17 tạm cổng 5433 — sạch; `migration:generate` chỉ khác tên FK như B07, không drift).
  Module `snippets/` theo mẫu hosts: unique name per user → 409, hard delete, sort theo name, search name+command+description,
  command ≤ 4KB (`SNIPPET_COMMAND_MAX_LENGTH`). Backend không chạy snippet (chỉ CRUD; OpenAPI ghi rõ "never executed by the backend").
  10 test service pass; E2E thật: create/list/update/delete 200/201/409 đúng.
- B11: cột `record_sessions boolean NOT NULL DEFAULT false` (migration `1780000003000`), DTO create/update host.
  `recording.service.ts` ghi asciicast v2 **đồng bộ** (`fs.writeSync`, vì output terminal nhỏ và test đọc file ngay
  sau `stop()` — phiên bản stream async đầu tiên làm file chưa tồn tại khi test stat, và unhandled ENOENT khi test
  cleanup temp dir trước khi stream flush). Cap size `RECORDING_MAX_SIZE_MB` (default 20) — quá cap thì dừng ghi,
  đóng file, file vẫn hợp lệ; retention `RECORDING_RETENTION_DAYS` (default 7) purge job hourly gộp vào
  `session-log.job.ts`. Endpoint `GET /sessions/:id/recording` (validateParam uuid + ownership check → 404 nếu không
  phải của user), `Content-Type: text/x-asciicast`. Mapper `SessionLog` thêm `hasRecording` cho UI nút phát lại.
  Nghiệm thu E2E thật: tạo host `recordSessions:true` → trust key → ticket → WS gõ `echo hi-from-record` →
  `GET /sessions` có `hasRecording: true` → tải `.cast` về: header v2 đúng (`version/width/height/timestamp/env`)
  + events `[elapsed,"o",text]` chứa output gõ. Cảnh báo ghi mật khẩu đã vào `docs/security.md` (mục "Ghi phiên phát lại").
  Docker compose thêm volume `shelldeck-recordings` mount `/app/recordings` (workdir container là `/app`).
- Env mới (đã thêm vào `backend/.env.example`, `infra/docker/.env.example`, `docker-compose.yml`):
  `HOST_HEALTH_CHECK_INTERVAL_SEC` (B09), `RECORDINGS_DIR`, `RECORDING_MAX_SIZE_MB`, `RECORDING_RETENTION_DAYS` (B11).
- Tổng thể sau B09/B10/B11: `pnpm lint` 0 lỗi 0 warning, `pnpm type-check` sạch, `pnpm test` 99/99 pass.
  Nghiệm thu E2E một lần bằng script dùng API thật (postgres tạm cổng 5433, sshd cổng 2222, API 8090 — đã xóa hết).
  Không commit gì — mọi thay đổi ở working tree.
- B12: `backend/src/modules/plugins/` (`plugin.types.ts` manifest zod + kiểu ctx, `plugin.service.ts` nạp/dispatch,
  `plugin.route.ts` router rỗng để `modules/index.ts` mount `/api/v1/plugins` sau `AuthenticateMiddleware`).
  `bootstrap` gọi `PluginService.load()` + `registerRoutes(PluginRoute)` trước `listen` (`index.ts`). Plugin là CommonJS,
  nạp bằng `createRequire` từ file `main`; `main` bắt buộc nằm trong thư mục plugin (chặn `../`). Hook nhận object đã lọc
  theo danh sách cho phép (`userId, sessionId, hostLabel` + `startedAt`/`endedAt, reason`) rồi `Object.freeze`, nên không có
  đường nào lộ secret; dispatch chạy fire-and-forget (plugin treo không chặn terminal). Mẫu: `plugins/example-webhook`
  (`EXAMPLE_WEBHOOK_URL`), tài liệu `docs/plugin-guide.md`. Docker: `plugins/` mount read-only vào `/app/plugins`.
  Nghiệm thu: `pnpm test` 111/111 (11 test plugin mới: `plugin.service.test.ts` + `example-plugin.test.ts`, và 1 test gateway
  kiểm tra hook bắn đúng ctx), container API log
  `Plugins loaded ["example-webhook@0.1.0"]`, `GET /api/v1/plugins/example-webhook/events` → 401 khi chưa đăng nhập, 200 sau khi login.
- I01: nghiệm thu bằng project compose tạm `shelldeck-accept` (env sinh mới từ `.env.example`, `WEB_PORT=8099`), không đụng
  container/volume dev. `docker compose config` hợp lệ; `docker compose build` build lại cả hai image; `up -d` → `db`/`api`/`web` đều
  `healthy` (HEALTHCHECK của `api.Dockerfile` gọi `/api/v1/health`), API log `Migrations applied: 11` (`AUTO_MIGRATE=true`,
  `data-source.ts` không tự migrate — vẫn cần `runMigrations()` trong bootstrap), qua nginx: `/` 200, SPA fallback `/hosts` 200,
  `/api/v1/health` 200, `POST /auth/register` 201 + `POST /auth/login` 200. Sau đó `down -v` dọn sạch (volume accept đã xóa).
  Thêm mới trong compose: `env_file: .env` cho `api` (biến lạ, ví dụ của plugin, không cần sửa compose), mount `../../plugins`,
  biến `PLUGINS_DIR`; đường dẫn build `context: ../..` giữ nguyên vì compose vẫn ở `infra/docker/`.
  Chủ repo chốt **không** đưa compose/`.env.example`/Dockerfile ra gốc repo (note cũ ở dòng trên vẫn đúng), nên các mục
  "`frontend/Dockerfile`", "`docker-compose.yml` gốc", "`.env.example` gốc" trong checklist được nghiệm thu ở vị trí `infra/docker/`.
- Env mới (B12): `PLUGINS_DIR` (mặc định `plugins`, Docker `/app/plugins`) — thêm vào `backend/src/common/config/env.ts`,
  `backend/.env.example`, `infra/docker/.env.example`, `infra/docker/docker-compose.yml`; `EXAMPLE_WEBHOOK_URL` chỉ plugin mẫu đọc
  trực tiếp từ `process.env` (không khai báo zod, không bắt buộc).
- Môi trường máy dev khi nghiệm thu I01: đĩa C: 99% (còn ~4.8 GB) nên lần build đầu của Docker fail với
  `no space left on device`; build lại thì thành công. Có thể cần `docker builder prune` (chưa chạy — ảnh hưởng image khác).
