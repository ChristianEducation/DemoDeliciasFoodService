"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

interface Funcionario {
  id: string
  nombre: string
}

export function useFuncionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchFuncionarios() {
      setLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase.from("funcionarios").select("id, nombre").order("nombre")

        if (error) throw error

        setFuncionarios(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando funcionarios")
      } finally {
        setLoading(false)
      }
    }

    fetchFuncionarios()
  }, [])

  const getFuncionarioById = (id: string) => {
    return funcionarios.find((f) => f.id === id)
  }

  const getFuncionarioNombre = (id: string) => {
    const funcionario = getFuncionarioById(id)
    return funcionario ? funcionario.nombre : ""
  }

  return {
    funcionarios,
    loading,
    error,
    getFuncionarioById,
    getFuncionarioNombre,
    refetch: () => {
      setLoading(true)
      // Re-ejecutar la consulta
    },
  }
}
