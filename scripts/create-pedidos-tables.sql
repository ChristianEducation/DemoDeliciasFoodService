-- Crear tabla pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(255) UNIQUE NOT NULL,
    nombre_cliente VARCHAR(255) NOT NULL,
    email_cliente VARCHAR(255) NOT NULL,
    tipo_cliente VARCHAR(50) NOT NULL CHECK (tipo_cliente IN ('apoderado', 'funcionario-sin-hijos', 'funcionario-con-hijos')),
    total DECIMAL(10,2) NOT NULL,
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'fallido', 'cancelado')),
    transaction_id VARCHAR(255),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE,
    datos_adicionales JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla pedidos_item
CREATE TABLE IF NOT EXISTS pedidos_item (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    destinatario VARCHAR(255) NOT NULL,
    tipo_destinatario VARCHAR(20) NOT NULL CHECK (tipo_destinatario IN ('estudiante', 'funcionario')),
    fecha DATE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('almuerzo', 'colacion')),
    codigo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_order_id ON pedidos(order_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_pago ON pedidos(estado_pago);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_creacion ON pedidos(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_pedidos_item_pedido_id ON pedidos_item(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_item_fecha ON pedidos_item(fecha);
CREATE INDEX IF NOT EXISTS idx_pedidos_item_tipo ON pedidos_item(tipo);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_item_updated_at BEFORE UPDATE ON pedidos_item 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) si es necesario
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_item ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS básicas (ajustar según necesidades)
CREATE POLICY "Enable read access for all users" ON pedidos FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON pedidos FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON pedidos_item FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON pedidos_item FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON pedidos_item FOR UPDATE USING (true);
