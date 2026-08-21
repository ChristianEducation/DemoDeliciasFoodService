"use client"

import EstudiantesList from "./EstudiantesList"

interface SelectHijoProps {
  onSelectionChange?: (selectedIds: string[]) => void
}

export default function SelectHijo({ onSelectionChange }: SelectHijoProps) {
  return <EstudiantesList onSelectionChange={onSelectionChange} />
}
