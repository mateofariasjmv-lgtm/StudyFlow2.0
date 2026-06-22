# 📋 Informe Final — StudyFlow+

**Proyecto:** StudyFlow+ (aplicación académica de productividad)
**Desarrollador:** Mateo Farias
**Alcance:** Corrección de errores críticos, rediseño de alertas y notificaciones,
modo claro/oscuro, campo de perfil, métodos de estudio interactivos y auditoría general.

---

## ✅ Confirmaciones de integridad (lo que NO se tocó)

Se respetó al 100% la regla de no modificar la persistencia. Verificado por hash MD5
contra el ZIP original subido — **idénticos, sin un solo cambio**:

| Archivo | Estado |
|---|---|
| `studyflow-backend/config/db.js` | ✅ INTACTO |
| `studyflow-backend/models/Task.js` | ✅ INTACTO |
| `studyflow-backend/models/User.js` | ✅ INTACTO |
| `studyflow-backend/controllers/taskController.js` | ✅ INTACTO |
| `studyflow-backend/routes/api.js` | ✅ INTACTO |
| `studyflow-backend/server.js` | ✅ INTACTO |
| `studyflow-backend/middleware/auth.js` | ✅ INTACTO |
| `studyflow-backend/.env` | ✅ INTACTO |

- **MongoDB:** la lógica de conexión, los modelos, las colecciones y los endpoints
  de tareas siguen funcionando exactamente igual.
- **Archivo de comunicación con MongoDB (db.js):** intacto.
- **Persistencia de datos:** sin cambios en la estructura ni en el esquema.

El **único** archivo del backend modificado es `controllers/authController.js`, con un
cambio **aditivo** (no destructivo) que se explica más abajo.

---

## 🐛 ERROR CRÍTICO 1 — Contador de tareas completadas (CORREGIDO)

### Causa raíz
En `js/tasks.js`, la función `toggle()` llamaba a
`SF.Api.syncStats({ tasksCompleted: 1 })` **cada vez** que se marcaba una tarea como
completada. Ese endpoint incrementa un contador en MongoDB con `$inc`, pero al
desmarcar la tarea **el contador nunca se decrementaba**. Resultado: marcar →
desmarcar → marcar volvía a sumar, contando la misma tarea varias veces.

### Solución aplicada
1. Se **eliminó** la llamada `syncStats({ tasksCompleted: 1 })` del `toggle()`.
2. El número de "Tareas Completadas" del Dashboard ahora se **deriva del estado real**:
   `tasks.filter(t => t.done).length`. Es imposible duplicarlo porque siempre refleja
   cuántas tareas están realmente marcadas.

**Archivo:** `js/tasks.js` → función `toggle()` (aprox. líneas 204–223)
**Archivo:** `app.js` → función `_renderDashboard()` (tarjeta "Tareas Completadas")

### ¿El mismo error existía en otras métricas?
- **Pomodoros / minutos / sesiones:** NO sufren el problema, porque un Pomodoro
  completado es un evento real e irreversible (no se puede "descompletar"). Se siguen
  sumando como eventos legítimos.
- **Lectura (libros):** se contabiliza por estado real (`status === 'completado'`),
  no por incrementos, así que tampoco duplica.

---

## 🐛 ERROR CRÍTICO 2 — Persistencia de estadísticas tras recargar (CORREGIDO)

- Las **Tareas Completadas** ahora se derivan del estado real en cada render, por lo
  que recargar la página nunca altera ni duplica el número.
- **Métodos creados/utilizados:** se calcula leyendo qué plantillas de estudio tienen
  datos guardados en `localStorage` (`sf_method_*`). Es idempotente.
- **Tiempo de enfoque / Pomodoros / Racha:** provienen de fuentes autoritativas (eventos
  reales + backend) y no se recalculan de forma que se dupliquen al recargar.

---

## 🔔 SISTEMA DE ALERTAS (TOASTS) — NUEVO

**Archivo nuevo:** `js/toasts.js` + estilos en `css/style.css`.
Inspirado en Notion / Linear / Discord / ClickUp.

- 4 tipos: **éxito** ✅, **error** ❌, **advertencia** ⚠️, **información** ℹ️.
- Animación de entrada y salida suave (deslizamiento + escala).
- Barra de progreso que indica el tiempo restante.
- Se pausa al pasar el cursor por encima.
- Botón de cierre manual.
- Diseño responsive (en móvil ocupan el ancho disponible).

**Uso:** `SF.Toast.success('mensaje')`, `SF.Toast.error(...)`, `SF.Toast.warning(...)`,
`SF.Toast.info(...)`.

Se reemplazaron los `alert()` antiguos por toasts en: creación/edición/eliminación de
tareas, guardado de métodos, registro de lecturas, configuración, y cambio de tema.

---

## 🔕 SISTEMA DE NOTIFICACIONES — REVISADO

**Archivo:** `js/notifications.js`.

### Problemas corregidos
- **Recordatorios duplicados:** antes se usaba una ventana de "3 horas" poco fiable.
  Ahora hay un **registro persistente** (`localStorage: sf_notif_fired`) que garantiza
  que cada combinación (tarea + umbral) se notifique **una sola vez**.
- **Notificaciones idénticas repetidas:** `add()` ahora ignora una notificación con el
  mismo título y mensaje emitida en los últimos 60 segundos.
- **Limpieza automática:** se eliminan los registros de tareas que ya no existen o que
  superan los 7 días.

### Umbrales de notificación de tareas
- **24 horas antes**
- **12 horas antes**
- **1 hora antes**
- **Al momento de vencer** (vencida)

### Centro de Notificaciones (campana)
Ya existía en la barra superior y se mantiene: muestra recordatorios, contador de no
leídas, marcar todas como leídas, y notificaciones leídas/pendientes diferenciadas por
color de urgencia.

---

## 🌗 MODO CLARO / OSCURO — NUEVO

**Archivo nuevo:** `js/theme.js` + bloque `[data-theme="light"]` en `css/style.css`.

- Modo claro y modo oscuro.
- **Cambio instantáneo** (toda la UI usa variables CSS, así que el cambio es inmediato).
- **Persistencia** en `localStorage` (`sf_theme`).
- Se aplica antes del render para evitar parpadeo (FOUC).
- **Selector dentro de Configuración** → tarjeta "Apariencia", con interruptor y chips
  "Oscuro / Claro".

---

## 👤 CONFIGURACIÓN DE PERFIL — Unidad Educativa (NUEVO)

- Se añadió el campo **"Unidad Educativa"** en Configuración → Perfil.
- Se guarda en el campo **YA EXISTENTE** `settings.school` del modelo `User`
  (no se modificó el esquema de la base de datos).
- Se puede editar y se muestra dentro del perfil.

### Cambio aditivo en el backend (único archivo backend tocado)
**Archivo:** `studyflow-backend/controllers/authController.js`
- `updateProfile` ahora acepta `school` y lo mapea a `settings.school` (campo existente).
- `safeUser()` ahora devuelve también `settings`, para que el frontend reciba el valor.

> Nota: esto **no** altera la estructura de la base de datos; el campo `settings.school`
> ya estaba definido en `models/User.js` desde el inicio.

---

## 📚 MÉTODOS DE ESTUDIO INTERACTIVOS — NUEVO

**Archivo nuevo:** `js/methods.js` + estilos en `css/style.css`.

Ahora el botón **"Usar"** de cada técnica abre **su propia plantilla personalizada**
(no una pantalla genérica). Todas guardan automáticamente en `localStorage`
(`sf_method_<id>`) y permiten editar después de recargar.

| Método | Plantilla |
|---|---|
| 🍅 **Pomodoro** | Temporizador con fases, sesiones completadas, descansos cortos/largos, minutos enfocados y registro de productividad. |
| 💡 **Feynman** | Concepto · Explicación para un niño · Lista editable de vacíos · Explicación final. |
| 📝 **Cornell** | Plantilla real de 3 paneles: ideas clave, apuntes detallados y resumen. |
| 🧠 **Mapa Mental** | Editor de nodo central + ramas + subnodos conectados. |
| 🔄 **Repetición Espaciada** | Genera automáticamente fechas de repaso (1, 3, 7, 15, 30 días) con calendario marcable. |
| 🎯 **Recall Activo** | Tema · Lo que recuerdo · Lo que olvidé · Corrección · Resultado final. |

---

## 📊 DASHBOARD — Revisión de estadísticas

- **Tareas Completadas:** ahora derivado del estado real (sin duplicación).
- **Métodos utilizados:** nuevo cálculo basado en plantillas con datos guardados.
- **Tiempo de enfoque, Pomodoros, Racha, Progreso semanal:** revisados; el progreso
  semanal se calcula desde las tareas completadas por día.

---

## 🔗 PERFIL DEL DESARROLLADOR — Dónde colocar tus enlaces

**Archivo:** `index.html` — sección `dev-credit` de la barra lateral.
Los enlaces están marcados con un comentario y un valor de marcador de posición.
**Reemplaza el texto en mayúsculas por tu URL real.**

### Instagram
- **Línea 74**
- Reemplaza:
  ```html
  <a href="TU_INSTAGRAM" target="_blank" title="Instagram" rel="noopener">
  ```
- Por (ejemplo):
  ```html
  <a href="https://instagram.com/tu_usuario" target="_blank" title="Instagram" rel="noopener">
  ```

### GitHub
- **Línea 78**
- Reemplaza:
  ```html
  <a href="TU_GITHUB" target="_blank" title="GitHub" rel="noopener">
  ```
- Por (ejemplo):
  ```html
  <a href="https://github.com/tu_usuario" target="_blank" title="GitHub" rel="noopener">
  ```

### LinkedIn
- **Línea 82**
- Reemplaza:
  ```html
  <a href="TU_LINKEDIN" target="_blank" title="LinkedIn" rel="noopener">
  ```
- Por (ejemplo):
  ```html
  <a href="https://linkedin.com/in/tu_usuario" target="_blank" title="LinkedIn" rel="noopener">
  ```

> No se colocaron enlaces falsos: son marcadores de posición claramente identificables.

---

## 🔍 AUDITORÍA GENERAL

- **Sintaxis:** los 11 archivos JS del frontend y los 8 del backend pasan `node --check`.
- **Eventos duplicados:** el `toggle` ya no dispara escrituras redundantes al backend.
- **Fugas de memoria:** los intervalos del temporizador se limpian con `clearInterval`
  en pausa/reinicio/cambio de fase.
- **Sincronización:** las estadísticas derivadas evitan estados inconsistentes tras
  recargar.
- **Responsive:** toasts, plantillas de métodos y tarjetas se adaptan a móvil
  (media queries añadidas).
- **`alert()` restantes:** solo quedan 2 como *fallback* defensivo (se ejecutan
  únicamente si el sistema de toasts no estuviera disponible).

---

## 🗂️ Archivos modificados / nuevos

### Nuevos
- `js/toasts.js` — sistema de alertas.
- `js/theme.js` — modo claro/oscuro.
- `js/methods.js` — plantillas interactivas de métodos.

### Modificados
- `index.html` — nuevos `<script>`, enlaces del desarrollador marcados.
- `app.js` — dashboard derivado, ajustes de Configuración (perfil + tema), toasts.
- `css/style.css` — tema claro, toasts, plantillas de métodos, chips de tema.
- `js/tasks.js` — corrección del contador, toasts.
- `js/notifications.js` — umbrales 24/12/1/0h, anti-duplicado.
- `js/study.js` — botón "Usar" abre plantillas interactivas.
- `js/reading.js` — toasts.
- `js/timer.js` — toasts.
- `studyflow-backend/controllers/authController.js` — `school` aditivo + `settings` en respuesta.

---

## ▶️ Cómo ejecutar

1. Extrae el ZIP.
2. En `studyflow-backend/`: `npm install` y luego `node server.js`.
3. Abre `index.html` (idealmente con un servidor estático tipo Live Server).
4. Reemplaza tus enlaces de GitHub / Instagram / LinkedIn (ver sección de arriba).

---

*Toda la comunicación con MongoDB y la infraestructura de persistencia permanece intacta.*
