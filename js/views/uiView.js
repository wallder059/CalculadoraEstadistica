import { TableView } from './tableView.js';
import { ChartView } from './chartView.js';

const resultsSection = document.getElementById('results');
const errorMsg = document.getElementById('errorMsg');

function safeHide(el) {
    if (el) el.classList.add('hidden');
}

export const UIView = {
    init() {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        if (!themeToggle || !themeIcon) return;

        if (
            localStorage.getItem('theme') === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ) {
            document.documentElement.classList.add('dark');
            themeIcon.innerText = '☀️';
        }

        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            themeIcon.innerText = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');

            const canvas = document.getElementById('mainChart');
            if (canvas && !canvas.parentElement?.classList.contains('hidden')) {
                setTimeout(() => window.dispatchEvent(new CustomEvent('themeChanged')), 100);
            }
        });
    },

    mostrarError(mensaje) {
        if (!errorMsg) {
            console.error(mensaje);
            return;
        }
        errorMsg.innerHTML = `<div class="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200"><span class="text-2xl">⚠️</span> <div><strong class="block">Error de Validación</strong>${mensaje}</div></div>`;
        errorMsg.classList.remove('hidden');
        errorMsg.classList.add('animate-fade-in-up');
        safeHide(resultsSection);
    },

    ocultarError() {
        if (errorMsg) errorMsg.classList.add('hidden');
    },

    limpiar() {
        this.ocultarError();
        if (resultsSection) {
            resultsSection.innerHTML = '';
            resultsSection.classList.add('hidden');
        }
        ChartView.clearChart();
    },

    parseMarkdown(text) {
        if (!text) return '';
        return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>').replace(/\*\*/g, '');
    },

    lastBayesData: null,

    _renderCore(titulo, configuracion, customContainer = null) {
        const targetContainer = customContainer || resultsSection;
        this.ocultarError();
        const { concepto, formula, formulaHtml: formulaHtmlConfig, pasos, tablas, resultado, resultadoLabel, datosGrafico, numIntermedios, interpretacionHtml, operacionesGeneralesHtml, datosArbol, ocultarConclusion, markovHtml } = configuracion;
        
        if (datosArbol) this.lastBayesData = datosArbol;

        let pasosHtml = '';
        if (pasos && pasos.length > 0) {
            pasosHtml = `
                <div class="space-y-4">
                    <h4 class="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span class="w-8 h-[1px] bg-slate-200 dark:bg-slate-700"></span> Desarrollo paso a paso
                    </h4>
                    <ul class="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                        ${pasos.map((p, i) => `
                            <li class="flex gap-4 items-start group">
                                <span class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-110">${i+1}</span> 
                                <span class="text-slate-700 dark:text-slate-300 pt-1 leading-relaxed">${this.parseMarkdown(p)}</span>
                            </li>`).join('')}
                    </ul>
                </div>`;
        }
        
        let tablasHtml = '';
        if (tablas && tablas.length > 0) {
            tablasHtml = `<div class="mt-10 animate-fade-in-up" style="animation-delay: 200ms">${tablas.map(t => TableView.buildTable(t)).join('')}</div>`;
        }

        let intermediosHtml = '';
        if (numIntermedios) {
            const keys = Object.keys(numIntermedios);
            if (keys.length > 0) {
                const lis = keys.map(k => `
                    <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <span class="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold block mb-1 tracking-tighter">${k}</span>
                        <span class="text-indigo-600 dark:text-indigo-400 font-bold text-lg">${numIntermedios[k]}</span>
                    </div>`).join('');
                intermediosHtml = `
                <div class="space-y-4">
                    <h4 class="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span class="w-8 h-[1px] bg-slate-200 dark:bg-slate-700"></span> Resultados Intermedios
                    </h4>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        ${lis}
                    </div>
                </div>`;
            }
        }

        let formulaHtml = '';
        if (formulaHtmlConfig) {
            formulaHtml = `
                <div class="space-y-4">
                    <h4 class="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span class="w-8 h-[1px] bg-slate-200 dark:bg-slate-700"></span> Expresión Matemática
                    </h4>
                    <div class="inline-block bg-slate-900 dark:bg-black p-8 rounded-2xl shadow-xl border border-slate-800 dark:border-slate-800/50 relative group overflow-hidden min-w-[200px]">
                        <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class="relative z-10">${formulaHtmlConfig}</div>
                    </div>
                </div>`;
        } else if (formula) {
            formulaHtml = `
                <div class="space-y-4">
                    <h4 class="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span class="w-8 h-[1px] bg-slate-200 dark:bg-slate-700"></span> Expresión Matemática
                    </h4>
                    <div class="inline-block bg-slate-900 dark:bg-black text-emerald-400 font-mono text-lg px-8 py-5 rounded-2xl shadow-xl border border-slate-800 dark:border-slate-800/50 relative group overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span class="relative z-10">${formula.replace(/\n/g, '<br/>')}</span>
                    </div>
                </div>`;
        }

        let arbolHtml = '';
        if (datosArbol) {
            const format = (n) => parseFloat(n.toFixed(5)).toString().replace('.', ',');
            
            const comboHtml = (this.evidenciasCombo && this.evidenciasCombo.length > 0) ? `
                <div class="flex items-center gap-3">
                    <span class="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest">Evidencia:</span>
                    <select id="selectBayesEvidencia" class="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all border-none cursor-pointer focus:ring-2 focus:ring-indigo-400 px-4 py-2">
                        ${this.evidenciasCombo.map(ev => `
                            <option value="${ev}" ${ev === this.selectedEvidencia ? 'selected' : ''}>${ev}</option>
                        `).join('')}
                    </select>
                </div>
            ` : `
                <button id="btnExpandTree" class="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 transition-all shadow-lg flex items-center gap-2">
                    <span>🔍</span> Vista Completa (Ordenado)
                </button>
            `;
            
            arbolHtml = `
            <div class="mt-8">
                <div class="flex items-center justify-between mb-6">
                    <h4 class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span class="w-4 h-4 bg-indigo-500 rounded-full"></span>
                        Previsualización del Árbol (${datosArbol.niveles - 1} niveles)
                    </h4>
                    ${comboHtml}
                </div>
                
                <!-- Vista Compacta (Scrollable y pequeña) -->
                <div class="bayes-tree-compact relative bg-slate-50 dark:bg-black/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-4 h-[250px] overflow-hidden group cursor-pointer" id="compactTreePreview">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent z-20 pointer-events-none group-hover:opacity-0 transition-opacity"></div>
                    <div class="scale-[0.5] origin-top-left pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                        <div class="flex items-center gap-12">
                            <div class="tree-label bg-indigo-600 !text-white border-none shadow-lg">Espacio Muestral</div>
                            <div class="flex flex-col gap-20">
                                ${datosArbol.raiz.map(libro => `
                                    <div class="tree-node">
                                        <div class="tree-branch"><div class="tree-label font-black">${libro.nombre}</div></div>
                                        <div class="ml-12 border-l-2 border-slate-200 pl-12 py-4">
                                            <div class="tree-label">... niveles ocultos ...</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center z-30">
                        <span class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest text-indigo-600 shadow-xl group-hover:scale-110 transition-transform">Ver Árbol Completo</span>
                    </div>
                </div>
            </div>
            `;
        }

        const html = `
        <div class="glass-card overflow-hidden animate-fade-in-up dark:bg-slate-900/80">
            <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 relative overflow-hidden">
                <div class="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
                <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <h3 class="text-3xl font-extrabold text-white flex items-center gap-4 drop-shadow-md">
                        <span class="p-3 bg-white/20 rounded-2xl backdrop-blur-md">🎯</span> 
                        ${titulo}
                    </h3>
                    ${formulaHtmlConfig ? `
                        <div class="bg-black/20 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl shadow-inner animate-fade-in">
                            ${formulaHtmlConfig}
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="p-6 md:p-10 space-y-12">
                <!-- Concepto -->
                <div class="bg-indigo-50/50 dark:bg-indigo-900/30 p-6 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/30 shadow-sm relative group">
                    <div class="absolute right-6 top-6 text-indigo-200 dark:text-indigo-800/50 text-5xl opacity-40 group-hover:scale-110 transition-transform">📖</div>
                    <h4 class="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-[0.2em] mb-3">Marco Teórico</h4>
                    <p class="text-slate-800 dark:text-slate-100 leading-relaxed font-medium text-lg pr-12">${concepto}</p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div class="space-y-10">
                        ${formulaHtml}
                        ${pasosHtml}
                    </div>
                    <div class="space-y-10">
                        ${numIntermedios ? intermediosHtml : ''}
                        ${operacionesGeneralesHtml || ''}
                        ${interpretacionHtml || ''}
                    </div>
                </div>

                ${tablasHtml}

                ${(arbolHtml || datosGrafico || markovHtml) ? `
                <div class="p-8 space-y-10">
                    ${arbolHtml}
                    ${markovHtml || ''}
                    
                    <div id="chartContainer" class="hidden w-full max-w-3xl mx-auto mt-12 mb-6 p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-premium">
                        <div class="chart-container-premium">
                            <canvas id="mainChart"></canvas>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Resultado Final -->
                ${!ocultarConclusion ? `
                <div class="mt-12 p-1 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-[2.5rem] shadow-2xl animate-pulse-subtle">
                    <div class="bg-white dark:bg-slate-900 rounded-[2.4rem] p-10 text-center relative overflow-hidden group">
                        <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                        <h4 class="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-6 relative z-10">Conclusión Estadística</h4>
                        <div class="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-4 relative z-10 tracking-tight">
                            ${resultado.replace(/\n/g, '<br/>')}
                        </div>
                        <div class="text-lg font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest relative z-10">${resultadoLabel}</div>
                        <div class="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-tighter">
                            <span>✨</span> Cálculo completado exitosamente
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        `;

        targetContainer.innerHTML = html;
        targetContainer.classList.remove('hidden');
        targetContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Chart
        if (datosGrafico) {
            const canvas = targetContainer.querySelector('#mainChart');
            ChartView.renderChart(canvas, datosGrafico);
            targetContainer.querySelector('#chartContainer').classList.remove('hidden');
        } else {
            ChartView.clearChart();
        }

        // Listener para expandir árbol
        const btnExpand = targetContainer.querySelector('#btnExpandTree');
        const preview = targetContainer.querySelector('#compactTreePreview');
        if (btnExpand) btnExpand.onclick = () => this.abrirModalArbol();
        if (preview) preview.onclick = () => this.abrirModalArbol();
    },

    abrirModalArbol() {
        const modal = document.getElementById('treeModal');
        const content = document.getElementById('treeModalContent');
        const datos = this.lastBayesData;
        if (!datos) return;

        const format = (n) => parseFloat(n.toFixed(5)).toString().replace('.', ',');
        
        const N = datos.raiz.length;
        const w = 900;
        const h = Math.max(500, N * 80 + 150);

        const layerX = [150, 450, 750];

        // Y coordinates for nodes in each layer
        const layer0Y = (i) => (h / (N + 1)) * (i + 1);
        const layer1Y = [h * 0.33, h * 0.67]; // Two nodes: A and A_bar
        const layer2Y = [h * 0.33, h * 0.67]; // Two nodes: I and H

        // Obtener la palabra buscada (está en el nombre del hijo 0)
        let palabraText = "Palabra";
        if (datos.raiz[0] && datos.raiz[0].hijos[0]) {
            const match = datos.raiz[0].hijos[0].nombre.match(/"([^"]+)"/);
            if (match) palabraText = match[1];
        }

        let svg = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">`;

        // Definiciones (flechas)
        svg += `
        <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
        </defs>
        `;

        // Oval backgrounds
        const maxL0Y = layer0Y(N-1), minL0Y = layer0Y(0);
        svg += `<ellipse cx="${layerX[0]}" cy="${(maxL0Y+minL0Y)/2}" rx="40" ry="${(maxL0Y-minL0Y)/2 + 40}" fill="none" stroke="#93c5fd" stroke-width="2" opacity="0.5"/>`;
        svg += `<ellipse cx="${layerX[1]}" cy="${h/2}" rx="40" ry="${(layer1Y[1]-layer1Y[0])/2 + 40}" fill="none" stroke="#93c5fd" stroke-width="2" opacity="0.5"/>`;
        svg += `<ellipse cx="${layerX[2]}" cy="${h/2}" rx="40" ry="${(layer2Y[1]-layer2Y[0])/2 + 40}" fill="none" stroke="#93c5fd" stroke-width="2" opacity="0.5"/>`;

        // Titles
        svg += `<text x="${layerX[0]}" y="${minL0Y - 60}" text-anchor="middle" font-weight="bold" fill="#64748b" font-family="sans-serif">π(0)</text>`;
        svg += `<text x="${layerX[1]}" y="${layer1Y[0] - 80}" text-anchor="middle" font-weight="bold" fill="#64748b" font-family="sans-serif">π(1)</text>`;
        svg += `<text x="${layerX[1]}" y="${layer1Y[0] - 60}" text-anchor="middle" font-weight="normal" fill="#3b82f6" font-family="sans-serif" font-style="italic">${palabraText}</text>`;
        svg += `<text x="${layerX[2]}" y="${layer2Y[0] - 60}" text-anchor="middle" font-weight="bold" fill="#64748b" font-family="sans-serif">π(2)</text>`;

        // Draw Line helper
        const drawLine = (x1, y1, x2, y2, prob, highlight, ratio = 0.5) => {
            const color = highlight ? '#3b82f6' : '#94a3b8'; // blue or slate
            const marker = highlight ? 'url(#arrow-blue)' : 'url(#arrow)';
            
            // Dynamic text position along the line
            let mx = x1 + (x2 - x1) * ratio;
            let my = y1 + (y2 - y1) * ratio;

            let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" marker-end="${marker}" />`;
            // Add SVG text with paint-order (clean stroke background, natively supported)
            s += `<text x="${mx}" y="${my}" text-anchor="middle" alignment-baseline="middle" font-size="12" fill="${color}" font-weight="900" font-family="sans-serif" style="paint-order: stroke; stroke-width: 4px; stroke-linecap: round; stroke-linejoin: round;" class="svg-text-bg">${prob}</text>`;
            return s;
        };

        // Draw layer 0 -> 1 lines
        datos.raiz.forEach((libro, i) => {
            const prob0 = format(libro.probCondicional);
            const probA = format(libro.hijos[0].probCondicional);
            const probNoA = format(libro.hijos[1].probCondicional);
            
            // Incoming pi(0) line
            svg += drawLine(layerX[0] - 100, layer0Y(i) - 20, layerX[0] - 25, layer0Y(i), prob0, false, 0.5);

            // Edge to A (fixed at 25% of the line to form a neat left column)
            svg += drawLine(layerX[0], layer0Y(i), layerX[1], layer1Y[0], probA, true, 0.25);
            
            // Edge to A_bar (fixed at 75% of the line to form a neat right column)
            svg += drawLine(layerX[0], layer0Y(i), layerX[1], layer1Y[1], probNoA, false, 0.75);
        });

        // Draw layer 1 -> 2 lines
        const probIA_fromA = format(datos.raiz[0].hijos[0].hijos[0].probCondicional);
        const probH_fromA = format(datos.raiz[0].hijos[0].hijos[1].probCondicional);
        const probIA_fromNoA = format(datos.raiz[0].hijos[1].hijos[0].probCondicional);
        const probH_fromNoA = format(datos.raiz[0].hijos[1].hijos[1].probCondicional);

        // Position text on different ratios so they don't intersect perfectly at 0.5
        // A -> I
        svg += drawLine(layerX[1], layer1Y[0], layerX[2], layer2Y[0], probIA_fromA, false, 0.35);
        // A -> H
        svg += drawLine(layerX[1], layer1Y[0], layerX[2], layer2Y[1], probH_fromA, false, 0.65);
        // A_bar -> I
        svg += drawLine(layerX[1], layer1Y[1], layerX[2], layer2Y[0], probIA_fromNoA, true, 0.65);
        // A_bar -> H
        svg += drawLine(layerX[1], layer1Y[1], layerX[2], layer2Y[1], probH_fromNoA, false, 0.35);

        // Draw nodes
        const drawNode = (x, y, label, color) => {
            let fill = '#ffffff';
            let stroke = '#64748b';
            if (color === 'emerald') { fill = '#ecfdf5'; stroke = '#10b981'; }
            if (color === 'rose') { fill = '#fff1f2'; stroke = '#f43f5e'; }

            return `
            <g transform="translate(${x},${y})">
                <circle r="20" fill="${fill}" stroke="${stroke}" stroke-width="2" />
                <text text-anchor="middle" alignment-baseline="central" font-weight="bold" font-family="sans-serif" font-size="16" fill="#1e293b">${label}</text>
            </g>
            `;
        };

        datos.raiz.forEach((libro, i) => {
            let nameChar = String.fromCharCode(65 + i); // A, B, C, D...
            svg += drawNode(layerX[0], layer0Y(i), nameChar, ''); 
        });

        // Layer 1
        svg += drawNode(layerX[1], layer1Y[0], 'A', '');
        svg += drawNode(layerX[1], layer1Y[1], 'Ā', '');

        // Layer 2
        svg += drawNode(layerX[2], layer2Y[0], 'I', 'rose');
        svg += drawNode(layerX[2], layer2Y[1], 'H', 'emerald');

        svg += `</svg>`;

        let legendHTML = `<div class="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-700 dark:text-slate-300 shadow-inner">`;
        datos.raiz.forEach((libro, i) => {
            let nameChar = String.fromCharCode(65 + i);
            legendHTML += `<div class="flex items-center gap-2"><span class="font-bold bg-white dark:bg-slate-700 px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-600">${nameChar}</span> <span class="truncate max-w-[200px] block" title="${libro.nombre}">${libro.nombre}</span></div>`;
        });
        legendHTML += `</div>`;

        content.innerHTML = `
            <style>
                .svg-text-bg { stroke: #ffffff; }
                .dark .svg-text-bg { stroke: #0f172a; }
            </style>
            <div class="bayes-tree-wrapper flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl w-full">
                <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest mb-2">Red Bayesiana</h3>
                <p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Grafo de transición Acíclico (DAG)</p>
                <div class="w-full max-w-4xl overflow-x-auto no-scrollbar">
                    <div class="min-w-[700px]">
                        ${svg}
                    </div>
                </div>
                ${legendHTML}
            </div>
        `;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('overflow-hidden');

        // Bind cierre
        document.getElementById('closeTreeModalBg').onclick = () => this.cerrarModalArbol();
        const btnClose = document.getElementById('btnCloseTreeModal');
        if (btnClose) btnClose.onclick = () => this.cerrarModalArbol();
    },

    descargarArbolPDF() {
        // Seleccionamos el contenedor real del árbol (sin scrollbars ni bordes de modal)
        const element = document.querySelector('.bayes-tree-wrapper');
        if (!element) return;

        const fileName = `bayes_tree_${new Date().getTime()}.pdf`;
        
        // Configuración robusta para una sola página
        const opt = {
            margin: [5, 5, 5, 5],
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                logging: false,
                letterRendering: true,
                // Forzamos a que capture el ancho total del contenido
                width: element.scrollWidth,
                height: element.scrollHeight,
                onclone: (clonedDoc) => {
                    // En el clon (lo que se verá en el PDF), forzamos tema claro
                    const clonedElement = clonedDoc.querySelector('.bayes-tree-wrapper');
                    clonedElement.style.background = '#ffffff';
                    clonedElement.style.color = '#000000';
                    clonedElement.style.padding = '40px';
                    
                    // Aseguramos que todos los textos sean visibles y negros
                    clonedElement.querySelectorAll('.tree-label').forEach(el => {
                        el.style.background = '#ffffff';
                        el.style.color = '#1e293b';
                        el.style.borderColor = '#e2e8f0';
                    });
                }
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'landscape',
                compress: true
            }
        };

        // Mostrar un indicador de carga simple si fuera necesario
        const btn = document.getElementById('btnDownloadTree');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span>⏳</span> Generando PDF...';
        btn.disabled = true;

        // Pequeño delay para asegurar estabilidad del DOM
        setTimeout(() => {
            html2pdf().set(opt).from(element).save().then(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }).catch(err => {
                console.error("Error al generar PDF:", err);
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
        }, 500);
    },

    cerrarModalArbol() {
        const modal = document.getElementById('treeModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        document.body.classList.remove('overflow-hidden');
    },

    renderizarResultado(titulo, resObj, container = null) {
        this.evidenciasCombo = null;
        this.selectedEvidencia = null;
        this._renderCore(titulo, {
            concepto: resObj.concepto,
            formula: resObj.formula,
            pasos: resObj.pasos,
            tablas: resObj.tablas,
            resultado: resObj.resultado,
            resultadoLabel: resObj.resultadoLabel,
            ocultarConclusion: resObj.ocultarConclusion,
            markovHtml: resObj.markovHtml,
            datosGrafico: resObj.datosGrafico,
            datosArbol: resObj.datosArbol
        }, container);
    },

    renderizarResultadoConCombo(titulo, resObj, evidenciasCombo, selectedEvidencia, container = null) {
        this.evidenciasCombo = evidenciasCombo;
        this.selectedEvidencia = selectedEvidencia;
        this._renderCore(titulo, {
            concepto: resObj.concepto,
            formula: resObj.formula,
            pasos: resObj.pasos,
            tablas: resObj.tablas,
            resultado: resObj.resultado,
            resultadoLabel: resObj.resultadoLabel,
            ocultarConclusion: resObj.ocultarConclusion,
            markovHtml: resObj.markovHtml,
            datosGrafico: resObj.datosGrafico,
            datosArbol: resObj.datosArbol
        }, container);
    },

    renderDetallado(titulo, resObj) {
        this._renderCore(titulo, {
            concepto: resObj.concepto,
            formula: resObj.formula,
            formulaHtml: resObj.formulaHtml,
            pasos: resObj.detallado.pasos,
            tablas: resObj.detallado.tablas,
            resultado: resObj.resultado,
            resultadoLabel: resObj.resultadoLabel,
            numIntermedios: resObj.resultadosIntermedios,
            interpretacionHtml: resObj.interpretacionHtml,
            operacionesGeneralesHtml: resObj.detallado.operacionesGeneralesHtml,
            datosGrafico: resObj.datosGrafico
        });
    },

    renderResumen(titulo, resObj) {
        this._renderCore(titulo, {
            concepto: resObj.concepto,
            formula: resObj.formula,
            pasos: resObj.resumen.pasos || [],
            tablas: resObj.resumen.tablas,
            resultado: resObj.resultado,
            resultadoLabel: resObj.resultadoLabel,
            interpretacionHtml: resObj.interpretacionHtml,
            operacionesGeneralesHtml: resObj.resumen.operacionesGeneralesHtml,
            datosGrafico: resObj.datosGrafico
        });
    },

    /**
     * Renderiza botones para cada columna encontrada en el Excel/CSV
     * @param {Object} columnsData Map de { colName: [values] }
     * @param {Function} onSelect Callback (colName, values)
     */
    renderizarSelectorColumnas(columnsData, onSelect) {
        const container = document.getElementById('excelColumnSelector');
        const buttonsDiv = document.getElementById('columnButtons');
        const btnVerExcel = document.getElementById('btnVerExcel');
        
        buttonsDiv.innerHTML = '';
        container.classList.remove('hidden');
        if (btnVerExcel) btnVerExcel.classList.remove('hidden');

        Object.keys(columnsData).forEach(colName => {
            const btn = document.createElement('button');
            btn.className = "px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 group";
            
            const count = columnsData[colName].length;
            btn.innerHTML = `
                <span class="w-2 h-2 rounded-full bg-indigo-400 group-hover:bg-indigo-600"></span>
                ${colName} 
                <span class="bg-indigo-50 dark:bg-indigo-900/40 text-[10px] px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-medium">${count} datos</span>
            `;
            
            btn.addEventListener('click', () => {
                // Desmarcar otros
                Array.from(buttonsDiv.children).forEach(b => b.classList.remove('border-indigo-600', 'ring-2', 'ring-indigo-100'));
                // Marcar este
                btn.classList.add('border-indigo-600', 'ring-2', 'ring-indigo-100');
                
                onSelect(colName, columnsData[colName]);
            });
            
            
            buttonsDiv.appendChild(btn);
        });
    },

    /**
     * Renderiza una tabla estilo Excel en el modal
     * @param {Array} rawData Arreglo de objetos (filas)
     * @param {Object} columnsData Map de { colName: [values] }
     * @param {Function} onSelect Callback (colName, values)
     */
    renderizarTablaExcel(rawData, columnsData, onSelect) {
        const container = document.getElementById('modalTableContainer');
        const columns = Object.keys(rawData[0]);
        
        let html = `
            <table class="min-w-full bg-white dark:bg-slate-900 border-collapse border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
                <thead>
                    <tr class="bg-slate-100 dark:bg-slate-800">
                        <th class="border border-slate-200 dark:border-slate-700 p-2 text-slate-400 w-10">#</th>
                        ${columns.map(col => `
                            <th class="border border-slate-200 dark:border-slate-700 p-0 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer group" data-col="${col}">
                                <div class="flex flex-col p-3 gap-1">
                                    <span class="text-[10px] text-indigo-500 font-black uppercase text-center block opacity-50 group-hover:opacity-100">Cargar Columna</span>
                                    <span class="text-slate-800 dark:text-slate-100 font-bold text-center">${col}</span>
                                </div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rawData.slice(0, 100).map((row, i) => `
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td class="border border-slate-200 dark:border-slate-700 p-2 text-center bg-slate-50 dark:bg-slate-800/50 font-mono text-slate-400">${i + 1}</td>
                            ${columns.map(col => `
                                <td class="border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400">${row[col] !== undefined ? row[col] : ''}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        if (rawData.length > 100) {
            html += `<div class="p-4 text-center text-slate-500 text-[10px] italic">Mostrando las primeras 100 filas de ${rawData.length}...</div>`;
        }

        container.innerHTML = html;

        // Añadir eventos a los encabezados
        container.querySelectorAll('th[data-col]').forEach(th => {
            th.addEventListener('click', () => {
                const colName = th.getAttribute('data-col');
                if (columnsData[colName]) {
                    onSelect(colName, columnsData[colName]);
                    
                    // Efecto de feedback en el modal
                    th.classList.add('bg-indigo-100', 'dark:bg-indigo-900');
                    setTimeout(() => th.classList.remove('bg-indigo-100', 'dark:bg-indigo-900'), 500);
                }
            });
        });
    }
};
