import { useState, useRef, useEffect } from 'react';
import { API_URL } from '../config';
import SignaturePad from '../components/SignaturePad';
import './BandaTransporteForm.css';

const TOTAL_PASOS = 11;
const TITULOS = [
  'Datos del Cliente',
  'Aplicación & Condiciones',
  'Especificación de la Banda',
  'Dimensiones de la Banda',
  'Empalme',
  'Poleas, Ejes y Montaje',
  'Estado del Equipo',
  'Observaciones',
  'Fotos y Videos',
  'Firmas y Conformidad',
  'Confirmar Levantamiento'
];

const poleaVacia = { diametro_ext: '', ancho_cara: '', diametro_eje: '', largo_eje: '', buje_cuna: '', material_obs: '' };

const initialData = {
  // Paso 1 - Cliente
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
  // Paso 2 - Aplicación y Condiciones
  potencia_motor: '',
  rpm_motor: '',
  horas_operacion_dia: '',
  temp_trabajo: '',
  ambiente_contacto: [],
  ambiente_contacto_otro: '',
  motivo_cambio: [],
  // Paso 3 - Especificación de Banda
  linea_habasit: '',
  codigo_articulo: '',
  referencia_actual: '',
  marca_actual: '',
  material_nucleo: '',
  material_nucleo_otro: '',
  superficie_traccion: '',
  superficie_traccion_otro: '',
  superficie_carga: '',
  superficie_carga_otro: '',
  color: '',
  espesor_total: '',
  certificaciones: [],
  // Paso 4 - Dimensiones
  ancho_banda: '',
  largo_total_perimetro: '',
  distancia_centros: '',
  espesor_total_dim: '',
  cantidad_bandas: '',
  // Paso 5 - Empalme
  tipo_empalme: '',
  tipo_empalme_otro: '',
  largo_empalme: '',
  angulo_empalme: '',
  lugar_empalme: '',
  // Paso 6 - Poleas, Ejes y Montaje
  poleas: {
    motriz: { ...poleaVacia },
    conducida: { ...poleaVacia }
  },
  montaje_orientacion: '',
  rango_ajuste_tensor: '',
  sistema_tensado: '',
  estado_poleas: [],
  // Paso 7 - Estado del Equipo e Instalación
  dano_banda_actual: [],
  acceso_instalar: [],
  instalacion_entrega: '',
  // Paso 8 - Observaciones
  observaciones: '',
  // Paso 9 - Fotos
  fotos: [],
  // Paso 10 - Firmas
  tecnico_nombre: '',
  tecnico_puesto: '',
  firma_tecnico: '',
  fecha_firma: '',
  cliente_nombre_firma: '',
  cliente_puesto: '',
  firma_cliente: ''
};

export default function BandaTransmisionForm({ usuario, onBack, onLogout, onIrInicio, existente }) {
  const construirDataInicial = () => {
    if (!existente) return initialData;
    const { cliente_nombre, ubicacion, folio, fotos, firma_tecnico, firma_cliente, datos } = existente;
    return {
      ...initialData,
      ...datos,
      poleas: {
        motriz: { ...poleaVacia, ...((datos && datos.poleas && datos.poleas.motriz) || {}) },
        conducida: { ...poleaVacia, ...((datos && datos.poleas && datos.poleas.conducida) || {}) }
      },
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

  const setPoleaField = (polea, campo, valor) => {
    setData(prev => ({
      ...prev,
      poleas: {
        ...prev.poleas,
        [polea]: { ...prev.poleas[polea], [campo]: valor }
      }
    }));
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
      tipo_banda: 'transmision',
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

  const POLEAS_LABELS = {
    motriz: 'Motriz (motor)',
    conducida: 'Conducida'
  };

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
        <div className="bt-tipo-banner">Banda de Transmisión de Fuerza</div>
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
              <h2>Aplicación & Condiciones de Operación</h2>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Potencia del motor (kW / HP)</label>
                  <input value={data.potencia_motor} onChange={e => setField('potencia_motor', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>RPM motor</label>
                  <input type="number" value={data.rpm_motor} onChange={e => setField('rpm_motor', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Horas de operación / día</label>
                  <input type="number" value={data.horas_operacion_dia} onChange={e => setField('horas_operacion_dia', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Temp. de trabajo (°C)</label>
                  <input type="number" value={data.temp_trabajo} onChange={e => setField('temp_trabajo', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Ambiente / contacto</label>
                <div className="bt-check-grid">
                  {['Seco', 'Húmedo', 'Aceite / grasa', 'Polvo / abrasivo', 'Químicos / solventes', 'Alta temperatura', 'Intemperie / UV', 'Contacto con alimentos', 'Antiestática (ESD)', 'Otro'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.ambiente_contacto.includes(op)} onChange={() => toggleCheck('ambiente_contacto', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.ambiente_contacto.includes('Otro') && (
                  <input placeholder="Especificar otro ambiente / contacto" value={data.ambiente_contacto_otro} onChange={e => setField('ambiente_contacto_otro', e.target.value)} />
                )}
              </div>

              <div className="bt-field">
                <label>Motivo del cambio</label>
                <div className="bt-check-grid">
                  {['Desgaste de superficie', 'Patina / Resbala', 'Pérdida de tensión / Elongación', 'Empalme abierto / dañado', 'Ruido / vibración', 'Desalineación', 'Rotura', 'Contaminación', 'Equipo nuevo'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.motivo_cambio.includes(op)} onChange={() => toggleCheck('motivo_cambio', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bt-step">
              <h2>Especificación de la Banda</h2>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Línea Familia</label>
                  <input value={data.linea_habasit} onChange={e => setField('linea_habasit', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Código de artículo / referencia</label>
                  <input value={data.codigo_articulo} onChange={e => setField('codigo_articulo', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Referencia banda actual</label>
                  <input value={data.referencia_actual} onChange={e => setField('referencia_actual', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Marca banda actual</label>
                  <input value={data.marca_actual} onChange={e => setField('marca_actual', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Material del núcleo</label>
                <div className="bt-radio-grid">
                  {['Poliéster (PET)', 'Poliamida (PA)', 'Aramida', 'Algodón', 'Acero (cable)', 'Otro'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="material_nucleo" checked={data.material_nucleo === op} onChange={() => setField('material_nucleo', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.material_nucleo === 'Otro' && (
                  <input placeholder="Especificar material del núcleo" value={data.material_nucleo_otro} onChange={e => setField('material_nucleo_otro', e.target.value)} />
                )}
              </div>

              <div className="bt-field">
                <label>Superficie de tracción (lado polea)</label>
                <div className="bt-radio-grid">
                  {['Cuero', 'Caucho / goma', 'Poliuretano (PU)', 'Tejido / Perlon', 'Otra'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="superficie_traccion" checked={data.superficie_traccion === op} onChange={() => setField('superficie_traccion', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.superficie_traccion === 'Otra' && (
                  <input placeholder="Especificar superficie de tracción" value={data.superficie_traccion_otro} onChange={e => setField('superficie_traccion_otro', e.target.value)} />
                )}
              </div>

              <div className="bt-field">
                <label>Superficie de carga (lado producto)</label>
                <div className="bt-radio-grid">
                  {['Lisa', 'Antideslizante / rugosa', 'Antiestática', 'Con guía', 'Sin cubierta', 'Otra'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="superficie_carga" checked={data.superficie_carga === op} onChange={() => setField('superficie_carga', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.superficie_carga === 'Otra' && (
                  <input placeholder="Especificar superficie de carga" value={data.superficie_carga_otro} onChange={e => setField('superficie_carga_otro', e.target.value)} />
                )}
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Color</label>
                  <input value={data.color} onChange={e => setField('color', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Espesor total (mm)</label>
                  <input type="number" step="0.01" value={data.espesor_total} onChange={e => setField('espesor_total', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Certificaciones requeridas</label>
                <div className="bt-check-grid">
                  {['Contacto alimenticio (FDA/EU)', 'Antiestática certificada', 'Retardante a la llama', 'Ninguna / no aplica'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.certificaciones.includes(op)} onChange={() => toggleCheck('certificaciones', op)} />
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

              <div className="bt-row">
                <div className="bt-field">
                  <label>Ancho de banda (mm)</label>
                  <input type="number" value={data.ancho_banda} onChange={e => setField('ancho_banda', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Largo total / perímetro (mm)</label>
                  <input type="number" value={data.largo_total_perimetro} onChange={e => setField('largo_total_perimetro', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Distancia entre centros (mm)</label>
                  <input type="number" value={data.distancia_centros} onChange={e => setField('distancia_centros', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Espesor total (mm)</label>
                  <input type="number" step="0.01" value={data.espesor_total_dim} onChange={e => setField('espesor_total_dim', e.target.value)} />
                </div>
              </div>
              <div className="bt-field">
                <label>Cantidad de bandas a fabricar</label>
                <input type="number" value={data.cantidad_bandas} onChange={e => setField('cantidad_bandas', e.target.value)} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="bt-step">
              <h2>Empalme</h2>

              <div className="bt-field">
                <label>Tipo de empalme</label>
                <div className="bt-radio-grid">
                  {['Finger', 'Sobreposición', 'Sin fin de fábrica', 'Otro'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="tipo_empalme" checked={data.tipo_empalme === op} onChange={() => setField('tipo_empalme', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.tipo_empalme === 'Otro' && (
                  <input placeholder="Especificar tipo de empalme" value={data.tipo_empalme_otro} onChange={e => setField('tipo_empalme_otro', e.target.value)} />
                )}
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Largo del empalme (mm)</label>
                  <input type="number" value={data.largo_empalme} onChange={e => setField('largo_empalme', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Ángulo (°)</label>
                  <input type="number" value={data.angulo_empalme} onChange={e => setField('angulo_empalme', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Lugar del empalme</label>
                <div className="bt-radio-grid">
                  {['En taller (sin fin)', 'En sitio por Provac', 'En sitio por el cliente'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="lugar_empalme" checked={data.lugar_empalme === op} onChange={() => setField('lugar_empalme', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="bt-step">
              <h2>Poleas, Ejes y Montaje</h2>
              <p className="bt-hint">Mide cada polea del sistema. Deja en blanco las que no apliquen.</p>

              {Object.keys(POLEAS_LABELS).map(key => (
                <div key={key}>
                  <h3 className="bt-subtitle">{POLEAS_LABELS[key]}</h3>
                  <div className="bt-row">
                    <div className="bt-field">
                      <label>Ø Ext. (mm)</label>
                      <input type="number" value={data.poleas[key].diametro_ext} onChange={e => setPoleaField(key, 'diametro_ext', e.target.value)} />
                    </div>
                    <div className="bt-field">
                      <label>Ø Eje (mm)</label>
                      <input type="number" value={data.poleas[key].diametro_eje} onChange={e => setPoleaField(key, 'diametro_eje', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <h3 className="bt-subtitle">Montaje</h3>
              <div className="bt-field">
                <label>Montaje (horiz. / vert. / incl.)</label>
                <input value={data.montaje_orientacion} onChange={e => setField('montaje_orientacion', e.target.value)} />
              </div>
              <div className="bt-field">
                <label>Rango de ajuste del tensor (mm)</label>
                <input value={data.rango_ajuste_tensor} onChange={e => setField('rango_ajuste_tensor', e.target.value)} />
              </div>

              <div className="bt-field">
                <label>Sistema de tensado</label>
                <div className="bt-radio-grid">
                  {['Base de motor ajustable (rieles)', 'Polea tensora interna', 'Polea tensora externa', 'Fija (sin ajuste)', 'Resorte / automático', 'Otro'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="sistema_tensado" checked={data.sistema_tensado === op} onChange={() => setField('sistema_tensado', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Estado de poleas</label>
                <div className="bt-check-grid">
                  {['Buen estado', 'Desgastadas', 'Desalineadas', 'Chavetero dañado', 'Corrosión'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.estado_poleas.includes(op)} onChange={() => toggleCheck('estado_poleas', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="bt-step">
              <h2>Estado del Equipo e Instalación</h2>

              <div className="bt-field">
                <label>Daño en banda actual</label>
                <div className="bt-check-grid">
                  {['Superficie desgastada', 'Bordes deshilachados', 'Rasgaduras / cortes', 'Delaminación', 'Estiramiento excesivo', 'Empalme dañado', 'Sin banda (equipo nuevo)'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.dano_banda_actual.includes(op)} onChange={() => toggleCheck('dano_banda_actual', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Acceso para instalar</label>
                <div className="bt-check-grid">
                  {['Lado libre abierto', 'Requiere desarmar', 'Espacio reducido', 'Requiere grúa / polipasto', 'En paro programado'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.acceso_instalar.includes(op)} onChange={() => toggleCheck('acceso_instalar', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Instalación / entrega</label>
                <div className="bt-radio-grid">
                  {['Instala Provac', 'Instala el cliente', 'Solo entrega en planta'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="instalacion_entrega" checked={data.instalacion_entrega === op} onChange={() => setField('instalacion_entrega', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>


            </div>
          )}

          {step === 8 && (
            <div className="bt-step">
              <h2>Observaciones</h2>
              <div className="bt-field">
                <label>Notas adicionales, riesgos, condiciones especiales, datos que falten por confirmar</label>
                <textarea rows={6} value={data.observaciones} onChange={e => setField('observaciones', e.target.value)} />
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="bt-step">
              <h2>Fotos y Videos</h2>
              <p className="bt-hint">Evidencia visual: equipo, poleas, empalme, placa del motor.</p>

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
            </div>
          )}

          {step === 10 && (
            <div className="bt-step">
              <h2>Firmas y Conformidad</h2>
              <p className="bt-hint bt-hint-warn">Con mi firma confirmo haber revisado el levantamiento y acepto que las especificaciones, dimensiones, accesorios, tipo de empalme y demás datos aquí descritos son los que PROVAC fabricará y entregará.</p>

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

          {step === 11 && (
            <div className="bt-step">
              <h2>Confirmar Levantamiento</h2>

              <div className="bt-resumen-badge">
                ✅ Levantamiento {data.firma_tecnico ? 'listo para enviar' : 'incompleto'}
              </div>

              <h3 className="bt-subtitle">Estado de Secciones</h3>
              <ul className="bt-estado-list">
                <li className={data.empresa ? 'ok' : 'pend'}>{data.empresa ? '✅' : '⏳'} Datos del Cliente</li>
                <li className={data.potencia_motor ? 'ok' : 'pend'}>{data.potencia_motor ? '✅' : '⏳'} Aplicación & Condiciones</li>
                <li className={data.linea_habasit ? 'ok' : 'pend'}>{data.linea_habasit ? '✅' : '⏳'} Especificación de Banda</li>
                <li className={data.ancho_banda ? 'ok' : 'pend'}>{data.ancho_banda ? '✅' : '⏳'} Dimensiones</li>
                <li className={data.tipo_empalme ? 'ok' : 'pend'}>{data.tipo_empalme ? '✅' : '⏳'} Empalme</li>
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
                <span>Línea Habasit:</span><b>{data.linea_habasit || '—'}</b>
                <span>Ancho:</span><b>{data.ancho_banda ? `${data.ancho_banda} mm` : '—'}</b>
                <span>Perímetro:</span><b>{data.largo_total_perimetro ? `${data.largo_total_perimetro} mm` : '—'}</b>
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
