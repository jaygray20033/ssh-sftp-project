# Quyền riêng tư / Privacy

ShellDeck là phần mềm tự triển khai: dữ liệu nằm trên server của bạn, không gửi tới bên thứ ba (trừ dịch vụ email/Google bạn tự cấu hình).

| Dữ liệu | Lưu ở đâu | Ghi chú |
| --- | --- | --- |
| Email, tên, mật khẩu (băm bcrypt), 2FA | PostgreSQL | Mật khẩu không thể khôi phục |
| Thông tin host (tên, địa chỉ, user) | PostgreSQL | Secret được mã hóa |
| Nhật ký phiên (host, thời gian, IP) | PostgreSQL | **Không** ghi nội dung gõ/output |
| Nội dung terminal | Không lưu | Trừ khi bật ghi phiên (tùy chọn, ngoài MVP) |

English: ShellDeck is self-hosted; all data stays on your server. Session logs store metadata only, never terminal content.
