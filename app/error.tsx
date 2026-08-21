"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">¡Algo salió mal!</h2>
      <p className="text-gray-600 mb-6">Ha ocurrido un error inesperado. Por favor, intenta nuevamente.</p>
      <Button onClick={() => reset()}>Intentar nuevamente</Button>
    </div>
  )
}
