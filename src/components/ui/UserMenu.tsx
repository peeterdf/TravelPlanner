import { useState } from 'react'
import { LogIn, LogOut, User, Loader2, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { signInWithGoogle, signOutUser } from '../../lib/firebase'

interface UserMenuProps {
  variant?: 'light' | 'dark'
}

export function UserMenu({ variant = 'dark' }: UserMenuProps) {
  const { user, loading } = useAuthStore()
  const [busy, setBusy] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  if (loading) return <div className="w-9 h-9" />

  const handleLogin = async () => {
    setBusy(true)
    try { await signInWithGoogle() } catch { /* user cancelled */ }
    finally { setBusy(false) }
  }

  const handleSignOut = async () => {
    setBusy(true)
    try { await signOutUser(); setShowPanel(false) } catch { /* ignore */ }
    finally { setBusy(false) }
  }

  const isAnon = !user || user.isAnonymous
  const btnCls = variant === 'light'
    ? 'p-2 text-blue-200 hover:text-white transition-colors disabled:opacity-40'
    : 'p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-40'

  if (isAnon) {
    return (
      <button onClick={handleLogin} disabled={busy} title="Iniciar sesión con Google" className={btnCls}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
      </button>
    )
  }

  return (
    <>
      <button onClick={() => setShowPanel(true)} title={user.displayName ?? 'Mi cuenta'} className="p-1">
        {user.photoURL
          ? <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
          : <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center"><User size={14} className="text-white" /></div>
        }
      </button>

      {showPanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setShowPanel(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-900 dark:text-white">Mi cuenta</p>
              <button onClick={() => setShowPanel(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
              {user.photoURL
                ? <img src={user.photoURL} alt="avatar" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
                : <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center"><User size={22} className="text-white" /></div>
              }
              <div className="min-w-0">
                {user.displayName && <p className="font-medium text-gray-900 dark:text-white truncate">{user.displayName}</p>}
                {user.email && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-40"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </>
  )
}
