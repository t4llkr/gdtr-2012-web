// Эмуляция android.graphics.Paint + примитивы Canvas для порта GDTR.
// Android Canvas и HTML5 Canvas совпадают по модели (fill/stroke, path, матрица),
// поэтому это тонкий адаптер, а не переосмысление.

export class Paint {
  constructor(src) {
    if (src) {
      this.a = src.a; this.r = src.r; this.g = src.g; this.b = src.b;
      this.style = src.style;
      this.strokeWidth = src.strokeWidth;
      this.antiAlias = src.antiAlias;
      this.textSize = src.textSize;
      this.textScaleX = src.textScaleX;
      this.typeface = src.typeface;
      this.shadow = src.shadow ? { ...src.shadow } : null;
      this.corner = src.corner;   // CornerPathEffect radius (null = нет)
      this.cap = src.cap;         // 'butt' | 'round'
    } else {
      // дефолты android Paint
      this.a = 255; this.r = 0; this.g = 0; this.b = 0;
      this.style = 'FILL';
      this.strokeWidth = 0;
      this.antiAlias = false;
      this.textSize = 12;
      this.textScaleX = 1;
      this.typeface = 'DEFAULT';
      this.shadow = null;
      this.corner = null;
      this.cap = 'butt';
    }
  }

  setARGB(a, r, g, b) { this.a = a; this.r = r; this.g = g; this.b = b; }
  setAlpha(a) { this.a = a; }
  setStyle(s) { this.style = s; }               // FILL | STROKE | FILL_AND_STROKE
  setStrokeWidth(w) { this.strokeWidth = w; }
  setAntiAlias(v) { this.antiAlias = v; }
  setTextSize(s) { this.textSize = s; }
  setTextScaleX(s) { this.textScaleX = s; }
  setTypeface(t) { this.typeface = t; }
  setShadowLayer(radius, dx, dy, color) {
    this.shadow = { radius, dx, dy, color };
  }
  setStrokeCap(c) { this.cap = c; }
  setCornerPathEffect(r) { this.corner = r; }

  get color() {
    return `rgba(${this.r},${this.g},${this.b},${this.a / 255})`;
  }
}

// Skia CornerPathEffect для открытой ломаной: каждый внутренний угол
// заменяется квадратичной кривой с контрольной точкой в исходной вершине.
export function createCornerPath(points, radius) {
  const path = new Path2D();
  if (points.length === 0) return path;
  path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    let stepX = curr.x - prev.x;
    let stepY = curr.y - prev.y;
    const dist = Math.hypot(stepX, stepY);
    const drawSegment = dist > radius * 2;
    if (drawSegment) {
      stepX *= radius / dist;
      stepY *= radius / dist;
    } else {
      stepX *= 0.5;
      stepY *= 0.5;
    }
    path.quadraticCurveTo(prev.x, prev.y, prev.x + stepX, prev.y + stepY);
    if (drawSegment) path.lineTo(curr.x - stepX, curr.y - stepY);
  }
  const last = points[points.length - 1];
  path.lineTo(last.x, last.y);
  return path;
}

// --- применение paint к контексту ---
function applyStroke(ctx, p) {
  ctx.strokeStyle = p.color;
  ctx.lineWidth = p.strokeWidth;
  ctx.lineJoin = p.corner != null ? 'round' : 'miter';
  ctx.lineCap = p.cap;
  applyShadow(ctx, p);
}

function applyFill(ctx, p) {
  ctx.fillStyle = p.color;
  applyShadow(ctx, p);
}

function applyShadow(ctx, p) {
  if (p.shadow && ((p.shadow.color >>> 24) !== 0 || (p.shadow.color & 0xff000000) !== 0)) {
    const c = p.shadow.color >>> 0;
    ctx.shadowColor = `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${((c >>> 24) & 255) / 255})`;
    ctx.shadowBlur = p.shadow.radius;
    ctx.shadowOffsetX = p.shadow.dx;
    ctx.shadowOffsetY = p.shadow.dy;
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
}

function drawWithStyle(ctx, p, fillFn, strokeFn) {
  if (p.style === 'FILL' || p.style === 'FILL_AND_STROKE') {
    applyFill(ctx, p); fillFn();
  }
  if (p.style === 'STROKE' || p.style === 'FILL_AND_STROKE') {
    applyShadow(ctx, p); // тень вторая — у stroke-прохода
    applyStroke(ctx, p); strokeFn();
  }
}

// --- примитивы android.graphics.Canvas ---
export function drawPath(ctx, path, p) {
  drawWithStyle(ctx, p, () => ctx.fill(path), () => ctx.stroke(path));
}

export function drawCircle(ctx, cx, cy, r, p) {
  const path = new Path2D();
  path.arc(cx, cy, r, 0, Math.PI * 2);
  drawWithStyle(ctx, p, () => ctx.fill(path), () => ctx.stroke(path));
}

export function drawLine(ctx, x0, y0, x1, y1, p) {
  const path = new Path2D();
  path.moveTo(x0, y0);
  path.lineTo(x1, y1);
  // drawLine игнорирует FILL — только stroke
  applyStroke(ctx, p);
  ctx.stroke(path);
}

export function drawRect(ctx, left, top, right, bottom, p) {
  const path = new Path2D();
  path.rect(left, top, right - left, bottom - top);
  drawWithStyle(ctx, p, () => ctx.fill(path), () => ctx.stroke(path));
}

// android drawText: (x, y) — baseline, шрифт sans-serif (дефолт Android)
export function drawText(ctx, text, x, y, p) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.textScaleX, 1);
  ctx.font = `${p.typeface === 'DEFAULT_BOLD' ? 'bold ' : ''}${p.textSize}px sans-serif`;
  ctx.textBaseline = 'alphabetic';
  drawWithStyle(ctx, p, () => ctx.fillText(text, 0, 0), () => ctx.strokeText(text, 0, 0));
  ctx.restore();
}

// android Paint.measureText (учитывает textScaleX)
export function measureText(ctx, p, text) {
  ctx.save();
  ctx.font = `${p.typeface === 'DEFAULT_BOLD' ? 'bold ' : ''}${p.textSize}px sans-serif`;
  const w = ctx.measureText(text).width * p.textScaleX;
  ctx.restore();
  return w;
}

// android Paint.getTextBounds -> {width, height} (габариты глифов)
export function getTextBounds(ctx, p, text) {
  ctx.save();
  ctx.font = `${p.typeface === 'DEFAULT_BOLD' ? 'bold ' : ''}${p.textSize}px sans-serif`;
  const m = ctx.measureText(text);
  const w = m.width * p.textScaleX;
  const h = ((m.actualBoundingBoxAscent || p.textSize * 0.7) +
             (m.actualBoundingBoxDescent || p.textSize * 0.25));
  ctx.restore();
  return { width: w, height: h };
}
