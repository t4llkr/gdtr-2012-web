// Порт se.codebrew.gdtr.m — события и состояние уровня.
// События: 0 — первый update, 1 — падение, 2 — старт таймера,
// 4 — финиш, 5 — контакт головы райдера.

export class GameEngine {
  constructor() {
    this.level = null;
    this.head = null;
    this.body = null;
    this.bike = null;
    this.engine = null;
    this.maxX = Number.NEGATIVE_INFINITY;
    this.listeners = [];
    this.dataListeners = [];
    this.sent = new Array(6).fill(false);
    this.eventQueue = []; // n: очередь не более шести событий
  }

  emit(event, data = 0) {
    // n.a(II): переполнение очереди молча отбрасывает событие.
    if (this.eventQueue.length < 6) this.eventQueue.push([event, data]);
    // Android вызывает dataListeners из отдельного потока. Веб-порт однопоточный:
    // очередь разбирается синхронно, порядок событий сохраняется.
    while (this.eventQueue.length) {
      const [type, value] = this.eventQueue.shift();
      for (const listener of this.dataListeners) listener.onEventData(type, value);
    }
    for (const listener of this.listeners) listener.onEvent(event);
  }

  update() {
    if (this.head.contact) {
      if (!this.sent[1]) {
        this.emit(1, this.level.getProgress(this.head));
        this.sent[1] = true;
      }
      if (!this.sent[5]) {
        this.emit(5, this.level.getProgress(this.head));
        this.sent[5] = true;
      }
    }

    if (!this.sent[1] && this.bike.isBroken()) {
      this.emit(1, this.level.getProgress(this.head));
      this.sent[1] = true;
    }
    if (this.sent[1]) return;

    this.maxX = Math.max(this.maxX, this.body.getMaxX());
    const start = this.level.getStartPoint();
    const goal = this.level.getGoalPoint();

    if (!this.sent[4] && this.maxX > goal.x) {
      this.emit(4, 0);
      this.sent[4] = true;
    }

    if (!this.sent[2]) {
      if (this.engine !== null) {
        if (this.engine.getFrame() >= 90) {
          this.emit(2, 0);
          this.sent[2] = true;
        }
      } else if (this.maxX > start.x) {
        this.emit(2, 0);
        this.sent[2] = true;
      }
    }

    if (!this.sent[0]) {
      this.emit(0, 0);
      this.sent[0] = true;
    }
  }

  setLevel(level) { this.level = level; }
  setHead(head) { this.head = head; }
  setBody(body) { this.body = body; }
  setBike(bike) { this.bike = bike; }
  setPhysicsEngine(engine) { this.engine = engine; }
  addListener(listener) { this.listeners.push(listener); }
  addDataListener(listener) { this.dataListeners.push(listener); }

  release() {
    this.eventQueue.length = 0;
    this.level = null;
    this.head = null;
    this.body = null;
    this.bike = null;
    this.engine = null;
    for (const listener of this.listeners) listener.release?.();
    this.listeners.length = 0;
    this.dataListeners.length = 0;
  }
}
