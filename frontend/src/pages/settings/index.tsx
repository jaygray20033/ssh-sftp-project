import { useSettingsStore } from './store'
import { ProfileSection } from './ProfileSection'
import { PasswordSection } from './PasswordSection'
import { TwoFASection } from './TwoFASection'
import { DangerZone } from './DangerZone'

export default function SettingsPage() {
  const { activeTab, setActiveTab } = useSettingsStore()

  const tabs = [
    { key: 'profile' as const, label: 'Hồ sơ' },
    { key: 'security' as const, label: 'Bảo mật' }
  ]

  return (
    <div className='space-y-6 max-w-2xl mx-auto'>
      <div>
        <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-text)' }}>
          Cài đặt
        </h1>
        <p className='text-sm mt-0.5 font-medium' style={{ color: 'var(--color-muted)' }}>
          Quản lý tài khoản và bảo mật của bạn
        </p>
      </div>

      <div
        className='flex gap-1 p-1 rounded-2xl w-fit'
        style={{
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--clay-shadow-sm)'
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              'px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer',
              activeTab !== tab.key && 'hover:bg-(--color-primary-light) hover:text-(--color-primary)'
            ]
              .filter(Boolean)
              .join(' ')}
            style={
              activeTab === tab.key
                ? {
                    background: 'var(--cta)',
                    color: '#fff',
                    boxShadow: 'var(--clay-shadow-btn)'
                  }
                : { color: 'var(--color-muted)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && <ProfileSection />}
      {activeTab === 'security' && (
        <div className='space-y-5'>
          <PasswordSection />
          <TwoFASection />
        </div>
      )}

      <DangerZone />
    </div>
  )
}
