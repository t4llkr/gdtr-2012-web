// Порт se.codebrew.gdtr.b.a (InputDispatcher).
// Раз на кадр: a() — сбросить сводное состояние, опросить источники (b/b),
// OR-слить флаги, затем разослать слушателям:
//   газ/тормоз (b/s): a->s.a(), elif b->s.b(), else s.c()
//   наклон (b/f):     d->f.c(), elif c->f.b(), else f.d()

import { InputState } from './InputState.js';

export class InputDispatcher {
  constructor(source) {
    this.state = new InputState();  // a — сводное состояние
    this.sources = [];              // b — источники (b/b)
    this.throttleListeners = [];    // c — слушатели газа/тормоза (b/s)
    this.leanListeners = [];        // d — слушатели наклона (b/f)
    this.temp = new InputState();   // e — буфер опроса источника
    if (source) this.sources.push(source);
  }

  // dispatch (private d()V)
  dispatch() {
    for (const s of this.throttleListeners) {
      if (this.state.a) s.a();
      else if (this.state.b) s.b();
      else s.c();
    }
    for (const f of this.leanListeners) {
      if (this.state.d) f.c();
      else if (this.state.c) f.b();
      else f.d();
    }
  }

  // a()V — кадровый опрос
  poll() {
    this.state.a = false;
    this.state.b = false;
    this.state.c = false;
    this.state.d = false;
    for (const source of this.sources) {
      source.poll(this.temp);
      if (this.temp.a) { this.state.a = true; this.temp.a = false; }
      if (this.temp.b) { this.state.b = true; this.temp.b = false; }
      if (this.temp.c) { this.state.c = true; this.temp.c = false; }
      if (this.temp.d) { this.state.d = true; this.temp.d = false; }
    }
    this.dispatch();
  }

  // a(Lb/b;)V / a(Lb/f;)V / a(Lb/s;)V
  addSource(s) { this.sources.push(s); }
  addLeanListener(f) { this.leanListeners.push(f); }
  addThrottleListener(s) { this.throttleListeners.push(s); }

  // b()Ljava/util/List; — в базовом классе null (переопределяется для реплеев)
  getRecordedEvents() { return null; }

  // c()V — сброс + разослать нейтраль
  reset() {
    this.state.a = false;
    this.state.b = false;
    this.state.c = false;
    this.state.d = false;
    this.dispatch();
  }
}
