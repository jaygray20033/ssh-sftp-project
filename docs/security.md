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

## Dự kiến (xem TODO)

- Giải mã chỉ trong bộ nhớ ngay trước khi kết nối (B05); ticket WebSocket dùng một lần TTL 30 giây (B06); SSRF guard (B04).

## Rủi ro còn lại

- Quản trị viên server có thể đọc credential (cùng nắm DB và khóa).
- Ghi phiên (nếu bật) có thể chứa mật khẩu gõ vào.
