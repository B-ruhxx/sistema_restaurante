import { useAppStore } from '../../store'

const BASE_URL = ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAppStore.getState().token
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(BASE_URL + path, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    useAppStore.getState().logout()
    throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.')
  }

  if (!response.ok) {
    let message = `Error ${response.status}: ${response.statusText}`
    try {
      const clone = response.clone()
      const errorData = await clone.json()
      if (errorData && errorData.message) {
        message = errorData.message
      }
    } catch {
      try {
        const errorText = await response.text()
        if (errorText) message = errorText
      } catch { /* ignore */ }
    }
    throw new Error(message)
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>
  }
  return response.text() as unknown as Promise<T>
}

export const api = {
  get:    <T>(path: string)              => request<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body: any)  => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: any)  => request<T>(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: any)  => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string)             => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST', body: formData }),
}
