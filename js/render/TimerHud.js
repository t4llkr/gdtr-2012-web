// Порт se.codebrew.gdtr.graphics.s (TimerHud) — таймер "MM:SS:CC" справа сверху.
// В оригинале источник времени — se.codebrew.gdtr.r (GameController).b() -> int centis.
// На этом этапе передаётся любой объект с методом b().

import { DefaultPaints } from './DefaultPaints.js';
import { drawText, getTextBounds } from './Paint.js';

export class TimerHud {
  constructor(timeSource) {
    this.visible = true;         // a
    this.timeSource = timeSource; // b (r)
    this.bounds = { w: 0, h: 0 }; // c — Rect
    this.chars = Array.from('  :  :  ');  // d — 8 символов
    this.template = Array.from('99:99:99'); // e — шаблон для измерения
  }

  setVisible(v) { this.visible = v; } // a(Z)

  draw(ctx, w, h) {
    if (!this.visible) return;

    const t = this.timeSource.b(); // centis (int)
    const cs = t % 100;
    const totalSec = Math.floor(t / 100);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;

    this.chars[0] = String.fromCharCode(48 + Math.floor(min / 10));
    this.chars[1] = String.fromCharCode(48 + (min % 10));
    this.chars[3] = String.fromCharCode(48 + Math.floor(sec / 10));
    this.chars[4] = String.fromCharCode(48 + (sec % 10));
    this.chars[6] = String.fromCharCode(48 + Math.floor(cs / 10));
    this.chars[7] = String.fromCharCode(48 + (cs % 10));

    // замер шаблона краской d.b
    const b = getTextBounds(ctx, DefaultPaints.b, this.template.join(''));
    this.bounds.w = b.width;
    this.bounds.h = b.height;

    const x = w - this.bounds.w - this.bounds.h;
    const y = this.bounds.h * 2;
    const text = this.chars.join('');
    drawText(ctx, text, x, y, DefaultPaints.b); // чёрная обводка
    drawText(ctx, text, x, y, DefaultPaints.a); // белая заливка
  }

  // a() — в оригинале вызывает r.a() (release контроллера); связь сохранена
  release() {
    if (this.timeSource && typeof this.timeSource.a === 'function') {
      this.timeSource.a();
    }
    this.timeSource = null;
  }
}
