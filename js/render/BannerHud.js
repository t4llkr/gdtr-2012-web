// Порт se.codebrew.gdtr.graphics.q (BannerHud) — баннер с заголовком
// уровня и подзаголовком (лучшее время). Текст уменьшается, пока не
// влезет в 45% ширины экрана.

import { Paint, drawText, measureText, getTextBounds } from './Paint.js';

export class BannerHud {
  constructor(title, subtitle) {
    this.cachedW = 0.0;          // b:F
    this.cachedH = 0.0;          // c:F
    this.baseTextSize = 25.0;    // d:F
    this.visible = true;         // h:Z
    this.recordTime = true;      // i:Z (в оригинале пишет j=currentTimeMillis — мёртвое)
    this.timeRecorded = 0;       // j:J (мёртвое)
    this.bottom = false;         // n — Boolean.FALSE: рисовать снизу
    this.title = title;          // l
    this.subtitle = subtitle;    // m (может быть null)
    this.strokePaint = new Paint(); // e — чёрная обводка
    this.fillPaint = new Paint();   // f — белая заливка
    this.titleBounds = { w: 0, h: 0 };  // k — Rect
    this.subBounds = { w: 0, h: 0 };    // a — Rect
    this.g = '99:99:99';         // мёртвая строка-шаблон
  }

  setBottom(b) { this.bottom = b; }    // a(Boolean)
  setVisible(v) { this.visible = v; }  // a(Z)

  // a(Canvas, h:int, text, x, y) — в оригинале y = bottom ? y : h - y
  drawLine2(ctx, h, text, x, y) {
    const yy = this.bottom ? y : h - y;
    drawText(ctx, text, x, yy, this.strokePaint);
    drawText(ctx, text, x, yy, this.fillPaint);
  }

  draw(ctx, w, h) {
    if (!this.visible) return;

    if (this.cachedW !== w || this.cachedH !== h) {
      this.cachedW = w;
      this.cachedH = h;
      if (this.cachedW <= 0 || this.cachedH <= 0) return;

      const e = this.strokePaint;
      e.setARGB(255, 0, 0, 0);
      e.setStyle('STROKE');
      e.setStrokeWidth(4.5);
      e.setAntiAlias(true);
      e.setTextSize(this.baseTextSize);
      e.setTextScaleX(1.2000000476837158);
      e.setShadowLayer(1.0, 1.0, 1.0, 0xff000000);

      const f = this.fillPaint;
      f.setARGB(255, 255, 255, 255);
      f.setStyle('FILL_AND_STROKE');
      f.setStrokeWidth(2.5);
      f.setAntiAlias(true);
      f.setTextSize(this.baseTextSize);
      f.setTextScaleX(1.2000000476837158);

      // уменьшаем, пока заголовок не влезет в 45% ширины
      let tw = measureText(ctx, e, this.title);
      while (tw > this.cachedW * 0.44999998807907104) {
        e.setTextSize(e.textSize * 0.8999999761581421);
        e.setStrokeWidth(e.strokeWidth * 0.8999999761581421);
        f.setTextSize(f.textSize * 0.8999999761581421);
        f.setStrokeWidth(f.strokeWidth * 0.8999999761581421);
        tw = measureText(ctx, e, this.title);
      }

      this.titleBounds = getTextBounds(ctx, e, this.title);
      if (this.subtitle !== null) {
        this.subBounds = getTextBounds(ctx, e, this.subtitle);
      }

      if (this.recordTime) {
        this.timeRecorded = Date.now(); // мёртвое, как в оригинале
        this.recordTime = false;
      }
    }

    const x = this.titleBounds.height;
    if (this.subtitle !== null) {
      this.drawLine2(ctx, h, this.title, x, this.subBounds.height * 2 + this.subBounds.height * 2);
      this.drawLine2(ctx, h, this.subtitle, x, this.subBounds.height * 2);
    } else {
      this.drawLine2(ctx, h, this.title, x, this.titleBounds.height * 2);
    }
  }

  release() {}
}
