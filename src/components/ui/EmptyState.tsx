interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-gray-300 dark:text-gray-600 mb-4">{icon}</div>
      <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{title}</p>
      {description && <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}
