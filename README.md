#  AgileMetrics - GQM Dashboard

Una plataforma integral de gestión y análisis de métricas de software basada en el modelo **GQM (Goal-Question-Metric)**. Este sistema permite a los equipos de desarrollo no solo gestionar tareas mediante un tablero Kanban, sino extraer datos accionables sobre eficiencia, predictibilidad y calidad.

##  Características Principales

- **Tablero Kanban Dinámico:** Gestión del ciclo de vida de historias de usuario (Backlog, WIP, Testing, Done).
- **Control de Eficiencia (Métrica WIP):** Bloqueo automático de tareas en progreso para evitar la saturación del equipo (Ley de Little).
- **Análisis de Predictibilidad (Cycle Time):** Cálculo automático del tiempo promedio de entrega basado en datos reales de MariaDB.
- **Gestión de Calidad (Bugs Escapados):** Sistema de reporte de defectos en producción con alertas visuales de "Alta Prioridad".
- **Visualización Profesional:** Gráficas de líneas y barras interactivas mediante Recharts.
- **Filtrado por Sprints:** Capacidad de aislar métricas por ciclos de trabajo específicos.

##  Stack Tecnológico

### Frontend
- **React.js**: Biblioteca principal para la interfaz de usuario.
- **Recharts**: Visualización dinámica de datos.
- **Lucide-React**: Iconografía vectorial profesional.
- **Axios**: Comunicación con la API del Backend.

### Backend
- **Node.js & Express**: Servidor y arquitectura de API RESTful.
- **MariaDB**: Base de datos relacional para garantizar la integridad y persistencia.

## El Modelo GQM Aplicado

Este proyecto responde a tres metas de negocio fundamentales:

1. **Meta de Eficiencia:** ¿Cómo optimizamos el flujo? -> **Métrica:** Límite WIP (Máximo 2 tareas).
2. **Meta de Predictibilidad:** ¿Cuándo entregaremos? -> **Métrica:** Cycle Time Promedio (Días entre WIP y Done).
3. **Meta de Calidad:** ¿Qué tan estable es el código? -> **Métrica:** Frecuencia de Defectos Escapados.

##  Instalación y Configuración

### 1. Requisitos Previos
- Node.js instalado.
- MariaDB/MySQL corriendo en el puerto 3306.
### 2. Configuración de la Base de Datos
1. Crea una base de datos local llamada `metrics_db`.
2. Importa el archivo `HU.sql` que se encuentra en la raíz del proyecto para generar las tablas `historias_usuario` y `defectos` con datos de prueba iniciales.


### 3. Instalación del Backend

```bash
cd backend
npm install
node server.js

## 4.instalcion del Frontend
cd frontend
npm install
npm run dev
