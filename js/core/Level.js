// Порт se.codebrew.gdtr.i (Level).
// Внутренняя система координат: Y инвертирован относительно JSON
// (при загрузке y берётся со знаком минус — см. LevelManager и i.b(DD)V).

import { Vec2 } from './Vec2.js';

export class Level {
  constructor(name) {
    this.startX = 0.0;      // a:D
    this.startY = 0.0;      // b:D
    this.goalX = 0.0;       // c:D (у финиша используется только X)
    this.points = [];       // d: List<Vec2>
    this.name = name;       // e
    this.startPoint = null; // f: вычисляется лениво (h())
    this.goalPoint = null;  // g: вычисляется лениво (h())
    this.scheme = null;     // h
    this.starTimes = [0, 0, 0, 0]; // i: int[4], индексы 1..3 = 1-star..3-star
  }

  // i.a(DD)V — установить старт
  setStart(x, y) { this.startX = x; this.startY = y; }

  // i.a(D)V — установить финиш (только X)
  setGoalX(x) { this.goalX = x; }

  // i.b(DD)V — добавить точку трека, Y инвертируется
  addPoint(x, y) { this.points.push(new Vec2(x, -y)); }

  // i.h()V — найти точки старта и финиша на треке:
  // startPoint = точка, следующая за первой с x > startX;
  // goalPoint = первая точка с x > goalX.
  computeFlags() {
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      if (this.startPoint === null && p.x > this.startX) {
        this.startPoint = Vec2.copy(this.points[i + 1]);
      }
      if (this.goalPoint === null && p.x > this.goalX) {
        this.goalPoint = Vec2.copy(p);
      }
    }
  }

  // i.e()g
  getStartPoint() {
    if (this.startPoint === null) this.computeFlags();
    return this.startPoint;
  }

  // i.f()g
  getGoalPoint() {
    if (this.goalPoint === null) this.computeFlags();
    return this.goalPoint;
  }

  // i.a(La/c;)I — прогресс 0..100 по X байка между startPoint.x и goalPoint.x
  getProgress(bike) {
    const v = ((bike.pos.x - this.getStartPoint().x) * 100.0) /
              (this.getGoalPoint().x - this.getStartPoint().x);
    return Math.round(Math.min(Math.max(v, 0.0), 100.0));
  }
}
