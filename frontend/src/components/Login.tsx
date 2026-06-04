import React, { useState } from 'react'
import { useAppStore } from '../store'
import { api } from '../api'
import { AuthResponse } from '../types'
import { Lock, User, Warning } from '@phosphor-icons/react'

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const loginStore = useAppStore((state) => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post<AuthResponse>('/api/auth/login', { username, password })
      loginStore(res.token, res.user)
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel double-bezel w-full max-w-md rounded-2xl p-8 text-left transition-all duration-300">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">ERP & POS</h2>
          <p className="mt-2 text-sm text-gray-400 font-medium">Sistema de Gestion de Restaurante</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
            <Warning size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Usuario</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <User size={20} />
              </span>
              <input
                type="text"
                required
                className="glass-input pl-10 w-full"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock size={20} />
              </span>
              <input
                type="password"
                required
                className="glass-input pl-10 w-full"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50"
          >
            {loading ? 'Iniciando sesion...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-white/5 border border-white/5 p-4 text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-300">Credenciales de prueba:</p>
          <p>• Admin: <code className="text-[11px]">admin</code> / <code className="text-[11px]">admin123</code></p>
        </div>
      </div>
    </div>
  )
}
