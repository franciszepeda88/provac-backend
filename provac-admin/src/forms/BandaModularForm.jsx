import { useState, useRef, useEffect } from 'react';
import { API_URL } from '../config';
import SignaturePad from '../components/SignaturePad';
import './BandaTransporteForm.css';

const TITULOS_RECTA = [
  'Datos del Cliente',
  'Banda y Catarina (Sprocket)',
  'Producto Transportado',
  'Datos de Aplicación',
  'Limpieza / Saneamiento',
  'Observaciones',
  'Fotos y Videos',
  'Firmas y Conformidad',
  'Confirmar Levantamiento'
];

const TITULOS_RADIAL = [
  'Datos del Cliente',
  'Banda y Catarina (Sprocket)',
  'Producto Transportado',
  'Datos de Aplicación',
  'Configuración del Sistema (Curvas)',
  'Limpieza / Saneamiento',
  'Observaciones',
  'Fotos y Videos',
  'Firmas y Conformidad',
  'Confirmar Levantamiento'
];

const SERIES_RECTA = ['100', '200', '400', '800', '900', '1100', '1400', '1500', '1600', '1700', '1900', '2200', '2400', '2600', '3000', '3200', '4500', '5900', '6300', '7200', '7600', '10000', 'Recomendación Intralox'];
const SERIES_RADIAL = ['2200', '2300', '2400', '2600', '2700', '2800', 'Recomendación Intralox'];

const curvaVacia = { long_recta_previa: '', radio_interior: '', angulo: '', direccion_giro: '', acumulacion_pct: '', elevacion: '' };

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
  // Paso 2 - Banda y Catarina
  serie_intralox: '',
  estilo: '',
  material: '',
  ancho_banda: '',
  largo_centro_centro: '',
  color: '',
  espesor: '',
  placas_transferencia: '',
  empujadores: '',
  altura_empujador: '',
  espaciado_empujadores: '',
  guardas_laterales: '',
  altura_guarda_lateral: '',
  ancho_cara_catarina: '',
  diametro_paso_catarina: '',
  barreno_diametro_interior: '',
  material_eje: '',
  material_eje_otro: '',
  diametro_cubo_buje: '',
  no_dientes_catarina: '',
  // Paso 3 - Producto Transportado
  tipo_producto: [],
  caracteristicas_producto: [],
  requisitos_regulatorios: [],
  descripcion_producto: '',
  ancho_producto: '',
  largo_producto: '',
  alto_producto: '',
  espaciado_productos: '',
  carga_total: '',
  carga_individual: '',
  temp_producto: '',
  velocidad_banda: '',
  metodo_carga: [],
  // Paso 4 - Datos de Aplicación
  temp_operacion_motriz: '',
  ubicacion_motriz: '',
  construccion_retorno: '',
  condiciones_retorno: [],
  material_retorno: '',
  rodillo_snub: '',
  material_rodillo_snub: '',
  acumulacion_producto: '',
  pct_acumulacion: '',
  arranques_paros_frecuentes: '',
  cambio_elevacion: '',
  medida_inclinacion: '',
  // Paso 5 (solo Radial) - Configuración del Sistema (Curvas)
  material_riel_curvo: '',
  barra_frontal: '',
  material_barra_frontal: '',
  numero_curvas: '',
  longitud_tramo_recto_final: '',
  acumulacion_tramo_final: '',
  cambio_elevacion_tramo_final: '',
  curvas: {
    curva1: { ...curvaVacia },
    curva2: { ...curvaVacia },
    curva3: { ...curvaVacia },
    curva4: { ...curvaVacia }
  },
  // Paso Limpieza
  metodo_limpieza: '',
  frecuencia_limpieza: '',
  quimicos_limpieza: '',
  concentracion_quimica: '',
  temp_medio_limpieza: '',
  tiempo_exposicion: '',
  // Paso Observaciones
  observaciones: '',
  documentacion_adjunta: [],
  // Paso Fotos
  fotos: [],
  // Paso Firmas
  tecnico_nombre: '',
  tecnico_puesto: '',
  firma_tecnico: '',
  fecha_firma: '',
  cliente_nombre_firma: '',
  cliente_puesto: '',
  firma_cliente: ''
};

export default function BandaModularForm({ usuario, onBack, onLogout, onIrInicio, existente }) {
  const construirDataInicial = () => {
    if (!existente) return initialData;
    const { cliente_nombre, ubicacion, folio, fotos, firma_tecnico, firma_cliente, datos } = existente;
    return {
      ...initialData,
      ...datos,
      curvas: {
        curva1: { ...curvaVacia, ...((datos && datos.curvas && datos.curvas.curva1) || {}) },
        curva2: { ...curvaVacia, ...((datos && datos.curvas && datos.curvas.curva2) || {}) },
        curva3: { ...curvaVacia, ...((datos && datos.curvas && datos.curvas.curva3) || {}) },
        curva4: { ...curvaVacia, ...((datos && datos.curvas && datos.curvas.curva4) || {}) }
      },
      folio: folio || initialData.folio,
      empresa: cliente_nombre || '',
      direccion: ubicacion || '',
      fotos: fotos || [],
      firma_tecnico: firma_tecnico || '',
      firma_cliente: firma_cliente || ''
    };
  };

  const [subtipo, setSubtipo] = useState(existente ? (existente.datos && existente.datos.subtipo) || 'recta' : null);
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

  const TITULOS = subtipo === 'radial' ? TITULOS_RADIAL : TITULOS_RECTA;
  const TOTAL_PASOS = TITULOS.length;
  const esRadial = subtipo === 'radial';
  // Índices de paso (1-based) según subtipo
  const PASO_CURVAS = esRadial ? 5 : null;
  const PASO_LIMPIEZA = esRadial ? 6 : 5;
  const PASO_OBSERVACIONES = esRadial ? 7 : 6;
  const PASO_FOTOS = esRadial ? 8 : 7;
  const PASO_FIRMAS = esRadial ? 9 : 8;
  const PASO_CONFIRMAR = esRadial ? 10 : 9;

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

  const setCurvaField = (curva, campo, valor) => {
    setData(prev => ({
      ...prev,
      curvas: {
        ...prev.curvas,
        [curva]: { ...prev.curvas[curva], [campo]: valor }
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
      tipo_banda: 'modular',
      folio,
      cliente_nombre: empresa,
      ubicacion: direccion,
      estado,
      fotos,
      firma_tecnico,
      firma_cliente,
      datos: { subtipo, ...resto }
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
          setSubtipo(null);
          setSuccess('');
        }, 1800);
      }
    } catch (err) {
      setError('❌ Error de conexión: ' + err.message);
      setLoading(false);
    }
  };

  const progresoPct = Math.round((step / TOTAL_PASOS) * 100);
  const SERIES = esRadial ? SERIES_RADIAL : SERIES_RECTA;

  const CURVAS_LABELS = {
    curva1: 'Curva 1',
    curva2: 'Curva 2',
    curva3: 'Curva 3',
    curva4: 'Curva 4'
  };

  // Pantalla de selección de subtipo (recta / radial)
  if (!subtipo) {
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
          <button className="bt-back" onClick={onBack}>Cambiar tipo</button>
          <span className="bt-user">{usuario.nombre}</span>
          <button className="bt-logout" onClick={onLogout}>Salir</button>
        </nav>
        <main className="bt-main">
          <div className="bt-box">
            <h2>Banda Modular Plástica Intralox</h2>
            <p className="bt-hint">Selecciona el tipo de recorrido del sistema a levantar.</p>
            <div className="bt-subtipo-grid">
              <button type="button" className="bt-subtipo-card" onClick={() => setSubtipo('recta')}>
                <b>Recorrido Recto</b>
                <p>Transportador en línea recta, sin curvas.</p>
              </button>
              <button type="button" className="bt-subtipo-card" onClick={() => setSubtipo('radial')}>
                <b>Recorrido Radial (Curvas)</b>
                <p>Sistema con una o más curvas horizontales.</p>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
        <div className="bt-tipo-banner">Banda Modular Plástica — {esRadial ? 'Recorrido Radial' : 'Recorrido Recto'}</div>
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
              <h2>Banda y Catarina (Sprocket)</h2>

              <a
                className="bt-link-externo"
                href="https://www.intralox.com/belt-finder/modular-plastic-belting"
                target="_blank"
                rel="noopener noreferrer"
              >
                Identificar banda en el sitio oficial de Intralox ↗
              </a>

              <div className="bt-field">
                <label>Serie Intralox</label>
                <div className="bt-radio-grid">
                  {SERIES.map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="serie_intralox" checked={data.serie_intralox === op} onChange={() => setField('serie_intralox', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Estilo (Flat Top, Flush Grid, Raised Rib, Friction Top...)</label>
                  <input value={data.estilo} onChange={e => setField('estilo', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Material (PE, PP, acetal...)</label>
                  <input value={data.material} onChange={e => setField('material', e.target.value)} />
                </div>
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
                  <label>Color</label>
                  <input value={data.color} onChange={e => setField('color', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Espesor (mm)</label>
                  <input type="number" step="0.01" value={data.espesor} onChange={e => setField('espesor', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Placas de transferencia (finger plates)</label>
                <div className="bt-radio-grid">
                  {['Sí', 'No'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="placas_transferencia" checked={data.placas_transferencia === op} onChange={() => setField('placas_transferencia', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Empujadores (pushers)</label>
                <div className="bt-radio-grid">
                  {['Sí', 'No'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="empujadores" checked={data.empujadores === op} onChange={() => setField('empujadores', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Altura de empujador (mm)</label>
                  <input type="number" value={data.altura_empujador} onChange={e => setField('altura_empujador', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Espaciado entre empujadores (mm)</label>
                  <input type="number" value={data.espaciado_empujadores} onChange={e => setField('espaciado_empujadores', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Guardas laterales (side guards)</label>
                <div className="bt-radio-grid">
                  {['Sí', 'No'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="guardas_laterales" checked={data.guardas_laterales === op} onChange={() => setField('guardas_laterales', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Altura de guarda lateral (mm)</label>
                  <input type="number" value={data.altura_guarda_lateral} onChange={e => setField('altura_guarda_lateral', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Ancho de cara de catarina (mm)</label>
                  <input type="number" value={data.ancho_cara_catarina} onChange={e => setField('ancho_cara_catarina', e.target.value)} />
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>Diámetro de paso de catarina (mm)</label>
                  <input type="number" value={data.diametro_paso_catarina} onChange={e => setField('diametro_paso_catarina', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Barreno / diámetro interior (mm)</label>
                  <input type="number" value={data.barreno_diametro_interior} onChange={e => setField('barreno_diametro_interior', e.target.value)} />
                </div>
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
                  <label>Diámetro del cubo / buje (hub, mm)</label>
                  <input type="number" value={data.diametro_cubo_buje} onChange={e => setField('diametro_cubo_buje', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>No. de dientes de catarina</label>
                  <input type="number" value={data.no_dientes_catarina} onChange={e => setField('no_dientes_catarina', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bt-step">
              <h2>Producto Transportado</h2>

              <div className="bt-field">
                <label>Tipo de producto</label>
                <div className="bt-check-grid">
                  {['Plástico', 'Aluminio', 'Acero', 'Cartón', 'Vidrio', 'Otro'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.tipo_producto.includes(op)} onChange={() => toggleCheck('tipo_producto', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Características del producto</label>
                <div className="bt-check-grid">
                  {['Cortante', 'Seco', 'Húmedo', 'Resbaloso', 'Congelado', 'Adhesivo / pegajoso', 'Crudo', 'Fresco', 'Cocido', 'Con salsa', 'Marinado', 'Deshuesado / pelado', 'Sazonado', 'Abrasivo', 'Corrosivo'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.caracteristicas_producto.includes(op)} onChange={() => toggleCheck('caracteristicas_producto', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Requisitos regulatorios</label>
                <div className="bt-check-grid">
                  {['Requiere FDA', 'Requiere USDA-FSIS', 'Ninguno'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.requisitos_regulatorios.includes(op)} onChange={() => toggleCheck('requisitos_regulatorios', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

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
                  <label>Temperatura del producto (°C)</label>
                  <input type="number" value={data.temp_producto} onChange={e => setField('temp_producto', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Velocidad de banda (m/min)</label>
                  <input type="number" value={data.velocidad_banda} onChange={e => setField('velocidad_banda', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Método de carga</label>
                <div className="bt-check-grid">
                  {['Extremo a extremo', 'Lateral', 'Por arriba (top)', 'Por impacto', 'Manual'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.metodo_carga.includes(op)} onChange={() => toggleCheck('metodo_carga', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bt-step">
              <h2>Datos de Aplicación</h2>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Temperatura de operación / motriz (°C)</label>
                  <input type="number" value={data.temp_operacion_motriz} onChange={e => setField('temp_operacion_motriz', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Ubicación del motriz</label>
                  <input value={data.ubicacion_motriz} onChange={e => setField('ubicacion_motriz', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Construcción del retorno</label>
                <div className="bt-radio-grid">
                  {['Paralelo', 'En V', 'Sólido (mesa)', 'Otro'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="construccion_retorno" checked={data.construccion_retorno === op} onChange={() => setField('construccion_retorno', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Condiciones del retorno</label>
                <div className="bt-check-grid">
                  {['Húmedo', 'Seco', 'Abrasivo'].map(op => (
                    <label key={op} className="bt-check">
                      <input type="checkbox" checked={data.condiciones_retorno.includes(op)} onChange={() => toggleCheck('condiciones_retorno', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Material del retorno</label>
                <div className="bt-radio-grid">
                  {['UHMW', 'HDPE', 'Nylón', 'Acero', 'Otro'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="material_retorno" checked={data.material_retorno === op} onChange={() => setField('material_retorno', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Rodillo snub</label>
                <div className="bt-radio-grid">
                  {['Ninguno', 'Estático', 'Dinámico'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="rodillo_snub" checked={data.rodillo_snub === op} onChange={() => setField('rodillo_snub', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bt-field">
                <label>Material de rodillo snub</label>
                <input value={data.material_rodillo_snub} onChange={e => setField('material_rodillo_snub', e.target.value)} />
              </div>

              <div className="bt-field">
                <label>Acumulación de producto</label>
                <div className="bt-radio-grid">
                  {['Sí', 'No'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="acumulacion_producto" checked={data.acumulacion_producto === op} onChange={() => setField('acumulacion_producto', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bt-row">
                <div className="bt-field">
                  <label>% de acumulación</label>
                  <input type="number" value={data.pct_acumulacion} onChange={e => setField('pct_acumulacion', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Arranques / paros frecuentes</label>
                  <input value={data.arranques_paros_frecuentes} onChange={e => setField('arranques_paros_frecuentes', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Cambio de elevación</label>
                <div className="bt-radio-grid">
                  {['Horizontal', 'Inclinado', 'Declinado'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="cambio_elevacion" checked={data.cambio_elevacion === op} onChange={() => setField('cambio_elevacion', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bt-field">
                <label>Medida de inclinación / declinación (m o °)</label>
                <input value={data.medida_inclinacion} onChange={e => setField('medida_inclinacion', e.target.value)} />
              </div>
            </div>
          )}

          {esRadial && step === PASO_CURVAS && (
            <div className="bt-step">
              <h2>Configuración del Sistema (Curvas)</h2>

              <div className="bt-field">
                <label>Material del riel curvo (curved rail)</label>
                <div className="bt-radio-grid">
                  {['UHMW', 'HDPE', 'Nylón', 'Acero', 'Otro'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="material_riel_curvo" checked={data.material_riel_curvo === op} onChange={() => setField('material_riel_curvo', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-field">
                <label>Barra frontal (front bar)</label>
                <div className="bt-radio-grid">
                  {['Ninguna', 'Estática', 'Dinámica'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="barra_frontal" checked={data.barra_frontal === op} onChange={() => setField('barra_frontal', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bt-field">
                <label>Material de barra frontal</label>
                <input value={data.material_barra_frontal} onChange={e => setField('material_barra_frontal', e.target.value)} />
              </div>

              <div className="bt-field">
                <label>Número de curvas</label>
                <div className="bt-radio-grid">
                  {['1', '2', '3', '4'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="numero_curvas" checked={data.numero_curvas === op} onChange={() => setField('numero_curvas', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bt-row">
                <div className="bt-field">
                  <label>Longitud de tramo recto final (m)</label>
                  <input type="number" step="0.01" value={data.longitud_tramo_recto_final} onChange={e => setField('longitud_tramo_recto_final', e.target.value)} />
                </div>
                <div className="bt-field">
                  <label>Acumulación en tramo final</label>
                  <input value={data.acumulacion_tramo_final} onChange={e => setField('acumulacion_tramo_final', e.target.value)} />
                </div>
              </div>

              <div className="bt-field">
                <label>Cambio de elevación en tramo final</label>
                <div className="bt-radio-grid">
                  {['Sin cambio', 'Inclinado', 'Declinado'].map(op => (
                    <label key={op} className="bt-radio">
                      <input type="radio" name="cambio_elevacion_tramo_final" checked={data.cambio_elevacion_tramo_final === op} onChange={() => setField('cambio_elevacion_tramo_final', op)} />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              <p className="bt-hint">Ángulos típicos: 30°, 45°, 90°, 135°, 180° (u otro, especificar). Dirección de giro: derecha o izquierda, vista en el sentido de avance del producto.</p>

              {Object.keys(CURVAS_LABELS).map(key => (
                <div key={key}>
                  <h3 className="bt-subtitle">{CURVAS_LABELS[key]}</h3>
                  <div className="bt-row">
                    <div className="bt-field">
                      <label>Long. recta previa (m)</label>
                      <input type="number" step="0.01" value={data.curvas[key].long_recta_previa} onChange={e => setCurvaField(key, 'long_recta_previa', e.target.value)} />
                    </div>
                    <div className="bt-field">
                      <label>Radio interior (mm)</label>
                      <input type="number" value={data.curvas[key].radio_interior} onChange={e => setCurvaField(key, 'radio_interior', e.target.value)} />
                    </div>
                  </div>
                  <div className="bt-row">
                    <div className="bt-field">
                      <label>Ángulo (°)</label>
                      <input type="number" value={data.curvas[key].angulo} onChange={e => setCurvaField(key, 'angulo', e.target.value)} />
                    </div>
                    <div className="bt-field">
                      <label>Dirección de giro</label>
                      <input placeholder="Derecha / Izquierda" value={data.curvas[key].direccion_giro} onChange={e => setCurvaField(key, 'direccion_giro', e.target.value)} />
                    </div>
                  </div>
                  <div className="bt-row">
                    <div className="bt-field">
                      <label>Acumulación %</label>
                      <input type="number" value={data.curvas[key].acumulacion_pct} onChange={e => setCurvaField(key, 'acumulacion_pct', e.target.value)} />
                    </div>
                    <div className="bt-field">
                      <label>Elevación (m / °)</label>
                      <input value={data.curvas[key].elevacion} onChange={e => setCurvaField(key, 'elevacion', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === PASO_LIMPIEZA && (
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

          {step === PASO_OBSERVACIONES && (
            <div className="bt-step">
              <h2>Observaciones y Anexos</h2>
              <div className="bt-field">
                <label>Problemas o fallas reportadas en la banda o el sistema actual, y notas adicionales</label>
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

          {step === PASO_FOTOS && (
            <div className="bt-step">
              <h2>Fotos y Videos</h2>
              <p className="bt-hint">Evidencia visual: equipo, catarina, curvas (si aplica), producto.</p>

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

          {step === PASO_FIRMAS && (
            <div className="bt-step">
              <h2>Firmas y Conformidad</h2>
              <p className="bt-hint bt-hint-warn">Con mi firma, el cliente confirma haber revisado este levantamiento y acepta que las especificaciones, dimensiones, accesorios y configuración aquí descritos son los que PROVAC utilizará para cotizar y fabricar/suministrar la banda Intralox.</p>

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

          {step === PASO_CONFIRMAR && (
            <div className="bt-step">
              <h2>Confirmar Levantamiento</h2>

              <div className="bt-resumen-badge">
                ✅ Levantamiento {data.firma_tecnico ? 'listo para enviar' : 'incompleto'}
              </div>

              <h3 className="bt-subtitle">Estado de Secciones</h3>
              <ul className="bt-estado-list">
                <li className={data.empresa ? 'ok' : 'pend'}>{data.empresa ? '✅' : '⏳'} Datos del Cliente</li>
                <li className={data.serie_intralox || data.estilo ? 'ok' : 'pend'}>{data.serie_intralox || data.estilo ? '✅' : '⏳'} Banda y Catarina</li>
                <li className={data.tipo_producto.length > 0 ? 'ok' : 'pend'}>{data.tipo_producto.length > 0 ? '✅' : '⏳'} Producto Transportado</li>
                <li className={data.construccion_retorno ? 'ok' : 'pend'}>{data.construccion_retorno ? '✅' : '⏳'} Datos de Aplicación</li>
                {esRadial && <li className={data.numero_curvas ? 'ok' : 'pend'}>{data.numero_curvas ? '✅' : '⏳'} Configuración de Curvas</li>}
                <li className={data.fotos.length > 0 ? 'ok' : 'pend'}>{data.fotos.length > 0 ? '✅' : '⏳'} Fotos y Videos ({data.fotos.length})</li>
                <li className={data.firma_tecnico ? 'ok' : 'pend'}>{data.firma_tecnico ? '✅' : '⏳'} Firmas</li>
              </ul>

              <h3 className="bt-subtitle">Cliente</h3>
              <div className="bt-resumen-grid">
                <span>Empresa:</span><b>{data.empresa || '—'}</b>
                <span>Contacto:</span><b>{data.contacto || '—'}</b>
                <span>Fecha:</span><b>{data.fecha || '—'}</b>
              </div>

              <h3 className="bt-subtitle">Banda Modular</h3>
              <div className="bt-resumen-grid">
                <span>Tipo:</span><b>{esRadial ? 'Radial (curvas)' : 'Recta'}</b>
                <span>Serie Intralox:</span><b>{data.serie_intralox || '—'}</b>
                <span>Estilo:</span><b>{data.estilo || '—'}</b>
                <span>Ancho:</span><b>{data.ancho_banda ? `${data.ancho_banda} mm` : '—'}</b>
                {esRadial && (<><span>No. curvas:</span><b>{data.numero_curvas || '—'}</b></>)}
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
