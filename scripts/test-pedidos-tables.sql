-- Script para probar que las tablas de pedidos funcionan correctamente

-- Verificar que las tablas existen
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pedidos', 'pedidos_item');

-- Verificar estructura de la tabla pedidos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pedidos'
ORDER BY ordinal_position;

-- Verificar estructura de la tabla pedidos_item
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pedidos_item'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('pedidos', 'pedidos_item');

-- Insertar un pedido de prueba (opcional)
INSERT INTO pedidos (
    order_id,
    nombre_cliente,
    email_cliente,
    tipo_cliente,
    total,
    estado_pago
) VALUES (
    'test-' || gen_random_uuid()::text,
    'Cliente Test',
    'test@example.com',
    'apoderado',
    5500.00,
    'pendiente'
) RETURNING id, order_id, nombre_cliente, total, estado_pago, fecha_creacion;

-- Limpiar datos de prueba (descomenta si quieres limpiar)
-- DELETE FROM pedidos WHERE nombre_cliente = 'Cliente Test';
