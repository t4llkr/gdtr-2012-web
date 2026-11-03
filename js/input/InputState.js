// Порт se.codebrew.gdtr.b.c (InputState) — четыре флага ввода:
// a = газ, b = тормоз, c = наклон (lean->f.b()), d = наклон (lean->f.c()).

export class InputState {
  constructor() {
    this.a = false;
    this.b = false;
    this.c = false;
    this.d = false;
  }
}
