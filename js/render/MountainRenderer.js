// Порт se.codebrew.gdtr.graphics.p — горы (параллакс-фон).
// Случайная ломаная над трассой; рисуется с масштабом 2x и сдвигом
// (center - particle.pos) / 10 — параллакс 1/10.

import { Vec2 } from '../core/Vec2.js';
import { Paint } from './Paint.js';
import { AreaRenderer } from './AreaRenderer.js';
import { SchemeManager } from './SchemeManager.js';

export class MountainRenderer extends AreaRenderer {
  constructor(level, particle, canvas) {
    super(canvas);
    this.particle = particle;   // a (частица-параллакс; в оригинале rider.b() = g)
    this.level = level;         // b
    this.points = [];           // e
    this.maxY = 0.0;            // f
    this.minY = 0.0;            // g
    const gen = this.generate();
    for (const p of gen) this.points.push(Vec2.copy(p));
    this.paint = new Paint(SchemeManager.b); // d (mountain)
    this.paint.setCornerPathEffect(2.0);     // CornerPathEffect(2.0f)
  }

  // p.c()Ljava/util/List; — генерация точек гор
  generate() {
    const out = [];
    const pts = this.level.points;
    let prev = pts[0];
    // subList(1, size-1): точки 1..size-2
    for (let i = 1; i < pts.length - 1; i++) {
      const cur = pts[i];
      const baseY = (prev.y + cur.y) / 2.0;
      let x = prev.x;
      while (x < cur.x) {
        const px = x - 2.0 + Math.random() * 4.0;
        const py = (150.0 + baseY + (Math.random() * 50.0 * 2.0 - 50.0)) * 0.25 + 0.75 * baseY;
        if (py > this.maxY) this.maxY = py;
        if (py < this.minY) this.minY = py;
        out.push(new Vec2(px, py));
        x += 10.0;
      }
      prev = cur;
    }
    // c = ((first.x - last.x) / 2, (first.y - last.y) / 2)
    const first = pts[0], last = pts[pts.length - 1];
    this.center = new Vec2((first.x - last.x) / 2.0, (first.y - last.y) / 2.0);
    return out;
  }

  getPoints() { return this.points; }

  // d.a(Canvas)
  draw(ctx) {
    ctx.save();
    ctx.scale(2.0, 2.0);
    ctx.translate((this.center.x - this.particle.pos.x) / 10.0,
                  (this.center.y - this.particle.pos.y) / 10.0);
    this.drawArea(ctx, this.paint);
    ctx.restore();
  }

  // d.a()V
  release() {
    this.particle = null;
    this.level = null;
    this.center = null;
    this.points.length = 0;
  }
}
