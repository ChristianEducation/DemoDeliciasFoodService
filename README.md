# Sistema de Pedidos de Almuerzos y Colaciones

Plataforma web para gestionar pedidos de almuerzos y colaciones en un colegio, desarrollada con Next.js 15, Supabase y TailwindCSS.

## 🚀 Configuración Inicial

### 1. Instalar dependencias

\`\`\`bash
npm install
\`\`\`

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env.local` y configura las variables:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Las credenciales de Supabase ya están configuradas en el proyecto.

### 3. Ejecutar en desarrollo

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

\`\`\`
src/
├── app/                    # Páginas (App Router)
│   ├── page.tsx           # Página principal
│   ├── destinatario/      # Selección de destinatarios
│   ├── almuerzos/         # Selección de almuerzos
│   ├── colaciones/        # Selección de colaciones
│   ├── resumen/           # Resumen del pedido
│   ├── pago/              # Pasarela de pago
│   └── gracias/           # Confirmación
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── SelectUsuario.tsx # Selección tipo de usuario
│   ├── EstudiantesList.tsx # Lista de estudiantes
│   ├── MenusList.tsx     # Lista de menús
│   └── ...
├── lib/                  # Configuración y tipos
├── utils/                # Utilidades y helpers
└── hooks/                # Custom hooks
\`\`\`

## 🗄️ Base de Datos (Supabase)

El proyecto espera las siguientes tablas en Supabase:

### Tabla `estudiantes`
- `id` (uuid, primary key)
- `nombre` (text)
- `apellido` (text)
- `curso` (text)
- `rut` (text)
- `apoderado_id` (uuid)

### Tabla `menus`
- `id` (uuid, primary key)
- `nombre` (text)
- `descripcion` (text)
- `precio` (numeric)
- `tipo` (text) - 'almuerzo' o 'colacion'
- `fecha_disponible` (date)
- `disponible` (boolean)

### Tabla `funcionarios`
- `id` (uuid, primary key)
- `nombre` (text)
- `apellido` (text)
- `rut` (text)
- `cargo` (text)
- `departamento` (text)

## 🔧 Funcionalidades Implementadas

### ✅ Completadas
- [x] Estructura base del proyecto
- [x] Conexión con Supabase
- [x] Componente de prueba de conexión
- [x] Lista de estudiantes con selección múltiple
- [x] Lista de menús (almuerzos y colaciones)
- [x] Componentes base para todas las páginas

### 🚧 En desarrollo
- [ ] Lógica de selección de tipo de usuario
- [ ] Hook usePedido para manejo del carrito
- [ ] Navegación entre páginas
- [ ] Resumen de pedido funcional
- [ ] Integración con pasarela de pago

## 🎯 Flujos de Usuario

1. **Apoderado**: Selecciona hijos → Elige menús → Confirma pedido
2. **Funcionario sin hijos**: Selecciona menús personales → Confirma pedido
3. **Funcionario con hijos**: Puede hacer pedidos personales y para hijos

## 🛠️ Tecnologías

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS, shadcn/ui
- **Base de datos**: Supabase
- **Estado**: React hooks personalizados
- **Validación**: TypeScript + tipos personalizados

## 📝 Próximos Pasos

1. Implementar navegación entre páginas
2. Desarrollar lógica del carrito de pedidos
3. Conectar con pasarela de pago
4. Agregar validaciones de formularios
5. Implementar notificaciones y confirmaciones
6. Optimizar rendimiento y SEO

## 🤝 Desarrollo

Para continuar el desarrollo, cada página y componente está preparado para recibir la lógica específica. Los componentes base ya están conectados con Supabase y listos para usar.
