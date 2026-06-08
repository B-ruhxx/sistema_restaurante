import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../../store'
import { api } from '../../../shared/services/api'
import { AuthResponse } from '../../../shared/types'
import { Lock, User, Warning, Storefront, Trash, CaretRight, ArrowLeft } from '@phosphor-icons/react'
import { getImageUrl } from '../../../shared/services/uploadApi'

interface RememberedUser {
  idEmpleado: number;
  nombre: string;
  apellido: string;
  username: string;
  rol: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
}

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<{ nombreEmpresa: string; logoUrl: string | null } | null>(null)
  const loginStore = useAppStore((state) => state.login)

  // Remembered Accounts State
  const [rememberedList, setRememberedList] = useState<RememberedUser[]>([])
  const [selectedUser, setSelectedUser] = useState<RememberedUser | null>(null)
  const [view, setView] = useState<'chooser' | 'login' | 'password'>('login')

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get<any>('/api/v1/configuracion')
        setCompanyInfo({
          nombreEmpresa: res.nombreEmpresa,
          logoUrl: res.logoUrl || res.logo_url || null,
        })
      } catch (e) {
        console.error('Error loading config for login page', e)
      }
    }
    fetchConfig()
  }, [])

  // Load remembered users on mount
  useEffect(() => {
    const rememberedRaw = localStorage.getItem('rememberedUsers')
    if (rememberedRaw) {
      try {
        const parsed = JSON.parse(rememberedRaw) as RememberedUser[]
        setRememberedList(parsed)
        if (parsed.length > 0) {
          setView('chooser')
        }
      } catch (e) {
        console.error('Error parsing rememberedUsers', e)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post<AuthResponse>('/api/auth/login', { username, password })
      
      // Save logged in user to remembered list
      const rememberedRaw = localStorage.getItem('rememberedUsers')
      let list: RememberedUser[] = rememberedRaw ? JSON.parse(rememberedRaw) : []
      // Remove duplicate
      list = list.filter(u => u.username !== res.user.username)
      // Prepend to show most recently logged in first
      list.unshift({
        idEmpleado: res.user.idEmpleado,
        nombre: res.user.nombre,
        apellido: res.user.apellido,
        username: res.user.username,
        rol: res.user.rol,
        avatarUrl: res.user.avatarUrl || res.user.avatar_url || null,
        avatar_url: res.user.avatarUrl || res.user.avatar_url || null,
      })
      localStorage.setItem('rememberedUsers', JSON.stringify(list))

      loginStore(res.token, res.user)
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUser = (user: RememberedUser) => {
    setSelectedUser(user)
    setUsername(user.username)
    setPassword('')
    setError(null)
    setView('password')
  }

  const handleRemoveUser = (e: React.MouseEvent, usernameToRemove: string) => {
    e.stopPropagation() // Prevent row click
    const updated = rememberedList.filter(u => u.username !== usernameToRemove)
    setRememberedList(updated)
    localStorage.setItem('rememberedUsers', JSON.stringify(updated))
    if (updated.length === 0) {
      setView('login')
      setUsername('')
      setSelectedUser(null)
    }
  }

  const handleUseAnotherAccount = () => {
    setSelectedUser(null)
    setUsername('')
    setPassword('')
    setError(null)
    setView('login')
  }

  const handleBackToChooser = () => {
    setError(null)
    if (rememberedList.length > 0) {
      setView('chooser')
    } else {
      setView('login')
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
        {/* Logo & Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          {companyInfo?.logoUrl ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <img
                src={getImageUrl(companyInfo.logoUrl) || ''}
                alt="Logo"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  boxShadow: 'var(--shadow-md)',
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-primary)', borderRadius: 'var(--radius-lg)',
              padding: '1rem', boxShadow: 'var(--shadow-primary)', marginBottom: '1rem',
            }}>
              <Storefront size={32} weight="bold" color="white" />
            </div>
          )}
          <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {companyInfo?.nombreEmpresa || 'RestaurantePOS'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            Sistema ERP &amp; POS de Restaurante
          </p>
        </div>

        {/* Error Block */}
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

        {/* VIEW: CHOOSER (Google-style Account List) */}
        {view === 'chooser' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '0.25rem' }}>
              Elegir una cuenta
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '2px' }}>
              {rememberedList.map((account) => (
                <div
                  key={account.username}
                  onClick={() => handleSelectUser(account)}
                  className="card-hover"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--color-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    {(account.avatarUrl || account.avatar_url) ? (
                      <img
                        src={getImageUrl(account.avatarUrl || account.avatar_url) || ''}
                        alt={account.nombre}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {account.nombre.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {account.nombre} {account.apellido}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        @{account.username} · <span style={{ textTransform: 'lowercase', fontWeight: 600 }}>{account.rol}</span>
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveUser(e, account.username)}
                      title="Quitar cuenta del dispositivo"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        padding: '0.25rem',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash size={16} />
                    </button>
                    <CaretRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleUseAnotherAccount}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.65rem',
                borderStyle: 'dashed',
                borderWidth: '1.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              <i className="fa-solid fa-user-plus text-xs"></i>
              Usar otra cuenta
            </button>
          </div>
        )}

        {/* VIEW: LOGIN (Empty Username & Password Form) */}
        {view === 'login' && (
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

            {rememberedList.length > 0 && (
              <button
                type="button"
                onClick={handleBackToChooser}
                className="btn btn-ghost btn-sm"
                style={{ alignSelf: 'center', marginTop: '0.25rem' }}
              >
                <ArrowLeft size={14} />
                Volver a la lista de cuentas
              </button>
            )}
          </form>
        )}

        {/* VIEW: PASSWORD (Specific Account Selected) */}
        {view === 'password' && selectedUser && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }} className="animate-fade-in">
            {/* Account Card Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                borderRadius: '12px',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--border-color)',
                position: 'relative',
              }}
            >
              {(selectedUser.avatarUrl || selectedUser.avatar_url) ? (
                <img
                  src={getImageUrl(selectedUser.avatarUrl || selectedUser.avatar_url) || ''}
                  alt={selectedUser.nombre}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                  }}
                >
                  {selectedUser.nombre.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedUser.nombre} {selectedUser.apellido}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{selectedUser.username}
                </p>
              </div>
              <button
                type="button"
                onClick={handleBackToChooser}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                Cambiar
              </button>
            </div>

            {/* Contraseña Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                Introduce tu contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={17} />
                </span>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoFocus
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
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
