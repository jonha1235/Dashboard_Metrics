import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Clock, CheckCircle, Bug, LayoutDashboard, PlusCircle, Trash2, Filter } from 'lucide-react';
import './App.css';

axios.defaults.baseURL = 'http://localhost:3000';

function App() {
  const [historias, setHistorias] = useState([]);
  const [metricas, setMetricas] = useState({ promedio_dias: 0, detalle_tareas: [] });
  const [defectos, setDefectos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [nuevaHistoria, setNuevaHistoria] = useState({ titulo: '', puntos: 1, sprint: 'Sprint 1' });
  const [filtroSprint, setFiltroSprint] = useState('Todos');
  const [graficaVisible, setGraficaVisible] = useState(null);

  const [modalInfo, setModalInfo] = useState({ isVisible: false, type: 'success', message: '' });

  const [vistaActiva, setVistaActiva] = useState('tablero');

  const LIMITE_WIP = 2;

  const showModal = (type, message) => {
    setModalInfo({ isVisible: true, type, message });
  };

  const closeModal = () => {
    setModalInfo({ isVisible: false, type: 'success', message: '' });
  };

  const cargarDatos = async () => {
    try {
      const [resHistorias, resMetricas, resDefectos] = await Promise.all([
        axios.get('/api/historias'),
        axios.get('/api/metricas/cycletime'),
        axios.get('/api/defectos')
      ]);
      setHistorias(resHistorias.data);
      setMetricas(resMetricas.data);
      setDefectos(resDefectos.data);
    } catch (error) { console.error(error); } finally { setCargando(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const mostrarFechaLimpia = (fechaIso) => {
    if (!fechaIso) return '';
    try { return fechaIso.split('T')[0]; } catch(e) { return fechaIso; }
  };

  const obtenerDatosFecha = (tarea) => {
    if (tarea.estado === 'Done' && tarea.fecha_terminado) {
      return { etiqueta: 'Fin:', valor: tarea.fecha_terminado };
    } else if ((tarea.estado === 'WIP' || tarea.estado === 'Testing') && tarea.fecha_inicio_wip) {
      return { etiqueta: 'Inicio:', valor: tarea.fecha_inicio_wip };
    }
    return { etiqueta: 'Creada:', valor: tarea.fecha_creacion };
  };

  const crearHistoria = async (e) => {
    e.preventDefault();
    if (nuevaHistoria.puntos < 1) {
      showModal('error', 'Los puntos de historia no pueden ser negativos ni cero.');
      return;
    }
    try {
      await axios.post('/api/historias', {
        titulo: nuevaHistoria.titulo,
        puntos_historia: nuevaHistoria.puntos,
        sprint: nuevaHistoria.sprint
      });
      setNuevaHistoria({ titulo: '', puntos: 1, sprint: nuevaHistoria.sprint });
      cargarDatos();
      showModal('success', 'La historia de usuario ha sido creada exitosamente.');
    } catch (error) {
      console.error(error);
      showModal('error', 'Hubo un error al crear la historia de usuario.');
    }
  };

  const iniciarTarea = async (id) => {
    const tareasWIP = historias.filter(h => h.estado === 'WIP').length;
    if (tareasWIP >= LIMITE_WIP) {
      showModal('error', `No puedes tener mas de ${LIMITE_WIP} tareas en progreso.`);
      return;
    }
    const fecha = window.prompt("¿Cuando inicio esta tarea? (AAAA-MM-DD):", new Date().toISOString().split('T')[0]);
    if (!fecha) return;
    try {
      await axios.put(`/api/historias/${id}/iniciar`, { fecha_inicio: fecha });
      cargarDatos();
    } catch (error) { console.error(error); }
  };

  const moverHistoria = async (id, nuevoEstado) => {
    const tieneBug = defectos.some(d => d.historia_id === id && d.estado === 'Abierto');
    if (tieneBug) {
      showModal('error', 'Esta tarea tiene un bug escapado. No puedes moverla.');
      return;
    }

    if (nuevoEstado === 'Testing') await axios.put(`/api/historias/${id}/mover`, { nuevo_estado: 'Testing' });
    cargarDatos();
  };

  const terminarTarea = async (id) => {
    const tieneBug = defectos.some(d => d.historia_id === id && d.estado === 'Abierto');
    if (tieneBug) {
      showModal('error', 'Esta tarea tiene un bug escapado. No puedes terminarla.');
      return;
    }

    const tareaObj = historias.find(h => h.id === id);
    if (!tareaObj) return;

    const fechaInicioStr = tareaObj.fecha_inicio_wip ? tareaObj.fecha_inicio_wip.split('T')[0] : null;
    const mensajePrompt = fechaInicioStr
        ? `Ingresa fecha de fin (Debe ser igual o posterior al ${fechaInicioStr}):`
        : "Ingrese fecha de fin (AAAA-MM-DD):";

    const fecha = window.prompt(mensajePrompt, new Date().toISOString().split('T')[0]);
    if (!fecha) return;
    if (fechaInicioStr && new Date(fecha) < new Date(fechaInicioStr)) {
      showModal('error', `ERROR TEMPORAL: No puedes terminar la tarea antes de iniciarla (${fechaInicioStr}).`);
      return;
    }
    try {
      await axios.put(`/api/historias/${id}/terminar`, { fecha_done: fecha });
      cargarDatos();
    } catch (error) { console.error(error); }
  };

  const reportarBug = async (id) => {
    const desc = window.prompt("Descripcion del error en produccion:");
    if (!desc) return;
    const fecha = window.prompt("Fecha del reporte (AAAA-MM-DD):", new Date().toISOString().split('T')[0]);
    if (!fecha) return;

    try {
      await axios.post('/api/defectos', { historia_id: id, descripcion: desc, fecha: fecha });
      cargarDatos();
      showModal('success', 'Defecto escapado, la historia de usuario es de alta prioridad');
    } catch (error) {
      console.error(error);
      showModal('error', 'Hubo un error al reportar el defecto.');
    }
  };

  const eliminarHistoria = async (id) => {
    if (window.confirm("¿Estas seguro de eliminar esta tarea?")) {
      try {
        await axios.delete(`/api/historias/${id}`);
        cargarDatos();
      } catch (error) { console.error(error); }
    }
  };

  const historiasFiltradas = historias.filter(h =>
      filtroSprint === 'Todos' ? true : h.sprint === filtroSprint
  );

  const cycleTimeFiltrado = metricas.detalle_tareas.filter(t => {
    if (filtroSprint === 'Todos') return true;
    const historiaOriginal = historias.find(h => h.id === t.id);
    return historiaOriginal && historiaOriginal.sprint === filtroSprint;
  });

  let promedioCycleDinamico = 0;
  if (cycleTimeFiltrado.length > 0) {
    const totalDias = cycleTimeFiltrado.reduce((sum, t) => sum + t.dias_cycle_time, 0);
    promedioCycleDinamico = (totalDias / cycleTimeFiltrado.length).toFixed(1);
  }

  const defectosFiltrados = defectos.filter(d => {
    if (filtroSprint === 'Todos') return true;
    const historiaOriginal = historias.find(h => h.id === d.historia_id);
    return historiaOriginal && historiaOriginal.sprint === filtroSprint;
  });

  const datosGraficaCycle = cycleTimeFiltrado.map(t => ({
    nombre: t.titulo.substring(0, 10) + '...', 'Dias': t.dias_cycle_time
  }));

  const bugsPorFecha = defectosFiltrados.reduce((acc, bug) => {
    const f = mostrarFechaLimpia(bug.fecha_reporte);
    acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {});
  const datosGraficaDefectos = Object.keys(bugsPorFecha).map(k => ({ fecha: k, Bugs: bugsPorFecha[k] }));

  if (cargando) return <div className="loading">Cargando Dashboard GQM...</div>;

  const tareasWIP = historiasFiltradas.filter(h => h.estado === 'WIP').length;

  return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-title">
            <LayoutDashboard size={32} color="#2563eb" />
            <div>
              <h1>Dashboard de Metricas GQM</h1>
              <p className="subtitle">Plataforma de Analisis GQM para principiantes</p>
            </div>
          </div>
        </header>

        <div className="tabs-menu">
          <button
              className={`tab-btn ${vistaActiva === 'tablero' ? 'active' : ''}`}
              onClick={() => setVistaActiva('tablero')}
          >
            Tablero Operativo
          </button>
          <button
              className={`tab-btn ${vistaActiva === 'metricas' ? 'active' : ''}`}
              onClick={() => setVistaActiva('metricas')}
          >
            Analisis de Metricas
          </button>
        </div>

        {vistaActiva === 'tablero' && (
            <div className="kanban-section fade-in">
              <div className="kanban-controls">
                <div className="sprint-filter">
                  <Filter size={18} color="#64748b" />
                  <select value={filtroSprint} onChange={(e) => setFiltroSprint(e.target.value)}>
                    <option value="Todos">General (Todos los Sprints)</option>
                    <option value="Sprint 1">Sprint 1</option>
                    <option value="Sprint 2">Sprint 2</option>
                    <option value="Sprint 3">Sprint 3</option>
                  </select>
                </div>

                <form className="crear-historia-form" onSubmit={crearHistoria}>
                  <input
                      type="text"
                      placeholder="Escribe la historia de usuario..."
                      value={nuevaHistoria.titulo}
                      onChange={e => setNuevaHistoria({ ...nuevaHistoria, titulo: e.target.value })}
                      required
                  />
                  <input
                      type="number"
                      min="1"
                      title="Puntos de Historia"
                      value={nuevaHistoria.puntos}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setNuevaHistoria({ ...nuevaHistoria, puntos: val > 0 ? val : 1 });
                      }}
                  />
                  <select value={nuevaHistoria.sprint} onChange={e => setNuevaHistoria({ ...nuevaHistoria, sprint: e.target.value })}>
                    <option value="Sprint 1">Sprint 1</option>
                    <option value="Sprint 2">Sprint 2</option>
                    <option value="Sprint 3">Sprint 3</option>
                  </select>
                  <button type="submit" className="btn-add"><PlusCircle size={18} /> Agregar Tarea</button>
                </form>
              </div>

              <div className="kanban-board">
                {['Backlog', 'WIP', 'Testing', 'Done'].map(col => (
                    <div key={col} className="kanban-column">
                      <div className="column-header-container">
                        <h3 className="column-header">{col}</h3>
                        {col === 'WIP' && <span className="wip-badge">{tareasWIP}/{LIMITE_WIP}</span>}
                      </div>
                      <div className="column-content">
                        {historiasFiltradas.filter(h => h.estado === col).map(tarea => {
                          const fechaDatos = obtenerDatosFecha(tarea);
                          const tieneBug = defectos.some(d => d.historia_id === tarea.id && d.estado === 'Abierto');
                          const cardClassName = `kanban-card ${tieneBug ? 'kanban-card--critical' : ''}`;

                          return (
                              <div key={tarea.id} className={cardClassName}>
                                <div className="card-header">
                                  <span className="sprint-tag">{tarea.sprint}</span>
                                  <small className="date-text">
                                    <strong>{fechaDatos.etiqueta}</strong> {mostrarFechaLimpia(fechaDatos.valor)}
                                  </small>
                                </div>

                                {tieneBug && (
                                    <div className="high-priority-legend">
                                      Alta Prioridad
                                    </div>
                                )}

                                <h4>{tarea.titulo}</h4>
                                <div className="card-meta">
                                  <span className="badge-pts">{tarea.puntos_historia} pts</span>
                                  <span className="badge-id">#ID-{tarea.id}</span>
                                </div>
                                <div className="card-actions-grid">
                                  {col === 'Backlog' && <button onClick={() => iniciarTarea(tarea.id)} className="btn-primary">Iniciar</button>}
                                  {col === 'WIP' && <button onClick={() => moverHistoria(tarea.id, 'Testing')} className="btn-secondary">Probar</button>}
                                  {col === 'Testing' && <button onClick={() => terminarTarea(tarea.id)} className="btn-success"><CheckCircle size={16} /> Terminar</button>}
                                  {col === 'Done' && (
                                      <div className="done-actions">
                                        <button onClick={() => reportarBug(tarea.id)} className="btn-bug" title="Reportar Bug"><Bug size={16} /></button>
                                        <button onClick={() => eliminarHistoria(tarea.id)} className="btn-del" title="Eliminar"><Trash2 size={16} /></button>
                                      </div>
                                  )}
                                </div>
                              </div>
                          );
                        })}
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        {vistaActiva === 'metricas' && (
            <div className="metrics-section fade-in">
              <div className="sprint-filter" style={{ marginBottom: '20px', display: 'inline-flex' }}>
                <Filter size={18} color="#64748b" />
                <select value={filtroSprint} onChange={(e) => setFiltroSprint(e.target.value)}>
                  <option value="Todos">General (Todos los Sprints)</option>
                  <option value="Sprint 1">Sprint 1</option>
                  <option value="Sprint 2">Sprint 2</option>
                  <option value="Sprint 3">Sprint 3</option>
                </select>
              </div>

              <div className="kpi-grid">
                <div className={`kpi-card ${tareasWIP > LIMITE_WIP ? 'alert-danger' : 'alert-safe'}`}>
                  <div className="kpi-icon"><AlertCircle size={36} /></div>
                  <div className="kpi-content">
                    <h3>Trabajo en Progreso (WIP)</h3>
                    <h2>{tareasWIP} <span>/ {LIMITE_WIP} Tareas</span></h2>
                    <small>Metrica M1 (Eficiencia)</small>
                  </div>
                </div>
                <div className="kpi-card info">
                  <div className="kpi-icon"><Clock size={36} /></div>
                  <div className="kpi-content">
                    <h3>Cycle Time Promedio</h3>
                    <h2>{promedioCycleDinamico} <span>Dias</span></h2>
                    <small>Metrica M2 (Velocidad)</small>
                  </div>
                </div>
                <div className="kpi-card warning">
                  <div className="kpi-icon"><Bug size={36} /></div>
                  <div className="kpi-content">
                    <h3>Defectos Escapados</h3>
                    <h2>{defectosFiltrados.length} <span>Bugs Activos</span></h2>
                    <small>Metrica M3 (Calidad)</small>
                  </div>
                </div>
              </div>

              <div className="graficas-toggle-section" style={{ marginTop: '20px', borderTop: 'none' }}>
                <h2>Analisis y Graficas del {filtroSprint === 'Todos' ? 'Proyecto General' : filtroSprint}</h2>
                <div className="toggle-buttons">
                  <button className={`btn-toggle ${graficaVisible === 'cycle' ? 'active' : ''}`} onClick={() => setGraficaVisible(graficaVisible === 'cycle' ? null : 'cycle')}>
                    <Clock size={18} /> Ver Grafica Cycle Time
                  </button>
                  <button className={`btn-toggle bug-toggle ${graficaVisible === 'bugs' ? 'active' : ''}`} onClick={() => setGraficaVisible(graficaVisible === 'bugs' ? null : 'bugs')}>
                    <Bug size={18} /> Ver Grafica de Defectos
                  </button>
                </div>

                <div className="charts-display-area">
                  {graficaVisible === 'cycle' && (
                      <div className="chart-card fade-in">
                        <div className="chart-header"><h3>Control Chart: Cycle Time</h3></div>
                        {datosGraficaCycle.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                              <LineChart data={datosGraficaCycle} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" />
                                <YAxis />
                                <Tooltip />
                                <Legend verticalAlign="top" height={36} />
                                <Line name="Dias en terminar" type="monotone" dataKey="Dias" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
                              </LineChart>
                            </ResponsiveContainer>
                        ) : <p style={{textAlign: 'center', color: '#94a3b8', padding: '40px'}}>No hay tareas terminadas en este sprint.</p>}
                      </div>
                  )}
                  {graficaVisible === 'bugs' && (
                      <div className="chart-card fade-in">
                        <div className="chart-header"><h3>Frecuencia de Defectos (Bugs)</h3></div>
                        {datosGraficaDefectos.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                              <BarChart data={datosGraficaDefectos} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend verticalAlign="top" height={36} />
                                <Bar name="Cantidad de Bugs" dataKey="Bugs" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={50} />
                              </BarChart>
                            </ResponsiveContainer>
                        ) : <p style={{textAlign: 'center', color: '#94a3b8', padding: '40px'}}>No hay bugs reportados en este sprint.</p>}
                      </div>
                  )}
                </div>
              </div>
            </div>
        )}

        {modalInfo.isVisible && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className={`modal-content modal-${modalInfo.type}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  {modalInfo.type === 'success' ? 'Exito' : 'Error'}
                  <button className="modal-close-btn" onClick={closeModal}>&times;</button>
                </div>
                <div className="modal-body">
                  <p>{modalInfo.message}</p>
                </div>
                <div className="modal-footer">
                  <button className={`modal-btn modal-btn-${modalInfo.type}`} onClick={closeModal}>Aceptar</button>
                </div>
              </div>
            </div>
        )}

      </div>
  );
}

export default App;