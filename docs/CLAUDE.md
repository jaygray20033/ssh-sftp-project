# ShellDeck — ngữ cảnh dự án cho Claude Code

ShellDeck là web app mã nguồn mở (SSH + SFTP trong trình duyệt), thay thế PuTTY + WinSCP.
Đây là đồ án môn "Phần mềm mã nguồn mở": ngoài code chạy được, repo phải chuẩn mã nguồn mở
(LICENSE, README, CONTRIBUTING, CI, tài liệu). Danh sách việc nằm trong `docs/TODO.md`.

## Cấu trúc repo (monorepo)

```
shelldeck/
├── backend/      # Node 22, Express 5, TypeORM, PostgreSQL   (từ repo ts-backend)
├── frontend/     # React 19, Vite, Tailwind 4, Zustand, TanStack Query (từ repo ts-frontend)
├── infra/        # docker/ (compose, Dockerfile, .env.example), nginx/
├── docs/         # TODO.md + tài liệu (architecture, security, plugin-guide, THIRD_PARTY_LICENSES)
├── .github/      # workflows, issue/PR template
```

## Lệnh thường dùng

- Package manager: **pnpm** (không dùng npm/yarn).
- Backend: `pnpm dev`, `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`,
  `pnpm migration:generate src/databases/migrations/<Tên>`, `pnpm migration:run`.
- Frontend: `pnpm dev` (cổng 3000, proxy `/api` sang 8080), `pnpm lint`, `pnpm build`.
- Dev DB + SSH thử: `cd infra/docker && docker compose -f docker-compose.dev.yml up -d`.

## Quy ước backend (đã có sẵn, phải theo)

- Mỗi module trong `src/modules/<tên>/`: `*.route.ts`, `*.controller.ts`, `*.service.ts`,
  `*.repository.ts`, `dto/` (zod, import từ `zod/v4`). Mẫu chuẩn: `src/modules/monitor/`.
- Đăng ký route trong `src/modules/index.ts`; route cần đăng nhập đặt sau
  `AuthenticateMiddleware.authenticate` (đọc `req.user!.id`).
- Trả kết quả bằng `res.ok(data, { message })` / `res.created(...)`; lỗi ném từ `@common/errors`.
- Validate bằng `validateBody` / `validateQuery` trong `@common/middlewares`.
- Biến môi trường khai báo trong `src/common/config/env.ts` (zod) **và** `.env.example`.
- Entity kế thừa `BaseEntity`, nằm trong `src/databases/entities/`; mọi thay đổi schema = 1 migration mới,
  không sửa migration cũ.
- Path alias: `@common/*`, `@modules/*`, `@entities/*`, `@databases/*`, `@docs/*`.
- Logger: `pino` (`@common/config/logger`). Không dùng `console.log`.
- Mọi truy vấn dữ liệu của người dùng phải lọc theo `userId` (không để lộ dữ liệu giữa user).

## Quy ước frontend (đã có sẵn, phải theo)

- Mỗi trang trong `src/pages/<tên>/`: `index.tsx`, `store.ts` (Zustand, chỉ state UI),
  `hooks.ts` (TanStack Query), `components/`. Mẫu chuẩn: `src/pages/monitors/`.
- Gọi API qua `src/lib/services/*.service.ts` dùng `http` từ `src/lib/axios`; kiểu dữ liệu trong `src/lib/types`.
- Alias: `@lib`, `@components`, `@pages`, `@hooks`, `@stores`, `@utils`.
- Form: react-hook-form + zod. Thông báo: `sonner`. Icon: `lucide-react`.
- Chuỗi giao diện bằng **tiếng Việt**.
- Access token nằm trong bộ nhớ (`getAccessToken()`), refresh token trong cookie httpOnly.

## Quy tắc bảo mật BẮT BUỘC

1. Không bao giờ trả password, private key, passphrase (kể cả bản mã hóa) qua API. Chỉ trả cờ `hasSecret`.
2. Không bao giờ ghi secret hoặc nội dung gõ trong terminal vào log.
3. Credential của host chỉ giải mã trong bộ nhớ, ngay trước khi kết nối, không giữ lâu.
4. WebSocket terminal xác thực bằng ticket dùng một lần (TTL 30 giây), không đưa JWT lên URL.
5. Luôn kiểm tra `host.userId === req.user.id` trước khi dùng host.
6. Không commit `.env`, khóa, token. Nếu phát hiện secret trong git, dừng lại và báo.

## Quy tắc làm việc

- Mỗi lần chỉ làm **một task** trong `docs/TODO.md`, đúng phạm vi task đó. Làm xong tick `[x]` các mục đã đạt.
- Trước khi báo xong: chạy `pnpm lint && pnpm type-check && pnpm test` (backend) và
  `pnpm lint && pnpm build` (frontend) và sửa đến khi sạch.
- Commit theo Conventional Commits (commitlint đã cấu hình): `feat(hosts): ...`, `fix(terminal): ...`,
  `docs: ...`, `chore: ...`. Mỗi task 1 commit trở lên, không gộp task.
- Thêm dependency mới: chỉ dùng thư viện giấy phép MIT/Apache-2.0/BSD/ISC; ghi vào
  `docs/THIRD_PARTY_LICENSES.md` khi task I05 đã làm. Không dùng thư viện GPL/AGPL.
- Code và comment bằng tiếng Anh; tài liệu (README, docs) viết song ngữ Việt/Anh, Việt ở trên.
- Không tự ý xóa hay đổi cấu trúc ngoài phạm vi task. Nếu thấy cần, ghi vào mục "Ghi chú" cuối `docs/TODO.md`.
- Gặp điều chưa rõ (ví dụ tên tác giả trong LICENSE): để placeholder `<TODO: ...>` và nêu trong báo cáo, không đoán.
