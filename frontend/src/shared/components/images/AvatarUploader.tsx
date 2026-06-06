import React, { useRef, useState } from 'react'
import { Camera, X, User } from '@phosphor-icons/react'
import { validateImageFile, readFileAsDataUrl } from '../../services/uploadApi'

interface AvatarUploaderProps {
  currentUrl?: string | null
  onFileSelected: (file: File, previewUrl: string) => void
  onRemove?: () => void
  size?: number
  disabled?: boolean
  name?: string
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentUrl,
  onFileSelected,
  onRemove,
  size = 96,
  disabled = false,
  name,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = async (file: File) => {
    setError(null)
    try {
      validateImageFile(file)
      const dataUrl = await readFileAsDataUrl(file)
      setPreview(dataUrl)
      onFileSelected(file, dataUrl)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) processFile(f)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    const f = e.dataTransfer.files?.[0]
    if (f) processFile(f)
  }

  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : null

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Avatar circle */}
        <div
          className={`rounded-full overflow-hidden flex items-center justify-center cursor-pointer transition-all ${isDragOver ? 'ring-4' : 'ring-2'}`}
          style={{
            width: size,
            height: size,
            background: preview ? 'transparent' : 'var(--color-primary-light)',
            border: `3px solid ${isDragOver ? 'var(--color-primary)' : 'var(--border-color)'}`,
            boxShadow: isDragOver ? '0 0 0 4px var(--color-primary-glow)' : 'var(--shadow-sm)',
          }}
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          {preview ? (
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          ) : initials ? (
            <span
              className="font-bold select-none"
              style={{ fontSize: size * 0.32, color: 'var(--color-primary)' }}
            >
              {initials}
            </span>
          ) : (
            <User size={size * 0.42} style={{ color: 'var(--color-primary)' }} />
          )}
        </div>

        {/* Camera overlay button */}
        {!disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-0 right-0 rounded-full p-1.5 border-2 transition-all"
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              border: '2px solid var(--color-surface)',
              boxShadow: 'var(--shadow-sm)',
            }}
            title="Cambiar foto"
          >
            <Camera size={14} weight="bold" />
          </button>
        )}

        {/* Remove button */}
        {preview && !disabled && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setPreview(null)
              onRemove()
            }}
            className="absolute top-0 right-0 rounded-full p-1 border-2 transition-all"
            style={{
              background: 'var(--color-danger)',
              color: 'white',
              border: '2px solid var(--color-surface)',
            }}
            title="Eliminar foto"
          >
            <X size={10} weight="bold" />
          </button>
        )}
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        {disabled ? 'Sin foto de perfil' : 'Haz clic o arrastra para cambiar foto'}
      </p>

      {error && (
        <p className="text-xs text-center" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}
