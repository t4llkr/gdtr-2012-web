// Порт se.codebrew.gdtr.graphics.u (ProgressHud) — полоса прогресса
// внизу экрана: чёрная рамка, белое заполнение от старта до цели.

import { Paint, drawRect, drawCircle } from './Paint.js';

export class ProgressHud {
  // (D startX, D goalX, a/c particle, D offset)
  constructor(startX, goalX, particle, offset) {
    this.startX = startX;     // a
    this.goalX = goalX;       // b
    this.particle = particle; // c
    this.offset = offset;     // d
    this.cachedW = 0;         // e
    this.g = { left: 0, top: 0, right: 0, bottom: 0 }; // g — чёрный Rect
    this.h = { left: 0, top: 0, right: 0, bottom: 0 }; // h — белый Rect
    this.i = new Paint();     // i — чёрная заливка
    this.i.setARGB(255, 0, 0, 0);
    this.i.setStyle('FILL');
    this.i.setAntiAlias(true);
    this.j = new Paint();     // j — белая заливка
    this.j.setARGB(255, 255, 255, 255);
    this.j.setStyle('FILL');
    this.j.setAntiAlias(true);
  }

  draw(ctx, w, h) {
    if (this.cachedW !== w) {
      this.cachedW = w;
      this.g.left = Math.trunc(w / 4.2);
      this.g.top = Math.trunc((9.7 * h) / 10) - 2;
      this.g.right = Math.trunc((3 * w) / 4.2);
      this.g.bottom = Math.trunc((9.7 * h) / 10) + 2;
      this.h.left = this.g.left + 1;
      this.h.top = this.g.top + 1;
      this.h.right = this.g.right - 1;
      this.h.bottom = this.g.bottom - 1;
    }

    let progress = (this.particle.pos.x - (this.startX + this.offset)) /
                   (this.goalX - (this.startX + this.offset));
    if (progress < 0) progress = 0;
    // h.right = min(g.width * progress + h.left, g.right - 1)
    const gWidth = this.g.right - this.g.left;
    this.h.right = Math.min(gWidth * progress + this.h.left, this.g.right - 1);

    const centerY = (this.g.top + this.g.bottom) / 2;
    drawRect(ctx, this.g.left, this.g.top, this.g.right, this.g.bottom, this.i);
    drawCircle(ctx, this.g.left, centerY, 6.5, this.i);
    drawCircle(ctx, this.g.right, centerY, 6.5, this.i);
    drawCircle(ctx, this.g.left, centerY, 5.5, this.j);
    drawCircle(ctx, this.g.right, centerY, 5.5, this.j);
    drawRect(ctx, this.h.left, this.h.top, this.h.right, this.h.bottom, this.j);
  }

  release() { this.particle = null; }
}
