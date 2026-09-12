# 🛵 RiderLedger - Contabilidad & Métricas para Repartidores

> **Progressive Web App (PWA) 100% Mobile-First**, diseñada para alojarse gratuitamente en **GitHub Pages** y conectarse en tiempo real a una base de datos en la nube (**Supabase - PostgreSQL**) con soporte **Offline-First**.

---

## 🌟 Características Principales

- **📱 Experiencia Nativa (PWA)**: Funciona como una app nativa en Android (Chrome) e iOS (Safari). Añádela a la pantalla de inicio para usarla a pantalla completa sin barra de navegación.
- **⚡ Soporte Offline-First**: Si pierdes señal en la calle durante una entrega, los turnos y gastos se guardan en el almacenamiento local de tu teléfono y se sincronizan automáticamente con Supabase en cuanto recuperas cobertura.
- **💵 Doble Realidad Financiera**:
  - **Saldo con la App**: $(\text{Tarifas de Envíos} + \text{Propinas}) - \text{Cobros Efectivo App}$. Controla si la plataforma te debe dinero o si tienes deuda pendiente por pedidos cobrados en mano.
  - **Efectivo en Bolsillo**: $\sum(\text{Ingresos y Cobros en Efectivo}) - \sum(\text{Gastos en Efectivo})$. Tu liquidez real para tanquear o pagar comida en la calle.
  - **Superávit Neto Real**: $\text{Ingresos Brutos} - \text{Gastos Totales}$. Tu ganancia limpia real.
- **⏱️ Gestión de Tiempos y Rendimiento**:
  - Visualización estricta en horas y minutos (`hh:mm` o `Xh Ym`), sin números decimales.
  - Ratio de Productividad: % de tiempo activo en pedidos vs. tiempo de espera/muerto.
  - Rendimiento por hora ($\text{Ingresos} / \text{Horas}$) y por kilómetro ($\text{Ingresos} / \text{Km}$).
- **🚀 Botón de Acción Rápida (FAB)**: Drawer táctil inferior optimizado para registrar turnos, pedidos de apps (Rappi, Didi, Uber), gastos rápidos (Gasolina, Comida, Taller) y pasajeros con una sola mano.
- **📊 Reportes Consolidados & Exportación**: Agrupación automática semanal y mensual con exportación de datos a **CSV / Excel**.
- **⚙️ Configuración Dinámica de Supabase**: Ingresa tu `Project URL` y `Anon Key` directamente desde la pantalla de Ajustes de la app sin tener que recompilar código.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 18+ con TypeScript y Vite.
- **Estilos**: Tailwind CSS con diseño de alto impacto visual (*Dark Slate* con acentos esmeralda, cian y rosa).
- **Iconos**: Lucide React.
- **Gráficas**: Recharts (barras comparativas y gráficos de dona adaptables).
- **Backend & DB**: Supabase JS Client (`@supabase/supabase-js`) sobre PostgreSQL.
- **PWA**: `vite-plugin-pwa` con manifiesto web y Service Worker configurado con auto-actualización.
- **Despliegue**: GitHub Pages mediante GitHub Actions (`.github/workflows/deploy.yml`).

---

## 🚀 Guía de Inicio Rápido

### 1. Ejecutar en local para desarrollo

```bash
# 1. Clonar el repositorio o abrir la carpeta
cd c:\Contabilidad

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor local de desarrollo
npm run dev
```

### 2. Configurar Base de Datos en Supabase (2 minutos)

1. Crea un proyecto gratuito en [Supabase](https://supabase.com/).
2. En el menú lateral izquierdo, ve a **SQL Editor** -> **New Query**.
3. Copia el contenido del archivo [`supabase/schema.sql`](file:///c:/Contabilidad/supabase/schema.sql) (también puedes copiarlo con 1 clic desde la pantalla de **Ajustes** en la app).
4. Haz clic en **Run** para crear las tablas `shifts` y `transactions` con sus políticas de seguridad (RLS).
5. Ve a **Project Settings** -> **API** y copia:
   - **Project URL** (ejemplo: `https://abcdefghijkl.supabase.co`)
   - **Anon / Public Key** (ejemplo: `eyJhbGciOi...`)
6. Abre RiderLedger, ve a **Ajustes**, pega ambas credenciales y haz clic en **Guardar Credenciales**. ¡Listo! La app verificará la conexión y sincronizará en tiempo real.

---

## 🌐 Despliegue Automático en GitHub Pages

1. Sube tu proyecto a un repositorio en **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: RiderLedger PWA"
   git branch -M main
   git remote add origin https://github.com/<tu-usuario>/<tu-repositorio>.git
   git push -u origin main
   ```

2. En tu repositorio de GitHub, ve a **Settings** -> **Pages**:
   - En **Build and deployment** -> **Source**, selecciona: **GitHub Actions**.

3. Cada vez que hagas un `git push` a `main`, el workflow `.github/workflows/deploy.yml` compilará la PWA y la publicará automáticamente.

---

## 📱 Cómo Instalar la PWA en tu Teléfono

- **Android (Chrome)**: Toca los tres puntos (`⋮`) en la esquina superior derecha y selecciona **"Instalar aplicación"** o **"Añadir a pantalla principal"**.
- **iPhone / iPad (Safari)**: Toca el botón Compartir (icono del cuadro con flecha hacia arriba) y selecciona **"Añadir a pantalla de inicio"**.

La aplicación se abrirá a pantalla completa como una app nativa, con acceso a tus datos incluso cuando estés sin señal en ruta.
