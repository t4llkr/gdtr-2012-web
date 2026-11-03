// Порт se.codebrew.gdtr.graphics.m (Renderer) — композитор сцены.
//
// a(Canvas): фон → save → scale(1,-1) → камера (scale s, translate) →
// мировые рендереры → restore → HUD.
// В JS эквивалентная цепочка: translate(w/2, h/2) → scale(s, -s) →
// translate(-pos.x, -pos.y) (то же аффинное преобразование, что в оригинале).

import { Paint, drawRect } from './Paint.js';
import { DefaultPaints } from './DefaultPaints.js';
import { Camera } from './Camera.js';

export class Renderer {
  constructor() {
    this.world = [];              // a — список d (draw(ctx), release())
    this.hud = [];                // b — список e (draw(ctx, w, h), release())
    this.camera = null;           // d — graphics/b
    this.width = 0;               // e
    this.height = 0;              // f
    this.bg = new Paint(DefaultPaints.n); // g — фон (по умолч. d.n)
  }

  setBackground(paint) { this.bg = paint; }       // a(Paint)
  setCamera(camera) { this.camera = camera; }     // a(graphics/b)
  addWorld(r) { this.world.push(r); }             // a(d)
  addHud(r) { this.hud.push(r); }                 // a(e)
  removeHud(r) {                                  // b(e)
    const i = this.hud.indexOf(r);
    if (i >= 0) this.hud.splice(i, 1);
  }

  // a(Canvas, w, h) — в оригинале размеры берутся из SurfaceView;
  // здесь передаются явно (поля e/f обновляются, как в onSurfaceChanged)
  draw(ctx, w, h) {
    this.width = w;
    this.height = h;

    drawRect(ctx, 0, 0, w, h, this.bg);

    ctx.save();
    if (this.camera !== null) {
      const s = Camera.getScale(); // 1.5 * zoom
      const pos = this.camera.getTarget();
      if (pos !== null) {
        // оригинал: scale(1,-1); scale(s,s); translate(-pos.x + w/2s, -pos.y - h/2s)
        // эквивалент: translate(w/2, h/2); scale(s,-s); translate(-pos.x,-pos.y)
        ctx.translate(w / 2, h / 2);
        ctx.scale(s, -s);
        ctx.translate(-pos.x, -pos.y);
      } else {
        ctx.scale(1, -1);
      }
    } else {
      ctx.scale(1, -1);
    }
    for (const r of this.world) r.draw(ctx);
    ctx.restore();

    for (const r of this.hud) r.draw(ctx, w, h);
  }

  // a() — release всех
  release() {
    for (const r of this.world) r.release();
    this.world.length = 0;
    for (const r of this.hud) r.release();
    this.hud.length = 0;
    if (this.camera !== null) {
      this.camera.release();
      this.camera = null;
    }
  }
}
