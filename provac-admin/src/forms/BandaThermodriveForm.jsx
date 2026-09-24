import { useState, useRef, useEffect } from 'react';
import { API_URL } from '../config';
import SignaturePad from '../components/SignaturePad';
import './BandaTransporteForm.css';

const TOTAL_PASOS_FINAL = 11;
const TITULOS = [
  'Datos del Cliente',
  'Tipo de Proceso / Equipo',
  'Especificación de Banda',
  'Catarina / Rueda y Eje',
  'Producto Transportado',
  'Configuración del Sistema',
  'Limpieza / Saneamiento',
  'Observaciones',
  'Fotos y Videos',
  'Firmas y Conformidad',
  'Confirmar Levantamiento'
];

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
  // Paso 2 - Tipo de Proceso / Equipo
  tipo_proceso: [],
  tipo_proceso_otro: '',
  fuente_calor: [],
  marca_modelo_horno: '',
  temp_max_operacion: '',
  temp_prom_operacion: '',
  tiempo_residencia: '',
  zonas_temperatura: '',
  // Paso 3 - Especificación de la Banda ThermoDrive
  estilo_superficie: [],
  estilo_superficie_otro: '',
  color_material_superficial: '',
  color_material_otro: '',
  ancho_banda: '',
  largo_centro_centro: '',
  espesor_total: '',
  paso_banda: '',
  certificaciones: [],
  // Paso 4 - Catarina / Rueda de Tracción y Eje
  diametro_paso_catarina: '',
  no_dientes: '',
  barreno_diametro_interior: '',
  ancho_cara_catarina: '',
  material_catarina: '',
  material_catarina_otro: '',
  material_eje: '',
  material_eje_otro: '',
  diametro_eje: '',
  largo_eje_libre: '',
  // Paso 5 - Producto Transportado
  descripcion_producto: '',
  ancho_producto: '',
  largo_producto: '',
  alto_producto: '',
  espaciado_productos: '',
  carga_total: '',
  carga_individual: '',
  velocidad_banda: '',
  produccion_requerida: '',
  caracteristicas_producto: [],
  caracteristicas_producto_otro: '',
  // Paso 6 - Configuración del Sistema
  configuracion_recorrido: [],
  angulo_inclinacion: '',
  ubicacion_motriz: '',
  guardas_laterales: '',
  guardas_laterales_otro: '',
  altura_sidewall: '',
  espaciado_tacos: '',
  sistema_retorno: '',
  sistema_retorno_otro: '',
  tensado: '',
  tensado_otro: '',
  // Paso 7 - Limpieza / Saneamiento
  metodo_limpieza: '',
  frecuencia_limpieza: '',
  quimicos_limpieza: '',
  concentracion_quimica: '',
  temp_medio_limpieza: '',
  tiempo_exposicion: '',
  // Paso 8 - Observaciones
  observaciones: '',
  documentacion_adjunta: [],
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

export default function BandaThermodriveForm({ usuario, onBack, onLogout, onIrInicio, existente }) {
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

  const next = () => setStep(s => Math.min(s + 1, TOTAL_PASOS_FINAL));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  const buildPayload = (estado) => {
    const {
      empresa, direccion, fotos, firma_tecnico, firma_cliente, folio,
      ...resto
    } = data;
    return {
      tipo_banda: 'thermodrive',
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

  const progresoPct = Math.round((step / TOTAL_PASOS_FINAL) * 100);

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
        <div className="bt-tipo-banner">Banda ThermoDrive</div>
        <div className="bt-progress-label">
          Paso {step} de {TOTAL_PASOS_FINAL} · {TITULOS[step - 1]}
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
              <h2>Tipo de Proceso / Equipo</h2>

              <div className="bt-field">
                <label>Tipo de proceso</label>
                <div className="bt-check-grid">
                  {['Horno de horneo (baking)', 'Horno túnel', 'Freídora continua', 'Cocedor / escaldador', 'Enfriador / congelador (IQF)', 'Secador', 'Transporte general', 'Otro'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.tipo_proceso.includes(op)} onChange={() => toggleCheck('tipo_proceso', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.tipo_proceso.includes('Otro') && (
                  <input placeholder="Especificar" value={data.tipo_proceso_otro} onChange={e => setField('tipo_proceso_otro', e.target.value)} />
                )}
              </div>

              <div className="bt-field">
                <label>Fuente de calor del horno</label>
                <div className="bt-check-grid">
                  {['Gas directo', 'Gas indirecto', 'Eléctrico', 'Vapor', 'Infrarrojo', 'No aplica'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.fuente_calor.includes(op)} onChange={() => toggleCheck('fuente_calor', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Marca / modelo del horno o equipo</label>
                <input value={data.marca_modelo_horno} onChange={e => setField('marca_modelo_horno', e.target.value)} />
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Temperatura máxima de operación (°C)</label>
                  <input type="number" value={data.temp_max_operacion} onChange={e => setField('temp_max_operacion', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Temperatura promedio de operación (°C)</label>
                  <input type="number" value={data.temp_prom_operacion} onChange={e => setField('temp_prom_operacion', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Tiempo de residencia en el horno (min)</label>
                  <input type="number" value={data.tiempo_residencia} onChange={e => setField('tiempo_residencia', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Zonas de temperatura (No.)</label>
                  <input type="number" value={data.zonas_temperatura} onChange={e => setField('zonas_temperatura', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bt-step">
              <h2>Especificación de la Banda ThermoDrive</h2>

              <div className="bt-field">
                <label>Estilo de superficie</label>
                <div className="bt-check-grid">
                  {['Lisa', 'Perforada', 'Malla abierta', 'Antiadherente', 'Con paredes laterales (sidewall)', 'Con tacos (cleats)', 'Otro'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.estilo_superficie.includes(op)} onChange={() => toggleCheck('estilo_superficie', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.estilo_superficie.includes('Otro') && (
                  <input placeholder="Especificar" value={data.estilo_superficie_otro} onChange={e => setField('estilo_superficie_otro', e.target.value)} />
                )}
              </div>

              <div className="bt-field">
                <label>Color / material superficial</label>
                <div className="bt-radio-grid">
                  {['Blanco estándar', 'Azul (detectable)', 'Negro', 'Antiadherente especial', 'Otro'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="color_material_superficial" checked={data.color_material_superficial === op} onChange={() => setField('color_material_superficial', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.color_material_superficial === 'Otro' && (
                  <input placeholder="Especificar" value={data.color_material_otro} onChange={e => setField('color_material_otro', e.target.value)} />
                )}
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Ancho de banda (mm)</label>
                  <input type="number" value={data.ancho_banda} onChange={e => setField('ancho_banda', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Largo centro a centro (m)</label>
                  <input type="number" step="0.01" value={data.largo_centro_centro} onChange={e => setField('largo_centro_centro', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Espesor total (mm)</label>
                  <input type="number" step="0.01" value={data.espesor_total} onChange={e => setField('espesor_total', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Paso de banda (pitch, mm)</label>
                  <input type="number" step="0.01" value={data.paso_banda} onChange={e => setField('paso_banda', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Certificaciones requeridas</label>
                <div className="bt-check-grid">
                  {['Contacto alimenticio (FDA/EU)', 'Detectable metálicamente / rayos X', 'Ninguna'].map(op => (
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
              <h2>Catarina / Rueda de Tracción y Eje</h2>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Diámetro de paso de catarina (mm)</label>
                  <input type="number" value={data.diametro_paso_catarina} onChange={e => setField('diametro_paso_catarina', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>No. de dientes</label>
                  <input type="number" value={data.no_dientes} onChange={e => setField('no_dientes', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Barreno / diámetro interior (mm)</label>
                  <input type="number" value={data.barreno_diametro_interior} onChange={e => setField('barreno_diametro_interior', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Ancho de cara de catarina (mm)</label>
                  <input type="number" value={data.ancho_cara_catarina} onChange={e => setField('ancho_cara_catarina', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Material de catarina</label>
                <div className="bt-radio-grid">
                  {['Acero al carbono', 'Inoxidable 303/304', 'Inoxidable 316', 'Plástico / Delrin', 'Otro'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="material_catarina" checked={data.material_catarina === op} onChange={() => setField('material_catarina', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.material_catarina === 'Otro' && (
                  <input placeholder="Especificar" value={data.material_catarina_otro} onChange={e => setField('material_catarina_otro', e.target.value)} />
                )}
              </div>

              <div className="bt-field">
                <label>Material del eje</label>
                <div className="bt-radio-grid">
                  {['Acero al carbono', 'Inoxidable 303/304', 'Inoxidable 316', 'Otro'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="material_eje" checked={data.material_eje === op} onChange={() => setField('material_eje', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.material_eje === 'Otro' && (
                  <input placeholder="Especificar" value={data.material_eje_otro} onChange={e => setField('material_eje_otro', e.target.value)} />
                )}
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Diámetro de eje (mm)</label>
                  <input type="number" value={data.diametro_eje} onChange={e => setField('diametro_eje', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Largo de eje libre (mm)</label>
                  <input type="number" value={data.largo_eje_libre} onChange={e => setField('largo_eje_libre', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="bt-step">
              <h2>Producto Transportado</h2>

              <div className="bt-field">
                <label>Descripción del producto</label>
                <textarea rows={3} value={data.descripcion_producto} onChange={e => setField('descripcion_producto', e.target.value)} />
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Ancho de producto (mm)</label>
                  <input type="number" value={data.ancho_producto} onChange={e => setField('ancho_producto', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Largo (mm)</label>
                  <input type="number" value={data.largo_producto} onChange={e => setField('largo_producto', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Alto (mm)</label>
                  <input type="number" value={data.alto_producto} onChange={e => setField('alto_producto', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Espaciado entre productos (mm)</label>
                  <input type="number" value={data.espaciado_productos} onChange={e => setField('espaciado_productos', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Carga total (kg o kg/m²)</label>
                  <input value={data.carga_total} onChange={e => setField('carga_total', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Carga individual por producto (kg o g)</label>
                  <input value={data.carga_individual} onChange={e => setField('carga_individual', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Velocidad de banda (m/min)</label>
                  <input type="number" value={data.velocidad_banda} onChange={e => setField('velocidad_banda', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Producción requerida (kg/h o pza/h)</label>
                  <input value={data.produccion_requerida} onChange={e => setField('produccion_requerida', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Características del producto</label>
                <div className="bt-check-grid">
                  {['Crudo', 'Cocido', 'Congelado', 'Húmedo / con salsa', 'Pegajoso / adhesivo', 'Grasoso / aceitoso', 'Frágil', 'Otro'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.caracteristicas_producto.includes(op)} onChange={() => toggleCheck('caracteristicas_producto', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.caracteristicas_producto.includes('Otro') && (
                  <input placeholder="Especificar" value={data.caracteristicas_producto_otro} onChange={e => setField('caracteristicas_producto_otro', e.target.value)} />
                )}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="bt-step">
              <h2>Configuración del Sistema</h2>

              <div className="bt-field">
                <label>Configuración del recorrido</label>
                <div className="bt-check-grid">
                  {['Horizontal', 'Inclinado', 'Declinado', 'Espiral'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.configuracion_recorrido.includes(op)} onChange={() => toggleCheck('configuracion_recorrido', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Ángulo de inclinación / declinación (°)</label>
                  <input type="number" value={data.angulo_inclinacion} onChange={e => setField('angulo_inclinacion', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Ubicación del motriz</label>
                  <input value={data.ubicacion_motriz} onChange={e => setField('ubicacion_motriz', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Guardas / paredes laterales</label>
                <div className="bt-radio-grid">
                  {['Sin guardas', 'Guarda fija', 'Sidewall integrado a la banda', 'Otro'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="guardas_laterales" checked={data.guardas_laterales === op} onChange={() => setField('guardas_laterales', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.guardas_laterales === 'Otro' && (
                  <input placeholder="Especificar" value={data.guardas_laterales_otro} onChange={e => setField('guardas_laterales_otro', e.target.value)} />
                )}
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Altura de sidewall / guarda (mm)</label>
                  <input type="number" value={data.altura_sidewall} onChange={e => setField('altura_sidewall', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Espaciado entre tacos (mm)</label>
                  <input type="number" value={data.espaciado_tacos} onChange={e => setField('espaciado_tacos', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Sistema de retorno</label>
                <div className="bt-radio-grid">
                  {['Paralelo', 'Deslizante (mesa)', 'Con rodillos', 'Otro'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="sistema_retorno" checked={data.sistema_retorno === op} onChange={() => setField('sistema_retorno', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.sistema_retorno === 'Otro' && (
                  <input placeholder="Especificar" value={data.sistema_retorno_otro} onChange={e => setField('sistema_retorno_otro', e.target.value)} />
                )}
              </div>

              <div className="bt-field">
                <label>Tensado</label>
                <div className="bt-radio-grid">
                  {['Tornillo manual', 'Neumático / automático', 'Contrapeso', 'Otro'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="tensado" checked={data.tensado === op} onChange={() => setField('tensado', op)} />
                      {op}
                    </label>
                  ))}
                </div>
                {data.tensado === 'Otro' && (
                  <input placeholder="Especificar" value={data.tensado_otro} onChange={e => setField('tensado_otro', e.target.value)} />
                )}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="bt-step">
              <h2>Limpieza / Saneamiento</h2>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Método de limpieza</label>
                  <input value={data.metodo_limpieza} onChange={e => setField('metodo_limpieza', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Frecuencia de limpieza</label>
                  <input value={data.frecuencia_limpieza} onChange={e => setField('frecuencia_limpieza', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Químicos de limpieza usados</label>
                  <input value={data.quimicos_limpieza} onChange={e => setField('quimicos_limpieza', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Concentración química (%)</label>
                  <input value={data.concentracion_quimica} onChange={e => setField('concentracion_quimica', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Temperatura del medio de limpieza (°C)</label>
                  <input type="number" value={data.temp_medio_limpieza} onChange={e => setField('temp_medio_limpieza', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Tiempo de exposición de la banda</label>
                  <input value={data.tiempo_exposicion} onChange={e => setField('tiempo_exposicion', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="bt-step">
              <h2>Observaciones y Anexos</h2>
              <div className="bt-field">
                <label>Problemas o fallas reportadas en la banda o el sistema actual (quemado, estiramiento, ruido, desalineación), y notas adicionales</label>
                <textarea rows={6} value={data.observaciones} onChange={e => setField('observaciones', e.target.value)} />
              </div>
              <div className="bt-field">
                <label>Documentación adjunta</label>
                <div className="bt-check-grid">
                  {['Fotos', 'Plano / dibujo del equipo', 'Muestra de banda actual', 'Ninguna'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.documentacion_adjunta.includes(op)} onChange={() => toggleCheck('documentacion_adjunta', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="bt-step">
              <h2>Fotos y Videos</h2>
              <p className="bt-hint">Evidencia visual: equipo, horno, catarina, producto.</p>

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
              <p className="bt-hint bt-hint-warn">Con mi firma, el cliente confirma haber revisado este levantamiento y acepta que las especificaciones, dimensiones, accesorios y configuración aquí descritos son los que PROVAC utilizará para cotizar y fabricar/suministrar la banda ThermoDrive Intralox.</p>

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

              <h3 className="bt-subtitle">Cliente - Acepta y Confirma el Levantamiento</h3>
              <div className="bt-field">
                <label>Nombre</label>
                <input placeholder="Nombre del representante" value={data.cliente_nombre_firma} onChange={e => setField('cliente_nombre_firma', e.target.value)} />
              </div>
              <div className="bt-field">
                <label>Puesto / Cargo</label>
                <input value={data.cliente_puesto} onChange={e => setField('cliente_puesto', e.target.value)} />
              </div>
              <SignaturePad label="Firma y Sello del Cliente" initialValue={existente ? existente.firma_cliente : ''} onSignatureChange={sig => setField('firma_cliente', sig)} />
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
                <li className={data.tipo_proceso.length > 0 ? 'ok' : 'pend'}>{data.tipo_proceso.length > 0 ? '✅' : '⏳'} Tipo de Proceso / Equipo</li>
                <li className={data.estilo_superficie.length > 0 ? 'ok' : 'pend'}>{data.estilo_superficie.length > 0 ? '✅' : '⏳'} Especificación de Banda</li>
                <li className={data.diametro_paso_catarina ? 'ok' : 'pend'}>{data.diametro_paso_catarina ? '✅' : '⏳'} Catarina / Rueda y Eje</li>
                <li className={data.descripcion_producto ? 'ok' : 'pend'}>{data.descripcion_producto ? '✅' : '⏳'} Producto Transportado</li>
                <li className={data.fotos.length > 0 ? 'ok' : 'pend'}>{data.fotos.length > 0 ? '✅' : '⏳'} Fotos y Videos ({data.fotos.length})</li>
                <li className={data.firma_tecnico ? 'ok' : 'pend'}>{data.firma_tecnico ? '✅' : '⏳'} Firmas</li>
              </ul>

              <h3 className="bt-subtitle">Cliente</h3>
              <div className="bt-resumen-grid">
                <span>Empresa:</span><b>{data.empresa || '—'}</b>
                <span>Contacto:</span><b>{data.contacto || '—'}</b>
                <span>Fecha:</span><b>{data.fecha || '—'}</b>
              </div>

              <h3 className="bt-subtitle">Banda ThermoDrive</h3>
              <div className="bt-resumen-grid">
                <span>Ancho:</span><b>{data.ancho_banda ? `${data.ancho_banda} mm` : '—'}</b>
                <span>Estilo superficie:</span><b>{data.estilo_superficie.join(', ') || '—'}</b>
                <span>Temp. máx. operación:</span><b>{data.temp_max_operacion ? `${data.temp_max_operacion} °C` : '—'}</b>
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
            {step < TOTAL_PASOS_FINAL && <button type="button" className="bt-nav-next" onClick={next}>Siguiente →</button>}
          </div>
        </div>
      </main>
    </div>
  );
}
