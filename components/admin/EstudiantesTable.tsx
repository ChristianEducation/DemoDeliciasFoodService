"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Estudiante {
  id: string
  name: string
  curso: string
  level: string
}

interface EstudiantesTableProps {
  estudiantes: Estudiante[]
  loading: boolean
  onEditar: (estudiante: Estudiante) => void
  onEliminar: (id: string) => void
}

export function EstudiantesTable({ estudiantes, loading, onEditar, onEliminar }: EstudiantesTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (estudiantes.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No se encontraron estudiantes</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Curso</TableHead>
          <TableHead>Nivel</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {estudiantes.map((estudiante) => (
          <TableRow key={estudiante.id}>
            <TableCell className="font-medium">{estudiante.name}</TableCell>
            <TableCell>{estudiante.curso}</TableCell>
            <TableCell>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  estudiante.level === "PRESCHOOL"
                    ? "bg-green-100 text-green-800"
                    : estudiante.level === "LOWERSCHOOL"
                      ? "bg-blue-100 text-blue-800"
                      : estudiante.level === "MIDDLESCHOOL"
                        ? "bg-orange-100 text-orange-800"
                        : estudiante.level === "HIGHSCHOOL"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                }`}
              >
                {estudiante.level}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEditar(estudiante)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEliminar(estudiante.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
