// Порт se.codebrew.gdtr.c.e (BodyWrapper) — обёртка тела в движке.
// Содержит тело (a) и два снапшота списка частиц (b[0], b[1]).
// Снапшоты в оригинале создаются в ctor и нигде не читаются (мёртвый код),
// но портированы для полноты.

import { Body } from './Body.js';
import { ParticleList } from './ParticleList.js';

export class BodyWrapper {
  constructor(body) {
    this.snapshots = [null, null]; // b
    if (body === undefined) {
      this.body = new Body(); // a — пустое тело по умолчанию
    } else {
      this.body = body;
      this.snapshots[0] = new ParticleList(this.body.getParticles());
      this.snapshots[1] = new ParticleList(this.body.getParticles());
    }
  }

  // a()V — release (в JS не нужен)
  dispose() {
    this.snapshots = null;
    this.body = null;
  }
}
