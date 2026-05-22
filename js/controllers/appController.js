import { EstadisticaModel } from '../models/estadisticaModel.js';
import { UIView } from '../views/uiView.js';
import { parseData, mean, stdDev, variance } from '../utils/helpers.js';
import { ExcelService } from '../utils/excelService.js';

const MODULES_NO_DATA = [
    'muestreo_simple', 'muestreo_sistematico',
    'muestreo_estratificado', 'muestreo_conglomerados',
    'var_discreta', 'var_continua'
];

export const AppController = {
    excelData: null, // Guardar datos actuales del archivo
    bookLibrary: [], // Biblioteca de libros analizados
    currentColumnName: 'Valores', // Nombre de la columna seleccionada
    currentBayesWords: [],
    selectedBayesWord: null,

    init() {
        UIView.init();
        this.bindEvents();
        this.inicializarAgrupadorParalelo();

        const moduleSelect = document.getElementById('moduleSelect');
        if (moduleSelect) {
            window.addEventListener('themeChanged', () => {
                if (moduleSelect.value) this.calcular();
            });
        }
    },

    bindEvents() {
        const on = (id, evt, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(evt, fn);
        };

        // Unidad 1 (solo si existen en esta página)
        on('moduleSelect', 'change', this.handleModuleChange.bind(this));
        on('btnCalcular', 'click', this.calcular.bind(this));
        on('btnLimpiar', 'click', this.limpiar.bind(this));
        on('btnImportarExcel', 'click', () => document.getElementById('excelInput')?.click());
        on('excelInput', 'change', this.handleImportExcel.bind(this));
        on('btnVerExcel', 'click', this.abrirModalExcel.bind(this));
        on('btnCloseModal', 'click', this.cerrarModalExcel.bind(this));
        on('btnCloseModalFooter', 'click', this.cerrarModalExcel.bind(this));
        on('closeModalBg', 'click', this.cerrarModalExcel.bind(this));
        on('btnAbrirReporte', 'click', this.abrirModalReporte.bind(this));
        on('btnCloseReporte', 'click', this.cerrarModalReporte.bind(this));
        on('btnCancelReport', 'click', this.cerrarModalReporte.bind(this));
        on('closeModalReporteBg', 'click', this.cerrarModalReporte.bind(this));
        on('reportSampleType', 'change', this.actualizarCamposMuestreo.bind(this));
        on('btnExportExcel', 'click', this.iniciarExportacion.bind(this));
        on('btnGenerarPreview', 'click', this.generarPreview.bind(this));

        // Unidad 3: Contador de palabras, Bayes, biblioteca
        on('btnEscanearLibro', 'click', this.escanearLibro.bind(this));
        on('btnAgregarBiblioteca', 'click', this.agregarALaBiblioteca.bind(this));
        on('btnLimpiarLibro', 'click', this.limpiarLibro.bind(this));
        on('btnCalcularBayes', 'click', this.calcularBayes.bind(this));
        on('btnCommonWords', 'click', this.buscarPalabrasEnComun.bind(this));
        on('btnImportarTexto', 'click', () => document.getElementById('textFileInput')?.click());
        on('textFileInput', 'change', this.handleImportTexto.bind(this));
        on('btnExportTreeExcel', 'click', this.exportarArbolExcel.bind(this));
        on('btnCloseFragmentModal', 'click', this.cerrarModalFragmento.bind(this));
        on('btnCloseFragmentModalFooter', 'click', this.cerrarModalFragmento.bind(this));
        on('closeFragmentModalBg', 'click', this.cerrarModalFragmento.bind(this));

        // Evento para abrir el modal del agrupador paralelo (Target)
        const btnToggleParallel = document.getElementById('btnToggleParallel');
        if (btnToggleParallel) {
            btnToggleParallel.addEventListener('click', () => {
                const modal = document.getElementById('parallelLibraryModal');
                if (modal) {
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                    document.body.classList.add('overflow-hidden');
                    this.renderizarAgrupadorParalelo();
                }
            });
        }

        // Eventos para cerrar el modal del agrupador paralelo
        const cerrarParallelModal = () => {
            const modal = document.getElementById('parallelLibraryModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.classList.remove('overflow-hidden');
            }
        };

        const btnCloseParallel = document.getElementById('btnCloseParallelModal');
        if (btnCloseParallel) btnCloseParallel.addEventListener('click', cerrarParallelModal);

        const closeParallelBg = document.getElementById('closeParallelModalBg');
        if (closeParallelBg) closeParallelBg.addEventListener('click', cerrarParallelModal);

        // Eventos para cerrar el visualizador de PDF
        const cerrarPdfModal = () => {
            this.cerrarVisualizadorPDF();
        };
        const btnClosePdf = document.getElementById('btnClosePdfModal');
        if (btnClosePdf) btnClosePdf.addEventListener('click', cerrarPdfModal);

        const closePdfBg = document.getElementById('closePdfModalBg');
        if (closePdfBg) closePdfBg.addEventListener('click', cerrarPdfModal);
        
        // Selector 'Seleccionar Todos'
        const selectAll = document.getElementById('selectAllModules');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checked = e.target.checked;
                document.querySelectorAll('.module-check').forEach(cb => cb.checked = checked);
            });
        }

        // Eventos para Navegación de Unidades
        document.querySelectorAll('.unit-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleUnitChange(e));
        });
    },

    handleUnitChange(e) {
        const btn = e.currentTarget;
        const unit = btn.getAttribute('data-unit');

        document.querySelectorAll('.unit-tab').forEach((t) => {
            t.classList.toggle('is-active', t === btn);
            t.classList.remove('active', 'opacity-60');
        });

        const v1 = document.getElementById('view-unidad-1');
        const v3 = document.getElementById('view-unidad-3');
        const sidebar = document.querySelector('.sidebar');
        if (v1) v1.classList.toggle('hidden', unit !== '1');
        if (v3) v3.classList.toggle('hidden', unit !== '3');
        if (sidebar) sidebar.classList.toggle('hidden', unit !== '1');

        document.querySelectorAll('.unit-view').forEach((v) => v.classList.add('hidden'));
        const target = document.getElementById(`view-unidad-${unit}`);
        if (target) target.classList.remove('hidden');

        const excelCol = document.getElementById('excelColumnSelector');
        if (excelCol && unit !== '1') excelCol.classList.add('hidden');
    },

    async handleImportExcel(e) {
        const file = e.target.files[0];
        if (!file) return;

        UIView.ocultarError();
        try {
            const result = await ExcelService.parseExcel(file);
            this.excelData = result; // Guardamos columnas y rawData
            UIView.renderizarSelectorColumnas(result.columns, this.handleColumnSelection.bind(this));
        } catch (err) {
            UIView.mostrarError(err.message);
        }
    },

    abrirModalExcel() {
        if (!this.excelData) return;
        UIView.renderizarTablaExcel(this.excelData.rawData, this.excelData.columns, this.handleColumnSelection.bind(this));
        document.getElementById('modalExcel').classList.remove('hidden');
        document.body.classList.add('overflow-hidden'); // Evitar scroll en fondo
    },

    cerrarModalExcel() {
        document.getElementById('modalExcel').classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    },

    abrirModalReporte() {
        document.getElementById('modalReporte').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    },

    cerrarModalReporte() {
        document.getElementById('modalReporte').classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PRE-VISUALIZACIÓN
    // ─────────────────────────────────────────────────────────────────────────
    async generarPreview() {
        const dataStr = document.getElementById('dataInput').value;
        const data = parseData(dataStr);

        if (data.length === 0) {
            this.mostrarNotificacion('Ingresa datos válidos antes de previsualizar.', 'error');
            return;
        }

        // Mostrar loading
        const btnPreview = document.getElementById('btnGenerarPreview');
        const loading = document.getElementById('previewLoading');
        const container = document.getElementById('previewContainer');
        const empty = document.getElementById('previewEmpty');

        btnPreview.disabled = true;
        btnPreview.innerHTML = '<span class="text-sm">⏳</span> Calculando...';
        if (loading) loading.classList.remove('hidden');

        // Pequeño delay para mostrar el spinner
        await new Promise(r => setTimeout(r, 80));

        try {
            const sampleType = document.getElementById('reportSampleType').value;
            const paramValue = parseInt(document.getElementById('reportParamValue').value) || 5;

            const modules = {
                variables:       document.querySelector('[data-module="variables"]').checked,
                tendencia:       document.querySelector('[data-module="tendencia"]').checked,
                dispersion:      document.querySelector('[data-module="dispersion"]').checked,
                posicion:        document.querySelector('[data-module="posicion"]').checked,
                forma:           document.querySelector('[data-module="forma"]').checked,
                medias_especiales: document.querySelector('[data-module="medias_especiales"]').checked,
                frecuencias:     document.querySelector('[data-module="frecuencias"]').checked
            };

            // Aplicar muestreo si corresponde
            let dataToProcess = [...data];
            if (sampleType !== 'none') {
                const s = this.aplicarMuestreoBatch(data, sampleType, paramValue);
                dataToProcess = s.sample;
            }

            // Construir filas de la vista previa — cada sección con sus valores clave
            const sections = [];

            // === DATOS ===
            sections.push({
                title: '1. Datos de Entrada',
                color: 'section',
                rows: [
                    ['#', 'Valor'],
                    ...dataToProcess.slice(0, 12).map((v, i) => [i + 1, v]),
                    ...(dataToProcess.length > 12 ? [['...', `(${dataToProcess.length - 12} más)`]] : [])
                ]
            });

            // === TIPO DE VARIABLE ===
            if (modules.variables) {
                try {
                    const isContinuous = dataToProcess.some(d => !Number.isInteger(d));
                    sections.push({
                        title: '2. Tipo de Variable',
                        color: 'section',
                        rows: [
                            ['Identificación', 'Regla', 'Clasificación'],
                            [isContinuous ? 'Variable Continua' : 'Variable Discreta',
                             isContinuous ? 'Contiene decimales' : 'Solo enteros (Conteo)',
                             isContinuous ? 'Continua ✓' : 'Discreta ✓']
                        ]
                    });
                } catch (e) { /* skip */ }
            }

            // === TENDENCIA CENTRAL ===
            if (modules.tendencia) {
                try {
                    const m  = EstadisticaModel.calcMedia(dataToProcess);
                    const me = EstadisticaModel.calcMediana(dataToProcess);
                    const mo = EstadisticaModel.calcModa(dataToProcess);
                    sections.push({
                        title: '3. Tendencia Central',
                        color: 'section',
                        rows: [
                            ['Medida', 'Fórmula', 'Valor'],
                            ['Media (ẋ̄)', 'Σx / n', m.resultado],
                            ['Mediana (Me)', 'Pos (n+1)/2', me.resultado],
                            ['Moda (Mo)', 'Frec Máx', mo.resultado],
                            ['Cantidad (n)', '', dataToProcess.length]
                        ]
                    });
                } catch (e) { /* skip */ }
            }

            // === DISPERSIÓN ===
            if (modules.dispersion) {
                try {
                    const v  = EstadisticaModel.calcVarianza(dataToProcess);
                    const r  = EstadisticaModel.calcRango(dataToProcess);
                    const varVal  = parseFloat(String(v.resultado).replace(',', '.'));
                    const medVal  = parseFloat(String(v.resultadosIntermedios.media).replace(',', '.'));
                    const sd = EstadisticaModel.calcDesvStd(varVal, medVal);
                    const cv = EstadisticaModel.calcCoefVar(medVal, parseFloat(String(sd.resultado).replace(',', '.')));
                    sections.push({
                        title: '4. Dispersión',
                        color: 'section',
                        rows: [
                            ['Medida', 'Fórmula', 'Valor'],
                            ['Rango',            'Max - Min',         r.resultado],
                            ['Varianza (σ²)',     'Σ(x-ẋ̄)² / n',      v.resultado],
                            ['Desv. Estándar (σ)', '√σ²',              sd.resultado],
                            ['Coef. Variación', '(σ/ẋ̄)*100',          cv.resultado],
                            ['Mínimo',          '',                  r.min],
                            ['Máximo',          '',                  r.max]
                        ]
                    });
                } catch (e) { /* skip */ }
            }

            // === MEDIAS ESPECIALES ===
            if (modules.medias_especiales) {
                try {
                    const g = EstadisticaModel.calcMediaGeometrica(dataToProcess);
                    const h = EstadisticaModel.calcMediaArmonica(dataToProcess);
                    sections.push({
                        title: '5. Medias Especiales',
                        color: 'section',
                        rows: [
                            ['Medida', 'Fórmula', 'Valor'],
                            ['Media Geométrica', 'exp(Σln(xᵢ)/n)', g.resultado],
                            ['Media Armónica',   'n / Σ(1/xᵢ)',     h.resultado]
                        ]
                    });
                } catch (e) { /* skip */ }
            }

            // === POSICIÓN ===
            if (modules.posicion) {
                try {
                    const q = EstadisticaModel.calcCuartiles(dataToProcess);
                    const d = EstadisticaModel.calcDeciles(dataToProcess);
                    sections.push({
                        title: '6. Medidas de Posición',
                        color: 'section',
                        rows: [
                            ['Medida', 'Fórmula', 'Valor'],
                            ['Q1 (25%)', 'i(n+1)/4', q.q1Val || 'N/A'],
                            ['Q2 (50%)', 'i(n+1)/4', q.q2Val || 'N/A'],
                            ['Q3 (75%)', 'i(n+1)/4', q.q3Val || 'N/A'],
                            ['', '', ''],
                            ['Decil', 'Pos.', 'Valor'],
                            ...(d.tablas[0].filas || []).slice(0, 5).map(row => [row[0], row[2], row[3]]),
                            ...(d.tablas[0].filas.length > 5 ? [['...', '', '(ver Excel completo)']] : [])
                        ]
                    });
                } catch (e) { /* skip */ }
            }

            // === FRECUENCIAS ===
            if (modules.frecuencias) {
                try {
                    const fa = EstadisticaModel.calcFrecuenciasAgrupadas(dataToProcess);
                    sections.push({
                        title: '7. Distribución de Frecuencias',
                        color: 'section',
                        rows: [
                            ['Clase', 'L. Inf', 'L. Sup', 'fi', 'fri', 'FI'],
                            ...(fa.filas || []).slice(0, 8).map(row => [row[0], row[1], row[2], row[3], row[5], row[6]]),
                            ...(fa.filas.length > 8 ? [['...', '', '', '', '', '']] : [])
                        ]
                    });
                } catch (e) { /* skip */ }
            }

            // === FORMA ===
            if (modules.forma) {
                try {
                    const as = EstadisticaModel.calcAsimetria(dataToProcess);
                    const ku = EstadisticaModel.calcCurtosis(dataToProcess);
                    sections.push({
                        title: '8. Medidas de Forma',
                        color: 'section',
                        rows: [
                            ['Medida', 'Valor', 'Tipo'],
                            ['Asimetría (g₁)', as.resultado, as.resultadoLabel || ''],
                            ['Curtosis (K)',    ku.resultado, ku.resultadoLabel || '']
                        ]
                    });
                } catch (e) { /* skip */ }
            }

            // Renderizar la tabla
            this.renderPreviewTable(sections, dataToProcess.length);

            // Mostrar contenedor
            container.classList.remove('hidden');
            empty.classList.add('hidden');

        } catch (err) {
            console.error('Error generando preview:', err);
            this.mostrarNotificacion('Error al generar la vista previa: ' + err.message, 'error');
        } finally {
            if (loading) loading.classList.add('hidden');
            btnPreview.disabled = false;
            btnPreview.innerHTML = '<span class="text-sm">👁️</span> Actualizar Vista Previa';
        }
    },

    renderPreviewTable(sections, totalRows) {
        const thead = document.getElementById('previewTableHead');
        const tbody = document.getElementById('previewTableBody');
        const rowCountEl = document.getElementById('previewRowCount');
        const colCountEl = document.getElementById('previewColCount');

        thead.innerHTML = '';
        tbody.innerHTML = '';

        // Calcular cuantas columnas tiene la sección más ancha
        let maxCols = 0;
        let totalTableRows = 0;
        sections.forEach(s => {
            s.rows.forEach(r => { if (r.length > maxCols) maxCols = r.length; });
            totalTableRows += s.rows.length + 1; // +1 para el título de sección
        });

        // Encabezado fijo con números de columnas
        const headerRow = document.createElement('tr');
        // Primera celda: número de fila
        const thRowNum = document.createElement('th');
        thRowNum.className = 'excel-row-header sticky left-0';
        thRowNum.textContent = '';
        headerRow.appendChild(thRowNum);
        for (let c = 0; c < maxCols; c++) {
            const th = document.createElement('th');
            th.className = 'excel-col-header';
            th.textContent = String.fromCharCode(65 + c); // A, B, C...
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);

        // Cuerpo
        let globalRow = 1;
        sections.forEach(section => {
            // Fila de título de sección
            const titleTr = document.createElement('tr');
            const tdNum = document.createElement('td');
            tdNum.className = 'excel-row-header sticky left-0';
            tdNum.textContent = globalRow++;
            titleTr.appendChild(tdNum);

            const tdTitle = document.createElement('td');
            tdTitle.colSpan = maxCols;
            tdTitle.className = 'excel-section-header';
            tdTitle.textContent = section.title;
            titleTr.appendChild(tdTitle);
            tbody.appendChild(titleTr);

            // Filas de datos
            section.rows.forEach((row, rowIdx) => {
                const tr = document.createElement('tr');
                const tdRowNum = document.createElement('td');
                tdRowNum.className = 'excel-row-header sticky left-0';
                tdRowNum.textContent = globalRow++;
                tr.appendChild(tdRowNum);

                // Detectar si es encabezado de columnas (primera fila del grupo)
                const isColHeader = rowIdx === 0;

                for (let c = 0; c < maxCols; c++) {
                    const td = document.createElement('td');
                    const val = row[c] !== undefined ? row[c] : '';
                    td.textContent = val === '' ? '' : String(val);

                    if (isColHeader) {
                        td.className = 'excel-col-label';
                    } else if (val !== '' && c === 0 && maxCols > 1) {
                        td.className = 'excel-label-cell';
                    } else if (val !== '' && typeof val === 'number') {
                        td.className = 'excel-value-cell';
                    } else {
                        td.className = 'excel-data-cell';
                    }
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
            });
        });

        rowCountEl.textContent = totalRows;
        colCountEl.textContent = maxCols;
    },

    actualizarCamposMuestreo(e) {
        const type = e.target.value;
        const container = document.getElementById('reportSampleParams');
        const label = document.getElementById('reportParamLabel');
        
        if (type === 'none') {
            container.classList.add('hidden');
        } else {
            container.classList.remove('hidden');
            if (type === 'sistematico') {
                label.innerText = 'Intervalo (k)';
            } else {
                label.innerText = 'Tamaño (n)';
            }
        }
    },

    async iniciarExportacion() {
        const dataStr = document.getElementById('dataInput').value;
        let data = parseData(dataStr);
        
        if (data.length === 0) {
            UIView.mostrarError('Ingresa datos válidos antes de exportar.');
            return;
        }

        const sampleType = document.getElementById('reportSampleType').value;
        const paramValue = parseInt(document.getElementById('reportParamValue').value);
        
        // Checklist de módulos
        const modules = {
            variables: document.querySelector('[data-module="variables"]').checked,
            tendencia: document.querySelector('[data-module="tendencia"]').checked,
            dispersion: document.querySelector('[data-module="dispersion"]').checked,
            posicion: document.querySelector('[data-module="posicion"]').checked,
            forma: document.querySelector('[data-module="forma"]').checked,
            frecuencias: document.querySelector('[data-module="frecuencias"]').checked
        };

        // Verificar que al menos un módulo esté seleccionado
        const alMenosUno = Object.values(modules).some(v => v);
        if (!alMenosUno) {
            UIView.mostrarError('Selecciona al menos un módulo para exportar.');
            return;
        }

        // 1. Aplicar Muestreo si se requiere
        let dataToProcess = [...data];
        let samplingInfo = null;

        if (sampleType !== 'none') {
            const samplingResult = this.aplicarMuestreoBatch(data, sampleType, paramValue);
            dataToProcess = samplingResult.sample;
            samplingInfo = samplingResult.info;
        }

        // 2. Ejecución Batch — cada módulo en su propio try-catch
        const reportResults = {};
        const procedures = [];
        const errores = [];
        
        // Helper para extraer pasos de forma segura
        const getSteps = (res) => {
            if (!res) return [];
            if (Array.isArray(res.pasos)) return res.pasos;
            if (res.detallado && Array.isArray(res.detallado.pasos)) return res.detallado.pasos;
            return [];
        };

        if (modules.variables) {
            try {
                const disc = EstadisticaModel.calcVarDiscreta(dataToProcess);
                const cont = EstadisticaModel.calcVarContinua(dataToProcess);
                const isContinuous = dataToProcess.some(d => !Number.isInteger(d));
                
                reportResults.tipoVariable = {
                    nombre: isContinuous ? "Variable Continua" : "Variable Discreta",
                    regla: isContinuous ? "Contiene decimales (Medición)" : "Sólo números enteros (Conteo)",
                    valor: isContinuous ? "Continua ✓" : "Discreta ✓"
                };
                procedures.push({ module: 'Tipo de Variable', steps: [...disc.pasos, ...cont.pasos] });
            } catch (e) { errores.push('Variables: ' + e.message); }
        }

        if (modules.tendencia) {
            try {
                const m = EstadisticaModel.calcMedia(dataToProcess);
                const me = EstadisticaModel.calcMediana(dataToProcess);
                const mo = EstadisticaModel.calcModa(dataToProcess);
                
                reportResults.tendencia = {
                    media: m.resultado,
                    mediana: me.resultado,
                    moda: mo.resultado,
                    n: dataToProcess.length
                };
                procedures.push({ module: 'Tendencia Central', steps: [...getSteps(m), ...getSteps(me), ...getSteps(mo)] });
            } catch (e) { errores.push('Tendencia: ' + e.message); }
        }

        if (modules.dispersion) {
            try {
                const v = EstadisticaModel.calcVarianza(dataToProcess);
                const r = EstadisticaModel.calcRango(dataToProcess);
                const varVal = parseFloat(String(v.resultado).replace(',', '.'));
                const mediaVal = parseFloat(String(v.resultadosIntermedios.media).replace(',', '.'));
                
                const sd = EstadisticaModel.calcDesvStd(varVal, mediaVal);
                const cv = EstadisticaModel.calcCoefVar(mediaVal, parseFloat(String(sd.resultado).replace(',', '.')));
                
                reportResults.dispersion = {
                    varianza: v.resultado,
                    desviacion: sd.resultado,
                    cv: cv.resultado,
                    rango: r.resultado,
                    min: r.min,
                    max: r.max,
                    tablaVarianza: v.detallado.tablas[0].filas
                };
                const steps = [...getSteps(r), ...getSteps(v), ...getSteps(sd), ...getSteps(cv)];
                procedures.push({ module: 'Medidas de Dispersión', steps });
            } catch (e) { errores.push('Dispersión: ' + e.message); }
        }

        if (modules.posicion) {
            try {
                const q = EstadisticaModel.calcCuartiles(dataToProcess);
                const p = EstadisticaModel.calcPercentiles(dataToProcess);
                const d = EstadisticaModel.calcDeciles(dataToProcess);
                
                reportResults.posicion = {
                    q1: q.q1Val || 'N/A',
                    q2: q.q2Val || 'N/A',
                    q3: q.q3Val || 'N/A',
                    p50: p.resultado,
                    fullPercentiles: p.tablas[0].filas,
                    fullDeciles: d.tablas[0].filas
                };
                procedures.push({ module: 'Medidas de Posición', steps: [...getSteps(q), ...getSteps(p).slice(0, 5), '... (Ver tabla completa en hoja Percentiles)'] });
            } catch (e) { errores.push('Posición: ' + e.message); }
        }

        if (modules.forma) {
            try {
                const as = EstadisticaModel.calcAsimetria(dataToProcess);
                const ku = EstadisticaModel.calcCurtosis(dataToProcess);
                
                reportResults.forma = {
                    sesgo: as.resultado,
                    curtosis: ku.resultado,
                    tipoAs: as.resultadoLabel,
                    tipoKu: ku.resultadoLabel,
                    kuObj: ku,
                    asObj: as
                };
                procedures.push({ module: 'Medidas de Forma', steps: [...getSteps(as), ...getSteps(ku)] });
            } catch (e) { errores.push('Forma: ' + e.message); }
        }

        if (modules.medias_especiales) {
            try {
                const g = EstadisticaModel.calcMediaGeometrica(dataToProcess);
                const h = EstadisticaModel.calcMediaArmonica(dataToProcess);
                const seriesMM = EstadisticaModel.calcSerieMediasMoviles(dataToProcess);
                
                reportResults.especiales = {
                    geometrica: g.resultado,
                    geometricaObj: g,
                    armonica: h.resultado,
                    armonicaObj: h,
                    seriesMM: seriesMM
                };
                procedures.push({ module: 'Medidas Especiales', steps: [...getSteps(g), ...getSteps(h), "Ver tabla detallada en hoja principal"] });
            } catch (e) { errores.push('Medias Especiales: ' + e.message); }
        }

        if (modules.frecuencias) {
            try {
                const f = EstadisticaModel.calcFrecuencias(dataToProcess);
                const fAg = EstadisticaModel.calcFrecuenciasAgrupadas(dataToProcess);
                reportResults.frecuencias = f.resumen.tablas[0];
                reportResults.frecuenciasAgrupadas = fAg;
                procedures.push({ module: 'Distribución de Frecuencias', steps: getSteps(f) });
            } catch (e) { errores.push('Frecuencias: ' + e.message); }
        }



        // 3. Exportar (solo si hay al menos un resultado)
        try {
            if (Object.keys(reportResults).length === 0) {
                UIView.mostrarError('No se pudo calcular ningún módulo. ' + (errores.length > 0 ? errores.join(' | ') : ''));
                return;
            }
            ExcelService.exportarReporteCompleto(dataToProcess, reportResults, samplingInfo, procedures, this.currentColumnName);
            this.cerrarModalReporte();

            // Notificar si hubo errores parciales
            if (errores.length > 0) {
                console.warn('Módulos con error:', errores);
            }
        } catch (err) {
            UIView.mostrarError('Error al generar el reporte: ' + err.message);
        }
    },

    aplicarMuestreoBatch(data, type, param) {
        let sample = [];
        let info = "";
        
        if (type === 'simple') {
            const n = Math.min(param, data.length);
            sample = [...data].sort(() => 0.5 - Math.random()).slice(0, n);
            info = `Muestreo Aleatorio Simple (n=${n})`;
        } else if (type === 'sistematico') {
            const k = param || 2;
            for (let i = 0; i < data.length; i += k) {
                sample.push(data[i]);
            }
            info = `Muestreo Sistemático (k=${k})`;
        } else if (type === 'conglomerados') {
            const m = param || 2;
            const res = EstadisticaModel.calcMuestreoConglomerados(data, m);
            // Extraer ids si el resultado es una cadena con "id:"
            sample = data.filter((_, i) => res.resultado.includes(`Conglomerado ${i+1}`)); 
            if (sample.length === 0) sample = data.slice(0, Math.ceil(data.length/m)); 
            info = `Muestreo por Conglomerados (m=${m})`;
        } else {
            sample = [...data];
            info = "Sin Muestreo (Población Total)";
        }
        
        return { sample, info };
    },

    handleColumnSelection(colName, values) {
        const input = document.getElementById('dataInput');
        input.value = values.join('; ');
        this.currentColumnName = colName;
        
        // Efecto visual de que se cargó algo
        input.classList.add('bg-green-50', 'dark:bg-green-900/10');
        setTimeout(() => input.classList.remove('bg-green-50', 'dark:bg-green-900/10'), 1000);
    },

    handleModuleChange(e) {
        const v = e.target.value;
        const extraParams = document.getElementById('extraParams');
        const paramMuestreo       = document.getElementById('paramMuestreo');
        const paramMuestreoE      = document.getElementById('paramMuestreoE');
        const paramMM             = document.getElementById('paramMM');
        const paramGrafico        = document.getElementById('paramGrafico');
        const modoVistaContainer = document.getElementById('modoVistaContainer');

        // Reset state
        extraParams.classList.add('hidden');
        paramMuestreo.classList.add('hidden');
        if (paramMuestreoE) paramMuestreoE.classList.add('hidden');
        if (paramMM) paramMM.classList.add('hidden');
        if (paramGrafico) paramGrafico.classList.add('hidden');
        if (modoVistaContainer) modoVistaContainer.classList.add('hidden');

        if (['muestreo_simple', 'muestreo_sistematico', 'muestreo_conglomerados'].includes(v)) {
            extraParams.classList.remove('hidden');
            paramMuestreo.classList.remove('hidden');
        } else if (v === 'muestreo_estratificado') {
            extraParams.classList.remove('hidden');
            paramMuestreoE.classList.remove('hidden');
        } else if (v === 'media_movil') {
            extraParams.classList.remove('hidden');
            if (paramMM) paramMM.classList.remove('hidden');
            if (modoVistaContainer) modoVistaContainer.classList.remove('hidden');
        } else if (v === 'frecuencias') {
            extraParams.classList.remove('hidden');
            if (paramGrafico) paramGrafico.classList.remove('hidden');
            if (modoVistaContainer) modoVistaContainer.classList.remove('hidden');
        } else if (v === 'moda') {
            extraParams.classList.remove('hidden');
            if (paramGrafico) paramGrafico.classList.remove('hidden');
        } else if (['varianza', 'coef_var', 'desv_std', 'media_geometrica', 'curtosis', 'asimetria'].includes(v) && modoVistaContainer) {
            modoVistaContainer.classList.remove('hidden');
        }
    },

    limpiar() {
        document.getElementById('dataInput').value = '';
        document.getElementById('moduleSelect').value = '';
        document.getElementById('paramN').value = '';
        document.getElementById('paramEstratos').value = '';
        document.getElementById('paramNE').value = '';
        
        UIView.limpiar();
        this.handleModuleChange({ target: { value: '' } });
        
        // Reset Excel selector
        document.getElementById('excelColumnSelector').classList.add('hidden');
        document.getElementById('btnVerExcel').classList.add('hidden');
        document.getElementById('excelInput').value = '';
        this.excelData = null;
    },

    calcular() {
        UIView.ocultarError();
        const raw = document.getElementById('dataInput').value;
        const mod = document.getElementById('moduleSelect').value;

        if (!mod) return UIView.mostrarError('Por favor selecciona un módulo de cálculo.');

        let data = null;
        if (!MODULES_NO_DATA.includes(mod)) {
            data = parseData(raw);
            if (!data || data.length === 0) {
                return UIView.mostrarError('Ingresa datos numéricos válidos separados por comas. Ejemplo: 4, 7, 13, 2');
            }
            if (data.length < 2 && !['media', 'moda', 'rango'].includes(mod)) {
                return UIView.mostrarError('Este cálculo general requiere al menos 2 datos.');
            }
        }

        try {
            let resObj = null;
            let titulo = document.querySelector(`#moduleSelect option[value="${mod}"]`).textContent;

            switch (mod) {
                // Muestreo
                case 'muestreo_simple':
                    resObj = EstadisticaModel.calcMuestreoSimple(parseData(raw) || [1,2,3,4,5,6,7,8,9,10], parseInt(document.getElementById('paramN').value) || 0);
                    break;
                case 'muestreo_sistematico':
                    resObj = EstadisticaModel.calcMuestreoSistematico(parseData(raw) || [1,2,3,4,5,6,7,8,9,10], parseInt(document.getElementById('paramN').value) || 0);
                    break;
                case 'muestreo_estratificado':
                    const estratosStr = document.getElementById('paramEstratos').value.trim();
                    const nEstratos = parseInt(document.getElementById('paramNE').value) || 0;
                    let estratos = [];
                    if (estratosStr) {
                        estratos = estratosStr.split('|').map(s => {
                            const [nombre, N] = s.split(':');
                            return { nombre: nombre.trim(), N: parseInt(N) || 0 };
                        }).filter(e => e.nombre && e.N > 0);
                    }
                    resObj = EstadisticaModel.calcMuestreoEstratificado(estratos, nEstratos);
                    break;
                case 'muestreo_conglomerados':
                    resObj = EstadisticaModel.calcMuestreoConglomerados(parseData(raw) || [1,2,3,4,5,6,7,8,9,10], parseInt(document.getElementById('paramN').value) || 2);
                    break;
                
                // Variables
                case 'var_discreta': resObj = EstadisticaModel.calcVarDiscreta(parseData(raw) || []); break;
                case 'var_continua': resObj = EstadisticaModel.calcVarContinua(parseData(raw) || []); break;

                // Central
                case 'media': resObj = EstadisticaModel.calcMedia(data); break;
                case 'mediana': resObj = EstadisticaModel.calcMediana(data); break;
                case 'moda': 
                    const tipoModa = document.getElementById('tipoGraficoDinamico') ? document.getElementById('tipoGraficoDinamico').value : 'barras';
                    resObj = EstadisticaModel.calcModa(data, tipoModa); 
                    break;

                // Dispersión
                case 'rango': resObj = EstadisticaModel.calcRango(data); break;
                case 'varianza': resObj = EstadisticaModel.calcVarianza(data); break;
                case 'desv_std': 
                    const v_val = variance(data);
                    const m_val = mean(data);
                    resObj = EstadisticaModel.calcDesvStd(v_val, m_val); 
                    break;
                case 'coef_var': 
                    const m = mean(data);
                    const sDev = stdDev(data);
                    resObj = EstadisticaModel.calcCoefVar(m, sDev); 
                    break;

                // Medias especiales
                case 'media_movil': 
                    const paramK = parseInt(document.getElementById('paramOrdenMM').value) || 3;
                    resObj = EstadisticaModel.calcMediaMovil(data, paramK); 
                    break;
                case 'media_geometrica': resObj = EstadisticaModel.calcMediaGeometrica(data); break;
                case 'media_armonica': resObj = EstadisticaModel.calcMediaArmonica(data); break;

                // Posición
                case 'cuartiles': resObj = EstadisticaModel.calcCuartiles(data); break;
                case 'deciles': resObj = EstadisticaModel.calcDeciles(data); break;
                case 'percentiles': resObj = EstadisticaModel.calcPercentiles(data); break;

                // Frecuencias
                case 'frecuencias': 
                    const tipoFrec = document.getElementById('tipoGraficoDinamico') ? document.getElementById('tipoGraficoDinamico').value : 'barras';
                    resObj = EstadisticaModel.calcFrecuencias(data, tipoFrec); 
                    break;

                // Forma
                case 'curtosis': resObj = EstadisticaModel.calcCurtosis(data); break;
                case 'asimetria': resObj = EstadisticaModel.calcAsimetria(data); break;

                default:
                    return UIView.mostrarError('Módulo no reconocido.');
            }

            if (resObj) {
                if (resObj.detallado && resObj.resumen) {
                    const modo = document.getElementById('viewMode').value;
                    if (modo === 'detallado') {
                        UIView.renderDetallado(titulo, resObj);
                    } else if (modo === 'resumen') {
                        UIView.renderResumen(titulo, resObj);
                    }
                } else {
                    UIView.renderizarResultado(titulo, resObj);
                }
            }
        } catch (error) {
            UIView.mostrarError(error.message || 'Ocurrió un error (verifica que los parámetros sean correctos).');
            console.error(error);
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // UNIDAD 3: CONTADOR DE PALABRAS
    // ─────────────────────────────────────────────────────────────────────────
    async handleImportTexto(e) {
        const file = e.target.files[0];
        if (!file) return;

        const area = document.getElementById('bookInput');
        area.placeholder = "Escaneando contenido... por favor espera. Esto puede tardar si el archivo es grande o es una imagen.";
        area.value = "";

        try {
            const extension = file.name.split('.').pop().toLowerCase();
            let text = "";

            // 1. WORD (.docx)
            if (extension === 'docx') {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } 
            // 2. PDF (.pdf)
            else if (extension === 'pdf') {
                const arrayBuffer = await file.arrayBuffer();
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    fullText += content.items.map(item => item.str).join(' ') + '\n';
                }
                text = fullText;
            }
            // 3. EXCEL / CSV (.xlsx, .xls, .csv)
            else if (['xlsx', 'xls', 'csv'].includes(extension)) {
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer);
                let fullExcelText = "";
                workbook.SheetNames.forEach(name => {
                    const sheet = workbook.Sheets[name];
                    fullExcelText += XLSX.utils.sheet_to_txt(sheet) + "\n";
                });
                text = fullExcelText;
            }
            // 4. IMÁGENES (OCR con Tesseract.js)
            else if (['png', 'jpg', 'jpeg', 'bmp', 'webp'].includes(extension)) {
                area.placeholder = "Realizando reconocimiento óptico de caracteres (OCR)...";
                // Usamos español e inglés por defecto para el OCR automático
                const worker = await Tesseract.createWorker('spa+eng');
                const ret = await worker.recognize(file);
                text = ret.data.text;
                await worker.terminate();
            }
            // 5. TXT y FALLBACK UNIVERSAL (Cualquier archivo se intenta leer como texto)
            else {
                text = await file.text();
            }

            if (!text || text.trim().length === 0) {
                throw new Error('No se detectó contenido de texto legible en este archivo.');
            }

            area.value = text;
            area.placeholder = "Pega texto, o sube cualquier archivo (PDF, Word, Excel, Imágenes con texto, TXT...)";
            area.classList.add('bg-pink-50', 'dark:bg-pink-900/10');
            setTimeout(() => area.classList.remove('bg-pink-50', 'dark:bg-pink-900/10'), 1000);
            
        } catch (err) {
            console.error(err);
            area.placeholder = "Error al procesar el archivo.";
            UIView.mostrarError('Error al procesar el documento: ' + err.message + '. Intenta pegar el texto manualmente.');
        }
    },

    escanearLibro() {
        const text = document.getElementById('bookInput').value;
        const filterStopWords = document.getElementById('filterStopWords').checked;
        const caseSensitive = document.getElementById('caseSensitive').checked;

        if (!text || text.trim().length < 10) {
            this.mostrarNotificacion('Por favor ingresa un texto más largo para analizar.', 'error');
            return;
        }

        try {
            const resObj = EstadisticaModel.calcWordFrequency(text, { filterStopWords, caseSensitive });
            
            const resultsDiv = document.getElementById('bookResults');
            resultsDiv.classList.remove('hidden');
            
            // Renderizar directamente en el contenedor de la Unidad 3
            UIView.renderizarResultado('Análisis de Frecuencia (Libro)', resObj, resultsDiv);

            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (err) {
            this.mostrarNotificacion('Error al escanear el libro: ' + err.message, 'error');
        }
    },

    limpiarLibro() {
        document.getElementById('bookInput').value = '';
        document.getElementById('bookResults').innerHTML = '';
        document.getElementById('bookResults').classList.add('hidden');
        document.getElementById('textFileInput').value = '';
    },

    agregarALaBiblioteca() {
        const text = document.getElementById('bookInput').value;
        const filterStopWords = document.getElementById('filterStopWords').checked;
        const caseSensitive = document.getElementById('caseSensitive').checked;

        if (!text || text.trim().length < 50) {
            this.mostrarNotificacion('El contenido es demasiado corto para añadirlo a la biblioteca.', 'error');
            return;
        }

        try {
            const resObj = EstadisticaModel.calcWordFrequency(text, { filterStopWords, caseSensitive });
            
            // Crear un nombre por defecto si no hay uno
            const bookName = `Libro ${this.bookLibrary.length + 1} (${resObj.resultado})`;
            
            const newBook = {
                id: Date.now(),
                name: bookName,
                text: text,
                results: resObj,
                date: new Date().toLocaleTimeString()
            };

            this.bookLibrary.push(newBook);
            this.renderizarBiblioteca();
            
            // Feedback
            document.getElementById('librarySection').classList.remove('hidden');
            this.limpiarLibro();
            
        } catch (err) {
            this.mostrarNotificacion('Error al procesar para la biblioteca: ' + err.message, 'error');
        }
    },

    renderizarBiblioteca() {
        const container = document.getElementById('bookLibrary');
        container.innerHTML = '';

        if (this.bookLibrary.length === 0) {
            document.getElementById('librarySection').classList.add('hidden');
            document.getElementById('bayesSection').classList.add('hidden');
            return;
        }

        // Mostrar sección de Bayes si hay al menos 2 libros
        if (this.bookLibrary.length >= 2) {
            document.getElementById('bayesSection').classList.remove('hidden');
        } else {
            document.getElementById('bayesSection').classList.add('hidden');
        }

        this.bookLibrary.forEach(book => {
            const card = document.createElement('div');
            card.className = 'glass-card p-4 border-l-4 border-pink-500 hover:scale-[1.02] transition-transform cursor-pointer relative group';
            card.innerHTML = `
                <div class="flex flex-col gap-1">
                    <span class="text-[9px] font-black text-pink-500 uppercase tracking-widest">${book.date}</span>
                    <h4 class="font-bold text-slate-800 dark:text-white truncate pr-6">${book.name}</h4>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        ${UIView.parseMarkdown(book.results.pasos[1])}
                    </p>
                    <div class="mt-3 flex items-center justify-between">
                        <span class="text-[10px] bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-1 rounded-md font-bold italic">
                            "${book.results.resultado}"
                        </span>
                        <button class="btn-delete text-slate-300 hover:text-red-500 transition-colors" data-id="${book.id}">
                            <span class="text-sm">🗑️</span>
                        </button>
                    </div>
                </div>
            `;
            
            // Ver resultados al hacer clic
            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-delete')) return;
                this.verResultadosLibro(book);
            });

            // Botón eliminar
            card.querySelector('.btn-delete').addEventListener('click', () => {
                this.bookLibrary = this.bookLibrary.filter(b => b.id !== book.id);
                this.renderizarBiblioteca();
            });

            container.appendChild(card);
        });
    },

    verResultadosLibro(book) {
        const resultsDiv = document.getElementById('bookResults');
        resultsDiv.classList.remove('hidden');
        UIView.renderizarResultado(`Resultados: ${book.name}`, book.results, resultsDiv);
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    calcularBayes() {
        let wordInput = document.getElementById('bayesWord').value.trim();
        const numLevels = parseInt(document.getElementById('bayesLevels').value) || 1;

        if (this.bookLibrary.length < 2) {
            this.mostrarNotificacion('Necesitas al menos 2 libros en la biblioteca para realizar una comparación bayesiana.', 'error');
            return;
        }

        // Determinar qué palabras usar como evidencias
        let finalWords = [];
        if (wordInput) {
            finalWords = wordInput.split(',').map(w => w.trim()).filter(w => w.length > 0);
        }

        // Si faltan palabras para completar los niveles solicitados, buscamos en común
        if (finalWords.length < numLevels) {
            try {
                const common = EstadisticaModel.findCommonWords(this.bookLibrary);
                const candidates = common.tablas[0].filas.map(r => r[1]);
                
                for (let cand of candidates) {
                    if (!finalWords.includes(cand)) {
                        finalWords.push(cand);
                    }
                    if (finalWords.length >= numLevels) break;
                }
            } catch (err) {
                // Si no hay palabras en común y no ingresó ninguna, error
                if (finalWords.length === 0) {
                    this.mostrarNotificacion('No se encontraron suficientes palabras en común. Por favor ingresa palabras manualmente.', 'info');
                    return;
                }
            }
        }

        // Limitar a los niveles solicitados
        finalWords = finalWords.slice(0, numLevels);
        document.getElementById('bayesWord').value = finalWords.join(', ');

        this.currentBayesWords = finalWords;
        this.selectedBayesWord = finalWords[0]; // Seleccionar la primera palabra por defecto

        this.renderizarBayesSeleccionado();
    },

    renderizarBayesSeleccionado() {
        if (!this.selectedBayesWord) return;

        try {
            // Calculamos Bayes de 1 nivel específicamente para la palabra seleccionada
            const resObj = EstadisticaModel.calcBayes(this.selectedBayesWord, this.bookLibrary);
            const container = document.getElementById('bayesResults');
            container.classList.remove('hidden');
            
            // Renderizamos pasándole las palabras completas y la seleccionada
            UIView.renderizarResultadoConCombo(
                `Teorema de Bayes: Clasificación para ${this.selectedBayesWord}`,
                resObj,
                this.currentBayesWords,
                this.selectedBayesWord,
                container
            );
            
            // Vincular evento al cambiar el combo box
            const selectCombo = document.getElementById('selectBayesEvidencia');
            if (selectCombo) {
                selectCombo.addEventListener('change', (e) => {
                    this.selectedBayesWord = e.target.value;
                    this.renderizarBayesSeleccionado();
                });
            }
            
        } catch (err) {
            this.mostrarNotificacion('Error en Bayes: ' + err.message, 'error');
        }
    },

    buscarPalabrasEnComun() {
        if (this.bookLibrary.length < 2) {
            this.mostrarNotificacion('Añade al menos 2 libros a la biblioteca para buscar intersecciones.', 'info');
            return;
        }

        try {
            const resObj = EstadisticaModel.findCommonWords(this.bookLibrary);
            const container = document.getElementById('bookResults');
            container.classList.remove('hidden');
            
            UIView.renderizarResultado('Intersección de Palabras entre Documentos', resObj, container);
            
            // Sugerencia: autocompletar el campo de Bayes con la palabra más común
            if (resObj.tablas[0].filas.length > 0) {
                document.getElementById('bayesWord').value = resObj.tablas[0].filas[0][1];
            }
            
        } catch (err) {
            this.mostrarNotificacion('Intersección: ' + err.message, 'error');
        }
    },

    exportarArbolExcel() {
        const datos = UIView.lastBayesData;
        if (!datos) {
            this.mostrarNotificacion('Primero realiza un cálculo de Bayes para exportar.', 'info');
            return;
        }

        const wb = XLSX.utils.book_new();
        const evidencias = datos.evidencias;
        const raiz = datos.raiz; // Cada elemento es un libro

        // --- TABLA 1: FRECUENCIAS Y PROBABILIDADES INDIVIDUALES ---
        const rowsFreq = [];
        // Encabezados
        const header1 = ['Palabras_marcadas'];
        raiz.forEach((l, i) => header1.push(`Bloque_${i+1}`));
        raiz.forEach((l, i) => header1.push(`TOTAL_Palabras_Bloque_${i+1}`));
        raiz.forEach((l, i) => header1.push(`P(W|Bloque_${i+1})`));
        rowsFreq.push(header1);

        // Datos por palabra
        evidencias.forEach(word => {
            const row = [word];
            // Frecuencias
            raiz.forEach(libro => {
                // Buscamos en la biblioteca el conteo real
                const bookInfo = this.bookLibrary.find(b => b.name === libro.nombre);
                const count = bookInfo ? (bookInfo.results.mapaFrecuencias[word] || 0) : 0;
                row.push(count);
            });
            // Totales del bloque
            raiz.forEach(libro => {
                const bookInfo = this.bookLibrary.find(b => b.name === libro.nombre);
                row.push(bookInfo ? bookInfo.results.totalPalabras : 0);
            });
            // Probabilidades individuales
            raiz.forEach(libro => {
                const bookInfo = this.bookLibrary.find(b => b.name === libro.nombre);
                const prob = bookInfo ? ((bookInfo.results.mapaFrecuencias[word] || 0) / bookInfo.results.totalPalabras) : 0;
                row.push(prob);
            });
            rowsFreq.push(row);
        });

        const wsFreq = XLSX.utils.aoa_to_sheet(rowsFreq);

        // --- TABLA 2: ANÁLISIS BAYESIANO E INTERSECCIONES ---
        const rowsBayes = [];
        const header2 = ['Palabras_unicas'];
        raiz.forEach((l, i) => header2.push(`Intersección_Camino_${i+1}`));
        header2.push('TOTAL_BLOQUES_GANADOR');
        rowsBayes.push(header2);

        // Filas de intersección (Caminos recorridos)
        // En Bayes Secuencial, la intersección final es el producto de prior * likelihoods
        const rowInter = ['(Todas las evidencias)'];
        let maxInter = 0;
        raiz.forEach(libro => {
            const val = libro.producto || 0;
            rowInter.push(val);
            if (val > maxInter) maxInter = val;
        });
        rowInter.push(maxInter);
        rowsBayes.push(rowInter);

        // Añadir detalle por palabra si es posible
        evidencias.forEach((word, idx) => {
            const rowW = [word];
            raiz.forEach(libro => {
                // Buscamos el nodo correspondiente en el árbol
                let node = libro.hijos ? libro.hijos.find(h => h.nombre.includes(word)) : null;
                rowW.push(node ? node.probCondicional : 0);
            });
            rowsBayes.push(rowW);
        });

        const wsBayes = XLSX.utils.aoa_to_sheet(rowsBayes);

        // Añadir hojas
        XLSX.utils.book_append_sheet(wb, wsFreq, "Frecuencias_y_Caminos");
        XLSX.utils.book_append_sheet(wb, wsBayes, "Análisis_Bayesiano");

        // Descargar
        XLSX.writeFile(wb, `Reporte_Estadistico_Bayes_${new Date().getTime()}.xlsx`);
    },

    // ── AGRUPADOR DE TEXTOS PARALELOS DE IA Y LIBROS ────────────────────
    inicializarAgrupadorParalelo() {
        this.cargarTextosLibros().then(data => {
            this.parallelBooksData = data;
            this.selectedParallelBookId = 1; // Por defecto el primer libro
            this.renderizarAgrupadorParalelo();
        }).catch(err => {
            console.error("Error cargando textos paralelos:", err);
        });
    },

    async cargarTextosLibros() {
        const librosConfig = [
            { id: 1, path: 'libro1_el_tunel', name: 'El túnel', author: 'Ernesto Sabato', genre: 'Psicología, obsesión, el arte y el existencialismo.', pdf: 'El túnel- Ernesto Sábato.pdf' },
            { id: 2, path: 'libro2_cronica_de_una_muerte_anunciada', name: 'Crónica de una muerte anunciada', author: 'Gabriel García Márquez', genre: 'El destino, el honor social, la justicia y las costumbres de pueblo.', pdf: 'Crónica de una muerte anunciada. G. Márquez.pdf' },
            { id: 3, path: 'libro3_la_metamorfosis', name: 'La metamorfosis', author: 'Franz Kafka', genre: 'La alienación laboral, el rechazo familiar, la transformación y la carga social.', pdf: 'Kafka Franz - La metamorfosis_unlocked.docx' },
            { id: 4, path: 'libro4_aura', name: 'Aura', author: 'Carlos Fuentes', genre: 'El misticismo, la juventud eterna, el tiempo, la ilusión y el doble yo.', pdf: 'CARLOS FUENTES - AURA.pdf' }
        ];

        const modelData = [];

        for (const config of librosConfig) {
            const bookData = {
                id: config.id,
                name: config.name,
                author: config.author,
                genre: config.genre,
                path: config.path,
                pdf: config.pdf,
                fragments: {
                    gemini: Array(3).fill(null).map((_, i) => `[Pendiente cargar fragmento ${i + 1} de Gemini desde libros/${config.path}/gemini.txt]`),
                    chatgpt: Array(3).fill(null).map((_, i) => `[Pendiente cargar fragmento ${i + 1} de ChatGPT desde libros/${config.path}/chatgpt.txt]`),
                    claude: Array(3).fill(null).map((_, i) => `[Pendiente cargar fragmento ${i + 1} de Claude desde libros/${config.path}/claude.txt]`)
                }
            };

            // Intentar cargar archivos de IA de forma asíncrona
            const ais = ['gemini', 'chatgpt', 'claude'];
            for (const ai of ais) {
                try {
                    const response = await fetch(`libros/${config.path}/${ai}.txt`);
                    if (response.ok) {
                        const rawText = await response.text();
                        // Parsear fragmentos usando === FRAGMENTO X ===
                        const parts = rawText.split(/===\s*FRAGMENTO\s*\d+\s*===/gi)
                            .map(p => p.trim())
                            .filter(p => p.length > 0);
                        
                        // Si se encontraron fragmentos válidos y no es el placeholder inicial
                        if (parts.length > 0 && !parts[0].includes('[Pegar fragmento')) {
                            for (let i = 0; i < Math.min(3, parts.length); i++) {
                                bookData.fragments[ai][i] = parts[i];
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`No se pudo cargar el archivo libros/${config.path}/${ai}.txt`, e);
                }
            }

            modelData.push(bookData);
        }

        return modelData;
    },

    renderizarAgrupadorParalelo() {
        const selectorContainer = document.getElementById('parallelBookSelector');
        const tbody = document.getElementById('parallelBooksTableBody');
        if (!selectorContainer || !tbody || !this.parallelBooksData) return;

        // Renderizar los botones selectores de libros
        selectorContainer.innerHTML = '';
        this.parallelBooksData.forEach(book => {
            const isSelected = book.id === this.selectedParallelBookId;
            const btn = document.createElement('button');
            btn.className = `px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95 ${
                isSelected 
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' 
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`;
            btn.innerHTML = `
                <span class="block text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-pink-100' : 'text-slate-450 dark:text-slate-500'}">Libro ${book.id}</span>
                <span class="block font-extrabold mt-0.5">${book.name}</span>
            `;
            btn.addEventListener('click', () => {
                this.selectedParallelBookId = book.id;
                this.renderizarAgrupadorParalelo();
            });
            selectorContainer.appendChild(btn);
        });

        // Limpiar cuerpo de la tabla
        tbody.innerHTML = '';

        // Obtener libro seleccionado
        const selectedBook = this.parallelBooksData.find(b => b.id === this.selectedParallelBookId);
        if (!selectedBook) return;

        // Renderizar las 3 filas del libro seleccionado
        for (let i = 0; i < 3; i++) {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors';

            if (i === 0) {
                // Celda combinada para el Libro Humano (abarca las 3 filas de fragmentos)
                const tdBook = document.createElement('td');
                tdBook.rowSpan = 3;
                tdBook.className = 'p-4 border-r border-b border-slate-200 dark:border-slate-800 align-top bg-slate-50/20 dark:bg-black/10 w-1/5';
                tdBook.innerHTML = `
                    <div class="space-y-3">
                        <div>
                            <div class="flex items-center justify-between">
                                <span class="text-[9px] font-black text-pink-500 uppercase tracking-widest block">Libro ${selectedBook.id}</span>
                                <button class="btn-view-pdf p-1 hover:bg-pink-100 dark:hover:bg-pink-900/50 rounded-lg text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 transition-all active:scale-90 text-[11px] font-bold" title="Ver PDF completo">
                                    🔍 Ver PDF
                                </button>
                            </div>
                            <h4 class="font-extrabold text-slate-850 dark:text-white text-xs leading-tight mt-1">${selectedBook.name}</h4>
                            <p class="text-[10px] text-slate-450 dark:text-slate-400 font-bold italic">${selectedBook.author}</p>
                        </div>
                        <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <span class="text-[8px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Temática / Género:</span>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-snug mt-1">${selectedBook.genre}</p>
                        </div>
                        <div class="pt-2">
                            <button class="btn-load-pdf w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-lg shadow-pink-500/20">
                                📖 Analizar PDF
                            </button>
                        </div>
                    </div>
                `;
                
                // Listener para el botón de analizar PDF
                const btnLoadPdf = tdBook.querySelector('.btn-load-pdf');
                if (btnLoadPdf) {
                    btnLoadPdf.addEventListener('click', async () => {
                        const originalText = btnLoadPdf.innerHTML;
                        btnLoadPdf.disabled = true;
                        btnLoadPdf.innerHTML = '⏳ Analizando...';
                        await this.analizarLibroPDF(selectedBook);
                        btnLoadPdf.disabled = false;
                        btnLoadPdf.innerHTML = originalText;
                    });
                }

                // Listener para el botón de visualizar PDF
                const btnViewPdf = tdBook.querySelector('.btn-view-pdf');
                if (btnViewPdf) {
                    btnViewPdf.addEventListener('click', () => {
                        this.visualizarPDF(selectedBook);
                    });
                }

                tr.appendChild(tdBook);
            }

            // Celdas para las IAs (Fragmentos 1 a 4)
            const ais = ['gemini', 'chatgpt', 'claude'];
            ais.forEach((ai, aiIdx) => {
                const td = document.createElement('td');
                td.className = `p-4 border-b border-slate-100 dark:border-slate-800/50 align-top w-4/15 ${aiIdx < 2 ? 'border-r' : ''}`;
                
                const text = selectedBook.fragments[ai][i] || '';
                const displayLength = 120;
                const isTruncated = text.length > displayLength;
                const displayText = isTruncated ? text.substring(0, displayLength) + '...' : text;
                
                td.innerHTML = `
                    <div class="space-y-2.5 flex flex-col justify-between h-full group">
                        <div class="cursor-pointer btn-ver-mas-trigger">
                            <div class="flex items-center justify-between text-[8px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                                <span>Fragmento ${i + 1}</span>
                                <span class="text-[7px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Ver más 🔍</span>
                            </div>
                            <p class="text-[11px] text-slate-750 dark:text-slate-350 font-medium leading-relaxed mt-1 break-all">${displayText}</p>
                        </div>
                        <div class="pt-1.5 border-t border-slate-100/80 dark:border-slate-800/40">
                            <button class="btn-analizar-fragmento w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-650 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1 active:scale-95">
                                📊 Analizar Fragmento
                            </button>
                        </div>
                    </div>
                `;

                // Evento para abrir modal al hacer clic en el cuerpo del fragmento
                const trigger = td.querySelector('.btn-ver-mas-trigger');
                if (trigger) {
                    trigger.addEventListener('click', () => {
                        const title = `${selectedBook.name} - Fragmento ${i + 1}`;
                        const subtitle = `Texto comparado de ${ai.toUpperCase()} (${selectedBook.author})`;
                        this.abrirModalFragmento(title, subtitle, text);
                    });
                }

                // Evento para analizar el fragmento individual
                const btnAnalizar = td.querySelector('.btn-analizar-fragmento');
                if (btnAnalizar) {
                    btnAnalizar.addEventListener('click', async () => {
                        const originalText = btnAnalizar.innerHTML;
                        btnAnalizar.disabled = true;
                        btnAnalizar.innerHTML = '⏳ Analizando...';
                        await this.analizarFragmentoIA(selectedBook, ai, i + 1, text);
                        btnAnalizar.disabled = false;
                        btnAnalizar.innerHTML = originalText;
                    });
                }

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        }
    },

    async analizarLibroPDF(book) {
        try {
            // Buscamos si ya está en la biblioteca
            const alreadyExists = this.bookLibrary.some(b => b.name === book.name);
            if (alreadyExists) {
                this.mostrarNotificacion(`El libro "${book.name}" ya está en la biblioteca.`, 'info');
                return;
            }

            // Descargar el archivo
            const pdfUrl = `libros/${book.path}/${book.pdf}`;
            const response = await fetch(pdfUrl);
            if (!response.ok) {
                throw new Error(`No se pudo cargar el archivo desde: ${pdfUrl}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            let fullText = "";

            if (book.pdf.toLowerCase().endsWith('.docx')) {
                const result = await mammoth.extractRawText({ arrayBuffer });
                fullText = result.value;
            } else {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    fullText += content.items.map(item => item.str).join(' ') + '\n';
                }
            }

            if (!fullText || fullText.trim().length < 50) {
                throw new Error('El PDF no contiene suficiente texto legible.');
            }

            // Analizar frecuencias
            const filterStopWords = document.getElementById('filterStopWords').checked;
            const caseSensitive = document.getElementById('caseSensitive').checked;
            
            const resObj = EstadisticaModel.calcWordFrequency(fullText, { filterStopWords, caseSensitive });

            const newBook = {
                id: Date.now(),
                name: book.name,
                text: fullText,
                results: resObj,
                date: new Date().toLocaleTimeString()
            };

            this.bookLibrary.push(newBook);
            this.renderizarBiblioteca();
            
            // Mostrar la sección de la biblioteca
            document.getElementById('librarySection').classList.remove('hidden');

            this.mostrarNotificacion(`¡"${book.name}" analizado con éxito y añadido a la biblioteca!`, 'success');

        } catch (err) {
            console.error(err);
            this.mostrarNotificacion(`Error al analizar el PDF de "${book.name}": ` + err.message, 'error');
        }
    },

    abrirModalFragmento(title, subtitle, content) {
        document.getElementById('fragmentModalTitle').innerText = title;
        document.getElementById('fragmentModalSubtitle').innerText = subtitle;
        document.getElementById('fragmentModalContent').innerText = content;
        
        const modal = document.getElementById('fragmentTextModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    },

    cerrarModalFragmento() {
        const modal = document.getElementById('fragmentTextModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
    },

    async visualizarPDF(book) {
        const pdfUrl = `libros/${book.path}/${book.pdf}`;
        const modal = document.getElementById('pdfViewerModal');
        const iframe = document.getElementById('pdfViewerIframe');
        const wordContainer = document.getElementById('wordViewerContainer');
        const title = document.getElementById('pdfModalTitle');
        const subtitle = document.getElementById('pdfModalSubtitle');
        
        if (modal && iframe && title && subtitle) {
            title.innerText = book.name;
            subtitle.innerText = `Autor: ${book.author}`;
            
            if (book.pdf.toLowerCase().endsWith('.docx')) {
                iframe.classList.add('hidden');
                if (wordContainer) {
                    wordContainer.classList.remove('hidden');
                    wordContainer.innerHTML = '<div class="flex items-center justify-center h-full"><span class="text-slate-400 font-bold text-lg animate-pulse">Cargando documento Word...</span></div>';
                    
                    try {
                        const response = await fetch(pdfUrl);
                        const arrayBuffer = await response.arrayBuffer();
                        const result = await mammoth.convertToHtml({ arrayBuffer });
                        // Estilos que imitan un visor de PDF (Fondo oscuro, hoja blanca en el centro)
                        wordContainer.innerHTML = `
                            <div class="w-full max-w-[850px] mx-auto my-8 bg-white shadow-2xl shadow-black/40 rounded-sm">
                                <div class="px-16 py-20 text-black font-serif text-base leading-[1.8] select-text cursor-text">
                                    ${result.value || '<p class="text-center text-slate-500 font-sans">No se encontró texto en el documento.</p>'}
                                </div>
                            </div>
                        `;
                    } catch (e) {
                        wordContainer.innerHTML = '<div class="text-red-500 font-bold flex justify-center mt-10">Error al visualizar el documento de Word.</div>';
                    }
                }
            } else {
                if (wordContainer) wordContainer.classList.add('hidden');
                iframe.classList.remove('hidden');
                iframe.src = pdfUrl;
            }
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
        }
    },

    cerrarVisualizadorPDF() {
        const modal = document.getElementById('pdfViewerModal');
        const iframe = document.getElementById('pdfViewerIframe');
        
        if (modal && iframe) {
            iframe.src = '';
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.classList.remove('overflow-hidden');
        }
    },

    mostrarNotificacion(mensaje, tipo = 'success') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        // Estilos para la notificación basados en el tipo
        const bgClasses = tipo === 'success' ? 'bg-emerald-500 dark:bg-emerald-600 shadow-emerald-500/20' : 
                          tipo === 'error' ? 'bg-rose-500 dark:bg-rose-600 shadow-rose-500/20' : 
                          'bg-slate-800 dark:bg-slate-700 shadow-slate-900/20';
        const icon = tipo === 'success' ? '✓' : tipo === 'error' ? '✕' : 'ℹ';

        toast.className = `flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white font-medium text-xs tracking-wide transform transition-all duration-300 translate-y-8 opacity-0 ${bgClasses} backdrop-blur-md`;
        toast.innerHTML = `
            <span class="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 font-black text-[10px] shrink-0">${icon}</span>
            <span>${mensaje}</span>
        `;

        container.appendChild(toast);

        // Animar entrada
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-8', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        });

        // Auto-cerrar y animar salida
        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-8', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    async analizarFragmentoIA(book, aiName, fragmentNumber, text) {
        try {
            const displayName = `${aiName.toUpperCase()} - ${book.name} (Frag. ${fragmentNumber})`;
            // Buscamos si ya está en la biblioteca
            const alreadyExists = this.bookLibrary.some(b => b.name === displayName);
            if (alreadyExists) {
                this.mostrarNotificacion(`El fragmento "${displayName}" ya está en la biblioteca.`, 'info');
                return;
            }

            if (!text || text.trim().length < 10) {
                throw new Error('El fragmento de la IA no contiene suficiente contenido legible.');
            }

            // Analizar frecuencias
            const filterStopWords = document.getElementById('filterStopWords').checked;
            const caseSensitive = document.getElementById('caseSensitive').checked;
            
            const resObj = EstadisticaModel.calcWordFrequency(text, { filterStopWords, caseSensitive });

            const newBook = {
                id: Date.now(),
                name: displayName,
                text: text,
                results: resObj,
                date: new Date().toLocaleTimeString()
            };

            this.bookLibrary.push(newBook);
            this.renderizarBiblioteca();
            
            // Mostrar la sección de la biblioteca
            document.getElementById('librarySection').classList.remove('hidden');

            this.mostrarNotificacion(`¡"${displayName}" analizado con éxito y añadido a la biblioteca!`, 'success');

        } catch (err) {
            console.error(err);
            this.mostrarNotificacion(`Error al analizar el fragmento de "${aiName}": ` + err.message, 'error');
        }
    }
};

