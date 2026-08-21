"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface AvisoNuevosPedidosProps {
  visible: boolean
  onActualizar: () => void
  actualizando?: boolean
}

export default function AvisoNuevosPedidos({ visible, onActualizar, actualizando }: AvisoNuevosPedidosProps) {
  if (!visible) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
      <span>Hay pedidos nuevos desde que se cargó esta pantalla.</span>
      <Button
        size="sm"
        variant="outline"
        onClick={onActualizar}
        disabled={actualizando}
        className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
      >
        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${actualizando ? "animate-spin" : ""}`} />
        Actualizar ahora
      </Button>
    </div>
  )
}
