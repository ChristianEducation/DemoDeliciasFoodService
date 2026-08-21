"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"

// Custom hook para operaciones con Supabase
export function useSupabase() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = async (table: string, query?: any) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.from(table).select(query || "*")

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    supabase,
    loading,
    error,
    fetchData,
  }
}
