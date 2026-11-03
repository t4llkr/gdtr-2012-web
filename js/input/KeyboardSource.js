// Порт se.codebrew.gdtr.b.e (keyboard input source, implements b/b).
//
// Оригинальная раскладка (Android keycodes):
//   газ (a):    DPAD_UP(0x13),    1(0x8), Q(0x2d)
//   тормоз (b): DPAD_DOWN(0x14),  4(0xb), A(0x1d)
//   наклон (c): DPAD_LEFT(0x15),  5(0xc), O(0x2b)
//   наклон (d): DPAD_RIGHT(0x16), 6(0xd), P(0x2c)
// Веб-эквивалент: стрелки (точный аналог DPAD) + те же буквы Q/A/O/P.
//
// Кварк оригинала сохранён: пока счётчик шагов движка < 90,
// опрос возвращает принудительный ТОРМОЗ (a=0,b=1,c=0,d=0).

const KEYMAP = {
  ArrowUp: 'a', KeyQ: 'a', Digit1: 'a',
  ArrowDown: 'b', KeyA: 'b', Digit4: 'b',
  ArrowLeft: 'c', KeyO: 'c', Digit5: 'c',
  ArrowRight: 'd', KeyP: 'd', Digit6: 'd',
};

export class KeyboardSource {
  constructor(target = window) {
    this.a = false;
    this.b = false;
    this.c = false;
    this.d = false;
    this.engine = null; // f — ссылка на PhysicsEngine (setEngine)
    this.target = target;
    this.onKeyDown = (e) => {
      const k = KEYMAP[e.code];
      if (k) { this[k] = true; e.preventDefault(); }
    };
    this.onKeyUp = (e) => {
      const k = KEYMAP[e.code];
      if (k) { this[k] = false; e.preventDefault(); }
    };
    this.onBlur = () => {
      this.a = this.b = this.c = this.d = false;
    };
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('blur', this.onBlur);
  }

  // a(Lc/f;)V
  setEngine(engine) { this.engine = engine; }

  // a(Lb/c;)V — опрос (вызывается диспетчером каждый кадр)
  poll(state) {
    if (this.engine.getFrame() < 90) {
      state.a = false;
      state.b = true;
      state.c = false;
      state.d = false;
      return;
    }
    if (this.a) state.a = true;
    if (this.b) state.b = true;
    if (this.c) state.c = true;
    if (this.d) state.d = true;
  }

  release() {
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('blur', this.onBlur);
    this.engine = null;
  }
}
