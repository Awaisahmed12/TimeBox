'use client'

import { create } from 'zustand'
import { storage } from '@/lib/storage'
import { DEFAULT_SETTINGS, type Settings } from '@/types/models'

interface SettingsState {
  settings: Settings
  loaded: boolean
  load: () => Promise<void>
  patch: (p: Partial<Settings>) => Promise<void>
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  async load() {
    const settings = await storage.getSettings()
    set({ settings, loaded: true })
  },
  async patch(p) {
    const next = { ...get().settings, ...p }
    set({ settings: next })
    await storage.saveSettings(next)
  },
}))
