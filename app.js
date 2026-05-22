function normalizeDocument(value) {
  return String(value ?? "")
    .trim()
    .replace(/[.\s-]/g, "");
}

function formatNumber(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-AR").format(n);
}

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function toNumberLoose(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value ?? "").trim();
  if (!s) return null;
  // Manejo simple de separadores: "1.234,56" o "1234,56"
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function mean(values) {
  const nums = values.filter(isFiniteNumber);
  if (nums.length === 0) return null;
  const sum = nums.reduce((acc, v) => acc + v, 0);
  return sum / nums.length;
}

function median(values) {
  const nums = values.filter(isFiniteNumber).slice().sort((a, b) => a - b);
  const n = nums.length;
  if (n === 0) return null;
  const mid = Math.floor(n / 2);
  if (n % 2 === 1) return nums[mid];
  return (nums[mid - 1] + nums[mid]) / 2;
}

function mode(values) {
  const nums = values.filter(isFiniteNumber);
  if (nums.length === 0) return null;

  const counts = new Map();
  for (const v of nums) counts.set(v, (counts.get(v) ?? 0) + 1);

  let bestCount = 0;
  for (const c of counts.values()) bestCount = Math.max(bestCount, c);

  // Si todos aparecen 1 vez, no hay moda "clara"
  if (bestCount <= 1) return null;

  const modes = [];
  for (const [v, c] of counts.entries()) {
    if (c === bestCount) modes.push(v);
  }
  modes.sort((a, b) => a - b);
  return modes;
}

function rangeStat(values) {
  const nums = values.filter(isFiniteNumber).slice().sort((a, b) => a - b);
  if (nums.length === 0) return null;
  return nums[nums.length - 1] - nums[0];
}

function varianceSample(values) {
  const nums = values.filter(isFiniteNumber);
  if (nums.length < 2) return null;
  const m = mean(nums);
  const sum = nums.reduce((acc, v) => acc + (v - m) ** 2, 0);
  return sum / (nums.length - 1);
}

function stdevSample(values) {
  const v = varianceSample(values);
  return v == null ? null : Math.sqrt(v);
}

function cvPercent(values) {
  const nums = values.filter(isFiniteNumber);
  if (nums.length < 2) return null;
  const m = mean(nums);
  const s = stdevSample(nums);
  if (m == null || s == null || m === 0) return null;
  return (s / Math.abs(m)) * 100;
}

/**
 * Pasos con números concretos para enseñar (se muestran debajo de "Paso a paso").
 * @returns {string[] | null}
 */
function pedagogicalStepsForModule(moduleId, nums) {
  const a = nums.filter(isFiniteNumber);
  if (a.length === 0) return null;

  if (moduleId === "drango") {
    const sorted = a.slice().sort((x, y) => x - y);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const r = max - min;
    return [
      `Paso 1: Tomamos los datos de la fila (en el orden de las columnas elegidas): ${a.map((x) => formatNumber(x)).join(", ")}.`,
      `Paso 2: Los ordenamos de menor a mayor para ubicar bien el extremo inferior y el superior: ${sorted.map((x) => formatNumber(x)).join(", ")}.`,
      `Paso 3: El valor máximo (el más grande) es ${formatNumber(max)}.`,
      `Paso 4: El valor mínimo (el más chico) es ${formatNumber(min)}.`,
      `Paso 5: El rango = máximo − mínimo → ${formatNumber(max)} − ${formatNumber(min)} = ${formatNumber(r)}.`,
    ];
  }

  if (moduleId === "tmedia") {
    const sum = a.reduce((s, x) => s + x, 0);
    const n = a.length;
    const m = sum / n;
    const terms = a.map((x) => formatNumber(x)).join(" + ");
    return [
      `Paso 1: Datos: ${terms}.`,
      `Paso 2: Sumamos todos los valores: ${terms} = ${formatNumber(sum)}.`,
      `Paso 3: Contamos cuántos hay: n = ${n}.`,
      `Paso 4: Media aritmética = suma / n = ${formatNumber(sum)} / ${n} = ${formatNumber(m)}.`,
    ];
  }

  if (moduleId === "tmediana") {
    const sorted = a.slice().sort((x, y) => x - y);
    const n = sorted.length;
    const mid = Math.floor(n / 2);
    if (n % 2 === 1) {
      return [
        `Paso 1: Ordenamos los datos: ${sorted.map((x) => formatNumber(x)).join(", ")}.`,
        `Paso 2: Hay ${n} valores (cantidad impar). La mediana es el que queda en el centro.`,
        `Paso 3: Mediana = ${formatNumber(sorted[mid])}.`,
      ];
    }
    const lo = sorted[mid - 1];
    const hi = sorted[mid];
    return [
      `Paso 1: Ordenamos los datos: ${sorted.map((x) => formatNumber(x)).join(", ")}.`,
      `Paso 2: Hay ${n} valores (cantidad par). La mediana es el promedio de los dos del medio.`,
      `Paso 3: Los dos valores centrales son ${formatNumber(lo)} y ${formatNumber(hi)}.`,
      `Paso 4: Mediana = (${formatNumber(lo)} + ${formatNumber(hi)}) / 2 = ${formatNumber((lo + hi) / 2)}.`,
    ];
  }

  if (moduleId === "tmoda") {
    const counts = new Map();
    for (const v of a) counts.set(v, (counts.get(v) ?? 0) + 1);
    let best = 0;
    for (const c of counts.values()) best = Math.max(best, c);
    if (best <= 1) {
      return [
        `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
        `Paso 2: Contamos cuántas veces aparece cada valor; todos aparecen solo una vez.`,
        `Paso 3: No hay moda clara (no hay valor más frecuente que otro).`,
      ];
    }
    const modes = [...counts.entries()].filter(([, c]) => c === best).map(([v]) => v);
    modes.sort((x, y) => x - y);
    const freqLines = [...counts.entries()]
      .sort((x, y) => x[0] - y[0])
      .map(([v, c]) => `${formatNumber(v)} aparece ${c} vez/veces`);
    return [
      `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
      `Paso 2: Frecuencia de cada valor: ${freqLines.join("; ")}.`,
      `Paso 3: El mayor conteo es ${best}. Moda = ${modes.map((v) => formatNumber(v)).join(", ")}.`,
    ];
  }

  if (moduleId === "dvar" && a.length >= 2) {
    const m = mean(a);
    const sumSq = a.reduce((s, x) => s + (x - m) ** 2, 0);
    const v = sumSq / (a.length - 1);
    return [
      `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
      `Paso 2: Media muestral x̄ = suma / n = ${formatNumber(m)}.`,
      `Paso 3: Sumamos (cada dato − media)² → suma de cuadrados SC = ${formatNumber(sumSq)}.`,
      `Paso 4: Varianza muestral s² = SC / (n − 1) = ${formatNumber(sumSq)} / ${a.length - 1} = ${formatNumber(v)}.`,
    ];
  }

  if (moduleId === "dde" && a.length >= 2) {
    const m = mean(a);
    const sumSq = a.reduce((s, x) => s + (x - m) ** 2, 0);
    const v = sumSq / (a.length - 1);
    const s = Math.sqrt(v);
    return [
      `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
      `Paso 2: Media muestral x̄ = ${formatNumber(m)}.`,
      `Paso 3: SC = suma de (dato − x̄)² = ${formatNumber(sumSq)}.`,
      `Paso 4: Varianza muestral s² = SC / (n − 1) = ${formatNumber(sumSq)} / ${a.length - 1} = ${formatNumber(v)}.`,
      `Paso 5: Desviación estándar s = √s² = ${formatNumber(s)}.`,
    ];
  }

  if (moduleId === "dcv" && a.length >= 2) {
    const m = mean(a);
    const s = stdevSample(a);
    if (m == null || s == null) return null;
    if (m === 0) {
      return [
        `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
        `Paso 2: Calculamos media y desviación estándar muestral.`,
        `Paso 3: La media da 0, por lo tanto no se puede dividir por |media|.`,
        `Paso 4: El coeficiente de variación no está definido en este caso.`,
      ];
    }
    const cv = (s / Math.abs(m)) * 100;
    return [
      `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
      `Paso 2: Media muestral x̄ = ${formatNumber(m)}.`,
      `Paso 3: Desviación estándar muestral s = ${formatNumber(s)}.`,
      `Paso 4: Coeficiente de variación CV = (s / |x̄|) × 100 = (${formatNumber(s)} / ${formatNumber(Math.abs(m))}) × 100 = ${formatNumber(cv)}%.`,
    ];
  }

  if (moduleId === "emma3" && a.length >= 3) {
    const out = [];
    out.push(`Paso 1: Datos en orden: ${a.map((x) => formatNumber(x)).join(", ")}.`);
    out.push("Paso 2: Formamos ventanas consecutivas de 3 valores y promediamos cada una.");
    for (let i = 0; i <= a.length - 3; i++) {
      const w = [a[i], a[i + 1], a[i + 2]];
      const m = (w[0] + w[1] + w[2]) / 3;
      out.push(
        `Ventana ${i + 1}: (${formatNumber(w[0])} + ${formatNumber(w[1])} + ${formatNumber(w[2])}) / 3 = ${formatNumber(m)}.`,
      );
    }
    return out;
  }

  if (moduleId === "emma4" && a.length >= 4) {
    const out = [];
    out.push(`Paso 1: Datos en orden: ${a.map((x) => formatNumber(x)).join(", ")}.`);
    out.push("Paso 2: Formamos ventanas consecutivas de 4 valores y promediamos cada una.");
    for (let i = 0; i <= a.length - 4; i++) {
      const w = [a[i], a[i + 1], a[i + 2], a[i + 3]];
      const m = (w[0] + w[1] + w[2] + w[3]) / 4;
      out.push(
        `Ventana ${i + 1}: (${formatNumber(w[0])} + ${formatNumber(w[1])} + ${formatNumber(w[2])} + ${formatNumber(w[3])}) / 4 = ${formatNumber(m)}.`,
      );
    }
    return out;
  }

  if (moduleId === "emg") {
    if (a.some((x) => x <= 0)) {
      return [
        `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
        "Paso 2: La media geométrica exige que todos los valores sean mayores que 0.",
        "Paso 3: Hay al menos un valor <= 0, por eso no se puede calcular.",
      ];
    }
    const prod = a.reduce((p, x) => p * x, 1);
    const gm = Math.exp(a.reduce((s, x) => s + Math.log(x), 0) / a.length);
    return [
      `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
      `Paso 2: Producto total Πxi = ${formatNumber(prod)}.`,
      `Paso 3: n = ${a.length}. Media geométrica = (Πxi)^(1/n) = (${formatNumber(prod)})^(1/${a.length}) = ${formatNumber(gm)}.`,
    ];
  }

  if (moduleId === "emh") {
    if (a.some((x) => x === 0)) {
      return [
        `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
        "Paso 2: La media armónica no admite ceros porque usa recíprocos (1/xi).",
        "Paso 3: Hay al menos un valor 0, por eso no se puede calcular.",
      ];
    }
    const invTerms = a.map((x) => 1 / x);
    const invSum = invTerms.reduce((s, x) => s + x, 0);
    const hm = a.length / invSum;
    return [
      `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
      `Paso 2: Calculamos recíprocos: ${invTerms.map((x) => x.toFixed(6)).join(", ")}.`,
      `Paso 3: Sumamos recíprocos: Σ(1/xi) = ${invSum.toFixed(6)}.`,
      `Paso 4: Media armónica H = n / Σ(1/xi) = ${a.length} / ${invSum.toFixed(6)} = ${formatNumber(hm)}.`,
    ];
  }

  if (moduleId === "cuart") {
    const sorted = a.slice().sort((x, y) => x - y);
    const q1 = quantileSorted(sorted, 0.25);
    const q2 = quantileSorted(sorted, 0.5);
    const q3 = quantileSorted(sorted, 0.75);
    return [
      `Paso 1: Ordenamos los datos: ${sorted.map((x) => formatNumber(x)).join(", ")}.`,
      "Paso 2: Ubicamos posiciones 25%, 50% y 75% con interpolación lineal.",
      `Paso 3: Q1 = ${formatNumber(q1)}, Q2 = ${formatNumber(q2)}, Q3 = ${formatNumber(q3)}.`,
    ];
  }

  if (moduleId === "decil") {
    const sorted = a.slice().sort((x, y) => x - y);
    const parts = [];
    for (let k = 1; k <= 9; k++) parts.push(`D${k}=${formatNumber(quantileSorted(sorted, k / 10))}`);
    return [
      `Paso 1: Ordenamos los datos: ${sorted.map((x) => formatNumber(x)).join(", ")}.`,
      "Paso 2: Calculamos los puntos de corte 10%, 20%, ..., 90% con interpolación lineal.",
      `Paso 3: ${parts.join(" | ")}.`,
    ];
  }

  if (moduleId === "perc") {
    const sorted = a.slice().sort((x, y) => x - y);
    const ps = [1, 5, 10, 25, 50, 75, 90, 95, 99];
    const parts = ps.map((p) => `P${p}=${formatNumber(quantileSorted(sorted, p / 100))}`);
    return [
      `Paso 1: Ordenamos los datos: ${sorted.map((x) => formatNumber(x)).join(", ")}.`,
      "Paso 2: Calculamos percentiles seleccionados con interpolación lineal.",
      `Paso 3: ${parts.join(" | ")}.`,
    ];
  }

  if (moduleId === "dfreq") {
    const rows = frequencyDistributionRows(a);
    return [
      `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
      "Paso 2: Contamos cuántas veces aparece cada valor (frecuencia absoluta fi).",
      `Paso 3: Resultado: ${rows.map((r) => `${formatNumber(r.value)}→fi=${r.fi}, Fi=${r.Fi}, hi=${(r.hi * 100).toFixed(2)}%`).join(" | ")}.`,
    ];
  }

  if (moduleId === "asim" && a.length >= 3) {
    const m = mean(a);
    const s = stdevSample(a);
    if (m == null || s == null || s === 0) {
      return [
        `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
        "Paso 2: Para asimetría se necesita desviación estándar distinta de cero.",
        "Paso 3: Como s = 0 o no definida, no puede calcularse el sesgo.",
      ];
    }
    const n = a.length;
    const sumCub = a.reduce((acc, x) => acc + ((x - m) / s) ** 3, 0);
    const g1 = (n / ((n - 1) * (n - 2))) * sumCub;
    return [
      `Paso 1: Calculamos x̄ = ${formatNumber(m)} y s = ${formatNumber(s)}.`,
      `Paso 2: Sumamos [((xi−x̄)/s)^3] = ${formatNumber(sumCub)}.`,
      `Paso 3: g1 = n/((n−1)(n−2)) × suma = ${n}/((${n - 1})(${n - 2})) × ${formatNumber(sumCub)} = ${formatNumber(g1)}.`,
    ];
  }

  if (moduleId === "curt" && a.length >= 4) {
    const n = a.length;
    const m = mean(a);
    const s = stdevSample(a);
    if (m == null || s == null || s === 0) {
      return [
        `Paso 1: Datos: ${a.map((x) => formatNumber(x)).join(", ")}.`,
        "Paso 2: Para curtosis se requiere desviación estándar distinta de cero.",
        "Paso 3: Como s = 0 o no definida, no puede calcularse.",
      ];
    }
    const sum4 = a.reduce((acc, x) => acc + ((x - m) / s) ** 4, 0);
    const num = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * sum4;
    const den = (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
    const g2 = num - den;
    return [
      `Paso 1: Calculamos x̄ = ${formatNumber(m)} y s = ${formatNumber(s)}.`,
      `Paso 2: Sumamos [((xi−x̄)/s)^4] = ${formatNumber(sum4)}.`,
      `Paso 3: Curtosis de exceso = A − B, donde A = ${formatNumber(num)} y B = ${formatNumber(den)}.`,
      `Paso 4: g2 = ${formatNumber(g2)}.`,
    ];
  }

  return null;
}

/** Cuantil con interpolación lineal (p en [0,1]) sobre datos ordenados. */
function quantileSorted(sorted, p) {
  const n = sorted.length;
  if (n === 0) return null;
  if (p <= 0) return sorted[0];
  if (p >= 1) return sorted[n - 1];
  const pos = p * (n - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo]);
}

function movingAverageSeries(nums, windowSize) {
  const a = nums.filter(isFiniteNumber);
  if (a.length < windowSize || windowSize < 1) return null;
  const out = [];
  for (let i = 0; i <= a.length - windowSize; i++) {
    let s = 0;
    for (let j = 0; j < windowSize; j++) s += a[i + j];
    out.push(s / windowSize);
  }
  return out;
}

function geometricMean(nums) {
  const a = nums.filter(isFiniteNumber);
  if (a.length === 0) return null;
  if (a.some((x) => x <= 0)) return null;
  const logSum = a.reduce((acc, x) => acc + Math.log(x), 0);
  return Math.exp(logSum / a.length);
}

function harmonicMean(nums) {
  const a = nums.filter(isFiniteNumber);
  if (a.length === 0) return null;
  if (a.some((x) => x === 0)) return null;
  const invSum = a.reduce((acc, x) => acc + 1 / x, 0);
  return a.length / invSum;
}

function quartilesText(sorted) {
  if (sorted.length === 0) return "—";
  const q1 = quantileSorted(sorted, 0.25);
  const q2 = quantileSorted(sorted, 0.5);
  const q3 = quantileSorted(sorted, 0.75);
  return `Q1 = ${formatNumber(q1)}  |  Q2 = ${formatNumber(q2)}  |  Q3 = ${formatNumber(q3)}`;
}

function decilesText(sorted) {
  if (sorted.length === 0) return "—";
  const parts = [];
  for (let k = 1; k <= 9; k++) {
    const v = quantileSorted(sorted, k / 10);
    parts.push(`D${k} = ${formatNumber(v)}`);
  }
  return parts.join("  |  ");
}

function percentilesCommonText(sorted) {
  if (sorted.length === 0) return "—";
  const ps = [1, 5, 10, 25, 50, 75, 90, 95, 99];
  return ps
    .map((p) => {
      const v = quantileSorted(sorted, p / 100);
      return `P${p} = ${formatNumber(v)}`;
    })
    .join("  |  ");
}

function frequencyDistributionText(nums) {
  const a = nums.filter(isFiniteNumber);
  if (a.length === 0) return "—";
  const counts = new Map();
  for (const x of a) counts.set(x, (counts.get(x) ?? 0) + 1);
  const keys = [...counts.keys()].sort((x, y) => x - y);
  return keys.map((k) => `${formatNumber(k)} → ${counts.get(k)}`).join("  |  ");
}

function frequencyDistributionRows(nums) {
  const a = nums.filter(isFiniteNumber);
  if (a.length === 0) return [];
  const counts = new Map();
  for (const x of a) counts.set(x, (counts.get(x) ?? 0) + 1);
  const keys = [...counts.keys()].sort((x, y) => x - y);
  const n = a.length;
  let cumulative = 0;
  return keys.map((k) => {
    const fi = counts.get(k) ?? 0;
    cumulative += fi;
    const hi = fi / n;
    const Hi = cumulative / n;
    return { value: k, fi, Fi: cumulative, hi, Hi };
  });
}

function clearCanvas(canvas, text = "Sin datos para graficar.") {
  const ctx = canvas?.getContext?.("2d");
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

function drawBarChart(canvas, labels, values, title) {
  const ctx = canvas?.getContext?.("2d");
  if (!ctx || !canvas) return;
  if (!labels.length || !values.length) {
    clearCanvas(canvas);
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  const pad = { left: 52, right: 18, top: 28, bottom: 48 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const maxY = Math.max(1, ...values);
  const band = plotW / labels.length;
  const barW = Math.max(10, band * 0.62);

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, h - pad.bottom);
  ctx.lineTo(w - pad.right, h - pad.bottom);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "700 14px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(title, pad.left, 18);

  ctx.font = "11px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const yVal = (maxY * i) / ticks;
    const y = h - pad.bottom - (plotH * i) / ticks;
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillText(String(Math.round(yVal * 100) / 100), pad.left - 8, y + 4);
  }

  for (let i = 0; i < labels.length; i++) {
    const x = pad.left + i * band + (band - barW) / 2;
    const barH = (values[i] / maxY) * plotH;
    const y = h - pad.bottom - barH;
    ctx.fillStyle = "rgba(124, 58, 237, 0.85)";
    ctx.fillRect(x, y, barW, barH);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.font = "11px sans-serif";
    ctx.fillText(String(values[i]), x + barW / 2, y - 5);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(labels[i], x + barW / 2, h - pad.bottom + 16);
  }
}

function drawLineChart(canvas, values, title) {
  const ctx = canvas?.getContext?.("2d");
  if (!ctx || !canvas) return;
  if (!values.length) {
    clearCanvas(canvas);
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  const pad = { left: 52, right: 18, top: 28, bottom: 42 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const range = maxY - minY || 1;

  const xAt = (i) => pad.left + (i * plotW) / Math.max(1, values.length - 1);
  const yAt = (v) => h - pad.bottom - ((v - minY) / range) * plotH;

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, h - pad.bottom);
  ctx.lineTo(w - pad.right, h - pad.bottom);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "700 14px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(title, pad.left, 18);

  ctx.strokeStyle = "rgba(34, 197, 94, 0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < values.length; i++) {
    const x = xAt(i);
    const y = yAt(values[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  for (let i = 0; i < values.length; i++) {
    const x = xAt(i);
    const y = yAt(values[i]);
    ctx.fillStyle = "rgba(34, 197, 94, 1)";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(i + 1), x, h - pad.bottom + 15);
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(formatNumber(maxY), pad.left - 8, pad.top + 6);
  ctx.fillText(formatNumber(minY), pad.left - 8, h - pad.bottom + 4);
}

function drawPieChart(canvas, labels, values, title) {
  const ctx = canvas?.getContext?.("2d");
  if (!ctx || !canvas) return;
  if (!labels.length || !values.length) {
    clearCanvas(canvas);
    return;
  }
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    clearCanvas(canvas);
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  const cx = Math.floor(w * 0.3);
  const cy = Math.floor(h * 0.55);
  const r = Math.min(110, Math.floor(Math.min(w, h) * 0.28));
  const colors = [
    "#7c3aed",
    "#22c55e",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#14b8a6",
    "#eab308",
    "#8b5cf6",
  ];
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "700 14px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(title, 16, 18);
  let start = -Math.PI / 2;
  for (let i = 0; i < labels.length; i++) {
    const frac = values[i] / total;
    const end = start + frac * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    start = end;
  }
  const lx = Math.floor(w * 0.58);
  let ly = 46;
  ctx.font = "12px sans-serif";
  for (let i = 0; i < labels.length; i++) {
    const pct = ((values[i] / total) * 100).toFixed(1);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(lx, ly - 10, 12, 12);
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.fillText(`${labels[i]}: ${pct}%`, lx + 18, ly);
    ly += 18;
    if (ly > h - 8) break;
  }
}

function drawCumulativeChart(canvas, labels, cumulativeValues, title) {
  const ctx = canvas?.getContext?.("2d");
  if (!ctx || !canvas) return;
  if (!labels.length || !cumulativeValues.length) {
    clearCanvas(canvas);
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  const pad = { left: 52, right: 18, top: 28, bottom: 44 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const maxY = Math.max(1, ...cumulativeValues);
  const xAt = (i) => pad.left + (i * plotW) / Math.max(1, cumulativeValues.length - 1);
  const yAt = (v) => h - pad.bottom - (v / maxY) * plotH;

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, h - pad.bottom);
  ctx.lineTo(w - pad.right, h - pad.bottom);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "700 14px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(title, pad.left, 18);

  ctx.strokeStyle = "rgba(59, 130, 246, 0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < cumulativeValues.length; i++) {
    const x = xAt(i);
    const y = yAt(cumulativeValues[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "11px sans-serif";
  for (let i = 0; i < labels.length; i++) {
    const x = xAt(i);
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x, h - pad.bottom + 16);
  }
}

function histogramBins(nums) {
  const a = nums.filter(isFiniteNumber);
  if (a.length < 2) return [];
  const min = Math.min(...a);
  const max = Math.max(...a);
  if (min === max) return [{ label: `[${formatNumber(min)}, ${formatNumber(max)}]`, count: a.length }];
  const k = Math.max(3, Math.min(8, Math.round(1 + 3.322 * Math.log10(a.length))));
  const width = (max - min) / k;
  const bins = Array.from({ length: k }, (_, i) => {
    const lo = min + i * width;
    const hi = i === k - 1 ? max : min + (i + 1) * width;
    return { lo, hi, count: 0 };
  });
  for (const x of a) {
    let idx = Math.floor((x - min) / width);
    if (idx >= k) idx = k - 1;
    if (idx < 0) idx = 0;
    bins[idx].count += 1;
  }
  return bins.map((b, i) => {
    const close = i === bins.length - 1 ? "]" : ")";
    return { label: `[${formatNumber(b.lo)}, ${formatNumber(b.hi)}${close}`, count: b.count };
  });
}

/** Sesgo muestral (similar a SKEW en Excel). */
function skewnessSample(nums) {
  const a = nums.filter(isFiniteNumber);
  const n = a.length;
  if (n < 3) return null;
  const m = mean(a);
  const s = stdevSample(a);
  if (s == null || s === 0) return null;
  const sumCub = a.reduce((acc, x) => acc + ((x - m) / s) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * sumCub;
}

/** Curtosis de exceso muestral (similar a KURT en Excel). */
function kurtosisExcessSample(nums) {
  const a = nums.filter(isFiniteNumber);
  const n = a.length;
  if (n < 4) return null;
  const m = mean(a);
  const s = stdevSample(a);
  if (s == null || s === 0) return null;
  const sum4 = a.reduce((acc, x) => acc + ((x - m) / s) ** 4, 0);
  const num = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * sum4;
  const den = (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  return num - den;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function columnNumericPopulation(rows, colIdx) {
  const out = [];
  for (const row of rows) {
    const n = toNumberLoose(row?.[colIdx]);
    if (n != null) out.push(n);
  }
  return out;
}

function sampleSRS(pop, n) {
  if (!pop.length || n <= 0) return [];
  const sh = shuffle(pop);
  return sh.slice(0, Math.min(n, pop.length));
}

function sampleSystematic(pop, n) {
  if (!pop.length || n <= 0) return [];
  const nClamped = Math.min(n, pop.length);
  const k = Math.max(1, Math.floor(pop.length / nClamped));
  const start = Math.floor(Math.random() * Math.min(k, pop.length));
  const out = [];
  for (let i = 0; i < nClamped; i++) {
    const idx = start + i * k;
    if (idx < pop.length) out.push(pop[idx]);
  }
  return out;
}

function sampleStratified(rows, stratumCol, valueCol, n) {
  const groups = new Map();
  for (const row of rows) {
    const key = String(row?.[stratumCol] ?? "").trim() || "(vacío)";
    const v = toNumberLoose(row?.[valueCol]);
    if (v == null) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(v);
  }
  const strata = [...groups.entries()].filter(([, arr]) => arr.length > 0);
  const N = strata.reduce((s, [, a]) => s + a.length, 0);
  if (N === 0 || n <= 0) return { sample: [], note: "Sin datos válidos." };

  const alloc = strata.map(([key, arr]) => {
    const exact = (n * arr.length) / N;
    return { key, arr, ni: Math.floor(exact), frac: exact - Math.floor(exact) };
  });
  let used = alloc.reduce((s, x) => s + x.ni, 0);
  let rem = n - used;
  const idxOrder = alloc
    .map((x, i) => ({ i, f: x.frac }))
    .sort((a, b) => b.f - a.f)
    .map((x) => x.i);
  for (let j = 0; j < rem; j++) {
    const idx = idxOrder[j % idxOrder.length];
    if (idx != null) alloc[idx].ni += 1;
  }

  const sample = [];
  const detail = [];
  for (const { key, arr, ni } of alloc) {
    const take = Math.min(ni, arr.length);
    detail.push(`${key}: n=${take}`);
    sample.push(...shuffle(arr).slice(0, take));
  }
  return { sample, note: detail.join(" | ") };
}

function sampleCluster(rows, clusterCol, valueCol, m) {
  const clusters = new Map();
  for (const row of rows) {
    const c = String(row?.[clusterCol] ?? "").trim() || "(vacío)";
    const v = toNumberLoose(row?.[valueCol]);
    if (v == null) continue;
    if (!clusters.has(c)) clusters.set(c, []);
    clusters.get(c).push(v);
  }
  const keys = [...clusters.keys()];
  if (!keys.length || m <= 0) return { sample: [], chosen: [], note: "Sin conglomerados válidos." };
  const mClamped = Math.min(m, keys.length);
  const chosen = shuffle(keys).slice(0, mClamped);
  const sample = [];
  for (const k of chosen) sample.push(...clusters.get(k));
  return { sample, chosen, note: `Conglomerados: ${chosen.join(", ")}` };
}

function classifyRowNumbers(nums) {
  const a = nums.filter(isFiniteNumber);
  if (!a.length) return "No hay datos numéricos en las columnas elegidas.";
  const allInt = a.every((x) => Number.isInteger(x));
  if (allInt) {
    return "En esta fila, los valores son enteros → suele tratarse como variable cuantitativa discreta (conteo o escala entera).";
  }
  return "En esta fila hay valores no enteros → suele tratarse como variable cuantitativa continua (medición).";
}

const MODULE_INFO = {
  mas: {
    title: "1. Muestreo Aleatorio Simple",
    body: "Cada unidad tiene la misma probabilidad. Se usa la columna de valores sobre todas las filas del Excel.",
  },
  msist: {
    title: "1. Muestreo Sistemático",
    body: "Se elige un inicio al azar y luego cada k elementos (k ≈ N/n).",
  },
  mestrat: {
    title: "1. Muestreo Estratificado",
    body: "La población se divide en estratos; dentro de cada uno se sortea con asignación proporcional al tamaño del estrato.",
  },
  mcong: {
    title: "1. Muestreo por Conglomerados",
    body: "Se eligen al azar conglomerados (grupos) y se incluyen todas las unidades de los conglomerados elegidos.",
  },
  vdisc: {
    title: "2. Variables discretas",
    body: "Toman valores contables (a menudo enteros): cantidad de hijos, número de accidentes, etc. Abajo se evalúa la fila actual.",
  },
  vcont: {
    title: "2. Variables continuas",
    body: "Pueden tomar infinitos valores en un intervalo (con decimales): peso, tiempo, temperatura. Abajo se evalúa la fila actual.",
  },
  tmedia: {
    title: "3. Media (promedio)",
    body: "Suma de valores dividida por la cantidad. Se calcula con las columnas de datos de la fila seleccionada.",
  },
  tmediana: {
    title: "3. Mediana",
    body: "Valor que deja el 50% de los datos por debajo y 50% por arriba (con la fila actual).",
  },
  tmoda: {
    title: "3. Moda",
    body: "Valor más frecuente. Si todos aparecen una sola vez, no se muestra moda clara.",
  },
  drango: {
    title: "4. Rango",
    body: "Diferencia entre el máximo y el mínimo.",
  },
  dvar: {
    title: "4. Varianza muestral",
    body: "Promedio de las desviaciones al cuadrado (dividido por n−1). Requiere al menos 2 valores.",
  },
  dde: {
    title: "4. Desviación estándar",
    body: "Raíz cuadrada de la varianza muestral.",
  },
  dcv: {
    title: "4. Coeficiente de variación",
    body: "(Desviación estándar / |media|) × 100%. Requiere media distinta de cero y al menos 2 valores.",
  },
  emma3: {
    title: "5. Media móvil (orden 3)",
    body: "Promedio de ventanas de 3 valores seguidos, en el orden de las columnas elegidas (serie corta).",
  },
  emma4: {
    title: "5. Media móvil (orden 4)",
    body: "Igual que orden 3 pero con ventanas de 4 valores.",
  },
  emg: {
    title: "5. Media geométrica",
    body: "Raíz n-ésima del producto de los valores. Requiere que todos los datos sean mayores que cero.",
  },
  emh: {
    title: "5. Media armónica",
    body: "n dividido la suma de los recíprocos. Requiere que ningún valor sea cero.",
  },
  cuart: {
    title: "6. Cuartiles",
    body: "Q1 (25%), Q2 (mediana), Q3 (75%) con interpolación lineal sobre los datos de la fila.",
  },
  decil: {
    title: "6. Deciles",
    body: "D1 a D9 (10% a 90%) con interpolación lineal.",
  },
  perc: {
    title: "6. Percentiles",
    body: "P1, P5, P10, P25, P50, P75, P90, P95 y P99.",
  },
  dfreq: {
    title: "7. Distribución de frecuencias",
    body: "Frecuencia absoluta de cada valor distinto en la fila (ordenados de menor a mayor).",
  },
  curt: {
    title: "8. Curtosis (exceso)",
    body: "Curtosis muestral de exceso (comparada con la normal, que sería 0). Requiere al menos 4 valores.",
  },
  asim: {
    title: "8. Asimetría",
    body: "Coeficiente de asimetría muestral (sesgo). Requiere al menos 3 valores y desviación distinta de cero.",
  },
};

const STEPS_ROW_BASE = [
  "Cargá el Excel con Cargar Excel (sección Consulta). Si pulsás Buscar sin archivo, se abrirá el selector para elegirlo.",
  "En Resultado, Columna Documento: indicá qué columna tiene el DNI o documento (necesario si vas a usar Buscar).",
  "Columna Población: elegí la columna adecuada o (ninguna) si el ejercicio no la usa.",
  "Columnas Datos: con Ctrl o Shift + clic marcá las columnas numéricas del ejercicio. El orden importa para medias móviles (serie en ese orden).",
  "Elegí el registro: número de Fila + Usar fila, clic en una fila de la tabla Excel, o documento + Buscar.",
];

function rowSteps(cierre) {
  return [...STEPS_ROW_BASE, cierre];
}

function isSamplingModule(id) {
  return id === "mas" || id === "msist" || id === "mestrat" || id === "mcong";
}

/** Medidas que exigen varios valores numéricos en la fila (varias columnas de datos con número). */
const MODULE_DATA_MIN = {
  emma3: {
    min: 3,
    help:
      "Este ejercicio (media móvil orden 3) necesita al menos 3 números en la fila. Tenés que marcar al menos 3 columnas de datos con valor numérico; con menos no se puede calcular.",
  },
  emma4: {
    min: 4,
    help:
      "Media móvil orden 4: necesitás al menos 4 números. Marcá al menos 4 columnas de datos con número en la fila; si no, la medida no se puede hacer.",
  },
  dvar: {
    min: 2,
    help:
      "La varianza muestral necesita al menos 2 valores. Marcá al menos 2 columnas de datos con número; con una sola no se puede calcular.",
  },
  dde: {
    min: 2,
    help:
      "La desviación estándar muestral necesita al menos 2 valores. Marcá al menos 2 columnas de datos con número.",
  },
  dcv: {
    min: 2,
    help:
      "El coeficiente de variación necesita al menos 2 valores numéricos (y una media distinta de cero). Marcá al menos 2 columnas de datos.",
  },
  curt: {
    min: 4,
    help:
      "La curtosis muestral necesita al menos 4 valores numéricos. Marcá al menos 4 columnas de datos con número en la fila.",
  },
  asim: {
    min: 3,
    help:
      "La asimetría muestral necesita al menos 3 valores numéricos. Marcá al menos 3 columnas de datos con número en la fila.",
  },
};

const MODULE_STEPS = {
  mas: [
    "Cargá el Excel con Cargar Excel.",
    "En el menú lateral dejá Muestreo Aleatorio Simple.",
    "Columna valores: elegí la variable numérica; se tomarán todos los valores numéricos de esa columna en todas las filas.",
    "Ingresá n (tamaño de la muestra deseado).",
    "Pulsá Ejecutar muestreo. En el JSON verás la lista muestra: son n valores elegidos al azar de la lista de valores válidos.",
    "Interpretación: cada valor válido tuvo la misma probabilidad de entrar (muestreo simple sin reemplazo sobre la lista construida).",
  ],
  msist: [
    "Cargá el Excel con Cargar Excel.",
    "Menú: Muestreo Sistemático.",
    "Columna valores: la variable; el orden de las filas del archivo define el orden de la población listada.",
    "Ingresá n. El programa usa un paso k y un inicio aleatorio para tomar aproximadamente n valores equiespaciados.",
    "Ejecutar muestreo y revisá el JSON.",
    "Interpretación: útil cuando la lista ya está mezclada o no hay orden relevante; si hay periodicidad en el archivo, puede sesgar el muestreo.",
  ],
  mestrat: [
    "Cargá el Excel con Cargar Excel.",
    "Menú: Muestreo Estratificado.",
    "Columna valores: variable a muestrear.",
    "Columna estrato: columna que define grupos (ej. curso, zona).",
    "Ingresá n total. La muestra se reparte entre estratos de forma proporcional al tamaño de cada uno.",
    "Ejecutar muestreo. El JSON incluye detalle de cuántos salieron por estrato.",
  ],
  mcong: [
    "Cargá el Excel con Cargar Excel.",
    "Menú: Muestreo por Conglomerados.",
    "Columna valores: la variable medida en cada unidad.",
    "Columna conglomerado: identificador del grupo (ej. aula, manzana).",
    "Ingresá m = cantidad de conglomerados a sortear. Se incluyen todas las unidades de los conglomerados elegidos.",
    "Ejecutar muestreo y revisá conglomerados elegidos y la muestra en el JSON.",
  ],
  vdisc: rowSteps(
    "Con Variables discretas seleccionado, en Resultado solo verás Clasificación: indica si los números de la fila son enteros (típico de discreta).",
  ),
  vcont: rowSteps(
    "Con Variables continuas, Clasificación explica si hay decimales (típico de continua medida).",
  ),
  tmedia: rowSteps("Con Media (Promedio) activo, Resultado muestra la media aritmética de los valores en Datos."),
  tmediana: rowSteps("Con Mediana activo, Resultado muestra el valor central ordenando los datos de la fila."),
  tmoda: rowSteps("Con Moda activo, Resultado muestra el valor más repetido; si todos aparecen una vez, verás —."),
  drango: rowSteps("Con Rango activo, Resultado = máximo − mínimo de los datos de la fila."),
  dvar: rowSteps("Con Varianza activo, se usa varianza muestral (divisor n−1); hacen falta al menos 2 valores."),
  dde: rowSteps("Con Desviación estándar activo, es la raíz de la varianza muestral."),
  dcv: rowSteps("Con Coeficiente de variación activo, es (desviación / |media|)×100%; la media no puede ser 0."),
  emma3: rowSteps(
    "Con Media móvil orden 3, Resultado lista los promedios de cada ventana de 3 números consecutivos en el orden de Columnas Datos.",
  ),
  emma4: rowSteps(
    "Con Media móvil orden 4, igual que la anterior pero con ventanas de 4; necesitás al menos 4 valores.",
  ),
  emg: rowSteps(
    "Media geométrica: todos los valores deben ser > 0. Si hay cero o negativos, Resultado mostrará un aviso.",
  ),
  emh: rowSteps(
    "Media armónica: ningún valor puede ser 0. Sirve para velocidades medias o promedios de recíprocos.",
  ),
  cuart: rowSteps("Cuartiles Q1, Q2 y Q3 con interpolación lineal sobre los datos ordenados de la fila."),
  decil: rowSteps("Deciles D1 a D9: posiciones al 10%, 20%, …, 90% con interpolación lineal."),
  perc: rowSteps("Percentiles P1, P5, P10, P25, P50, P75, P90, P95 y P99."),
  dfreq: rowSteps("Frecuencias: cada valor distinto de la fila con su frecuencia absoluta, ordenado."),
  curt: rowSteps("Curtosis de exceso muestral (mínimo 4 valores). Valores cercanos a 0 se parecen a la curva normal."),
  asim: rowSteps("Asimetría muestral (mínimo 3 valores). Positiva: cola a la derecha; negativa: cola a la izquierda."),
};

function parseCsv(text) {
  const lines = String(text ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const idxDoc = header.findIndex((h) => h.toLowerCase() === "documento" || h.toLowerCase() === "document");
  const idxPop = header.findIndex((h) => h.toLowerCase() === "poblacion" || h.toLowerCase() === "population");
  const idxData = header.findIndex((h) => h.toLowerCase() === "datos" || h.toLowerCase() === "data");

  const out = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((c) => c.trim());
    const doc = idxDoc >= 0 ? cols[idxDoc] : cols[0];
    const populationRaw = idxPop >= 0 ? cols[idxPop] : cols[1];
    const dataRaw = idxData >= 0 ? cols[idxData] : cols[2];

    const population = populationRaw == null ? undefined : Number(String(populationRaw).replace(/\./g, "").replace(",", "."));
    const data =
      dataRaw == null || dataRaw === ""
        ? []
        : String(dataRaw)
            .split(/[;|]/g)
            .map((x) => Number(String(x).trim().replace(",", ".")))
            .filter(isFiniteNumber);

    out.push({ document: normalizeDocument(doc), population, data });
  }
  return out;
}

function parseCsvMatrix(text) {
  const lines = String(text ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };

  const matrix = lines.map((line) => line.split(",").map((c) => c.trim()));
  const headers = matrix[0] ?? [];
  const rows = matrix.slice(1);
  return { headers, rows };
}

function rowsToRegistry(rows) {
  // Espera columnas con nombres:
  // - documento / document
  // - poblacion / population
  // - datos / data  (opcional; "1;2;3")
  return rows
    .map((r) => {
      const doc = normalizeDocument(r?.documento ?? r?.document ?? r?.Documento ?? r?.Document ?? r?.DOC ?? r?.doc);
      if (!doc) return null;

      const popRaw = r?.poblacion ?? r?.population ?? r?.Poblacion ?? r?.Population ?? r?.POP ?? r?.pop;
      const population =
        popRaw == null || popRaw === ""
          ? undefined
          : typeof popRaw === "number"
            ? popRaw
            : Number(String(popRaw).replace(/\./g, "").replace(",", "."));

      const dataRaw = r?.datos ?? r?.data ?? r?.Datos ?? r?.Data;
      const data =
        dataRaw == null || dataRaw === ""
          ? []
          : String(dataRaw)
              .split(/[;|,]/g)
              .map((x) => Number(String(x).trim().replace(",", ".")))
              .filter(isFiniteNumber);

      return { document: doc, population, data };
    })
    .filter(Boolean);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderExcelTable(tableEl, metaEl, excelView) {
  const headers = Array.isArray(excelView?.headers) ? excelView.headers : [];
  const rows = Array.isArray(excelView?.rows) ? excelView.rows : [];
  const fileName = excelView?.fileName ?? null;
  const selectedRowIndex = Number.isInteger(excelView?.selectedRowIndex) ? excelView.selectedRowIndex : null;

  metaEl.textContent = fileName
    ? `Archivo: ${fileName} — columnas: ${headers.length} — filas: ${rows.length}`
    : "Sin Excel cargado.";

  if (!fileName || headers.length === 0) {
    tableEl.innerHTML = "";
    return;
  }

  const maxRows = 2000;
  const shownRows = rows.slice(0, maxRows);
  const truncated = rows.length > maxRows;

  const thead =
    "<thead><tr>" +
    headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("") +
    "</tr></thead>";

  const tbody =
    "<tbody>" +
    shownRows
      .map((r) => {
        const cells = headers.map((_, idx) => `<td>${escapeHtml(r?.[idx] ?? "")}</td>`).join("");
        const rowIdx = rows.indexOf(r);
        const isSelected = selectedRowIndex != null && rowIdx === selectedRowIndex;
        return `<tr data-row-index="${rowIdx}" class="${isSelected ? "selected" : ""}">${cells}</tr>`;
      })
      .join("") +
    "</tbody>";

  const note = truncated
    ? `<caption class="muted" style="caption-side: bottom; padding: 10px 0;">Mostrando ${maxRows} de ${rows.length} filas (para rendimiento).</caption>`
    : "";

  tableEl.innerHTML = note + thead + tbody;
}

async function loadFromFile(file) {
  const name = String(file?.name ?? "").toLowerCase();

  if (name.endsWith(".csv")) {
    const text = await file.text();
    const registry = parseCsv(text);
    const view = parseCsvMatrix(text);
    return { registry, excelView: { fileName: file.name, headers: view.headers, rows: view.rows } };
  }

  if (typeof window.XLSX?.read !== "function") {
    throw new Error("No se pudo cargar el lector de Excel (XLSX). Revisá tu conexión o el CDN.");
  }

  const buf = await file.arrayBuffer();
  const wb = window.XLSX.read(buf, { type: "array" });
  const firstSheetName = wb.SheetNames?.[0];
  if (!firstSheetName) return { registry: [], excelView: { fileName: file.name, headers: [], rows: [] } };
  const ws = wb.Sheets[firstSheetName];
  const rows = window.XLSX.utils.sheet_to_json(ws, { defval: "" });
  const registry = rowsToRegistry(rows);

  const matrix = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const headers = Array.isArray(matrix?.[0]) ? matrix[0].map((h) => String(h)) : [];
  const bodyRows = Array.isArray(matrix) ? matrix.slice(1).map((r) => (Array.isArray(r) ? r : [])) : [];

  return { registry, excelView: { fileName: file.name, headers, rows: bodyRows } };
}

function setMessage(el, kind, text) {
  el.classList.remove("ok", "err");
  if (kind) el.classList.add(kind);
  el.textContent = text ?? "";
}

const MODULE_EXPORT_ORDER = [
  "mas",
  "msist",
  "mestrat",
  "mcong",
  "vdisc",
  "vcont",
  "tmedia",
  "tmediana",
  "tmoda",
  "drango",
  "dvar",
  "dde",
  "dcv",
  "emma3",
  "emma4",
  "emg",
  "emh",
  "cuart",
  "decil",
  "perc",
  "dfreq",
  "curt",
  "asim",
];

function sheetNameSafe(name) {
  const s = String(name).replace(/[:\\/?*[\]]/g, "_").trim();
  return s.slice(0, 31) || "Hoja";
}

function allModuleIdsForExport() {
  const seen = new Set();
  const out = [];
  for (const id of MODULE_EXPORT_ORDER) {
    if (MODULE_INFO[id]) {
      out.push(id);
      seen.add(id);
    }
  }
  for (const id of Object.keys(MODULE_INFO)) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

function buildStudentNarrative(snapshot) {
  const p = [];
  p.push("1. CONTEXTO");
  p.push(
    `Este archivo se generó el ${snapshot.date} desde la aplicación de práctica de estadística (Gestión del sistema).`,
  );
  if (snapshot.fileName) {
    p.push(
      `Los datos de partida provienen del archivo "${snapshot.fileName}". La aplicación utiliza la primera hoja del libro.`,
    );
  } else {
    p.push(
      "Al exportar no había ningún archivo cargado: las secciones de datos pueden estar incompletas o vacías.",
    );
  }

  p.push("");
  p.push("2. QUÉ SE ESTÁ TRABAJANDO");
  p.push(snapshot.moduleTitle || "(sin título)");
  p.push(`Idea central: ${snapshot.moduleBody || "—"}`);

  p.push("");
  p.push("3. PROCEDIMIENTO PASO A PASO (TEORÍA + ORDEN EN LA APP)");
  (snapshot.steps || []).forEach((step, i) => {
    p.push(`${i + 1}) ${step}`);
  });

  if (snapshot.pedagogicalLines?.length) {
    p.push("");
    p.push("CÁLCULO CON NÚMEROS CONCRETOS (tu fila)");
    snapshot.pedagogicalLines.forEach((line) => p.push(line));
  }

  if (snapshot.type === "muestreo") {
    p.push("");
    p.push("4. QUÉ SE HIZO EN ESTE CASO (MUESTREO)");
    let det = `Se tomó la columna de valores (índice de columna: ${snapshot.samplingValueCol}) sobre todas las filas con número válido. `;
    det += `El valor ingresado de n o m fue: ${snapshot.samplingNInput || "—"}. `;
    if (snapshot.activeModule === "mestrat") {
      det += `Columna de estrato: índice ${snapshot.samplingStratumCol}. `;
    }
    if (snapshot.activeModule === "mcong") {
      det += `Columna de conglomerado: índice ${snapshot.samplingClusterCol}. `;
    }
    det +=
      "El resultado numérico de la muestra está en la hoja Resultados (formato JSON): ahí podés ver cada valor elegido y, si aplica, el detalle por estrato o conglomerado.";
    p.push(det);
    p.push(
      "Para enseñar: leé en clase cada paso del apartado 3 y mostrá el JSON como 'resultado del algoritmo'. Relacioná con la definición del libro (probabilidad igual, k sistemático, etc.).",
    );
  } else {
    p.push("");
    p.push("4. QUÉ SE HIZO EN ESTE CASO (FILA Y COLUMNAS)");
    if (snapshot.rowHuman != null) {
      p.push(
        `Se analizó la fila de datos número ${snapshot.rowHuman} (en la app, 1 = primera fila debajo del encabezado del Excel).`,
      );
    } else {
      p.push("No había una fila seleccionada al exportar: los números de la sección Datos pueden estar vacíos.");
    }
    p.push(
      `Columna documento usada para buscar: "${snapshot.docColLabel}" (índice ${snapshot.mapping?.docCol ?? "—"}).`,
    );
    p.push(
      `Columna población: "${snapshot.popLabel}". Columnas marcadas como datos: ${snapshot.dataColLabels.length ? snapshot.dataColLabels.join(", ") : "(ninguna)"}.`,
    );
    p.push(
      `Valores numéricos que entraron a los cálculos (en el orden de las columnas elegidas): ${snapshot.nums.length ? snapshot.nums.join("; ") : "(ninguno)"}.`,
    );
    p.push(
      "En la hoja 'Resultados' están todos los indicadores que la aplicación puede calcular con esos números. En pantalla solo se resalta el que coincide con el ítem del menú lateral, pero el Excel sirve para comparar media, mediana, dispersión, etc. en un solo lugar.",
    );
    p.push(
      "Sugerencia para el estudiante: tomá un resultado (por ejemplo la media) y verificá a mano con la fórmula del apunte usando los mismos números de la hoja Datos utilizados.",
    );
  }

  p.push("");
  p.push("5. CÓMO USAR ESTE MATERIAL EN CLASE");
  p.push(
    "La hoja 'Guia todos modulos' lista cada tema del menú con su texto de apoyo y la lista de pasos sugeridos (aunque no hayas hecho ese ejercicio en esta sesión). Sirve como guión o checklist de repaso.",
  );
  p.push(
    "Podés leer en voz alta el apartado 3 y 4 de este texto o proyectar la hoja 'Texto estudiante' completa.",
  );

  return p.join("\n");
}

function buildTeachingExportWorkbook(snapshot) {
  const XLSX = window.XLSX;
  const wb = XLSX.utils.book_new();

  const resumen = [
    ["Campo", "Valor"],
    ["Fecha y hora de exportación", snapshot.date],
    ["Archivo de origen", snapshot.fileName || "(sin archivo)"],
    ["Código del módulo activo", snapshot.activeModule],
    ["Tema (título)", snapshot.moduleTitle],
    ["Tipo de ejercicio", snapshot.type === "muestreo" ? "Muestreo probabilístico" : "Análisis por fila"],
  ];
  if (snapshot.type === "muestreo") {
    resumen.push(["Columna valores (índice)", String(snapshot.samplingValueCol)]);
    resumen.push(["n o m ingresado", snapshot.samplingNInput || "—"]);
    if (snapshot.activeModule === "mestrat") {
      resumen.push(["Columna estrato (índice)", String(snapshot.samplingStratumCol)]);
    }
    if (snapshot.activeModule === "mcong") {
      resumen.push(["Columna conglomerado (índice)", String(snapshot.samplingClusterCol)]);
    }
  } else {
    resumen.push([
      "Fila de datos (1 = primera fila de datos)",
      snapshot.rowHuman != null ? String(snapshot.rowHuman) : "(no seleccionada)",
    ]);
    resumen.push(["Documento (normalizado)", snapshot.doc || "—"]);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), sheetNameSafe("Resumen"));

  const pasos = [["Nº", "Paso a paso"]];
  (snapshot.steps || []).forEach((t, i) => pasos.push([i + 1, t]));
  if (pasos.length === 1) pasos.push([1, "No hay pasos definidos para este módulo."]);
  if (snapshot.pedagogicalLines?.length) {
    pasos.push([]);
    pasos.push(["—", "Desglose con los números de tu fila:"]);
    snapshot.pedagogicalLines.forEach((line, i) => pasos.push([`D${i + 1}`, line]));
  }
  const wsPasos = XLSX.utils.aoa_to_sheet(pasos);
  wsPasos["!cols"] = [{ wch: 6 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsPasos, sheetNameSafe("Pasos este ejercicio"));

  const datos = [["Sección", "Contenido"]];
  datos.push(["Encabezados (columnas del Excel)", (snapshot.headers || []).join(" | ") || "—"]);
  datos.push(["Etiqueta columna documento", snapshot.docColLabel]);
  datos.push(["Etiqueta columna población", snapshot.popLabel]);
  datos.push(["Etiquetas columnas datos", snapshot.dataColLabels.join(" | ") || "—"]);
  datos.push([]);
  datos.push(["Valores numéricos usados (orden)", (snapshot.nums || []).join("; ") || "—"]);
  datos.push([]);
  if (snapshot.rowRaw && snapshot.headers?.length) {
    datos.push(["Columna (encabezado)", "Valor en la fila exportada"]);
    snapshot.headers.forEach((h, i) => {
      datos.push([h || `Col ${i + 1}`, String(snapshot.rowRaw[i] ?? "")]);
    });
  }
  const wsDatos = XLSX.utils.aoa_to_sheet(datos);
  wsDatos["!cols"] = [{ wch: 28 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsDatos, sheetNameSafe("Datos utilizados"));

  const res = [["Concepto", "Valor calculado (pantalla)"]];
  if (snapshot.type === "muestreo") {
    res.push([
      "Nota",
      "Modo muestreo: media/mediana/etc. son por fila (pueden estar en —). El resultado principal del ejercicio es el JSON al final de esta hoja.",
    ]);
  }
  Object.entries(snapshot.outputs || {}).forEach(([k, v]) => res.push([k, v]));
  if (snapshot.samplingJson) {
    res.push(["Resultado muestreo (JSON)", snapshot.samplingJson]);
  }
  const wsRes = XLSX.utils.aoa_to_sheet(res);
  wsRes["!cols"] = [{ wch: 32 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsRes, sheetNameSafe("Resultados"));

  const narrSheet = [["Procedimiento explicado para el estudiante"]];
  narrSheet.push([snapshot.narrative || ""]);
  const wsNarr = XLSX.utils.aoa_to_sheet(narrSheet);
  wsNarr["!cols"] = [{ wch: 110 }];
  XLSX.utils.book_append_sheet(wb, wsNarr, sheetNameSafe("Texto estudiante"));

  const guia = [["Código", "Título", "Qué es", "Pasos (revisión / clase)"]];
  for (const id of allModuleIdsForExport()) {
    const info = MODULE_INFO[id];
    const st = (MODULE_STEPS[id] || []).join("\n");
    guia.push([id, info.title, info.body, st]);
  }
  const wsGuia = XLSX.utils.aoa_to_sheet(guia);
  wsGuia["!cols"] = [{ wch: 10 }, { wch: 30 }, { wch: 42 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsGuia, sheetNameSafe("Guia todos modulos"));

  return wb;
}

function main() {
  let loadedRegistry = null;
  let loadedFileName = null;
  let loadedExcelView = { fileName: null, headers: [], rows: [], selectedRowIndex: null };
  let mapping = { docCol: 0, popCol: null, dataCols: [] };
  let activeModule = "tmedia";

  const form = document.getElementById("lookupForm");
  const input = document.getElementById("documentInput");
  const resetBtn = document.getElementById("resetBtn");
  const exportExcelBtn = document.getElementById("exportExcelBtn");
  const message = document.getElementById("message");
  const excelFile = document.getElementById("excelFile");
  const loadExcelBtn = document.getElementById("loadExcelBtn");

  const outDocument = document.getElementById("outDocument");
  const outPopulation = document.getElementById("outPopulation");
  const outData = document.getElementById("outData");
  const outMean = document.getElementById("outMean");
  const outMedian = document.getElementById("outMedian");
  const outMode = document.getElementById("outMode");
  const outExcelTable = document.getElementById("outExcelTable");
  const outExcelMeta = document.getElementById("outExcelMeta");
  const docColSelect = document.getElementById("docColSelect");
  const popColSelect = document.getElementById("popColSelect");
  const dataColsSelect = document.getElementById("dataColsSelect");
  const rowIndexInput = document.getElementById("rowIndexInput");
  const useRowBtn = document.getElementById("useRowBtn");
  const moduleDetailTitle = document.getElementById("moduleDetailTitle");
  const moduleDetailBody = document.getElementById("moduleDetailBody");
  const samplingControls = document.getElementById("samplingControls");
  const stratumField = document.getElementById("stratumField");
  const clusterField = document.getElementById("clusterField");
  const samplingValueCol = document.getElementById("samplingValueCol");
  const samplingStratumCol = document.getElementById("samplingStratumCol");
  const samplingClusterCol = document.getElementById("samplingClusterCol");
  const samplingN = document.getElementById("samplingN");
  const runSamplingBtn = document.getElementById("runSamplingBtn");
  const samplingOutput = document.getElementById("samplingOutput");
  const samplingPretty = document.getElementById("samplingPretty");
  const resultKv = document.getElementById("resultKv");
  const resultDataCard = document.getElementById("resultDataCard");
  const vizCard = document.getElementById("vizCard");
  const outRange = document.getElementById("outRange");
  const outVariance = document.getElementById("outVariance");
  const outStdev = document.getElementById("outStdev");
  const outCV = document.getElementById("outCV");
  const outVarType = document.getElementById("outVarType");
  const outMovAvg3 = document.getElementById("outMovAvg3");
  const outMovAvg4 = document.getElementById("outMovAvg4");
  const outGeomMean = document.getElementById("outGeomMean");
  const outHarmMean = document.getElementById("outHarmMean");
  const outQuartiles = document.getElementById("outQuartiles");
  const outDeciles = document.getElementById("outDeciles");
  const outPercentiles = document.getElementById("outPercentiles");
  const outFreqDist = document.getElementById("outFreqDist");
  const outKurtosis = document.getElementById("outKurtosis");
  const outSkewness = document.getElementById("outSkewness");
  const freqTable = document.getElementById("freqTable");
  const freqTableSummary = document.getElementById("freqTableSummary");
  const freqChartCanvas = document.getElementById("freqChartCanvas");
  const polyChartCanvas = document.getElementById("polyChartCanvas");
  const pieChartCanvas = document.getElementById("pieChartCanvas");
  const cumChartCanvas = document.getElementById("cumChartCanvas");
  const histChartCanvas = document.getElementById("histChartCanvas");
  const stepByStepList = document.getElementById("stepByStepList");
  const stepsHint = document.getElementById("stepsHint");
  const pedagogicalWrap = document.getElementById("pedagogicalWrap");
  const pedagogicalStepsList = document.getElementById("pedagogicalStepsList");
  const dataColsNeedNote = document.getElementById("dataColsNeedNote");

  function renderSamplingPretty(payload) {
    if (!samplingPretty) return;
    const sample = Array.isArray(payload?.muestra) ? payload.muestra : [];
    const n = sample.length;
    const min = n ? Math.min(...sample) : null;
    const max = n ? Math.max(...sample) : null;
    const avg = n ? mean(sample) : null;
    const firstValues = sample.slice(0, 15);
    const remaining = Math.max(0, sample.length - firstValues.length);

    const extraLines = [];
    if (payload?.tamPoblacion != null) extraLines.push(`Población válida: ${payload.tamPoblacion}`);
    if (payload?.asignacion) extraLines.push(`Asignación: ${payload.asignacion}`);
    if (payload?.detalle) extraLines.push(`Detalle: ${payload.detalle}`);
    if (Array.isArray(payload?.conglomeradosElegidos) && payload.conglomeradosElegidos.length) {
      extraLines.push(`Conglomerados elegidos: ${payload.conglomeradosElegidos.join(", ")}`);
    }

    const header = `<h4>Resultado de muestreo: ${escapeHtml(payload?.tipo ?? "—")}</h4>`;
    const tags =
      `<div class="sampling-tags">` +
      `<span class="sampling-tag">n obtenido: ${n}</span>` +
      `<span class="sampling-tag">mín: ${min == null ? "—" : formatNumber(min)}</span>` +
      `<span class="sampling-tag">máx: ${max == null ? "—" : formatNumber(max)}</span>` +
      `<span class="sampling-tag">media: ${avg == null ? "—" : formatNumber(avg)}</span>` +
      `</div>`;
    const list =
      `<ol class="sampling-list">` +
      firstValues.map((v, i) => `<li>Muestra ${i + 1}: <strong>${formatNumber(v)}</strong></li>`).join("") +
      (remaining ? `<li>... y ${remaining} valor(es) más.</li>` : "") +
      `</ol>`;
    const extras = extraLines.length
      ? `<p class="muted" style="margin-top:10px;">${extraLines.map((x) => escapeHtml(x)).join(" | ")}</p>`
      : "";

    samplingPretty.innerHTML = header + tags + list + extras;
    samplingPretty.classList.remove("hidden");
  }

  function countNumericInSelectedRow() {
    const idx = loadedExcelView.selectedRowIndex;
    if (idx == null || !loadedExcelView.rows?.[idx]) return null;
    const row = loadedExcelView.rows[idx];
    const vals = (mapping.dataCols ?? []).map((c) => toNumberLoose(row[c])).filter(isFiniteNumber);
    return vals.length;
  }

  function updateDataColsRequirementNote() {
    if (!dataColsNeedNote) return;
    if (isSamplingModule(activeModule)) {
      dataColsNeedNote.textContent = "";
      dataColsNeedNote.classList.add("hidden");
      dataColsNeedNote.classList.remove("is-warning");
      return;
    }
    const req = MODULE_DATA_MIN[activeModule];
    if (!req) {
      dataColsNeedNote.textContent = "";
      dataColsNeedNote.classList.add("hidden");
      dataColsNeedNote.classList.remove("is-warning");
      return;
    }
    dataColsNeedNote.classList.remove("hidden");
    const colCount = (mapping.dataCols ?? []).length;
    const numCount = countNumericInSelectedRow();
    let msg = req.help;
    let warn = false;
    if (colCount < req.min) {
      msg += ` Ahora tenés ${colCount} columna(s) seleccionada(s): necesitás al menos ${req.min}.`;
      warn = true;
    } else if (numCount != null && numCount < req.min) {
      msg += ` En la fila actual solo hay ${numCount} número(s) válido(s) entre las columnas elegidas: hacen falta ${req.min} para esta medida.`;
      warn = true;
    }
    dataColsNeedNote.textContent = msg;
    dataColsNeedNote.classList.toggle("is-warning", warn);
  }

  function renderStepByStep(moduleId) {
    const steps = MODULE_STEPS[moduleId];
    if (!steps?.length) {
      stepByStepList.innerHTML = `<li>${escapeHtml("Elegí un ejercicio en el menú lateral.")}</li>`;
      return;
    }
    stepByStepList.innerHTML = steps.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
  }

  function updatePedagogicalStepsUI() {
    if (!pedagogicalWrap || !pedagogicalStepsList) return;
    if (isSamplingModule(activeModule)) {
      pedagogicalWrap.classList.add("hidden");
      pedagogicalStepsList.innerHTML = "";
      return;
    }
    const idx = loadedExcelView?.selectedRowIndex;
    const row = idx != null ? loadedExcelView.rows?.[idx] : null;
    const nums = row
      ? (mapping.dataCols || []).map((c) => toNumberLoose(row[c])).filter(isFiniteNumber)
      : [];
    const lines = pedagogicalStepsForModule(activeModule, nums);
    if (!lines?.length) {
      pedagogicalWrap.classList.add("hidden");
      pedagogicalStepsList.innerHTML = "";
      return;
    }
    pedagogicalWrap.classList.remove("hidden");
    pedagogicalStepsList.innerHTML = lines.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
  }

  function updateStepsHint() {
    const id = activeModule;
    const sampling = isSamplingModule(id);
    const hasFile = Boolean(loadedExcelView?.fileName);
    const hasRow = Number.isInteger(loadedExcelView?.selectedRowIndex);
    const out = samplingOutput.textContent.trim();
    const samplingDone = sampling && out !== "—" && out.length > 0;

    if (sampling) {
      if (!hasFile) {
        stepsHint.textContent = "Estado: pendiente cargar el Excel (paso 1 de la lista).";
      } else if (samplingDone) {
        stepsHint.textContent =
          "Estado: muestreo ya ejecutado. Revisá el JSON debajo del botón Ejecutar muestreo; podés cambiar n o m y repetir.";
      } else {
        stepsHint.textContent =
          "Estado: archivo cargado. Seguí los pasos de la lista: columnas y n o m, luego Ejecutar muestreo.";
      }
      stepsHint.classList.remove("hidden");
      return;
    }

    if (!hasFile) {
      stepsHint.textContent = "Estado: pendiente cargar el Excel.";
    } else if (!hasRow) {
      stepsHint.textContent =
        "Estado: falta elegir la fila o buscar por documento (completá los últimos pasos de la lista).";
    } else {
      stepsHint.textContent =
        "Estado: fila aplicada. En Resultado abajo verás la medida que corresponde al ítem del menú.";
    }
    stepsHint.classList.remove("hidden");
  }

  function clearOutput() {
    outDocument.textContent = "—";
    outPopulation.textContent = "—";
    outData.textContent = "—";
    outMean.textContent = "—";
    outMedian.textContent = "—";
    outMode.textContent = "—";
    outRange.textContent = "—";
    outVariance.textContent = "—";
    outStdev.textContent = "—";
    outCV.textContent = "—";
    outVarType.textContent = "—";
    outMovAvg3.textContent = "—";
    outMovAvg4.textContent = "—";
    outGeomMean.textContent = "—";
    outHarmMean.textContent = "—";
    outQuartiles.textContent = "—";
    outDeciles.textContent = "—";
    outPercentiles.textContent = "—";
    outFreqDist.textContent = "—";
    outKurtosis.textContent = "—";
    outSkewness.textContent = "—";
    if (freqTable) freqTable.innerHTML = "";
    if (freqTableSummary) freqTableSummary.textContent = "Sin datos.";
    clearCanvas(freqChartCanvas);
    clearCanvas(polyChartCanvas);
    clearCanvas(pieChartCanvas);
    clearCanvas(cumChartCanvas);
    clearCanvas(histChartCanvas);
    updateStepsHint();
    updateDataColsRequirementNote();
    updatePedagogicalStepsUI();
  }

  function renderFrequencyTable(nums) {
    if (!freqTable || !freqTableSummary) return;
    const rows = frequencyDistributionRows(nums);
    if (!rows.length) {
      freqTableSummary.textContent = "Sin datos numéricos en la fila seleccionada.";
      freqTable.innerHTML = "";
      return;
    }
    freqTableSummary.textContent = `n = ${rows[rows.length - 1].Fi}, valores distintos = ${rows.length}`;
    const header =
      "<thead><tr><th>Valor</th><th>fi</th><th>Fi</th><th>hi</th><th>Hi</th><th>hi (%)</th><th>Hi (%)</th></tr></thead>";
    const body =
      "<tbody>" +
      rows
        .map(
          (r) =>
            `<tr><td>${formatNumber(r.value)}</td><td>${r.fi}</td><td>${r.Fi}</td><td>${r.hi.toFixed(4)}</td><td>${r.Hi.toFixed(4)}</td><td>${(r.hi * 100).toFixed(2)}%</td><td>${(r.Hi * 100).toFixed(2)}%</td></tr>`,
        )
        .join("") +
      "</tbody>";
    freqTable.innerHTML = header + body;
  }

  function renderVisualizations(nums) {
    const rows = frequencyDistributionRows(nums);
    const labels = rows.map((r) => formatNumber(r.value));
    const fi = rows.map((r) => r.fi);
    const Fi = rows.map((r) => r.Fi);
    drawBarChart(freqChartCanvas, labels, fi, "Grafico de frecuencia (fi)");
    drawLineChart(polyChartCanvas, fi, "Poligono de frecuencia");
    drawPieChart(pieChartCanvas, labels, fi, "Frecuencia relativa (%)");
    drawCumulativeChart(cumChartCanvas, labels, Fi, "Frecuencia acumulada (Fi)");
    const bins = histogramBins(nums);
    drawBarChart(
      histChartCanvas,
      bins.map((b) => b.label),
      bins.map((b) => b.count),
      "Histograma por intervalos",
    );
    renderFrequencyTable(nums);
  }

  function setActiveModule(id) {
    activeModule = id;
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.module === id);
    });
    const info = MODULE_INFO[id] ?? { title: "Módulo", body: "" };
    moduleDetailTitle.textContent = info.title;
    moduleDetailBody.textContent = info.body;

    renderStepByStep(id);

    const sampling = isSamplingModule(id);
    resultDataCard.classList.toggle("hidden", sampling);
    if (vizCard) vizCard.classList.toggle("hidden", sampling);
    samplingControls.classList.toggle("hidden", !sampling);
    stratumField.classList.toggle("hidden", id !== "mestrat");
    clusterField.classList.toggle("hidden", id !== "mcong");

    resultKv.dataset.module = id;

    const idx = loadedExcelView.selectedRowIndex;
    if (idx != null && loadedExcelView.rows?.[idx]) {
      renderResultFromRow(loadedExcelView.rows[idx], idx);
    } else {
      updateStepsHint();
      updatePedagogicalStepsUI();
    }
    updateDataColsRequirementNote();
  }

  function guessColumnIndex(headers, candidates) {
    const lower = headers.map((h) => String(h ?? "").trim().toLowerCase());
    for (const cand of candidates) {
      const idx = lower.findIndex((h) => h === cand || h.includes(cand));
      if (idx >= 0) return idx;
    }
    return null;
  }

  function fillSelect(selectEl, headers, { allowNone = false } = {}) {
    const opts = [];
    if (allowNone) opts.push(`<option value="">(ninguna)</option>`);
    headers.forEach((h, idx) => {
      const label = h === "" ? `Col ${idx + 1}` : String(h);
      opts.push(`<option value="${idx}">${escapeHtml(label)}</option>`);
    });
    selectEl.innerHTML = opts.join("");
  }

  function setMultiSelectValues(selectEl, indices) {
    const want = new Set((indices ?? []).map((x) => String(x)));
    for (const opt of selectEl.options) {
      opt.selected = want.has(opt.value);
    }
  }

  function getMultiSelectValues(selectEl) {
    return Array.from(selectEl.selectedOptions)
      .map((o) => Number(o.value))
      .filter((n) => Number.isInteger(n) && n >= 0);
  }

  function initMappingUIFromHeaders(headers) {
    if (!headers || headers.length === 0) return;

    fillSelect(docColSelect, headers);
    fillSelect(popColSelect, headers, { allowNone: true });
    fillSelect(dataColsSelect, headers);

    const docGuess = guessColumnIndex(headers, ["documento", "document", "dni", "doc"]) ?? 0;
    const popGuess = guessColumnIndex(headers, ["poblacion", "population", "pob"]);
    const dataGuess = guessColumnIndex(headers, ["datos", "data"]);

    mapping.docCol = docGuess;
    mapping.popCol = popGuess;
    mapping.dataCols = [];

    if (dataGuess != null) {
      mapping.dataCols = [dataGuess];
    } else {
      // Por defecto: todas menos doc/pop (para que el usuario vea algo rápido)
      const exclude = new Set([mapping.docCol, mapping.popCol].filter((x) => x != null));
      mapping.dataCols = headers
        .map((_, i) => i)
        .filter((i) => !exclude.has(i))
        .slice(0, Math.min(6, headers.length));
    }

    docColSelect.value = String(mapping.docCol);
    popColSelect.value = mapping.popCol == null ? "" : String(mapping.popCol);
    setMultiSelectValues(dataColsSelect, mapping.dataCols);

    initSamplingSelects(headers);
    updateDataColsRequirementNote();
  }

  function initSamplingSelects(headers) {
    if (!headers?.length) {
      samplingValueCol.innerHTML = "";
      samplingStratumCol.innerHTML = "";
      samplingClusterCol.innerHTML = "";
      return;
    }
    fillSelect(samplingValueCol, headers);
    fillSelect(samplingStratumCol, headers);
    fillSelect(samplingClusterCol, headers);
    const defVal = mapping.dataCols?.[0] ?? mapping.docCol ?? 0;
    samplingValueCol.value = String(defVal);
    samplingStratumCol.value = String(mapping.docCol ?? 0);
    samplingClusterCol.value = String(mapping.docCol ?? 0);
  }

  function getRowByDocument(doc) {
    const headers = loadedExcelView.headers ?? [];
    const rows = loadedExcelView.rows ?? [];
    if (!headers.length || !rows.length) return null;
    const col = mapping.docCol ?? 0;
    for (let i = 0; i < rows.length; i++) {
      const cell = rows[i]?.[col];
      if (normalizeDocument(cell) === doc) return { row: rows[i], rowIndex: i };
    }
    return null;
  }

  function renderResultFromRow(row, rowIndex) {
    if (!row) return;

    loadedExcelView.selectedRowIndex = rowIndex ?? null;
    updatePreview();

    const docVal = row?.[mapping.docCol ?? 0];
    const popVal = mapping.popCol == null ? null : row?.[mapping.popCol];
    const dataVals = (mapping.dataCols ?? []).map((c) => row?.[c]);

    const doc = normalizeDocument(docVal);
    const popNum = popVal == null ? null : toNumberLoose(popVal);
    const nums = dataVals.map(toNumberLoose).filter(isFiniteNumber);

    outDocument.textContent = doc || "—";
    outPopulation.textContent = popNum == null ? "—" : formatNumber(popNum);
    outData.textContent = nums.length ? `${nums.join(", ")} (${nums.length})` : "—";

    const avg = mean(nums);
    outMean.textContent = avg == null ? "—" : formatNumber(avg);

    const med = median(nums);
    outMedian.textContent = med == null ? "—" : formatNumber(med);

    const modes = mode(nums);
    outMode.textContent =
      modes == null || modes.length === 0 ? "—" : modes.map((m) => formatNumber(m)).join(", ");

    const r = rangeStat(nums);
    outRange.textContent = r == null ? "—" : formatNumber(r);

    const vr = varianceSample(nums);
    outVariance.textContent = vr == null ? "—" : formatNumber(vr);

    const sd = stdevSample(nums);
    outStdev.textContent = sd == null ? "—" : formatNumber(sd);

    const cv = cvPercent(nums);
    outCV.textContent = cv == null ? "—" : formatNumber(cv);

    outVarType.textContent = classifyRowNumbers(nums);

    const sorted = nums.slice().sort((a, b) => a - b);

    const ma3 = movingAverageSeries(nums, 3);
    outMovAvg3.textContent =
      ma3 == null
        ? "— (necesitás al menos 3 valores, en el orden de las columnas elegidas)"
        : ma3.map((x) => formatNumber(x)).join("  |  ");

    const ma4 = movingAverageSeries(nums, 4);
    outMovAvg4.textContent =
      ma4 == null
        ? "— (necesitás al menos 4 valores, en el orden de las columnas elegidas)"
        : ma4.map((x) => formatNumber(x)).join("  |  ");

    const gm = geometricMean(nums);
    outGeomMean.textContent =
      gm == null
        ? nums.length === 0
          ? "—"
          : "— (todos los valores deben ser > 0)"
        : formatNumber(gm);

    const hm = harmonicMean(nums);
    outHarmMean.textContent =
      hm == null
        ? nums.length === 0
          ? "—"
          : "— (ningún valor puede ser 0)"
        : formatNumber(hm);

    outQuartiles.textContent = quartilesText(sorted);
    outDeciles.textContent = decilesText(sorted);
    outPercentiles.textContent = percentilesCommonText(sorted);
    outFreqDist.textContent = frequencyDistributionText(nums);

    const kurt = kurtosisExcessSample(nums);
    outKurtosis.textContent = kurt == null ? "—" : formatNumber(kurt);

    const skew = skewnessSample(nums);
    outSkewness.textContent = skew == null ? "—" : formatNumber(skew);
    renderVisualizations(nums);

    updateStepsHint();
    updateDataColsRequirementNote();
    updatePedagogicalStepsUI();
  }

  function updatePreview() {
    renderExcelTable(outExcelTable, outExcelMeta, loadedExcelView);
  }

  async function pickAndLoadExcel({ runLookupAfterLoad } = { runLookupAfterLoad: false }) {
    excelFile.value = "";

    return new Promise((resolve) => {
      const onChange = async () => {
        excelFile.removeEventListener("change", onChange);
        const file = excelFile.files?.[0];
        if (!file) {
          setMessage(message, "err", "No se seleccionó ningún archivo.");
          resolve(false);
          return;
        }

        try {
          setMessage(message, null, "Cargando Excel…");
          const loaded = await loadFromFile(file);
          loadedRegistry = loaded.registry;
          loadedFileName = file.name;
          loadedExcelView = { ...loaded.excelView, selectedRowIndex: null };
          initMappingUIFromHeaders(loadedExcelView.headers);
          updatePreview();
          updateStepsHint();
          updateDataColsRequirementNote();
          updatePedagogicalStepsUI();
          setMessage(
            message,
            "ok",
            `Excel cargado: ${file.name} (${loadedRegistry.length} registros para búsqueda).`,
          );
          resolve(true);

          if (runLookupAfterLoad) {
            form.requestSubmit();
          }
        } catch (err) {
          loadedRegistry = null;
          loadedFileName = null;
          loadedExcelView = { fileName: null, headers: [], rows: [], selectedRowIndex: null };
          updatePreview();
          updateStepsHint();
          updateDataColsRequirementNote();
          updatePedagogicalStepsUI();
          setMessage(message, "err", err?.message ?? "No se pudo leer el archivo.");
          resolve(false);
        }
      };

      excelFile.addEventListener("change", onChange);
      excelFile.click();
    });
  }

  clearOutput();
  updatePreview();
  setMessage(message, null, "Listo. Cargá un Excel o buscá con el ejemplo.");

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.module;
      if (id) setActiveModule(id);
    });
  });
  setActiveModule(activeModule);

  if (loadExcelBtn) {
    loadExcelBtn.addEventListener("click", async () => {
      await pickAndLoadExcel({ runLookupAfterLoad: false });
    });
  }

  if (runSamplingBtn) {
    runSamplingBtn.addEventListener("click", () => {
    const mod = activeModule;
    if (!isSamplingModule(mod)) return;
    if (!loadedExcelView.rows?.length) {
      setMessage(message, "err", "Primero cargá un Excel.");
      return;
    }
    const rows = loadedExcelView.rows;
    const n = Number(String(samplingN.value ?? "").trim());
    if (!Number.isInteger(n) || n <= 0) {
      setMessage(message, "err", "Ingresá un tamaño n (entero positivo).");
      return;
    }
    const vCol = Number(samplingValueCol.value);
    if (!Number.isInteger(vCol) || vCol < 0) {
      setMessage(message, "err", "Elegí la columna de valores.");
      return;
    }

    let payload;
    if (mod === "mas") {
      const pop = columnNumericPopulation(rows, vCol);
      payload = { tipo: "aleatorio simple", tamPoblacion: pop.length, muestra: sampleSRS(pop, n) };
    } else if (mod === "msist") {
      const pop = columnNumericPopulation(rows, vCol);
      payload = { tipo: "sistemático", tamPoblacion: pop.length, muestra: sampleSystematic(pop, n) };
    } else if (mod === "mestrat") {
      const sCol = Number(samplingStratumCol.value);
      const r = sampleStratified(rows, sCol, vCol, n);
      payload = { tipo: "estratificado", asignacion: r.note, muestra: r.sample };
    } else {
      const cCol = Number(samplingClusterCol.value);
      const r = sampleCluster(rows, cCol, vCol, n);
      payload = {
        tipo: "conglomerados",
        conglomeradosElegidos: r.chosen,
        detalle: r.note,
        muestra: r.sample,
      };
    }

    samplingOutput.textContent = JSON.stringify(payload, null, 2);
    renderSamplingPretty(payload);
    setMessage(message, "ok", "Muestreo generado. Resultado abajo.");
    updateStepsHint();
    });
  }

  if (docColSelect) {
    docColSelect.addEventListener("change", () => {
      mapping.docCol = Number(docColSelect.value);
    });
  }

  if (popColSelect) {
    popColSelect.addEventListener("change", () => {
      const v = popColSelect.value;
      mapping.popCol = v === "" ? null : Number(v);
    });
  }

  if (dataColsSelect) {
    dataColsSelect.addEventListener("change", () => {
      mapping.dataCols = getMultiSelectValues(dataColsSelect);
      updateDataColsRequirementNote();
      const idx = loadedExcelView.selectedRowIndex;
      if (idx != null && loadedExcelView.rows?.[idx]) {
        renderResultFromRow(loadedExcelView.rows[idx], idx);
      } else {
        updatePedagogicalStepsUI();
      }
    });
  }

  if (useRowBtn) {
    useRowBtn.addEventListener("click", () => {
    if (!loadedExcelView.fileName) {
      setMessage(message, "err", "Primero cargá un Excel.");
      return;
    }
    const idx1 = Number(String(rowIndexInput.value ?? "").trim());
    if (!Number.isInteger(idx1) || idx1 <= 0) {
      setMessage(message, "err", "Ingresá un número de fila válido (1, 2, 3…).");
      return;
    }
    const rowIndex = idx1 - 1;
    const row = loadedExcelView.rows?.[rowIndex];
    if (!row) {
      setMessage(message, "err", "Esa fila no existe en el archivo.");
      return;
    }
    renderResultFromRow(row, rowIndex);
    setMessage(message, "ok", `Fila ${idx1} aplicada.`);
    });
  }

  if (outExcelTable) {
    outExcelTable.addEventListener("click", (e) => {
    const tr = e.target?.closest?.("tr[data-row-index]");
    if (!tr) return;
    const rowIndex = Number(tr.getAttribute("data-row-index"));
    if (!Number.isInteger(rowIndex) || rowIndex < 0) return;
    const row = loadedExcelView.rows?.[rowIndex];
    if (!row) return;
    renderResultFromRow(row, rowIndex);
    rowIndexInput.value = String(rowIndex + 1);
    setMessage(message, "ok", `Fila ${rowIndex + 1} seleccionada (click).`);
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
    e.preventDefault();

    const doc = normalizeDocument(input.value);
    if (!loadedExcelView.fileName) {
      setMessage(message, null, "Elegí un Excel para buscar…");
      void pickAndLoadExcel({ runLookupAfterLoad: true });
      return;
    }

    if (!doc) {
      const selected = loadedExcelView.selectedRowIndex;
      if (selected == null) {
        setMessage(message, "err", "Ingresá un documento o elegí una fila.");
        return;
      }
      const row = loadedExcelView.rows?.[selected];
      if (!row) {
        setMessage(message, "err", "La fila seleccionada no existe.");
        return;
      }
      renderResultFromRow(row, selected);
      return;
    }

    const found = getRowByDocument(doc);
    if (!found) {
      setMessage(message, "err", `No se encontró el documento ${doc} en la columna elegida.`);
      clearOutput();
      outDocument.textContent = doc;
      return;
    }

    renderResultFromRow(found.row, found.rowIndex);
    setMessage(message, "ok", "Encontrado. Resultados calculados según columnas seleccionadas.");
    });
  }

  function rebuildTeachingSnapshotFromDOM() {
    const headers = loadedExcelView.headers || [];
    const rowIdx = loadedExcelView.selectedRowIndex;
    const row = rowIdx != null ? loadedExcelView.rows?.[rowIdx] : null;
    const nums = row
      ? (mapping.dataCols || []).map((c) => toNumberLoose(row[c])).filter(isFiniteNumber)
      : [];
    const dataColLabels = (mapping.dataCols || []).map((i) => headers[i] || `Col ${i + 1}`);
    const docColLabel = headers[mapping.docCol] || `Col ${(mapping.docCol ?? 0) + 1}`;
    const popLabel =
      mapping.popCol == null ? "(ninguna)" : headers[mapping.popCol] || `Col ${(mapping.popCol ?? 0) + 1}`;

    const outputs = {
      Documento: outDocument.textContent,
      Población: outPopulation.textContent,
      "Lista datos (texto)": outData.textContent,
      Media: outMean.textContent,
      Mediana: outMedian.textContent,
      Moda: outMode.textContent,
      Rango: outRange.textContent,
      "Varianza muestral": outVariance.textContent,
      "Desv. estándar muestral": outStdev.textContent,
      "Coef. variación %": outCV.textContent,
      "Clasificación variable": outVarType.textContent,
      "Media móvil orden 3": outMovAvg3.textContent,
      "Media móvil orden 4": outMovAvg4.textContent,
      "Media geométrica": outGeomMean.textContent,
      "Media armónica": outHarmMean.textContent,
      Cuartiles: outQuartiles.textContent,
      Deciles: outDeciles.textContent,
      Percentiles: outPercentiles.textContent,
      "Distrib. frecuencias": outFreqDist.textContent,
      "Curtosis exceso": outKurtosis.textContent,
      Asimetría: outSkewness.textContent,
    };

    const info = MODULE_INFO[activeModule] ?? { title: "", body: "" };
    const steps = MODULE_STEPS[activeModule] ?? [];
    const type = isSamplingModule(activeModule) ? "muestreo" : "fila";

    const pedagogicalLines = isSamplingModule(activeModule)
      ? []
      : pedagogicalStepsForModule(activeModule, nums) ?? [];

    const snap = {
      date: new Date().toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" }),
      activeModule,
      moduleTitle: info.title,
      moduleBody: info.body,
      steps,
      type,
      fileName: loadedFileName,
      headers,
      rowIndex0based: rowIdx,
      rowHuman: rowIdx == null ? null : rowIdx + 1,
      rowRaw: row ? [...row] : null,
      doc: row ? normalizeDocument(row[mapping.docCol]) : "",
      mapping: {
        docCol: mapping.docCol,
        popCol: mapping.popCol,
        dataCols: [...(mapping.dataCols || [])],
      },
      docColLabel,
      popLabel,
      dataColLabels,
      nums,
      pedagogicalLines,
      outputs,
      samplingValueCol: samplingValueCol.value,
      samplingStratumCol: samplingStratumCol.value,
      samplingClusterCol: samplingClusterCol.value,
      samplingNInput: samplingN.value,
      samplingJson: (() => {
        if (type !== "muestreo") return null;
        const t = samplingOutput.textContent.trim();
        return t && t !== "—" ? t : null;
      })(),
    };
    snap.narrative = buildStudentNarrative(snap);
    return snap;
  }

  if (exportExcelBtn) {
    exportExcelBtn.addEventListener("click", () => {
      if (typeof window.XLSX?.utils?.book_new !== "function") {
        setMessage(
          message,
          "err",
          "No está disponible la librería para crear Excel. Revisá tu conexión y recargá la página.",
        );
        return;
      }
      try {
        const snap = rebuildTeachingSnapshotFromDOM();
        const wb = buildTeachingExportWorkbook(snap);
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        window.XLSX.writeFile(wb, `estadistica_clase_${stamp}.xlsx`);
        setMessage(message, "ok", "Listo: se descargó el Excel (resumen, pasos, datos, resultados y guía).");
      } catch (e) {
        setMessage(message, "err", e?.message ?? "No se pudo generar el archivo.");
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      input.value = "";
      loadedExcelView.selectedRowIndex = null;
      clearOutput();
      samplingOutput.textContent = "—";
      if (samplingPretty) {
        samplingPretty.classList.add("hidden");
        samplingPretty.innerHTML = "";
      }
      updatePreview();
      updateStepsHint();
      updateDataColsRequirementNote();
      setMessage(message, null, "Listo para buscar.");
      input.focus();
    });
  }
}

document.addEventListener("DOMContentLoaded", main);

