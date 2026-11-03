// Порт se.codebrew.gdtr.graphics.a (ChassisRenderer) — рама и колёса байка.
//
// Особенность оригинала сохранена: статический шаблон h мутируется
// в конструкторе (умножается на wheelbase / (h[0][1] - h[1][1])).
// В APK шаблон раздувается при каждом новом байке — здесь то же самое.

import { Vec2 } from '../core/Vec2.js';
import { Paint, drawLine, drawCircle } from './Paint.js';

// a.h — статический шаблон точек рамы (7 x 2)
const TEMPLATE = [
  [0.0, -110.0], [0.0, 110.0], [-115.0, -75.0], [-85.0, -80.0],
  [-35.0, 30.0], [-80.0, 85.0], [-105.0, 140.0],
];

export class ChassisRenderer {
  constructor(bike) {
    this.bike = bike; // i

    // scratch-вектора j..t
    this.j = new Vec2();
    this.k = new Vec2();
    this.l = new Vec2();
    this.m = new Vec2();
    this.n = new Vec2();
    this.o = new Vec2();
    this.p = new Vec2();
    this.q = new Vec2();
    this.r = new Vec2();
    this.s = new Vec2();
    this.t = new Vec2();

    // масштаб шаблона = колёсная база / (h[0][1] - h[1][1]), мутация static h
    const scale =
      Vec2.sub(bike.frontWheel.pos, bike.rearWheel.pos).length() /
      (TEMPLATE[0][1] - TEMPLATE[1][1]);
    for (const pt of TEMPLATE) {
      pt[0] *= scale;
      pt[1] *= scale;
    }

    // c — основная краска рамы
    this.c = new Paint();
    this.c.setARGB(255, 69, 149, 150);
    this.c.setStyle('STROKE');
    this.c.setStrokeWidth(2.0);
    this.c.setAntiAlias(true);

    // d — копия c, FILL (в оригинале не используется — сохранена)
    this.d = new Paint(this.c);
    this.d.setStyle('FILL');

    // f — тонкая деталь рамы
    this.f = new Paint();
    this.f.setARGB(255, 53, 133, 134);
    this.f.setStyle('STROKE');
    this.f.setStrokeWidth(1.0);
    this.f.setAntiAlias(true);

    // g — копия f, sw 1.0
    this.g = new Paint(this.f);
    this.g.setStrokeWidth(1.0);

    // e — обод колеса
    this.e = new Paint();
    this.e.setARGB(255, 224, 224, 224);
    this.e.setStyle('STROKE');
    this.e.setStrokeWidth(3.0);
    this.e.setAntiAlias(true);

    // b — покрышка
    this.b = new Paint();
    this.b.setARGB(255, 0, 0, 0);
    this.b.setStrokeWidth(0.8);
    this.b.setAntiAlias(true);
    this.b.setStyle('STROKE');

    // a — спица (копия c, sw 1.5)
    this.a = new Paint(this.c);
    this.a.setStrokeWidth(1.5);
    this.a.setAntiAlias(true);
    this.a.setStyle('STROKE');
  }

  // a(Canvas, a/c) — колесо: спица, обод, покрышка
  drawWheel(ctx, wheel) {
    const x = wheel.pos.x;
    const y = wheel.pos.y;
    const r = wheel.radius;
    drawLine(
      ctx,
      x, y,
      x + Math.sin(wheel.angle) * r * 0.75,
      y + Math.cos(wheel.angle) * r * 0.75,
      this.a
    );
    drawCircle(ctx, x, y, r * 0.85, this.e);
    drawCircle(ctx, x, y, r, this.b);
  }

  // a(p0, p1, p2, p3, p4, i): p1 = p3 * h[i][1]; p2 = p4 * h[i][0]; p1 += p2; p0 += p1
  static framePoint(p0, p1, p2, p3, p4, i) {
    Vec2.scaleTo(p1, p3, TEMPLATE[i][1]);
    Vec2.scaleTo(p2, p4, TEMPLATE[i][0]);
    p1.addInPlace(p2);
    p0.addInPlace(p1);
  }

  // a(Canvas) — полная отрисовка шасси
  draw(ctx) {
    const bike = this.bike;

    this.drawWheel(ctx, bike.frontWheel); // d()
    this.drawWheel(ctx, bike.rearWheel);  // c()

    // j = normalize(head.pos - frame.pos); k = perp(j)
    Vec2.subTo(this.j, bike.head.pos, bike.frame.pos);
    this.j.normalize();
    Vec2.perp(this.k, this.j);

    const fx = bike.frame.pos.x;
    const fy = bike.frame.pos.y;

    // n = frontBroken ? frame.pos : frontWheel.pos
    const nsrc = bike.frontBroken ? bike.frame.pos : bike.frontWheel.pos;
    this.n.x = nsrc.x; this.n.y = nsrc.y;
    // o = rearBroken ? bodyA.pos : rearWheel.pos
    const osrc = bike.rearBroken ? bike.bodyA.pos : bike.rearWheel.pos;
    this.o.x = osrc.x; this.o.y = osrc.y;

    this.p.x = fx; this.p.y = fy;
    ChassisRenderer.framePoint(this.p, this.l, this.m, this.k, this.j, 2);
    this.q.x = fx; this.q.y = fy;
    ChassisRenderer.framePoint(this.q, this.l, this.m, this.k, this.j, 3);
    this.r.x = fx; this.r.y = fy;
    ChassisRenderer.framePoint(this.r, this.l, this.m, this.k, this.j, 4);
    this.s.x = fx; this.s.y = fy;
    ChassisRenderer.framePoint(this.s, this.l, this.m, this.k, this.j, 5);
    this.t.x = fx; this.t.y = fy;
    ChassisRenderer.framePoint(this.t, this.l, this.m, this.k, this.j, 6);

    const c = this.c, f = this.f, g = this.g;
    drawLine(ctx, this.n.x, this.n.y, this.p.x, this.p.y, c);
    drawLine(ctx, this.n.x, this.n.y, this.p.x, this.p.y, f);
    drawLine(ctx, this.o.x, this.o.y, this.p.x, this.p.y, c);
    drawLine(ctx, this.o.x, this.o.y, this.p.x, this.p.y, f);
    drawLine(ctx, this.o.x, this.o.y, this.q.x, this.q.y, c);
    drawLine(ctx, this.o.x, this.o.y, this.q.x, this.q.y, f);
    drawLine(ctx, this.r.x, this.r.y, this.s.x, this.s.y, g);
    drawLine(ctx, this.s.x, this.s.y, this.t.x, this.t.y, g);
    drawCircle(ctx, this.p.x, this.p.y, 0.7, c);
  }

  // b() — сброс альфы + тени (вызывается один раз после создания в Play)
  initShadows() {
    this.c.setAlpha(255);
    this.g.setAlpha(255);
    this.f.setAlpha(255);
    this.e.setAlpha(255);
    this.b.setAlpha(255);
    this.a.setAlpha(255);
    this.c.setShadowLayer(0.5, 0.1, 0.1, 0xff000000);
    this.g.setShadowLayer(0.5, 0.1, 0.1, 0xff000000);
    this.a.setShadowLayer(0.5, 0.1, 0.1, 0xff000000);
  }

  // a() — release
  release() {
    this.bike = null;
  }
}
