// Порт se.codebrew.gdtr.a.d (ParticleList) — список частиц тела.

import { Particle } from './Particle.js';

export class ParticleList {
  constructor(src = null) {
    this.list = [];
    if (src) { // копирующий ctor: глубокие копии частиц
      for (const p of src.list) this.list.push(Particle.copy(p));
    }
  }

  // a()Ljava/util/List;
  getAll() { return this.list; }

  // b()V
  clear() { this.list.length = 0; }
}
