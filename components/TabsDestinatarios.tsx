"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SelectHijo from "./SelectHijo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TabsDestinatariosProps {
  onSelectionChange?: (selectedIds: string[]) => void
}

export default function TabsDestinatarios({ onSelectionChange }: TabsDestinatariosProps) {
  const [hijosSeleccionados, setHijosSeleccionados] = useState<string[]>([])
  const [incluyePersonal, setIncluyePersonal] = useState(false)

  const handleHijosChange = (selectedIds: string[]) => {
    setHijosSeleccionados(selectedIds)
    updateSelection(selectedIds, incluyePersonal)
  }

  const handlePersonalChange = (incluir: boolean) => {
    setIncluyePersonal(incluir)
    updateSelection(hijosSeleccionados, incluir)
  }

  const updateSelection = (hijos: string[], personal: boolean) => {
    const selection = [...hijos]
    if (personal) {
      selection.push("personal")
    }
    onSelectionChange?.(selection)
  }

  return (
    <Tabs defaultValue="hijos" className="mb-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="hijos">Para mis Hijos</TabsTrigger>
        <TabsTrigger value="personal">Para mí</TabsTrigger>
      </TabsList>

      <TabsContent value="hijos" className="mt-6">
        <SelectHijo onSelectionChange={handleHijosChange} />
      </TabsContent>

      <TabsContent value="personal" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Pedido Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              ¿Deseas incluir un pedido personal además de los pedidos para tus hijos?
            </p>
            <div className="flex gap-4">
              <Button
                variant={incluyePersonal ? "default" : "outline"}
                onClick={() => handlePersonalChange(true)}
                className="flex-1"
              >
                Sí, incluir pedido personal
              </Button>
              <Button
                variant={!incluyePersonal ? "default" : "outline"}
                onClick={() => handlePersonalChange(false)}
                className="flex-1"
              >
                No, solo para hijos
              </Button>
            </div>
            {incluyePersonal && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">✅ Pedido personal incluido</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
