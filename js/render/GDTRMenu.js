// Порт se.codebrew.gdtr.graphics.GDTRMenu и GDTRMenu$MenuItem.
// Меню оригинала — HUD на Canvas с обработкой ACTION_DOWN/MOVE/POINTER_DOWN.

import { DefaultPaints } from './DefaultPaints.js';
import { Paint, drawRect, drawText, getTextBounds } from './Paint.js';

const f = Math.fround;

class MenuItem {
  constructor(menu, text, action) {
    this.menu = menu;
    this.text = text;
    this.action = action;
    this.left = 0.0;
    this.top = 0.0;
    this.right = 0.0;
    this.bottom = 0.0;
    this.paint = new Paint(DefaultPaints.c);
    this.paint.setTextSize(f(f(f(13.33329963684082) * 1.5) * 2.0));
    this.paint.setTypeface('DEFAULT_BOLD');
    this.paint.setStyle('FILL');
    this.paint.setAntiAlias(true);
    this.paint.setShadowLayer(1.0, 1.0, 1.0, 0xff000000);

    const raw = getTextBounds(menu.controller.canvas.getContext('2d'), this.paint, text);
    // Rect.inset(-width/10, (int)(-height/1.2))
    const dx = Math.trunc(-raw.width / 10.0);
    const dy = Math.trunc(-raw.height / 1.2);
    this.bounds = {
      width: Math.abs(raw.width - 2 * dx),
      height: Math.abs(raw.height - 2 * dy),
    };
  }

  set(left, top, right, bottom) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  contains(x, y) {
    return x >= this.left && x < this.right && y >= this.top && y < this.bottom;
  }

  activate() { if (this.action) this.action(); }

  draw(ctx) {
    drawText(ctx, this.text,
      this.left + this.bounds.width / 20.0,
      this.bottom - this.bounds.height / 2.4,
      this.paint);
  }
}

export class GDTRMenu {
  constructor(controller) {
    this.controller = controller;
    this.hasRecordedEvents = false;
    this.recordedEvents = null;
    this.cachedHeight = 0.0;
    this.cachedWidth = 0.0;
    this.rect = { left: 0, top: 0, right: 0, bottom: 0 };
    this.items = [];
    this.replayMode = false;
    this.canContinue = false;
    this.hasNextLevel = false;
    this.fillPaint = null;
    this.strokePaint = null;
  }

  setRecordedEvents(events) {
    this.recordedEvents = events;
    if (events != null) this.hasRecordedEvents = true;
  }

  setReplayMode(value) { this.replayMode = value; }
  setCanContinue(value) { this.canContinue = value; }
  setHasNextLevel(value) { this.hasNextLevel = value; }

  add(text, action) { this.items.push(new MenuItem(this, text, action)); }

  initialize() {
    this.fillPaint = new Paint(DefaultPaints.j);
    this.fillPaint.setAlpha(150);
    this.fillPaint.setCornerPathEffect(20.0);
    this.strokePaint = new Paint(DefaultPaints.i);
    this.strokePaint.setStrokeWidth(5.0);
    this.strokePaint.setAlpha(220);
    this.strokePaint.setCornerPathEffect(20.0);

    if (this.hasNextLevel && !this.canContinue) {
      this.add('Next Level', () => this.controller.finish(20));
    }
    if (this.canContinue) {
      this.add('Continue', () => this.controller.toggleMenu());
    }
    this.add('Restart Level', () => this.controller.finish(21));
    if (this.hasRecordedEvents && !this.canContinue) {
      this.add('View Replay', () => this.controller.finish(22, [...this.recordedEvents]));
    }
    this.add('Choose Level', () => this.controller.finish(23));
  }

  layout(w, h) {
    let totalHeight = 0.0;
    let maxWidth = 0;
    for (const item of this.items) {
      totalHeight = f(totalHeight + item.bounds.height);
      if (item.bounds.width > maxWidth) maxWidth = item.bounds.width;
    }

    this.rect.left = f(f(w / 2.0) - f(f(maxWidth * 1.5) / 2.0));
    this.rect.top = f(f(h / 2.0) - f(f(totalHeight * 1.2000000476837158) / 2.0));
    this.rect.right = f(f(w / 2.0) + f(f(maxWidth * 1.5) / 2.0));
    this.rect.bottom = f(f(h / 2.0) + f(f(totalHeight * 1.2000000476837158) / 2.0));

    let offset = 0.0;
    for (const item of this.items) {
      const iw = item.bounds.width;
      const ih = item.bounds.height;
      const left = f(f(w / 2.0) - f(iw / 2.0));
      const right = f(f(w / 2.0) + f(iw / 2.0));
      const top = f(f(h / 2.0) - f(f(f(totalHeight / 2.0) - offset)));
      const bottom = f(top + ih);
      item.set(left, top, right, bottom);
      offset = f(offset + ih);
    }
  }

  draw(ctx, w, h) {
    if (this.cachedHeight !== h || this.cachedWidth !== w) {
      this.cachedHeight = h;
      this.cachedWidth = w;
      this.layout(w, h);
    }
    const r = this.rect;
    drawRect(ctx, r.left, r.top, r.right, r.bottom, this.fillPaint);
    drawRect(ctx, r.left, r.top, r.right, r.bottom, this.strokePaint);
    for (const item of this.items) item.draw(ctx);
  }

  onTouch(action, x, y) {
    if (action !== 0 && action !== 2 && action !== 5) return false;
    for (const item of this.items) {
      if (item.contains(x, y)) {
        const controller = this.controller;
        item.activate();
        controller.hideMenu();
        return true;
      }
    }
    return false;
  }

  release() {
    this.controller = null;
    this.items.length = 0;
  }
}
