"use client"

import { useFinanzas } from "@/hooks/useFinanzas"
import { SelectorMes } from "@/components/admin/finanzas/SelectorMes"
import { ResumenMes } from "@/components/admin/finanzas/ResumenMes"
import { SemanaCard } from "@/components/admin/finanzas/SemanaCard"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileDown, AlertCircle } from "lucide-react"
import { exportarSemanaExcel, exportarMesCompletoExcel } from "@/utils/exportar-finanzas"
import { obtenerNombreMes } from "@/utils/calcular-semanas"

export default function FinanzasPage() {
  const { mesSeleccionado, resumenMes, semanas, cargando, error, cambiarMes, seleccionarMes } = useFinanzas()

  const handleExportarSemana = (semana: any) => {
    const nombreMes = obtenerNombreMes(mesSeleccionado.mes)
    exportarSemanaExcel(semana.pedidos, semana.texto, semana.totales, nombreMes, mesSeleccionado.año)
  }

  const handleExportarMesCompleto = () => {
    const nombreMes = obtenerNombreMes(mesSeleccionado.mes)
    const semanasData = semanas.map((semana) => ({
      semana: {
        texto: semana.texto,
        inicioNum: semana.inicioNum,
        finNum: semana.finNum,
      },
      pedidos: semana.pedidos,
      totales: semana.totales,
    }))

    exportarMesCompletoExcel(semanasData, nombreMes, mesSeleccionado.año, resumenMes)
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando datos financieros...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error al cargar datos financieros: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <SelectorMes mesSeleccionado={mesSeleccionado} onCambiarMes={cambiarMes} onSeleccionarMes={seleccionarMes} />
        <Button onClick={handleExportarMesCompleto} size="lg">
          <FileDown className="mr-2 h-5 w-5" />
          Exportar mes completo
        </Button>
      </div>

      <ResumenMes totales={resumenMes} />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Ingresos por Semana</h3>
        {semanas.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No hay pedidos registrados en este mes.</AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            {semanas.map((semana, index) => (
              <SemanaCard
                key={index}
                texto={semana.texto}
                totales={semana.totales}
                onExportar={() => handleExportarSemana(semana)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
