"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResumenCompleto() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Destinatarios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Información de destinatarios se cargará aquí</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items Seleccionados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Detalle de almuerzos y colaciones seleccionados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total a Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">$0</div>
        </CardContent>
      </Card>
    </div>
  )
}
