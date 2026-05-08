export type ID = string

export type BlockColor = 'lime' | 'orange' | 'blue' | 'pink' | 'gray'

export interface Block {
  id: ID
  title: string
  startMin: number
  durationMin: number
  color?: BlockColor
  done: boolean
  fromInboxId?: ID
  notes?: string
  pomodoroFocusedMin?: number
}

export interface Top3Slot {
  id: ID
  title: string
  done: boolean
  blockId?: ID
}

export type Top3Tuple = [Top3Slot | null, Top3Slot | null, Top3Slot | null]

export interface DaySnapshot {
  date: string
  top3: Top3Tuple
  blocks: Block[]
  brainDump?: string
}

export interface InboxItem {
  id: ID
  title: string
  createdAt: number
  scheduledOnDate?: string
  done: boolean
}

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  dayStartHour: number
  dayEndHour: number
  pomodoroMin: number
  lastOpenedDate?: string
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  dayStartHour: 6,
  dayEndHour: 23,
  pomodoroMin: 25,
}

export function emptyDay(date: string): DaySnapshot {
  return { date, top3: [null, null, null], blocks: [] }
}
