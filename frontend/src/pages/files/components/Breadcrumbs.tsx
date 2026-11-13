import { ChevronRight } from 'lucide-react'
import { pathSegments } from '../utils'

interface BreadcrumbsProps {
  dir: string
  homeLabel: string
  onNavigate: (dir: string) => void
}

// Path bar: Home = SSH user's home, each segment links to its prefix.
export function Breadcrumbs({ dir, homeLabel, onNavigate }: BreadcrumbsProps) {
  const segments = pathSegments(dir)

  return (
    <nav className='flex items-center gap-1 text-sm font-medium flex-wrap min-w-0'>
      <button
        onClick={() => onNavigate('')}
        className='cursor-pointer hover:underline'
        style={{ color: 'var(--color-primary)' }}
      >
        {homeLabel}
      </button>

      {segments.map((segment, index) => {
        const target = segments.slice(0, index + 1).join('/')
        const isLast = index === segments.length - 1

        return (
          <span key={target} className='flex items-center gap-1'>
            <ChevronRight size={14} style={{ color: 'var(--color-muted)' }} />
            {isLast ? (
              <span className='font-bold truncate' style={{ color: 'var(--color-text)' }}>
                {segment}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(target)}
                className='cursor-pointer hover:underline'
                style={{ color: 'var(--color-primary)' }}
              >
                {segment}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}
