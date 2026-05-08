import { LocalStorageAdapter } from './local'
import type { StorageAdapter } from './types'

export const storage: StorageAdapter = new LocalStorageAdapter()
export type { StorageAdapter } from './types'
