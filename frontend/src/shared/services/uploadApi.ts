import { api } from './api'
import { UploadResponse } from '../types'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadValidationError'
  }
}

export function validateImageFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadValidationError(
      `Formato no permitido: ${file.type}. Solo se aceptan JPG, JPEG, PNG y WEBP.`
    )
  }
  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1)
    throw new UploadValidationError(
      `El archivo es demasiado grande (${sizeMB} MB). El tamaño máximo es 5 MB.`
    )
  }
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  validateImageFile(file)
  const formData = new FormData()
  formData.append('file', file)
  return api.upload<UploadResponse>('/api/uploads', formData)
}

export async function deleteFile(filename: string): Promise<void> {
  return api.delete<void>(`/api/uploads/${filename}`)
}

export function getImageUrl(filenameOrUrl: string | undefined | null): string | null {
  if (!filenameOrUrl) return null
  // If already a full URL, return as is
  if (filenameOrUrl.startsWith('http://') || filenameOrUrl.startsWith('https://')) {
    return filenameOrUrl
  }
  // Strip leading slash if present
  const clean = filenameOrUrl.startsWith('/') ? filenameOrUrl : `/${filenameOrUrl}`
  return `/api/uploads${clean.includes('/api/uploads') ? '' : clean}`
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsDataURL(file)
  })
}
