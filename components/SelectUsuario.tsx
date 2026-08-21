"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SelectUsuarioProps {
  onSelect: (tipoUsuario: string) => void
}

export default function SelectUsuario({ onSelect }: SelectUsuarioProps) {
  const usuarios = [
    {
      id: "apoderado",
      titulo: "Apoderado",
      descripcion: "Realizar pedidos para mis hijos",
      emoji: "👨‍👩‍👧‍👦",
    },
    {
      id: "funcionario-sin-hijos",
      titulo: "Funcionario",
      descripcion: "Pedido personal",
      emoji: "👤",
    },
    {
      id: "funcionario-con-hijos",
      titulo: "Funcionario con Hijos",
      descripcion: "Pedido personal y para mis hijos",
      emoji: "👨‍👩‍👧‍👦",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">¿Quién eres?</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {usuarios.map((usuario) => (
          <Card
            key={usuario.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-blue-300"
            style={{ backgroundColor: "#f0f6fe" }}
            onClick={() => onSelect(usuario.id)}
          >
            <CardHeader className="text-center pb-2">
              <div className="text-4xl mb-2">{usuario.emoji}</div>
              <CardTitle className="text-xl text-gray-800">{usuario.titulo}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-gray-600">{usuario.descripcion}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
