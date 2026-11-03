// Порт se.codebrew.gdtr.b.l: обычный dispatch, затем снимок четырёх флагов.

import { InputDispatcher } from './InputDispatcher.js';
import { InputState } from './InputState.js';

export class RecordingInputDispatcher extends InputDispatcher {
  constructor(source) {
    super(source);
    this.recordedEvents = [];
  }

  poll() {
    super.poll();
    const event = new InputState();
    event.a = this.state.a;
    event.b = this.state.b;
    event.c = this.state.c;
    event.d = this.state.d;
    this.recordedEvents.push(event);
  }

  getRecordedEvents() { return this.recordedEvents; }
}
