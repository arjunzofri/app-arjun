# App Arjun — Sistema de Inventario

Sistema de gestión de inventario profesional para App Arjun (Zofri, Iquique).

## Stack
- **Next.js 15** (App Router)
- **Database:** PostgreSQL (Neon) + Drizzle ORM
- **Auth:** NextAuth.js v5 (Credentials)
- **UI:** Tailwind CSS + shadcn/ui
- **AI/OCR:** Google Gemini Pro Vision
- **Image Upload:** Cloudinary

## Setup

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia `.env.example` a `.env` y completa los valores:
   - `DATABASE_URL`: URL de conexión a Neon.tech
   - `NEXTAUTH_SECRET`: Secreto para la sesión
   - `GEMINI_API_KEY`: API Key de Google AI Studio
   - `CLOUDINARY_*`: Credenciales de Cloudinary

3. **Base de Datos:**
   Empujar el schema a la base de datos:
   ```bash
   npx drizzle-kit push
   ```

4. **Seed:**
   Ejecutar el script de seed para datos iniciales (bodegas, módulos y admin):
   ```bash
   npm run db:seed
   ```

5. **Iniciar desarrollo:**
   ```bash
   npm run dev
   ```

## Estructura de Datos
- **Bodegas:** 3 centros de distribución principales.
- **Módulos:** 5 puntos de venta en Mall Zofri.
- **Productos:** Control de packing, ubicación heredada y código personal auditado.
- **Stock:** Control en tiempo real por cada bodega.

## Características Críticas
- **OCR con IA:** Procesamiento de facturas de Kingnex vía Gemini Pro Vision.
- **Integración WinFac:** Conector para notas de venta existentes.
- **Auditoría:** Registro automático de cambios en códigos personales y actividad general.
