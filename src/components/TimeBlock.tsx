'use client'

import { useRef, useState } from 'react'
import { PX_PER_MIN, snapToQuarterHour } from '@/lib/snap'
import { formatHM } from '@/lib/time'
import { useDay } from '@/store/useDay'
import { usePomodoro } from '@/store/usePomodoro'
import { useSettings } from '@/store/useSettings'
import type { Block } from '@/types/models'

const COLOR_CLASSES: Record<NonNullable<Block['color']>, string> = {
  lime: 'bg-accent/20 border-accent/60 text-text-primary-light dark:text-text-primary',
  orange: 'bg-accent2/20 border-accent2/60 text-text-primary-light dark:text-text-primary',
  blue: 'bg-blue-400/20 border-blue-400/60 text-text-primary-light dark:text-text-primary',
  pink: 'bg-pink-400/20 border-pink-400/60 text-text-primary-light dark:text-text-primary',
  gray: 'bg-muted/20 border-muted/60 text-text-primary-light dark:text-text-primary',
}

const DRAG_THRESHOLD_PX = 5

interface MoveOrigin {
  pointerId: number
  y: number
  startMin: number
  dragging: boolean
}

interface ResizeOrigin {
  pointerId: number
  y: number
  durationMin: number
}

export function TimeBlock({ block }: { block: Block }) {
  const update = useDay((s) => s.updateBlock)
  const remove = useDay((s) => s.removeBlock)
  const toggle = useDay((s) => s.toggleBlockDone)
  const startPomo = usePomodoro((s) => s.start)
  const pomoMin = useSettings((s) => s.settings.pomodoroMin)

  const [editing, setEditing] = useState(block.title === '' && !block.done)
  const [draftStart, setDraftStart] = useState<number | null>(null)
  const [draftDuration, setDraftDuration] = useState<number | null>(null)
  const moveOrigin = useRef<MoveOrigin | null>(null)
  const resizeOrigin = useRef<ResizeOrigin | null>(null)
  const blockRef = useRef<HTMLDivElement>(null)

  const startMin = draftStart ?? block.startMin
  const durationMin = draftDuration ?? block.durationMin
  const top = startMin * PX_PER_MIN
  const height = Math.max(durationMin * PX_PER_MIN, 16)
  const colorClass = COLOR_CLASSES[block.color ?? 'lime']

  function onMovePointerDown(e: React.PointerEvent) {
    if (editing) return
    const target = e.target as HTMLElement
    if (target.closest('[data-resize-handle]')) return
    if (target.closest('[data-no-drag]')) return
    moveOrigin.current = {
      pointerId: e.pointerId,
      y: e.clientY,
      startMin: block.startMin,
      dragging: false,
    }
    blockRef.current?.setPointerCapture?.(e.pointerId)
  }

  function onMovePointerMove(e: React.PointerEvent) {
    const origin = moveOrigin.current
    if (!origin || origin.pointerId !== e.pointerId) return
    const dy = e.clientY - origin.y
    if (!origin.dragging && Math.abs(dy) < DRAG_THRESHOLD_PX) return
    if (!origin.dragging) {
      origin.dragging = true
    }
    e.preventDefault()
    const dMin = Math.round(dy / PX_PER_MIN)
    const next = Math.max(
      0,
      Math.min(24 * 60 - durationMin, snapToQuarterHour(origin.startMin + dMin)),
    )
    setDraftStart(next)
  }

  function onMovePointerUp(e: React.PointerEvent) {
    const origin = moveOrigin.current
    blockRef.current?.releasePointerCapture?.(e.pointerId)
    if (origin?.dragging && draftStart !== null && draftStart !== block.startMin) {
      update(block.id, { startMin: draftStart })
    }
    moveOrigin.current = null
    setDraftStart(null)
  }

  function onResizePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    resizeOrigin.current = {
      pointerId: e.pointerId,
      y: e.clientY,
      durationMin: block.durationMin,
    }
    setDraftDuration(block.durationMin)
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  function onResizePointerMove(e: React.PointerEvent) {
    const origin = resizeOrigin.current
    if (!origin || origin.pointerId !== e.pointerId) return
    const dy = e.clientY - origin.y
    const dMin = Math.round(dy / PX_PER_MIN)
    const next = Math.max(15, snapToQuarterHour(origin.durationMin + dMin))
    const cap = 24 * 60 - block.startMin
    setDraftDuration(Math.min(next, cap))
  }

  function onResizePointerUp(e: React.PointerEvent) {
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    if (
      resizeOrigin.current &&
      draftDuration !== null &&
      draftDuration !== block.durationMin
    ) {
      update(block.id, { durationMin: draftDuration })
    }
    resizeOrigin.current = null
    setDraftDuration(null)
  }

  return (
    <div
      ref={blockRef}
      data-block
      onPointerDown={onMovePointerDown}
      onPointerMove={onMovePointerMove}
      onPointerUp={onMovePointerUp}
      onPointerCancel={onMovePointerUp}
      className={`absolute left-1 right-1 rounded border ${colorClass} ${
        block.done ? 'opacity-50 line-through' : ''
      } ${moveOrigin.current?.dragging ? 'shadow-lg ring-1 ring-accent/60' : ''} touch-none select-none`}
      style={{ top, height, zIndex: moveOrigin.current?.dragging ? 20 : 5 }}
    >
      <div className="px-2 py-1 flex items-center gap-2 h-full">
        <button
          data-no-drag
          onClick={(e) => {
            e.stopPropagation()
            toggle(block.id)
            if ('vibrate' in navigator) navigator.vibrate(15)
          }}
          aria-label={block.done ? 'Mark not done' : 'Mark done'}
          className={`w-3.5 h-3.5 shrink-0 rounded-sm border ${
            block.done ? 'bg-accent border-accent' : 'border-muted-light dark:border-muted'
          }`}
        >
          {block.done && (
            <svg viewBox="0 0 16 16" className="w-full h-full text-bg">
              <path
                d="M3 8l3 3 7-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        {editing ? (
          <input
            data-no-drag
            autoFocus
            defaultValue={block.title}
            onBlur={(e) => {
              update(block.id, { title: e.currentTarget.value.trim() })
              setEditing(false)
              if (e.currentTarget.value.trim() === '' && !block.done) remove(block.id)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') {
                setEditing(false)
                if (block.title.trim() === '') remove(block.id)
              }
              e.stopPropagation()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-transparent outline-none text-xs font-mono"
            placeholder="What?"
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (moveOrigin.current?.dragging) return
              setEditing(true)
            }}
            className="flex-1 min-w-0 text-left text-xs font-mono truncate cursor-grab active:cursor-grabbing"
          >
            {block.title || <span className="text-muted-light dark:text-muted">Untitled</span>}
          </button>
        )}
        <span className="text-[9px] font-mono tabular-nums text-muted-light dark:text-muted shrink-0 pointer-events-none">
          {formatHM(startMin)}–{formatHM(startMin + durationMin)}
        </span>
        <button
          data-no-drag
          onClick={(e) => {
            e.stopPropagation()
            const cap = Math.min(pomoMin, durationMin)
            startPomo(block.id, cap)
          }}
          aria-label="Start focus timer"
          className="text-[10px] font-mono w-5 h-5 shrink-0 flex items-center justify-center rounded text-muted-light dark:text-muted hover:text-accent"
        >
          ▶
        </button>
        <button
          data-no-drag
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('Delete this block?')) remove(block.id)
          }}
          aria-label="Delete block"
          className="text-[11px] font-mono w-5 h-5 shrink-0 flex items-center justify-center rounded text-muted-light dark:text-muted hover:text-accent2"
        >
          ✕
        </button>
      </div>
      <div
        data-resize-handle
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
        className="absolute bottom-0 inset-x-0 h-3 cursor-ns-resize touch-none"
        style={{ touchAction: 'none' }}
      >
        <div className="mx-auto w-8 h-0.5 mt-1 rounded-full bg-muted-light/40 dark:bg-muted/60" />
      </div>
    </div>
  )
}
