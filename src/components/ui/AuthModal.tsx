import { useState } from 'react'
import { X, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from '../../lib/firebase'

type Mode = 'login' | 'register' | 'forgot'

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-email': 'Email inválido.',
  'auth/user-not-found': 'No existe una cuenta con ese email.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
  'auth/too-many-requests': 'Demasiados intentos. Intentá más tarde.',
  'auth/popup-closed-by-user': '',
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string }).code ?? ''
  const msg = (err as { message?: string }).message ?? ''
  return FIREBASE_ERRORS[code] ?? msg ?? 'Ocurrió un error. Intentá de nuevo.'
}

interface AuthModalProps {
  onClose: () => void
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const reset = (m: Mode) => { setMode(m); setError(''); setSuccess(''); setPassword(''); setConfirm('') }

  const handleGoogle = async () => {
    setBusy(true); setError('')
    try { await signInWithGoogle(); onClose() }
    catch (e) { const msg = friendlyError(e); if (msg) setError(msg) }
    finally { setBusy(false) }
  }

  const handleSubmit = async () => {
    setError(''); setSuccess('')
    if (!email.trim()) { setError('Ingresá tu email.'); return }

    if (mode === 'register' && password !== confirm) {
      setError('Las contraseñas no coinciden.'); return
    }

    setBusy(true)
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
        onClose()
      } else if (mode === 'register') {
        await signUpWithEmail(email, password)
        onClose()
      } else {
        await resetPassword(email)
        setSuccess('Te enviamos un email para restablecer tu contraseña.')
      }
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const titles: Record<Mode, string> = {
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
    forgot: 'Recuperar contraseña',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <p className="font-semibold text-gray-900 dark:text-white">{titles[mode]}</p>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Google button (login & register only) */}
          {mode !== 'forgot' && (
            <>
              <button
                onClick={handleGoogle}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2.5 border border-gray-300 dark:border-gray-600 rounded-xl py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.8-1.9 13.4-5.1l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.4-11.2-8H6.4C9.7 35.8 16.3 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41.1 36.2 44 30.6 44 24c0-1.3-.1-2.7-.4-3.9z"/>
                </svg>
                Continuar con Google
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400">o</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
            </>
          )}

          {/* Email field */}
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className={inputCls + ' pl-9'}
              autoFocus
            />
          </div>

          {/* Password field */}
          {mode !== 'forgot' && (
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className={inputCls + ' pl-9 pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          )}

          {/* Confirm password (register) */}
          {mode === 'register' && (
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className={inputCls + ' pl-9'}
              />
            </div>
          )}

          {/* Feedback */}
          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {busy ? <Loader2 size={16} className="animate-spin inline" /> : titles[mode]}
          </button>

          {/* Footer links */}
          <div className="flex flex-col items-center gap-1 pt-1">
            {mode === 'login' && (
              <>
                <button onClick={() => reset('forgot')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
                <button onClick={() => reset('register')} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
                  ¿No tenés cuenta? <span className="text-blue-600 dark:text-blue-400">Registrate</span>
                </button>
              </>
            )}
            {mode === 'register' && (
              <button onClick={() => reset('login')} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
                ¿Ya tenés cuenta? <span className="text-blue-600 dark:text-blue-400">Iniciá sesión</span>
              </button>
            )}
            {mode === 'forgot' && (
              <button onClick={() => reset('login')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Volver al inicio de sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
