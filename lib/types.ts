// Tipos TypeScript para la aplicación

export interface Estudiante {
  id: string
  name: string
  curso: string
  funcionario_id?: string
}

export interface Funcionario {
  id: string
  name: string
  casino: string
}

export interface Menu {
  id: string
  nombre: string
  descripcion: string
  precio: number
  tipo: "almuerzo" | "colacion"
  fecha_disponible: string
  disponible: boolean
}

export interface Colacion {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  disponible: boolean
}

export interface ColacionSupabase {
  codigo: string
  descripcion: string
  snack: string
  bebestible: string
  precio: number
}

export interface GrupoSnack {
  snack: string
  emoji: string
  opciones: ColacionSupabase[]
  precioMinimo: number
}

export interface Pedido {
  id: string
  usuario_id: string
  destinatarios: string[]
  items: PedidoItem[]
  total: number
  estado: "borrador" | "confirmado" | "pagado" | "entregado" | "cancelado"
  fecha_creacion: string
  fecha_entrega: string
}

export interface PedidoItem {
  id: string
  menu_id?: string
  colacion_id?: string
  destinatario_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface DatosFuncionario {
  funcionarioId: string
  funcionarioNombre: string
  lugarRetiro: string
  curso?: string
}

export type TipoUsuario = "apoderado" | "funcionario-sin-hijos" | "funcionario-con-hijos"

export type LugarRetiro = "preschool" | "casino-basica" | "casino-media"
