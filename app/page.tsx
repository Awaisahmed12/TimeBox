'use client'

import { BottomNav } from '@/components/BottomNav'
import { Inbox } from '@/components/Inbox'
import { PomodoroBar } from '@/components/PomodoroBar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Timeline } from '@/components/Timeline'
import { Top3 } from '@/components/Top3'
import { YesterdayReview } from '@/components/YesterdayReview'
import { prettyDate } from '@/lib/time'
import { useDay } from '@/store/useDay'

export default function TodayPage() {
  const date = useDay((s) => s.date)
  const addBlock = useDay((s) => s.addBlock)

  return (
    <main className="mx-auto max-w-[480px] pb-page">
      <header className="sticky top-0 z-20 px-4 pt-safe pb-3 bg-bg-light/85 dark:bg-bg/85 backdrop-blur border-b border-border-light dark:border-border flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-light dark:text-muted">
            Today
          </div>
          <div className="font-serif text-lg leading-tight">{prettyDate(date)}</div>
        </div>
        <ThemeToggle />
      </header>

      <Top3 />

      <div className="px-2 pt-3">
        <Timeline onTapEmpty={(startMin) => addBlock({ startMin })} />
      </div>

      <Inbox />
      <PomodoroBar />
      <YesterdayReview />
      <BottomNav />
    </main>
  )
}
