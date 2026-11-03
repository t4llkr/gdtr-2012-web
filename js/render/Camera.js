// Порт se.codebrew.gdtr.graphics.b (камера) + статический масштаб.
// Глобальный zoom: a:D = 2.0; эффективный масштаб = g.b (1.5) * a.

export const GLOBAL_SCALE = 1.5; // se.codebrew.gdtr.g.b (const 1.5f)

export class Camera {
  // graphics/b.a:D — текущий зум (статический в оригинале, общий на всех)
  static zoom = 2.0;

  // graphics/b.a()D
  static getScale() { return GLOBAL_SCALE * Camera.zoom; }

  // graphics/b.c()V — отдалить (клавиша громкости вниз в оригинале)
  static zoomOut() {
    Camera.zoom *= 0.949999988079071;
    if (Camera.zoom < 0.10000000149011612) Camera.zoom = 0.10000000149011612;
  }

  // graphics/b.d()V — приблизить
  static zoomIn() {
    Camera.zoom *= 1.0499999523162842;
    if (Camera.zoom > 5.0) Camera.zoom = 5.0;
  }

  constructor(particle) {
    this.particle = particle; // b
    this.c = 10.0;            // c:D — в оригинале нигде не читается
  }

  // b.b()g — точка, за которой следит камера
  getTarget() { return this.particle.pos; }

  // b.e()V
  release() { this.particle = null; }
}
