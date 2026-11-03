// Порт se.codebrew.gdtr.b.m/n и pinch-части b/h/i.

import { Camera } from '../render/Camera.js';

const f = Math.fround;

export class PinchZoom {
  constructor(limitInitialSpan = false) {
    this.zoom = 2.0;
    this.limitInitialSpan = limitInitialSpan;
    this.pointers = new Map();
    this.previousSpan = 0;
    this.scaling = false;
    this.rejected = false;
  }

  updatePointers(event) {
    if (!event) return;
    if (event.action === 0 || event.action === 5) {
      this.pointers.set(event.pointerId, { x: event.x, y: event.y });
    } else if (event.action === 2) {
      if (this.pointers.has(event.pointerId)) {
        this.pointers.set(event.pointerId, { x: event.x, y: event.y });
      }
    } else if (event.action === 1 || event.action === 6) {
      this.pointers.delete(event.pointerId);
    } else if (event.action === 3) {
      this.pointers.clear();
    }
  }

  update(view, pointers = this.pointers) {
    if (pointers.size < 2) {
      this.previousSpan = 0;
      this.scaling = false;
      this.rejected = false;
      return;
    }
    if (pointers.size !== 2) return;
    const [first, second] = [...pointers.values()];
    const span = Math.hypot(first.x - second.x, first.y - second.y);
    if (!this.scaling) {
      if (this.rejected) return;
      if (this.limitInitialSpan && span > Math.trunc(view.clientWidth / 2)) {
        this.rejected = true;
        return;
      }
      this.scaling = true;
      this.previousSpan = span;
      return;
    }
    if (this.previousSpan > 0) {
      this.zoom = f(this.zoom * f(span / this.previousSpan));
      this.zoom = Math.max(f(0.10000000149011612), Math.min(this.zoom, 5.0));
      Camera.zoom = this.zoom;
    }
    this.previousSpan = span;
  }

  onTouch(view, event) {
    if (event) {
      this.updatePointers(event);
      this.update(view);
    }
    return true;
  }

  resume() {}
  release() { this.pointers.clear(); }
}
