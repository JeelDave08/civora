import { Link } from "react-router-dom"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center mb-8 text-primary">
        <AlertCircle size={64} />
      </div>
      <h1 className="text-6xl font-bold text-heading mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-heading mb-4">Page not found</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button asChild size="lg" className="gap-2">
        <Link to="/"><ArrowLeft size={18} /> Back to Home</Link>
      </Button>
    </div>
  )
}