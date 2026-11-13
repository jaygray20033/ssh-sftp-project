import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react'
import { SshErrorCode } from '@lib/types'
import { useHosts } from '../hooks'

// Human-readable reason for a failed connection test.
const errorMessages: Record<SshErrorCode, string> = {
  AUTH_FAILED: 'Sai username hoặc mật khẩu/khoá.',
  TIMEOUT: 'Server không phản hồi (timeout).',
  REFUSED: 'Server từ chối kết nối — cổng SSH có thể sai.',
  HOST_KEY_CHANGED: 'Host key đã thay đổi so với lần trước!',
  HOST_KEY_UNVERIFIED: 'Host key chưa được tin tưởng.',
  CONNECTION_FAILED: 'Không kết nối được tới server.'
}

export function TestResultDialog() {
  const { testResult, closeTestResult, confirmTrust, isTrusting, hosts } = useHosts()

  if (!testResult) return null

  const host = hosts.find((h) => h.id === testResult.hostId)
  const { result } = testResult
  // Unverified key: offer to trust the fingerprint just seen.
  const canTrust = !result.ok && result.fingerprint && result.code !== 'AUTH_FAILED'

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className='w-full max-w-md rounded-3xl p-6 flex flex-col gap-4'
        style={{
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--clay-shadow-lg)'
        }}
      >
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-extrabold' style={{ color: 'var(--color-text)' }}>
            Kiểm tra {host?.name ?? 'host'}
          </h2>
          <button
            onClick={closeTestResult}
            aria-label='Đóng'
            className='w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer'
            style={{ background: 'var(--color-bg)', color: 'var(--color-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {result.ok ? (
          <div
            className='rounded-2xl p-4 flex items-start gap-3'
            style={{ background: 'rgba(34,197,94,0.08)', border: '1.5px solid rgba(34,197,94,0.4)' }}
          >
            <CheckCircle2 size={20} className='shrink-0 mt-0.5' style={{ color: '#22c55e' }} />
            <div>
              <p className='text-sm font-bold' style={{ color: 'var(--color-text)' }}>
                Kết nối thành công
              </p>
              <p className='text-xs mt-0.5' style={{ color: 'var(--color-muted)' }}>
                Phản hồi sau {result.latencyMs} ms.
                {result.fingerprint ? ` Host key: ${result.fingerprint}` : ''}
              </p>
            </div>
          </div>
        ) : (
          <div
            className='rounded-2xl p-4 flex items-start gap-3'
            style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.35)' }}
          >
            <AlertTriangle size={20} className='shrink-0 mt-0.5' style={{ color: 'var(--color-down)' }} />
            <div>
              <p className='text-sm font-bold' style={{ color: 'var(--color-text)' }}>
                Kết nối thất bại ({result.code})
              </p>
              <p className='text-xs mt-0.5' style={{ color: 'var(--color-muted)' }}>
                {errorMessages[result.code] ?? result.message}
              </p>
            </div>
          </div>
        )}

        {canTrust && (
          <div
            className='rounded-2xl p-4 space-y-3'
            style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}
          >
            <div className='flex items-start gap-2.5'>
              <ShieldCheck size={18} className='shrink-0 mt-0.5' style={{ color: 'var(--color-warning)' }} />
              <div>
                <p className='text-sm font-bold' style={{ color: 'var(--color-text)' }}>
                  Tin tưởng host này?
                </p>
                <p className='text-xs mt-0.5 break-all font-mono' style={{ color: 'var(--color-muted)' }}>
                  Fingerprint: {result.fingerprint}
                </p>
                <p className='text-xs mt-1' style={{ color: 'var(--color-muted)' }}>
                  Sau khi tin tưởng, fingerprint sẽ được so khớp ở mọi lần kết nối sau để phát hiện giả mạo.
                </p>
              </div>
            </div>
            <div className='flex gap-2'>
              <button
                onClick={closeTestResult}
                className='flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer'
                style={{
                  background: 'var(--color-surface)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-muted)'
                }}
              >
                Không, huỷ
              </button>
              <button
                onClick={() => confirmTrust(testResult.hostId, result.fingerprint!)}
                disabled={isTrusting}
                className='flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-60 btn-primary'
                style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
              >
                {isTrusting && <Loader2 size={14} className='animate-spin' />}
                Tin tưởng và thử lại
              </button>
            </div>
          </div>
        )}

        {!canTrust && (
          <button
            onClick={closeTestResult}
            className='w-full py-2.5 rounded-xl text-sm font-bold cursor-pointer'
            style={{
              background: 'var(--color-bg)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  )
}
