import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuthCard } from '../components'

export function DoneStep() {
  return (
    <>
      <div className='text-center mb-6'>
        <div className='flex justify-center mb-4'>
          <div
            className='w-16 h-16 rounded-2xl flex items-center justify-center'
            style={{
              background: 'var(--color-primary-light)',
              border: '2px solid rgba(16,185,129,0.3)',
              boxShadow: '0 8px 24px rgba(16,185,129,0.2)'
            }}
          >
            <Check className='w-8 h-8' style={{ color: 'var(--color-up)' }} strokeWidth={2.5} />
          </div>
        </div>
        <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-text)' }}>
          Mật khẩu đã được đặt lại!
        </h1>
        <p className='text-sm mt-2 font-medium' style={{ color: 'var(--color-muted)' }}>
          Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ
        </p>
      </div>

      <AuthCard>
        <Link to='/login' className='btn-primary w-full text-sm'>
          Đăng nhập ngay
        </Link>
      </AuthCard>
    </>
  )
}
