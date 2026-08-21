"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/utils/formatters"
import type { Menu } from "@/lib/types"

interface MenusListProps {
  tipo: "almuerzo" | "colacion"
  onAddToCart?: (menu: Menu, cantidad: number) => void
}

export default function MenusList({ tipo, onAddToCart }: MenusListProps) {
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMenus() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("menus")
          .select("*")
          .eq("tipo", tipo)
          .eq("disponible", true)
          .order("fecha_disponible")

        if (error) {
          setError(error.message)
        } else {
          setMenus(data || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchMenus()
  }, [tipo])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando menús...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">
            <p className="font-semibold">Error al cargar menús:</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold capitalize">Menús de {tipo}</h2>
        <Badge variant="secondary">{menus.length} disponibles</Badge>
      </div>

      {menus.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">No hay menús disponibles para {tipo}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {menus.map((menu) => (
            <Card key={menu.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{menu.nombre}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{menu.descripcion}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">{formatPrice(menu.precio)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(menu.fecha_disponible).toLocaleDateString("es-CL")}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant={menu.disponible ? "default" : "secondary"}>
                    {menu.disponible ? "Disponible" : "No disponible"}
                  </Badge>
                  <Button onClick={() => onAddToCart?.(menu, 1)} disabled={!menu.disponible} size="sm">
                    Agregar al Pedido
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
