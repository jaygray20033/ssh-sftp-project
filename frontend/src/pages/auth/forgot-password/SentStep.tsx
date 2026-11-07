import { Mail, TriangleAlert, Loader2 } from 'lucide-react'
import { AuthCard, BackLink, AuthDivider, StatusBar } from '../components'

interface Props {
  email: string
  loading: boolean
  onResend: () => void
}

export function SentStep({ email, loading, onResend }: Props) {
  return (
    <>
      <div className='text-center mb-6'>
        <div className='flex justify-center mb-4'>
          <div
            className='w-16 h-16 rounded-2xl flex items-center justify-center'
            style={{
              background: 'var(--color-primary-light)',
              border: '2px solid rgba(124,58,237,0.2)',
              boxShadow: '0 8px 24px rgba(124,58,237,0.15)'
            }}
          >
            <Mail className='w-8 h-8' style={{ color: 'var(--color-primary)' }} strokeWidth={1.8} />
          </div>
        </div>
        <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-text)' }}>
          Kiểm tra email
        </h1>
        <p className='text-sm mt-2 font-medium' style={{ color: 'var(--color-muted)' }}>
          Đã gửi link đến
        </p>
        <p className='text-sm font-bold mt-0.5' style={{ color: 'var(--color-primary)' }}>
          {email}
        </p>
      </div>

      <AuthCard>
        <div className='space-y-3 mb-5'>
          {['Mở email từ ShellDeck', 'Nhấn link "Đặt lại mật khẩu"', 'Nhập mã OTP 6 chữ số', 'Tạo mật khẩu mới'].map(
            (label, i) => (
              <div key={i} className='flex items-center gap-3'>
                <div
                  className='w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold'
                  style={{
                    background: 'var(--color-primary-light)',
                    border: '1.5px solid rgba(124,58,237,0.25)',
                    color: 'var(--color-primary)'
                  }}
                >
                  {i + 1}
                </div>
                <span className='text-sm font-medium' style={{ color: 'var(--color-text)' }}>
                  {label}
                </span>
              </div>
            )
          )}
        </div>

        <div
          className='flex items-start gap-2.5 p-3.5 rounded-2xl mb-5'
          style={{
            background: 'rgba(245,158,11,0.07)',
            border: '2px solid rgba(245,158,11,0.18)'
          }}
        >
          <TriangleAlert className='w-4 h-4 mt-0.5 shrink-0' style={{ color: '#D97706' }} strokeWidth={2} />
          <p className='text-xs leading-relaxed font-medium' style={{ color: '#92400E' }}>
            Link hết hạn sau <strong>15 phút</strong>. Kiểm tra thư mục spam nếu không thấy email.
          </p>
        </div>

        <button
          type='button'
          disabled={loading}
          onClick={onResend}
          className='w-full py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed'
          style={{
            background: 'transparent',
            border: `2px solid ${loading ? '#E5E7EB' : 'rgba(124,58,237,0.3)'}`,
            color: loading ? 'var(--color-muted)' : 'var(--color-primary)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(124,58,237,0.06)'
              e.currentTarget.style.borderColor = 'var(--color-primary)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            if (!loading) e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'
          }}
        >
          {loading ? (
            <span className='flex items-center justify-center gap-2'>
              <Loader2 size={16} className='animate-spin' />
              Đang gửi lại...
            </span>
          ) : (
            'Gửi lại email'
          )}
        </button>

        <AuthDivider />
        <BackLink to='/login'>Quay lại đăng nhập</BackLink>
      </AuthCard>

      <StatusBar />
    </>
  )
}
