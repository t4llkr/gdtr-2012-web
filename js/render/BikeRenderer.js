// Порт se.codebrew.gdtr.graphics.f (BikeRenderer) — райдер на байке.
// Реализует интерфейсы: d (мировой рендерер), b/f (слушатель наклона),
// o (слушатель событий — event 5 замораживает позу).

import { Vec2 } from '../core/Vec2.js';
import { Paint, drawPath, drawCircle } from './Paint.js';
import { SchemeManager } from './SchemeManager.js';
import { buildRiderPath } from './Rider.js';

export class BikeRenderer {
  constructor(bike, rider) {
    this.step = Math.fround(0.1);   // c:F
    this.lean = Math.fround(0.0);   // d:F — поза наклона (в оригинале init 0.0!)
    this.bike = bike;               // e
    this.rider = rider;             // f
    this.frozen = false;            // j — event 5 (смерть) замораживает e()

    this.k = new Vec2();            // up
    this.l = new Vec2();            // perp
    this.a = new Vec2();
    this.seat = new Vec2();         // b в smali; переименовано: поле b затеняло бы метод b()

    this.m = new Array(6);          // m:[[D — мёртвый код, сохранён

    // i — основная краска тела (копия scheme bike)
    this.i = new Paint(SchemeManager.e);
    this.i.setStyle('STROKE');
    this.i.setStrokeWidth(2.5);
    this.i.setAntiAlias(true);
    this.i.setCornerPathEffect(1.0);
    this.i.setStrokeCap('ROUND');

    this.path = null;               // g — Path (пересобирается в draw)

    // начальная поза (оригинал вызывает e() в конструкторе)
    this.update();

    // h — краска головы (копия i, sw 2.0)
    this.h = new Paint(this.i);
    this.h.setStrokeWidth(2.0);

    // n[5] — мёртвые краски, сохранены для фиделити
    this.n = [];
    for (let idx = 0; idx < 5; idx++) this.n.push(new Paint(this.i));
    this.n[0].setARGB(255, 4, 55, 108);
    this.n[1].setARGB(255, 4, 55, 108);
    this.n[2].setARGB(255, 90, 13, 172);
    this.n[2].setStrokeWidth(4.0);
    this.n[3].setARGB(255, 255, 197, 0);
    this.n[3].setStrokeWidth(2.0);
    this.n[4].setARGB(255, 255, 197, 0);
    this.n[4].setStrokeWidth(2.0);
  }

  // e() — пересчёт позы райдера
  update() {
    Vec2.subTo(this.k, this.bike.head.pos, this.bike.frame.pos);
    this.k.normalize();
    Vec2.perp(this.l, this.k);
    this.seat.x = this.bike.frame.pos.x;
    this.seat.y = this.bike.frame.pos.y;
    Vec2.scaleTo(this.a, this.l, 3.0);
    this.seat.addInPlace(this.a);
    this.rider.setPose(this.l, this.k, this.seat, this.lean);
  }

  // a(Canvas)
  draw(ctx) {
    if (!this.frozen) this.update();
    this.path = buildRiderPath(this.rider);
    drawPath(ctx, this.path, this.i);
    const head = this.rider.getHead();
    drawCircle(ctx, head.pos.x, head.pos.y, head.radius, this.h);
  }

  // b/f: b() — наклон влево (float-арифметика, как в оригинале)
  b() {
    if (this.lean > 0.5) {
      this.lean = Math.fround(Math.max(Math.fround(this.lean - Math.fround(this.step / 2.0)), 0.0));
    } else {
      this.lean = Math.fround(Math.max(Math.fround(this.lean - this.step), 0.0));
    }
  }

  // b/f: c() — наклон вправо
  c() {
    if (this.lean < 0.5) {
      this.lean = Math.fround(Math.min(Math.fround(this.lean + Math.fround(this.step / 2.0)), 1.0));
    } else {
      this.lean = Math.fround(Math.min(Math.fround(this.lean + this.step), 1.0));
    }
  }

  // b/f: d() — центровка
  d() {
    if (this.lean < 0.4) {
      this.lean = Math.fround(this.lean + this.step);
    } else if (this.lean > 0.6) {
      this.lean = Math.fround(this.lean - this.step);
    } else {
      this.lean = Math.fround(0.5);
    }
  }

  // o: a(I) — событие 5 = смерть → заморозить позу
  onEvent(event) {
    if (event === 5) this.frozen = true;
  }

  // a() — release
  release() {
    this.bike = null;
    this.rider = null;
  }
}
