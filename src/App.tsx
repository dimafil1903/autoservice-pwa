import { Button } from '@/components/ui/button'

export default function App() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-primary">Автосервіс</h1>
        <p className="text-muted-foreground">Tailwind + shadcn working</p>
        <Button>Test Button</Button>
      </div>
    </div>
  )
}
