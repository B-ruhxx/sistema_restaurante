import React, { useEffect } from 'react'
import { X } from '@phosphor-icons/react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
  footer?: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = '480px',
  footer,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h3
            className="font-bold text-base"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-icon btn-ghost btn-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="px-6 py-4 flex items-center justify-end gap-2"
            style={{ borderTop: '1px solid var(--border-color)', background: 'var(--color-surface-2)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
