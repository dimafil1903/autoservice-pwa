import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'

export function PageHeader({
  title,
  icon,
  back,
}: {
  title: string
  icon?: React.ReactNode
  back?: boolean
}) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4">
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      {icon && <span className="text-primary">{icon}</span>}
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  )
}
