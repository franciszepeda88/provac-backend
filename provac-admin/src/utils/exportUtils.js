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
      fields: ['industria', 'producto_transportador', 'carga_kgm', 'velocidad_mmin', 'inclinacion', 'temperatura_operacion', 'horas_dia', 'turnos_dia', 'ambiente', 'contacto_producto']
    },
    {
      title: 'Especificaciones de Banda',
      fields: ['marca_linea', 'referencia_actual', 'material_base', 'num_capas', 'espesor_total', 'color', 'dureza_shore', 'cubierta_superior', 'cubierta_inferior']
    },
    {
      title: 'Dimensiones',
      fields: ['ancho_banda', 'espesor_total_dim', 'largo_circuito_cerrado', 'distancia_centros', 'largo_abierto', 'ancho_util', 'ancho_libre']
    },
    {
      title: 'Accesorios & Empalme',
      fields: ['tipo_empalme', 'metodo_union', 'largo_empalme', 'angulo_empalme', 'ubicacion_empalme', 'guia_tracking', 'posicion_guia', 'tacos', 'alto_tacos', 'paso_tacos']
    },
    { title: 'Firmas y Conformidad', fields: CAMPOS_FIRMAS }
  ],
  transmision: [
    { title: 'Datos del Cliente', fields: CAMPOS_CLIENTE },
    {
      title: 'Aplicación & Condiciones',
      fields: ['maquina_impulsada', 'potencia_motor', 'rpm_motor', 'rpm_conducida', 'relacion_transmision', 'horas_operacion_dia', 'temp_trabajo', 'arranques_dia', 'tipo_carga', 'ambiente_contacto', 'motivo_cambio']
    },
    {
      title: 'Especificación de Banda',
      fields: ['linea_habasit', 'codigo_articulo', 'referencia_actual', 'marca_actual', 'construccion', 'material_nucleo', 'superficie_traccion', 'superficie_carga', 'color', 'dureza_shore', 'espesor_total', 'traccion_rigidez', 'certificaciones']
    },
    {
      title: 'Dimensiones de la Banda',
      fields: ['ancho_banda', 'largo_total_perimetro', 'distancia_centros', 'largo_abierto_tensor', 'espesor_total_dim', 'tolerancia_largo', 'cantidad_bandas', 'unidades_juego']
    },
    {
      title: 'Empalme',
      fields: ['tipo_empalme', 'metodo_union', 'largo_empalme', 'angulo_empalme', 'num_dedos_escalones', 'ubicacion_empalme', 'empalme_a_realizar', 'lugar_empalme']
    },
    {
      title: 'Poleas, Ejes y Montaje',
      fields: ['poleas', 'angulo_contacto_motriz', 'montaje_orientacion', 'rango_ajuste_tensor', 'tipo_polea', 'sistema_tensado', 'estado_poleas']
    },
    {
      title: 'Estado del Equipo',
      fields: ['dano_banda_actual', 'acceso_instalar', 'instalacion_entrega', 'evidencia_recopilada', 'fecha_requerida_entrega', 'num_fotos_tomadas']
    },
    { title: 'Observaciones', fields: ['observaciones'] },
    { title: 'Firmas y Conformidad', fields: CAMPOS_FIRMAS }
  ],
  modular: [
    { title: 'Datos del Cliente', fields: CAMPOS_CLIENTE },
    {
      title: 'Banda y Catarina (Sprocket)',
      fields: ['serie_intralox', 'estilo', 'material', 'ancho_banda', 'largo_centro_centro', 'color', 'espesor', 'placas_transferencia', 'empujadores', 'altura_empujador', 'espaciado_empujadores', 'guardas_laterales', 'altura_guarda_lateral', 'ancho_cara_catarina', 'diametro_paso_catarina', 'barreno_diametro_interior', 'material_eje', 'material_eje_otro', 'diametro_cubo_buje', 'no_dientes_catarina']
    },
    {
      title: 'Producto Transportado',
      fields: ['tipo_producto', 'caracteristicas_producto', 'requisitos_regulatorios', 'descripcion_producto', 'ancho_producto', 'largo_producto', 'alto_producto', 'espaciado_productos', 'carga_total', 'carga_individual', 'temp_producto', 'velocidad_banda', 'metodo_carga']
    },
    {
      title: 'Datos de Aplicación',
      fields: ['temp_operacion_motriz', 'ubicacion_motriz', 'construccion_retorno', 'condiciones_retorno', 'material_retorno', 'rodillo_snub', 'material_rodillo_snub', 'acumulacion_producto', 'pct_acumulacion', 'arranques_paros_frecuentes', 'cambio_elevacion', 'medida_inclinacion']
    },
    {
      title: 'Configuración del Sistema (Curvas)',
      fields: ['material_riel_curvo', 'barra_frontal', 'material_barra_frontal', 'numero_curvas', 'longitud_tramo_recto_final', 'acumulacion_tramo_final', 'cambio_elevacion_tramo_final', 'curvas']
    },
    {
      title: 'Limpieza / Saneamiento',
      fields: ['metodo_limpieza', 'frecuencia_limpieza', 'quimicos_limpieza', 'concentracion_quimica', 'temp_medio_limpieza', 'tiempo_exposicion']
    },
    { title: 'Observaciones y Anexos', fields: ['observaciones', 'documentacion_adjunta'] },
    { title: 'Firmas y Conformidad', fields: CAMPOS_FIRMAS }
  ],
  thermodrive: [
    { title: 'Datos del Cliente', fields: CAMPOS_CLIENTE },
    {
      title: 'Tipo de Proceso / Equipo',
      fields: ['tipo_proceso', 'tipo_proceso_otro', 'fuente_calor', 'marca_modelo_horno', 'temp_max_operacion', 'temp_prom_operacion', 'tiempo_residencia', 'zonas_temperatura']
    },
    {
      title: 'Especificación de Banda',
      fields: ['estilo_superficie', 'estilo_superficie_otro', 'color_material_superficial', 'color_material_otro', 'ancho_banda', 'largo_centro_centro', 'espesor_total', 'paso_banda', 'certificaciones']
    },
    {
      title: 'Catarina / Rueda y Eje',
      fields: ['diametro_paso_catarina', 'no_dientes', 'barreno_diametro_interior', 'ancho_cara_catarina', 'material_catarina', 'material_catarina_otro', 'material_eje', 'material_eje_otro', 'diametro_eje', 'largo_eje_libre']
    },
    {
      title: 'Producto Transportado',
      fields: ['descripcion_producto', 'ancho_producto', 'largo_producto', 'alto_producto', 'espaciado_productos', 'carga_total', 'carga_individual', 'velocidad_banda', 'produccion_requerida', 'caracteristicas_producto', 'caracteristicas_producto_otro']
    },
    {
      title: 'Configuración del Sistema',
      fields: ['configuracion_recorrido', 'angulo_inclinacion', 'ubicacion_motriz', 'guardas_laterales', 'guardas_laterales_otro', 'altura_sidewall', 'espaciado_tacos', 'sistema_retorno', 'sistema_retorno_otro', 'tensado', 'tensado_otro']
    },
    {
      title: 'Limpieza / Saneamiento',
      fields: ['metodo_limpieza', 'frecuencia_limpieza', 'quimicos_limpieza', 'concentracion_quimica', 'temp_medio_limpieza', 'tiempo_exposicion']
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

  const headers = [...baseCols, ...datosKeys.map(humanize)];
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
      addCampo(humanize(k), formatValor(datos[k]));
    });
    ws.addRow([]);
  });

  const restoKeys = Object.keys(datos).filter(k => !usados.has(k) && k !== 'subtipo' && tieneValor(datos[k]));
  if (restoKeys.length > 0) {
    addSeccion('Otros Datos');
    restoKeys.forEach(k => addCampo(humanize(k), formatValor(datos[k])));
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
        return [humanize(k), formatValor(datos[k])];
      });
    dibujarSeccion(title, rows);
  });

  const restoRows = Object.entries(datos)
    .filter(([k, v]) => !usados.has(k) && k !== 'subtipo' && tieneValor(v))
    .map(([k, v]) => [humanize(k), formatValor(v)]);
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
    try { doc.addImage(lev.firma_tecnico, 'PNG', 14, y + 3, 55, 28); } catch (e) { /* ignore */ }
  }
  if (lev.firma_cliente) {
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text('Firma Cliente:', 85, y);
    try { doc.addImage(lev.firma_cliente, 'PNG', 85, y + 3, 55, 28); } catch (e) { /* ignore */ }
  }

  doc.save(`Levantamiento_${lev.folio || lev.id}.pdf`);
}
