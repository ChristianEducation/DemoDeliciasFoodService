-- Habilitar RLS en todas las tablas de admin
ALTER TABLE almuerzos ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para la tabla almuerzos
CREATE POLICY "Allow all operations on almuerzos" ON almuerzos
FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas permisivas para la tabla colaciones
CREATE POLICY "Allow all operations on colaciones" ON colaciones
FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas permisivas para la tabla estudiantes
CREATE POLICY "Allow all operations on estudiantes" ON estudiantes
FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas permisivas para la tabla funcionarios
CREATE POLICY "Allow all operations on funcionarios" ON funcionarios
FOR ALL
USING (true)
WITH CHECK (true);
