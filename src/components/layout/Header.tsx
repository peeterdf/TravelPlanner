import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  backTo?: string
  right?: React.ReactNode
}

export function Header({ title, backTo, right }: HeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 h-14 flex items-center gap-3">
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="p-1 -ml-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          aria-label="Volver"
        >
          <ArrowLeft size={22} />
        </button>
      )}
      <h1 className="flex-1 text-base font-semibold text-gray-900 dark:text-white truncate">{title}</h1>
      {right && <div className="flex items-center gap-1">{right}</div>}
    </header>
  )
}
