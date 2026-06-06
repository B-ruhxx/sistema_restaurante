import React, { useState } from 'react'
import { useAppStore } from '../../../store'
import { api } from '../../../shared/services/api'
import { AuthResponse } from '../../../shared/types'
import { Lock, User, Warning, Storefront } from '@phosphor-icons/react'

export const LoginPage: React.FC = () => {
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
      setError(err.message || 'Credenciales incorrectas. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-background)',
        padding: '1rem',
      }}
    >
      {/* Background decorative circles */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'var(--color-primary-light)',
          filter: 'blur(80px)', opacity: 0.6,
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'hsl(40, 80%, 92%)',
          filter: 'blur(80px)', opacity: 0.5,
        }} />
      </div>

      <div
        className="card animate-fade-in"
        style={{ width: '100%', maxWidth: 420, padding: '2.5rem', position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-primary)', borderRadius: 'var(--radius-lg)',
            padding: '1rem', boxShadow: 'var(--shadow-primary)', marginBottom: '1rem',
          }}>
            <Storefront size={32} weight="bold" color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            RestaurantePOS
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Sistema ERP &amp; POS de Restaurante
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
              background: 'var(--color-danger-light)',
              border: '1px solid hsl(5, 65%, 85%)',
              borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
              marginBottom: '1.25rem', fontSize: '0.8125rem', color: 'var(--color-danger)',
            }}
          >
            <Warning size={18} className="shrink-0" style={{ marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          {/* Usuario */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Usuario
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <User size={17} />
              </span>
              <input
                id="login-username"
                type="text"
                required
                className="erp-input"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={17} />
              </span>
              <input
                id="login-password"
                type="password"
                required
                className="erp-input"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Iniciando sesión...
              </>
            ) : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Demo credentials */}
        <div
          style={{
            marginTop: '1.5rem',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}
        >
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Credenciales de prueba
          </p>
          <p>Admin: <code style={{ background: 'var(--color-surface-3)', padding: '0.1rem 0.3rem', borderRadius: 4 }}>admin</code> / <code style={{ background: 'var(--color-surface-3)', padding: '0.1rem 0.3rem', borderRadius: 4 }}>admin123</code></p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
