import React, { useRef, useState, useCallback } from 'react'
import { UploadSimple, X, Image, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { validateImageFile, readFileAsDataUrl, uploadFile } from '../../services/uploadApi'

interface ImageUploaderProps {
  currentUrl?: string | null
  onUploaded: (url: string, filename: string) => void
  onRemove?: () => void
  label?: string
  hint?: string
  disabled?: boolean
  autoUpload?: boolean
  /** If false, just previews locally without uploading */
  onFileSelected?: (file: File, previewUrl: string) => void
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentUrl,
  onUploaded,
  onRemove,
  label = 'Imagen',
  hint = 'JPG, PNG o WEBP · Máx. 5 MB',
  disabled = false,
  autoUpload = false,
  onFileSelected,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const processFile = useCallback(async (file: File) => {
    setErrorMsg(null)
    try {
      validateImageFile(file)
      const dataUrl = await readFileAsDataUrl(file)
      setPreview(dataUrl)

      if (onFileSelected) {
        onFileSelected(file, dataUrl)
        return
      }

      if (autoUpload) {
        setUploadState('uploading')
        setProgress(0)

        // Simulate progress while uploading
        const ticker = setInterval(() => {
          setProgress(p => Math.min(p + 15, 85))
        }, 180)

        try {
          const res = await uploadFile(file)
          clearInterval(ticker)
          setProgress(100)
          setUploadState('success')
          onUploaded(res.url, res.filename)
        } catch (err: any) {
          clearInterval(ticker)
          setUploadState('error')
          setErrorMsg(err.message || 'Error al subir la imagen')
          setProgress(0)
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Archivo inválido')
      setUploadState('error')
    }
  }, [autoUpload, onFileSelected, onUploaded])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    setUploadState('idle')
    setProgress(0)
    setErrorMsg(null)
    onRemove?.()
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}

      {/* Drop Zone */}
      <div
        className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ padding: preview ? '0.75rem' : '2rem' }}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-48 object-contain rounded-lg"
              style={{ borderRadius: 'var(--radius-md)' }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 btn btn-sm"
                style={{ background: 'var(--color-danger)', color: 'white', padding: '0.25rem' }}
                title="Eliminar imagen"
              >
                <X size={14} weight="bold" />
              </button>
            )}
            {/* Upload state overlay */}
            {uploadState === 'uploading' && (
              <div className="mt-2">
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Subiendo... {progress}%
                </p>
              </div>
            )}
            {uploadState === 'success' && (
              <div className="flex items-center gap-1.5 mt-2">
                <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>
                  Imagen subida correctamente
                </span>
              </div>
            )}
            {/* Replace button */}
            {uploadState !== 'uploading' && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn btn-sm btn-secondary w-full mt-2"
              >
                <UploadSimple size={14} />
                Reemplazar imagen
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="rounded-xl p-3"
              style={{ background: 'var(--color-primary-light)' }}
            >
              <Image size={28} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                {isDragOver ? 'Suelta la imagen aquí' : 'Haz clic o arrastra una imagen'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{hint}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <div
          className="flex items-start gap-2 rounded-lg p-3 text-xs"
          style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
        >
          <WarningCircle size={14} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  )
}
