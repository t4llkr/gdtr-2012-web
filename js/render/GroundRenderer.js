// Порт se.codebrew.gdtr.graphics.o — заливка грунта (область под трассой).
// Точки — полная копия точек уровня; краска — копия SchemeManager.d (ground).

import { Vec2 } from '../core/Vec2.js';
import { Paint } from './Paint.js';
import { AreaRenderer } from './AreaRenderer.js';
import { SchemeManager } from './SchemeManager.js';

export class GroundRenderer extends AreaRenderer {
  constructor(level, canvas) {
    super(canvas);
    this.points = level.points.map(p => Vec2.copy(p)); // b (i.b() — копия точек)
    this.paint = new Paint(SchemeManager.d); // a
  }

  getPoints() { return this.points; }

  // d.a(Canvas)
  draw(ctx) { this.drawArea(ctx, this.paint); }

  // d.a()V
  release() { this.points.length = 0; }
}
