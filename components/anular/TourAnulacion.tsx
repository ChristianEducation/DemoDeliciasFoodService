"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, ArrowRight, ArrowLeft } from "lucide-react"

interface PasoTour {
  targetId: string
  titulo: string
  texto: string
  // Si viene true, el paso solo se muestra cuando la condición externa lo habilita
  requiereCondicion?: boolean
}

interface TourAnulacionProps {
  /** true una vez que el usuario ya seleccionó un estudiante (habilita pasos 4 y 5) */
  estudianteListo: boolean
  /** true una vez que el usuario ya anuló un almuerzo con éxito (habilita pasos 6 y 7) */
  anulacionListo: boolean
  onVerDescuento: () => void
}

const PASOS_INICIALES: PasoTour[] = [
  {
    targetId: "tour-nivel",
    titulo: "1. Elige el nivel",
    texto: "Primero selecciona el nivel del estudiante que quieres buscar.",
  },
  {
    targetId: "tour-curso",
    titulo: "2. Elige el curso",
    texto: "Luego el curso específico.",
  },
  {
    targetId: "tour-estudiante",
    titulo: "3. Elige el estudiante",
    texto: "Y por último el estudiante — aquí aparecerán sus datos y sus almuerzos.",
  },
]

const PASOS_ESTUDIANTE: PasoTour[] = [
  {
    targetId: "tour-lista-almuerzos",
    titulo: "4. Almuerzos anulables",
    texto: "Acá se ven los almuerzos futuros ya pagados de este estudiante, listos para anular.",
  },
  {
    targetId: "tour-boton-anular",
    titulo: "5. Anular un almuerzo",
    texto: "Haz clic en \"Anular\" en cualquiera de ellos para probarlo — el estudiante recibe un crédito automático a cambio.",
  },
]

const PASOS_FINALES: PasoTour[] = [
  {
    targetId: "tour-creditos",
    titulo: "6. El crédito ya se sumó",
    texto: "¡Listo! El crédito quedó reflejado acá al instante.",
  },
  {
    targetId: "tour-ver-descuento",
    titulo: "7. Se usa solo, automáticamente",
    texto: "Haz clic aquí para ver cómo ese crédito se descuenta solo en un pedido nuevo.",
  },
]

export default function TourAnulacion({ estudianteListo, anulacionListo, onVerDescuento }: TourAnulacionProps) {
  const [activo, setActivo] = useState(true)
  const [indice, setIndice] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const pasos: PasoTour[] = [
    ...PASOS_INICIALES,
    ...(estudianteListo ? PASOS_ESTUDIANTE : []),
    ...(anulacionListo ? PASOS_FINALES : []),
  ]

  const paso = pasos[indice]
  const esUltimoDisponible = indice === pasos.length - 1
  const esPasoEsperandoAccion = paso?.targetId === "tour-boton-anular"

  // Cuando cambian las condiciones externas (se eligió estudiante, se anuló un almuerzo),
  // saltamos automáticamente al primer paso nuevo que se habilita.
  useEffect(() => {
    if (estudianteListo && indice < PASOS_INICIALES.length) {
      setActivo(true)
    }
  }, [estudianteListo]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (anulacionListo) {
      setIndice(PASOS_INICIALES.length + PASOS_ESTUDIANTE.length)
      setActivo(true)
    }
  }, [anulacionListo])

  useEffect(() => {
    if (!activo || !paso) return

    const actualizarPosicion = () => {
      const el = document.getElementById(paso.targetId)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setRect(el.getBoundingClientRect())
      } else {
        setRect(null)
      }
    }

    actualizarPosicion()
    const t = setTimeout(actualizarPosicion, 350) // esperar el scroll suave
    window.addEventListener("resize", actualizarPosicion)
    return () => {
      clearTimeout(t)
      window.removeEventListener("resize", actualizarPosicion)
    }
  }, [activo, paso])

  if (!activo || !paso) return null

  const siguiente = () => {
    if (esPasoEsperandoAccion) {
      // Este paso se cierra solo esperando la acción real del usuario
      setActivo(false)
      return
    }
    if (indice < pasos.length - 1) {
      setIndice((i) => i + 1)
    } else {
      setActivo(false)
    }
  }

  const anterior = () => {
    if (indice > 0) setIndice((i) => i - 1)
  }

  return (
    <>
      {/* Resalte del elemento objetivo: esto es lo único que se mueve entre pasos */}
      {rect && (
        <div
          className="fixed z-[70] rounded-lg ring-4 ring-purple-400/70 ring-offset-2 pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}

      {/* Burbuja del tour: siempre fija y centrada abajo, nunca se mueve */}
      <div
        className="fixed z-[80] bottom-4 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-xl shadow-2xl border border-purple-200 p-4 space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
              Paso {indice + 1} de {pasos.length}
            </p>
            <h4 className="font-bold text-gray-800">{paso.titulo}</h4>
          </div>
          <button
            onClick={() => setActivo(false)}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            aria-label="Cerrar tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600">{paso.texto}</p>

        <div className="flex items-center justify-between pt-1">
          <button onClick={() => setActivo(false)} className="text-xs text-gray-400 hover:text-gray-600">
            Saltar tour
          </button>
          <div className="flex items-center gap-2">
            {indice > 0 && !esPasoEsperandoAccion && (
              <Button size="sm" variant="outline" onClick={anterior}>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            )}
            {!esPasoEsperandoAccion && (
              <Button size="sm" onClick={siguiente} className="bg-purple-600 hover:bg-purple-700">
                {esUltimoDisponible ? "Entendido" : "Siguiente"}
                {!esUltimoDisponible && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
