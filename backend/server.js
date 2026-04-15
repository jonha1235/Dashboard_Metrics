const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'admin',
    password: 'admin123',
    database: 'metrics_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ==========================================
// 2. RUTAS API PARA EL DASHBOARD GQM
// ==========================================

// Obtener todas las historias
app.get('/api/historias', (req, res) => {
    db.query('SELECT * FROM historias_usuario ORDER BY fecha_creacion DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        res.json(results);
    });
});

// Métrica de Cycle Time
app.get('/api/metricas/cycletime', (req, res) => {
    const query = `
        SELECT id, titulo, puntos_historia, DATEDIFF(fecha_terminado, fecha_inicio_wip) AS dias_cycle_time
        FROM historias_usuario
        WHERE estado = 'Done' AND fecha_inicio_wip IS NOT NULL AND fecha_terminado IS NOT NULL;
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al calcular Cycle Time' });
        let promedio = 0;
        if (results.length > 0) {
            const totalDias = results.reduce((suma, tarea) => suma + tarea.dias_cycle_time, 0);
            promedio = (totalDias / results.length).toFixed(1);
        }
        res.json({ promedio_dias: promedio, detalle_tareas: results });
    });
});

// Obtener defectos
app.get('/api/defectos', (req, res) => {
    const query = `SELECT d.*, h.titulo AS historia_titulo FROM defectos d LEFT JOIN historias_usuario h ON d.historia_id = h.id ORDER BY d.fecha_reporte DESC;`;
    db.query(query, (err, results) => res.json(results));
});

// Crear historia
app.post('/api/historias', (req, res) => {
    const { titulo, puntos_historia, sprint } = req.body;
    if (!titulo) return res.status(400).json({ error: 'El título es obligatorio' });

    const query = 'INSERT INTO historias_usuario (titulo, puntos_historia, sprint, estado, fecha_creacion) VALUES (?, ?, ?, "Backlog", NOW())';
    db.query(query, [titulo, puntos_historia || 1, sprint || 'Sprint 1'], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al insertar' });
        res.status(201).json({ id: result.insertId, mensaje: 'Historia creada con éxito' });
    });
});

// NUEVO: Iniciar tarea con fecha manual (Desde el prompt de React)
app.put('/api/historias/:id/iniciar', (req, res) => {
    const { id } = req.params;
    const { fecha_inicio } = req.body;
    const query = 'UPDATE historias_usuario SET estado = "WIP", fecha_inicio_wip = ? WHERE id = ?';
    db.query(query, [fecha_inicio, id], (err) => {
        if (err) return res.status(500).json({ error: 'Error al iniciar' });
        res.json({ mensaje: 'Tarea iniciada' });
    });
});

// Mover a Testing (Estado intermedio)
app.put('/api/historias/:id/mover', (req, res) => {
    const { id } = req.params;
    const { nuevo_estado } = req.body;
    const query = 'UPDATE historias_usuario SET estado = ? WHERE id = ?';
    db.query(query, [nuevo_estado, id], (err) => {
        if (err) return res.status(500).json({ error: 'Error al mover' });
        res.json({ mensaje: 'Estado actualizado' });
    });
});

// Terminar tarea con fecha manual (Para simular Cycle Time)
app.put('/api/historias/:id/terminar', (req, res) => {
    const { id } = req.params;
    const { fecha_done } = req.body;
    const query = 'UPDATE historias_usuario SET estado = "Done", fecha_terminado = ? WHERE id = ?';
    db.query(query, [fecha_done, id], (err) => {
        if (err) return res.status(500).json({ error: 'Error al terminar' });
        res.json({ mensaje: 'Tarea terminada con éxito' });
    });
});

// Reportar defecto escapado
app.post('/api/defectos', (req, res) => {
    const { historia_id, descripcion, fecha } = req.body;
    if (!descripcion || !historia_id) return res.status(400).json({ error: 'Faltan datos' });
    const fechaSql = fecha ? `${fecha} 12:00:00` : new Date().toISOString().slice(0, 19).replace('T', ' ');
    const query = 'INSERT INTO defectos (historia_id, descripcion, estado, fecha_reporte) VALUES (?, ?, "Abierto", ?)';
    db.query(query, [historia_id, descripcion, fechaSql], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al reportar defecto' });
        res.status(201).json({ mensaje: 'Defecto reportado exitosamente' });
    });
});

// Eliminar historia
app.delete('/api/historias/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM historias_usuario WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar' });
        res.json({ mensaje: 'Historia eliminada correctamente' });
    });
});

// ==========================================
// 3. ARRANCAR EL SERVIDOR
// ==========================================
app.listen(port, () => {
    console.log(`📊 PIMS Dashboard - Backend Metrics API`);
    console.log(`✅ Conectado a MariaDB (metrics_db)`);
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});