# Giấy phép bên thứ ba / Third-party licenses

> Bản khởi tạo. Task I05 sẽ chạy `pnpm dlx license-checker --production --summary` ở `backend/` và `frontend/`, điền phiên bản và kiểm tra không có GPL/AGPL/SSPL.
> Starter table; task I05 fills in versions after running the license checker.

| Thành phần | Giấy phép | Trạng thái |
| --- | --- | --- |
| React, Vite, Tailwind CSS, Zustand, TanStack Query | MIT | đang dùng |
| Express, TypeORM, pg, zod, pino | MIT | đang dùng |
| xterm.js, ws, ssh2 | MIT | dự kiến (F04, B05, B06) |
| PostgreSQL | PostgreSQL License | đang dùng (Docker image) |
| Nginx | BSD-2-Clause | đang dùng (Docker image) |

Kết luận tương thích với MIT: `<TODO(I05)>`.
