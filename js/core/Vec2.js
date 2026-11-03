// Порт se.codebrew.gdtr.a.g (Vec2, double x/y).
// Пул объектов из a/h + a/e намеренно не перенесён: поведенчески он прозрачен,
// в JS аллокация дешевле. Все вычисления — double, как в оригинале.

export class Vec2 {
  constructor(x = 0.0, y = 0.0) {
    this.x = x; // ориг. поле a
    this.y = y; // ориг. поле b
  }

  static copy(v) { return new Vec2(v.x, v.y); }

  // static a(p, q): новый вектор p - q
  static sub(p, q) { return new Vec2(p.x - q.x, p.y - q.y); }

  // static a(out, v, d): out = v * d
  static scaleTo(out, v, d) { out.x = v.x * d; out.y = v.y * d; return out; }

  // static a(out, a, b): out = a - b
  static subTo(out, a, b) { out.x = a.x - b.x; out.y = a.y - b.y; }

  // static b(p, q): скалярное произведение
  static dot(p, q) { return p.x * q.x + p.y * q.y; }

  // static c(out, v): поворот на -PI/2 (через cos/sin, как в оригинале): (y, -x)
  static perp(out, v) {
    const c = Math.cos(-1.5707963267948966);
    const s = Math.sin(-1.5707963267948966);
    out.x = v.x * c - v.y * s;
    out.y = v.x * s + v.y * c;
    return out;
  }

  // static d(p, q): расстояние
  static distance(p, q) {
    const dx = p.x - q.x, dy = p.y - q.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // a()V: обнулить
  reset() { this.x = 0.0; this.y = 0.0; }

  // a(D)V: умножить на скаляр
  scale(d) { this.x *= d; this.y *= d; }

  // a(g)V: вычесть
  subInPlace(v) { this.x -= v.x; this.y -= v.y; }

  // b()D: длина
  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }

  // b(D)V: делить на скаляр
  div(d) { this.x /= d; this.y /= d; }

  // b(g)V: прибавить
  addInPlace(v) { this.x += v.x; this.y += v.y; }

  // c()g: нормализовать (in-place, возвращает this)
  normalize() {
    const len = this.length();
    this.x = this.x / len;
    this.y = this.y / len;
    return this;
  }

  toString() { return "(" + this.x + ", " + this.y + ")"; }
}
