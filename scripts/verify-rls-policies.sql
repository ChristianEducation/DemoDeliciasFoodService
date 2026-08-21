-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('almuerzos', 'colaciones', 'estudiantes', 'funcionarios');

-- Verificar las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('almuerzos', 'colaciones', 'estudiantes', 'funcionarios');
