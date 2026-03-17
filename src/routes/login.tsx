import { createFileRoute } from "@tanstack/react-router"
import { LoginForm } from "@/components/login-form"

export const Route = createFileRoute("/login")({
  component: () => (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  ),
})
