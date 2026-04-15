USE metrics_db;

CREATE TABLE historias_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    estado ENUM('Backlog', 'WIP', 'Testing', 'Done') DEFAULT 'Backlog',
    puntos_historia INT DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio_wip DATETIME NULL,
    fecha_terminado DATETIME NULL
);

INSERT INTO historias_usuario (titulo, puntos_historia, estado, fecha_creacion) VALUES ('Diseñar UI', 5, 'Backlog', '2026-04-01 09:00:00');
INSERT INTO historias_usuario (titulo, puntos_historia, estado, fecha_creacion, fecha_inicio_wip) VALUES ('Crear API', 8, 'WIP', '2026-04-02 08:00:00', '2026-04-04 10:00:00');
INSERT INTO historias_usuario (titulo, puntos_historia, estado, fecha_creacion, fecha_inicio_wip, fecha_terminado) VALUES ('Instalar React', 2, 'Done', '2026-04-01 08:00:00', '2026-04-01 10:00:00', '2026-04-02 15:00:00');
INSERT INTO defectos (historia_id, descripcion, estado, fecha_reporte) VALUES (3, 'Error al compilar', 'Resuelto', '2026-04-03 10:00:00');







ALTER TABLE historias_usuario ADD COLUMN sprint VARCHAR(50) DEFAULT 'Sprint 1' AFTER estado;