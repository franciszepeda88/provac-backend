import { useState, useEffect, useMemo } from 'react';
import { API_URL } from '../config';
import DetailModal from './DetailModal';
import { exportListToExcel } from '../utils/exportUtils';
import './Dashboard.css';

const TIPO_LABELS = {
  transporte: 'Transporte',
  transmision: 'Transmisión de Fuerza',
  modular: 'Modular Plástica',
  thermodrive: 'Thermodrive'
};

export default function Dashboard({ onEditar }) {
  const [levantamientos, setLevantamientos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarLevantamientos();
  }, []);

  const cargarLevantamientos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/levantamientos`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al cargar levantamientos');
      const data = await response.json();
      setLevantamientos(Array.isArray(data.levantamientos) ? data.levantamientos : []);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los datos');
      setLoading(false);
    }
  };

  const eliminarLevantamiento = async (id) => {
    if (!window.confirm('¿Eliminar este levantamiento? Esta acción no se puede deshacer.')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/levantamientos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setLevantamientos(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      alert('No se pudo eliminar: ' + err.message);
    }
  };

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return levantamientos.filter(lev => {
      if (filtroTipo !== 'todos' && lev.tipo_banda !== filtroTipo) return false;
      if (filtroEstado !== 'todos' && lev.estado !== filtroEstado) return false;
      if (!q) return true;

      const enCampos = [lev.cliente_nombre, lev.folio, lev.ubicacion]
        .filter(Boolean)
        .some(v => v.toLowerCase().includes(q));

      const enDatos = lev.datos
        ? JSON.stringify(lev.datos).toLowerCase().includes(q)
        : false;

      return enCampos || enDatos;
    });
  }, [busqueda, filtroTipo, filtroEstado, levantamientos]);

  // Varias bandas pueden compartir el mismo folio (un levantamiento con
  // varias bandas registrado desde la app técnico). Se agrupan para que la
  // tabla las muestre juntas, con el folio y el cliente en una sola celda.
  const gruposPorFolio = useMemo(() => {
    const mapa = new Map();
    filtrados.forEach((lev) => {
      const key = lev.folio && lev.folio.trim() ? lev.folio : `sin-folio-${lev.id}`;
      if (!mapa.has(key)) mapa.set(key, []);
      mapa.get(key).push(lev);
    });
    return Array.from(mapa.values());
  }, [filtrados]);

  const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-HN');

  // La lista no trae fotos ni firmas (para que cargue rápido con TODOS los levantamientos
  // de TODOS los técnicos); se piden completas al abrir el detalle de uno en particular.
  const abrirDetalle = async (lev) => {
    setCargandoDetalle(lev.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/levantamientos/${lev.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al cargar el detalle');
      const data = await response.json();
      setSeleccionado(data.levantamiento);
    } catch (err) {
      setSeleccionado(lev);
    } finally {
      setCargandoDetalle(null);
    }
  };

  const handleExportarExcel = () => {
    exportListToExcel(filtrados, 'levantamientos_provac.xlsx');
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title-row">
          <h2>Levantamientos</h2>
          <button className="btn-exportar" onClick={handleExportarExcel}>Exportar Excel</button>
        </div>
        <div className="filtros">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por cliente, folio o palabra clave..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="todos">Todos los tipos</option>
            {Object.entries(TIPO_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            <option value="completo">Completo</option>
            <option value="borrador">Borrador</option>
          </select>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Tipo de Banda</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              gruposPorFolio.map((grupo) => (
                grupo.map((lev, idx) => (
                  <tr key={lev.id} className={grupo.length > 1 ? 'fila-multibanda' : undefined}>
                    {idx === 0 && <td rowSpan={grupo.length}>{lev.folio || '—'}{grupo.length > 1 && <span className="badge-multibanda">{grupo.length} bandas</span>}</td>}
                    {idx === 0 && <td rowSpan={grupo.length}>{lev.cliente_nombre}</td>}
                    <td>{TIPO_LABELS[lev.tipo_banda] || lev.tipo_banda || '—'}</td>
                    <td>
                      <span className={`badge badge-${lev.estado}`}>{lev.estado || 'completo'}</span>
                    </td>
                    <td>{formatearFecha(lev.created_at)}</td>
                    <td className="acciones">
                      <button className="btn-ver" onClick={() => abrirDetalle(lev)} disabled={cargandoDetalle === lev.id}>
                        {cargandoDetalle === lev.id ? 'Cargando...' : 'Ver'}
                      </button>
                      <button className="btn-eliminar" onClick={() => eliminarLevantamiento(lev.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">No hay levantamientos</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="total">
        Total: {filtrados.length} de {levantamientos.length} levantamientos
      </div>

      {seleccionado && (
        <DetailModal
          levantamiento={seleccionado}
          onClose={() => setSeleccionado(null)}
          onEditar={(lev) => { setSeleccionado(null); onEditar(lev); }}
        />
      )}
    </div>
  );
}
