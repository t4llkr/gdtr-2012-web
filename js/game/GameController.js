// Порт se.codebrew.gdtr.r — игровой таймер и слушатель событий m.
// b/c — старт/финиш, d — текущий кадр, e — флаг падения.
// Время измеряется шагами PhysicsEngine, а не миллисекундами.

import { HSStore } from '../storage/HSStore.js';

export class GameController {
  constructor(engine, levelName, scoreStore = HSStore.getInstance()) {
    this.engine = engine;
    this.levelName = levelName;
    this.scoreStore = scoreStore;
    this.start = -1;
    this.finish = -1;
    this.current = 0;
    this.stopped = false;
  }

  release() { this.engine = null; }

  onEvent(event) {
    if (event === 2) {
      this.stopped = false;
      this.start = this.engine.getFrame();
    } else if (event === 4) {
      if (this.finish === -1) this.finish = this.engine.getFrame();
      // r.a(4): рекорд сохраняется сразу при успешном финише.
      this.scoreStore?.recordResult(this.levelName, this.b(), 'one');
    } else if (event === 1) {
      this.stopped = true;
    }
  }

  b() {
    if (this.start === -1) return 0;
    if (!this.stopped) this.current = this.engine.getFrame();
    if (this.finish === -1) return this.current - this.start;
    return this.finish - this.start;
  }
}
