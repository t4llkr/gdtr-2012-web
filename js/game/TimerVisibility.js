// Порт se.codebrew.gdtr.w — видимость TimerHud по событиям уровня.

export class TimerVisibility {
  constructor(timerHud) {
    this.finished = false;
    this.timerHud = timerHud;
  }

  onEvent(event) {
    if (event === 2) {
      this.finished = false;
    } else if (event === 4) {
      this.finished = true;
    } else if (event === 1 || event === 5) {
      if (!this.finished) this.timerHud.setVisible(false);
    } else {
      this.timerHud.setVisible(true);
    }
  }

  release() { this.timerHud = null; }
}
