import { useState, useRef, useEffect } from 'react';
import { API_URL } from '../config';
import SignaturePad from '../components/SignaturePad';
import './BandaTransporteForm.css';

const TOTAL_PASOS = 8;
const TITULOS = [
  'Datos del Cliente',
  'Aplicación & Condiciones',
  'Especificaciones de Banda',
  'Dimensiones de la Banda',
  'Accesorios & Empalme',
  'Fotos y Videos',
  'Firmas y Conformidad',
  'Confirmar Levantamiento'
];

const initialData = {
  // Paso 1
  folio: 'AUTO',
  fecha: '',
  entrada: '',
  salida: '',
  empresa: '',
  planta: '',
  contacto: '',
  puesto: '',
  telefono: '',
  email: '',
  direccion: '',
  area_linea: '',
  equipo_tag: '',
  tecnico_provac: '',
  vendedor: '',
  // Paso 2
  industria: '',
  producto_transportador: '',
  carga_kgm: '',
  velocidad_mmin: '',
  inclinacion: '',
  temperatura_operacion: '',
  horas_dia: '',
  turnos_dia: '',
  ambiente: [],
  contacto_producto: [],
  // Paso 3
  marca_linea: '',
  referencia_actual: '',
  material_base: '',
  num_capas: '',
  espesor_total: '',
  color: '',
  dureza_shore: '',
  cubierta_superior: '',
  cubierta_inferior: '',
  // Paso 4
  ancho_banda: '',
  espesor_total_dim: '',
  largo_circuito_cerrado: '',
  distancia_centros: '',
  largo_abierto: '',
  ancho_util: '',
  ancho_libre: '',
  // Paso 5
  tipo_empalme: '',
  metodo_union: '',
  largo_empalme: '',
  angulo_empalme: '',
  ubicacion_empalme: '',
  guia_tracking: '',
  posicion_guia: '',
  tacos: '',
  alto_tacos: '',
  paso_tacos: '',
  // Paso 6
  fotos: [],
  // Paso 7
  tecnico_nombre: '',
  tecnico_puesto: '',
  firma_tecnico: '',
  fecha_firma: '',
  cliente_nombre_firma: '',
  cliente_puesto: '',
  firma_cliente: ''
};

export default function BandaTransporteForm({ usuario, onBack, onLogout, onIrInicio, existente }) {
  const construirDataInicial = () => {
    if (!existente) return initialData;
    const { cliente_nombre, ubicacion, folio, fotos, firma_tecnico, firma_cliente, datos } = existente;
    return {
      ...initialData,
      ...datos,
      folio: folio || initialData.folio,
      empresa: cliente_nombre || '',
      direccion: ubicacion || '',
      fotos: fotos || [],
      firma_tecnico: firma_tecnico || '',
      firma_cliente: firma_cliente || ''
    };
  };

  const [step, setStep] = useState(1);
  const [data, setData] = useState(construirDataInicial);

  // Al abrir un levantamiento NUEVO (no edición), pide de inmediato el folio
  // correlativo real al backend, para no dejar el placeholder "AUTO" visible
  // mientras el técnico llena el formulario.
  useEffect(() => {
    if (existente) return;
    const token = localStorage.getItem('token');
    const pedirFolio = (intento = 1) => {
      fetch(`${API_URL}/folio/siguiente`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(({ folio }) => {
          if (folio) setData(prev => (prev.folio === 'AUTO' ? { ...prev, folio } : prev));
        })
        .catch(() => {
          if (intento < 2) setTimeout(() => pedirFolio(intento + 1), 1200);
        });
    };
    pedirFolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const photoInputRef = useRef(null);

  const setField = (name, value) => setData(prev => ({ ...prev, [name]: value }));

  const toggleCheck = (name, value) => {
    setData(prev => {
      const arr = prev[name];
      return {
        ...prev,
        [name]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      };
    });
  };

  const handlePhotoCapture = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setData(prev => ({ ...prev, fotos: [...prev.fotos, event.target.result] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (idx) => {
    setData(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== idx) }));
  };

  const next = () => setStep(s => Math.min(s + 1, TOTAL_PASOS));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  const buildPayload = (estado) => {
    const {
      empresa, direccion, fotos, firma_tecnico, firma_cliente, folio,
      ...resto
    } = data;
    return {
      tipo_banda: 'transporte',
      folio,
      cliente_nombre: empresa,
      ubicacion: direccion,
      estado,
      fotos,
      firma_tecnico,
      firma_cliente,
      datos: resto
    };
  };

  const handleSubmit = async (estado) => {
    setError('');
    setSuccess('');

    if (!data.empresa) {
      setError('⚠️ Falta el nombre de la empresa/cliente (Paso 1)');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const esEdicion = Boolean(existente && existente.id);
      const url = esEdicion ? `${API_URL}/levantamientos/${existente.id}` : `${API_URL}/levantamientos`;
      const method = esEdicion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(buildPayload(estado)),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Error al guardar');
        setLoading(false);
        return;
      }

      setSuccess(estado === 'completo' ? '✅ Levantamiento guardado' : '💾 Borrador guardado');
      setLoading(false);

      if (estado === 'completo' && !esEdicion) {
        setTimeout(() => {
          setData(initialData);
          setStep(1);
          setSuccess('');
        }, 1800);
      }
    } catch (err) {
      setError('❌ Error de conexión: ' + err.message);
      setLoading(false);
    }
  };

  const progresoPct = Math.round((step / TOTAL_PASOS) * 100);

  return (
    <div className="bt-container">
      <nav className="bt-navbar">
        <img
          src="/logo-provac.png"
          alt="PROVAC"
          className="bt-nav-logo"
          onClick={() => (onIrInicio ? onIrInicio() : onBack())}
          role="button"
          tabIndex={0}
        />
        <button className="bt-back" onClick={onBack}>{existente ? "Volver" : "Cambiar tipo"}</button>
        {existente && (
          <button className="bt-guardar-rapido" onClick={() => handleSubmit('completo')} disabled={loading}>
            {loading ? '⏳ Guardando...' : '💾 Guardar'}
          </button>
        )}
        <span className="bt-user">{usuario.nombre}</span>
        <button className="bt-logout" onClick={onLogout}>Salir</button>
      </nav>

      <div className="bt-progress-header">
        <div className="bt-tipo-banner">Banda de Transporte</div>
        <div className="bt-progress-label">
          Paso {step} de {TOTAL_PASOS} · {TITULOS[step - 1]}
        </div>
        <div className="bt-progress-bar">
          <div className="bt-progress-fill" style={{ width: `${progresoPct}%` }} />
        </div>
        <div className="bt-step-dots">
          {TITULOS.map((titulo, idx) => (
            <button
              key={titulo}
              type="button"
              className={`bt-step-dot${step === idx + 1 ? ' bt-step-dot-activo' : ''}`}
              onClick={() => setStep(idx + 1)}
              title={titulo}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <main className="bt-main">
        <div className="bt-box">
          {error && <div className="bt-alert bt-alert-error">{error}</div>}
          {success && <div className="bt-alert bt-alert-success">{success}</div>}

          {step === 1 && (
            <div className="bt-step">
              <h2>Datos del Cliente</h2>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Folio No.</label>
                  <input value={data.folio} onChange={e => setField('folio', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Fecha</label>
                  <input type="date" value={data.fecha} onChange={e => setField('fecha', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Hora entrada</label>
                  <input type="time" value={data.entrada} onChange={e => setField('entrada', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Empresa / Cliente *</label>
                <input placeholder="Nombre de la empresa" value={data.empresa} onChange={e => setField('empresa', e.target.value)} required />
              </div>

              <div className="bt-field">
                <label>Planta / Sucursal</label>
                <input placeholder="Ubicación específica" value={data.planta} onChange={e => setField('planta', e.target.value)} />
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Contacto</label>
                  <input placeholder="Nombre" value={data.contacto} onChange={e => setField('contacto', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Puesto</label>
                  <input placeholder="Ej: Jefe de Mantenimiento" value={data.puesto} onChange={e => setField('puesto', e.target.value)} />
                </div>
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Teléfono</label>
                  <input placeholder="+504 2xxx xxxx" value={data.telefono} onChange={e => setField('telefono', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Email</label>
                  <input type="email" placeholder="correo@empresa.com" value={data.email} onChange={e => setField('email', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Dirección</label>
                <input placeholder="Dirección completa" value={data.direccion} onChange={e => setField('direccion', e.target.value)} />
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Área / Línea</label>
                  <input placeholder="Producción A" value={data.area_linea} onChange={e => setField('area_linea', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Equipo / Tag</label>
                  <input placeholder="EQ-2024-001" value={data.equipo_tag} onChange={e => setField('equipo_tag', e.target.value)} />
                </div>
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Técnico PROVAC *</label>
                  <input placeholder="Tu nombre" value={data.tecnico_provac} onChange={e => setField('tecnico_provac', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Vendedor</label>
                  <input placeholder="Nombre del vendedor" value={data.vendedor} onChange={e => setField('vendedor', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bt-step">
              <h2>Aplicación & Condiciones</h2>

              <div className="bt-field">
                <label>Industria *</label>
                <div className="bt-radio-grid">
                  {['Textil', 'Alimentos', 'Empaque', 'Agrícola', 'Plástico', 'Minería', 'Otra'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="industria" checked={data.industria === op} onChange={() => setField('industria', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Producto Transportado</label>
                <input placeholder="Ej: Café, cajas, mineral" value={data.producto_transportador} onChange={e => setField('producto_transportador', e.target.value)} />
              </div>

              <h3 className="bt-subtitle">Parámetros de Operación</h3>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Carga (kg/m)</label>
                  <input type="number" value={data.carga_kgm} onChange={e => setField('carga_kgm', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Velocidad (m/min)</label>
                  <input type="number" value={data.velocidad_mmin} onChange={e => setField('velocidad_mmin', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Inclinación (°)</label>
                  <input type="number" value={data.inclinacion} onChange={e => setField('inclinacion', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Temperatura (°C)</label>
                  <input type="number" value={data.temperatura_operacion} onChange={e => setField('temperatura_operacion', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Horas/día</label>
                  <input type="number" value={data.horas_dia} onChange={e => setField('horas_dia', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Turnos/día</label>
                  <input type="number" value={data.turnos_dia} onChange={e => setField('turnos_dia', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Ambiente</label>
                <div className="bt-check-grid">
                  {['Seco', 'Húmedo'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.ambiente.includes(op)} onChange={() => toggleCheck('ambiente', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Contacto con Producto</label>
                <div className="bt-check-grid">
                  {['Aceitoso/Graso', 'Abrasivo', 'Químicos', 'Alimentos'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.contacto_producto.includes(op)} onChange={() => toggleCheck('contacto_producto', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bt-step">
              <h2>Especificaciones de Banda</h2>

              <div className="bt-field">
                <label>Marca / Línea</label>
                <div className="bt-radio-grid">
                  {['Habasit', 'Yongli', 'Betteveve', 'Otra'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="marca_linea" checked={data.marca_linea === op} onChange={() => setField('marca_linea', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Referencia Actual</label>
                <input placeholder="Ej: HA100-PVC-3" value={data.referencia_actual} onChange={e => setField('referencia_actual', e.target.value)} />
              </div>

              <div className="bt-field">
                <label>Material Base</label>
                <div className="bt-radio-grid">
                  {['PVC', 'Poliuretano', 'Caucho', 'Poliéster', 'Silicón', 'PTFE'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="material_base" checked={data.material_base === op} onChange={() => setField('material_base', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <h3 className="bt-subtitle">Especificaciones</h3>
              <div className="bt-row">
                <div className="bt-field">
                  <label>No. Capas/Telas</label>
                  <input type="number" value={data.num_capas} onChange={e => setField('num_capas', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Espesor total (mm)</label>
                  <input type="number" step="0.01" value={data.espesor_total} onChange={e => setField('espesor_total', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Color</label>
                  <input placeholder="Negro, Verde, blanco..." value={data.color} onChange={e => setField('color', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Dureza (Shore)</label>
                  <input type="number" value={data.dureza_shore} onChange={e => setField('dureza_shore', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Cubierta Superior</label>
                <div className="bt-radio-grid">
                  {['Lisa', 'Antideslizante', 'Rugosa', 'Diamante'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="cubierta_superior" checked={data.cubierta_superior === op} onChange={() => setField('cubierta_superior', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Cubierta Inferior</label>
                <div className="bt-radio-grid">
                  {['Tela lisa', 'Fieltro', 'Alta fricción', 'Sin cubierta'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="cubierta_inferior" checked={data.cubierta_inferior === op} onChange={() => setField('cubierta_inferior', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bt-step">
              <h2>Dimensiones de la Banda</h2>
              <p className="bt-hint">Toma las medidas directamente del equipo para máxima precisión.</p>

              <h3 className="bt-subtitle">Medidas Principales</h3>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Ancho de banda (mm)</label>
                  <input type="number" value={data.ancho_banda} onChange={e => setField('ancho_banda', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Espesor total (mm)</label>
                  <input type="number" step="0.01" value={data.espesor_total_dim} onChange={e => setField('espesor_total_dim', e.target.value)} />
                </div>
              </div>

              <h3 className="bt-subtitle">Medidas de Circuito Cerrado</h3>
              <div className="bt-field">
                <label>Largo total de circuito cerrado (mm)</label>
                <input type="number" value={data.largo_circuito_cerrado} onChange={e => setField('largo_circuito_cerrado', e.target.value)} />
              </div>
              <div className="bt-field">
                <label>Distancia entre centros (mm)</label>
                <input type="number" value={data.distancia_centros} onChange={e => setField('distancia_centros', e.target.value)} />
              </div>

              <h3 className="bt-subtitle">Medidas Abiertas (Tensor Relajado)</h3>
              <div className="bt-field">
                <label>Largo abierto (mm)</label>
                <input type="number" value={data.largo_abierto} onChange={e => setField('largo_abierto', e.target.value)} />
              </div>

              <h3 className="bt-subtitle">Área Útil de Transporte</h3>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Ancho útil (mm)</label>
                  <input type="number" value={data.ancho_util} onChange={e => setField('ancho_util', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Ancho libre entre laterales (mm)</label>
                  <input type="number" value={data.ancho_libre} onChange={e => setField('ancho_libre', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="bt-step">
              <h2>Accesorios & Empalme</h2>

              <div className="bt-field">
                <label>Tipo de Empalme</label>
                <div className="bt-radio-grid">
                  {['Finger (dedos)', 'Escalonado', 'Diagonal', 'Con adhesivo', 'Grapa metálica', 'Sin fin'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="tipo_empalme" checked={data.tipo_empalme === op} onChange={() => setField('tipo_empalme', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Método de unión</label>
                <select value={data.metodo_union} onChange={e => setField('metodo_union', e.target.value)}>
                  <option value="">- Seleccionar -</option>
                  <option value="vulcanizado_caliente">Vulcanizado en caliente</option>
                  <option value="vulcanizado_frio">Vulcanizado en frío</option>
                  <option value="mecanico">Mecánico</option>
                  <option value="adhesivo">Adhesivo</option>
                </select>
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Largo empalme (mm)</label>
                  <input type="number" value={data.largo_empalme} onChange={e => setField('largo_empalme', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Ángulo (°)</label>
                  <input type="number" value={data.angulo_empalme} onChange={e => setField('angulo_empalme', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Ubicación de empalme</label>
                <input placeholder="Ej: Inferior izquierda" value={data.ubicacion_empalme} onChange={e => setField('ubicacion_empalme', e.target.value)} />
              </div>

              <h3 className="bt-subtitle">Guía de Tracking</h3>
              <div className="bt-field">
                <label>Tipo de guía</label>
                <div className="bt-radio-grid">
                  {['Sin guía', 'Guía en V', 'Trapezoidal', 'Plana'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="guia_tracking" checked={data.guia_tracking === op} onChange={() => setField('guia_tracking', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bt-field">
                <label>Posición</label>
                <select value={data.posicion_guia} onChange={e => setField('posicion_guia', e.target.value)}>
                  <option value="">- Seleccionar -</option>
                  <option value="central">Central</option>
                  <option value="lateral_izq">Lateral izquierda</option>
                  <option value="lateral_der">Lateral derecha</option>
                </select>
              </div>

              <h3 className="bt-subtitle">Tacos / Perfiles Transversales</h3>
              <div className="bt-field">
                <label>Tipo de taco</label>
                <div className="bt-radio-grid">
                  {['Sin tacos', 'Taco recto', 'Taco en T', 'Taco curvo'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="tacos" checked={data.tacos === op} onChange={() => setField('tacos', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Alto (mm)</label>
                  <input type="number" value={data.alto_tacos} onChange={e => setField('alto_tacos', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Paso entre tacos (mm)</label>
                  <input type="number" value={data.paso_tacos} onChange={e => setField('paso_tacos', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="bt-step">
              <h2>Fotos y Videos</h2>
              <p className="bt-hint">Evidencia visual: captura fotos del equipo, empalme, accesorios de la zona de instalación.</p>

              <button type="button" className="bt-photo-btn" onClick={() => photoInputRef.current?.click()}>
                📷 Toca para agregar fotos
              </button>
              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                style={{ display: 'none' }}
              />

              <div className="bt-photos-grid">
                {data.fotos.map((foto, idx) => (
                  <div key={idx} className="bt-photo-card">
                    <img src={foto} alt={`Foto ${idx + 1}`} />
                    <button type="button" className="bt-photo-remove" onClick={() => removePhoto(idx)}>✕</button>
                  </div>
                ))}
              </div>
              {data.fotos.length === 0 && <p className="bt-hint">0 archivos agregados aún</p>}

              <div className="bt-field" style={{ marginTop: 16 }}>
                <label>Sugerencias</label>
                <ul className="bt-suggest-list">
                  <li>Vista general del equipo</li>
                  <li>Detalle del empalme</li>
                  <li>Accesorios (guías, tacos)</li>
                  <li>Zona de instalación</li>
                </ul>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="bt-step">
              <h2>Firmas y Conformidad</h2>
              <p className="bt-hint bt-hint-warn">Con mi firma confirmo haber revisado el levantamiento y acepto que las especificaciones, dimensiones y accesorios descritos son los que PROVAC fabricará y entregará.</p>

              <h3 className="bt-subtitle">Técnico PROVAC</h3>
              <div className="bt-field">
                <label>Nombre</label>
                <input placeholder="Tu nombre completo" value={data.tecnico_nombre} onChange={e => setField('tecnico_nombre', e.target.value)} />
              </div>
              <div className="bt-field">
                <label>Puesto</label>
                <input placeholder="Ej: Técnico Senior" value={data.tecnico_puesto} onChange={e => setField('tecnico_puesto', e.target.value)} />
              </div>
              <SignaturePad label="Firma Digital *" initialValue={existente ? existente.firma_tecnico : ''} onSignatureChange={sig => setField('firma_tecnico', sig)} />

              <div className="bt-field">
                <label>Fecha</label>
                <input type="date" value={data.fecha_firma} onChange={e => setField('fecha_firma', e.target.value)} />
              </div>
              <div className="bt-field">
                <label>Hora salida</label>
                <input type="time" value={data.salida} onChange={e => setField('salida', e.target.value)} />
              </div>
              <p className="bt-hint">Confirma la hora de salida al terminar el levantamiento.</p>

              <hr className="bt-divider" />

              <h3 className="bt-subtitle">Cliente - Acepta el Levantamiento</h3>
              <div className="bt-field">
                <label>Nombre</label>
                <input placeholder="Nombre del representante" value={data.cliente_nombre_firma} onChange={e => setField('cliente_nombre_firma', e.target.value)} />
              </div>
              <div className="bt-field">
                <label>Puesto / Cargo</label>
                <input value={data.cliente_puesto} onChange={e => setField('cliente_puesto', e.target.value)} />
              </div>
              <SignaturePad label="Firma del Cliente" initialValue={existente ? existente.firma_cliente : ''} onSignatureChange={sig => setField('firma_cliente', sig)} />
            </div>
          )}

          {step === 8 && (
            <div className="bt-step">
              <h2>Confirmar Levantamiento</h2>

              <div className="bt-resumen-badge">
                ✅ Levantamiento {data.firma_tecnico ? 'listo para enviar' : 'incompleto'}
              </div>

              <h3 className="bt-subtitle">Estado de Secciones</h3>
              <ul className="bt-estado-list">
                <li className={data.empresa ? 'ok' : 'pend'}>{data.empresa ? '✅' : '⏳'} Datos del Cliente</li>
                <li className={data.industria ? 'ok' : 'pend'}>{data.industria ? '✅' : '⏳'} Aplicación & Condiciones</li>
                <li className={data.material_base ? 'ok' : 'pend'}>{data.material_base ? '✅' : '⏳'} Especificaciones</li>
                <li className={data.ancho_banda ? 'ok' : 'pend'}>{data.ancho_banda ? '✅' : '⏳'} Dimensiones</li>
                <li className={data.tipo_empalme ? 'ok' : 'pend'}>{data.tipo_empalme ? '✅' : '⏳'} Accesorios & Empalme</li>
                <li className={data.fotos.length > 0 ? 'ok' : 'pend'}>{data.fotos.length > 0 ? '✅' : '⏳'} Fotos y Videos ({data.fotos.length})</li>
                <li className={data.firma_tecnico ? 'ok' : 'pend'}>{data.firma_tecnico ? '✅' : '⏳'} Firmas</li>
              </ul>

              <h3 className="bt-subtitle">Cliente</h3>
              <div className="bt-resumen-grid">
                <span>Empresa:</span><b>{data.empresa || '—'}</b>
                <span>Contacto:</span><b>{data.contacto || '—'}</b>
                <span>Fecha:</span><b>{data.fecha || '—'}</b>
              </div>

              <h3 className="bt-subtitle">Banda a Fabricar</h3>
              <div className="bt-resumen-grid">
                <span>Marca:</span><b>{data.marca_linea || '—'}</b>
                <span>Material:</span><b>{data.material_base || '—'}</b>
                <span>Ancho:</span><b>{data.ancho_banda ? `${data.ancho_banda} mm` : '—'}</b>
                <span>Circuito:</span><b>{data.largo_circuito_cerrado ? `${data.largo_circuito_cerrado} mm` : '—'}</b>
                <span>Empalme:</span><b>{data.tipo_empalme || '—'}</b>
              </div>

              <div className="bt-final-actions">
                <button type="button" className="bt-btn-secondary" onClick={() => handleSubmit('borrador')} disabled={loading}>
                  Guardar Borrador
                </button>
                <button type="button" className="bt-btn-primary" onClick={() => handleSubmit('completo')} disabled={loading}>
                  {loading ? '⏳ Enviando...' : '✅ Enviar Levantamiento'}
                </button>
              </div>
            </div>
          )}

          <div className="bt-nav-buttons">
            {step > 1 && <button type="button" className="bt-nav-prev" onClick={prev}>← Atrás</button>}
            {step < TOTAL_PASOS && <button type="button" className="bt-nav-next" onClick={next}>Siguiente →</button>}
          </div>
        </div>
      </main>
    </div>
  );
}
