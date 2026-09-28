import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const TIPO_LABELS = {
  transporte: 'Banda de Transporte',
  transmision: 'Banda de Transmisión de Fuerza',
  modular: 'Banda Modular Plástica',
  thermodrive: 'Banda Thermodrive'
};

const humanize = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const LABELS_BY_TIPO = {
  transporte: {
    fecha: 'Fecha', entrada: 'Hora entrada', salida: 'Hora salida', planta: 'Planta / Sucursal',
    contacto: 'Contacto', puesto: 'Puesto', telefono: 'Teléfono', email: 'Email',
    area_linea: 'Área / Línea', equipo_tag: 'Equipo / Tag', tecnico_provac: 'Técnico PROVAC', vendedor: 'Vendedor',
    referencia_banda: 'Referencia de la Banda',
    industria: 'Industria', producto_transportador: 'Producto Transportado', carga_kgm: 'Carga (kg/m)',
    velocidad_mmin: 'Velocidad (m/min)', inclinacion: 'Inclinación (°)', temperatura_operacion: 'Temperatura (°C)',
    horas_dia: 'Horas/día', turnos_dia: 'Turnos/día', ambiente: 'Ambiente', contacto_producto: 'Contacto con Producto',
    contacto_producto_otro: 'Especificar otro contacto con producto',
    marca_linea: 'Marca / Línea', referencia_actual: 'Referencia Actual', material_base: 'Material Base',
    num_capas: 'No. Capas/Telas', espesor_total: 'Espesor total (mm)', color: 'Color', dureza_shore: 'Dureza Shore A',
    cubierta_superior: 'Cubierta Superior', cubierta_superior_otro: 'Especificar cubierta superior',
    cubierta_inferior: 'Cubierta Inferior', cubierta_inferior_otro: 'Especificar cubierta inferior',
    ancho_banda: 'Ancho de banda (mm)', largo_circuito_cerrado: 'Largo total de circuito cerrado (mm)',
    distancia_centros: 'Distancia entre centros (mm)', largo_abierto: 'Largo abierto (mm)',
    ancho_util: 'Ancho útil (mm)', ancho_libre: 'Ancho libre (mm)',
    tipo_empalme: 'Tipo de Empalme', tipo_empalme_otro: 'Especificar tipo de empalme',
    metodo_union: 'Método de unión', modelo_empalme_mecanico: 'Modelo de empalme mecánico a usar',
    largo_empalme: 'Largo empalme (mm)', angulo_empalme: 'Ángulo (°)', ubicacion_empalme: 'Ubicación del empalme',
    guia_tracking: 'Tipo de guía', guia_especificaciones: 'Especificaciones y medidas de la guía',
    guia_indentacion: 'Indentación de la guía', posicion_guia: 'Posición',
    tacos: 'Tipo de Empujador', alto_tacos: 'Alto Empujador (mm)', paso_tacos: 'Distancia entre Empujadores (mm)',
    observaciones: 'Notas adicionales, riesgos, condiciones especiales, datos que falten por confirmar',
    tecnico_nombre: 'Nombre', tecnico_puesto: 'Puesto', fecha_firma: 'Fecha',
    cliente_nombre_firma: 'Nombre', cliente_puesto: 'Puesto / Cargo'
  },
  transmision: {
    fecha: 'Fecha', entrada: 'Hora entrada', salida: 'Hora salida', planta: 'Planta / Sucursal',
    contacto: 'Contacto', puesto: 'Puesto', telefono: 'Teléfono', email: 'Email',
    area_linea: 'Área / Línea', equipo_tag: 'Equipo / Tag', tecnico_provac: 'Técnico PROVAC', vendedor: 'Vendedor',
    referencia_banda: 'Referencia de la Banda',
    potencia_motor: 'Potencia del motor (kW / HP)', rpm_motor: 'RPM motor',
    horas_operacion_dia: 'Horas de operación / día', temp_trabajo: 'Temp. de trabajo (°C)',
    ambiente_contacto: 'Ambiente / contacto', ambiente_contacto_otro: 'Especificar otro ambiente / contacto',
    motivo_cambio: 'Motivo del cambio',
    linea_habasit: 'Línea Familia', codigo_articulo: 'Código de artículo / referencia',
    referencia_actual: 'Referencia banda actual', marca_actual: 'Marca banda actual',
    material_nucleo: 'Material del núcleo', material_nucleo_otro: 'Especificar material del núcleo',
    superficie_traccion: 'Superficie de tracción (lado polea)', superficie_traccion_otro: 'Especificar superficie de tracción',
    superficie_carga: 'Superficie de carga (lado producto)', superficie_carga_otro: 'Especificar superficie de carga',
    color: 'Color', espesor_total: 'Espesor total (mm)', certificaciones: 'Certificaciones requeridas',
    ancho_banda: 'Ancho de banda (mm)', largo_total_perimetro: 'Largo total / perímetro (mm)',
    distancia_centros: 'Distancia entre centros (mm)', espesor_total_dim: 'Espesor total (mm)',
    cantidad_bandas: 'Cantidad de bandas a fabricar',
    tipo_empalme: 'Tipo de empalme', tipo_empalme_otro: 'Especificar tipo de empalme',
    largo_empalme: 'Largo del empalme (mm)', angulo_empalme: 'Ángulo (°)', lugar_empalme: 'Lugar del empalme',
    poleas: 'Poleas', montaje_orientacion: 'Montaje (horiz. / vert. / incl.)',
    rango_ajuste_tensor: 'Rango de ajuste del tensor (mm)', sistema_tensado: 'Sistema de tensado',
    estado_poleas: 'Estado de poleas', dano_banda_actual: 'Daño en banda actual',
    acceso_instalar: 'Acceso para instalar', instalacion_entrega: 'Instalación / entrega',
    observaciones: 'Notas adicionales, riesgos, condiciones especiales, datos que falten por confirmar',
    tecnico_nombre: 'Nombre', tecnico_puesto: 'Puesto', fecha_firma: 'Fecha',
    cliente_nombre_firma: 'Nombre', cliente_puesto: 'Puesto / Cargo'
  },
  modular: {
    fecha: 'Fecha', entrada: 'Hora entrada', salida: 'Hora salida', planta: 'Planta / Sucursal',
    contacto: 'Contacto', puesto: 'Puesto', telefono: 'Teléfono', email: 'Email',
    area_linea: 'Área / Línea', equipo_tag: 'Equipo / Tag', tecnico_provac: 'Técnico PROVAC', vendedor: 'Vendedor',
    serie_intralox: 'Serie Intralox', estilo: 'Estilo', estilo_otro: 'Especificar estilo',
    material: 'Material', material_otro: 'Especificar material',
    ancho_banda: 'Ancho de banda (mm)', largo_centro_centro: 'Largo centro a centro (m)',
    paso_banda: 'Paso de la banda (mm)', color: 'Color',
    placas_transferencia: 'Placas de transferencia (finger plates)', empujadores: 'Empujadores (pushers)',
    tipo_empujador: 'Tipo de Empujador', altura_empujador: 'Altura de empujador (mm)',
    espaciado_empujadores: 'Distancia entre empujadores (mm)', ancho_empujador: 'Ancho de Empujador (mm)',
    indentacion_empujadores: 'Indentación de Empujadores (mm)',
    guardas_laterales: 'Guardas laterales (side guards)', altura_guarda_lateral: 'Altura de guarda lateral (mm)',
    diametro_paso_catarina: 'Diámetro ext de Sprocket (mm)', no_dientes_catarina: 'No. de dientes de Sprocket',
    material_eje: 'Material del eje', material_eje_otro: 'Especificar material del eje',
    forma_eje: 'Forma de Eje', diametro_cubo_buje: 'Diámetro/Medida de Eje (mm)',
    tipo_producto: 'Tipo de producto', tipo_producto_otro: 'Especificar tipo de producto',
    caracteristicas_producto: 'Características del producto', requisitos_regulatorios: 'Requisitos regulatorios',
    descripcion_producto: 'Descripción del producto', ancho_producto: 'Ancho de producto (mm)',
    largo_producto: 'Largo (mm)', alto_producto: 'Alto (mm)', espaciado_productos: 'Espaciado entre productos (mm)',
    carga_total: 'Carga total (kg o kg/m²)', temp_producto: 'Temperatura del producto (°C)',
    velocidad_banda: 'Velocidad de banda (m/min)',
    referencia_banda: 'Referencia de la Banda',
    temp_operacion_motriz: 'Temperatura de Operación (°C)', construccion_retorno: 'Construcción del retorno',
    construccion_retorno_otro: 'Especificar construcción del retorno', condiciones_retorno: 'Condiciones del retorno',
    condiciones_retorno_otro: 'Especificar condiciones del retorno', material_retorno: 'Material del retorno',
    material_retorno_otro: 'Especificar material del retorno', cambio_elevacion: 'Cambio de elevación',
    medida_inclinacion: 'Medida de inclinación / declinación (m o °)',
    material_riel_curvo: 'Material del riel curvo (curved rail)', numero_curvas: 'Número de curvas',
    longitud_tramo_recto_final: 'Longitud de tramo recto final (m)',
    cambio_elevacion_tramo_final: 'Cambio de elevación en tramo final', curvas: 'Curvas',
    metodo_limpieza: 'Método de limpieza', frecuencia_limpieza: 'Frecuencia de limpieza',
    quimicos_limpieza: 'Químicos de limpieza usados', tiempo_exposicion: 'Tiempo de exposición de la banda',
    observaciones: 'Problemas o fallas reportadas en la banda o el sistema actual, y notas adicionales',
    documentacion_adjunta: 'Documentación adjunta',
    tecnico_nombre: 'Nombre', tecnico_puesto: 'Puesto', fecha_firma: 'Fecha',
    cliente_nombre_firma: 'Nombre', cliente_puesto: 'Puesto / Cargo'
  },
  thermodrive: {
    fecha: 'Fecha', entrada: 'Hora entrada', salida: 'Hora salida', planta: 'Planta / Sucursal',
    contacto: 'Contacto', puesto: 'Puesto', telefono: 'Teléfono', email: 'Email',
    area_linea: 'Área / Línea', equipo_tag: 'Equipo / Tag', tecnico_provac: 'Técnico PROVAC', vendedor: 'Vendedor',
    referencia_banda: 'Referencia de la Banda',
    tipo_proceso: 'Tipo de proceso', tipo_proceso_otro: 'Especificar tipo de proceso',
    marca_modelo_horno: 'Marca / Modelo del equipo', temp_max_operacion: 'Temperatura máxima de operación (°C)',
    tiempo_residencia: 'Tiempo de residencia en el equipo (min)',
    serie_intralox: 'Serie Intralox', serie_intralox_otro: 'Especificar serie Intralox',
    estilo: 'Estilo', estilo_otro: 'Especificar estilo', color_superficie: 'Color de superficie',
    material_banda: 'Material de la banda', material_banda_otro: 'Especificar material de la banda',
    ancho_banda: 'Ancho de banda (mm)', largo_centro_centro: 'Largo centro a centro (m)',
    espesor_total: 'Espesor total (mm)', paso_banda: 'Paso de banda (pitch, mm)',
    certificaciones: 'Certificaciones requeridas',
    diametro_ext_sprocket: 'Diámetro Ext Sprocket (mm)', no_dientes: 'No. de dientes',
    diametro_int_sprocket: 'Diámetro Int Sprocket (mm)', material_sprocket: 'Material de Sprocket',
    material_sprocket_otro: 'Especificar material de Sprocket', material_eje: 'Material del eje',
    material_eje_otro: 'Especificar material del eje', diametro_eje: 'Diámetro de eje (mm)',
    largo_eje_libre: 'Largo de eje libre (mm)',
    descripcion_producto: 'Descripción del producto', ancho_producto: 'Ancho de producto (mm)',
    largo_producto: 'Largo (mm)', alto_producto: 'Alto (mm)', espaciado_productos: 'Espaciado entre productos (mm)',
    carga_total: 'Carga total (kg o kg/m²)', velocidad_banda: 'Velocidad de banda (m/min)',
    caracteristicas_producto: 'Características del producto', caracteristicas_producto_otro: 'Especificar características del producto',
    configuracion_recorrido: 'Configuración del recorrido', angulo_inclinacion: 'Ángulo de inclinación / declinación (°)',
    guardas_laterales: 'Guardas / paredes laterales', guardas_laterales_otro: 'Especificar guardas / paredes laterales',
    altura_sidewall: 'Altura de sidewall / guarda (mm)', empujadores: 'Empujadores',
    tipo_empujador: 'Tipo de Empujador', altura_empujador: 'Alto de Empujador (mm)', ancho_empujador: 'Ancho de Empujador (mm)',
    sistema_retorno: 'Sistema de retorno', sistema_retorno_otro: 'Especificar sistema de retorno',
    tensado: 'Tensado', tensado_otro: 'Especificar tensado',
    metodo_limpieza: 'Método de limpieza', frecuencia_limpieza: 'Frecuencia de limpieza',
    quimicos_limpieza: 'Químicos de limpieza usados', tiempo_exposicion: 'Tiempo de exposición de la banda',
    observaciones: 'Problemas o fallas reportadas en la banda o el sistema actual (quemado, estiramiento, ruido, desalineación), y notas adicionales',
    documentacion_adjunta: 'Documentación adjunta',
    tecnico_nombre: 'Nombre', tecnico_puesto: 'Puesto', fecha_firma: 'Fecha',
    cliente_nombre_firma: 'Nombre', cliente_puesto: 'Puesto / Cargo'
  }
};

// Devuelve la etiqueta exacta usada en el formulario para un campo, según el tipo de banda.
// Si no se encuentra (campo nuevo aun no mapeado), cae de vuelta a humanizar el nombre interno.
const labelFor = (tipo, key) => (LABELS_BY_TIPO[tipo] && LABELS_BY_TIPO[tipo][key]) || humanize(key);

// Para el Excel de LISTA (varias bandas de distintos tipos en una sola tabla), se usa la
// primera etiqueta encontrada entre los 4 tipos para esa columna.
const bestLabel = (key) => {
  for (const tipo of Object.keys(LABELS_BY_TIPO)) {
    if (LABELS_BY_TIPO[tipo][key]) return LABELS_BY_TIPO[tipo][key];
  }
  return humanize(key);
};

// Campos de "Datos del Cliente" — idénticos en los 4 tipos de banda (estandarizado).
const CAMPOS_CLIENTE = ['fecha', 'entrada', 'salida', 'planta', 'contacto', 'puesto', 'telefono', 'email', 'area_linea', 'equipo_tag', 'tecnico_provac', 'vendedor'];
const CAMPOS_FIRMAS = ['tecnico_nombre', 'tecnico_puesto', 'fecha_firma', 'cliente_nombre_firma', 'cliente_puesto'];

// Agrupa los campos de "datos" en las mismas secciones que tiene cada formulario,
// para que el PDF y el Excel salgan organizados por bloques en vez de mezclados.
// Una definición de secciones por tipo de banda, ya que cada formulario tiene su propia estructura.
const SECTIONS_BY_TIPO = {
  transporte: [
    { title: 'Datos del Cliente', fields: CAMPOS_CLIENTE },
    {
      title: 'Aplicación & Condiciones',
      fields: ['referencia_banda', 'industria', 'producto_transportador', 'carga_kgm', 'velocidad_mmin', 'inclinacion', 'temperatura_operacion', 'horas_dia', 'turnos_dia', 'ambiente', 'contacto_producto', 'contacto_producto_otro']
    },
    {
      title: 'Especificaciones de Banda',
      fields: ['marca_linea', 'referencia_actual', 'material_base', 'num_capas', 'espesor_total', 'color', 'dureza_shore', 'cubierta_superior', 'cubierta_superior_otro', 'cubierta_inferior', 'cubierta_inferior_otro']
    },
    {
      title: 'Dimensiones',
      fields: ['ancho_banda', 'largo_circuito_cerrado', 'distancia_centros', 'largo_abierto', 'ancho_util', 'ancho_libre']
    },
    {
      title: 'Accesorios & Empalme',
      fields: ['tipo_empalme', 'tipo_empalme_otro', 'metodo_union', 'modelo_empalme_mecanico', 'largo_empalme', 'angulo_empalme', 'ubicacion_empalme', 'guia_tracking', 'guia_especificaciones', 'guia_indentacion', 'posicion_guia', 'tacos', 'alto_tacos', 'paso_tacos']
    },
    { title: 'Observaciones', fields: ['observaciones'] },
    { title: 'Firmas y Conformidad', fields: CAMPOS_FIRMAS }
  ],
  transmision: [
    { title: 'Datos del Cliente', fields: CAMPOS_CLIENTE },
    {
      title: 'Aplicación & Condiciones',
      fields: ['referencia_banda', 'potencia_motor', 'rpm_motor', 'horas_operacion_dia', 'temp_trabajo', 'ambiente_contacto', 'ambiente_contacto_otro', 'motivo_cambio']
    },
    {
      title: 'Especificación de Banda',
      fields: ['linea_habasit', 'codigo_articulo', 'referencia_actual', 'marca_actual', 'material_nucleo', 'material_nucleo_otro', 'superficie_traccion', 'superficie_traccion_otro', 'superficie_carga', 'superficie_carga_otro', 'color', 'espesor_total', 'certificaciones']
    },
    {
      title: 'Dimensiones de la Banda',
      fields: ['ancho_banda', 'largo_total_perimetro', 'distancia_centros', 'espesor_total_dim', 'cantidad_bandas']
    },
    {
      title: 'Empalme',
      fields: ['tipo_empalme', 'tipo_empalme_otro', 'largo_empalme', 'angulo_empalme', 'lugar_empalme']
    },
    {
      title: 'Poleas, Ejes y Montaje',
      fields: ['poleas', 'montaje_orientacion', 'rango_ajuste_tensor', 'sistema_tensado', 'estado_poleas']
    },
    {
      title: 'Estado del Equipo',
      fields: ['dano_banda_actual', 'acceso_instalar', 'instalacion_entrega']
    },
    { title: 'Observaciones', fields: ['observaciones'] },
    { title: 'Firmas y Conformidad', fields: CAMPOS_FIRMAS }
  ],
  modular: [
    { title: 'Datos del Cliente', fields: CAMPOS_CLIENTE },
    {
      title: 'Banda y Sprocket',
      fields: ['serie_intralox', 'estilo', 'estilo_otro', 'material', 'material_otro', 'ancho_banda', 'largo_centro_centro', 'paso_banda', 'color', 'placas_transferencia', 'empujadores', 'tipo_empujador', 'altura_empujador', 'espaciado_empujadores', 'ancho_empujador', 'indentacion_empujadores', 'guardas_laterales', 'altura_guarda_lateral']
    },
    {
      title: 'Sprocket',
      fields: ['diametro_paso_catarina', 'no_dientes_catarina', 'material_eje', 'material_eje_otro', 'forma_eje', 'diametro_cubo_buje']
    },
    {
      title: 'Producto Transportado',
      fields: ['tipo_producto', 'tipo_producto_otro', 'caracteristicas_producto', 'requisitos_regulatorios', 'descripcion_producto', 'ancho_producto', 'largo_producto', 'alto_producto', 'espaciado_productos', 'carga_total', 'temp_producto', 'velocidad_banda']
    },
    {
      title: 'Datos de Aplicación',
      fields: ['referencia_banda', 'temp_operacion_motriz', 'construccion_retorno', 'construccion_retorno_otro', 'condiciones_retorno', 'condiciones_retorno_otro', 'material_retorno', 'material_retorno_otro', 'cambio_elevacion', 'medida_inclinacion']
    },
    {
      title: 'Configuración del Sistema (Curvas)',
      fields: ['material_riel_curvo', 'numero_curvas', 'longitud_tramo_recto_final', 'cambio_elevacion_tramo_final', 'curvas']
    },
    {
      title: 'Limpieza / Saneamiento',
      fields: ['metodo_limpieza', 'frecuencia_limpieza', 'quimicos_limpieza', 'tiempo_exposicion']
    },
    { title: 'Observaciones y Anexos', fields: ['observaciones', 'documentacion_adjunta'] },
    { title: 'Firmas y Conformidad', fields: CAMPOS_FIRMAS }
  ],
  thermodrive: [
    { title: 'Datos del Cliente', fields: CAMPOS_CLIENTE },
    {
      title: 'Tipo de Proceso / Equipo',
      fields: ['referencia_banda', 'tipo_proceso', 'tipo_proceso_otro', 'marca_modelo_horno', 'temp_max_operacion', 'tiempo_residencia']
    },
    {
      title: 'Especificación de Banda',
      fields: ['serie_intralox', 'serie_intralox_otro', 'estilo', 'estilo_otro', 'color_superficie', 'material_banda', 'material_banda_otro', 'ancho_banda', 'largo_centro_centro', 'espesor_total', 'paso_banda', 'certificaciones']
    },
    {
      title: 'Sprocket / Rueda y Eje',
      fields: ['diametro_ext_sprocket', 'no_dientes', 'diametro_int_sprocket', 'material_sprocket', 'material_sprocket_otro', 'material_eje', 'material_eje_otro', 'diametro_eje', 'largo_eje_libre']
    },
    {
      title: 'Producto Transportado',
      fields: ['descripcion_producto', 'ancho_producto', 'largo_producto', 'alto_producto', 'espaciado_productos', 'carga_total', 'velocidad_banda', 'caracteristicas_producto', 'caracteristicas_producto_otro']
    },
    {
      title: 'Configuración del Sistema',
      fields: ['configuracion_recorrido', 'angulo_inclinacion', 'guardas_laterales', 'guardas_laterales_otro', 'altura_sidewall', 'empujadores', 'tipo_empujador', 'altura_empujador', 'ancho_empujador', 'sistema_retorno', 'sistema_retorno_otro', 'tensado', 'tensado_otro']
    },
    {
      title: 'Limpieza / Saneamiento',
      fields: ['metodo_limpieza', 'frecuencia_limpieza', 'quimicos_limpieza', 'tiempo_exposicion']
    },
    { title: 'Observaciones y Anexos', fields: ['observaciones', 'documentacion_adjunta'] },
    { title: 'Firmas y Conformidad', fields: CAMPOS_FIRMAS }
  ]
};

const seccionesDe = (tipoBanda) => SECTIONS_BY_TIPO[tipoBanda] || SECTIONS_BY_TIPO.transporte;

const AZUL = 'FF0D4C92';
const GRIS_CLARO = 'FFF1F4F8';
const GRIS_ZEBRA = 'FFF7F9FB';

// Revisa si un valor tiene contenido — incluye objetos anidados (ej. poleas, curvas)
// buscando recursivamente si alguno de sus sub-campos tiene valor.
const tieneValor = (v) => {
  if (v === null || v === undefined || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.values(v).some(sub => tieneValor(sub));
  return true;
};

// Convierte cualquier valor de "datos" (texto, array de checkboxes, u objeto anidado
// como poleas/curvas) en un string legible para el PDF/Excel.
const formatValor = (v) => {
  if (Array.isArray(v)) return v.join(', ');
  if (v && typeof v === 'object') {
    return Object.entries(v)
      .filter(([, sub]) => tieneValor(sub))
      .map(([subKey, sub]) => {
        if (sub && typeof sub === 'object' && !Array.isArray(sub)) {
          const campos = Object.entries(sub)
            .filter(([, x]) => tieneValor(x))
            .map(([k, x]) => `${humanize(k)}: ${Array.isArray(x) ? x.join(', ') : x}`)
            .join(', ');
          return `${humanize(subKey)} — ${campos}`;
        }
        return `${humanize(subKey)}: ${Array.isArray(sub) ? sub.join(', ') : sub}`;
      })
      .join('\n');
  }
  return String(v);
};

const extraerExtension = (dataUri) => {
  const match = /^data:image\/(png|jpe?g);base64,/i.exec(dataUri || '');
  if (!match) return 'png';
  return match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
};

function descargarBuffer(buffer, filename, mime) {
  const blob = new Blob([buffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Excel de la LISTA completa (varios levantamientos): una tabla con encabezado de color,
// filas alternadas y bordes, en vez de una hoja plana sin estilo.
export async function exportListToExcel(levantamientos, filename = 'levantamientos.xlsx') {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Levantamientos');

  const baseCols = ['Folio', 'Cliente', 'Tipo de Banda', 'Estado', 'Fecha', 'Ubicación'];

  // Reúne, en el mismo orden que las secciones de cada formulario, todos los campos de "datos"
  // que aparecen en al menos un levantamiento (así no se pierden columnas de ningún tipo de banda).
  const vistos = new Set();
  const datosKeys = [];
  Object.values(SECTIONS_BY_TIPO).forEach(sections => {
    sections.forEach(({ fields }) => {
      fields.forEach(k => {
        if (!vistos.has(k) && levantamientos.some(l => tieneValor((l.datos || {})[k]))) {
          vistos.add(k);
          datosKeys.push(k);
        }
      });
    });
  });
  levantamientos.forEach(l => {
    Object.keys(l.datos || {}).forEach(k => {
      if (!vistos.has(k) && tieneValor(l.datos[k])) {
        vistos.add(k);
        datosKeys.push(k);
      }
    });
  });

  const headers = [...baseCols, ...datosKeys.map(bestLabel)];
  const totalCols = headers.length;

  ws.mergeCells(1, 1, 1, totalCols);
  ws.getCell(1, 1).value = 'PROVAC - Levantamientos Técnicos';
  ws.getCell(1, 1).font = { bold: true, size: 14, color: { argb: AZUL } };

  ws.mergeCells(2, 1, 2, totalCols);
  ws.getCell(2, 1).value = `Exportado: ${new Date().toLocaleString('es-HN')}  ·  ${levantamientos.length} levantamiento(s)`;
  ws.getCell(2, 1).font = { italic: true, size: 9, color: { argb: 'FF666666' } };

  ws.addRow([]);

  const headerRow = ws.addRow(headers);
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  headerRow.height = 24;
  const headerRowNum = headerRow.number;

  levantamientos.forEach((lev, idx) => {
    const datos = lev.datos || {};
    const fila = [
      lev.folio || '',
      lev.cliente_nombre || '',
      TIPO_LABELS[lev.tipo_banda] || lev.tipo_banda || '',
      lev.estado || '',
      lev.created_at ? new Date(lev.created_at).toLocaleDateString('es-HN') : '',
      lev.ubicacion || '',
      ...datosKeys.map(k => {
        const v = datos[k];
        return tieneValor(v) ? formatValor(v) : '';
      })
    ];
    const row = ws.addRow(fila);
    const zebra = idx % 2 === 1;
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE4E4E4' } } };
      if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_ZEBRA } };
    });
  });

  headers.forEach((h, i) => {
    ws.getColumn(i + 1).width = Math.min(Math.max(String(h).length + 4, 12), 32);
  });

  ws.views = [{ state: 'frozen', ySplit: headerRowNum }];
  ws.autoFilter = { from: { row: headerRowNum, column: 1 }, to: { row: headerRowNum, column: totalCols } };

  const buffer = await wb.xlsx.writeBuffer();
  descargarBuffer(buffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

// Excel de UN solo levantamiento, organizado por bloques (igual que el PDF) en vez de
// una sola fila horizontal con todos los campos como columnas. Incluye fotos y firmas
// como imágenes reales dentro de la hoja.
export async function exportDetailToExcel(lev) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Levantamiento');
  ws.columns = [{ width: 30 }, { width: 55 }];

  const addTitulo = (texto) => {
    const row = ws.addRow([texto]);
    ws.mergeCells(`A${row.number}:B${row.number}`);
    row.getCell(1).font = { bold: true, size: 14, color: { argb: AZUL } };
    return row;
  };

  const addSeccion = (titulo) => {
    const row = ws.addRow([titulo]);
    ws.mergeCells(`A${row.number}:B${row.number}`);
    row.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
    row.height = 18;
    return row;
  };

  const addCampo = (label, valor) => {
    const row = ws.addRow([label, valor]);
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_CLARO } };
    row.getCell(1).alignment = { vertical: 'top', wrapText: true };
    row.getCell(2).alignment = { vertical: 'top', wrapText: true };
    return row;
  };

  addTitulo('PROVAC - Levantamiento Técnico');
  ws.addRow([]);
  addCampo('Folio', lev.folio || '-');
  addCampo('Tipo de Banda', TIPO_LABELS[lev.tipo_banda] || lev.tipo_banda || '-');
  addCampo('Estado', lev.estado || '-');
  addCampo('Cliente', lev.cliente_nombre || '-');
  addCampo('Ubicación', lev.ubicacion || '-');
  addCampo('Fecha', lev.created_at ? new Date(lev.created_at).toLocaleDateString('es-HN') : '-');
  ws.addRow([]);

  const datos = lev.datos || {};
  const usados = new Set();
  const SECTIONS = seccionesDe(lev.tipo_banda);

  SECTIONS.forEach(({ title, fields }) => {
    const filas = fields.filter(k => tieneValor(datos[k]));
    if (filas.length === 0) return;
    addSeccion(title);
    filas.forEach(k => {
      usados.add(k);
      addCampo(labelFor(lev.tipo_banda, k), formatValor(datos[k]));
    });
    ws.addRow([]);
  });

  const restoKeys = Object.keys(datos).filter(k => !usados.has(k) && k !== 'subtipo' && tieneValor(datos[k]));
  if (restoKeys.length > 0) {
    addSeccion('Otros Datos');
    restoKeys.forEach(k => addCampo(labelFor(lev.tipo_banda, k), formatValor(datos[k])));
    ws.addRow([]);
  }

  if (lev.firma_tecnico || lev.firma_cliente) {
    addSeccion('Firmas');
    ws.addRow([]);

    if (lev.firma_tecnico) {
      const labelRow = ws.addRow(['Firma Técnico']);
      labelRow.getCell(1).font = { bold: true };
      try {
        const imgId = wb.addImage({ base64: lev.firma_tecnico, extension: extraerExtension(lev.firma_tecnico) });
        ws.addImage(imgId, {
          tl: { col: 0, row: ws.lastRow.number },
          ext: { width: 200, height: 100 }
        });
      } catch (e) { /* ignore */ }
      for (let i = 0; i < 6; i++) ws.addRow([]);
    }

    if (lev.firma_cliente) {
      const labelRow = ws.addRow(['Firma Cliente']);
      labelRow.getCell(1).font = { bold: true };
      try {
        const imgId = wb.addImage({ base64: lev.firma_cliente, extension: extraerExtension(lev.firma_cliente) });
        ws.addImage(imgId, {
          tl: { col: 0, row: ws.lastRow.number },
          ext: { width: 200, height: 100 }
        });
      } catch (e) { /* ignore */ }
      for (let i = 0; i < 6; i++) ws.addRow([]);
    }
  }

  if (Array.isArray(lev.fotos) && lev.fotos.length > 0) {
    addSeccion(`Fotos (${lev.fotos.length})`);
    ws.addRow([]);
    lev.fotos.forEach((foto, idx) => {
      const labelRow = ws.addRow([`Foto ${idx + 1}`]);
      labelRow.getCell(1).font = { bold: true };
      try {
        const imgId = wb.addImage({ base64: foto, extension: extraerExtension(foto) });
        ws.addImage(imgId, {
          tl: { col: 0, row: ws.lastRow.number },
          ext: { width: 240, height: 180 }
        });
      } catch (e) { /* ignore */ }
      for (let i = 0; i < 11; i++) ws.addRow([]);
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  descargarBuffer(
    buffer,
    `Levantamiento_${lev.folio || lev.id}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

export function exportDetailToPDF(lev) {
  const doc = new jsPDF();
  let y = 16;

  doc.setFontSize(15);
  doc.setTextColor(13, 76, 146);
  doc.text('PROVAC - Levantamiento Técnico', 14, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Folio: ${lev.folio || '-'}    Tipo: ${TIPO_LABELS[lev.tipo_banda] || lev.tipo_banda}    Estado: ${lev.estado}`, 14, y);
  y += 5;
  doc.text(`Cliente: ${lev.cliente_nombre || '-'}    Ubicación: ${lev.ubicacion || '-'}`, 14, y);
  y += 5;
  doc.text(`Fecha: ${lev.created_at ? new Date(lev.created_at).toLocaleDateString('es-HN') : '-'}`, 14, y);
  y += 6;

  const datos = lev.datos || {};
  const usados = new Set();
  const pageHeight = doc.internal.pageSize.getHeight();
  const SECTIONS = seccionesDe(lev.tipo_banda);

  const dibujarSeccion = (titulo, rows) => {
    if (rows.length === 0) return;

    if (y > pageHeight - 30) {
      doc.addPage();
      y = 16;
    }

    doc.setFontSize(11);
    doc.setTextColor(13, 76, 146);
    doc.text(titulo, 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Campo', 'Valor']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [13, 76, 146] },
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 8;
  };

  SECTIONS.forEach(({ title, fields }) => {
    const rows = fields
      .filter(k => tieneValor(datos[k]))
      .map(k => {
        usados.add(k);
        return [labelFor(lev.tipo_banda, k), formatValor(datos[k])];
      });
    dibujarSeccion(title, rows);
  });

  const restoRows = Object.entries(datos)
    .filter(([k, v]) => !usados.has(k) && k !== 'subtipo' && tieneValor(v))
    .map(([k, v]) => [labelFor(lev.tipo_banda, k), formatValor(v)]);
  dibujarSeccion('Otros Datos', restoRows);

  if (y > pageHeight - 50) {
    doc.addPage();
    y = 20;
  }

  if (lev.firma_tecnico || lev.firma_cliente) {
    doc.setFontSize(11);
    doc.setTextColor(13, 76, 146);
    doc.text('Firmas', 14, y);
    y += 6;
  }

  if (lev.firma_tecnico) {
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text('Firma Técnico:', 14, y);
    try { doc.addImage(lev.firma_tecnico, extraerExtension(lev.firma_tecnico).toUpperCase(), 14, y + 3, 55, 28); } catch (e) { /* ignore */ }
  }
  if (lev.firma_cliente) {
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text('Firma Cliente:', 85, y);
    try { doc.addImage(lev.firma_cliente, extraerExtension(lev.firma_cliente).toUpperCase(), 85, y + 3, 55, 28); } catch (e) { /* ignore */ }
  }
  if (lev.firma_tecnico || lev.firma_cliente) {
    y += 36;
  }

  // Fotos — cuadrícula de 3 columnas, con salto de página automático.
  if (Array.isArray(lev.fotos) && lev.fotos.length > 0) {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 16;
    }
    doc.setFontSize(11);
    doc.setTextColor(13, 76, 146);
    doc.text(`Fotos (${lev.fotos.length})`, 14, y);
    y += 6;

    const imgW = 58;
    const imgH = 44;
    const gap = 4;
    const cols = 3;
    let col = 0;

    lev.fotos.forEach((foto) => {
      if (y + imgH > pageHeight - 12) {
        doc.addPage();
        y = 16;
        col = 0;
      }
      const x = 14 + col * (imgW + gap);
      try {
        doc.addImage(foto, extraerExtension(foto).toUpperCase(), x, y, imgW, imgH);
      } catch (e) { /* ignore */ }

      col++;
      if (col >= cols) {
        col = 0;
        y += imgH + gap;
      }
    });
  }

  doc.save(`Levantamiento_${lev.folio || lev.id}.pdf`);
}
