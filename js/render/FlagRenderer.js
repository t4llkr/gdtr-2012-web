// Порт se.codebrew.gdtr.graphics.r — линия трассы + финишный флаг.
// Несмотря на имя, рисует саму трассу (Path по всем точкам, краска surface
// с CornerPathEffect(4)) и флаг в точке финиша.

import { Vec2 } from '../core/Vec2.js';
import { Paint, drawPath, drawLine, createCornerPath } from './Paint.js';
import { SchemeManager } from './SchemeManager.js';

export class FlagRenderer {
  constructor(level) {
    this.trackPath = new Path2D(); // a
    this.flagPath = new Path2D();  // b
    this.bounds = null;            // e (RectF — габариты трассы; в оригинале не читается)

    this.trackPoints = level.points.slice(); // j

    // a(Ljava/util/List;) — построение Path трассы + computeBounds
    {
      let first = true;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of level.points) {
        if (first) { this.trackPath.moveTo(p.x, p.y); first = false; }
        else this.trackPath.lineTo(p.x, p.y);
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      this.bounds = { left: minX, top: minY, right: maxX, bottom: maxY };
    }

    this.start = Vec2.copy(level.getStartPoint()); // c = копия i.e()
    this.goal = Vec2.copy(level.getGoalPoint());   // d = копия i.f()

    // g — surface + тень (в оригинале создаётся, но нигде не используется)
    this.paintShadowSurface = new Paint(SchemeManager.c);
    this.paintShadowSurface.setShadowLayer(0.5, 0.3, 0.1, 0xff000000);

    // f — surface + CornerPathEffect(4) — краска линии трассы
    this.trackPaint = new Paint(SchemeManager.c);
    this.trackPaint.setCornerPathEffect(4.0);
    this.trackPath = createCornerPath(level.points, 4.0);

    // флажок-треугольник: (0,40) -> (10,35) -> (0,30)
    this.flagPath.moveTo(0, 40.0);
    this.flagPath.lineTo(10.0, 35.0);
    this.flagPath.lineTo(0, 30.0);
    this.flagPath.closePath();

    // h — flag, sw=2, тень, FILL (заливка флажка)
    this.flagFillPaint = new Paint(SchemeManager.f);
    this.flagFillPaint.setStrokeWidth(2.0);
    this.flagFillPaint.setShadowLayer(0.5, 0.1, 0.1, 0xff000000);
    this.flagFillPaint.setStyle('FILL');

    // i — flag, sw=2, тень (стиль остаётся из схемы — древко)
    this.polePaint = new Paint(SchemeManager.f);
    this.polePaint.setStrokeWidth(2.0);
    this.polePaint.setShadowLayer(0.5, 0.1, 0.1, 0xff000000);
  }

  // d.a(Canvas)
  draw(ctx) {
    drawPath(ctx, this.trackPath, this.trackPaint);
    ctx.save();
    ctx.translate(this.goal.x, this.goal.y);
    drawLine(ctx, 0, 0, 0, 40.0, this.polePaint);
    drawPath(ctx, this.flagPath, this.flagFillPaint);
    ctx.restore();
  }

  // d.a()V
  release() {
    this.start = null;
    this.goal = null;
  }
}
