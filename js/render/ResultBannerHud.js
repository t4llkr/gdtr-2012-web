// Порт se.codebrew.gdtr.t — центральный баннер «Success» / «Crashed».

import { Paint, drawText, getTextBounds } from './Paint.js';

export class ResultBannerHud {
  constructor(success, text) {
    this.success = success;
    this.text = text;
    this.paint = new Paint();
    this.textSize = 1.0;
    this.bounds = { width: 0, height: 0 };
  }

  draw(ctx, w, h) {
    this.textSize = Math.fround(Math.fround(Math.fround(43.33330154418945) * 1.5) * 2.0);
    if (this.success) this.paint.setARGB(255, 255, 255, 255);
    this.paint.setTextSize(this.textSize);
    this.paint.setTypeface('DEFAULT_BOLD');
    this.paint.setAntiAlias(true);
    this.paint.setShadowLayer(3.0, 2.0, 2.0, 0xff000000);
    this.bounds = getTextBounds(ctx, this.paint, this.text);
    drawText(ctx, this.text, w / 2.0 - this.bounds.width / 2.0, h / 2.0, this.paint);
  }

  release() {}
}
