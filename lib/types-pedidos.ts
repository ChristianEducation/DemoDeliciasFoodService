// Tipos para la integración con Supabase y GetNet - Estructura Real

export interface PedidoSupabase {
  id?: string
  fecha: string // TIMESTAMP - fecha de creación del pedido
  nombre_cliente: string
  email_cliente: string
  tipo_cliente: string // 'apoderado', 'funcionario', 'funcionario_con_hijos'
  total: number // INT - total en pesos chilenos
  estado_pago: string // 'pendiente', 'pagado', 'fallido', etc.
  transaction_id?: string // ID de GetNet o transacción
  detalles?: any // JSONB - información adicional del pedido
  observaciones?: string // TEXT - observaciones adicionales
  created_at?: string // TIMESTAMP automático de Supabase
}

export interface PedidoItemSupabase {
  id?: string
  pedido_id: string // UUID referencia a pedidos(id)
  destinatario: string // Nombre del hijo o funcionario
  tipo_destinatario: string // 'estudiante' o 'funcionario'
  fecha: string // DATE - fecha del almuerzo/colación (YYYY-MM-DD)
  tipo: string // 'almuerzo' o 'colacion'
  codigo: string // Código del menú/colación
  descripcion: string // Descripción del item
  categoria?: string // Categoría del item (vegetariano, normal, etc.)
  cantidad: number // INT - cantidad de items
  precio_unitario: number // INT - precio por unidad en pesos
  subtotal: number // INT - cantidad * precio_unitario
  created_at?: string // TIMESTAMP automático de Supabase
}

export interface PaymentRequest {
  orderId: string
  customerEmail: string
  customerName: string
  amount: number
  description: string
  returnUrl?: string
  notifyUrl?: string
}

export interface PaymentResponse {
  success: boolean
  processUrl?: string
  orderId?: string
  error?: string
}

export interface PaymentNotification {
  orderId: string
  transactionId: string
  status: "approved" | "rejected" | "cancelled"
  amount: number
}

export interface GetNetPaymentRequest {
  orderId: string
  customerEmail: string
  customerName?: string
  amount: number
  description?: string
  returnUrl?: string
  notifyUrl?: string
}

export interface GetNetPaymentResponse {
  success: boolean
  paymentId?: string
  redirectUrl?: string
  transactionId?: string
  error?: string
}

export interface GetNetNotification {
  status: {
    status: string
    message: string
    reason?: string | number
    date: string
  }
  requestId?: string | number
  reference?: string // Este es nuestro orderId
  signature?: string
  authorization?: string
  receipt?: string
  franchise?: string
  franchiseName?: string
  bank?: string
  bankName?: string
  internalReference?: number
  paymentMethod?: string
  paymentMethodName?: string
  issuerName?: string
  amount?: {
    from?: {
      currency: string
      total: number
    }
    to?: {
      currency: string
      total: number
    }
  }
  authorization_code?: string
  transaction?: {
    transactionID?: string
    cus?: string
    reference?: string
    description?: string
  }
  order_id?: string
  orderId?: string
  state?: string
  transaction_id?: string
  transactionId?: string
  [key: string]: unknown
}
