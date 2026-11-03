// Порт se.codebrew.gdtr.b.k: покадровое воспроизведение и красный HUD-индикатор.

import { DefaultPaints } from '../render/DefaultPaints.js';
import { drawCircle } from '../render/Paint.js';

export class ReplayInputSource {
  constructor(events) {
    this.events = events;
    this.index = 0;
    this.blink = 0;
    this.radius = 15;
  }

  poll(state) {
    if (this.index < this.events.length) {
      const event = this.events[this.index++];
      state.a = event.a;
      state.b = event.b;
      state.c = event.c;
      state.d = event.d;
      this.blink++;
      if (this.blink > 50) this.blink = 0;
    }
  }

  draw(ctx, width) {
    if (this.blink < 25) {
      drawCircle(ctx, width - this.radius - 5, this.radius + 5,
        this.radius, DefaultPaints.l);
    }
  }

  release() { this.events = null; }
}
