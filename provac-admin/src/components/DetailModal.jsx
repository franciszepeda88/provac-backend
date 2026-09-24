import { exportDetailToPDF, exportDetailToExcel } from '../utils/exportUtils';
import './DetailModal.css';

const TIPO_LABELS = {
  transporte: 'Banda de Transporte',
  transmision: 'Banda de Transmisión de Fuerza',
  modular: 'Banda Modular Plástica',
  thermodrive: 'Banda Thermodrive'
};

// Convierte una clave tipo "ancho_banda" en una etiqueta legible "Ancho Banda"
const humanize = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

export default function DetailModal({ levantamiento, onClose, onEditar }) {
  if (!levantamiento) return null;

  const { datos = {}, fotos = [], firma_tecnico, firma_cliente } = levantamiento;

  const entries = Object.entries(datos).filter(([, v]) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== null && v !== undefined && v !== '';
  });

  return (
    <div className="dm-overlay" onClick={onClose}>
      <div className="dm-box" onClick={(e) => e.stopPropagation()}>
        <div className="dm-header">
          <div>
            <h2>{levantamiento.cliente_nombre}</h2>
            <span className="dm-tipo">{TIPO_LABELS[levantamiento.tipo_banda] || levantamiento.tipo_banda}</span>
          </div>
          <button className="dm-close" onClick={onClose}>✕</button>
        </div>

        <div className="dm-meta">
          <span>Folio: <b>{levantamiento.folio || '—'}</b></span>
          <span>Estado: <b className={`dm-badge dm-badge-${levantamiento.estado}`}>{levantamiento.estado}</b></span>
          <span>Fecha: <b>{new Date(levantamiento.created_at).toLocaleDateString('es-HN')}</b></span>
        </div>

        <div className="dm-actions">
          <button className="dm-btn-primary" onClick={() => onEditar(levantamiento)}>Editar</button>
          <button className="dm-btn-secondary" onClick={() => exportDetailToExcel(levantamiento)}>Exportar Excel</button>
          <button className="dm-btn-secondary" onClick={() => exportDetailToPDF(levantamiento)}>Exportar PDF</button>
        </div>

        <div className="dm-section">
          <h3>Datos del Levantamiento</h3>
          <div className="dm-grid">
            {entries.map(([key, value]) => (
              <div key={key} className="dm-item">
                <span className="dm-label">{humanize(key)}</span>
                <span className="dm-value">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {fotos.length > 0 && (
          <div className="dm-section">
            <h3>Fotos ({fotos.length})</h3>
            <div className="dm-photos">
              {fotos.map((foto, idx) => (
                <a key={idx} href={foto} target="_blank" rel="noreferrer">
                  <img src={foto} alt={`Foto ${idx + 1}`} />
                </a>
              ))}
            </div>
          </div>
        )}

        {(firma_tecnico || firma_cliente) && (
          <div className="dm-section">
            <h3>Firmas</h3>
            <div className="dm-firmas">
              {firma_tecnico && (
                <div className="dm-firma-card">
                  <span>Técnico</span>
                  <img src={firma_tecnico} alt="Firma técnico" />
                </div>
              )}
              {firma_cliente && (
                <div className="dm-firma-card">
                  <span>Cliente</span>
                  <img src={firma_cliente} alt="Firma cliente" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
