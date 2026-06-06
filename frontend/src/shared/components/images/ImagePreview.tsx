import React, { useState } from 'react'
import { Image, MagnifyingGlass, X } from '@phosphor-icons/react'
import { getImageUrl } from '../../services/uploadApi'

interface ImagePreviewProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  rounded?: boolean
  allowExpand?: boolean
  className?: string
}

const sizeMap = {
  sm: { width: 48, height: 48 },
  md: { width: 80, height: 80 },
  lg: { width: 120, height: 120 },
  full: { width: '100%', height: 200 },
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt = 'Imagen',
  size = 'md',
  rounded = false,
  allowExpand = false,
  className = '',
}) => {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const resolvedUrl = getImageUrl(src)
  const dims = sizeMap[size]

  const radius = rounded ? '50%' : 'var(--radius-md)'

  if (!resolvedUrl || errored) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          ...dims,
          borderRadius: radius,
          background: 'var(--color-secondary)',
          border: '1px dashed var(--border-color)',
          flexShrink: 0,
        }}
      >
        <Image size={typeof dims.width === 'number' ? dims.width * 0.4 : 28} style={{ color: 'var(--text-muted)' }} />
      </div>
    )
  }

  return (
    <>
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ ...dims, borderRadius: radius, flexShrink: 0, border: '1px solid var(--border-color)' }}
      >
        {/* Skeleton while loading */}
        {!loaded && (
          <div className="skeleton absolute inset-0" style={{ borderRadius: radius }} />
        )}

        <img
          src={resolvedUrl}
          alt={alt}
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />

        {/* Expand button */}
        {allowExpand && loaded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            style={{ background: 'hsla(20,15%,12%,0.45)' }}
          >
            <MagnifyingGlass size={18} color="white" weight="bold" />
          </button>
        )}
      </div>

      {/* Lightbox modal */}
      {expanded && (
        <div
          className="modal-backdrop"
          onClick={() => setExpanded(false)}
        >
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img
              src={resolvedUrl}
              alt={alt}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute top-3 right-3 btn btn-icon"
              style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
