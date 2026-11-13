import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, FileUp } from 'lucide-react'
import { useHosts } from '../hooks'

const hostSchema = z.object({
  name: z.string().trim().min(1, 'Tên không được trống').max(100),
  hostname: z.string().trim().min(1, 'Hostname/IP không được trống').max(255),
  port: z.number({ message: 'Cổng không hợp lệ' }).int().min(1, 'Cổng 1–65535').max(65535, 'Cổng 1–65535'),
  username: z.string().trim().min(1, 'Username không được trống').max(100),
  authType: z.enum(['password', 'private_key']),
  secret: z.string().max(16 * 1024, 'Tối đa 16KB'),
  passphrase: z.string().max(1024),
  tags: z.string(),
  recordSessions: z.boolean()
})

type HostFormValues = z.infer<typeof hostSchema>

const inputStyle = (hasError?: boolean) => ({
  background: 'var(--color-bg)',
  border: `1.5px solid ${hasError ? 'var(--color-down)' : 'var(--color-border)'}`,
  color: 'var(--color-text)'
})

const labelClass = 'text-xs font-bold uppercase tracking-wider'

export function HostModal() {
  const { showModal, editingHost, closeModal, submitHost, isSaving } = useHosts()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors }
  } = useForm<HostFormValues>({ resolver: zodResolver(hostSchema) })

  const authType = watch('authType')
  const isEditing = Boolean(editingHost)

  useEffect(() => {
    if (!showModal) return
    reset(
      editingHost
        ? {
            name: editingHost.name,
            hostname: editingHost.hostname,
            port: editingHost.port,
            username: editingHost.username,
            authType: editingHost.authType,
            secret: '', // never sent back by the API
            passphrase: '',
            tags: editingHost.tags.join(', '),
            recordSessions: editingHost.recordSessions
          }
        : {
            name: '',
            hostname: '',
            port: 22,
            username: '',
            authType: 'password',
            secret: '',
            passphrase: '',
            tags: '',
            recordSessions: false
          }
    )
  }, [showModal, editingHost, reset])

  if (!showModal) return null

  const onSubmit = (values: HostFormValues) => {
    if (!isEditing && !values.secret) {
      setError('secret', { message: 'Bắt buộc nhập mật khẩu hoặc private key' })
      return
    }

    const tags = values.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    submitHost({
      name: values.name,
      hostname: values.hostname,
      port: values.port,
      username: values.username,
      authType: values.authType,
      tags,
      recordSessions: values.recordSessions,
      // Empty secret while editing = keep the stored one.
      ...(values.secret ? { secret: values.secret } : {}),
      ...(values.authType === 'private_key' && values.passphrase ? { passphrase: values.passphrase } : {})
    } as Parameters<typeof submitHost>[0])
  }

  const onPickKeyFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setValue('secret', String(reader.result ?? ''), { shouldValidate: true })
    reader.readAsText(file)
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className='w-full max-w-lg rounded-3xl p-6 flex flex-col gap-5'
        style={{
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--clay-shadow-lg)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-extrabold' style={{ color: 'var(--color-text)' }}>
            {isEditing ? 'Chỉnh sửa host' : 'Thêm host mới'}
          </h2>
          <button
            onClick={closeModal}
            aria-label='Đóng'
            className='w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer'
            style={{ background: 'var(--color-bg)', color: 'var(--color-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-1.5'>
            <label className={labelClass} style={{ color: 'var(--color-muted)' }}>
              Tên *
            </label>
            <input
              {...register('name')}
              placeholder='Ví dụ: VPS production'
              className='w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none'
              style={inputStyle(!!errors.name)}
            />
            {errors.name && (
              <span className='text-xs' style={{ color: 'var(--color-down)' }}>
                {errors.name.message}
              </span>
            )}
          </div>

          <div className='grid grid-cols-3 gap-3'>
            <div className='flex flex-col gap-1.5 col-span-2'>
              <label className={labelClass} style={{ color: 'var(--color-muted)' }}>
                Hostname / IP *
              </label>
              <input
                {...register('hostname')}
                placeholder='192.168.1.10'
                className='w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none'
                style={inputStyle(!!errors.hostname)}
              />
              {errors.hostname && (
                <span className='text-xs' style={{ color: 'var(--color-down)' }}>
                  {errors.hostname.message}
                </span>
              )}
            </div>
            <div className='flex flex-col gap-1.5'>
              <label className={labelClass} style={{ color: 'var(--color-muted)' }}>
                Cổng
              </label>
              <input
                {...register('port', { valueAsNumber: true })}
                type='number'
                className='w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none'
                style={inputStyle(!!errors.port)}
              />
              {errors.port && (
                <span className='text-xs' style={{ color: 'var(--color-down)' }}>
                  {errors.port.message}
                </span>
              )}
            </div>
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className={labelClass} style={{ color: 'var(--color-muted)' }}>
              Username *
            </label>
            <input
              {...register('username')}
              placeholder='root'
              autoComplete='off'
              className='w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none'
              style={inputStyle(!!errors.username)}
            />
            {errors.username && (
              <span className='text-xs' style={{ color: 'var(--color-down)' }}>
                {errors.username.message}
              </span>
            )}
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className={labelClass} style={{ color: 'var(--color-muted)' }}>
              Xác thực
            </label>
            <div className='flex gap-4 text-sm font-medium'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input type='radio' value='password' {...register('authType')} /> Mật khẩu
              </label>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input type='radio' value='private_key' {...register('authType')} /> Private key
              </label>
            </div>
          </div>

          <div className='flex flex-col gap-1.5'>
            <div className='flex items-center justify-between'>
              <label className={labelClass} style={{ color: 'var(--color-muted)' }}>
                {authType === 'private_key' ? 'Private key (PEM)' : 'Mật khẩu'} {isEditing ? '' : '*'}
              </label>
              {authType === 'private_key' && (
                <label
                  className='flex items-center gap-1 text-xs font-bold cursor-pointer'
                  style={{ color: 'var(--color-primary)' }}
                >
                  <FileUp size={13} /> Chọn file
                  <input type='file' className='hidden' onChange={(e) => onPickKeyFile(e.target.files?.[0])} />
                </label>
              )}
            </div>
            {authType === 'private_key' ? (
              <textarea
                {...register('secret')}
                rows={5}
                spellCheck={false}
                autoComplete='off'
                placeholder={isEditing ? 'Để trống để giữ nguyên khoá hiện tại' : '-----BEGIN OPENSSH PRIVATE KEY-----'}
                className='w-full px-4 py-2.5 rounded-xl text-xs font-mono outline-none'
                style={inputStyle(!!errors.secret)}
              />
            ) : (
              <input
                {...register('secret')}
                type='password'
                autoComplete='new-password'
                placeholder={isEditing ? 'Để trống để giữ nguyên mật khẩu hiện tại' : ''}
                className='w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none'
                style={inputStyle(!!errors.secret)}
              />
            )}
            {errors.secret && (
              <span className='text-xs' style={{ color: 'var(--color-down)' }}>
                {errors.secret.message}
              </span>
            )}
            <span className='text-xs' style={{ color: 'var(--color-muted)' }}>
              Được mã hoá AES-256-GCM trên server và không bao giờ hiển thị lại.
            </span>
          </div>

          {authType === 'private_key' && (
            <div className='flex flex-col gap-1.5'>
              <label className={labelClass} style={{ color: 'var(--color-muted)' }}>
                Passphrase (nếu có)
              </label>
              <input
                {...register('passphrase')}
                type='password'
                autoComplete='new-password'
                className='w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none'
                style={inputStyle()}
              />
            </div>
          )}

          <div className='flex flex-col gap-1.5'>
            <label className={labelClass} style={{ color: 'var(--color-muted)' }}>
              Tags (phân cách bằng dấu phẩy)
            </label>
            <input
              {...register('tags')}
              placeholder='prod, web'
              className='w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none'
              style={inputStyle()}
            />
          </div>

          <div
            className='rounded-2xl p-4 space-y-2'
            style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}
          >
            <label
              className='flex items-center gap-2.5 text-sm font-bold cursor-pointer'
              style={{ color: 'var(--color-text)' }}
            >
              <input type='checkbox' {...register('recordSessions')} />
              Ghi phiên (phát lại asciicast)
            </label>
            <p className='text-xs' style={{ color: 'var(--color-warning)' }}>
              ⚠ CẢNH BÁO: bản ghi lưu mọi nội dung hiển thị trên màn hình terminal — bao gồm cả mật khẩu bạn gõ vào (ví
              dụ khi chạy sudo). File ghi nằm trên server dạng văn bản thuần và bị xoá sau 7 ngày. Chỉ bật khi bạn thực
              sự hiểu rủi ro.
            </p>
          </div>

          <div className='flex gap-3 pt-1'>
            <button
              type='button'
              onClick={closeModal}
              className='flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer'
              style={{
                background: 'var(--color-bg)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-muted)'
              }}
            >
              Huỷ
            </button>
            <button
              type='submit'
              disabled={isSaving}
              className='flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-60 btn-primary'
              style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
            >
              {isSaving && <Loader2 size={16} className='animate-spin' />}
              {isEditing ? 'Lưu thay đổi' : 'Thêm host'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
