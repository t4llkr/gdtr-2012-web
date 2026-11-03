// Порт se.codebrew.gdtr.graphics.t (abstract) — заливка области за ломаной
// с кэшированием Path2D по clip-прямоугольнику.
//
// Оригинал читает canvas.getClipBounds — габариты клипа в ТЕКУЩЕЙ
// трансформации канваса. Здесь эквивалент — обратное отображение углов
// устройства через ctx.getTransform() (для аффинных матриц без поворота
// результат совпадает точно).

import { drawPath } from './Paint.js';

function getClipBounds(ctx, w, h) {
  const inv = ctx.getTransform().inverse();
  const pts = [
    inv.transformPoint({ x: 0, y: 0 }),
    inv.transformPoint({ x: w, y: 0 }),
    inv.transformPoint({ x: 0, y: h }),
    inv.transformPoint({ x: w, y: h }),
  ];
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const p of pts) {
    if (p.x < left) left = p.x;
    if (p.x > right) right = p.x;
    if (p.y < top) top = p.y;
    if (p.y > bottom) bottom = p.y;
  }
  return { left, top, right, bottom };
}

export class AreaRenderer {
  constructor(canvas) {
    this.canvas = canvas;     // для размеров устройства при getClipBounds
    this.cachedClip = null;   // Rect a
    this.path = new Path2D(); // Path b
  }

  // abstract: список точек (Vec2)
  getPoints() { return []; }

  // t.a(Canvas, Paint)
  drawArea(ctx, paint) {
    const clip = getClipBounds(ctx, this.canvas.width, this.canvas.height);
    const contains = this.cachedClip !== null &&
      this.cachedClip.left <= clip.left && this.cachedClip.right >= clip.right &&
      this.cachedClip.top <= clip.top && this.cachedClip.bottom >= clip.bottom;

    if (!contains) {
      const pts = this.getPoints();
      // a = new Rect(clip); a.inset(-w, -h) — расширение во все стороны
      const w = clip.right - clip.left;
      const h = clip.bottom - clip.top;
      const rect = {
        left: clip.left - w,
        right: clip.right + w,
        top: clip.top - h,
        bottom: clip.bottom + h,
      };
      this.cachedClip = rect;

      this.path = new Path2D();
      let needMoveTo = true;
      let prev = null;      // последняя обработанная точка (v5)
      let lastIn = null;    // последняя точка в окне (v1)

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.x >= rect.left && p.x <= rect.right) {
          if (needMoveTo) {
            if (prev !== null) this.path.moveTo(prev.x, prev.y);
            else this.path.moveTo(rect.left, p.y);
            this.path.lineTo(p.x, p.y);
            needMoveTo = false;
          } else {
            this.path.lineTo(p.x, p.y);
            lastIn = p;
          }
        }
        prev = p;
      }

      if (lastIn !== null) {
        const idx = pts.indexOf(lastIn);
        if (idx < pts.length - 1) {
          const nxt = pts[idx + 1];
          this.path.lineTo(nxt.x, nxt.y);
        } else {
          this.path.lineTo(rect.right, lastIn.y);
        }
      }
      this.path.lineTo(rect.right + 10, rect.top - 10);
      this.path.lineTo(rect.left - 10, rect.top - 10);
      this.path.closePath();
    }

    drawPath(ctx, this.path, paint);
  }

  // d.a()V — переопределяется наследниками
  release() {}
}
