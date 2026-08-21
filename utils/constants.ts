// Constantes de la aplicación

export const TIPOS_USUARIO = {
  APODERADO: "apoderado",
  FUNCIONARIO_SIN_HIJOS: "funcionario-sin-hijos",
  FUNCIONARIO_CON_HIJOS: "funcionario-con-hijos",
} as const

export const TIPOS_MENU = {
  ALMUERZO: "almuerzo",
  COLACION: "colacion",
} as const

export const ESTADOS_PEDIDO = {
  BORRADOR: "borrador",
  CONFIRMADO: "confirmado",
  PAGADO: "pagado",
  ENTREGADO: "entregado",
  CANCELADO: "cancelado",
} as const
