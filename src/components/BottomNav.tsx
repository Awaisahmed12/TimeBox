'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: 'Today' },
  { href: '/week', label: 'Week' },
  { href: '/inbox', label: 'Brain' },
  { href: '/stats', label: 'Stats' },
  { href: '/settings', label: 'Set' },
]

export function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border-light dark:border-border bg-bg-light/90 dark:bg-bg/90 backdrop-blur">
      <div className="mx-auto max-w-[480px] grid grid-cols-5 text-[11px] font-mono uppercase tracking-wider">
        {TABS.map((t) => {
          const active = t.href === '/' ? path === '/' : path?.startsWith(t.href)
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`py-3 text-center ${active ? 'text-accent' : 'text-muted-light dark:text-muted'}`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
