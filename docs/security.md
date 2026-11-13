# Bảo mật / Security

> Bản nháp; hoàn thiện ở task I03.

## Mô hình tin cậy

| Thành phần | Tin cậy? | Ghi chú |
| --- | --- | --- |
| Trình duyệt người dùng | Có (của chính họ) | Access token trong bộ nhớ, refresh token ở cookie `httpOnly` |
| API + DB | Có (do chủ hệ thống vận hành) | Quản trị viên server có thể truy cập DB và khóa mã hóa |
| Máy chủ SSH đích | Không mặc định | Xác minh host key (SHA256 fingerprint) |
| Mạng | Không | Dùng HTTPS/WSS |

## Credential (đã làm)

- Mật khẩu/khóa riêng của host: mã hóa AES-256-GCM bằng `ENCRYPTION_KEY` (`backend/src/common/services/crypto.service.ts`), định dạng `v1:<iv>:<tag>:<cipher>`.
- API chỉ trả cờ `hasSecret`/`hasPassphrase` (`host.mapper.ts`, có test); `secret` không bao giờ được trả lại.
- Mọi truy vấn host lọc theo `userId`; host của người khác trả 404. Xoá host là xoá cứng (không giữ credential trong bản ghi xoá mềm).
- Đổi hostname/port của host sẽ xoá host key đã tin cậy.
- Logger che các trường `secret`, `passphrase`, `password`, `token`.
- Mất `ENCRYPTION_KEY` = mất khả năng giải mã host đã lưu. Sao lưu khóa riêng với DB.

## Nhật ký phiên (B07 — không ghi nội dung)

- `session_logs` chỉ chứa metadata: host, thời gian bắt đầu/kết thúc, IP client, lý do đóng. **Không ghi** phím gõ hay output.
- Xoá theo `SESSION_LOG_RETENTION_DAYS` (mặc định 90 ngày) bằng job chạy mỗi giờ.

## Ghi phiên phát lại (B11 — opt-in, CẢNH BÁO)

- Mỗi host có cờ `recordSessions` (**mặc định `false`**). Chỉ bật khi người dùng hiểu rủi ro — UI phải cảnh báo rõ.
- Khi bật: toàn bộ **output** của phiên terminal được ghi dạng asciicast v2 vào `RECORDINGS_DIR`
  (`backend/.env`, mặc định `recordings/`), tải về qua `GET /sessions/:id/recording` (chỉ chủ host).
- **Ghi chứa mật khẩu**: output hiển thị mọi thứ người dùng gõ — kể cả mật khẩu khi `sudo`, khi gõ `mysql -p...`,
  khi trình chỉnh sửa hiện dữ liệu nhạy cảm. File `.cast` là **plaintext**.
- Giới hạn: `RECORDING_MAX_SIZE_MB` (mặc định 20MB — dừng ghi khi quá) và `RECORDING_RETENTION_DAYS`
  (mặc định 7 ngày, job xoá file cũ chạy mỗi giờ cùng job xoá `session_logs`).
- Khuyến nghị khi triển khai: để `recordSessions=false` mặc định; nếu bật, đặt `RECORDING_RETENTION_DAYS` nhỏ
  và mount `RECORDINGS_DIR` vào volume riêng với permission chặt; cân nhắc mã hoá volume (LUKS).

## Dự kiến (xem TODO)

- Giải mã chỉ trong bộ nhớ ngay trước khi kết nối (B05); ticket WebSocket dùng một lần TTL 30 giây (B06); SSRF guard (B04).

## Rủi ro còn lại

- Quản trị viên server có thể đọc credential (cùng nắm DB và khóa).
- Ghi phiên (nếu bật) có thể chứa mật khẩu gõ vào — file `.cast` plaintext, chỉ giới hạn thời gian giữ.
