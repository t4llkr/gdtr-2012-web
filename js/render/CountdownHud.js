// Порт части se.codebrew.gdtr.b.p, отвечающей за обратный отсчёт.
// Отсчёт связан со счётчиком шагов движка: 3 — до 30, 2 — до 60, 1 — до 90.

import { DefaultPaints } from './DefaultPaints.js';
import { Paint, drawText, getTextBounds } from './Paint.js';

const COUNTDOWN_TEXT_SIZE = Math.fround(Math.fround(43.33330154418945 * 1.5) * 2.0);

export class CountdownHud {
  constructor(engine) {
    this.engine = engine;
    this.paint = new Paint(DefaultPaints.w);
    this.paint.setTextSize(COUNTDOWN_TEXT_SIZE);
    this.paint.setTypeface('DEFAULT_BOLD');
    this.paint.setAntiAlias(true);
    this.paint.setShadowLayer(3.0, 2.0, 2.0, 0xff000000);
  }

  draw(ctx, w, h) {
    if (this.engine === null || w <= 0 || h <= 0) return;
    const frame = this.engine.getFrame();
    const text = frame < 30 ? '3' : frame < 60 ? '2' : frame < 90 ? '1' : null;
    if (text === null) return;
    const bounds = getTextBounds(ctx, this.paint, text);
    const x = w / 2.0 - bounds.width / 2.0;
    const y = (h / 5.0) * 2.0 - bounds.height / 5.0;
    drawText(ctx, text, x, y, this.paint);
  }

  release() { this.engine = null; }
}
